/* OpenCourses — Data Layer (ported from data.js → ES module) */

export const today = new Date();

const daysAgo = (n: number): string => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

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
// Course catalog — 16 courses across 5 tracks
// ============================================================
const COURSES: Course[] = [
  {
    slug: "rust-fundamentals",
    title: "Rust Fundamentals",
    description: "Learn systems programming from zero. Build real projects with Rust's type system, ownership model, and concurrency primitives.",
    track: "systems", difficulty: "advanced", duration: "8h", modules: 12,
    maintainer: "manojpisini", contributors: ["manojpisini", "linnea", "tomasz"],
    tags: ["rust", "memory", "concurrency", "systems"],
    prerequisites: ["systems-intro"],
    repo: "opencourses/rust-fundamentals", version: "v2.1.0",
    updatedAt: daysAgo(2), featured: true, stars: 142, forks: 38, openIssues: 3,
    status: "added", lastCommit: "Add Module 10: Tokio runtime internals",
  },
  {
    slug: "web-security-101",
    title: "Web Security 101",
    description: "From XSS to CSRF to session pinning. A no-nonsense walkthrough of the attacks your app needs to survive.",
    track: "security", difficulty: "beginner", duration: "4h", modules: 8,
    maintainer: "rohini", contributors: ["rohini", "sven", "leah"],
    tags: ["security", "web", "xss", "csrf"],
    prerequisites: [],
    repo: "opencourses/web-security-101", version: "v1.3.0",
    updatedAt: daysAgo(8), featured: true, stars: 211, forks: 47, openIssues: 1,
    status: "stable", lastCommit: "Add CSRF deep-dive section",
  },
  {
    slug: "async-rust",
    title: "Async Rust",
    description: "Tokio, async/await, pinning, and the executor model. Continuation of Rust Fundamentals for the runtime-curious.",
    track: "systems", difficulty: "advanced", duration: "6h", modules: 10,
    maintainer: "manojpisini", contributors: ["manojpisini", "kalia"],
    tags: ["rust", "async", "tokio"],
    prerequisites: ["rust-fundamentals"],
    repo: "opencourses/async-rust", version: "v0.8.0",
    updatedAt: daysAgo(4), featured: true, stars: 88, forks: 12, openIssues: 5,
    status: "added", lastCommit: "WIP: pinning chapter rewrite",
  },
  {
    slug: "systems-intro",
    title: "Systems Programming, Plainly",
    description: "What an operating system actually does. Processes, threads, virtual memory, syscalls — explained without hand-waving.",
    track: "systems", difficulty: "intermediate", duration: "10h", modules: 14,
    maintainer: "tomasz", contributors: ["tomasz", "manojpisini"],
    tags: ["os", "memory", "processes"],
    prerequisites: [],
    repo: "opencourses/systems-intro", version: "v2.0.0",
    updatedAt: daysAgo(45), featured: false, stars: 320, forks: 71, openIssues: 2,
    status: "stable", lastCommit: "Fix typo in syscall table",
  },
  {
    slug: "modern-css",
    title: "Modern CSS, End to End",
    description: "Container queries, subgrid, cascade layers, `:has`. The CSS you should actually be writing in 2026.",
    track: "web", difficulty: "intermediate", duration: "5h", modules: 9,
    maintainer: "leah", contributors: ["leah", "andrei", "soraya"],
    tags: ["css", "layout", "responsive"],
    prerequisites: [],
    repo: "opencourses/modern-css", version: "v3.0.0",
    updatedAt: daysAgo(1), featured: true, stars: 489, forks: 102, openIssues: 0,
    status: "added", lastCommit: "Module 7: subgrid worked examples",
  },
  {
    slug: "typescript-types",
    title: "TypeScript Type-Level Programming",
    description: "Conditional types, infer, template literal types. Stop fighting TypeScript and start composing with it.",
    track: "web", difficulty: "advanced", duration: "6h", modules: 11,
    maintainer: "andrei", contributors: ["andrei", "leah"],
    tags: ["typescript", "types", "generics"],
    prerequisites: [],
    repo: "opencourses/typescript-types", version: "v1.5.0",
    updatedAt: daysAgo(11), featured: false, stars: 256, forks: 38, openIssues: 4,
    status: "stable", lastCommit: "Add infer pattern matching exercises",
  },
  {
    slug: "html-fundamentals",
    title: "HTML, Done Right",
    description: "Semantic structure, ARIA roles, and the elements you probably haven't used. Build accessible markup from first principles.",
    track: "web", difficulty: "beginner", duration: "3h", modules: 7,
    maintainer: "soraya", contributors: ["soraya", "leah"],
    tags: ["html", "a11y", "semantics"],
    prerequisites: [],
    repo: "opencourses/html-fundamentals", version: "v1.0.0",
    updatedAt: daysAgo(120), featured: false, stars: 178, forks: 22, openIssues: 8,
    status: "attention", lastCommit: "Open issue: missing dialog example",
  },
  {
    slug: "kubernetes-fastpath",
    title: "Kubernetes Fast Path",
    description: "From `kubectl get pods` to writing a custom controller. The 20% of K8s you'll use 80% of the time.",
    track: "devops", difficulty: "intermediate", duration: "7h", modules: 11,
    maintainer: "kalia", contributors: ["kalia", "rohini", "sven"],
    tags: ["kubernetes", "containers", "ops"],
    prerequisites: ["docker-basics"],
    repo: "opencourses/kubernetes-fastpath", version: "v2.3.0",
    updatedAt: daysAgo(6), featured: false, stars: 367, forks: 64, openIssues: 2,
    status: "added", lastCommit: "Add custom controller walkthrough",
  },
  {
    slug: "docker-basics",
    title: "Docker, From Scratch",
    description: "Images, layers, networking, volumes. Understand what docker is doing under the hood before you reach for Compose.",
    track: "devops", difficulty: "beginner", duration: "3h", modules: 8,
    maintainer: "sven", contributors: ["sven", "kalia"],
    tags: ["docker", "containers", "linux"],
    prerequisites: [],
    repo: "opencourses/docker-basics", version: "v2.1.0",
    updatedAt: daysAgo(30), featured: false, stars: 412, forks: 89, openIssues: 1,
    status: "stable", lastCommit: "Update for Docker 27",
  },
  {
    slug: "observability-core",
    title: "Observability Core",
    description: "Logs, metrics, traces — and when each one is the wrong tool. Build a mental model for production debugging.",
    track: "devops", difficulty: "intermediate", duration: "5h", modules: 9,
    maintainer: "kalia", contributors: ["kalia"],
    tags: ["observability", "metrics", "tracing"],
    prerequisites: [],
    repo: "opencourses/observability-core", version: "v0.6.0",
    updatedAt: daysAgo(14), featured: false, stars: 94, forks: 11, openIssues: 6,
    status: "modified", lastCommit: "WIP: OpenTelemetry chapter",
  },
  {
    slug: "applied-cryptography",
    title: "Applied Cryptography",
    description: "Symmetric, asymmetric, hashing, signing. What to use, when to use it, and how to not roll your own.",
    track: "security", difficulty: "advanced", duration: "9h", modules: 13,
    maintainer: "rohini", contributors: ["rohini", "linnea"],
    tags: ["crypto", "security", "tls"],
    prerequisites: ["web-security-101"],
    repo: "opencourses/applied-cryptography", version: "v1.1.0",
    updatedAt: daysAgo(22), featured: false, stars: 134, forks: 24, openIssues: 3,
    status: "stable", lastCommit: "Module 8: TLS handshake annotated",
  },
  {
    slug: "auth-patterns",
    title: "Auth Patterns: OAuth, OIDC, Passkeys",
    description: "OAuth flows decoded, OIDC clarified, passkeys deployed. The auth landscape, structured.",
    track: "security", difficulty: "intermediate", duration: "4h", modules: 8,
    maintainer: "rohini", contributors: ["rohini", "andrei"],
    tags: ["auth", "oauth", "passkeys"],
    prerequisites: ["web-security-101"],
    repo: "opencourses/auth-patterns", version: "v0.4.0",
    updatedAt: daysAgo(3), featured: true, stars: 76, forks: 8, openIssues: 4,
    status: "added", lastCommit: "Add WebAuthn registration example",
  },
  {
    slug: "computers-from-the-ground-up",
    title: "Computers, From the Ground Up",
    description: "Logic gates → registers → CPU → memory hierarchy. The foundation no bootcamp will teach you.",
    track: "fundamentals", difficulty: "beginner", duration: "12h", modules: 16,
    maintainer: "tomasz", contributors: ["tomasz", "linnea", "manojpisini"],
    tags: ["hardware", "cpu", "fundamentals"],
    prerequisites: [],
    repo: "opencourses/computers-from-the-ground-up", version: "v1.4.0",
    updatedAt: daysAgo(18), featured: false, stars: 528, forks: 110, openIssues: 2,
    status: "stable", lastCommit: "Polish CPU pipeline diagram",
  },
  {
    slug: "data-structures-revisited",
    title: "Data Structures, Revisited",
    description: "Arrays, trees, hash maps — but with cache lines, branch prediction, and real perf measurements.",
    track: "fundamentals", difficulty: "intermediate", duration: "8h", modules: 12,
    maintainer: "linnea", contributors: ["linnea", "tomasz"],
    tags: ["algorithms", "data-structures", "perf"],
    prerequisites: [],
    repo: "opencourses/data-structures-revisited", version: "v2.0.0",
    updatedAt: daysAgo(70), featured: false, stars: 297, forks: 41, openIssues: 9,
    status: "attention", lastCommit: "needs contributor: B-tree chapter",
  },
  {
    slug: "git-internals",
    title: "Git Internals",
    description: "Objects, refs, the index, packfiles. Read your `.git` directory and understand every byte.",
    track: "fundamentals", difficulty: "intermediate", duration: "5h", modules: 10,
    maintainer: "linnea", contributors: ["linnea", "manojpisini", "andrei"],
    tags: ["git", "version-control", "internals"],
    prerequisites: [],
    repo: "opencourses/git-internals", version: "v1.2.0",
    updatedAt: daysAgo(5), featured: true, stars: 612, forks: 95, openIssues: 0,
    status: "added", lastCommit: "Module 9: packfile delta encoding",
  },
  {
    slug: "shell-mastery",
    title: "Shell Mastery: Bash + Zsh",
    description: "Variables, expansion, control flow, signals. Write shell scripts you'll trust in production.",
    track: "fundamentals", difficulty: "beginner", duration: "4h", modules: 9,
    maintainer: "sven", contributors: ["sven"],
    tags: ["shell", "bash", "linux"],
    prerequisites: [],
    repo: "opencourses/shell-mastery", version: "v1.0.0",
    updatedAt: daysAgo(200), featured: false, stars: 156, forks: 23, openIssues: 12,
    status: "attention", lastCommit: "needs maintainer: zsh chapter outdated",
  },
];

