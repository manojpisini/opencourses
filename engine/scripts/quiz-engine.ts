#!/usr/bin/env bun
/**
 * quiz-engine.ts — Grade quiz / chapter-test / final-test submissions.
 * Zero AI — pure algorithmic grading.
 *
 * Identity model:
 *   The GitHub username (@student) IS the identity.
 *   Before grading we verify an open enrollment issue exists for that user
 *   on the requested course.  The final test is only unlocked after all
 *   chapter tests on the same enrollment issue are passed.
 *
 * Triggered by: .github/workflows/run-quiz.yml
 * Env vars: GITHUB_TOKEN, REPO, ISSUE_NUMBER, STUDENT
 */

import * as fs   from 'fs';
import * as path from 'path';
import { parseCourseFile } from '../lib/course-parser.ts';
import { gradeTest, parseAnswersFromIssueBody, progressBar } from '../lib/scoring.ts';
import {
  makeOctokit, repoFromEnv, parseIssueField, postComment,
  addLabels, findEnrollmentIssue, setOutput,
} from '../lib/github.ts';
import type { Question, ChapterTest, Course } from '../types/course.ts';

const octokit         = makeOctokit();
const { owner, repo } = repoFromEnv();
const issueNumber     = parseInt(process.env['ISSUE_NUMBER'] ?? '0', 10);
const student         = process.env['STUDENT'] ?? '';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function findCoursePath(slug: string): string | null {
  return [`engine/courses/${slug}/course.md`, `courses/${slug}/course.md`]
    .find((p) => fs.existsSync(p)) ?? null;
}

type FoundTest = { test: ChapterTest; chapterId?: string; isFinalTest: boolean };

function findTest(course: Course, id: string): FoundTest | null {
  for (const ch of course.chapters) {
    if (ch.chapter_test.id === id)
      return { test: ch.chapter_test, chapterId: ch.id, isFinalTest: false };
    for (const l of ch.lessons) {
      if (l.quiz?.id === id)
        return { test: l.quiz as unknown as ChapterTest, chapterId: ch.id, isFinalTest: false };
    }
  }
  if (course.certificate.final_test?.id === id)
    return { test: course.certificate.final_test, isFinalTest: true };
  return null;
}

/** Count how many grading result comments already exist on this issue. */
async function getAttemptCount(): Promise<number> {
  const { data } = await octokit.issues.listComments({ owner, repo, issue_number: issueNumber });
  return data.filter((c) =>
    c.body?.includes('PASSED') || c.body?.includes('FAILED'),
  ).length + 1;
}

// ─── Chapter-completion check ─────────────────────────────────────────────────

/**
 * Returns true if all chapter tests on the enrollment issue are labelled
 * as passed — used to gate the final test.
 */
function allChaptersPassed(course: Course, enrollmentLabels: string[]): boolean {
  return course.chapters.every((ch) =>
    enrollmentLabels.includes(`chapter-${ch.id}-passed`),
  );
}

// ─── Result comment ───────────────────────────────────────────────────────────

function buildResultComment(
  testTitle: string,
  isFinalTest: boolean,
  courseSlug: string,
  report: ReturnType<typeof gradeTest>,
  attempt: number,
  maxAttempts: number,
): string {
  const pct    = report.percentage.toFixed(1);
  const status = report.passed ? '✅ PASSED' : '❌ FAILED';
  const bar    = progressBar(report.percentage);
  const label  = isFinalTest ? 'Final Test' : 'Chapter Test';

  const rows = report.results.map((r) => {
    const icon = r.correct ? '✅' : '❌';
    const fb   = r.feedback ? ` — _${r.feedback}_` : '';
    return `| ${icon} | \`${r.questionId}\` | ${r.earned}/${r.max} |${fb} |`;
  }).join('\n');

  const remaining = maxAttempts - attempt;
  const retryNote = !report.passed
    ? (attempt < maxAttempts
        ? `\n> **${remaining} attempt(s) remaining.** Review the material and try again by opening a new quiz submit issue.`
        : `\n> **Maximum attempts (${maxAttempts}) reached.** Contact a maintainer for a manual review.`)
    : '';

  const nextStep = report.passed
    ? isFinalTest
      ? `\n\n## 🏆 Final Test Passed!\n\nYour certificate is being processed. Check your enrollment issue shortly.`
      : `\n\n## ✅ Chapter Complete!\n\nYour enrollment issue has been updated. Continue to the next chapter, then [submit the next chapter test](../../issues/new?template=quiz-submit.yml).`
    : '';

  return `## ${status} — ${label}: ${testTitle}

**Student:** @${student} · **Course:** \`${courseSlug}\` · **Score:** ${report.totalEarned}/${report.totalMax} (${pct}%)

${bar}

| Result | Question | Score | Notes |
|--------|----------|-------|-------|
${rows}
${retryNote}${nextStep}

---
_Graded automatically · Attempt ${attempt}/${maxAttempts} · [@${student}](https://github.com/${student}) · [Run logs](../../actions/runs/${process.env['GITHUB_RUN_ID']}/)_`;
}

