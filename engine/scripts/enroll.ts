#!/usr/bin/env bun
/**
 * enroll.ts — Process enrollment requests from GitHub Issues
 *
 * Triggered by: .github/workflows/enroll.yml
 * Env vars: GITHUB_TOKEN, REPO, ISSUE_NUMBER, ISSUE_AUTHOR
 */

import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

const octokit = new Octokit({ auth: process.env['GITHUB_TOKEN'] });
const [owner, repo] = (process.env['REPO'] ?? '').split('/');
const issueNumber = parseInt(process.env['ISSUE_NUMBER'] ?? '0', 10);
const issueAuthor = process.env['ISSUE_AUTHOR'] ?? '';

interface EnrollmentData {
  course: string;
  track?: string;
  goal?: string;
}

interface Stage {
  id: string;
  title: string;
  xp: number;
  type: string;
}

interface CourseSchema {
  course: { title: string; version: string; track: string; difficulty: string };
  stages: Stage[];
  gamification: { levels: { name: string; min_xp: number }[] };
}

async function parseEnrollmentIssue(): Promise<EnrollmentData | null> {
  const { data: issue } = await octokit.issues.get({ owner, repo, issue_number: issueNumber });
  const body = issue.body ?? '';

  // Parse structured issue form fields
  const courseMatch = body.match(/### Course\s*\n+([^\n]+)/);
  const trackMatch = body.match(/### Track\s*\n+([^\n]+)/);
  const goalMatch = body.match(/### Goal\s*\n+([^\n]+)/);

  if (!courseMatch) return null;

  return {
    course: courseMatch[1]!.trim().toLowerCase().replace(/\s+/g, '-'),
    track: trackMatch?.[1]?.trim(),
    goal: goalMatch?.[1]?.trim(),
  };
}

async function checkDuplicateEnrollment(course: string): Promise<boolean> {
  const { data: issues } = await octokit.issues.listForRepo({
    owner, repo,
    state: 'open',
    labels: `enrolled,course:${course}`,
    creator: issueAuthor,
  });
  return issues.length > 0;
}

function loadCourseSchema(courseSlug: string): CourseSchema | null {
  const schemaPath = path.join('curriculum', 'schema.yaml');
  if (!fs.existsSync(schemaPath)) return null;
  return yaml.load(fs.readFileSync(schemaPath, 'utf-8')) as CourseSchema;
}

function formatLearningPath(stages: Stage[]): string {
  return stages
    .map(
      (s, i) =>
        `| ${i + 1} | ${s.title} | ${s.type} | ${s.xp} XP |`
    )
    .join('\n');
}

async function postWelcomeComment(data: EnrollmentData, schema: CourseSchema | null) {
  const courseName = schema?.course.title ?? data.course;
  const difficulty = schema?.course.difficulty ?? 'intermediate';
  const stages = schema?.stages ?? [];
  const totalXP = stages.reduce((sum, s) => sum + (s.xp ?? 0), 0);

  const learningPath = stages.length
    ? `\n## 📋 Your Learning Path\n\n| # | Stage | Type | XP |\n|---|-------|------|----|\n${formatLearningPath(stages)}\n\n**Total XP available:** ${totalXP}`
    : '';

  const body = `## 🎉 Welcome to ${courseName}!

Hi @${issueAuthor}! Your enrollment has been confirmed.

**Difficulty:** ${difficulty} · **Track:** ${schema?.course.track ?? data.track ?? 'general'}
${data.goal ? `\n**Your goal:** _"${data.goal}"_\n` : ''}
${learningPath}

## 🚀 Getting Started

1. **Fork this repository** — all your work lives in your fork
2. **Read Stage 1** — [curriculum/stage-01/README.md](../curriculum/stage-01/README.md)
3. **Complete the assignment** and open a PR with title \`[Stage 01] @${issueAuthor}\`
4. **Automated grading** will run within minutes of your PR

## 📌 Important Links

- 📖 [Course README](../README.md)
- 🗺️ [Full Curriculum](../CURRICULUM.md)
- 🏆 [Leaderboard](../LEADERBOARD.md)
- 💬 [Get Help](../../issues/new?template=support.yml)

## ⚙️ How Grading Works

- Your assignment PRs are graded automatically in a Docker sandbox
- Quizzes are issued as GitHub Issues with the \`quiz-attempt\` label
- Pass all stages to earn your cryptographically signed certificate
- Each stage unlocks the next automatically

---
_This issue tracks your enrollment. Keep it open — it is your progress record._`;

  await octokit.issues.createComment({ owner, repo, issue_number: issueNumber, body });
}

async function applyEnrollmentLabels(data: EnrollmentData) {
  const labels = [
    'enrolled',
    `course:${data.course}`,
    'stage-01-unlocked',
    'active',
  ];

  // Ensure labels exist
  for (const label of labels) {
    try {
      await octokit.issues.getLabel({ owner, repo, name: label });
    } catch {
      await octokit.issues.createLabel({
        owner, repo, name: label,
        color: label.startsWith('course:') ? '0075ca' : label === 'enrolled' ? '2ea44f' : 'e4e669',
      });
    }
  }

  await octokit.issues.addLabels({ owner, repo, issue_number: issueNumber, labels });
}

async function updateIssueTitle(course: string) {
  const { data: issue } = await octokit.issues.get({ owner, repo, issue_number: issueNumber });
  if (!issue.title.includes('[Enrolled]')) {
    await octokit.issues.update({
      owner, repo, issue_number: issueNumber,
      title: `[Enrolled] @${issueAuthor} — ${course}`,
    });
  }
}

async function appendAuditLog(data: EnrollmentData) {
  const entry = JSON.stringify({
    ts: new Date().toISOString(),
    event: 'enrollment',
    actor: issueAuthor,
    subject: `issue:${issueNumber}`,
    course: data.course,
    run_id: process.env['GITHUB_RUN_ID'],
  });

  const logPath = path.join('audit', 'log.jsonl');
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.appendFileSync(logPath, entry + '\n');
}

async function main() {
  console.log(`Processing enrollment for @${issueAuthor} on issue #${issueNumber}`);

  const data = await parseEnrollmentIssue();
  if (!data) {
    await octokit.issues.createComment({
      owner, repo, issue_number: issueNumber,
      body: `@${issueAuthor} — I couldn't parse the enrollment form. Please make sure you used the [enrollment template](../../issues/new?template=enroll.yml).`,
    });
    process.exit(1);
  }

  const isDuplicate = await checkDuplicateEnrollment(data.course);
  if (isDuplicate) {
    await octokit.issues.createComment({
      owner, repo, issue_number: issueNumber,
      body: `@${issueAuthor} — You are already enrolled in **${data.course}**. Search for your existing enrollment issue to track your progress.`,
    });
    await octokit.issues.update({ owner, repo, issue_number: issueNumber, state: 'closed' });
    process.exit(0);
  }

  const schema = loadCourseSchema(data.course);
  await applyEnrollmentLabels(data);
  await updateIssueTitle(data.course);
  await postWelcomeComment(data, schema);
  await appendAuditLog(data);

  console.log(`✓ Enrollment complete for @${issueAuthor} in ${data.course}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
