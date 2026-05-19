#!/usr/bin/env bun
/**
 * quiz-engine.ts — Grade quiz/chapter-test submissions from GitHub Issues.
 * Zero AI — pure algorithmic grading for MCQ, multi, true-false, short, code.
 *
 * Triggered by: .github/workflows/course-quiz.yml
 * Env vars: GITHUB_TOKEN, REPO, ISSUE_NUMBER, STUDENT, COURSE_SLUG, TEST_ID
 */

import * as fs   from 'fs';
import * as path from 'path';
import { parseCourseFile } from '../lib/course-parser.ts';
import { gradeTest, parseAnswersFromIssueBody, progressBar } from '../lib/scoring.ts';
import { makeOctokit, repoFromEnv, parseIssueField, postComment, addLabels, findEnrollmentIssue, setOutput } from '../lib/github.ts';
import type { Question, ChapterTest } from '../types/course.ts';

const octokit     = makeOctokit();
const { owner, repo } = repoFromEnv();
const issueNumber = parseInt(process.env['ISSUE_NUMBER'] ?? '0', 10);
const student     = process.env['STUDENT']     ?? '';
const courseSlug  = process.env['COURSE_SLUG'] ?? '';
const testId      = process.env['TEST_ID']     ?? '';  // e.g. "ch-01-test" or "final-test"

// ─── Course + test lookup ─────────────────────────────────────────────────────

function findCoursePath(slug: string): string | null {
  const candidates = [`engine/courses/${slug}/course.md`, `courses/${slug}/course.md`];
  return candidates.find((p) => fs.existsSync(p)) ?? null;
}

function findTest(course: ReturnType<typeof parseCourseFile>['course'], id: string): { test: ChapterTest; chapterId?: string } | null {
  // Check chapter tests
  for (const ch of course.chapters) {
    if (ch.chapter_test.id === id) return { test: ch.chapter_test, chapterId: ch.id };
    // Check in-lesson quizzes
    for (const l of ch.lessons) {
      if (l.quiz?.id === id) return { test: l.quiz as unknown as ChapterTest, chapterId: ch.id };
    }
  }
  // Check final test
  if (course.certificate.final_test?.id === id) return { test: course.certificate.final_test };
  return null;
}

// ─── Attempt counter ──────────────────────────────────────────────────────────

async function getAttemptCount(): Promise<number> {
  const { data: comments } = await octokit.issues.listComments({ owner, repo, issue_number: issueNumber });
  return comments.filter((c) => c.body?.includes('Quiz Results') || c.body?.includes('Chapter Test Results')).length + 1;
}

// ─── Result comment ───────────────────────────────────────────────────────────

