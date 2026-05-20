#!/usr/bin/env bun
/**
 * quiz-engine.ts — Grade quiz / chapter-test / final-test submissions.
 * Zero AI — pure algorithmic grading.
 *
 * Question types and how they are graded:
 *   mcq         → exact letter match              (no sandbox)
 *   multi       → sorted-array exact match        (no sandbox)
 *   truefalse   → exact boolean match             (no sandbox)
 *   short       → keyword presence (min N of M)   (no sandbox)
 *   code_output → student writes expected output  → graded as short/keywords
 *   code_reading→ student explains code behaviour → graded as short/keywords
 *   code_fix    → student submits fixed code      → Docker sandbox
 *   code_write  → student submits written code    → Docker sandbox
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
import { gradeMCQ, gradeMulti, gradeTrueFalse, gradeShort, gradeCode, parseAnswersFromIssueBody, progressBar, type SolutionMap } from '../lib/scoring.ts';
import {
  makeOctokit, repoFromEnv, parseIssueField, postComment,
  addLabels, findEnrollmentIssue, setOutput,
} from '../lib/github.ts';
import type { CourseQuestion, ChapterTest, FinalTest, Course, QuestionResult, SandboxOutput } from '../types/course.ts';

const octokit         = makeOctokit();
const { owner, repo } = repoFromEnv();
const issueNumber     = parseInt(process.env['ISSUE_NUMBER'] ?? '0', 10);
const student         = process.env['STUDENT'] ?? '';
const SANDBOX_IMAGE   = process.env['SANDBOX_IMAGE'] ?? 'opencourse-sandbox';
const COURSE_BASE_DIR = process.env['COURSE_DIR'] ?? 'engine/courses';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function findCoursePath(slug: string): string | null {
  return [`${COURSE_BASE_DIR}/${slug}/course.yaml`, `courses/${slug}/course.yaml`]
    .find((p) => fs.existsSync(p)) ?? null;
}

/** Flatten all questions from a test's sections into a single array. */
function flattenQuestions(test: ChapterTest | FinalTest): CourseQuestion[] {
  return test.sections.flatMap((s) => s.questions);
}

function findTest(
  course: Course,
  id: string,
): { test: ChapterTest | FinalTest; chapterId?: string; isFinalTest: boolean } | null {
  // Look in chapter_tests (top-level array, keyed by id)
  const ct = course.chapter_tests.find((t) => t.id === id);
  if (ct) return { test: ct, chapterId: ct.attached_to, isFinalTest: false };
  // Look for final test
  if (course.final_test?.id === id) return { test: course.final_test, isFinalTest: true };
  return null;
}

async function getAttemptCount(): Promise<number> {
  const { data } = await octokit.issues.listComments({ owner, repo, issue_number: issueNumber });
  return data.filter((c) => c.body?.includes('PASSED') || c.body?.includes('FAILED')).length + 1;
}

function allChaptersPassed(course: Course, labels: string[]): boolean {
  return course.curriculum.chapters.every((ch) => labels.includes(`chapter-${ch.id}-passed`));
}

// ─── Code question grading (Docker sandbox) ───────────────────────────────────

const LANG_EXT: Record<string, string> = {
  python: '.py', python3: '.py',
  javascript: '.js', js: '.js', node: '.js',
  bash: '.sh', sh: '.sh',
  java: '.java', go: '.go',
  c: '.c', cpp: '.cpp', 'c++': '.cpp',
};

/**
 * Run student code in the Docker sandbox.
 * Test logic is provided by a grader script in assets/code/{questionId}_grader.*
 * or by a static test-cases file — both are injected into the sandbox at runtime.
 */
