#!/usr/bin/env bun
/**
 * dashboard.ts — Generate DASHBOARD.md for instructors
 *
 * Triggered by: .github/workflows/dashboard.yml
 * Env vars: GITHUB_TOKEN, REPO
 */

import { Octokit } from '@octokit/rest';
import * as fs from 'fs';

const octokit = new Octokit({ auth: process.env['GITHUB_TOKEN'] });
const [owner, repo] = (process.env['REPO'] ?? '').split('/');

interface StudentSummary {
  login: string;
  course: string;
  stage: number;
  xp: number;
  certified: boolean;
  lastActivity: string;
  status: 'active' | 'stale' | 'at-risk' | 'complete';
  issueNumber: number;
}

async function fetchAllEnrollments(): Promise<StudentSummary[]> {
  const summaries: StudentSummary[] = [];
  let page = 1;

  while (true) {
    const { data: issues } = await octokit.issues.listForRepo({
      owner, repo, state: 'all',
      labels: 'enrolled',
      per_page: 100,
      page,
    });
    if (issues.length === 0) break;

    for (const issue of issues) {
      const labels = issue.labels.map((l) => (typeof l === 'string' ? l : l.name ?? ''));
      const login = issue.user?.login ?? 'unknown';

      let stage = 0;
      for (let s = 5; s >= 1; s--) {
        if (labels.includes(`stage-0${s}-passed`)) { stage = s; break; }
      }

      let xp = 0;
      const XP = [0, 100, 150, 200, 250, 400];
      for (let s = 1; s <= stage; s++) xp += XP[s] ?? 0;

      const certified = labels.includes('certified');
      const courseLabel = labels.find((l) => l.startsWith('course:'));
      const course = courseLabel ? courseLabel.replace('course:', '') : 'unknown';

      const lastActivityDate = new Date(issue.updated_at);
      const daysSinceActivity = Math.floor((Date.now() - lastActivityDate.getTime()) / 86400000);

      let status: StudentSummary['status'] = 'active';
      if (certified || labels.includes('all-stages-complete')) status = 'complete';
      else if (daysSinceActivity > 14) status = 'at-risk';
      else if (daysSinceActivity > 5) status = 'stale';

      summaries.push({
        login,
        course,
        stage,
        xp,
        certified,
        lastActivity: issue.updated_at,
        status,
        issueNumber: issue.number,
      });
    }

    if (issues.length < 100) break;
    page++;
  }

  return summaries;
}

async function fetchRecentPRs(): Promise<{ number: number; title: string; author: string; state: string; url: string }[]> {
  const { data: prs } = await octokit.pulls.list({ owner, repo, state: 'all', per_page: 20 });
  return prs.map((p) => ({
    number: p.number,
    title: p.title,
    author: p.user?.login ?? '',
    state: p.merged_at ? 'merged' : p.state,
    url: p.html_url,
  }));
}

function statusIcon(s: StudentSummary['status']): string {
  return { active: '🟢', stale: '🟡', 'at-risk': '🔴', complete: '🏆' }[s];
}

function buildDashboard(students: StudentSummary[], prs: { number: number; title: string; author: string; state: string; url: string }[]): string {
  const now = new Date().toISOString().split('T')[0];
  const total = students.length;
  const active = students.filter((s) => s.status === 'active').length;
  const atRisk = students.filter((s) => s.status === 'at-risk').length;
  const stale = students.filter((s) => s.status === 'stale').length;
  const complete = students.filter((s) => s.status === 'complete').length;
  const certified = students.filter((s) => s.certified).length;

  // Dropout prediction: at-risk + no activity > 7 days
  const dropoutRisk = students
    .filter((s) => s.status === 'at-risk')
    .sort((a, b) => a.lastActivity.localeCompare(b.lastActivity))
    .slice(0, 10);

  const studentRows = students
    .sort((a, b) => b.xp - a.xp)
    .map((s) => `| ${statusIcon(s.status)} | [@${s.login}](https://github.com/${s.login}) | ${s.course} | ${s.stage}/5 | ${s.xp} XP | ${s.lastActivity.split('T')[0]} | [#${s.issueNumber}](../../issues/${s.issueNumber}) |`)
    .join('\n');

  const prRows = prs
    .map((p) => {
      const icon = p.state === 'merged' ? '✅' : p.state === 'open' ? '🔄' : '❌';
      return `| ${icon} | [#${p.number}](${p.url}) | ${p.title} | @${p.author} | ${p.state} |`;
    })
    .join('\n');

  const riskRows = dropoutRisk
    .map((s) => `| [@${s.login}](https://github.com/${s.login}) | ${s.course} | Stage ${s.stage} | ${s.lastActivity.split('T')[0]} | [View issue](../../issues/${s.issueNumber}) |`)
    .join('\n');

  return `# 📊 Instructor Dashboard

> **Generated:** ${now} · This file is rebuilt every Monday and on \`workflow_dispatch\`.

## Overview

| Metric | Count |
|--------|-------|
| Total enrolled | ${total} |
| 🟢 Active | ${active} |
| 🟡 Stale (>5 days) | ${stale} |
| 🔴 At risk (>14 days) | ${atRisk} |
| 🏆 Completed | ${complete} |
| 🎓 Certified | ${certified} |

## ⚠️ At-Risk Students (Action Required)

${dropoutRisk.length === 0 ? '_No at-risk students — great retention!_' : `| Student | Course | Stage | Last Active | Issue |
|---------|--------|-------|-------------|-------|
${riskRows}`}

## All Students

| Status | Student | Course | Progress | XP | Last Active | Issue |
|--------|---------|--------|----------|-----|-------------|-------|
${studentRows || '_No enrollments yet._'}

## Recent Submissions (Last 20 PRs)

| Status | PR | Title | Author | State |
|--------|----|-------|--------|-------|
${prRows || '_No recent PRs._'}

---
_Dashboard rebuilt by GitHub Actions every Monday. Trigger manually via [workflow_dispatch](../../actions/workflows/dashboard.yml)._
`;
}

async function main() {
  console.log('Building instructor dashboard...');
  const [students, prs] = await Promise.all([fetchAllEnrollments(), fetchRecentPRs()]);
  const md = buildDashboard(students, prs);
  fs.writeFileSync('DASHBOARD.md', md);
  console.log(`✓ DASHBOARD.md written (${students.length} students, ${prs.length} PRs)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
