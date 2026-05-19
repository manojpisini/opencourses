#!/usr/bin/env bun
/**
 * grade.ts — Parse Docker sandbox test output and post grading report
 *
 * Triggered by: .github/workflows/grade-assignment.yml (after docker run)
 * Env vars: GITHUB_TOKEN, REPO, PR_NUMBER, STUDENT, STAGE, ATTEMPT, TEST_OUTPUT
 */

import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import * as path from 'path';

const octokit = new Octokit({ auth: process.env['GITHUB_TOKEN'] });
const [owner, repo] = (process.env['REPO'] ?? '').split('/');
const prNumber = parseInt(process.env['PR_NUMBER'] ?? '0', 10);
const student = process.env['STUDENT'] ?? '';
const stage = process.env['STAGE'] ?? '01';
const attempt = parseInt(process.env['ATTEMPT'] ?? '1', 10);
const testOutputFile = process.env['TEST_OUTPUT_FILE'] ?? '/tmp/test-results.json';

interface TestResult {
  name: string;
  passed: boolean;
  score: number;
  maxScore: number;
  message?: string;
  hint?: string;
}

interface GradeReport {
  passed: boolean;
  score: number;
  maxScore: number;
  percentage: number;
  tests: TestResult[];
  duration: number;
  xpEarned: number;
}

const PASS_THRESHOLD = 0.75; // 75% to pass
const STAGE_XP: Record<string, number> = {
  '01': 100, '02': 150, '03': 200, '04': 250, '05': 400,
};

function parseTestOutput(): GradeReport {
  let raw: GradeReport;
  try {
    const content = fs.readFileSync(testOutputFile, 'utf-8');
    raw = JSON.parse(content) as GradeReport;
  } catch {
    // Fallback: parse pytest-style output from env
    const output = process.env['TEST_OUTPUT'] ?? '';
    const passedMatch = output.match(/(\d+) passed/);
    const failedMatch = output.match(/(\d+) failed/);
    const passed = parseInt(passedMatch?.[1] ?? '0', 10);
    const failed = parseInt(failedMatch?.[1] ?? '0', 10);
    const total = passed + failed;
    raw = {
      passed: failed === 0,
      score: passed,
      maxScore: total,
      percentage: total > 0 ? (passed / total) * 100 : 0,
      tests: [],
      duration: 0,
      xpEarned: 0,
    };
  }

  const percentage = raw.maxScore > 0 ? (raw.score / raw.maxScore) * 100 : 0;
  const passed = percentage >= PASS_THRESHOLD * 100;
  const xpEarned = passed ? (STAGE_XP[stage] ?? 100) : Math.floor((STAGE_XP[stage] ?? 100) * percentage / 100);

  return { ...raw, percentage, passed, xpEarned };
}

function formatTestTable(tests: TestResult[]): string {
  if (tests.length === 0) return '';
  const rows = tests
    .map((t) => `| ${t.passed ? '✅' : '❌'} | ${t.name} | ${t.score}/${t.maxScore} | ${t.hint ?? t.message ?? ''} |`)
    .join('\n');
  return `\n| Status | Test | Score | Notes |\n|--------|------|-------|-------|\n${rows}\n`;
}

function buildComment(report: GradeReport): string {
  const bar = buildProgressBar(report.percentage);
  const status = report.passed ? '✅ PASSED' : '❌ FAILED';
  const attemptNote = attempt > 1 ? `\n> **Attempt ${attempt}/5**\n` : '';

  const failureHelp = !report.passed
    ? `\n## 💡 Next Steps\n\n- Review the failing tests above and their hints\n- Check [Stage ${stage} README](../curriculum/stage-${stage}/README.md) for guidance\n- Ask for help: [Open a support issue](../../issues/new?template=support.yml)\n- You have ${5 - attempt} attempt(s) remaining\n`
    : `\n## 🎉 Stage ${stage} Complete!\n\nYou earned **${report.xpEarned} XP**. The next stage will be unlocked automatically.\n`;

  return `## ${status} — Stage ${stage} Grading Report

**Student:** @${student} · **Stage:** ${stage} · **Score:** ${report.score}/${report.maxScore} (${report.percentage.toFixed(1)}%)
${attemptNote}
${bar}
${formatTestTable(report.tests)}
**XP Earned:** ${report.xpEarned} XP${report.duration ? ` · **Runtime:** ${report.duration}ms` : ''}
${failureHelp}
---
_Graded automatically in an isolated Docker sandbox · [View run logs](../../actions/runs/${process.env['GITHUB_RUN_ID']}/)_`;
}

function buildProgressBar(pct: number): string {
  const filled = Math.round(pct / 5);
  const empty = 20 - filled;
  const color = pct >= 75 ? '🟩' : pct >= 50 ? '🟨' : '🟥';
  return `${color.repeat(filled)}⬜️.repeat(${empty}) ${pct.toFixed(1)}%`
    .replace(`⬜️.repeat(${empty})`, '⬜️'.repeat(empty));
}

function writeOutputs(report: GradeReport) {
  const outputs = [
    `passed=${report.passed}`,
    `score=${report.score}`,
    `max_score=${report.maxScore}`,
    `percentage=${report.percentage.toFixed(1)}`,
    `xp_earned=${report.xpEarned}`,
  ];
  const outputFile = process.env['GITHUB_OUTPUT'];
  if (outputFile) {
    fs.appendFileSync(outputFile, outputs.join('\n') + '\n');
  } else {
    outputs.forEach((o) => console.log(`::set-output name=${o.split('=')[0]}::${o.split('=')[1]}`));
  }
}

function appendAuditLog(report: GradeReport) {
  const entry = JSON.stringify({
    ts: new Date().toISOString(),
    event: 'grade',
    actor: student,
    subject: `pr:${prNumber}`,
    stage,
    attempt,
    score: report.score,
    max_score: report.maxScore,
    passed: report.passed,
    xp_earned: report.xpEarned,
    run_id: process.env['GITHUB_RUN_ID'],
  });
  const logPath = path.join('audit', 'log.jsonl');
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.appendFileSync(logPath, entry + '\n');
}

async function main() {
  console.log(`Grading Stage ${stage} submission by @${student} (attempt ${attempt})`);

  const report = parseTestOutput();
  console.log(`Score: ${report.score}/${report.maxScore} (${report.percentage.toFixed(1)}%) — ${report.passed ? 'PASSED' : 'FAILED'}`);

  const comment = buildComment(report);
  await octokit.issues.createComment({ owner, repo, issue_number: prNumber, body: comment });

  writeOutputs(report);
  appendAuditLog(report);

  console.log(`✓ Grading report posted to PR #${prNumber}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