// ─── Certificate trigger ──────────────────────────────────────────────────────

async function triggerCertificate(enrollmentIssueNumber: number, courseSlug: string) {
  // Add the certified label — issue-cert.yml workflow watches for this
  await addLabels(octokit, owner, repo, enrollmentIssueNumber, ['certified', `course:${courseSlug}`]);
  console.log(`✓ Labeled enrollment issue #${enrollmentIssueNumber} with "certified"`);
  // Post a note on the enrollment issue
  await postComment(octokit, owner, repo, enrollmentIssueNumber,
    `## 🎓 Certificate Unlocked!\n\n@${student} has passed all requirements for **\`${courseSlug}\`**.\n\nA certificate is being generated and will be posted here shortly.`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Grading quiz for @${student} (issue #${issueNumber})`);

  const { data: issue } = await octokit.issues.get({ owner, repo, issue_number: issueNumber });
  const body = issue.body ?? '';

  // ── Resolve course + test from issue body ────────────────────────────────
  const resolvedCourse = parseIssueField(body, 'Course').toLowerCase().trim().replace(/\s+/g, '-');
  const resolvedTestId = parseIssueField(body, 'Test ID').trim();

  if (!resolvedCourse || !resolvedTestId) {
    await postComment(octokit, owner, repo, issueNumber,
      `@${student} — Could not find **Course** or **Test ID** in this issue.\n\nPlease use the [quiz submit template](../../issues/new?template=quiz-submit.yml).`);
    process.exit(1);
  }

  // ── Verify enrollment ────────────────────────────────────────────────────
  // The submitter's GitHub username MUST have an open enrollment issue for this course.
  const enrollment = await findEnrollmentIssue(octokit, owner, repo, student, resolvedCourse);
  if (!enrollment) {
    await postComment(octokit, owner, repo, issueNumber,
      `@${student} — You are not enrolled in **\`${resolvedCourse}\`**.\n\n[Enroll first](../../issues/new?template=enroll.yml), then come back to submit tests.`);
    await octokit.issues.update({ owner, repo, issue_number: issueNumber, state: 'closed' });
    process.exit(1);
  }

  // ── Load course + find test ──────────────────────────────────────────────
  const coursePath = findCoursePath(resolvedCourse);
  if (!coursePath) {
    await postComment(octokit, owner, repo, issueNumber,
      `@${student} — Course \`${resolvedCourse}\` not found on the server.`);
    process.exit(1);
  }

  const { course } = parseCourseFile(coursePath);
  const found = findTest(course, resolvedTestId);
  if (!found) {
    const validIds = [
      ...course.chapters.flatMap((ch) => [
        ch.chapter_test.id,
        ...ch.lessons.map((l) => l.quiz?.id).filter(Boolean),
      ]),
      course.certificate.final_test?.id,
    ].filter(Boolean).map((id) => `\`${id}\``).join(', ');

    await postComment(octokit, owner, repo, issueNumber,
      `@${student} — Test ID \`${resolvedTestId}\` not found in **\`${resolvedCourse}\`**.\n\nValid IDs: ${validIds}`);
    process.exit(1);
  }

  const { test, chapterId, isFinalTest } = found;

  // ── Gate: final test requires all chapters passed ────────────────────────
  if (isFinalTest && !allChaptersPassed(course, enrollment.labels)) {
    const missing = course.chapters
      .filter((ch) => !enrollment.labels.includes(`chapter-${ch.id}-passed`))
      .map((ch) => `- Chapter ${ch.id}: ${ch.title}`)
      .join('\n');
    await postComment(octokit, owner, repo, issueNumber,
      `@${student} — The final test is only available after **all chapter tests are passed**.\n\nRemaining chapters:\n${missing}`);
    await octokit.issues.update({ owner, repo, issue_number: issueNumber, state: 'closed' });
    process.exit(1);
  }

  // ── Attempt limit ────────────────────────────────────────────────────────
  const attempt = await getAttemptCount();
  if (attempt > test.max_attempts) {
    await postComment(octokit, owner, repo, issueNumber,
      `@${student} — Maximum attempts (${test.max_attempts}) reached for \`${resolvedTestId}\`. Contact a maintainer.`);
    process.exit(1);
  }

  // ── Grade ────────────────────────────────────────────────────────────────
  const answers = parseAnswersFromIssueBody(body);
  const report  = gradeTest({
    testId:     resolvedTestId,
    courseSlug: resolvedCourse,
    student,
    questions:  test.questions as Question[],
    answers,
    passScore:  test.pass_score,
  });

  console.log(`Score: ${report.totalEarned}/${report.totalMax} (${report.percentage.toFixed(1)}%) — ${report.passed ? 'PASSED' : 'FAILED'}`);

  // ── Post result comment ──────────────────────────────────────────────────
  const comment = buildResultComment(test.title, isFinalTest, resolvedCourse, report, attempt, test.max_attempts);
  await postComment(octokit, owner, repo, issueNumber, comment);

  // ── Update enrollment issue on pass ─────────────────────────────────────
  if (report.passed) {
    if (!isFinalTest && chapterId) {
      // Mark chapter passed on enrollment issue
      await addLabels(octokit, owner, repo, enrollment.number, [`chapter-${chapterId}-passed`]);
      console.log(`✓ Enrollment #${enrollment.number}: chapter-${chapterId}-passed`);

      // Re-fetch labels to check course completion
      const refreshed = await findEnrollmentIssue(octokit, owner, repo, student, resolvedCourse);
      const currentLabels = refreshed?.labels ?? [...enrollment.labels, `chapter-${chapterId}-passed`];

      if (allChaptersPassed(course, currentLabels)) {
        if (!course.certificate.final_test && !course.certificate.requires_final_project) {
          // No final test and no final project → mark course complete + trigger cert
          await addLabels(octokit, owner, repo, enrollment.number, ['course-complete']);
          await triggerCertificate(enrollment.number, resolvedCourse);
        } else {
          // Final test/project still required
          await postComment(octokit, owner, repo, enrollment.number,
            `## 🎯 All Chapter Tests Passed!\n\n@${student} — all chapter tests in **\`${resolvedCourse}\`** are complete.\n\n${course.certificate.final_test ? `Next: submit the **final test** (\`${course.certificate.final_test.id}\`) via [quiz submit](../../issues/new?template=quiz-submit.yml).` : 'Next: submit your **final project** via [project submit](../../issues/new?template=project-submit.yml).'}`);
        }
      }
    }

    if (isFinalTest) {
      // Mark final test passed, check all requirements, issue certificate
      await addLabels(octokit, owner, repo, enrollment.number, ['final-test-passed', 'course-complete']);

      const requirementsOk =
        (!course.certificate.requires_all_chapter_tests || allChaptersPassed(course, enrollment.labels)) &&
        (!course.certificate.requires_final_project || enrollment.labels.includes('project-final-passed'));

      if (requirementsOk) {
        await triggerCertificate(enrollment.number, resolvedCourse);
      }
    }
  }

  // ── Close the quiz submit issue ──────────────────────────────────────────
  await octokit.issues.update({
    owner, repo, issue_number: issueNumber,
    state: 'closed', state_reason: 'completed',
  });

  // ── Audit log ────────────────────────────────────────────────────────────
  const entry = JSON.stringify({
    ts: new Date().toISOString(), event: isFinalTest ? 'final-test-grade' : 'quiz-grade',
    actor: student, subject: `issue:${issueNumber}`,
    course: resolvedCourse, test: resolvedTestId, chapterId: chapterId ?? null,
    score: report.totalEarned, max_score: report.totalMax,
    percentage: report.percentage, passed: report.passed,
    attempt, run_id: process.env['GITHUB_RUN_ID'],
  });
  fs.mkdirSync('audit', { recursive: true });
  fs.appendFileSync(path.join('audit', 'log.jsonl'), entry + '\n');

  setOutput('passed',     report.passed);
  setOutput('score',      report.totalEarned);
  setOutput('max_score',  report.totalMax);
  setOutput('percentage', report.percentage.toFixed(1));
  setOutput('course',     resolvedCourse);
  setOutput('is_final',   isFinalTest);

  console.log(`✓ Quiz graded for @${student}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
