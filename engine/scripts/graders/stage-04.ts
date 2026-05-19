#!/usr/bin/env bun
/**
 * stage-04.ts — Grader for Stage 04 (Advanced Assignment / Integration)
 *
 * Tests: correctness, test coverage, documentation, API design, error handling
 */

import { execSync } from 'child_process';
import * as fs from 'fs';

interface TestResult {
  name: string;
  passed: boolean;
  score: number;
  maxScore: number;
  message?: string;
}

function run(cmd: string): { stdout: string; stderr: string; exitCode: number } {
  try {
    const stdout = execSync(cmd, { encoding: 'utf-8', timeout: 60000, stdio: ['pipe', 'pipe', 'pipe'] });
    return { stdout, stderr: '', exitCode: 0 };
  } catch (e: unknown) {
    const err = e as { stdout?: string; stderr?: string; status?: number };
    return { stdout: err.stdout ?? '', stderr: err.stderr ?? '', exitCode: err.status ?? 1 };
  }
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

// ─── Test Suite ───────────────────────────────────────────────────────────

test('All required tests pass', 25, () => {
  const r = run('bun test 2>&1 || npm test 2>&1 || python -m pytest -q --tb=no 2>&1');
  const failed = r.stdout.match(/(\d+) failed/);
  return !failed || `${failed[1]} test(s) failing. Fix all before submitting.`;
});

test('Test coverage ≥ 70%', 15, () => {
  const r = run('bun test --coverage 2>&1 || python -m pytest --cov=. --cov-report=term-missing -q 2>&1');
  const covMatch = r.stdout.match(/(\d+(?:\.\d+)?)\s*%/);
  if (!covMatch) return 'Could not determine test coverage. Ensure coverage tooling is set up.';
  const cov = parseFloat(covMatch[1]!);
  return cov >= 70 || `Coverage is ${cov}%. Aim for at least 70%.`;
});

test('Error handling is implemented', 15, () => {
  const r = run('grep -rn "try\\|catch\\|except\\|Error\\|throw" assignment/src/ 2>/dev/null | wc -l');
  const count = parseInt(r.stdout.trim(), 10);
  return count >= 3 || 'Add proper error handling (try/catch blocks) to handle edge cases.';
});

test('TypeScript/Python types are used (no any/untyped)', 10, () => {
  const tsAny = run('grep -rn ": any\\|as any" assignment/src/ --include="*.ts" 2>/dev/null | wc -l');
  const anyCount = parseInt(tsAny.stdout.trim(), 10);
  return anyCount === 0 || `${anyCount} use(s) of \`any\` found. Use proper types throughout.`;
});

test('API or module has clear documentation (JSDoc/docstrings)', 10, () => {
  const r = run('grep -rn "/\\*\\*\\|@param\\|@returns\\|"""\\|\'\'\'\\|#:" assignment/src/ 2>/dev/null | wc -l');
  const count = parseInt(r.stdout.trim(), 10);
  return count >= 3 || 'Add JSDoc comments or docstrings to document your functions and types.';
});

test('No hardcoded credentials or secrets', 10, () => {
  const r = run('grep -rni "password\\s*=\\s*[\"\']\|api_key\\s*=\\s*[\"\']\|secret\\s*=\\s*[\"\']\|token\\s*=\\s*[\"\']\|sk-" assignment/src/ 2>/dev/null | grep -v "\\.test\\.\|spec\\." | wc -l');
  const count = parseInt(r.stdout.trim(), 10);
  return count === 0 || `${count} potential hardcoded secret(s) found. Use environment variables.`;
});

test('Edge cases handled (empty input, null, limits)', 10, () => {
  const r = run('grep -rn "null\\|undefined\\|empty\\|length === 0\\|len(\\|isEmpty" assignment/src/ 2>/dev/null | wc -l');
  const count = parseInt(r.stdout.trim(), 10);
  return count >= 2 || 'Handle edge cases: empty inputs, null values, and boundary conditions.';
});

test('README documents usage with examples', 5, () => {
  if (!fs.existsSync('README.md')) return 'README.md not found.';
  const content = fs.readFileSync('README.md', 'utf-8');
  const hasExamples = /```|example|usage|$ |npm run|bun run/i.test(content);
  return hasExamples || 'Add usage examples to README.md.';
});

// ─── Write Results ─────────────────────────────────────────────────────────

const totalScore = tests.reduce((s, t) => s + t.score, 0);
const maxScore = tests.reduce((s, t) => s + t.maxScore, 0);
const passed = totalScore >= maxScore * 0.75;

const report = { passed, score: totalScore, maxScore, percentage: (totalScore / maxScore) * 100, tests, duration: 0, xpEarned: 0 };
fs.writeFileSync(process.env['TEST_OUTPUT_FILE'] ?? '/tmp/test-results.json', JSON.stringify(report, null, 2));

console.log(`\nStage 04: ${totalScore}/${maxScore} — ${passed ? 'PASSED' : 'FAILED'}`);
tests.forEach((t) => console.log(`  ${t.passed ? '✓' : '✗'} ${t.name}: ${t.score}/${t.maxScore}`));
process.exit(passed ? 0 : 1);
