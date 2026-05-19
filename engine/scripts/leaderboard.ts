#!/usr/bin/env bun
/**
 * leaderboard.ts — Build LEADERBOARD.md from enrollment issues
 *
 * Triggered by: .github/workflows/leaderboard.yml
 * Env vars: GITHUB_TOKEN, REPO
 */

import { Octokit } from '@octokit/rest';
import * as fs from 'fs';

const octokit = new Octokit({ auth: process.env['GITHUB_TOKEN'] });
const [owner, repo] = (process.env['REPO'] ?? '').split('/');
const mode = process.argv.includes('--mode') ? process.argv[process.argv.indexOf('--mode') + 1] : 'full-rebuild';

const XP_PER_STAGE: Record<string, number> = {
  'stage-01-passed': 100,
  'stage-02-passed': 150,
  'stage-03-passed': 200,
  'stage-04-passed': 250,
  'stage-05-passed': 400,
};

const LEVELS = [
  { name: 'Newcomer',     min: 0,    emoji: '🌱' },
  { name: 'Apprentice',   min: 100,  emoji: '🔧' },
  { name: 'Practitioner', min: 300,  emoji: '⚡' },
  { name: 'Journeyman',   min: 600,  emoji: '🚀' },
  { name: 'Expert',       min: 900,  emoji: '🔥' },
  { name: 'Master',       min: 1100, emoji: '👑' },
];

interface StudentRecord {
  login: string;
  xp: number;
  stagesPassed: number;
  certified: boolean;
  course: string;
  streak: number;
  level: { name: string; emoji: string };
}

function getLevel(xp: number): { name: string; emoji: string } {
  let level = LEVELS[0]!;
  for (const l of LEVELS) {
    if (xp >= l.min) level = l;
  }
  return level;
}

async function fetchAllEnrollments(): Promise<StudentRecord[]> {
  const records: StudentRecord[] = [];
  let page = 1;

  while (true) {
    const { data: issues } = await octokit.issues.listForRepo({
      owner, repo, state: 'all',
      labels: 'enrolled',
      per_page: 100,
      page,
    });

    if (issues.length === 0) break;

    for (const issue of issues) {
      const labels = issue.labels.map((l) => (typeof l === 'string' ? l : l.name ?? ''));
      const login = issue.user?.login ?? 'unknown';

      let xp = 0;
      let stagesPassed = 0;
      for (const [label, xpVal] of Object.entries(XP_PER_STAGE)) {
        if (labels.includes(label)) {
          xp += xpVal;
          stagesPassed++;
        }
      }

      const certified = labels.includes('certified');
      if (certified) xp += 200; // certification bonus

      const courseLabel = labels.find((l) => l.startsWith('course:'));
      const course = courseLabel ? courseLabel.replace('course:', '') : 'unknown';

      records.push({
        login,
        xp,
        stagesPassed,
        certified,
        course,
        streak: 0,
        level: getLevel(xp),
      });
    }

    if (issues.length < 100) break;
    page++;
  }

  // Deduplicate by login (keep highest XP)
  const byLogin = new Map<string, StudentRecord>();
  for (const r of records) {
    const existing = byLogin.get(r.login);
    if (!existing || r.xp > existing.xp) {
      byLogin.set(r.login, r);
    }
  }

  return Array.from(byLogin.values()).sort((a, b) => b.xp - a.xp || b.stagesPassed - a.stagesPassed);
}

function medal(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `${rank}.`;
}

function xpBar(xp: number, maxXp: number): string {
  const pct = Math.min(1, xp / maxXp);
  const filled = Math.round(pct * 10);
  return '█'.repeat(filled) + '░'.repeat(10 - filled);
}

function buildLeaderboard(records: StudentRecord[]): string {
  const maxXp = records[0]?.xp ?? 1;
  const now = new Date().toISOString().split('T')[0];

  const rows = records
    .slice(0, 50)
    .map((r, i) => {
      const rank = medal(i + 1);
      const bar = xpBar(r.xp, maxXp);
      const cert = r.certified ? ' 🎓' : '';
      return `| ${rank} | [@${r.login}](https://github.com/${r.login}) | ${r.level.emoji} ${r.level.name} | ${r.xp.toLocaleString()} XP | \`${bar}\` | ${r.stagesPassed}/5 | ${r.course}${cert} |`;
    })
    .join('\n');

  const totalStudents = records.length;
  const certified = records.filter((r) => r.certified).length;
  const avgXp = totalStudents > 0 ? Math.round(records.reduce((s, r) => s + r.xp, 0) / totalStudents) : 0;

  return `# 🏆 Leaderboard

> Updated: ${now} · Showing top ${Math.min(50, totalStudents)} of ${totalStudents} students

## Rankings

| Rank | Student | Level | XP | Progress | Stages | Course |
|------|---------|-------|-----|----------|--------|--------|
${rows}

## Statistics

| Metric | Value |
|--------|-------|
| Total enrolled | ${totalStudents} |
| Certified | ${certified} |
| Average XP | ${avgXp.toLocaleString()} |
| Courses active | ${new Set(records.map((r) => r.course)).size} |

## Levels

| Level | XP Required | Description |
|-------|-------------|-------------|
${LEVELS.map((l) => `| ${l.emoji} ${l.name} | ${l.min.toLocaleString()} XP | |`).join('\n')}

---
_Rankings are calculated from stage completions and certifications. Updated nightly by GitHub Actions._
`;
}

async function main() {
  console.log(`Building leaderboard (mode: ${mode})`);
  const records = await fetchAllEnrollments();
  const md = buildLeaderboard(records);
  fs.writeFileSync('LEADERBOARD.md', md);
  console.log(`✓ LEADERBOARD.md written (${records.length} students)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
