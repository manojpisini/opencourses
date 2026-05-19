#!/usr/bin/env bun
/**
 * enroll.ts — Process enrollment requests from GitHub Issues.
 *
 * Identity model:
 *   The student's GitHub username (issue.user.login) IS their identity.
 *   Name is fetched from their public GitHub profile — no form field needed.
 *   Email is collected optionally (for certificate delivery only).
 *
 * Progress model:
 *   This enrollment issue is the single progress record.
 *   Chapter tests, the final test, and certificate issuance all key off
 *   the same GitHub login that opened this issue.
 *
 * Triggered by: .github/workflows/enroll.yml
 * Env vars: GITHUB_TOKEN, REPO, ISSUE_NUMBER, ISSUE_AUTHOR
 */

import * as fs   from 'fs';
import * as path from 'path';
import { parseCourseFile } from '../lib/course-parser.ts';
import {
  makeOctokit, repoFromEnv, fetchGitHubProfile,
  addLabels, postComment, parseIssueField, findEnrollmentIssue, setOutput,
} from '../lib/github.ts';
import type { Course } from '../types/course.ts';

const octokit         = makeOctokit();
const { owner, repo } = repoFromEnv();
const issueNumber     = parseInt(process.env['ISSUE_NUMBER'] ?? '0', 10);
const issueAuthor     = process.env['ISSUE_AUTHOR'] ?? '';

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

// ─── Welcome comment ──────────────────────────────────────────────────────────

