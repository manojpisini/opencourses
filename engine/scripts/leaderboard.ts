#!/usr/bin/env bun
/**
 * leaderboard.ts — Rebuild LEADERBOARD.md from enrollment issues.
 *
 * Ranking criteria (in order):
 *   1. Average test score (% across all graded chapter tests)
 *   2. Courses completed (more = higher)
 *   3. Total earned points
 *   4. Fastest course completion time (lower = higher)
 *
 * No XP, no levels, no stages — just scores and completions.
 *
 * Triggered by: .github/workflows/course-leaderboard.yml
 * Env vars: GITHUB_TOKEN, REPO
 */

import * as fs   from 'fs';
import { makeOctokit, repoFromEnv } from '../lib/github.ts';
import type { LeaderboardEntry } from '../types/course.ts';

const octokit     = makeOctokit();
const { owner, repo } = repoFromEnv();

// ─── Fetch all enrollment issues ─────────────────────────────────────────────

async function fetchEnrollments(): Promise<Array<{
  login:           string;
  courseSlug:      string;
  issueNumber:     number;
  labels:          string[];
  createdAt:       string;
  comments:        Array<{ body: string; created_at: string }>;
}>> {
  const results = [];
  let page = 1;

  while (true) {
    const { data: issues } = await octokit.issues.listForRepo({
      owner, repo, state: 'all', labels: 'enrolled', per_page: 100, page,
    });
    if (issues.length === 0) break;

    for (const issue of issues) {
      const labels    = issue.labels.map((l) => (typeof l === 'string' ? l : l.name ?? ''));
      const courseTag = labels.find((l) => l.startsWith('course:'));
      if (!courseTag) continue;

      // Fetch comments for score data
      const { data: comments } = await octokit.issues.listComments({
        owner, repo, issue_number: issue.number, per_page: 100,
      });

      results.push({
        login:       issue.user?.login ?? 'unknown',
        courseSlug:  courseTag.replace('course:', ''),
        issueNumber: issue.number,
        labels,
        createdAt:   issue.created_at,
        comments:    comments.map((c) => ({ body: c.body ?? '', created_at: c.created_at })),
      });
    }

    if (issues.length < 100) break;
    page++;
  }
  return results;
}

// ─── Parse scores from comments ──────────────────────────────────────────────

/**
 * Extract score percentages from grading result comments.
 * Pattern: "Score: 42/50 (84.0%)"
 */
function extractScores(comments: Array<{ body: string; created_at: string }>): {
  scores: number[];
  earnedPoints: number;
  maxPoints: number;
  latestPassedAt?: string;
} {
  let earnedPoints = 0;
  let maxPoints    = 0;
  const scores: number[] = [];
  let latestPassedAt: string | undefined;

  for (const c of comments) {
    const scoreMatch = c.body.match(/\*\*Score:\*\*\s+(\d+)\/(\d+)\s+\((\d+(?:\.\d+)?)%\)/);
    if (!scoreMatch) continue;
    const earned  = parseInt(scoreMatch[1]!);
    const max     = parseInt(scoreMatch[2]!);
    const pct     = parseFloat(scoreMatch[3]!);
    if (isNaN(pct)) continue;

    scores.push(pct);
    earnedPoints += earned;
    maxPoints    += max;

    if (c.body.includes('✅ PASSED')) {
      latestPassedAt = c.created_at;
    }
  }

  return { scores, earnedPoints, maxPoints, latestPassedAt };
}

// ─── Build leaderboard ────────────────────────────────────────────────────────