// ============================================================
// Tracks
// ============================================================
export const TRACKS: Track[] = [
  { slug: "fundamentals", name: "Fundamentals", icon: "Fn", description: "The bedrock. Computer architecture, data structures, version control, the shell." },
  { slug: "systems", name: "Systems", icon: "Sy", description: "Operating systems, low-level languages, runtimes. How things work under the surface." },
  { slug: "web", name: "Web", icon: "Wb", description: "HTML, CSS, JS, TS. Building for the browser, well." },
  { slug: "devops", name: "DevOps", icon: "Do", description: "Containers, orchestration, observability. Operating software in production." },
  { slug: "security", name: "Security", icon: "Se", description: "Threat modeling, cryptography, auth. Defending against real attacks." },
];

// ============================================================
// Contributors
// ============================================================
export const CONTRIBUTORS: Contributor[] = [
  { login: "manojpisini", name: "Manoj Pisini", role: "Lead Maintainer · Lead Developer", commits: 412, courses: 4, hue: 200 },
  { login: "leah", name: "Leah Park", role: "Maintainer · Web", commits: 388, courses: 4, hue: 320 },
  { login: "rohini", name: "Rohini Iyer", role: "Maintainer · Security", commits: 356, courses: 4, hue: 30 },
  { login: "linnea", name: "Linnea Holm", role: "Maintainer · Fundamentals", commits: 298, courses: 5, hue: 280 },
  { login: "tomasz", name: "Tomasz Bauer", role: "Maintainer · Fundamentals", commits: 261, courses: 4, hue: 160 },
  { login: "kalia", name: "Kalia Reyes", role: "Maintainer · DevOps", commits: 244, courses: 4, hue: 100 },
  { login: "sven", name: "Sven Eklund", role: "Contributor", commits: 188, courses: 4, hue: 240 },
  { login: "andrei", name: "Andrei Petrescu", role: "Contributor", commits: 142, courses: 3, hue: 60 },
  { login: "soraya", name: "Soraya Nazari", role: "Contributor", commits: 96, courses: 2, hue: 350 },
  { login: "yuki", name: "Yuki Tanaka", role: "Contributor", commits: 78, courses: 2, hue: 180 },
  { login: "diego", name: "Diego Vargas", role: "Contributor", commits: 64, courses: 2, hue: 20 },
  { login: "amara", name: "Amara Okafor", role: "Contributor", commits: 51, courses: 1, hue: 290 },
  { login: "ines", name: "Inês Ferreira", role: "Contributor", commits: 43, courses: 1, hue: 140 },
  { login: "lucas", name: "Lucas Brun", role: "Contributor", commits: 38, courses: 1, hue: 220 },
  { login: "naomi", name: "Naomi Cole", role: "Contributor", commits: 34, courses: 1, hue: 360 },
  { login: "kieran", name: "Kieran Walsh", role: "Contributor", commits: 29, courses: 1, hue: 70 },
  { login: "priya", name: "Priya Sharma", role: "Contributor", commits: 24, courses: 1, hue: 305 },
  { login: "milo", name: "Milo Hartman", role: "Contributor", commits: 21, courses: 1, hue: 195 },
];

