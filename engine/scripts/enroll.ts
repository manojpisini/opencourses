#!/usr/bin/env bun
/**
 * enroll.ts — Process enrollment requests from GitHub Issues.
 *
 * Triggered by: .github/workflows/course-enroll.yml
 * Env vars: GITHUB_TOKEN, REPO, ISSUE_NUMBER, ISSUE_AUTHOR
 *
 * The enrollment issue form collects: full name, email, GitHub username, course slug, goal.
 * This script validates the submission, looks up the course.md, posts a welcome
 * comment with the full curriculum outline, and applies tracking labels.
 */

import * as fs   from 'fs';
import * as path from 'path';
import { parseCourseFile } from '../lib/course-parser.ts';
import { makeOctokit, repoFromEnv, addLabels, postComment, parseIssueField, findEnrollmentIssue, setOutput } from '../lib/github.ts';
import type { Course } from '../types/course.ts';

const octokit     = makeOctokit();
const { owner, repo } = repoFromEnv();
const issueNumber = parseInt(process.env['ISSUE_NUMBER'] ?? '0', 10);
const issueAuthor = process.env['ISSUE_AUTHOR'] ?? '';

// ─── Course lookup ────────────────────────────────────────────────────────────

function loadCourse(slug: string): Course | null {
  const candidates = [
    `engine/courses/${slug}/course.md`,
    `courses/${slug}/course.md`,
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      try { return parseCourseFile(p).course; } catch { return null; }
    }
  }
  return null;
}

function listAvailableCourses(): string[] {
  const base = 'engine/courses';
  if (!fs.existsSync(base)) return [];
  return fs.readdirSync(base, { withFileTypes: true })
    .filter((e) => e.isDirectory() && fs.existsSync(`${base}/${e.name}/course.md`))
    .map((e) => e.name);
}

// ─── Welcome comment builder ──────────────────────────────────────────────────

function buildWelcomeComment(
  name: string,
  login: string,
  course: Course,
  enrollmentIssue: number,
): string {
  const curriculum = course.chapters
    .map((ch, i) => {
      const lessons = ch.lessons.map((l) => `    - ${l.title} (${l.type}${l.duration_minutes ? `, ${l.duration_minutes}min` : ''})`).join('\n');
      const testLabel = `\`chapter-${ch.id}-passed\``;
      return `**Chapter ${i + 1}: ${ch.title}**\n${lessons}\n  📝 Chapter Test: ${ch.chapter_test.title} (pass: ${ch.chapter_test.pass_score}%) → label: ${testLabel}${ch.project ? `\n  🛠️ Project: ${ch.project.title}` : ''}`;
    })
    .join('\n\n');

  const finalTest = course.certificate.final_test
    ? `\n\n**🏁 Final Test:** ${course.certificate.final_test.title} (pass: ${course.certificate.final_test.pass_score}%)`
    : '';

  return `## 🎉 Welcome to ${course.meta.title}, ${name}!

Hi @${login}! Your enrollment in **${course.meta.title}** \`v${course.meta.version}\` is confirmed.

| | |
|---|---|
| **Track** | ${course.meta.track} |
| **Difficulty** | ${course.meta.difficulty} |
| **Estimated time** | ~${course.meta.estimated_hours}h |
| **Chapters** | ${course.chapters.length} |

## 📋 Curriculum

${curriculum}${finalTest}

## 🚀 How to Progress

1. **Study each chapter** — read lessons, watch videos, complete exercises
2. **Submit chapter tests** → [Open a Quiz Submit issue](../../issues/new?template=quiz-submit.yml) with your answers
3. **Submit projects** → [Open a Project Submit issue](../../issues/new?template=project-submit.yml) with your work
4. **Pass all chapters** at ≥${course.certificate.min_overall_score}% overall → receive your certificate

## 📌 Links

- 🏆 [Leaderboard](../../blob/main/LEADERBOARD.md)
- 💬 [Get Help](../../issues/new?template=support.yml)
- 📖 [Course README](../../blob/main/engine/courses/${course.meta.slug}/course.md)

---
_This issue #${enrollmentIssue} is your progress tracker. Keep it open._`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Processing enrollment for @${issueAuthor} on issue #${issueNumber}`);

  // Fetch issue body
  const { data: issue } = await octokit.issues.get({ owner, repo, issue_number: issueNumber });
  const body   = issue.body ?? '';

  // Parse form fields
  const fullName   = parseIssueField(body, 'Full Name');
  const email      = parseIssueField(body, 'Email Address');
  const courseSlug = parseIssueField(body, 'Course').toLowerCase().trim().replace(/\s+/g, '-');
  const goal       = parseIssueField(body, 'Your Goal');

  if (!fullName || !courseSlug) {
    await postComment(octokit, owner, repo, issueNumber,
      `@${issueAuthor} — Could not parse the enrollment form.\n\nMake sure you used the [enrollment template](../../issues/new?template=enroll.yml) and filled in **Full Name** and **Course**.`);
    process.exit(1);
  }

  // Load course
  const course = loadCourse(courseSlug);
  if (!course) {
    const available = listAvailableCourses();
    await postComment(octokit, owner, repo, issueNumber,
      `@${issueAuthor} — Course **\`${courseSlug}\`** was not found.\n\nAvailable courses:\n${available.map((s) => `- \`${s}\``).join('\n') || '_none yet_'}`);
    await octokit.issues.update({ owner, repo, issue_number: issueNumber, state: 'closed' });
    process.exit(1);
  }

  // Check duplicate
  const existing = await findEnrollmentIssue(octokit, owner, repo, issueAuthor, courseSlug);
  if (existing) {
    await postComment(octokit, owner, repo, issueNumber,
      `@${issueAuthor} — You are already enrolled in **${course.meta.title}**.\n\nTrack your progress in issue #${existing.number}.`);
    await octokit.issues.update({ owner, repo, issue_number: issueNumber, state: 'closed' });
    process.exit(0);
  }

  // Apply labels and update title
  const labels = ['enrolled', `course:${courseSlug}`];
  await addLabels(octokit, owner, repo, issueNumber, labels);
  await octokit.issues.update({
    owner, repo, issue_number: issueNumber,
    title: `[Enrolled] @${issueAuthor} — ${course.meta.title}`,
  });

  // Post welcome
  const comment = buildWelcomeComment(fullName, issueAuthor, course, issueNumber);
  await postComment(octokit, owner, repo, issueNumber, comment);

  // Audit log
  const entry = JSON.stringify({
    ts: new Date().toISOString(), event: 'enrollment',
    actor: issueAuthor, name: fullName, email,
    subject: `issue:${issueNumber}`, course: courseSlug,
    run_id: process.env['GITHUB_RUN_ID'],
  });
  const logPath = path.join('audit', 'log.jsonl');
  fs.mkdirSync('audit', { recursive: true });
  fs.appendFileSync(logPath, entry + '\n');

  setOutput('course', courseSlug);
  setOutput('enrolled', true);
  console.log(`✓ Enrolled @${issueAuthor} (${fullName}) in ${course.meta.title}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
