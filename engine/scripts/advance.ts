#!/usr/bin/env bun
/**
 * advance.ts — Stage advancement logic: update labels, post unlock comment
 *
 * Triggered by: .github/workflows/advance-stage.yml (workflow_dispatch)
 * Env vars: GITHUB_TOKEN, REPO, STUDENT, STAGE, TRIGGER, SCORE
 */

import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import * as path from 'path';

const octokit = new Octokit({ auth: process.env['GITHUB_TOKEN'] });
const [owner, repo] = (process.env['REPO'] ?? '').split('/');
const student = process.env['STUDENT'] ?? '';
const stage = process.env['STAGE'] ?? '01';
const trigger = process.env['TRIGGER'] ?? 'assignment';
const score = parseFloat(process.env['SCORE'] ?? '0');

const STAGES = ['01', '02', '03', '04', '05'];
const FINAL_STAGE = '05';

function nextStage(current: string): string | null {
  const idx = STAGES.indexOf(current);
  return idx >= 0 && idx < STAGES.length - 1 ? STAGES[idx + 1]! : null;
}

function isAllComplete(current: string): boolean {
  return current === FINAL_STAGE;
}

async function findEnrollmentIssue(): Promise<number | null> {
  const { data: issues } = await octokit.issues.listForRepo({
    owner, repo, state: 'open',
    labels: `enrolled,course:${process.env['COURSE'] ?? ''}`,
    per_page: 100,
  });
  const issue = issues.find((i) => i.user?.login === student || i.title.includes(`@${student}`));
  return issue?.number ?? null;
}

async function findEnrollmentIssueByStudent(): Promise<number | null> {
  // Search by label combination
  const { data: issues } = await octokit.issues.listForRepo({
    owner, repo, state: 'open',
    labels: `enrolled,stage-${stage}-unlocked`,
    per_page: 100,
  });
  const issue = issues.find(
    (i) => i.user?.login === student || i.title.toLowerCase().includes(student.toLowerCase())
  );
  return issue?.number ?? null;
}

async function updateLabels(issueNumber: number, completedStage: string, next: string | null) {
  const labelsToAdd: string[] = [`stage-${completedStage}-passed`];
  const labelsToRemove: string[] = [`stage-${completedStage}-unlocked`];

  if (next) {
    labelsToAdd.push(`stage-${next}-unlocked`);
  } else {
    labelsToAdd.push('all-stages-complete', 'pending-certification');
  }

  // Ensure new labels exist
  for (const label of labelsToAdd) {
    try {
      await octokit.issues.getLabel({ owner, repo, name: label });
    } catch {
      await octokit.issues.createLabel({
        owner, repo, name: label,
        color: label.includes('passed') ? '2ea44f' : label.includes('unlocked') ? 'fbca04' : 'e11d48',
      });
    }
  }

  await octokit.issues.addLabels({ owner, repo, issue_number: issueNumber, labels: labelsToAdd });

  // Remove old labels
  for (const label of labelsToRemove) {
    try {
      await octokit.issues.removeLabel({ owner, repo, issue_number: issueNumber, name: label });
    } catch { /* label may not exist */ }
  }
}

function buildUnlockComment(completedStage: string, next: string | null, xpEarned: number): string {
  if (!next) {
    return `## 🏆 All Stages Complete!

Congratulations @${student}! You have completed all ${STAGES.length} stages of the course!

**Stage ${completedStage} passed** · via ${trigger} · Score: ${score.toFixed(1)}%
**Total XP earned this session:** ${xpEarned}

Your certificate is being generated and will be attached to a new GitHub Release shortly. 🎓

---
_Check your email for the signed certificate, or find it in the [Releases](../../releases) tab._`;
  }

  return `## 🔓 Stage ${next} Unlocked!

Great work @${student}! You've passed **Stage ${completedStage}** and unlocked **Stage ${next}**.

**Score:** ${score.toFixed(1)}% · **Trigger:** ${trigger} · **XP earned:** ${xpEarned}

### What's Next?

1. Read the [Stage ${next} README](../curriculum/stage-${next}/README.md)
2. Complete the assignment in your fork
3. Open a PR titled \`[Stage ${next}] @${student}\`

> 💡 Tip: Check the [Leaderboard](../LEADERBOARD.md) to see your ranking!

---
_Stage advancement is automated · [View run](../../actions/runs/${process.env['GITHUB_RUN_ID']}/)_`;
}

const STAGE_XP: Record<string, number> = {
  '01': 100, '02': 150, '03': 200, '04': 250, '05': 400,
};

function writeOutputs(allComplete: boolean, nextStageValue: string | null) {
  const outputs = [
    `all_complete=${allComplete}`,
    `next_stage=${nextStageValue ?? 'none'}`,
    `student=${student}`,
  ];
  const outputFile = process.env['GITHUB_OUTPUT'];
  if (outputFile) {
    fs.appendFileSync(outputFile, outputs.join('\n') + '\n');
  }
}

function appendAuditLog(issueNumber: number, next: string | null, xpEarned: number) {
  const entry = JSON.stringify({
    ts: new Date().toISOString(),
    event: 'stage_advance',
    actor: student,
    subject: `issue:${issueNumber}`,
    stage_completed: stage,
    next_stage: next,
    trigger,
    score,
    xp_earned: xpEarned,
    run_id: process.env['GITHUB_RUN_ID'],
  });
  const logPath = path.join('audit', 'log.jsonl');
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.appendFileSync(logPath, entry + '\n');
}

async function main() {
  console.log(`Advancing @${student} past Stage ${stage} (trigger: ${trigger})`);

  const issueNumber = await findEnrollmentIssueByStudent();
  if (!issueNumber) {
    console.error(`Could not find open enrollment issue for @${student} at stage ${stage}`);
    process.exit(1);
  }

  const next = nextStage(stage);
  const allComplete = isAllComplete(stage);
  const xpEarned = STAGE_XP[stage] ?? 100;

  await updateLabels(issueNumber, stage, next);
  const comment = buildUnlockComment(stage, next, xpEarned);
  await octokit.issues.createComment({ owner, repo, issue_number: issueNumber, body: comment });

  writeOutputs(allComplete, next);
  appendAuditLog(issueNumber, next, xpEarned);

  console.log(`✓ @${student} advanced past Stage ${stage} → ${next ?? 'COMPLETE'}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