function runSandbox(q: CourseQuestion, studentCode: string, courseDir: string): QuestionResult {
  const seed     = Math.floor(Math.random() * 2 ** 31);
  const lang     = (q.language ?? 'python').toLowerCase();
  const ext      = LANG_EXT[lang] ?? '.txt';
  const codeFile = `/tmp/oc_student_${q.id}${ext}`;
  const outFile  = `/tmp/oc_result_${q.id}.json`;

  fs.writeFileSync(codeFile, studentCode);

  // Locate a grader script in the course assets/code/ directory (naming convention)
  const graderCandidates = [
    path.join(courseDir, 'assets', 'code', `${q.id}_grader.py`),
    path.join(courseDir, 'assets', 'code', `${q.id}_grader.sh`),
    path.join(courseDir, 'assets', 'code', `${q.id}_grader.js`),
  ];
  const graderScript = graderCandidates.find((g) => fs.existsSync(g));

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
    `-e LANGUAGE=${lang}`,
    `-e STUDENT_CODE_FILE=${codeFile}`,
    `-e TEST_OUTPUT_FILE=${outFile}`,
    `-e COURSE_DIR=/workspace/course`,
    `-e SEED=${seed}`,
  ];

  if (graderScript) {
    baseArgs.push(`-e GRADER_SCRIPT=/workspace/course/assets/code/${path.basename(graderScript)}`);
  }

  try {
    console.log(`  Running sandbox for code question "${q.id}" (${lang}, seed=${seed})`);
    execSync(`docker run ${baseArgs.join(' ')} ${SANDBOX_IMAGE}`, { stdio: 'inherit', timeout: 60_000 });
  } catch (e) {
    console.error(`  Sandbox error for "${q.id}":`, (e as Error).message);
    return { questionId: q.id, earned: 0, max: q.points, correct: false, feedback: 'Sandbox execution failed.' };
  }

  if (!fs.existsSync(outFile)) {
    return { questionId: q.id, earned: 0, max: q.points, correct: false, feedback: 'No output from sandbox.' };
  }

  const out: SandboxOutput = JSON.parse(fs.readFileSync(outFile, 'utf-8'));
  const result = gradeCode(q as any, out.tests);

  if (!result.correct && graderScript) {
    return { ...result, feedback: `${result.feedback ?? ''} Seed: ${seed} (share with maintainer to reproduce).`.trim() };
  }
  return result;
}

// ─── Solutions loader ─────────────────────────────────────────────────────────

/**
 * Load solutions.yaml from the course directory if present.
 * solutions.yaml is private (gitignored) — in CI it is injected as a secret.
 * Returns an empty map if the file is missing; graders degrade gracefully.
 */
function loadSolutions(courseDir: string): SolutionMap {
  const p = path.join(courseDir, 'solutions.yaml');
  if (!fs.existsSync(p)) return {};
  try {
    // Dynamic import to avoid hard dependency on yaml at type-check time
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const yaml = require('js-yaml') as { load: (s: string) => unknown };
    const raw = yaml.load(fs.readFileSync(p, 'utf-8')) as Record<string, unknown>;
    const map: SolutionMap = {};
    for (const [qid, val] of Object.entries(raw)) {
      if (typeof val === 'string' || Array.isArray(val) || typeof val === 'boolean') {
        map[qid] = val as string | string[] | boolean;
      }
    }
    return map;
  } catch { return {}; }
}

// ─── Per-question grade dispatcher ───────────────────────────────────────────

function gradeQuestion(
  q: CourseQuestion,
  rawAnswer: string,
  courseDir: string,
  solutions: SolutionMap,
): QuestionResult {
  const sol = solutions[q.id];
  switch (q.type) {
    case 'mcq':          return gradeMCQ(q, rawAnswer, (sol as string) ?? '');
    case 'multi':        return gradeMulti(q, rawAnswer, (sol as string[]) ?? []);
    case 'truefalse':    return gradeTrueFalse(q, rawAnswer, (sol as boolean) ?? false);
    case 'short':        return gradeShort(q, rawAnswer);
    // Text-based code questions — graded by keyword matching
    case 'code_output':
    case 'code_reading': return gradeShort(q, rawAnswer);
    // Sandbox-executed code questions
    case 'code_fix':
    case 'code_write':   return runSandbox(q, rawAnswer, courseDir);
    default:
      return { questionId: q.id, earned: 0, max: q.points, correct: false, feedback: `Unknown question type: ${q.type}` };
  }
}

// ─── Result comment ───────────────────────────────────────────────────────────

