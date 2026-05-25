/**
 * scoring.ts — Pure algorithmic graders for all question types.
 * Zero AI / Zero external API calls.
 *
 * In the course.yaml schema v3.0, correct answers are NOT stored in
 * course.yaml — they live in the companion solutions.yaml.  Grader functions
 * therefore accept the expected answer as a separate parameter so the
 * caller (quiz-engine.ts) can supply it after loading solutions.yaml.
 *
 * Exception: 'short' questions store keywords in course.yaml (not answers),
 * and code questions are graded by the Docker sandbox (not this file).
 */

import type { CourseQuestion, QuestionResult, GradeReport } from '../types/course.ts';

// ─── Individual graders ───────────────────────────────────────────────────────

/**
 * MCQ: one correct letter (A/B/C/D).
 * @param solution  The expected letter from solutions.yaml, e.g. "B"
 */
export function gradeMCQ(
  q: CourseQuestion,
  raw: string,
  solution: string,
): QuestionResult {
  const answer  = raw.trim().toUpperCase().replace(/[^A-Z]/g, '');
  const correct = answer === solution.trim().toUpperCase();
  return {
    questionId: q.id,
    earned:     correct ? q.points : 0,
    max:        q.points,
    correct,
    feedback:   correct ? undefined : `Correct answer: ${solution}`,
  };
}

/**
 * Multi-select: one or more correct letters.
 * @param solution  Expected letters from solutions.yaml, e.g. ["A","C"]
 */
export function gradeMulti(
  q: CourseQuestion,
  raw: string,
  solution: string[],
): QuestionResult {
  const chosen   = raw.toUpperCase().match(/[A-Z]/g) ?? [];
  const expected = solution.map((a) => a.toUpperCase()).sort().join(',');
  const actual   = [...new Set(chosen)].sort().join(',');
  const correct  = actual === expected;
  const partial  = chosen.filter((c) => solution.map((a) => a.toUpperCase()).includes(c)).length;
  const earned   = correct
    ? q.points
    : Math.floor(q.points * (partial / Math.max(1, solution.length)) * 0.5);
  return {
    questionId: q.id,
    earned,
    max:        q.points,
    correct,
    feedback:   correct ? undefined : `Correct answers: ${solution.join(', ')}`,
  };
}

/**
 * True/False.
 * @param solution  Expected boolean from solutions.yaml
 */
export function gradeTrueFalse(
  q: CourseQuestion,
  raw: string,
  solution: boolean,
): QuestionResult {
  const lower     = raw.trim().toLowerCase();
  const userTrue  = lower === 'true'  || lower === 't' || lower === 'yes' || lower === '1';
  const userFalse = lower === 'false' || lower === 'f' || lower === 'no'  || lower === '0';
  if (!userTrue && !userFalse) {
    return { questionId: q.id, earned: 0, max: q.points, correct: false,
             feedback: 'Answer must be "true" or "false".' };
  }
  const correct = (userTrue && solution) || (userFalse && !solution);
  return {
    questionId: q.id,
    earned:     correct ? q.points : 0,
    max:        q.points,
    correct,
    feedback:   correct ? undefined : `Correct answer: ${solution}`,
  };
}

/**
 * Short answer: keyword matching.
 * Keywords are stored in course.yaml (q.keywords), so no separate solution needed.
 * Also used for code_output / code_reading questions (text-based answers).
 */
export function gradeShort(q: CourseQuestion, raw: string): QuestionResult {
  const keywords   = q.keywords ?? [];
  const lower      = raw.toLowerCase();
  const matched    = keywords.filter((kw) => lower.includes(kw.toLowerCase()));
  const needed     = Math.ceil(keywords.length * 0.7); // require 70% of keywords by default
  const correct    = keywords.length === 0 || matched.length >= needed;
  const ratio      = keywords.length === 0 ? 1 : Math.min(1, matched.length / Math.max(1, needed));
  const earned     = Math.round(q.points * ratio);
  const missing    = keywords.filter((kw) => !lower.includes(kw.toLowerCase()));
  return {
    questionId: q.id,
    earned,
    max:        q.points,
    correct,
    feedback:   correct
      ? undefined
      : missing.length > 0
        ? `Your answer should mention: ${missing.join(', ')}.`
        : undefined,
  };
}