function buildEntries(enrollments: Awaited<ReturnType<typeof fetchEnrollments>>): LeaderboardEntry[] {
  // Group by login
  const byLogin = new Map<string, typeof enrollments>();
  for (const e of enrollments) {
    const arr = byLogin.get(e.login) ?? [];
    arr.push(e);
    byLogin.set(e.login, arr);
  }

  const entries: LeaderboardEntry[] = [];

  for (const [login, courses] of byLogin.entries()) {
    let totalScores: number[] = [];
    let totalEarned = 0;
    let totalMax    = 0;
    let coursesCompleted = 0;
    let certified   = false;
    let fastestMs: number | undefined;
    const courseSlugs: string[] = [];

    for (const enrollment of courses) {
      courseSlugs.push(enrollment.courseSlug);
      const isComplete = enrollment.labels.includes('course-complete') || enrollment.labels.includes('certified');
      if (isComplete) {
        coursesCompleted++;
        // Compute time to completion
        const enrolledAt = new Date(enrollment.createdAt).getTime();
        const { latestPassedAt } = extractScores(enrollment.comments);
        if (latestPassedAt) {
          const duration = new Date(latestPassedAt).getTime() - enrolledAt;
          if (fastestMs === undefined || duration < fastestMs) fastestMs = duration;
        }
      }
      if (enrollment.labels.includes('certified')) certified = true;

      const { scores, earnedPoints, maxPoints } = extractScores(enrollment.comments);
      totalScores = totalScores.concat(scores);
      totalEarned += earnedPoints;
      totalMax    += maxPoints;
    }

    const avgScore = totalScores.length > 0
      ? totalScores.reduce((s, v) => s + v, 0) / totalScores.length
      : 0;

    entries.push({
      rank:            0,  // filled below
      login,
      coursesCompleted,
      avgScore,
      totalPoints:     totalEarned,
      maxPoints:       totalMax,
      fastestCourse:   fastestMs !== undefined ? Math.round(fastestMs / 3_600_000) : undefined,
      certified,
      enrolledCourses: [...new Set(courseSlugs)],
    });
  }

  // Sort: avgScore desc → coursesCompleted desc → totalPoints desc → fastestCourse asc
  entries.sort((a, b) => {
    if (b.avgScore !== a.avgScore)           return b.avgScore - a.avgScore;
    if (b.coursesCompleted !== a.coursesCompleted) return b.coursesCompleted - a.coursesCompleted;
    if (b.totalPoints !== a.totalPoints)     return b.totalPoints - a.totalPoints;
    const fa = a.fastestCourse ?? Infinity;
    const fb = b.fastestCourse ?? Infinity;
    return fa - fb;
  });

  entries.forEach((e, i) => (e.rank = i + 1));
  return entries;
}

// ─── Render markdown ──────────────────────────────────────────────────────────

function medal(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `${rank}.`;
}

function scoreBar(pct: number, width = 10): string {
  const filled = Math.round((pct / 100) * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

function renderMarkdown(entries: LeaderboardEntry[]): string {
  const now   = new Date().toISOString().split('T')[0];
  const total = entries.length;
  const certified = entries.filter((e) => e.certified).length;

  const rows = entries.slice(0, 100).map((e) => {
    const rank    = medal(e.rank);
    const courses = e.enrolledCourses.join(', ') || '—';
    const fastest = e.fastestCourse !== undefined ? `${e.fastestCourse}h` : '—';
    const cert    = e.certified ? ' 🎓' : '';
    const bar     = scoreBar(e.avgScore);
    return `| ${rank} | [@${e.login}](https://github.com/${e.login})${cert} | ${e.avgScore.toFixed(1)}% | \`${bar}\` | ${e.coursesCompleted} | ${e.totalPoints}/${e.maxPoints} | ${fastest} | ${courses} |`;
  }).join('\n');

  return `# 🏆 Leaderboard

> Updated: ${now} · Showing top ${Math.min(100, total)} of ${total} students

## Rankings

Sorted by: **Average Score** → **Courses Completed** → **Total Points** → **Fastest Completion**

| Rank | Student | Avg Score | Progress | Done | Points | Fastest | Courses |
|------|---------|-----------|----------|------|--------|---------|---------|
${rows}

## Stats

| Metric | Value |
|--------|-------|
| Total enrolled | ${total} |
| Certified | ${certified} |
| Courses completed | ${entries.reduce((s, e) => s + e.coursesCompleted, 0)} |
| Avg score (all) | ${total > 0 ? (entries.reduce((s, e) => s + e.avgScore, 0) / total).toFixed(1) : 0}% |

---
_Rankings update automatically on every quiz/project submission. 🎓 = certificate earned._
`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Fetching enrollment issues…');
  const enrollments = await fetchEnrollments();
  console.log(`Found ${enrollments.length} enrollment records`);

  const entries = buildEntries(enrollments);
  const md      = renderMarkdown(entries);
  fs.writeFileSync('LEADERBOARD.md', md);
  console.log(`✓ LEADERBOARD.md written (${entries.length} students)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