function buildResultComment(
  testTitle: string,
  isFinalTest: boolean,
  courseSlug: string,
  results: QuestionResult[],
  passingScore: number,
  attempt: number,
  maxAttempts: number,
): string {
  const totalEarned = results.reduce((s, r) => s + r.earned, 0);
  const totalMax    = results.reduce((s, r) => s + r.max, 0);
  const pct         = totalMax > 0 ? (totalEarned / totalMax) * 100 : 0;
  const passed      = pct >= passingScore;
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
  const courseDir = path.dirname(path.resolve(coursePath));
  const course    = parseCourseFile(coursePath);

  const found = findTest(course, resolvedTestId);
  if (!found) {
    const validIds = [
      ...course.chapter_tests.map((t) => t.id),
      course.final_test?.id,
    ].filter(Boolean).map((id) => `\`${id}\``).join(', ');
    await postComment(octokit, owner, repo, issueNumber,
      `@${student} — Test \`${resolvedTestId}\` not found.\n\nValid test IDs: ${validIds}`);
    process.exit(1);
  }

  const { test, chapterId, isFinalTest } = found;

  // ── Gate: final test requires all chapters passed ────────────────────────
  if (isFinalTest && !allChaptersPassed(course, enrollment.labels)) {
    const missing = course.curriculum.chapters
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
  const answers   = parseAnswersFromIssueBody(body);
  const solutions = loadSolutions(courseDir);
  const questions = flattenQuestions(test);
  const results: QuestionResult[] = [];

  for (const q of questions) {
    console.log(`  Grading ${q.type} question "${q.id}"…`);
    const result = gradeQuestion(q, answers[q.id] ?? '', courseDir, solutions);
    results.push(result);
  }

  const totalEarned = results.reduce((s, r) => s + r.earned, 0);
  const totalMax    = results.reduce((s, r) => s + r.max, 0);
  const pct         = totalMax > 0 ? (totalEarned / totalMax) * 100 : 0;
  const passed      = pct >= test.passing_score;

  console.log(`Score: ${totalEarned}/${totalMax} (${pct.toFixed(1)}%) — ${passed ? 'PASSED' : 'FAILED'}`);

  // ── Post result comment ──────────────────────────────────────────────────
  const comment = buildResultComment(test.title, isFinalTest, resolvedCourse, results, test.passing_score, attempt, test.max_attempts);
  await postComment(octokit, owner, repo, issueNumber, comment);

  // ── Update enrollment issue on pass ─────────────────────────────────────
  if (passed) {
    if (!isFinalTest && chapterId) {
      await addLabels(octokit, owner, repo, enrollment.number, [`chapter-${chapterId}-passed`]);
      console.log(`✓ Enrollment #${enrollment.number}: chapter-${chapterId}-passed`);

      const refreshed     = await findEnrollmentIssue(octokit, owner, repo, student, resolvedCourse);
      const currentLabels = refreshed?.labels ?? [...enrollment.labels, `chapter-${chapterId}-passed`];

      if (allChaptersPassed(course, currentLabels)) {
        const hasFinalTestReq   = course.certificate.requirements.some((r) => r.type === 'final_test');
        const hasFinalAssignReq = course.certificate.requirements.some((r) => r.type === 'final_assignment');

        if (!hasFinalTestReq && !hasFinalAssignReq) {
          await addLabels(octokit, owner, repo, enrollment.number, ['course-complete']);
          await triggerCertificate(enrollment.number, resolvedCourse);
        } else {
          const nextStep = hasFinalTestReq && course.final_test
            ? `Submit the **final test** (\`${course.final_test.id}\`) via [quiz submit](../../issues/new?template=quiz-submit.yml).`
            : `Submit your **final assignment** via [assignment submit](../../issues/new?template=quiz-attempt.yml).`;
          await postComment(octokit, owner, repo, enrollment.number,
            `## 🎯 All Chapter Tests Passed!\n\n@${student} — all chapters complete in **\`${resolvedCourse}\`**.\n\nNext: ${nextStep}`);
        }
      }
    }

    if (isFinalTest) {
      await addLabels(octokit, owner, repo, enrollment.number, ['final-test-passed', 'course-complete']);
      const hasFinalAssignReq = course.certificate.requirements.some((r) => r.type === 'final_assignment');
      const reqOk =
        (!course.certificate.requirements.some((r) => r.type === 'chapter_test') || allChaptersPassed(course, enrollment.labels)) &&
        (!hasFinalAssignReq || enrollment.labels.includes('project-final-passed'));
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
