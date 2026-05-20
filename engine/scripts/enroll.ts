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
    `engine/courses/${slug}/course.yaml`,
    `courses/${slug}/course.yaml`,
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      try { return parseCourseFile(p); } catch { return null; }
    }
  }
  return null;
}

function listAvailableCourses(): string[] {
  const base = 'engine/courses';
  if (!fs.existsSync(base)) return [];
  return fs.readdirSync(base, { withFileTypes: true })
    .filter((e) => e.isDirectory() && fs.existsSync(`${base}/${e.name}/course.yaml`))
    .map((e) => e.name);
}

// ─── Helpers to flatten lessons from chapter ──────────────────────────────────

function getLessonsFromChapter(ch: Course['curriculum']['chapters'][number]) {
  if (ch.lessons && ch.lessons.length > 0) return ch.lessons;
  if (ch.sections) {
    return ch.sections.flatMap((sec) => {
      if (sec.lessons) return sec.lessons;
      return (sec.subsections ?? []).flatMap((sub) => sub.lessons);
    });
  }
  return [];
}

// ─── Welcome comment ──────────────────────────────────────────────────────────

function buildWelcomeComment(
  profile: { name: string; login: string; avatarUrl: string; profileUrl: string },
  certEmail: string,
  course: Course,
  enrollmentIssue: number,
): string {
  const courseId   = course.metadata.id;
  const courseTitle = course.identity.title;

  // Build per-chapter summary
  const curriculum = course.curriculum.chapters.map((ch, i) => {
    const lessons = getLessonsFromChapter(ch);
    const lessonLines = lessons
      .map((l) => `  - **${l.title}** — ${l.type}${l.duration_minutes ? ` (${l.duration_minutes} min)` : ''}`)
      .join('\n');

    // Look up this chapter's test
    const chTest = course.chapter_tests.find((t) => t.id === ch.chapter_test_id);
    const testLine = chTest
      ? `  📝 **Chapter Test:** \`${chTest.id}\` · pass: ${chTest.passing_score}% · attempts: ${chTest.max_attempts}`
      : `  📝 **Chapter Test:** \`${ch.chapter_test_id}\``;

    // Look up this chapter's assignment (if any)
    const assignment = ch.chapter_assignment_id
      ? course.chapter_assignments?.find((a) => a.id === ch.chapter_assignment_id)
      : null;
    const assignLine = assignment
      ? `\n  🛠️ **Assignment:** \`${assignment.id}\` — ${assignment.title}`
      : '';

    return `**Chapter ${i + 1} · ${ch.title}**\n${lessonLines}\n${testLine}${assignLine}`;
  }).join('\n\n');

  // Final test section
  const finalTestSection = course.final_test
    ? `\n\n---\n### 🏁 Final Test\n\n\`${course.final_test.id}\` · pass: ${course.final_test.passing_score}% · attempts: ${course.final_test.max_attempts}\n\nThe final test unlocks after all chapter tests are passed.`
    : '';

  // Certificate requirements
  const certRequirements: string[] = [];
  const hasChapterTestReq   = course.certificate.requirements.some((r) => r.type === 'chapter_test');
  const hasFinalTestReq     = course.certificate.requirements.some((r) => r.type === 'final_test');
  const hasFinalAssignReq   = course.certificate.requirements.some((r) => r.type === 'final_assignment');

  if (hasChapterTestReq)   certRequirements.push('All chapter tests passed');
  if (hasFinalAssignReq)   certRequirements.push('Final assignment submitted and passed');
  if (hasFinalTestReq)     certRequirements.push(`Final test passed (≥ ${course.certificate.requirements.find((r) => r.type === 'final_test')?.min_score ?? 70}%)`);

  const certDelivery = certEmail
    ? `Certificate will be delivered to \`${certEmail}\` and posted to your enrollment issue.`
    : `Certificate will be posted to this issue (no email provided).`;

  const finalTestId = course.final_test?.id ?? 'final-test';

  return `## 🎉 Welcome to ${courseTitle}!

| | |
|---|---|
| **Student** | [@${profile.login}](${profile.profileUrl}) · ${profile.name} |
| **Course** | ${courseTitle} \`v${course.metadata.version}\` |
| **Track** | ${course.classification.category} |
| **Level** | ${course.classification.level} |
| **Estimated time** | ~${course.effort.total_hours} hours |

> Your GitHub username **@${profile.login}** is your identity for all chapter tests, the final test, and certificate issuance. No other login needed.

---

## 📋 Curriculum

${curriculum}${finalTestSection}

---

## 🎓 Certificate Requirements

${certRequirements.length > 0 ? certRequirements.map((r) => `- ${r}`).join('\n') : '- Complete all course requirements'}

${certDelivery}

---

## 🚀 How to Progress

1. **Study each chapter** — follow lessons, watch videos, complete exercises
2. **Submit a chapter test** → [Open a Chapter Test issue](../../issues/new?template=quiz-submit.yml) using the test ID from the curriculum above
3. **Submit assignments** → [Open an Assignment Submit issue](../../issues/new?template=quiz-attempt.yml)
4. **Pass the final test** (if required) → same quiz submit flow, use \`${finalTestId}\` as test ID
5. **Receive your certificate** → issued automatically to @${profile.login} once all requirements are met

## 📌 Links

- 🏆 [Leaderboard](../../blob/main/LEADERBOARD.md)
- 📖 [Course file](../../blob/main/engine/courses/${courseId}/course.yaml)
- 💬 [Get help](../../issues/new?template=help.yml)

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
      `@${issueAuthor} — You are already enrolled in **${course.identity.title}**.\n\nYour progress is tracked in issue #${existing.number}. Closing this duplicate.`);
    await octokit.issues.update({ owner, repo, issue_number: issueNumber, state: 'closed' });
    process.exit(0);
  }

  // Embed name and email in issue body as hidden metadata comments so we
  // can recover them later without a database (e.g. for cert generation).
  const metaComment = `\n\n<!-- name: ${profile.name} -->\n<!-- email: ${certEmail || ''} -->`;
  await octokit.issues.update({
    owner, repo, issue_number: issueNumber,
    title: `[Enrolled] @${issueAuthor} — ${course.identity.title}`,
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
  console.log(`✓ Enrolled @${issueAuthor} (${profile.name}) in ${course.identity.title}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
