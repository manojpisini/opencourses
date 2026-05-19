#!/usr/bin/env bun
/**
 * detect-contributors.ts — Merge git-log contributors with course.md credits.
 *
 * Triggered by: .github/workflows/course-publish.yml
 * Env vars: GITHUB_TOKEN, REPO, COURSE_SLUG, COURSE_PATH
 *
 * Output:
 *   - Writes engine/courses/{slug}/contributors.json
 *   - Writes GITHUB_OUTPUT with contributor count
 */

import * as fs    from 'fs';
import * as path  from 'path';
import { execSync } from 'child_process';
import { parseCourseFile } from '../lib/course-parser.ts';
import { setOutput } from '../lib/github.ts';

const courseSlug = process.env['COURSE_SLUG'] ?? '';
const coursePath = process.env['COURSE_PATH'] ?? `engine/courses/${courseSlug}/course.md`;

interface GitContributor {
  name: string;
  email: string;
  commits: number;
  github?: string;
}

interface MergedContributor {
  name: string;
  github?: string;
  email?: string;
  role: string;
  commits: number;
  source: 'git' | 'course.md' | 'both';
}

function getGitContributors(filePath: string): GitContributor[] {
  const dir = path.dirname(filePath);
  try {
    // Get git log for the entire course directory
    const log = execSync(
      `git log --follow --format="%an|%ae" -- "${filePath}" "${dir}"`,
      { encoding: 'utf-8', cwd: process.cwd() },
    );
    const counts = new Map<string, GitContributor>();
    for (const line of log.trim().split('\n')) {
      if (!line.trim()) continue;
      const [name, email] = line.split('|') as [string, string];
      const key  = email.toLowerCase();
      const prev = counts.get(key);
      if (prev) {
        prev.commits++;
      } else {
        counts.set(key, { name, email, commits: 1 });
      }
    }
    return Array.from(counts.values()).sort((a, b) => b.commits - a.commits);
  } catch (e) {
    console.warn('git log failed (not a git repo or no history):', (e as Error).message);
    return [];
  }
}

function guessGitHub(email: string, name: string): string | undefined {
  // GitHub noreply email pattern: <id>+<login>@users.noreply.github.com
  const noreply = email.match(/^(\d+)\+(.+)@users\.noreply\.github\.com$/);
  if (noreply) return noreply[2];
  // GitHub Actions bot
  if (email.includes('[bot]')) return undefined;
  return undefined;
}

function mergeContributors(
  gitContributors: GitContributor[],
  courseContributors: Array<{ name: string; github: string; role: string; email?: string }>,
): MergedContributor[] {
  const merged = new Map<string, MergedContributor>();

  // Seed from git
  for (const gc of gitContributors) {
    const github = guessGitHub(gc.email, gc.name);
    const key    = github ?? gc.email.toLowerCase();
    merged.set(key, {
      name:    gc.name,
      github,
      email:   gc.email,
      role:    'contributor',
      commits: gc.commits,
      source:  'git',
    });
  }

  // Merge with course.md contributors
  for (const cc of courseContributors) {
    const key = cc.github.toLowerCase();
    const existing = merged.get(key);
    if (existing) {
      merged.set(key, {
        ...existing,
        name:   cc.name || existing.name,
        github: cc.github,
        email:  cc.email ?? existing.email,
        role:   cc.role,
        source: 'both',
      });
    } else {
      merged.set(key, {
        name:    cc.name,
        github:  cc.github,
        email:   cc.email,
        role:    cc.role,
        commits: 0,
        source:  'course.md',
      });
    }
  }

  return Array.from(merged.values()).sort((a, b) => b.commits - a.commits);
}

async function main() {
  if (!fs.existsSync(coursePath)) {
    console.error(`Course file not found: ${coursePath}`);
    process.exit(1);
  }

  console.log(`Detecting contributors for course: ${courseSlug}`);
  console.log(`Course file: ${coursePath}`);

  const { course } = parseCourseFile(coursePath);
  const gitContribs  = getGitContributors(coursePath);
  const merged       = mergeContributors(gitContribs, course.contributors);

  console.log(`Found ${gitContribs.length} git contributors, ${course.contributors.length} in course.md`);
  console.log(`Merged: ${merged.length} unique contributors`);
  merged.forEach((c) =>
    console.log(`  ${c.source === 'both' ? '⚡' : c.source === 'git' ? '📝' : '📋'} ${c.name} (@${c.github ?? c.email}) — ${c.commits} commits · ${c.role}`),
  );

  // Write output
  const outDir = path.dirname(coursePath);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, 'contributors.json'),
    JSON.stringify({ courseSlug, generatedAt: new Date().toISOString(), contributors: merged }, null, 2),
  );
  console.log(`✓ Wrote contributors.json`);
  setOutput('contributor_count', merged.length);
}

main().catch((err) => { console.error(err); process.exit(1); });
