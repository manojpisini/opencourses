#!/usr/bin/env bun
/**
 * notify.ts — Shared notification helpers for posting comments and managing labels
 *
 * Not invoked directly — imported by other scripts.
 */

import { Octokit } from '@octokit/rest';

export function createOctokit(): Octokit {
  return new Octokit({ auth: process.env['GITHUB_TOKEN'] });
}

export function parseRepo(repoEnv = process.env['REPO'] ?? ''): { owner: string; repo: string } {
  const [owner, repo] = repoEnv.split('/');
  return { owner: owner ?? '', repo: repo ?? '' };
}

export async function ensureLabel(
  octokit: Octokit,
  owner: string,
  repo: string,
  name: string,
  color = 'ededed',
  description = ''
): Promise<void> {
  try {
    await octokit.issues.getLabel({ owner, repo, name });
  } catch {
    await octokit.issues.createLabel({ owner, repo, name, color, description });
  }
}

export async function addLabels(
  octokit: Octokit,
  owner: string,
  repo: string,
  issueNumber: number,
  labels: string[]
): Promise<void> {
  for (const label of labels) {
    await ensureLabel(octokit, owner, repo, label);
  }
  await octokit.issues.addLabels({ owner, repo, issue_number: issueNumber, labels });
}

export async function removeLabel(
  octokit: Octokit,
  owner: string,
  repo: string,
  issueNumber: number,
  name: string
): Promise<void> {
  try {
    await octokit.issues.removeLabel({ owner, repo, issue_number: issueNumber, name });
  } catch { /* ignore if label not present */ }
}

export async function postComment(
  octokit: Octokit,
  owner: string,
  repo: string,
  issueNumber: number,
  body: string
): Promise<void> {
  await octokit.issues.createComment({ owner, repo, issue_number: issueNumber, body });
}

export function writeGitHubOutput(pairs: Record<string, string | number | boolean>): void {
  const outputFile = process.env['GITHUB_OUTPUT'];
  if (!outputFile) {
    for (const [k, v] of Object.entries(pairs)) {
      console.log(`::set-output name=${k}::${v}`);
    }
    return;
  }
  const { appendFileSync } = require('fs') as typeof import('fs');
  const lines = Object.entries(pairs).map(([k, v]) => `${k}=${v}`).join('\n');
  appendFileSync(outputFile, lines + '\n');
}

export function appendAuditEntry(entry: Record<string, unknown>): void {
  const { appendFileSync, mkdirSync } = require('fs') as typeof import('fs');
  const { join } = require('path') as typeof import('path');
  const logPath = join('audit', 'log.jsonl');
  mkdirSync('audit', { recursive: true });
  appendFileSync(logPath, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n');
}