// ============================================================
// Module templates
// ============================================================
export const MODULE_TEMPLATES: Record<string, ModuleItem[]> = {
  "rust-fundamentals": [
    { title: "Why Rust Exists", duration: "20min", body: "A short tour of the niche Rust fills — between C's performance and a high-level language's safety. We'll look at three real bugs Rust would have prevented at compile time." },
    { title: "Ownership & Moves", duration: "45min", body: "The single rule that makes Rust's safety guarantees possible. We trace ownership through stack and heap, and write code that the borrow checker rejects (and learn why)." },
    { title: "References & Borrowing", duration: "40min", body: "Mutable vs immutable borrows. The exclusivity rule, why aliasing is the root of most data races, and how `&mut` codifies it." },
    { title: "Lifetimes, Practically", duration: "50min", body: "Lifetimes as constraints, not annotations. We use the elision rules to read existing signatures and only write explicit lifetimes when forced." },
    { title: "Traits & Generics", duration: "55min", body: "Traits are interfaces. Generics let one function work for many types. Together they replace inheritance — entirely." },
    { title: "Error Handling, Idiomatic", duration: "35min", body: "`Result<T, E>`, `?`, error conversion, and when to use `anyhow` vs `thiserror`. Stop using `unwrap()`." },
    { title: "Iterators & Closures", duration: "40min", body: "The most underrated feature of Rust. Iterators compose, are zero-cost, and replace most for-loops you'd write." },
    { title: "Smart Pointers", duration: "30min", body: "`Box`, `Rc`, `Arc`, `RefCell`. When to reach for each — and why `Rc<RefCell<T>>` should make you stop and think." },
    { title: "Concurrency: Threads", duration: "40min", body: "`std::thread`, `Send`/`Sync`, channels. Fearless concurrency, demystified." },
    { title: "Tokio Runtime Internals", duration: "60min", body: "Inside the async runtime. Reactors, executors, wakers — what `await` actually does." },
    { title: "Project: Build a TCP Echo Server", duration: "50min", body: "Pulling it together. ~150 lines of safe, concurrent network code." },
    { title: "Where to Go Next", duration: "10min", body: "Embedded with `no_std`, web with Axum, systems with the kernel for Rust." },
  ],
};

