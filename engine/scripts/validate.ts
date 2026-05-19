#!/usr/bin/env bun
/**
 * validate.ts — Course validation + PR integrity checks
 *
 * Modes:
 *   --mode schema   Parse and validate all courses/**/course.md files
 *   --mode pr       Validate a PR (tamper detection on protected paths)
 *
 * Env vars: GITHUB_TOKEN, REPO, PR_NUMBER (pr mode only)
 */

import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import * as path from 'path';
import { parseCourse } from '../lib/course-parser.js';

const mode = process.argv.includes('--mode') ? process.argv[process.argv.indexOf('--mode') + 1] : 'schema';
const octokit = new Octokit({ auth: process.env['GITHUB_TOKEN'] });
const [owner, repo] = (process.env['REPO'] ?? '').split('/');
const prNumber = parseInt(process.env['PR_NUMBER'] ?? '0', 10);

// ─── Course Validation ──────────────────────────────────────────────────────

function findCourseMdFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { recursive: true, withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile() && entry.name === 'course.md') {
      results.push(path.join(entry.parentPath ?? entry.path, entry.name));
    }
  }
  return results;
}

function validateAllCourses(): { errors: string[]; validated: number } {
  const courseFiles = findCourseMdFiles('courses');
  const errors: string[] = [];
  let validated = 0;

  for (const file of courseFiles) {
    try {
      const raw = fs.readFileSync(file, 'utf-8');
      parseCourse(raw);          // throws ParseError on any schema violation
      validated++;
      console.log(`  ✓ ${file}`);
    } catch (e) {
      errors.push(`${file}: ${(e as Error).message}`);
    }
  }

  return { errors, validated };
}

// ─── PR Validation ───────────────────────────────────────────────────────────

// Paths students must never touch in a PR
const PROTECTED_PATHS = [
  '.github/',
  'engine/scripts/',
  'engine/lib/',
  'engine/types/',
  'engine/sandbox/',
  'engine/tsconfig.json',
  'engine/package.json',
];

async function validatePR(): Promise<void> {
  const { data: pr } = await octokit.pulls.get({ owner, repo, pull_number: prNumber });
  const errors: string[] = [];

  const student = pr.user?.login ?? '';

  // Tamper detection — check diff for protected file paths
  const { data: files } = await octokit.pulls.listFiles({ owner, repo, pull_number: prNumber });
  const tampered = files.filter((f) =>
    PROTECTED_PATHS.some((p) => f.filename.startsWith(p) || f.filename === p.replace(/\/$/, ''))
  );

  if (tampered.length > 0) {
    errors.push(
      `**Protected files modified:**\n${tampered.map((f) => `- \`${f.filename}\``).join('\n')}\n\n` +
      `Student PRs must not modify engine scripts, workflows, sandbox, or package files.`
    );
  }

  if (errors.length > 0) {
    await octokit.issues.createComment({
      owner, repo, issue_number: prNumber,
      body: `## ❌ PR Validation Failed\n\n${errors.map((e) => `- ${e}`).join('\n\n')}\n\nFix the issues above and push again.`,
    });
    fs.appendFileSync(process.env['GITHUB_OUTPUT'] ?? '/dev/null', `valid=false\nstudent=${student}\n`);
    process.exit(1);
  }

  console.log(`✓ PR #${prNumber} by @${student} passed tamper check`);
  fs.appendFileSync(process.env['GITHUB_OUTPUT'] ?? '/dev/null', `valid=true\nstudent=${student}\n`);
}

// ─── Main ─────────────────────────────────────────────────────────────────

async function main() {
  if (mode === 'schema') {
    console.log('Validating course.md files in courses/...');
    const { errors, validated } = validateAllCourses();
    console.log(`\nValidated ${validated} course(s)`);
    if (errors.length > 0) {
      console.error(`\n${errors.length} validation error(s):\n`);
      errors.forEach((e) => console.error('  ' + e));
      process.exit(1);
    }
    console.log('✓ All courses valid');
  } else if (mode === 'pr') {
    await validatePR();
  } else {
    console.error(`Unknown mode: ${mode}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
