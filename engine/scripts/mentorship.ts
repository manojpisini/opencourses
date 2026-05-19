#!/usr/bin/env bun
/**
 * mentorship.ts — Match at-risk students with mentor volunteers
 *
 * Modes:
 *   --mode match    Weekly matching run
 *   --mode expire   Expire stale matches
 *
 * Env vars: GITHUB_TOKEN, REPO, RISK_THRESHOLD, MAX_MENTEES_PER_MENTOR
 */

import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import * as path from 'path';

const octokit = new Octokit({ auth: process.env['GITHUB_TOKEN'] });
const [owner, repo] = (process.env['REPO'] ?? '').split('/');
const mode = process.argv.includes('--mode') ? process.argv[process.argv.indexOf('--mode') + 1] : 'match';
const MAX_MENTEES = parseInt(process.env['MAX_MENTEES_PER_MENTOR'] ?? '3', 10);

const MATCHES_FILE = path.join('submissions', 'mentorship-matches.json');

interface MatchRecord {
  student: string;
  mentor: string;
  matchedAt: string;
  expiresAt: string;
  issueNumber: number;
}

interface MatchStore {
  matches: MatchRecord[];
}

function loadMatches(): MatchStore {
  if (!fs.existsSync(MATCHES_FILE)) return { matches: [] };
  return JSON.parse(fs.readFileSync(MATCHES_FILE, 'utf-8')) as MatchStore;
}

function saveMatches(store: MatchStore) {
  fs.mkdirSync(path.dirname(MATCHES_FILE), { recursive: true });
  fs.writeFileSync(MATCHES_FILE, JSON.stringify(store, null, 2));
}

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

async function findAtRiskStudents(): Promise<{ login: string; issueNumber: number; daysSinceActivity: number }[]> {
  const { data: issues } = await octokit.issues.listForRepo({
    owner, repo, state: 'open',
    labels: 'enrolled,stale',
    per_page: 50,
  });

  return issues
    .map((i) => ({
      login: i.user?.login ?? '',
      issueNumber: i.number,
      daysSinceActivity: daysSince(i.updated_at),
    }))
    .filter((s) => s.login && s.daysSinceActivity >= 7)
    .sort((a, b) => b.daysSinceActivity - a.daysSinceActivity);
}

async function findAvailableMentors(existingMatches: MatchRecord[]): Promise<string[]> {
  // Mentors are certified students who have opted in (have 'mentor' label on their enrollment issue)
  const { data: issues } = await octokit.issues.listForRepo({
    owner, repo, state: 'open',
    labels: 'enrolled,certified,mentor',
    per_page: 50,
  });

  const activeMatchCounts = new Map<string, number>();
  for (const m of existingMatches) {
    if (new Date(m.expiresAt) > new Date()) {
      activeMatchCounts.set(m.mentor, (activeMatchCounts.get(m.mentor) ?? 0) + 1);
    }
  }

  return issues
    .map((i) => i.user?.login ?? '')
    .filter((login) => login && (activeMatchCounts.get(login) ?? 0) < MAX_MENTEES);
}

async function notifyMatch(student: string, mentor: string, studentIssue: number) {
  await octokit.issues.createComment({
    owner, repo, issue_number: studentIssue,
    body: `## 🤝 Mentorship Assigned

Hey @${student}! We've connected you with @${mentor} as your mentor for this course.

@${mentor} is a certified graduate who has agreed to help students like you. Feel free to:
- Tag them in comments on this issue with questions
- Mention them in your PR reviews for guidance

This match is active for **30 days**. Keep up the great work! 💪`,
  });

  // Find mentor's enrollment issue and notify them too
  const { data: mentorIssues } = await octokit.issues.listForRepo({
    owner, repo, state: 'open',
    labels: 'enrolled',
    per_page: 100,
  });
  const mentorIssue = mentorIssues.find((i) => i.user?.login === mentor);
  if (mentorIssue) {
    await octokit.issues.createComment({
      owner, repo, issue_number: mentorIssue.number,
      body: `## 🎓 New Mentee Assigned

You've been matched as a mentor for @${student}! They've been inactive for a few days and could use some encouragement.

Their enrollment issue: #${studentIssue}

Thank you for giving back to the community! 🙌`,
    });
  }
}

async function runMatching() {
  const store = loadMatches();
  const atRisk = await findAtRiskStudents();
  const alreadyMatched = new Set(store.matches.filter((m) => new Date(m.expiresAt) > new Date()).map((m) => m.student));
  const unmatched = atRisk.filter((s) => !alreadyMatched.has(s.login));

  if (unmatched.length === 0) {
    console.log('No unmatched at-risk students found');
    writeOutputs(0, []);
    return;
  }

  const mentors = await findAvailableMentors(store.matches);
  if (mentors.length === 0) {
    console.log('No available mentors found');
    writeOutputs(0, []);
    return;
  }

  const newMatches: MatchRecord[] = [];
  let mentorIdx = 0;

  for (const student of unmatched) {
    if (mentorIdx >= mentors.length) break;
    const mentor = mentors[mentorIdx++]!;

    const expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();
    const match: MatchRecord = {
      student: student.login,
      mentor,
      matchedAt: new Date().toISOString(),
      expiresAt,
      issueNumber: student.issueNumber,
    };

    await notifyMatch(student.login, mentor, student.issueNumber);
    newMatches.push(match);
    console.log(`Matched @${student.login} → @${mentor}`);
  }

  store.matches.push(...newMatches);
  saveMatches(store);

  const pairs = newMatches.map((m) => `- @${m.student} → @${m.mentor}`).join('\n');
  writeOutputs(newMatches.length, newMatches);
  console.log(`✓ Created ${newMatches.length} mentorship matches`);
}

function writeOutputs(count: number, matches: MatchRecord[]) {
  const pairs = matches.map((m) => `- @${m.student} → @${m.mentor}`).join('\n');
  const outputFile = process.env['GITHUB_OUTPUT'];
  if (outputFile) {
    fs.appendFileSync(outputFile, `matched_count=${count}\npairs=${pairs.replace(/\n/g, '%0A')}\n`);
  }
}

async function expireMatches() {
  const store = loadMatches();
  const before = store.matches.length;
  store.matches = store.matches.filter((m) => new Date(m.expiresAt) > new Date());
  saveMatches(store);
  console.log(`✓ Expired ${before - store.matches.length} stale matches`);
}

async function main() {
  if (mode === 'match') await runMatching();
  else if (mode === 'expire') await expireMatches();
  else { console.error(`Unknown mode: ${mode}`); process.exit(1); }
}

main().catch((err) => { console.error(err); process.exit(1); });
