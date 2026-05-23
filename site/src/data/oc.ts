/* OpenCourses — Data Layer */

import leaderboardRaw  from './leaderboard.json';
import coursesRaw      from './courses.json';
import contributorsRaw from './contributors.json';
import changelogRaw    from './changelog.json';
import activityRaw     from './activity.json';

export const today = new Date();

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

export interface LeaderboardEntry {
  rank: number;
  login: string;
  coursesCompleted: number;
  avgScore: number;
  totalPoints: number;
  maxPoints: number;
  fastestCourse: number | null;
  certified: boolean;
  enrolledCourses: string[];
}

export interface LeaderboardData {
  entries: LeaderboardEntry[];
  stats: {
    totalEnrolled: number;
    totalCertified: number;
    totalCompletions: number;
    avgScore: number;
  };
  builtAt: string;
}

// ============================================================
// Course catalog — auto-populated by sync-site-data workflow
// ============================================================
const COURSES = coursesRaw as unknown as Course[];

// ============================================================
// Tracks — 12 broad categories covering all CS domains
// ============================================================
export const TRACKS: Track[] = [
  {
    slug: "foundations",
    name: "Foundations & Theory",
    icon: "Fn",
    description: "Core dev tools, algorithms, data structures, complexity theory, discrete math, logic, linear algebra, and automata — everything before you specialize.",
  },
  {
    slug: "languages",
    name: "Languages & Paradigms",
    icon: "Lp",
    description: "Low-level (C, C++, Rust, Assembly), OOP (Java, Python, C#, Swift, Kotlin), functional (Haskell, Elixir, Scala), scripting (Bash, Ruby, Lua), logic, and query languages.",
  },
  {
    slug: "web",
    name: "Web & Mobile",
    icon: "Wm",
    description: "HTML, CSS, JS/TS, web frameworks (React, Vue, Angular, Svelte), PWAs, iOS, Android, React Native, Flutter, and WebAssembly.",
  },
  {
    slug: "backend",
    name: "Backend & Databases",
    icon: "Bd",
    description: "Server-side frameworks, REST, GraphQL, gRPC, SQL (PostgreSQL, SQLite), NoSQL (MongoDB, Redis, Cassandra), graph DBs, search engines, and data modeling.",
  },
  {
    slug: "systems",
    name: "Systems & Infrastructure",
    icon: "Si",
    description: "OS internals, compilers, runtimes, memory management, CI/CD, Docker, Kubernetes, Terraform, AWS, GCP, Azure, serverless, IaC, and SRE/observability.",
  },
  {
    slug: "networks",
    name: "Networks & Protocols",
    icon: "Np",
    description: "TCP/IP stack, DNS, HTTP/1–3, QUIC, TLS, BGP, OSPF, WebSockets, WebRTC, SDN, 5G, MPLS, and advanced networking protocols.",
  },
  {
    slug: "data",
    name: "Data & AI",
    icon: "Da",
    description: "ETL/ELT, data lakes, Spark, dbt, Airflow, ML fundamentals, deep learning, transformers, LLMs, reinforcement learning, computer vision, and MLOps.",
  },
  {
    slug: "security",
    name: "Security & Cryptography",
    icon: "Sc",
    description: "Threat modeling, auth (OAuth, OIDC, JWT), TLS, symmetric/asymmetric crypto, OWASP, pentesting, CTF, reverse engineering, post-quantum cryptography, and zero-knowledge proofs.",
  },
  {
    slug: "architecture",
    name: "Architecture & Engineering",
    icon: "Ae",
    description: "System design, distributed systems, microservices, event-driven patterns, CQRS, CAP theorem, GoF patterns, SOLID, DDD, TDD, clean code, and open-source contribution.",
  },
  {
    slug: "creative",
    name: "Creative Computing",
    icon: "Cc",
    description: "Computer graphics (OpenGL, Vulkan, WebGL), shaders (GLSL, HLSL), game engines (Unity, Unreal, Godot), 2D/3D game dev, physics engines, procedural generation, and creative coding.",
  },
  {
    slug: "emerging",
    name: "Emerging Technologies",
    icon: "Et",
    description: "Quantum computing (Qiskit, quantum algorithms), neuromorphic computing, edge AI, blockchain, IPFS, P2P protocols, WebAssembly, formal verification, and advanced post-quantum standards.",
  },
  {
    slug: "applied",
    name: "Applied & Cross-Domain",
    icon: "Ap",
    description: "Computational physics, bioinformatics, scientific computing (NumPy/SciPy/HPC), signal processing, robotics (ROS), FPGA/digital circuits, GIS, computational chemistry, and math-meets-CS.",
  },
];

// ============================================================
// Contributors — auto-populated by sync-site-data workflow
// manojpisini is always index 0 as Lead Maintainer.
// Fallback guarantees at least the lead card exists so that
// /contributors/manojpisini is always a valid static route
// even before the first sync-site-data run.
// ============================================================
const _rawContribs = contributorsRaw as unknown as Contributor[];
export const CONTRIBUTORS: Contributor[] = _rawContribs.length > 0
  ? _rawContribs
  : [{ login: 'manojpisini', name: 'Manoj Pisini', role: 'Lead Maintainer', commits: 0, courses: 0, hue: 220 }];

// ============================================================
// Module detail — populated per-course from course.json
// ============================================================
export const MODULE_TEMPLATES: Record<string, ModuleItem[]> = {};

// ============================================================
// Changelog — auto-populated by sync-site-data workflow
// ============================================================
export const CHANGELOG = changelogRaw as unknown as ChangelogMonth[];

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
  courses:      COURSES.length,
  contributors: CONTRIBUTORS.length,
  stars:        COURSES.reduce((s, c) => s + c.stars, 0),
  forks:        COURSES.reduce((s, c) => s + c.forks, 0),
  tracks:       TRACKS.length,
};

// ============================================================
// Track colors (mirrors CSS variables)
// ============================================================
export const TRACK_COLORS: Record<string, string> = {
  foundations:  "#60a5fa",
  languages:    "#a78bfa",
  web:          "#38BDF8",
  backend:      "#38bdf8",
  systems:      "#34d399",
  networks:     "#facc15",
  data:         "#fb923c",
  security:     "#ef4444",
  architecture: "#94a3b8",
  creative:     "#f472b6",
  emerging:     "#818cf8",
  applied:      "#6ee7b7",
};

// ============================================================
// Activity heatmap — 52w × 7d
// Loaded from activity.json (written by sync-site-data workflow).
// Falls back to zero grid when data is not yet available.
// ============================================================
const _actRaw = activityRaw as { weeks?: number[][] };
function loadActivity(): number[][] {
  if (_actRaw.weeks && _actRaw.weeks.length === 52) return _actRaw.weeks;
  return Array.from({ length: 52 }, () => Array(7).fill(0));
}

// ============================================================
// Sparkline SVG
// ============================================================
export function sparklineSvg(days: number[]): string {
  const max  = Math.max(...days, 1);
  const h    = 16;
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
  LEADERBOARD: leaderboardRaw as unknown as LeaderboardData,
  activity: loadActivity(),
  sparklineSvg,
  fuzzyScore,
  relativeTime,
  trackName,
  today,
};

export const LEADERBOARD = leaderboardRaw as unknown as LeaderboardData;

export { COURSES };
export default OC;
