#!/usr/bin/env bun
/**
 * stage-02.ts — Grader for Stage 02 (Debugging Assignment)
 *
 * Tests: fix all seeded bugs, tests pass, debug log present, no regressions
 */

import { execSync } from 'child_process';
import * as fs from 'fs';

interface TestResult {
  name: string;
  passed: boolean;
  score: number;
  maxScore: number;
  message?: string;
  hint?: string;
}

function run(cmd: string): { stdout: string; stderr: string; exitCode: number } {
  try {
    const stdout = execSync(cmd, { encoding: 'utf-8', timeout: 30000, stdio: ['pipe', 'pipe', 'pipe'] });
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
    const passed = result === true || result === '';
    tests.push({ name, passed, score: passed ? maxScore : 0, maxScore, message: typeof result === 'string' ? result : undefined });
  } catch (e) {
    tests.push({ name, passed: false, score: 0, maxScore, message: (e as Error).message });
  }
}

// ─── Test Suite ───────────────────────────────────────────────────────────

test('Assignment directory structure intact', 5, () => {
  return fs.existsSync('assignment') || 'No assignment/ directory found. Keep the directory structure.';
});

test('All unit tests pass', 30, () => {
  const r = run('python -m pytest assignment/tests/ -q --tb=no 2>&1 || bun test assignment/ 2>&1 || npm test 2>&1');
  const failed = r.stdout.match(/(\d+) failed/);
  if (failed) return `${failed[1]} test(s) still failing. Fix all bugs before submitting.`;
  const passed = r.stdout.match(/(\d+) passed/);
  return (passed && parseInt(passed[1]!) > 0) || 'No tests found or no tests passed.';
});

test('Bug 1 fixed: off-by-one error', 15, () => {
  const r = run('python -m pytest assignment/tests/test_bug1.py -q --tb=short 2>&1 || bun test assignment/tests/bug1.test.ts 2>&1');
  return r.exitCode === 0 || `Bug 1 tests still failing:\n${r.stdout.slice(0, 300)}`;
});

test('Bug 2 fixed: null/undefined handling', 15, () => {
  const r = run('python -m pytest assignment/tests/test_bug2.py -q --tb=short 2>&1 || bun test assignment/tests/bug2.test.ts 2>&1');
  return r.exitCode === 0 || `Bug 2 tests still failing:\n${r.stdout.slice(0, 300)}`;
});

test('Bug 3 fixed: logic/algorithm error', 15, () => {
  const r = run('python -m pytest assignment/tests/test_bug3.py -q --tb=short 2>&1 || bun test assignment/tests/bug3.test.ts 2>&1');
  return r.exitCode === 0 || `Bug 3 tests still failing:\n${r.stdout.slice(0, 300)}`;
});

test('Debug log or comments explain each fix', 10, () => {
  const debugFiles = ['DEBUG.md', 'BUGS.md', 'debug-log.md'];
  const found = debugFiles.find((f) => fs.existsSync(f));
  if (!found) return 'No debug log found. Create DEBUG.md explaining what each bug was and how you fixed it.';
  const content = fs.readFileSync(found, 'utf-8');
  return content.length > 100 || 'Debug log is too short. Document your debugging process.';
});

test('No debug print statements left in code', 5, () => {
  const r = run('grep -rn "console.log\\|print(" assignment/src/ --include="*.ts" --include="*.py" 2>/dev/null | grep -v "test\\|spec" | wc -l');
  const count = parseInt(r.stdout.trim(), 10);
  return count === 0 || `${count} debug print statement(s) still in source code. Remove them before submitting.`;
});

test('No new test files modified or deleted', 5, () => {
  const r = run('git diff HEAD~1 --name-only -- assignment/tests/');
  const changed = r.stdout.trim().split('\n').filter(Boolean);
  return changed.length === 0 || `Test files were modified: ${changed.join(', ')}. Tests are read-only.`;
});

// ─── Write Results ─────────────────────────────────────────────────────────

const totalScore = tests.reduce((s, t) => s + t.score, 0);
const maxScore = tests.reduce((s, t) => s + t.maxScore, 0);
const passed = totalScore >= maxScore * 0.75;

const report = { passed, score: totalScore, maxScore, percentage: (totalScore / maxScore) * 100, tests, duration: 0, xpEarned: 0 };
fs.writeFileSync(process.env['TEST_OUTPUT_FILE'] ?? '/tmp/test-results.json', JSON.stringify(report, null, 2));

console.log(`\nStage 02: ${totalScore}/${maxScore} (${report.percentage.toFixed(1)}%) — ${passed ? 'PASSED' : 'FAILED'}`);
tests.forEach((t) => console.log(`  ${t.passed ? '✓' : '✗'} ${t.name}: ${t.score}/${t.maxScore}`));
process.exit(passed ? 0 : 1);
