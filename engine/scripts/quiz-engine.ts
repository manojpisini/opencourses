#!/usr/bin/env bun
/**
 * quiz-engine.ts — Grade quiz / chapter-test / final-test submissions.
 * Zero AI — pure algorithmic grading.
 *
 * Question types and how they are graded:
 *   mcq        → exact letter match              (no sandbox)
 *   multi      → sorted-array exact match        (no sandbox)
 *   true-false → exact boolean match             (no sandbox)
 *   short      → keyword presence (min N of M)   (no sandbox)
 *   code       → Docker sandbox, two modes:
 *                  static:  test_cases in course.md  → deterministic I/O
 *                  dynamic: test_generator script    → random inputs each run
 *
 * Identity / enrollment model:
 *   The submitter's GitHub @username must have an open enrollment issue for
 *   the requested course. All chapter tests + final test + certificate are
 *   tied to that same GitHub account.
 *
 * Triggered by: .github/workflows/run-quiz.yml
 * Env vars: GITHUB_TOKEN, REPO, ISSUE_NUMBER, STUDENT
 *           SANDBOX_IMAGE  (default: opencourse-sandbox)
 *           COURSE_DIR     (default: engine/courses)
 */

import * as fs            from 'fs';
import * as path          from 'path';
import { execSync }       from 'child_process';
import { parseCourseFile } from '../lib/course-parser.ts';
import { gradeMCQ, gradeMulti, gradeTrueFalse, gradeShort, gradeCode, parseAnswersFromIssueBody, progressBar } from '../lib/scoring.ts';
import {
  makeOctokit, repoFromEnv, parseIssueField, postComment,
  addLabels, findEnrollmentIssue, setOutput,
} from '../lib/github.ts';
import type { Question, ChapterTest, Course, CodeQuestion, QuestionResult, SandboxOutput } from '../types/course.ts';

const octokit         = makeOctokit();
const { owner, repo } = repoFromEnv();
const issueNumber     = parseInt(process.env['ISSUE_NUMBER'] ?? '0', 10);
const student         = process.env['STUDENT'] ?? '';
const SANDBOX_IMAGE   = process.env['SANDBOX_IMAGE'] ?? 'opencourse-sandbox';
const COURSE_BASE_DIR = process.env['COURSE_DIR'] ?? 'engine/courses';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function findCoursePath(slug: string): string | null {
  return [`${COURSE_BASE_DIR}/${slug}/course.md`, `courses/${slug}/course.md`]
    .find((p) => fs.existsSync(p)) ?? null;
}

function findTest(course: Course, id: string): { test: ChapterTest; chapterId?: string; isFinalTest: boolean } | null {
  for (const ch of course.chapters) {
    if (ch.chapter_test.id === id) return { test: ch.chapter_test, chapterId: ch.id, isFinalTest: false };
    for (const l of ch.lessons) {
      if (l.quiz?.id === id) return { test: l.quiz as unknown as ChapterTest, chapterId: ch.id, isFinalTest: false };
    }
  }
  if (course.certificate.final_test?.id === id) return { test: course.certificate.final_test, isFinalTest: true };
  return null;
}

async function getAttemptCount(): Promise<number> {
  const { data } = await octokit.issues.listComments({ owner, repo, issue_number: issueNumber });
  return data.filter((c) => c.body?.includes('PASSED') || c.body?.includes('FAILED')).length + 1;
}

function allChaptersPassed(course: Course, labels: string[]): boolean {
  return course.chapters.every((ch) => labels.includes(`chapter-${ch.id}-passed`));
}

// ─── Code question grading (Docker sandbox) ───────────────────────────────────

const LANG_EXT: Record<string, string> = {
  python: '.py', python3: '.py',
  javascript: '.js', js: '.js', node: '.js',
  bash: '.sh', sh: '.sh',
  java: '.java', go: '.go',
  c: '.c', cpp: '.cpp', 'c++': '.cpp',
};

