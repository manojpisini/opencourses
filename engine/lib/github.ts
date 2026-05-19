/**
 * github.ts — Thin helpers around Octokit for the course system.
 */

import { Octokit } from '@octokit/rest';

export function makeOctokit() {
  return new Octokit({ auth: process.env['GITHUB_TOKEN'] });
}

export function repoFromEnv(): { owner: string; repo: string } {
  const [owner, repo] = (process.env['REPO'] ?? '').split('/');
  if (!owner || !repo) throw new Error('REPO env var must be "owner/repo"');
  return { owner, repo };
}

// ─── Labels ───────────────────────────────────────────────────────────────────

const LABEL_COLORS: Record<string, string> = {
  enrolled:               '2ea44f',
  certified:              'f5c542',
  'quiz-submit':          '0075ca',
  'project-submit':       'e4e669',
  'chapter-complete':     '0e8a16',
  'course-complete':      'fbca04',
  'pending-review':       'd93f0b',
};

function labelColor(name: string): string {
  for (const [prefix, color] of Object.entries(LABEL_COLORS)) {
    if (name.startsWith(prefix)) return color;
  }
  return 'ededed';
}

export async function ensureLabel(
  octokit: Octokit,
  owner: string,
  repo: string,
  name: string,
): Promise<void> {
  try {
    await octokit.issues.getLabel({ owner, repo, name });
  } catch {
    await octokit.issues.createLabel({ owner, repo, name, color: labelColor(name) });
  }
}

export async function addLabels(
  octokit: Octokit,
  owner: string,
  repo: string,
  issueNumber: number,
  labels: string[],
): Promise<void> {
  for (const label of labels) await ensureLabel(octokit, owner, repo, label);
  await octokit.issues.addLabels({ owner, repo, issue_number: issueNumber, labels });
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export async function postComment(
  octokit: Octokit,
  owner: string,
  repo: string,
  issueNumber: number,
  body: string,
): Promise<void> {
  await octokit.issues.createComment({ owner, repo, issue_number: issueNumber, body });
}

// ─── Issue body field parser ──────────────────────────────────────────────────

/**
 * Extract a GitHub Issue form field value.
 * GitHub renders issue form fields as:
 *   ### Field Label
 *   value
 */
export function parseIssueField(body: string, label: string): string {
  const pattern = new RegExp(`###\\s+${escapeRegex(label)}\\s*\\n+([^\\n]+)`, 'i');
  return body.match(pattern)?.[1]?.trim() ?? '';
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── Enrollment issue helpers ─────────────────────────────────────────────────

/**
 * Find the open enrollment issue for a given student + course.
 * Returns null if not found.
 */
export async function findEnrollmentIssue(
  octokit: Octokit,
  owner: string,
  repo: string,
  login: string,
  courseSlug: string,
): Promise<{ number: number; labels: string[] } | null> {
  let page = 1;
  while (true) {
    const { data } = await octokit.issues.listForRepo({
      owner, repo, state: 'open',
      labels: `enrolled,course:${courseSlug}`,
      per_page: 100, page,
    });
    if (data.length === 0) break;
    for (const issue of data) {
      if (issue.user?.login === login) {
        return {
          number: issue.number,
          labels: issue.labels.map((l) => (typeof l === 'string' ? l : l.name ?? '')),
        };
      }
    }
    if (data.length < 100) break;
    page++;
  }
  return null;
}

// ─── GITHUB_OUTPUT helper ─────────────────────────────────────────────────────

export function setOutput(key: string, value: string | number | boolean): void {
  const outputFile = process.env['GITHUB_OUTPUT'];
  const line       = `${key}=${value}\n`;
  if (outputFile) {
    import('fs').then(({ appendFileSync }) => appendFileSync(outputFile, line));
  } else {
    console.log(`::set-output name=${key}::${value}`);
  }
}