function buildResultComment(
  testTitle: string,
  student: string,
  courseSlug: string,
  report: ReturnType<typeof gradeTest>,
  attempt: number,
  maxAttempts: number,
): string {
  const pct    = report.percentage.toFixed(1);
  const status = report.passed ? '✅ PASSED' : '❌ FAILED';
  const bar    = progressBar(report.percentage);

  const rows = report.results.map((r) => {
    const icon = r.correct ? '✅' : '❌';
    const fb   = r.feedback ? ` — _${r.feedback}_` : '';
    return `| ${icon} | \`${r.questionId}\` | ${r.earned}/${r.max} |${fb} |`;
  }).join('\n');

  const remainingAttempts = maxAttempts - attempt;
  const retryNote = !report.passed && attempt < maxAttempts
    ? `\n> **${remainingAttempts} attempt(s) remaining.** Review the material and try again.`
    : !report.passed
    ? `\n> **Maximum attempts reached.** Contact a maintainer for manual review.`
    : '';

  const nextStep = report.passed
    ? `\n\n## ✅ What's Next\n\nYour chapter progress has been updated. Check the [leaderboard](../../blob/main/LEADERBOARD.md) to see your ranking.`
    : '';

  return `## ${status} — ${testTitle}

**Student:** @${student} · **Course:** \`${courseSlug}\` · **Score:** ${report.totalEarned}/${report.totalMax} (${pct}%)

${bar}

| Result | Question | Score | Notes |
|--------|----------|-------|-------|
${rows}
${retryNote}${nextStep}

---
_Graded automatically · Attempt ${attempt}/${maxAttempts} · [Run logs](../../actions/runs/${process.env['GITHUB_RUN_ID']}/)_`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Grading test "${testId}" for @${student} (issue #${issueNumber})`);

  // Parse issue to get course+test if not in env
  const { data: issue } = await octokit.issues.get({ owner, repo, issue_number: issueNumber });
  const body = issue.body ?? '';

  const resolvedCourse = courseSlug || parseIssueField(body, 'Course').toLowerCase().trim().replace(/\s+/g, '-');
  const resolvedTestId = testId     || parseIssueField(body, 'Test ID').trim();

  if (!resolvedCourse || !resolvedTestId) {
    await postComment(octokit, owner, repo, issueNumber,
      `@${student} — Could not determine course or test ID from this issue.\n\nMake sure you used the [quiz submit template](../../issues/new?template=quiz-submit.yml).`);
    process.exit(1);
  }

  // Load course
  const coursePath = findCoursePath(resolvedCourse);
  if (!coursePath) {
    await postComment(octokit, owner, repo, issueNumber,
      `@${student} — Course \`${resolvedCourse}\` not found.`);
    process.exit(1);
  }

  const { course } = parseCourseFile(coursePath);
  const found = findTest(course, resolvedTestId);
  if (!found) {
    await postComment(octokit, owner, repo, issueNumber,
      `@${student} — Test \`${resolvedTestId}\` not found in course \`${resolvedCourse}\`.\n\nCheck the course curriculum for valid test IDs.`);
    process.exit(1);
  }

  const { test, chapterId } = found;
  const attempt    = await getAttemptCount();

  if (attempt > test.max_attempts) {
    await postComment(octokit, owner, repo, issueNumber,
      `@${student} — Maximum attempts (${test.max_attempts}) reached for \`${resolvedTestId}\`. Contact a maintainer.`);
    process.exit(1);
  }

  // Grade
  const answers = parseAnswersFromIssueBody(body);
  const report  = gradeTest({
    testId:      resolvedTestId,
    courseSlug:  resolvedCourse,
    student,
    questions:   test.questions as Question[],
    answers,
    passScore:   test.pass_score,
  });

  console.log(`Score: ${report.totalEarned}/${report.totalMax} (${report.percentage.toFixed(1)}%) — ${report.passed ? 'PASSED' : 'FAILED'}`);

  // Post result
  const comment = buildResultComment(test.title, student, resolvedCourse, report, attempt, test.max_attempts);
  await postComment(octokit, owner, repo, issueNumber, comment);

  // Update enrollment issue labels on pass
  if (report.passed && chapterId) {
    const enrollment = await findEnrollmentIssue(octokit, owner, repo, student, resolvedCourse);
    if (enrollment) {
      await addLabels(octokit, owner, repo, enrollment.number, [`chapter-${chapterId}-passed`]);
      console.log(`✓ Labeled enrollment issue #${enrollment.number} with chapter-${chapterId}-passed`);

      // Check if all chapters complete → course-complete
      const allPassed = course.chapters.every((ch) =>
        enrollment.labels.includes(`chapter-${ch.id}-passed`) || ch.id === chapterId,
      );
      if (allPassed && !course.certificate.requires_final_project) {
        await addLabels(octokit, owner, repo, enrollment.number, ['course-complete']);
        console.log('✓ All chapters passed — marked course-complete');
      }
    }
  }

  // Close issue
  await octokit.issues.update({ owner, repo, issue_number: issueNumber, state: 'closed', state_reason: 'completed' });

  // Audit log
  const entry = JSON.stringify({
    ts: new Date().toISOString(), event: 'quiz-grade',
    actor: student, subject: `issue:${issueNumber}`,
    course: resolvedCourse, test: resolvedTestId, chapterId,
    score: report.totalEarned, max_score: report.totalMax,
    percentage: report.percentage, passed: report.passed,
    attempt, run_id: process.env['GITHUB_RUN_ID'],
  });
  fs.mkdirSync('audit', { recursive: true });
  fs.appendFileSync(path.join('audit', 'log.jsonl'), entry + '\n');

  // Trigger leaderboard rebuild
  setOutput('passed', report.passed);
  setOutput('score', report.totalEarned);
  setOutput('max_score', report.totalMax);
  setOutput('percentage', report.percentage.toFixed(1));
  setOutput('course', resolvedCourse);

  console.log(`✓ Quiz graded for @${student}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