// ============================================================
// Changelog
// ============================================================
export const CHANGELOG: ChangelogMonth[] = [
  {
    month: "May 2026",
    entries: [
      { course: "Modern CSS, End to End", slug: "modern-css", version: "v3.0.0", date: "May 17", changes: [{ type: "added", text: "Module 7: Subgrid worked examples" }, { type: "added", text: "Module 8: `@container` cookbook" }, { type: "modified", text: "Rewrote Module 2: cascade layers" }, { type: "removed", text: "Outdated flexbox-only layout chapter" }] },
      { course: "Rust Fundamentals", slug: "rust-fundamentals", version: "v2.1.0", date: "May 16", changes: [{ type: "added", text: "Module 9: Async/Await patterns" }, { type: "added", text: "Module 10: Tokio runtime internals" }, { type: "modified", text: "Rewrote Module 4: ownership examples" }] },
      { course: "Auth Patterns", slug: "auth-patterns", version: "v0.4.0", date: "May 15", changes: [{ type: "added", text: "WebAuthn registration walkthrough" }, { type: "added", text: "Passkeys interop notes (Apple, Google, 1Password)" }] },
      { course: "Async Rust", slug: "async-rust", version: "v0.8.0", date: "May 14", changes: [{ type: "modified", text: "Pinning chapter — major rewrite WIP" }, { type: "added", text: "Tokio worker pool diagrams" }] },
      { course: "Git Internals", slug: "git-internals", version: "v1.2.0", date: "May 13", changes: [{ type: "added", text: "Module 9: packfile delta encoding" }, { type: "modified", text: "Module 4: refs and pack indexing" }] },
    ],
  },
  {
    month: "April 2026",
    entries: [
      { course: "Web Security 101", slug: "web-security-101", version: "v1.3.0", date: "Apr 28", changes: [{ type: "added", text: "CSRF deep-dive section" }, { type: "removed", text: "Outdated JWT section" }, { type: "modified", text: "Content security policy chapter" }] },
      { course: "Kubernetes Fast Path", slug: "kubernetes-fastpath", version: "v2.3.0", date: "Apr 22", changes: [{ type: "added", text: "Custom controller walkthrough" }, { type: "modified", text: "Helm chapter updated for v3.15" }] },
      { course: "Observability Core", slug: "observability-core", version: "v0.6.0", date: "Apr 18", changes: [{ type: "added", text: "OpenTelemetry chapter (WIP)" }, { type: "modified", text: "Metrics vs traces decision framework" }] },
    ],
  },
  {
    month: "March 2026",
    entries: [
      { course: "Applied Cryptography", slug: "applied-cryptography", version: "v1.1.0", date: "Mar 30", changes: [{ type: "added", text: "Module 8: TLS handshake annotated" }, { type: "added", text: "Hybrid encryption case studies" }] },
      { course: "Data Structures, Revisited", slug: "data-structures-revisited", version: "v2.0.0", date: "Mar 12", changes: [{ type: "added", text: "Cache-aware benchmarks for every structure" }, { type: "modified", text: "Hash maps: linear vs quadratic probing" }] },
    ],
  },
];

