#!/usr/bin/env bun
/**
 * cohort.ts — Cohort management: nudge inactive students, flag stale, assign peer reviewers
 *
 * Modes:
 *   --mode nudge         Post gentle nudge to inactive enrollment issues
 *   --mode stale         Mark and optionally close long-inactive issues
 *   --mode peer-assign   Assign peer reviewers to a PR
 *   --mode peer-tally    Tally completed peer reviews for a PR
 *
 * Env vars: GITHUB_TOKEN, REPO, INACTIVITY_DAYS, STALE_DAYS, CLOSE_AFTER_DAYS, PR_NUMBER, PR_AUTHOR, PEER_COUNT
 */

import { Octokit } from '@octokit/rest';
import * as fs from 'fs';

const octokit = new Octokit({ auth: process.env['GITHUB_TOKEN'] });
const [owner, repo] = (process.env['REPO'] ?? '').split('/');
const mode = process.argv.includes('--mode') ? process.argv[process.argv.indexOf('--mode') + 1] : 'nudge';

const INACTIVITY_DAYS = parseInt(process.env['INACTIVITY_DAYS'] ?? '5', 10);
const STALE_DAYS = parseInt(process.env['STALE_DAYS'] ?? '90', 10);
const CLOSE_AFTER_DAYS = parseInt(process.env['CLOSE_AFTER_DAYS'] ?? '180', 10);
const PR_NUMBER = parseInt(process.env['PR_NUMBER'] ?? '0', 10);
const PR_AUTHOR = process.env['PR_AUTHOR'] ?? '';
const PEER_COUNT = parseInt(process.env['PEER_COUNT'] ?? '2', 10);
const REQUIRED_REVIEWS = parseInt(process.env['REQUIRED_REVIEWS'] ?? '2', 10);

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

// ─── Nudge Mode ─────────────────────────────────────────────────────────────

async function nudgeInactiveStudents() {
  let page = 1;
  let nudged = 0;

  while (true) {
    const { data: issues } = await octokit.issues.listForRepo({
      owner, repo, state: 'open',
      labels: 'enrolled,active',
      per_page: 100,
      page,
    });
    if (issues.length === 0) break;

    for (const issue of issues) {
      const days = daysSince(issue.updated_at);
      if (days < INACTIVITY_DAYS) continue;

      const login = issue.user?.login ?? '';
      const labels = issue.labels.map((l) => (typeof l === 'string' ? l : l.name ?? ''));
      const stageLabel = labels.find((l) => l.includes('-unlocked'));
      const currentStage = stageLabel?.match(/stage-(\d+)-unlocked/)?.[1] ?? '1';

      await octokit.issues.createComment({
        owner, repo, issue_number: issue.number,
        body: `👋 Hey @${login}! We noticed you haven't been active for **${days} days**.

No pressure — life happens! But if you're still working on Stage ${currentStage}, we're here to help:

- 📖 [Review Stage ${currentStage}](../curriculum/stage-${currentStage.padStart(2, '0')}/README.md)
- 💬 [Ask a question](../../issues/new?template=support.yml)
- 👥 [Find a study partner](../../issues?q=label%3Astudy-group)

If you'd like to pause your enrollment, just comment \`/pause\` on this issue and we'll hold your spot.`,
      });

      // Replace 'active' with 'stale' label
      try { await octokit.issues.removeLabel({ owner, repo, issue_number: issue.number, name: 'active' }); } catch { /* ignore */ }
      await octokit.issues.addLabels({ owner, repo, issue_number: issue.number, labels: ['stale'] });
      nudged++;
    }

    if (issues.length < 100) break;
    page++;
  }

  console.log(`✓ Nudged ${nudged} inactive students`);
}

// ─── Stale Mode ─────────────────────────────────────────────────────────────

async function flagStaleEnrollments() {
  const { data: issues } = await octokit.issues.listForRepo({
    owner, repo, state: 'open',
    labels: 'enrolled',
    per_page: 100,
  });

  let staled = 0;
  let closed = 0;

  for (const issue of issues) {
    const days = daysSince(issue.updated_at);

    if (days >= CLOSE_AFTER_DAYS) {
      await octokit.issues.createComment({
        owner, repo, issue_number: issue.number,
        body: `This enrollment has been inactive for **${days} days** and is being closed automatically.\n\nYou can re-enroll at any time using the [enrollment template](../../issues/new?template=enroll.yml). Your previous progress is recorded in this issue's history.`,
      });
      await octokit.issues.update({
        owner, repo, issue_number: issue.number,
        state: 'closed',
        state_reason: 'not_planned',
      });
      closed++;
    } else if (days >= STALE_DAYS) {
      try {
        await octokit.issues.getLabel({ owner, repo, name: 'stale' });
      } catch {
        await octokit.issues.createLabel({ owner, repo, name: 'stale', color: 'e4e669' });
      }
      await octokit.issues.addLabels({ owner, repo, issue_number: issue.number, labels: ['stale'] });
      staled++;
    }
  }

  console.log(`✓ Stale check: ${staled} flagged, ${closed} closed`);
}