/**
 * Code grading — maps Docker sandbox test results to a QuestionResult.
 * Works for both static and dynamic (seed-based) test generation.
 * The caller runs the sandbox; this function just aggregates results.
 */
export function gradeCode(
  q: CourseQuestion,
  sandboxResults: Array<{ passed: boolean; hidden?: boolean }>,
): QuestionResult {
  const total   = sandboxResults.length;
  const passed  = sandboxResults.filter((r) => r.passed).length;
  const ratio   = total > 0 ? passed / total : 0;
  const earned  = Math.round(q.points * ratio);
  const correct = ratio === 1;
  return {
    questionId: q.id,
    earned,
    max:        q.points,
    correct,
    feedback:   correct
      ? undefined
      : `${passed}/${total} test cases passed.`,
  };
}

// ─── Full test grader ─────────────────────────────────────────────────────────

export interface AnswerMap { [questionId: string]: string }

/**
 * SolutionMap: expected answers per question ID, loaded from solutions.yaml.
 * Values are typed loosely; the individual graders cast to the right type.
 */
export interface SolutionMap {
  [questionId: string]: string | string[] | boolean | undefined;
}

export function gradeTest(opts: {
  testId: string;
  courseId: string;
  student: string;
  questions: CourseQuestion[];
  answers: AnswerMap;
  solutions: SolutionMap;
  passScore: number;           // percentage 0-100
  sandboxResults?: Map<string, Array<{ passed: boolean; hidden?: boolean }>>;
}): GradeReport {
  const results: QuestionResult[] = opts.questions.map((q) => {
    const raw      = opts.answers[q.id] ?? '';
    const solution = opts.solutions[q.id];
    switch (q.type) {
      case 'mcq':
        return gradeMCQ(q, raw, (solution as string) ?? '');
      case 'multi':
        return gradeMulti(q, raw, (solution as string[]) ?? []);
      case 'truefalse':
        return gradeTrueFalse(q, raw, (solution as boolean) ?? false);
      case 'short':
      case 'code_output':
      case 'code_reading':
        return gradeShort(q, raw);
      case 'code_fix':
      case 'code_write': {
        const tests = opts.sandboxResults?.get(q.id) ?? [];
        return gradeCode(q, tests);
      }
      default:
        return { questionId: q.id, earned: 0, max: q.points, correct: false,
                 feedback: `Unknown question type: ${q.type}` };
    }
  });

  const totalEarned = results.reduce((s, r) => s + r.earned, 0);
  const totalMax    = results.reduce((s, r) => s + r.max, 0);
  const percentage  = totalMax > 0 ? (totalEarned / totalMax) * 100 : 0;

  return {
    testId:       opts.testId,
    courseId:     opts.courseId,
    student:      opts.student,
    totalEarned,
    totalMax,
    percentage,
    passed:       percentage >= opts.passScore,
    results,
    gradedAt:     new Date().toISOString(),
  };
}

// ─── Progress bar helper ──────────────────────────────────────────────────────

export function progressBar(pct: number, width = 20): string {
  const filled = Math.round((pct / 100) * width);
  const empty  = width - filled;
  const color  = pct >= 75 ? '🟩' : pct >= 50 ? '🟨' : '🟥';
  return `${color.repeat(filled)}${'⬜'.repeat(empty)} ${pct.toFixed(1)}%`;
}

// ─── Answer parser (from GitHub Issue body) ───────────────────────────────────

/**
 * Parse answers from a GitHub Issue body using the quiz-submit template format.
 * Expected format:
 *   ### Answer: q1
 *   A
 *
 *   ### Answer: q2
 *   true
 */
export function parseAnswersFromIssueBody(body: string): AnswerMap {
  const map: AnswerMap = {};
  const blocks = body.split(/###\s+Answer:\s*/i);
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i]!;
    const newlineIdx = block.indexOf('\n');
    if (newlineIdx === -1) continue;
    const qid    = block.slice(0, newlineIdx).trim().toLowerCase();
    const answer = block.slice(newlineIdx + 1).split(/^###/m)[0]!.trim();
    if (qid) map[qid] = answer;
  }
  return map;
}