// ============================================================
// Knowledge graph
// ============================================================
const RELATED: [string, string][] = [
  ["html-fundamentals", "modern-css"],
  ["modern-css", "typescript-types"],
  ["docker-basics", "observability-core"],
  ["systems-intro", "data-structures-revisited"],
  ["git-internals", "data-structures-revisited"],
  ["computers-from-the-ground-up", "systems-intro"],
  ["shell-mastery", "docker-basics"],
  ["auth-patterns", "applied-cryptography"],
];

export const GRAPH = {
  nodes: COURSES.map((c) => ({
    id: c.slug,
    title: c.title,
    track: c.track,
    difficulty: c.difficulty,
    popularity: c.stars,
  })) as GraphNode[],
  links: [
    ...COURSES.flatMap((c) =>
      c.prerequisites.map((p) => ({ source: p, target: c.slug, type: "prerequisite" as const }))
    ),
    ...RELATED.map(([a, b]) => ({ source: a, target: b, type: "related" as const })),
  ] as GraphLink[],
};

// ============================================================
// Stats
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
  web: "#4f9eff",
  systems: "#a78bfa",
  devops: "#34d399",
  security: "#fb923c",
  fundamentals: "#f472b6",
};

// ============================================================
// Activity heatmap — 52w × 7d (seeded pseudo-random)
// ============================================================
function generateActivity(): number[][] {
  const weeks: number[][] = [];
  let seed = 42;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let w = 0; w < 52; w++) {
    const days: number[] = [];
    for (let d = 0; d < 7; d++) {
      const weekendDrag = d === 0 || d === 6 ? 0.4 : 1;
      const burst = w % 8 === 0 ? 1.4 : 1;
      const r = rand() * weekendDrag * burst;
      let count: number;
      if (r < 0.45) count = 0;
      else if (r < 0.7) count = Math.floor(rand() * 2) + 1;
      else if (r < 0.92) count = Math.floor(rand() * 3) + 3;
      else count = Math.floor(rand() * 5) + 6;
      days.push(count);
    }
    weeks.push(days);
  }
  return weeks;
}