// ─── Peer Assign Mode ────────────────────────────────────────────────────────

async function assignPeerReviewers() {
  // Find eligible reviewers: enrolled students who have passed the same stage, excluding author
  const { data: pr } = await octokit.pulls.get({ owner, repo, pull_number: PR_NUMBER });
  const stageMatch = pr.title.match(/\[Stage\s+(0\d)\]/i);
  const stage = stageMatch?.[1] ?? '01';

  const { data: issues } = await octokit.issues.listForRepo({
    owner, repo, state: 'open',
    labels: `enrolled,stage-${stage}-passed`,
    per_page: 50,
  });

  const eligible = issues
    .map((i) => i.user?.login ?? '')
    .filter((login) => login && login !== PR_AUTHOR)
    .slice(0, PEER_COUNT * 3); // pool of candidates

  // Shuffle and pick
  const shuffled = eligible.sort(() => Math.random() - 0.5).slice(0, PEER_COUNT);

  if (shuffled.length < PEER_COUNT) {
    console.warn(`Only ${shuffled.length} eligible peer reviewers found (need ${PEER_COUNT})`);
  }

  // Request reviews
  if (shuffled.length > 0) {
    await octokit.pulls.requestReviewers({
      owner, repo, pull_number: PR_NUMBER,
      reviewers: shuffled,
    });
  }

  const deadline = new Date(Date.now() + 72 * 3600000).toISOString().split('T')[0];

  const outputFile = process.env['GITHUB_OUTPUT'];
  if (outputFile) {
    const reviewerList = shuffled.map((r) => `- @${r}`).join('\n');
    fs.appendFileSync(outputFile, `reviewers=${reviewerList.replace(/\n/g, '%0A')}\ndeadline=${deadline}\n`);
  }

  console.log(`✓ Assigned peer reviewers: ${shuffled.join(', ')}`);
}

// ─── Peer Tally Mode ─────────────────────────────────────────────────────────

async function tallyPeerReviews() {
  const { data: reviews } = await octokit.pulls.listReviews({
    owner, repo, pull_number: PR_NUMBER,
  });

  const submitted = reviews.filter((r) =>
    ['APPROVED', 'CHANGES_REQUESTED', 'COMMENTED'].includes(r.state) &&
    r.user?.login !== PR_AUTHOR
  );

  const uniqueReviewers = new Set(submitted.map((r) => r.user?.login)).size;
  const allComplete = uniqueReviewers >= REQUIRED_REVIEWS;

  // Score: APPROVED = 100, COMMENTED = 70, CHANGES_REQUESTED = 40
  const scoreMap: Record<string, number> = { APPROVED: 100, COMMENTED: 70, CHANGES_REQUESTED: 40 };
  const scores = submitted.map((r) => scoreMap[r.state] ?? 0);
  const peerScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b) / scores.length) : 0;

  const summary = submitted
    .map((r) => `- @${r.user?.login}: ${r.state}`)
    .join('\n');

  const outputFile = process.env['GITHUB_OUTPUT'];
  if (outputFile) {
    fs.appendFileSync(outputFile, [
      `all_complete=${allComplete}`,
      `peer_score=${peerScore}`,
      `reviewer_count=${uniqueReviewers}`,
      `summary=${summary.replace(/\n/g, '%0A')}`,
    ].join('\n') + '\n');
  }

  console.log(`✓ Peer tally: ${uniqueReviewers}/${REQUIRED_REVIEWS} reviews, score: ${peerScore}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────

async function main() {
  if (mode === 'nudge') await nudgeInactiveStudents();
  else if (mode === 'stale') await flagStaleEnrollments();
  else if (mode === 'peer-assign') await assignPeerReviewers();
  else if (mode === 'peer-tally') await tallyPeerReviews();
  else { console.error(`Unknown mode: ${mode}`); process.exit(1); }
}

main().catch((err) => { console.error(err); process.exit(1); });
