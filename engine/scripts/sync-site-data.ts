#!/usr/bin/env bun
/**
 * sync-site-data.ts — Aggregate engine output into site/src/data JSON files.
 *
 * Reads:
 *   engine/courses/{slug}/course.json       (per-course metadata)
 *   engine/courses/{slug}/contributors.json  (per-course contributor list)
 *
 * Fetches from GitHub API:
 *   /repos/{owner}/{repo}/stats/commit_activity  (52-week activity heatmap)
 *   /repos/{owner}/{repo}                         (main repo stars/forks)
 *
 * Writes to site/src/data/:
 *   courses.json      contributors.json  changelog.json
 *   activity.json     graph.json         stats.json
 *
 * Run: bun run scripts/sync-site-data.ts  (CWD must be engine/)
 * Env: GITHUB_TOKEN, REPO (owner/repo)
 */

import * as fs   from 'fs';
import * as path from 'path';
import { makeOctokit, repoFromEnv } from '../lib/github.ts';

const octokit       = makeOctokit();
const { owner, repo } = repoFromEnv();

// ─── Path helpers ─────────────────────────────────────────────────────────────

const COURSES_DIR = path.join('courses');
const SITE_DATA   = path.join('..', 'site', 'src', 'data');

function siteFile(name: string): string {
  return path.join(SITE_DATA, name);
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface CourseMeta {
  slug: string;
  title: string;
  version: string;
  description: string;
  track: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'draft';
  tags: string[];
  prerequisites: string[];
  estimated_hours: number;
  thumbnail?: string;
  license: string;
  repo?: string;
}

interface ParsedCourse {
  meta: CourseMeta;
  contributors: Array<{ name: string; github: string; role: string }>;
  chapters: Array<{ id: string; title: string; description?: string; lessonCount: number; hasProject: boolean }>;
  changelog?: Array<{ version: string; date: string; changes: Array<{ type: string; text: string }> }>;
  generatedAt: string;
}

interface CourseContributor {
  name: string;
  github: string;
  email?: string;
  role: string;
  commits: number;
  source: string;
}

interface PerCourseContributors {
  courseSlug: string;
  generatedAt: string;
  contributors: CourseContributor[];
}

interface SiteCourse {
  slug: string;
  title: string;
  description: string;
  track: string;
  difficulty: string;
  duration: string;
  modules: number;
  maintainer: string;
  contributors: string[];
  tags: string[];
  prerequisites: string[];
  repo: string;
  version: string;
  updatedAt: string;
  featured: boolean;
  stars: number;
  forks: number;
  openIssues: number;
  status: 'added' | 'modified' | 'stable' | 'attention';
  lastCommit: string;
  sparklineDays: number[];
}

interface SiteContributor {
  login: string;
  name: string;
  role: string;
  commits: number;
  courses: number;
  hue: number;
}

// ─── Lead Maintainer (always pinned first) ────────────────────────────────────

const LEAD_LOGIN = 'manojpisini';
const LEAD_HUE   = 220;   // fixed blue hue

// ─── Scan per-course JSON files ───────────────────────────────────────────────

function scanCourseDirs(): string[] {
  if (!fs.existsSync(COURSES_DIR)) return [];
  return fs.readdirSync(COURSES_DIR).filter(d => {
    const p = path.join(COURSES_DIR, d);
    return fs.statSync(p).isDirectory() && d !== 'template';
  });
}

function readCourseJson(slug: string): ParsedCourse | null {
  const p = path.join(COURSES_DIR, slug, 'course.json');
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch { return null; }
}

function readContributorsJson(slug: string): PerCourseContributors | null {
  const p = path.join(COURSES_DIR, slug, 'contributors.json');
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch { return null; }
}

// ─── GitHub API helpers ───────────────────────────────────────────────────────

async function fetchRepoMeta(repoUrl: string): Promise<{ stars: number; forks: number; openIssues: number }> {
  const m = repoUrl.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (!m) return { stars: 0, forks: 0, openIssues: 0 };
  try {
    const { data } = await octokit.repos.get({ owner: m[1]!, repo: m[2]! });
    return { stars: data.stargazers_count, forks: data.forks_count, openIssues: data.open_issues_count };
  } catch { return { stars: 0, forks: 0, openIssues: 0 }; }
}

async function fetchCommitActivity(): Promise<number[][]> {
  try {
    const { data } = await octokit.repos.getCommitActivityStats({ owner, repo });
    if (!data || !Array.isArray(data)) return [];
    return data.map((w: { days: number[] }) => w.days ?? Array(7).fill(0));
  } catch { return []; }
}

async function fetchLastCommit(): Promise<string> {
  try {
    const { data } = await octokit.repos.listCommits({ owner, repo, per_page: 1 });
    return data[0]?.commit?.author?.date ?? new Date().toISOString();
  } catch { return new Date().toISOString(); }
}

// ─── Compute course status ────────────────────────────────────────────────────

function computeStatus(course: ParsedCourse): 'added' | 'modified' | 'stable' | 'attention' {
  const cl = course.changelog?.[0];
  if (!cl) return 'stable';
  const diffDays = (Date.now() - new Date(cl.date).getTime()) / 86_400_000;
  const type = cl.changes[0]?.type;
  if (diffDays <= 7 && type === 'added')    return 'added';
  if (diffDays <= 30 && type !== 'added')   return 'modified';
  return 'stable';
}

// ─── Contributor hue generator ────────────────────────────────────────────────

function loginHue(login: string): number {
  const a = login.charCodeAt(0) ?? 0;
  const b = login.charCodeAt(1) ?? 0;
  return (a * 7 + b * 13) % 360;
}

// ─── Role ranking (higher = more important) ───────────────────────────────────

const ROLE_RANK: Record<string, number> = {
  'Lead Maintainer': 5,
  'maintainer':      4,
  'author':          3,
  'reviewer':        2,
  'translator':      1,
  'illustrator':     1,
  'contributor':     0,
};

function higherRole(a: string, b: string): string {
  return (ROLE_RANK[a] ?? 0) >= (ROLE_RANK[b] ?? 0) ? a : b;
}

// ─── Build site courses ───────────────────────────────────────────────────────

async function buildCourses(slugs: string[]): Promise<SiteCourse[]> {
  const courses: SiteCourse[] = [];
  const repoMetaCache = new Map<string, { stars: number; forks: number; openIssues: number }>();

  for (const slug of slugs) {
    const parsed = readCourseJson(slug);
    if (!parsed) continue;

    const { meta, chapters, contributors } = parsed;
    const repoUrl = meta.repo ?? '';

    if (repoUrl && !repoMetaCache.has(repoUrl)) {
      repoMetaCache.set(repoUrl, await fetchRepoMeta(repoUrl));
    }
    const gh = repoMetaCache.get(repoUrl) ?? { stars: 0, forks: 0, openIssues: 0 };

    const lessonCount = chapters.reduce((s, c) => s + c.lessonCount, 0);
    const durationH   = meta.estimated_hours ?? lessonCount;
    const duration    = durationH >= 1 ? `${durationH}h` : `${Math.round(durationH * 60)}m`;

    const maintainer   = contributors.find(c => c.role === 'author' || c.role === 'maintainer')?.github
                         ?? LEAD_LOGIN;
    const contribLogins = contributors.map(c => c.github).filter(Boolean);

    courses.push({
      slug,
      title:        meta.title,
      description:  meta.description,
      track:        meta.track,
      difficulty:   meta.difficulty,
      duration,
      modules:      chapters.length,
      maintainer,
      contributors: contribLogins,
      tags:         meta.tags ?? [],
      prerequisites: meta.prerequisites ?? [],
      repo:         repoUrl,
      version:      meta.version,
      updatedAt:    parsed.generatedAt,
      featured:     false,
      stars:        gh.stars,
      forks:        gh.forks,
      openIssues:   gh.openIssues,
      status:       computeStatus(parsed),
      lastCommit:   parsed.generatedAt,
      sparklineDays: Array(90).fill(0),
    });
  }
  return courses;
}

// ─── Build site contributors ──────────────────────────────────────────────────

function buildContributors(slugs: string[]): SiteContributor[] {
  const map = new Map<string, { name: string; role: string; commits: number; courseSet: Set<string> }>();

  for (const slug of slugs) {
    const data = readContributorsJson(slug);
    if (!data) continue;
    for (const c of data.contributors) {
      const login = c.github;
      if (!login) continue;
      const existing = map.get(login);
      if (existing) {
        existing.commits  += c.commits;
        existing.role      = higherRole(existing.role, c.role);
        existing.courseSet.add(slug);
      } else {
        map.set(login, {
          name:      c.name,
          role:      c.role,
          commits:   c.commits,
          courseSet: new Set([slug]),
        });
      }
    }
  }

  // Build list sorted by commits descending
  const list: SiteContributor[] = [];
  for (const [login, data] of map.entries()) {
    if (login === LEAD_LOGIN) continue; // pinned separately below
    list.push({
      login,
      name:    data.name,
      role:    data.role,
      commits: data.commits,
      courses: data.courseSet.size,
      hue:     loginHue(login),
    });
  }
  list.sort((a, b) => b.commits - a.commits);

  // Always pin Lead Maintainer at index 0
  const leadData = map.get(LEAD_LOGIN);
  const lead: SiteContributor = {
    login:   LEAD_LOGIN,
    name:    leadData?.name ?? 'Manoj Pisini',
    role:    'Lead Maintainer',
    commits: leadData?.commits ?? 0,
    courses: leadData?.courseSet.size ?? 0,
    hue:     LEAD_HUE,
  };

  return [lead, ...list];
}

// ─── Build changelog ──────────────────────────────────────────────────────────

interface ChangelogMonth {
  month: string;
  entries: Array<{
    course: string;
    slug: string;
    version: string;
    date: string;
    changes: Array<{ type: string; text: string }>;
  }>;
}

function buildChangelog(slugs: string[]): ChangelogMonth[] {
  const byMonth = new Map<string, ChangelogMonth['entries']>();

  for (const slug of slugs) {
    const parsed = readCourseJson(slug);
    if (!parsed?.changelog) continue;
    for (const entry of parsed.changelog) {
      const m = entry.date.slice(0, 7); // "YYYY-MM"
      const arr = byMonth.get(m) ?? [];
      arr.push({
        course:  parsed.meta.title,
        slug,
        version: entry.version,
        date:    entry.date,
        changes: entry.changes,
      });
      byMonth.set(m, arr);
    }
  }

  return [...byMonth.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([month, entries]) => ({ month, entries }));
}

// ─── Build graph ──────────────────────────────────────────────────────────────

function buildGraph(courses: SiteCourse[]) {
  return {
    nodes: courses.map(c => ({
      id:         c.slug,
      title:      c.title,
      track:      c.track,
      difficulty: c.difficulty,
      popularity: c.stars,
    })),
    links: courses.flatMap(c =>
      c.prerequisites.map(p => ({ source: p, target: c.slug, type: 'prerequisite' }))
    ),
  };
}

// ─── Write JSON ───────────────────────────────────────────────────────────────

function write(name: string, data: unknown): void {
  const dest = siteFile(name);
  fs.writeFileSync(dest, JSON.stringify(data, null, 2) + '\n');
  console.log(`✓ ${name} written`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Scanning course directories…');
  const slugs = scanCourseDirs();
  console.log(`Found ${slugs.length} course(s): ${slugs.join(', ') || '(none)'}`);

  console.log('Building courses…');
  const courses = await buildCourses(slugs);

  console.log('Building contributors…');
  const contributors = buildContributors(slugs);

  console.log('Building changelog…');
  const changelog = buildChangelog(slugs);

  console.log('Building graph…');
  const graph = buildGraph(courses);

  console.log('Fetching GitHub commit activity…');
  const weeks = await fetchCommitActivity();
  const activity = { weeks };

  console.log('Fetching last commit…');
  const lastCommit = await fetchLastCommit();

  const stats = {
    courses:      courses.length,
    contributors: contributors.length,
    stars:        courses.reduce((s, c) => s + c.stars, 0),
    forks:        courses.reduce((s, c) => s + c.forks, 0),
    tracks:       12,
    builtAt:      new Date().toISOString(),
    lastCommit,
  };

  write('courses.json',      courses);
  write('contributors.json', contributors);
  write('changelog.json',    changelog);
  write('graph.json',        graph);
  write('activity.json',     activity);
  write('stats.json',        stats);

  console.log(`\nSync complete — ${courses.length} courses, ${contributors.length} contributors`);
}

main().catch(e => { console.error(e); process.exit(1); });
