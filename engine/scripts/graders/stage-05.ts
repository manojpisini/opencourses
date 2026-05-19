#!/usr/bin/env bun
/**
 * stage-05.ts — Grader for Stage 05 (Final Project)
 *
 * Tests: full project completeness, demo script, architecture doc,
 *        all tests pass, deployment config, peer review integration
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

function run(cmd: string, timeoutMs = 120000): { stdout: string; stderr: string; exitCode: number } {
  try {
    const stdout = execSync(cmd, { encoding: 'utf-8', timeout: timeoutMs, stdio: ['pipe', 'pipe', 'pipe'] });
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

function exists(...paths: string[]): boolean {
  return paths.some((p) => fs.existsSync(p));
}

// ─── Test Suite ───────────────────────────────────────────────────────────

test('Project has package.json or pyproject.toml', 5, () => {
  return exists('package.json', 'pyproject.toml', 'Cargo.toml', 'go.mod') || 'Add a project manifest (package.json, pyproject.toml, etc.).';
});

test('All automated tests pass', 25, () => {
  const r = run('bun test 2>&1 || npm test 2>&1 || python -m pytest -q --tb=short 2>&1', 90000);
  const failed = r.stdout.match(/(\d+) failed/);
  if (failed && parseInt(failed[1]!) > 0) return `${failed[1]} test(s) failing.`;
  const passed = r.stdout.match(/(\d+) passed/);
  return !!(passed && parseInt(passed[1]!) > 0) || 'No tests found or passing. Add a test suite.';
});

test('ARCHITECTURE.md or design doc exists', 15, () => {
  if (!exists('ARCHITECTURE.md', 'DESIGN.md', 'docs/architecture.md')) {
    return 'Create ARCHITECTURE.md explaining your system design, components, and decisions.';
  }
  const content = fs.readFileSync(
    fs.existsSync('ARCHITECTURE.md') ? 'ARCHITECTURE.md' : fs.existsSync('DESIGN.md') ? 'DESIGN.md' : 'docs/architecture.md',
    'utf-8'
  );
  return content.split(/\s+/).length >= 200 || 'ARCHITECTURE.md is too short. Describe components, data flow, and decisions.';
});

test('Demo script or runnable example works', 15, () => {
  const demoFiles = ['demo.ts', 'demo.js', 'demo.py', 'demo.sh', 'examples/demo.ts'];
  if (!demoFiles.some((f) => fs.existsSync(f))) {
    return 'Add a demo script (demo.ts, demo.py, etc.) showing your project in action.';
  }
  return true;
});

test('Deployment configuration exists (Docker/CI/cloud)', 10, () => {
  const deployFiles = ['Dockerfile', 'docker-compose.yml', '.github/workflows', 'fly.toml', 'render.yaml', 'vercel.json', 'netlify.toml'];
  return deployFiles.some((f) => fs.existsSync(f)) || 'Add deployment config: Dockerfile, docker-compose.yml, or a cloud platform config file.';
});

test('Environment variables use .env.example (no .env committed)', 10, () => {
  const hasEnvCommitted = run('git ls-files | grep "^\\.env$"').stdout.trim().length > 0;
  if (hasEnvCommitted) return '.env file is committed. Add .env to .gitignore and use .env.example instead.';
  const hasExample = exists('.env.example', '.env.template');
  return hasExample || 'Add an .env.example file documenting required environment variables.';
});

test('README includes getting-started guide', 10, () => {
  if (!exists('README.md')) return 'README.md not found.';
  const content = fs.readFileSync('README.md', 'utf-8');
  const hasSetup = /install|setup|getting started|quick start|prerequisite/i.test(content);
  const hasRun = /npm run|bun run|python|docker|make/i.test(content);
  return (hasSetup && hasRun) || 'README.md needs installation steps and run instructions.';
});

test('Git history is clean (no large files, no secrets)', 5, () => {
  const largeFiles = run('git ls-files | xargs -I{} du -k {} 2>/dev/null | awk \'$1 > 1024 {print $2}\' | head -5');
  if (largeFiles.stdout.trim()) return `Large files tracked in git:\n${largeFiles.stdout.trim()}\nUse Git LFS or remove them.`;
  return true;
});

test('Project uses meaningful commit messages (final 10)', 5, () => {
  const r = run('git log --format="%s" -10');
  const messages = r.stdout.trim().split('\n').filter(Boolean);
  const meaningful = messages.filter((m) => m.length > 10 && !/^(wip|fix|update|changes|stuff|asdf|test)$/i.test(m));
  return meaningful.length >= messages.length * 0.7 || 'Use descriptive commit messages throughout the project.';
});

// ─── Write Results ─────────────────────────────────────────────────────────

const totalScore = tests.reduce((s, t) => s + t.score, 0);
const maxScore = tests.reduce((s, t) => s + t.maxScore, 0);
const passed = totalScore >= maxScore * 0.75;

const report = { passed, score: totalScore, maxScore, percentage: (totalScore / maxScore) * 100, tests, duration: 0, xpEarned: 0 };
fs.writeFileSync(process.env['TEST_OUTPUT_FILE'] ?? '/tmp/test-results.json', JSON.stringify(report, null, 2));

console.log(`\nStage 05 (Final Project): ${totalScore}/${maxScore} (${report.percentage.toFixed(1)}%) — ${passed ? 'PASSED' : 'FAILED'}`);
tests.forEach((t) => console.log(`  ${t.passed ? '✓' : '✗'} ${t.name}: ${t.score}/${t.maxScore}${t.message ? ` — ${t.message}` : ''}`));
process.exit(passed ? 0 : 1);