// ============================================================
// Sparkline
// ============================================================
function generateSparklineData(slug: string, lastIdx: number): number[] {
  let seed = slug.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const days: number[] = [];
  for (let i = 0; i < 90; i++) {
    const distFromEdit = Math.abs(i - lastIdx);
    const proximity = Math.max(0, 1 - distFromEdit / 30);
    const r = rand();
    let n = 0;
    if (r < 0.5 - proximity * 0.2) n = 0;
    else if (r < 0.85) n = Math.floor(rand() * 3) + 1;
    else n = Math.floor(rand() * 4) + 3;
    days.push(n);
  }
  return days;
}

export function sparklineSvg(days: number[]): string {
  const max = Math.max(...days, 1);
  const w = 96;
  const h = 16;
  const barW = 1;
  return `<svg width="${w}" height="${h}" viewBox="0 0 90 ${h}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">${days
    .map((c, i) => {
      const hPx = c === 0 ? 2 : Math.max(2, (c / max) * h);
      const op = c === 0 ? 0.18 : 0.2 + (c / max) * 0.8;
      const y = h - hPx;
      return `<rect x="${i}" y="${y}" width="${barW}" height="${hPx}" fill="currentColor" opacity="${op}" rx="0.3"/>`;
    })
    .join("")}</svg>`;
}

// Attach sparkline to each course
COURSES.forEach((c) => {
  const days = Math.round((today.getTime() - new Date(c.updatedAt).getTime()) / 86400000);
  c.sparklineDays = generateSparklineData(c.slug, 89 - Math.min(89, days));
  c.sparklineSvg = sparklineSvg(c.sparklineDays);
});

// ============================================================
// Helpers
// ============================================================
export function fuzzyScore(text: string, needle: string): number {
  text = text.toLowerCase();
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
  const ms = today.getTime() - new Date(iso).getTime();
  const days = Math.floor(ms / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "1d ago";
  if (days < 30) return `${days}d ago`;
  if (days < 60) return "1mo ago";
  return `${Math.floor(days / 30)}mo ago`;
}

export function trackName(slug: string): string {
  const t = TRACKS.find((t) => t.slug === slug);
  return t ? t.name : slug;
}

// ============================================================
// Main OC export (mirrors window.OC)
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
