#!/usr/bin/env bun
/**
 * stage-03.ts — Grader for Stage 03 (Code Review Assignment)
 *
 * Tests: review quality, inline comments, REVIEW.md completeness, coverage
 */

import * as fs from 'fs';

interface TestResult {
  name: string;
  passed: boolean;
  score: number;
  maxScore: number;
  message?: string;
}

const tests: TestResult[] = [];

function test(name: string, maxScore: number, fn: () => boolean | string): void {
  try {
    const result = fn();
    const passed = result === true;
    tests.push({ name, passed, score: passed ? maxScore : 0, maxScore, message: typeof result === 'string' ? result : undefined });
  } catch (e) {
    tests.push({ name, passed: false, score: 0, maxScore, message: (e as Error).message });
  }
}

function readIfExists(file: string): string {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf-8') : '';
}

// ─── Test Suite ───────────────────────────────────────────────────────────

test('REVIEW.md file exists', 10, () => {
  return fs.existsSync('REVIEW.md') || 'Create REVIEW.md with your structured code review.';
});

test('REVIEW.md covers bugs/correctness section', 15, () => {
  const content = readIfExists('REVIEW.md');
  const hasBugs = /bug|error|incorrect|fix|wrong|issue/i.test(content);
  return hasBugs || 'REVIEW.md should include a section on bugs or correctness issues found.';
});

test('REVIEW.md covers code style/readability', 15, () => {
  const content = readIfExists('REVIEW.md');
  const hasStyle = /style|readab|naming|clean|format|comment/i.test(content);
  return hasStyle || 'REVIEW.md should comment on code style and readability.';
});

test('REVIEW.md covers performance or security', 15, () => {
  const content = readIfExists('REVIEW.md');
  const hasPerfOrSec = /performance|security|complexity|O\(|exploit|vulnerab|injection/i.test(content);
  return hasPerfOrSec || 'REVIEW.md should include at least one performance or security observation.';
});

test('REVIEW.md has actionable suggestions (not just criticism)', 15, () => {
  const content = readIfExists('REVIEW.md');
  const hasSuggestions = /suggest|recommend|consider|could|should|try|alternative|instead/i.test(content);
  return hasSuggestions || 'Provide concrete suggestions, not just problems. Say what should be done instead.';
});

test('REVIEW.md is substantive (>300 words)', 10, () => {
  const content = readIfExists('REVIEW.md');
  const words = content.split(/\s+/).filter(Boolean).length;
  return words >= 300 || `Review is only ${words} words. Aim for at least 300 for a thorough review.`;
});

test('Review uses inline code examples', 10, () => {
  const content = readIfExists('REVIEW.md');
  const hasCode = /```/.test(content) || /`[^`]+`/.test(content);
  return hasCode || 'Include inline code examples to illustrate your points.';
});

test('Positive feedback included (not all criticism)', 10, () => {
  const content = readIfExists('REVIEW.md');
  const hasPositive = /good|great|well done|nice|clean|clear|excellent|kudos|strength/i.test(content);
  return hasPositive || 'Include at least one positive observation. Good reviews are balanced.';
});

// ─── Write Results ─────────────────────────────────────────────────────────

const totalScore = tests.reduce((s, t) => s + t.score, 0);
const maxScore = tests.reduce((s, t) => s + t.maxScore, 0);
const passed = totalScore >= maxScore * 0.75;

const report = { passed, score: totalScore, maxScore, percentage: (totalScore / maxScore) * 100, tests, duration: 0, xpEarned: 0 };
fs.writeFileSync(process.env['TEST_OUTPUT_FILE'] ?? '/tmp/test-results.json', JSON.stringify(report, null, 2));

console.log(`\nStage 03: ${totalScore}/${maxScore} — ${passed ? 'PASSED' : 'FAILED'}`);
tests.forEach((t) => console.log(`  ${t.passed ? '✓' : '✗'} ${t.name}: ${t.score}/${t.maxScore}${t.message ? ` — ${t.message}` : ''}`));
process.exit(passed ? 0 : 1);
