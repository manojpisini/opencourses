#!/usr/bin/env bun
/**
 * quiz-engine.ts — Parse quiz questions, grade answers, handle LLM evaluation
 *
 * Triggered by: .github/workflows/run-quiz.yml
 * Env vars: GITHUB_TOKEN, REPO, ISSUE_NUMBER, STUDENT, STAGE, ANTHROPIC_API_KEY
 */

import { Octokit } from '@octokit/rest';
import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

const octokit = new Octokit({ auth: process.env['GITHUB_TOKEN'] });
const anthropic = new Anthropic({ apiKey: process.env['ANTHROPIC_API_KEY'] });
const [owner, repo] = (process.env['REPO'] ?? '').split('/');
const issueNumber = parseInt(process.env['ISSUE_NUMBER'] ?? '0', 10);
const student = process.env['STUDENT'] ?? '';
const stage = process.env['STAGE'] ?? '01';

interface QuizQuestion {
  id: string;
  type: 'mcq' | 'short' | 'code' | 'essay';
  question: string;
  options?: string[];
  answer?: string | number;
  keywords?: string[];
  points: number;
  llm_grade?: boolean;
}

interface QuizConfig {
  title: string;
  time_limit_minutes: number;
  pass_score: number;
  questions: QuizQuestion[];
}

interface ParsedAnswer {
  questionId: string;
  answer: string;
}

async function loadQuizConfig(): Promise<QuizConfig> {
  const quizPath = path.join('curriculum', `stage-${stage}`, 'quiz', 'questions.yaml');
  const raw = fs.readFileSync(quizPath, 'utf-8');
  return yaml.load(raw) as QuizConfig;
}

async function parseAnswersFromIssue(): Promise<ParsedAnswer[]> {
  const { data: issue } = await octokit.issues.get({ owner, repo, issue_number: issueNumber });
  const body = issue.body ?? '';
  const answers: ParsedAnswer[] = [];

  // Match answer blocks: ### Q1\nanswer text
  const blocks = body.split(/###\s+Q(\d+)/i);
  for (let i = 1; i < blocks.length; i += 2) {
    const qNum = blocks[i]!.trim();
    const answer = blocks[i + 1]?.trim() ?? '';
    answers.push({ questionId: `q${qNum}`, answer });
  }

  return answers;
}

function gradeMCQ(question: QuizQuestion, answer: string): { earned: number; correct: boolean } {
  const userAnswer = answer.trim().toUpperCase();
  const correctAnswer = String(question.answer).trim().toUpperCase();
  const correct = userAnswer === correctAnswer ||
    (question.options && question.options.findIndex((o) =>
      o.toLowerCase().startsWith(userAnswer.toLowerCase())
    ) === Number(question.answer));
  return { earned: correct ? question.points : 0, correct: !!correct };
}

function gradeKeyword(question: QuizQuestion, answer: string): { earned: number; correct: boolean } {
  const lowerAnswer = answer.toLowerCase();
  const matched = (question.keywords ?? []).filter((kw) => lowerAnswer.includes(kw.toLowerCase()));
  const ratio = matched.length / Math.max(1, (question.keywords ?? []).length);
  const earned = Math.round(question.points * ratio);
  return { earned, correct: ratio >= 0.6 };
}

async function gradeLLM(question: QuizQuestion, answer: string): Promise<{ earned: number; correct: boolean; feedback: string }> {
  const prompt = `You are grading a student's quiz answer for an online programming course.

**Question:** ${question.question}
**Expected answer keywords/concepts:** ${question.keywords?.join(', ') ?? 'N/A'}
**Maximum points:** ${question.points}
**Student answer:** ${answer}

Grade the answer on a scale of 0 to ${question.points}. Be fair but strict about technical accuracy.
Respond in JSON: {"score": <number>, "feedback": "<1-2 sentence feedback>"}`;

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 200,
    messages: [{ role: 'user', content: prompt }],
  });

  try {
    const text = message.content[0]?.type === 'text' ? message.content[0].text : '{}';
    const result = JSON.parse(text) as { score: number; feedback: string };
    return {
      earned: Math.min(result.score, question.points),
      correct: result.score >= question.points * 0.6,
      feedback: result.feedback,
    };
  } catch {
    return { earned: 0, correct: false, feedback: 'Could not evaluate answer.' };
  }
}