function buildWelcomeComment(
  profile: { name: string; login: string; avatarUrl: string; profileUrl: string },
  certEmail: string,
  course: Course,
  enrollmentIssue: number,
): string {
  const curriculum = course.chapters.map((ch, i) => {
    const lessons = ch.lessons
      .map((l) => `  - **${l.title}** — ${l.type}${l.duration_minutes ? ` (${l.duration_minutes} min)` : ''}`)
      .join('\n');
    const testLine = `  📝 **Chapter Test:** \`${ch.chapter_test.id}\` · pass: ${ch.chapter_test.pass_score}% · attempts: ${ch.chapter_test.max_attempts}`;
    const projLine = ch.project
      ? `\n  🛠️ **Project:** \`${ch.project.id}\` — ${ch.project.title}`
      : '';
    return `**Chapter ${i + 1} · ${ch.title}**\n${lessons}\n${testLine}${projLine}`;
  }).join('\n\n');

  const finalTestSection = course.certificate.final_test
    ? `\n\n---\n### 🏁 Final Test\n\n\`${course.certificate.final_test.id}\` · pass: ${course.certificate.final_test.pass_score}% · attempts: ${course.certificate.final_test.max_attempts}\n\nThe final test unlocks after all chapter tests are passed.`
    : '';

  const certRequirements: string[] = [];
  if (course.certificate.requires_all_chapter_tests)
    certRequirements.push('All chapter tests passed');
  if (course.certificate.requires_final_project)
    certRequirements.push('Final project submitted and passed');
  if (course.certificate.final_test)
    certRequirements.push(`Final test passed (≥ ${course.certificate.final_test.pass_score}%)`);
  certRequirements.push(`Overall average ≥ ${course.certificate.min_overall_score}%`);

  const certDelivery = certEmail
    ? `Certificate will be delivered to \`${certEmail}\` and posted to your enrollment issue.`
    : `Certificate will be posted to this issue (no email provided).`;

  return `## 🎉 Welcome to ${course.meta.title}!

| | |
|---|---|
| **Student** | [@${profile.login}](${profile.profileUrl}) · ${profile.name} |
| **Course** | ${course.meta.title} \`v${course.meta.version}\` |
| **Track** | ${course.meta.track} |
| **Difficulty** | ${course.meta.difficulty} |
| **Estimated time** | ~${course.meta.estimated_hours} hours |

> Your GitHub username **@${profile.login}** is your identity for all chapter tests, the final test, and certificate issuance. No other login needed.

---

## 📋 Curriculum

${curriculum}${finalTestSection}

---

## 🎓 Certificate Requirements

${certRequirements.map((r) => `- ${r}`).join('\n')}

${certDelivery}

---

## 🚀 How to Progress

1. **Study each chapter** — follow lessons, watch videos, complete exercises
2. **Submit a chapter test** → [Open a Quiz Submit issue](../../issues/new?template=quiz-submit.yml) using test ID from the curriculum above
3. **Submit projects** → [Open a Project Submit issue](../../issues/new?template=project-submit.yml)
4. **Pass the final test** (if required) → same quiz submit flow, use \`${course.certificate.final_test?.id ?? 'final-test'}\` as test ID
5. **Receive your certificate** → issued automatically to @${profile.login} once all requirements are met

## 📌 Links

- 🏆 [Leaderboard](../../blob/main/LEADERBOARD.md)
- 📖 [Course file](../../blob/main/engine/courses/${course.meta.slug}/course.md)
- 💬 [Get help](../../issues/new?template=support.yml)

---
_Issue #${enrollmentIssue} is your progress tracker — keep it open. Labels are added here as you complete chapters._`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Processing enrollment for @${issueAuthor} (issue #${issueNumber})`);

  // Fetch issue body
  const { data: issue } = await octokit.issues.get({ owner, repo, issue_number: issueNumber });
  const body = issue.body ?? '';

  // Parse form fields — only course slug and optional email
  const courseSlug = parseIssueField(body, 'Course Slug').toLowerCase().trim().replace(/\s+/g, '-');
  const certEmail  = parseIssueField(body, 'Email Address');
  const goal       = parseIssueField(body, 'Your Goal (optional)');

  if (!courseSlug) {
    await postComment(octokit, owner, repo, issueNumber,
      `@${issueAuthor} — Could not find the **Course Slug** field in your enrollment.\n\nPlease use the [enrollment template](../../issues/new?template=enroll.yml).`);
    process.exit(1);
  }

  // Fetch GitHub profile — name comes from here, not the form
  const profile = await fetchGitHubProfile(octokit, issueAuthor);
  console.log(`Profile: ${profile.name} (@${profile.login})`);

  // Load course
  const course = loadCourse(courseSlug);
  if (!course) {
    const available = listAvailableCourses().filter((s) => s !== 'template');
    await postComment(octokit, owner, repo, issueNumber,
      `@${issueAuthor} — Course **\`${courseSlug}\`** was not found.\n\n**Available courses:**\n${available.map((s) => `- \`${s}\``).join('\n') || '_No courses published yet._'}`);
    await octokit.issues.update({ owner, repo, issue_number: issueNumber, state: 'closed' });
    process.exit(1);
  }

  // Duplicate enrollment check
  const existing = await findEnrollmentIssue(octokit, owner, repo, issueAuthor, courseSlug);
  if (existing) {
    await postComment(octokit, owner, repo, issueNumber,
      `@${issueAuthor} — You are already enrolled in **${course.meta.title}**.\n\nYour progress is tracked in issue #${existing.number}. Closing this duplicate.`);
    await octokit.issues.update({ owner, repo, issue_number: issueNumber, state: 'closed' });
    process.exit(0);
  }

  // Embed name and email in issue body as hidden metadata comments so we
  // can recover them later without a database (e.g. for cert generation).
  const metaComment = `\n\n<!-- name: ${profile.name} -->\n<!-- email: ${certEmail || ''} -->`;
  await octokit.issues.update({
    owner, repo, issue_number: issueNumber,
    title: `[Enrolled] @${issueAuthor} — ${course.meta.title}`,
    body:  (issue.body ?? '') + metaComment,
  });

  // Apply labels
  await addLabels(octokit, owner, repo, issueNumber, ['enrolled', `course:${courseSlug}`]);

  // Post welcome comment
  const comment = buildWelcomeComment(profile, certEmail, course, issueNumber);
  await postComment(octokit, owner, repo, issueNumber, comment);

  // Audit
  const logEntry = JSON.stringify({
    ts: new Date().toISOString(), event: 'enrollment',
    actor: issueAuthor, name: profile.name, email: certEmail || null,
    subject: `issue:${issueNumber}`, course: courseSlug, goal: goal || null,
    run_id: process.env['GITHUB_RUN_ID'],
  });
  fs.mkdirSync('audit', { recursive: true });
  fs.appendFileSync(path.join('audit', 'log.jsonl'), logEntry + '\n');

  setOutput('course', courseSlug);
  setOutput('enrolled', true);
  console.log(`✓ Enrolled @${issueAuthor} (${profile.name}) in ${course.meta.title}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
