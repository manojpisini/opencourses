/* OpenCourses — Data Layer */

export const today = new Date();

const daysAgo = (n: number): string => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d.toISOString();
};
void daysAgo; // exported for use by generated data loaders

// ============================================================
// Types
// ============================================================
export interface Course {
  slug: string;
  title: string;
  description: string;
  track: string;
  difficulty: "beginner" | "intermediate" | "advanced" | "draft";
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
  status: "added" | "modified" | "stable" | "attention";
  lastCommit: string;
  sparklineDays?: number[];
  sparklineSvg?: string;
}

export interface Track {
  slug: string;
  name: string;
  icon: string;
  description: string;
}

export interface Contributor {
  login: string;
  name: string;
  role: string;
  commits: number;
  courses: number;
  hue: number;
}

export interface ChangeEntry {
  type: "added" | "removed" | "modified";
  text: string;
}

export interface ChangelogEntry {
  course: string;
  slug: string;
  version: string;
  date: string;
  changes: ChangeEntry[];
}

export interface ChangelogMonth {
  month: string;
  entries: ChangelogEntry[];
}

export interface GraphNode {
  id: string;
  title: string;
  track: string;
  difficulty: string;
  popularity: number;
}

export interface GraphLink {
  source: string;
  target: string;
  type: "prerequisite" | "related";
}

export interface ModuleItem {
  title: string;
  duration: string;
  body: string;
}

// ============================================================
// Course catalog — populated by course-publish workflow
// ============================================================
const COURSES: Course[] = [];

// ============================================================
// Tracks
// ============================================================
export const TRACKS: Track[] = [
  { slug: "foundations", name: "Foundations",  icon: "Fn", description: "Core tools every developer needs — Git, the terminal, HTTP, and how the web works." },
  { slug: "systems",     name: "Systems",      icon: "Sy", description: "Operating systems, low-level languages, runtimes. How things work under the surface." },
  { slug: "web",         name: "Web",          icon: "Wb", description: "HTML, CSS, JS, TS. Building for the browser, well." },
  { slug: "devops",      name: "DevOps",       icon: "Do", description: "Containers, orchestration, observability. Operating software in production." },
  { slug: "data",        name: "Data",         icon: "Da", description: "SQL, data pipelines, and analytics engineering." },
  { slug: "security",    name: "Security",     icon: "Se", description: "Threat modeling, cryptography, auth. Defending against real attacks." },
  { slug: "ai-ml",       name: "AI / ML",      icon: "Ai", description: "LLMs, ML fundamentals, and production AI engineering." },
  { slug: "open-source", name: "Open Source",  icon: "Os", description: "Navigate real codebases, write good issues, and contribute effectively." },
];

// ============================================================
// Contributors — populated by detect-contributors workflow
// ============================================================
export const CONTRIBUTORS: Contributor[] = [];

// ============================================================
// Module detail — populated per-course from course.json
// ============================================================
export const MODULE_TEMPLATES: Record<string, ModuleItem[]> = {};

// ============================================================
// Changelog — populated by course-publish workflow
// ============================================================
export const CHANGELOG: ChangelogMonth[] = [];

// ============================================================
// Knowledge graph — derived from course prerequisites
// ============================================================
export const GRAPH = {
  nodes: COURSES.map((c) => ({
    id: c.slug,
    title: c.title,
    track: c.track,
    difficulty: c.difficulty,
    popularity: c.stars,
  })) as GraphNode[],
  links: COURSES.flatMap((c) =>
    c.prerequisites.map((p) => ({ source: p, target: c.slug, type: "prerequisite" as const }))
  ) as GraphLink[],
};

// ============================================================
// Stats — derived from live data
// ============================================================
export const STATS = {
  courses: COURSES.length,
  contributors: CONTRIBUTORS.length,
  stars: COURSES.reduce((s, c) => s + c.stars, 0),
  forks: COURSES.reduce((s, c) => s + c.forks, 0),
  tracks: TRACKS.length,
};

// ============================================================
// Track colors (mirrors CSS)
// ============================================================
export const TRACK_COLORS: Record<string, string> = {
  foundations: "#60a5fa",
  systems:     "#a78bfa",
  web:         "#4f9eff",
  devops:      "#34d399",
  data:        "#fbbf24",
  security:    "#fb923c",
  "ai-ml":     "#f472b6",
  "open-source": "#94a3b8",
};

// ============================================================
// Activity heatmap — 52w × 7d
// Returns all zeros until real commit activity is loaded
// ============================================================
function generateActivity(): number[][] {
  return Array.from({ length: 52 }, () => Array(7).fill(0));
}

// ============================================================
// Sparkline SVG
// ============================================================
export function sparklineSvg(days: number[]): string {
  const max = Math.max(...days, 1);
  const h = 16;
  const barW = 1;
  return `<svg width="96" height="${h}" viewBox="0 0 90 ${h}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">${days
    .map((c, i) => {
      const hPx = c === 0 ? 2 : Math.max(2, (c / max) * h);
      const op  = c === 0 ? 0.18 : 0.2 + (c / max) * 0.8;
      const y   = h - hPx;
      return `<rect x="${i}" y="${y}" width="${barW}" height="${hPx}" fill="currentColor" opacity="${op}" rx="0.3"/>`;
    })
    .join("")}</svg>`;
}

// ============================================================
// Helpers
// ============================================================
export function fuzzyScore(text: string, needle: string): number {
  text   = text.toLowerCase();
  needle = needle.toLowerCase();
  if (!needle) return 1;
  if (text.includes(needle)) return 100 - text.indexOf(needle);
  let hi = 0, ni = 0, score = 0;
  while (hi < text.length && ni < needle.length) {
    if (text[hi] === needle[ni]) {
      score += hi === ni ? 2 : 1;
      ni++;
    }
    hi++;
  }
  return ni === needle.length ? score : 0;
}

export function relativeTime(iso: string): string {
  const ms   = today.getTime() - new Date(iso).getTime();
  const days = Math.floor(ms / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "1d ago";
  if (days < 30)  return `${days}d ago`;
  if (days < 60)  return "1mo ago";
  return `${Math.floor(days / 30)}mo ago`;
}

export function trackName(slug: string): string {
  const t = TRACKS.find((t) => t.slug === slug);
  return t ? t.name : slug;
}

// ============================================================
// Main OC export
// ============================================================
const OC = {
  COURSES,
  TRACKS,
  CONTRIBUTORS,
  CHANGELOG,
  GRAPH,
  STATS,
  TRACK_COLORS,
  MODULE_TEMPLATES,
  activity: generateActivity(),
  sparklineSvg,
  fuzzyScore,
  relativeTime,
  trackName,
  today,
};

export { COURSES };
export default OC;