async function gradeQuiz(config: QuizConfig, answers: ParsedAnswer[]): Promise<{
  score: number; maxScore: number; passed: boolean; results: Array<{ q: QuizQuestion; earned: number; correct: boolean; feedback?: string }>;
}> {
  const answerMap = new Map(answers.map((a) => [a.questionId, a.answer]));
  const results = [];
  let score = 0;
  let maxScore = 0;

  for (const q of config.questions) {
    maxScore += q.points;
    const answer = answerMap.get(q.id) ?? '';

    let earned = 0;
    let correct = false;
    let feedback: string | undefined;

    if (!answer.trim()) {
      results.push({ q, earned: 0, correct: false, feedback: 'No answer provided.' });
      continue;
    }

    if (q.type === 'mcq') {
      ({ earned, correct } = gradeMCQ(q, answer));
    } else if (q.llm_grade) {
      ({ earned, correct, feedback } = await gradeLLM(q, answer));
    } else {
      ({ earned, correct } = gradeKeyword(q, answer));
    }

    score += earned;
    results.push({ q, earned, correct, feedback });
  }

  const passed = (score / maxScore) * 100 >= config.pass_score;
  return { score, maxScore, passed, results };
}

function buildResultComment(config: QuizConfig, score: number, maxScore: number, passed: boolean, results: Array<{ q: QuizQuestion; earned: number; correct: boolean; feedback?: string }>, attempt: number): string {
  const pct = ((score / maxScore) * 100).toFixed(1);
  const status = passed ? '✅ PASSED' : '❌ FAILED';

  const breakdown = results
    .map((r) => {
      const icon = r.correct ? '✅' : '❌';
      const fb = r.feedback ? ` — _${r.feedback}_` : '';
      return `| ${icon} | ${r.q.id.toUpperCase()} | ${r.earned}/${r.q.points} |${fb} |`;
    })
    .join('\n');

  const retryNote = !passed && attempt < 3
    ? `\n\n> You have ${3 - attempt} quiz attempt(s) remaining. Review the material and try again.`
    : !passed
    ? '\n\n> Maximum quiz attempts reached. Contact an instructor for a manual review.'
    : '';

  return `## ${status} — Stage ${stage} Quiz Results

**Student:** @${student} · **Score:** ${score}/${maxScore} (${pct}%) · **Pass threshold:** ${config.pass_score}%

| Result | Question | Score | Feedback |
|--------|----------|-------|----------|
${breakdown}
${retryNote}
${passed ? '\n🎉 Quiz passed! Your stage progress has been updated.' : ''}
---
_Quiz graded automatically · Attempt ${attempt}/3_`;
}

function writeOutputs(passed: boolean, score: number, maxScore: number) {
  const outputs = [`passed=${passed}`, `score=${score}`, `max_score=${maxScore}`];
  const outputFile = process.env['GITHUB_OUTPUT'];
  if (outputFile) {
    fs.appendFileSync(outputFile, outputs.join('\n') + '\n');
  }
}

function appendAuditLog(passed: boolean, score: number, maxScore: number, attempt: number) {
  const entry = JSON.stringify({
    ts: new Date().toISOString(),
    event: 'quiz',
    actor: student,
    subject: `issue:${issueNumber}`,
    stage,
    attempt,
    score,
    max_score: maxScore,
    passed,
    run_id: process.env['GITHUB_RUN_ID'],
  });
  const logPath = path.join('audit', 'log.jsonl');
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.appendFileSync(logPath, entry + '\n');
}

async function getAttemptCount(): Promise<number> {
  const { data: comments } = await octokit.issues.listComments({ owner, repo, issue_number: issueNumber });
  return comments.filter((c) => c.body?.includes('Quiz Results')).length + 1;
}

async function main() {
  console.log(`Grading Stage ${stage} quiz for @${student} (issue #${issueNumber})`);

  const config = await loadQuizConfig();
  const answers = await parseAnswersFromIssue();
  const attempt = await getAttemptCount();
  const { score, maxScore, passed, results } = await gradeQuiz(config, answers);

  const comment = buildResultComment(config, score, maxScore, passed, results, attempt);
  await octokit.issues.createComment({ owner, repo, issue_number: issueNumber, body: comment });

  writeOutputs(passed, score, maxScore);
  appendAuditLog(passed, score, maxScore, attempt);

  console.log(`✓ Quiz graded: ${score}/${maxScore} — ${passed ? 'PASSED' : 'FAILED'}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