function runSandbox(q: CodeQuestion, studentCode: string, courseDir: string): QuestionResult {
  const seed    = Math.floor(Math.random() * 2 ** 31);
  const ext     = LANG_EXT[q.language.toLowerCase()] ?? '.txt';
  const codeFile = `/tmp/oc_student_${q.id}${ext}`;
  const outFile  = `/tmp/oc_result_${q.id}.json`;

  // Write student code to a temp file
  fs.writeFileSync(codeFile, studentCode);

  // Prepare Docker args
  const baseArgs = [
    `--rm`,
    `--network none`,
    `--memory 256m --cpus 1`,
    `--read-only`,
    `--tmpfs /tmp:size=100m`,
    `--user 1001:1001`,
    `--security-opt no-new-privileges`,
    `-v ${path.resolve(courseDir)}:/workspace/course:ro`,
    `-v ${codeFile}:${codeFile}:ro`,
    `-v /tmp:/tmp`,
    `-e LANGUAGE=${q.language}`,
    `-e STUDENT_CODE_FILE=${codeFile}`,
    `-e TEST_OUTPUT_FILE=${outFile}`,
    `-e COURSE_DIR=/workspace/course`,
  ];

  if (q.test_generator) {
    baseArgs.push(
      `-e TEST_GENERATOR=${q.test_generator}`,
      `-e SEED=${seed}`,
      `-e TEST_COUNT=${q.test_count ?? 10}`,
    );
  } else if (q.test_cases && q.test_cases.length > 0) {
    const casesFile = `/tmp/oc_cases_${q.id}.json`;
    fs.writeFileSync(casesFile, JSON.stringify(q.test_cases));
    baseArgs.push(`-e TEST_CASES_FILE=${casesFile}`, `-v ${casesFile}:${casesFile}:ro`);
  }

  try {
    console.log(`  Running sandbox for code question "${q.id}" (${q.language}, seed=${seed})`);
    execSync(`docker run ${baseArgs.join(' ')} ${SANDBOX_IMAGE}`, { stdio: 'inherit', timeout: 60_000 });
  } catch (e) {
    console.error(`  Sandbox error for "${q.id}":`, (e as Error).message);
    return { questionId: q.id, earned: 0, max: q.points, correct: false, feedback: 'Sandbox execution failed.' };
  }

  if (!fs.existsSync(outFile)) {
    return { questionId: q.id, earned: 0, max: q.points, correct: false, feedback: 'No output from sandbox.' };
  }

  const out: SandboxOutput = JSON.parse(fs.readFileSync(outFile, 'utf-8'));
  const result = gradeCode(q, out.tests);

  // Append seed to feedback for dynamic questions (reproducibility)
  if (q.test_generator && !result.correct) {
    return { ...result, feedback: `${result.feedback ?? ''} Seed: ${seed} (share with maintainer to reproduce).`.trim() };
  }
  return result;
}

// ─── Per-question grade dispatcher ───────────────────────────────────────────

function gradeQuestion(
  q: Question,
  rawAnswer: string,
  courseDir: string,
): QuestionResult {
  switch (q.type) {
    case 'mcq':        return gradeMCQ(q, rawAnswer);
    case 'multi':      return gradeMulti(q, rawAnswer);
    case 'true-false': return gradeTrueFalse(q, rawAnswer);
    case 'short':      return gradeShort(q, rawAnswer);
    case 'code':       return runSandbox(q, rawAnswer, courseDir);
  }
}

// ─── Result comment ───────────────────────────────────────────────────────────

