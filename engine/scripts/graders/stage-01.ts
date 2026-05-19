#!/usr/bin/env bun
/**
 * stage-01.ts — Grader for Stage 01 (Git & Version Control Fundamentals)
 *
 * Tests: branching, committing, merging, conflict resolution, .gitignore
 * Called by Docker sandbox via: bun run scripts/graders/stage-01.ts
 * Outputs: /tmp/test-results.json
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
    const stdout = execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    return { stdout, stderr: '', exitCode: 0 };
  } catch (e: unknown) {
    const err = e as { stdout?: string; stderr?: string; status?: number };
    return {
      stdout: err.stdout ?? '',
      stderr: err.stderr ?? '',
      exitCode: err.status ?? 1,
    };
  }
}

const tests: TestResult[] = [];

function test(name: string, maxScore: number, fn: () => boolean | string): void {
  try {
    const result = fn();
    const passed = result === true || result === '';
    const message = typeof result === 'string' ? result : undefined;
    tests.push({ name, passed, score: passed ? maxScore : 0, maxScore, message });
  } catch (e) {
    tests.push({ name, passed: false, score: 0, maxScore, message: (e as Error).message });
  }
}

// ─── Test Suite ───────────────────────────────────────────────────────────

test('Git repo is initialized', 10, () => {
  const r = run('git rev-parse --git-dir');
  return r.exitCode === 0 || 'No .git directory found. Run `git init` in the assignment folder.';
});

test('At least 5 commits in history', 15, () => {
  const r = run('git log --oneline');
  const count = (r.stdout.match(/\n/g) ?? []).length + (r.stdout.trim() ? 1 : 0);
  return count >= 5 || `Only ${count} commits found. Create at least 5 meaningful commits.`;
});

test('Commit messages follow conventional format', 10, () => {
  const r = run('git log --format="%s" -10');
  const messages = r.stdout.trim().split('\n').filter(Boolean);
  const conventional = /^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?: .+/;
  const passing = messages.filter((m) => conventional.test(m));
  return passing.length >= messages.length * 0.6 || `Only ${passing.length}/${messages.length} commits follow conventional format (type: description).`;
});

test('Feature branch exists (not just main/master)', 15, () => {
  const r = run('git branch -a');
  const branches = r.stdout.split('\n').map((b) => b.trim().replace(/^\* /, ''));
  const hasFeature = branches.some((b) => b && !['main', 'master', 'HEAD'].includes(b) && !b.includes('->'));
  return hasFeature || 'No feature branch found. Create a branch with `git checkout -b feature/your-feature`.';
});

test('.gitignore file exists and ignores common patterns', 10, () => {
  if (!fs.existsSync('.gitignore')) return 'No .gitignore file found.';
  const content = fs.readFileSync('.gitignore', 'utf-8');
  const hasNodeModules = content.includes('node_modules');
  const hasDotEnv = content.includes('.env');
  if (!hasNodeModules && !hasDotEnv) return '.gitignore should ignore at least node_modules and .env files.';
  return true;
});

test('Merge commit exists in history', 15, () => {
  const r = run('git log --merges --oneline');
  const hasMerge = r.stdout.trim().length > 0;
  return hasMerge || 'No merge commits found. Merge your feature branch into main using `git merge`.';
});

test('No binary files tracked in git (only source)', 10, () => {
  const r = run('git ls-files --eol');
  const binaries = r.stdout.split('\n').filter((l) => l.includes('binary'));
  return binaries.length === 0 || `${binaries.length} binary file(s) tracked. Add images/binaries to .gitignore.`;
});

test('README.md exists and is non-empty', 10, () => {
  if (!fs.existsSync('README.md')) return 'README.md not found. Create one documenting your project.';
  const content = fs.readFileSync('README.md', 'utf-8');
  return content.trim().length > 50 || 'README.md is too short. Add a meaningful description.';
});

test('Tag exists marking a version', 5, () => {
  const r = run('git tag');
  const hasTags = r.stdout.trim().length > 0;
  return hasTags || 'No git tags found. Create a version tag with `git tag v1.0.0`.';
});

// ─── Write Results ─────────────────────────────────────────────────────────

const totalScore = tests.reduce((s, t) => s + t.score, 0);
const maxScore = tests.reduce((s, t) => s + t.maxScore, 0);
const passed = totalScore >= maxScore * 0.75;

const report = {
  passed,
  score: totalScore,
  maxScore,
  percentage: (totalScore / maxScore) * 100,
  tests,
  duration: 0,
  xpEarned: 0,
};

const outputPath = process.env['TEST_OUTPUT_FILE'] ?? '/tmp/test-results.json';
fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

console.log(`\nStage 01 Results: ${totalScore}/${maxScore} (${report.percentage.toFixed(1)}%) — ${passed ? 'PASSED' : 'FAILED'}`);
tests.forEach((t) => console.log(`  ${t.passed ? '✓' : '✗'} ${t.name}: ${t.score}/${t.maxScore}${t.message ? ` — ${t.message}` : ''}`));

process.exit(passed ? 0 : 1);
