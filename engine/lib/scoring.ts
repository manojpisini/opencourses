/**
 * scoring.ts — Pure algorithmic graders for all question types.
 * Zero AI / Zero external API calls.
 */

import type {
  Question, MCQQuestion, MultiQuestion, TrueFalseQuestion,
  ShortQuestion, CodeQuestion, QuestionResult, GradeReport,
} from '../types/course.ts';

// ─── Individual graders ───────────────────────────────────────────────────────

export function gradeMCQ(q: MCQQuestion, raw: string): QuestionResult {
  const answer  = raw.trim().toUpperCase().replace(/[^A-Z]/, '');
  const correct = answer === q.answer.trim().toUpperCase();
  return {
    questionId: q.id,
    earned:     correct ? q.points : 0,
    max:        q.points,
    correct,
    feedback:   correct ? undefined : `Correct answer: ${q.answer}. ${q.explanation ?? ''}`.trim(),
  };
}

export function gradeMulti(q: MultiQuestion, raw: string): QuestionResult {
  // Accept "A, C" or "A C" or ["A","C"] etc.
  const chosen  = raw.toUpperCase().match(/[A-Z]/g) ?? [];
  const expected = q.answer.map((a) => a.toUpperCase()).sort().join(',');
  const actual   = [...new Set(chosen)].sort().join(',');
  const correct  = actual === expected;
  const partial  = chosen.filter((c) => q.answer.map((a) => a.toUpperCase()).includes(c)).length;
  const earned   = correct
    ? q.points
    : Math.floor(q.points * (partial / q.answer.length) * 0.5); // 50% credit for partial
  return {
    questionId: q.id,
    earned,
    max:       q.points,
    correct,
    feedback:  correct ? undefined : `Correct answers: ${q.answer.join(', ')}. ${q.explanation ?? ''}`.trim(),
  };
}

export function gradeTrueFalse(q: TrueFalseQuestion, raw: string): QuestionResult {
  const lower = raw.trim().toLowerCase();
  const userTrue  = lower === 'true'  || lower === 't' || lower === 'yes' || lower === '1';
  const userFalse = lower === 'false' || lower === 'f' || lower === 'no'  || lower === '0';
  if (!userTrue && !userFalse) {
    return { questionId: q.id, earned: 0, max: q.points, correct: false,
             feedback: 'Answer must be "true" or "false".' };
  }
  const correct = (userTrue && q.answer) || (userFalse && !q.answer);
  return {
    questionId: q.id,
    earned:    correct ? q.points : 0,
    max:       q.points,
    correct,
    feedback:  correct ? undefined : `Correct answer: ${q.answer}. ${q.explanation ?? ''}`.trim(),
  };
}

export function gradeShort(q: ShortQuestion, raw: string): QuestionResult {
  const lower   = raw.toLowerCase();
  const matched = q.keywords.filter((kw) => lower.includes(kw.toLowerCase()));
  const needed  = q.min_keywords ?? q.keywords.length;
  const correct = matched.length >= needed;
  // Proportional partial credit (capped at full if all matched)
  const ratio   = Math.min(1, matched.length / Math.max(1, needed));
  const earned  = Math.round(q.points * ratio);
  const missing = q.keywords.filter((kw) => !lower.includes(kw.toLowerCase()));
  return {
    questionId: q.id,
    earned,
    max:        q.points,
    correct,
    feedback:   correct
      ? undefined
      : `Your answer should mention: ${missing.join(', ')}.`,
  };
}

/**
 * Code grading — runs test-case matching against submitted code output.
 * In the GitHub Actions context the code is executed inside the Docker
 * sandbox and results are written to a JSON file.  Here we compare
 * expected vs actual outputs reported by the sandbox.
 */
export function gradeCode(
  q: CodeQuestion,
  testResults: Array<{ input: string; actual: string; passed: boolean }>,
): QuestionResult {
  const visible = q.test_cases.filter((tc) => !tc.hidden);
  const hidden  = q.test_cases.filter((tc) => tc.hidden);

  const totalCases = q.test_cases.length;
  const passedVisible = testResults
    .filter((r) => visible.some((tc) => tc.input === r.input) && r.passed).length;
  const passedHidden = testResults
    .filter((r) => hidden.some((tc) => tc.input === r.input) && r.passed).length;

  const totalPassed = passedVisible + passedHidden;
  const ratio       = totalCases > 0 ? totalPassed / totalCases : 0;
  const earned      = Math.round(q.points * ratio);
  const correct     = ratio === 1;

  return {
    questionId: q.id,
    earned,
    max:        q.points,
    correct,
    feedback:   correct
      ? undefined
      : `${totalPassed}/${totalCases} test cases passed.`,
  };
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

export type CodeTestMap = Map<string, Array<{ input: string; actual: string; passed: boolean }>>;

export function gradeQuestion(
  q: Question,
  rawAnswer: string,
  codeTests?: CodeTestMap,
): QuestionResult {
  switch (q.type) {
    case 'mcq':       return gradeMCQ(q, rawAnswer);
    case 'multi':     return gradeMulti(q, rawAnswer);
    case 'true-false':return gradeTrueFalse(q, rawAnswer);
    case 'short':     return gradeShort(q, rawAnswer);
    case 'code': {
      const tests = codeTests?.get(q.id) ?? [];
      return gradeCode(q, tests);
    }
  }
}

// ─── Full test/quiz grader ────────────────────────────────────────────────────

export interface AnswerMap { [questionId: string]: string }

export function gradeTest(opts: {
  testId: string;
  courseSlug: string;
  student: string;
  questions: Question[];
  answers: AnswerMap;
  passScore: number;           // percentage 0-100
  codeTests?: CodeTestMap;
}): GradeReport {
  const results: QuestionResult[] = opts.questions.map((q) =>
    gradeQuestion(q, opts.answers[q.id] ?? '', opts.codeTests),
  );

  const totalEarned = results.reduce((s, r) => s + r.earned, 0);
  const totalMax    = results.reduce((s, r) => s + r.max, 0);
  const percentage  = totalMax > 0 ? (totalEarned / totalMax) * 100 : 0;

  return {
    testId:       opts.testId,
    courseSlug:   opts.courseSlug,
    student:      opts.student,
    totalEarned,
    totalMax,
    percentage,
    passed:       percentage >= opts.passScore,
    results,
    gradedAt:     new Date().toISOString(),
  };
}

// ─── Progress bar helper ─────────────────────────────────────────────────────

export function progressBar(pct: number, width = 20): string {
  const filled = Math.round((pct / 100) * width);
  const empty  = width - filled;
  const color  = pct >= 75 ? '🟩' : pct >= 50 ? '🟨' : '🟥';
  return `${color.repeat(filled)}${'⬜'.repeat(empty)} ${pct.toFixed(1)}%`;
}

// ─── Answer parser (from GitHub Issue body) ──────────────────────────────────

/**
 * Parse answers from a GitHub Issue body that uses the quiz-submit template.
 * Expected format:
 *   ### Answer: q1
 *   A
 *
 *   ### Answer: q2
 *   true
 */
export function parseAnswersFromIssueBody(body: string): AnswerMap {
  const map: AnswerMap = {};
  // Match "### Answer: <id>\n<content until next ###>"
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