function buildResultComment(
  testTitle: string,
  isFinalTest: boolean,
  courseSlug: string,
  results: QuestionResult[],
  passScore: number,
  attempt: number,
  maxAttempts: number,
): string {
  const totalEarned = results.reduce((s, r) => s + r.earned, 0);
  const totalMax    = results.reduce((s, r) => s + r.max, 0);
  const pct         = totalMax > 0 ? (totalEarned / totalMax) * 100 : 0;
  const passed      = pct >= passScore;
  const status      = passed ? '✅ PASSED' : '❌ FAILED';
  const bar         = progressBar(pct);
  const label       = isFinalTest ? 'Final Test' : 'Chapter Test';

  const rows = results.map((r) => {
    const icon = r.correct ? '✅' : '❌';
    const fb   = r.feedback ? ` — _${r.feedback}_` : '';
    return `| ${icon} | \`${r.questionId}\` | ${r.earned}/${r.max} |${fb} |`;
  }).join('\n');

  const remaining = maxAttempts - attempt;
  const retryNote = !passed
    ? (attempt < maxAttempts
        ? `\n> **${remaining} attempt(s) remaining.** Open a new quiz-submit issue to try again.`
        : `\n> **Maximum attempts (${maxAttempts}) reached.** Contact a maintainer.`)
    : '';

  const nextStep = passed
    ? isFinalTest
      ? `\n\n## 🏆 Final Test Passed!\nYour certificate is being processed.`
      : `\n\n## ✅ Chapter Complete!\nContinue to the next chapter, then [submit your next chapter test](../../issues/new?template=quiz-submit.yml).`
    : '';

  return `## ${status} — ${label}: ${testTitle}

**Student:** @${student} · **Course:** \`${courseSlug}\` · **Score:** ${totalEarned}/${totalMax} (${pct.toFixed(1)}%)

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
  await addLabels(octokit, owner, repo, enrollmentIssueNumber, ['certified']);
  await postComment(octokit, owner, repo, enrollmentIssueNumber,
    `## 🎓 Certificate Unlocked!\n\n@${student} has met all requirements for **\`${courseSlug}\`**.\n\nA certificate is being generated and will appear here shortly.`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Grading quiz for @${student} (issue #${issueNumber})`);

  const { data: issue } = await octokit.issues.get({ owner, repo, issue_number: issueNumber });
  const body = issue.body ?? '';

  const resolvedCourse = parseIssueField(body, 'Course').toLowerCase().trim().replace(/\s+/g, '-');
  const resolvedTestId = parseIssueField(body, 'Test ID').trim();

  if (!resolvedCourse || !resolvedTestId) {
    await postComment(octokit, owner, repo, issueNumber,
      `@${student} — Could not find **Course** or **Test ID** fields.\n\nPlease use the [quiz submit template](../../issues/new?template=quiz-submit.yml).`);
    process.exit(1);
  }

  // ── Verify enrollment ────────────────────────────────────────────────────
  const enrollment = await findEnrollmentIssue(octokit, owner, repo, student, resolvedCourse);
  if (!enrollment) {
    await postComment(octokit, owner, repo, issueNumber,
      `@${student} — You are not enrolled in **\`${resolvedCourse}\`**.\n\n[Enroll first](../../issues/new?template=enroll.yml), then come back to submit tests.`);
    await octokit.issues.update({ owner, repo, issue_number: issueNumber, state: 'closed' });
    process.exit(1);
  }

  // ── Load course ──────────────────────────────────────────────────────────
  const coursePath = findCoursePath(resolvedCourse);
  if (!coursePath) {
    await postComment(octokit, owner, repo, issueNumber, `@${student} — Course \`${resolvedCourse}\` not found.`);
    process.exit(1);
  }
  const courseDir  = path.dirname(path.resolve(coursePath));
  const { course } = parseCourseFile(coursePath);

  const found = findTest(course, resolvedTestId);
  if (!found) {
    const validIds = [
      ...course.chapters.flatMap((ch) => [ch.chapter_test.id, ...ch.lessons.map((l) => l.quiz?.id).filter(Boolean)]),
      course.certificate.final_test?.id,
    ].filter(Boolean).map((id) => `\`${id}\``).join(', ');
    await postComment(octokit, owner, repo, issueNumber,
      `@${student} — Test \`${resolvedTestId}\` not found.\n\nValid test IDs: ${validIds}`);
    process.exit(1);
  }

  const { test, chapterId, isFinalTest } = found;

  // ── Gate: final test requires all chapters passed ────────────────────────
  if (isFinalTest && !allChaptersPassed(course, enrollment.labels)) {
    const missing = course.chapters
      .filter((ch) => !enrollment.labels.includes(`chapter-${ch.id}-passed`))
      .map((ch) => `- \`${ch.id}\`: ${ch.title}`).join('\n');
    await postComment(octokit, owner, repo, issueNumber,
      `@${student} — The final test requires all chapter tests to be passed first.\n\nRemaining:\n${missing}`);
    await octokit.issues.update({ owner, repo, issue_number: issueNumber, state: 'closed' });
    process.exit(1);
  }

  // ── Attempt limit ────────────────────────────────────────────────────────
  const attempt = await getAttemptCount();
  if (attempt > test.max_attempts) {
    await postComment(octokit, owner, repo, issueNumber,
      `@${student} — Max attempts (${test.max_attempts}) reached for \`${resolvedTestId}\`.`);
    process.exit(1);
  }

  // ── Grade each question ──────────────────────────────────────────────────
  const answers = parseAnswersFromIssueBody(body);
  const results: QuestionResult[] = [];

  for (const q of test.questions as Question[]) {
    console.log(`  Grading ${q.type} question "${q.id}"…`);
    const result = gradeQuestion(q, answers[q.id] ?? '', courseDir);
    results.push(result);
  }

  const totalEarned = results.reduce((s, r) => s + r.earned, 0);
  const totalMax    = results.reduce((s, r) => s + r.max, 0);
  const pct         = totalMax > 0 ? (totalEarned / totalMax) * 100 : 0;
  const passed      = pct >= test.pass_score;

  console.log(`Score: ${totalEarned}/${totalMax} (${pct.toFixed(1)}%) — ${passed ? 'PASSED' : 'FAILED'}`);

  // ── Post result comment ──────────────────────────────────────────────────
  const comment = buildResultComment(test.title, isFinalTest, resolvedCourse, results, test.pass_score, attempt, test.max_attempts);
  await postComment(octokit, owner, repo, issueNumber, comment);

  // ── Update enrollment issue on pass ─────────────────────────────────────
  if (passed) {
    if (!isFinalTest && chapterId) {
      await addLabels(octokit, owner, repo, enrollment.number, [`chapter-${chapterId}-passed`]);
      console.log(`✓ Enrollment #${enrollment.number}: chapter-${chapterId}-passed`);

      const refreshed    = await findEnrollmentIssue(octokit, owner, repo, student, resolvedCourse);
      const currentLabels = refreshed?.labels ?? [...enrollment.labels, `chapter-${chapterId}-passed`];

      if (allChaptersPassed(course, currentLabels)) {
        if (!course.certificate.final_test && !course.certificate.requires_final_project) {
          await addLabels(octokit, owner, repo, enrollment.number, ['course-complete']);
          await triggerCertificate(enrollment.number, resolvedCourse);
        } else {
          const nextStep = course.certificate.final_test
            ? `Submit the **final test** (\`${course.certificate.final_test.id}\`) via [quiz submit](../../issues/new?template=quiz-submit.yml).`
            : `Submit your **final project** via [project submit](../../issues/new?template=project-submit.yml).`;
          await postComment(octokit, owner, repo, enrollment.number,
            `## 🎯 All Chapter Tests Passed!\n\n@${student} — all chapters complete in **\`${resolvedCourse}\`**.\n\nNext: ${nextStep}`);
        }
      }
    }

    if (isFinalTest) {
      await addLabels(octokit, owner, repo, enrollment.number, ['final-test-passed', 'course-complete']);
      const reqOk =
        (!course.certificate.requires_all_chapter_tests || allChaptersPassed(course, enrollment.labels)) &&
        (!course.certificate.requires_final_project     || enrollment.labels.includes('project-final-passed'));
      if (reqOk) await triggerCertificate(enrollment.number, resolvedCourse);
    }
  }

  // ── Close quiz submit issue ──────────────────────────────────────────────
  await octokit.issues.update({ owner, repo, issue_number: issueNumber, state: 'closed', state_reason: 'completed' });

  // ── Audit ────────────────────────────────────────────────────────────────
  fs.mkdirSync('audit', { recursive: true });
  fs.appendFileSync(path.join('audit', 'log.jsonl'), JSON.stringify({
    ts: new Date().toISOString(), event: isFinalTest ? 'final-test-grade' : 'quiz-grade',
    actor: student, subject: `issue:${issueNumber}`,
    course: resolvedCourse, test: resolvedTestId, chapterId: chapterId ?? null,
    score: totalEarned, max_score: totalMax, percentage: pct, passed, attempt,
    run_id: process.env['GITHUB_RUN_ID'],
  }) + '\n');

  setOutput('passed',    passed);
  setOutput('score',     totalEarned);
  setOutput('max_score', totalMax);
  setOutput('percentage', pct.toFixed(1));
  setOutput('course',    resolvedCourse);
  setOutput('is_final',  isFinalTest);
  console.log(`✓ Quiz graded for @${student}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
