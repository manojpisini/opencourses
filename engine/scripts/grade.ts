#!/usr/bin/env bun
/**
 * grade.ts — Parse Docker sandbox test output and post a grading report.
 * Replaces the old XP/stage system — grading is now score-based only.
 *
 * Triggered by: .github/workflows/grade-assignment.yml (after docker run)
 * Env vars: GITHUB_TOKEN, REPO, PR_NUMBER, STUDENT, COURSE_SLUG, PROJECT_ID,
 *           TEST_OUTPUT_FILE (optional, default /tmp/test-results.json)
 */

import * as fs   from 'fs';
import * as path from 'path';
import { parseCourseFile } from '../lib/course-parser.ts';
import { progressBar } from '../lib/scoring.ts';
import { makeOctokit, repoFromEnv, postComment, addLabels, findEnrollmentIssue, setOutput } from '../lib/github.ts';

const octokit    = makeOctokit();
const { owner, repo } = repoFromEnv();
const prNumber   = parseInt(process.env['PR_NUMBER']   ?? '0', 10);
const student    = process.env['STUDENT']    ?? '';
const courseSlug = process.env['COURSE_SLUG'] ?? '';
const projectId  = process.env['PROJECT_ID'] ?? '';
const testOutputFile = process.env['TEST_OUTPUT_FILE'] ?? '/tmp/test-results.json';

interface SandboxTestResult {
  name:     string;
  passed:   boolean;
  score:    number;
  maxScore: number;
  message?: string;
  hidden?:  boolean;
}

interface SandboxOutput {
  passed:      boolean;
  score:       number;
  maxScore:    number;
  duration?:   number;
  tests:       SandboxTestResult[];
}

function parseSandboxOutput(): SandboxOutput {
  try {
    const raw = fs.readFileSync(testOutputFile, 'utf-8');
    return JSON.parse(raw) as SandboxOutput;
  } catch {
    // Fallback: try pytest-style stdout
    const stdout = process.env['TEST_OUTPUT'] ?? '';
    const passedMatch = stdout.match(/(\d+)\s+passed/);
    const failedMatch = stdout.match(/(\d+)\s+failed/);
    const passed = parseInt(passedMatch?.[1] ?? '0', 10);
    const failed = parseInt(failedMatch?.[1] ?? '0', 10);
    const total  = passed + failed;
    return {
      passed:   failed === 0,
      score:    passed,
      maxScore: total || 1,
      tests:    [],
    };
  }
}

function loadProjectPassScore(): number {
  if (!courseSlug || !projectId) return 75;
  const paths = [`engine/courses/${courseSlug}/course.md`, `courses/${courseSlug}/course.md`];
  for (const p of paths) {
    if (!fs.existsSync(p)) continue;
    try {
      const { course } = parseCourseFile(p);
      for (const ch of course.chapters) {
        if (ch.project?.id === projectId) return ch.project.pass_score;
      }
    } catch { /* ignore */ }
  }
  return 75;
}

function buildComment(out: SandboxOutput, passScore: number): string {
  const pct    = out.maxScore > 0 ? (out.score / out.maxScore) * 100 : 0;
  const passed = pct >= passScore;
  const bar    = progressBar(pct);
  const status = passed ? '✅ PASSED' : '❌ FAILED';

  const visibleTests = out.tests.filter((t) => !t.hidden);
  const testTable = visibleTests.length > 0
    ? `\n| Status | Test | Score |\n|--------|------|-------|\n${visibleTests.map((t) =>
        `| ${t.passed ? '✅' : '❌'} | ${t.name} | ${t.score}/${t.maxScore} |`
      ).join('\n')}\n`
    : '';

  const hiddenCount = out.tests.filter((t) => t.hidden).length;
  const hiddenNote  = hiddenCount > 0
    ? `\n> _${hiddenCount} hidden test(s) also ran._\n`
    : '';

  const nextStep = passed
    ? `\n## 🎉 Project Passed!\n\nYour submission for **${projectId}** has been accepted.`
    : `\n## 💡 Next Steps\n\n- Review failing tests and fix your implementation\n- Push another commit to this PR to re-grade\n- Pass score: **${passScore}%** (your score: **${pct.toFixed(1)}%**)`;

  return `## ${status} — Project: \`${projectId}\`

**Student:** @${student} · **Course:** \`${courseSlug}\` · **Score:** ${out.score}/${out.maxScore} (${pct.toFixed(1)}%)

${bar}
${testTable}${hiddenNote}
${nextStep}

---
_Graded in isolated Docker sandbox · [View logs](../../actions/runs/${process.env['GITHUB_RUN_ID']}/)_`;
}

async function main() {
  console.log(`Grading project "${projectId}" for @${student} (PR #${prNumber})`);

  const out       = parseSandboxOutput();
  const passScore = loadProjectPassScore();
  const pct       = out.maxScore > 0 ? (out.score / out.maxScore) * 100 : 0;
  const passed    = pct >= passScore;

  console.log(`Score: ${out.score}/${out.maxScore} (${pct.toFixed(1)}%) — ${passed ? 'PASSED' : 'FAILED'}`);

  // Post comment
  const comment = buildComment(out, passScore);
  await octokit.issues.createComment({ owner, repo, issue_number: prNumber, body: comment });

  // Update enrollment labels on pass
  if (passed && courseSlug) {
    const enrollment = await findEnrollmentIssue(octokit, owner, repo, student, courseSlug);
    if (enrollment) {
      await addLabels(octokit, owner, repo, enrollment.number, [`project-${projectId}-passed`]);
    }
  }

  // Audit
  const entry = JSON.stringify({
    ts: new Date().toISOString(), event: 'project-grade',
    actor: student, subject: `pr:${prNumber}`,
    course: courseSlug, project: projectId,
    score: out.score, max_score: out.maxScore,
    percentage: pct, passed,
    run_id: process.env['GITHUB_RUN_ID'],
  });
  fs.mkdirSync('audit', { recursive: true });
  fs.appendFileSync(path.join('audit', 'log.jsonl'), entry + '\n');

  setOutput('passed',     passed);
  setOutput('score',      out.score);
  setOutput('max_score',  out.maxScore);
  setOutput('percentage', pct.toFixed(1));

  console.log(`✓ Grading report posted to PR #${prNumber}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
