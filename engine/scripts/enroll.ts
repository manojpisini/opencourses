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
  normalizeGitHubLogin,
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

// ─── Welcome comment ──────────────────────────────────────────────────────────

function buildWelcomeComment(
  profile: { name: string; login: string; avatarUrl: string; profileUrl: string },
  certEmail: string,
  course: Course,
  enrollmentIssue: number,
): string {
  const courseId   = course.metadata.id;
  const courseTitle = course.identity.title;

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
  const courseUrl = `../../tree/main/engine/courses/${courseId}`;
  const coursePageUrl = `https://manojpisini.github.io/opencourses/courses/${courseId}/`;

  return `## 🎉 Welcome to ${courseTitle}!

Hi [@${profile.login}](${profile.profileUrl}) — you are enrolled in **${courseTitle}**.

Your GitHub username **@${profile.login}** is your identity for enrollment, chapter tests, assignments, the final test, and certificate generation.

### Certificate checklist

${certRequirements.length > 0 ? certRequirements.map((r) => `- ${r}`).join('\n') : '- Complete all course requirements'}

${certDelivery}

### Start here

- Open the course page: [${courseId}](${coursePageUrl})
- Submit chapter tests from the course page after enrollment is confirmed.
- Submit assignments with the assignment submission form.

### Useful links

- [Course source](${courseUrl})
- [Leaderboard](../../blob/main/LEADERBOARD.md)
- [Get help](../../issues/new?template=help.yml)

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
  const enteredLogin = normalizeGitHubLogin(parseIssueField(body, 'Your GitHub Username'));
  const issueLogin   = normalizeGitHubLogin(issueAuthor);
  const courseSlug = parseIssueField(body, 'Course Slug').toLowerCase().trim().replace(/\s+/g, '-');
  const certEmail  = parseIssueField(body, 'Email Address');
  const goal       = parseIssueField(body, 'Your Goal (optional)');

  if (!enteredLogin) {
    await postComment(octokit, owner, repo, issueNumber,
      `@${issueAuthor} — Could not find the **Your GitHub Username** field.\n\nPlease use your own GitHub username, for example \`@${issueAuthor}\`.`);
    process.exit(1);
  }

  if (enteredLogin !== issueLogin) {
    await postComment(octokit, owner, repo, issueNumber,
      `@${issueAuthor} — The entered username **@${enteredLogin}** does not match the GitHub account that opened this issue (**@${issueAuthor}**).\n\nFor enrollment, tests, final tests, and certificates, the same GitHub username must be used end to end.`);
    await octokit.issues.update({ owner, repo, issue_number: issueNumber, state: 'closed' });
    process.exit(1);
  }

  if (!courseSlug) {
    await postComment(octokit, owner, repo, issueNumber,
      `@${issueAuthor} — Could not find the **Course Slug** field in your enrollment.\n\nPlease use the [enrollment template](../../issues/new?template=enroll.yml).`);
    process.exit(1);
  }

  // Fetch GitHub profile — name comes from here, not the form
  const profile = await fetchGitHubProfile(octokit, enteredLogin);
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
  const metaComment = `\n\n<!-- github: ${profile.login} -->\n<!-- name: ${profile.name} -->\n<!-- email: ${certEmail || ''} -->`;
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
