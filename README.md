<div align="center">

<br/>

<h1>
  <span style="color:#4f9eff">&lt; OPEN</span><span style="color:#eef0f4">COURSES &gt;</span>
</h1>

**Free, open-source developer education — version-controlled and community-built.**<br/>
Every course is a repo. Every update is a commit. Every contributor is a maintainer.

<br/>

[![Site](https://img.shields.io/badge/Website-Live-0075ca?style=flat-square&logo=github)](https://opencourses-org.github.io/opencourses)
[![Courses](https://img.shields.io/badge/Courses-16-2ea44f?style=flat-square&logo=bookstack&logoColor=white)](https://opencourses-org.github.io/opencourses/courses)
[![Contributors](https://img.shields.io/badge/Contributors-18-a78bfa?style=flat-square&logo=github)](https://opencourses-org.github.io/opencourses/contributors)
[![Deploy](https://img.shields.io/github/actions/workflow/status/opencourses-org/opencourses/deploy-site.yml?label=site%20deploy&style=flat-square)](https://github.com/opencourses-org/opencourses/actions)
[![License: MIT](https://img.shields.io/badge/Engine-MIT-f5c542?style=flat-square)](LICENSE)
[![License: CC BY 4.0](https://img.shields.io/badge/Content-CC_BY_4.0-f5c542?style=flat-square)](https://creativecommons.org/licenses/by/4.0/)

<br/>

</div>

---

## What Is OpenCourses?

OpenCourses is not a MOOC. It is not a wiki. It is not a docs site.

It is the first developer education platform built **entirely on GitHub infrastructure** — where courses are repositories, learning progress is tracked in issues and pull requests, and every update ships like a software release.

- **No login walls.** Learning is public. Progress is GitHub-native.
- **No proprietary LMS.** The entire platform runs on GitHub Actions, GitHub Pages, and the GitHub API.
- **No vendor lock-in.** Fork the engine. Run your own instance. CC-licensed content, MIT-licensed code.
- **No stale content.** Every course has a commit history, a version tag, and a maintainer responsible for keeping it current.

The site regenerates automatically on every push. Leaderboards rebuild nightly. Certificates are GPG-signed GitHub Releases — cryptographically verifiable, permanently public.

It is version-controlled education, by design.

---

## The Catalog

| Track | Courses | What you'll learn |
|-------|---------|-------------------|
| **Systems** | Rust Fundamentals · Async Rust · Systems Programming | Memory, concurrency, OS internals |
| **Web** | Modern CSS · TypeScript Types · HTML Done Right | The frontend stack, done properly |
| **Security** | Web Security 101 · Applied Cryptography · Auth Patterns | From XSS to zero-trust |
| **DevOps** | Docker Basics · Kubernetes Fastpath · Observability Core | Ship and operate software |
| **Data** | Data Structures Revisited · Shell Mastery | Foundations that don't rot |
| **Foundations** | Git Internals · Computers from the Ground Up | First principles |

→ **[Browse all 16 courses](https://opencourses-org.github.io/opencourses/courses)**  
→ **[Explore the prerequisite graph](https://opencourses-org.github.io/opencourses/tracks)**

---

## How It Works

```
Student opens an enrollment Issue
         │
         ▼
 Bot processes enrollment · assigns track label · posts welcome message
         │
         ▼
 Student reads course content (Markdown in this repo)
 watches videos · writes code locally
         │
         ▼
 Student opens a PR  →  "Stage 01 · @username"
         │
         ▼
 GitHub Actions: hardened Docker sandbox runs the grader
 posts score + line-by-line feedback as a PR comment
         │
         ▼
 Student opens a quiz-attempt Issue
 Claude grades the quiz · returns score + explanation
         │
         ▼
 Passed all 5 stages?
         │
         ├── No  → Feedback posted · student iterates
         │
         └── Yes → GPG-signed certificate issued as a GitHub Release
                   Student listed as certified on the public leaderboard
```

**Nothing runs on private servers.** Every step happens inside GitHub's own infrastructure — free, auditable, and zero-cost to run.

---

## Repository Layout

```
opencourses/                         ← this repo (monorepo)
│
├── .github/
│   ├── workflows/
│   │   ├── deploy-site.yml          ← Astro build → GitHub Pages  (on every push)
│   │   ├── build-data.yml           ← Refresh live data every 6 hours
│   │   ├── enroll.yml               ← Process enrollment issues
│   │   ├── grade-assignment.yml     ← Docker sandbox grader
│   │   ├── run-quiz.yml             ← Claude quiz grading
│   │   ├── advance-stage.yml        ← Stage unlock logic
│   │   ├── issue-cert.yml           ← GPG-signed certificate generation
│   │   ├── validate-pr.yml          ← PR title + tamper detection
│   │   ├── leaderboard.yml          ← Nightly LEADERBOARD.md rebuild
│   │   ├── build-readme.yml         ← Auto-generate CURRICULUM.md
│   │   ├── dashboard.yml            ← Weekly DASHBOARD.md
│   │   ├── check-videos.yml         ← Weekly YouTube link check
│   │   ├── check-links.yml          ← Weekly dead-link scan
│   │   ├── plagiarism-check.yml     ← AST similarity on every PR
│   │   ├── peer-review-assign.yml   ← Assign peer reviewers (Stage 5)
│   │   ├── peer-review-tally.yml    ← Tally peer-review scores
│   │   ├── mentorship-match.yml     ← Weekly mentor matching
│   │   ├── cohort-nudge.yml         ← Daily inactivity nudge
│   │   └── audit-log.yml            ← Append-only event log
│   ├── ISSUE_TEMPLATE/              ← Enrollment, quiz, support forms
│   ├── profile/README.md            ← Org landing page (github.com/opencourses-org)
│   └── SECURITY.md · SUPPORT.md · FUNDING.yml
│
├── site/                            ← Astro 4 static website → GitHub Pages
│   ├── src/
│   │   ├── data/oc.ts               ★ Course catalog — add courses here
│   │   ├── content/courses/         ★ Per-course Markdown content
│   │   ├── pages/                   ← One .astro file per route
│   │   ├── components/              ← Shared Astro components
│   │   └── styles/global.css        ← Full design system (no Tailwind)
│   └── public/js/                   ← Vanilla JS (catalog, graph, ⌘K palette)
│
└── engine/                          ← Grading engine (TypeScript, do not edit)
    ├── curriculum/                  ← Stage content, quizzes, exercises
    ├── scripts/                     ← 17 automation scripts
    ├── scripts/graders/             ← Per-stage Docker test runners
    └── sandbox/Dockerfile           ← Hardened grading container
```

---

## Adding a Course

> **Only `site/` needs to be touched.** No engine changes required.

### 1 — Register in the catalog

Open **`site/src/data/oc.ts`** and add an entry to the `COURSES` array:

```ts
{
  slug: "your-course-slug",          // becomes /courses/your-course-slug
  title: "Your Course Title",
  description: "One sentence about what this course teaches.",
  track: "web",                      // systems | web | security | devops | data | foundations
  difficulty: "beginner",            // beginner | intermediate | advanced | draft
  duration: "5h",
  modules: 8,
  maintainer: "your-github-login",
  contributors: ["your-github-login"],
  tags: ["html", "css"],
  prerequisites: [],                 // slugs of courses to complete first
  repo: "opencourses-org/opencourses",
  version: "v1.0.0",
  updatedAt: "2026-05-19T00:00:00Z",
  featured: false,
  stars: 0, forks: 0, openIssues: 0,
  status: "added",                   // added | modified | stable | attention
  lastCommit: "Initial release",
},
```

The detail page at `/courses/your-course-slug` generates automatically.

### 2 — Add course content (optional but recommended)

Create **`site/src/content/courses/your-course-slug.md`**:

```markdown
---
title: "Your Course Title"
description: "One sentence."
track: "web"
difficulty: "beginner"
modules: 8
duration: "5h"
updatedAt: "2026-05-19T00:00:00Z"
status: "added"
tags: ["html", "css"]
stars: 0
version: "v1.0.0"
maintainer: "your-github-login"
repo: "opencourses-org/opencourses"
prerequisites: []
---

Write your course overview here — this renders on the course detail page.

## What You'll Build
- Project 1
- Project 2

## Prerequisites
- Comfortable with a terminal
```

### 3 — Push

```bash
git add site/
git commit -m "course: add Your Course Title"
git push
```

Site rebuilds in ~60 seconds. Your course is live.

---

## Contributing

We welcome course contributions, content fixes, and site improvements.

| What | How |
|------|-----|
| **New course** | Follow "Adding a Course" above → open a PR |
| **Fix a typo / improve content** | Edit `site/src/data/oc.ts` or the course `.md` → open a PR |
| **Report broken content** | Open an issue with the `content-fix` label |
| **Suggest a new course** | Open an issue — describe the topic, audience, and why it's missing |
| **Improve the site** | Open a PR against anything in `site/` |
| **Translate a course** | Open an issue first to coordinate effort |

### Ground rules

1. **One PR per course.** Don't bundle unrelated courses.
2. **Write for practitioners.** Assume terminal-comfortable learners with some experience. Don't over-explain basics; link to references instead.
3. **No paywalled resources.** All prerequisites, readings, and exercises must be freely available.
4. **Own your course.** As maintainer you are responsible for accuracy. Use `status: "attention"` if you can no longer maintain it.
5. **Be honest about scope.** Use `difficulty: "draft"` while a course is incomplete. Mark it `stable` only when it's solid.

This project follows the [Contributor Covenant v2.1](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Site framework | [Astro 4](https://astro.build) — `output: static` | Zero JS runtime shipped to browsers |
| Interactivity | Vanilla JS IIFEs | Command palette, force graph, catalog filter |
| Styling | Custom CSS design system | 42 KB, no Tailwind |
| Fonts | DM Sans + JetBrains Mono + Sora | Google Fonts, subset-loaded |
| Knowledge graph | Custom JS force simulation | No D3 — pure physics in ~150 lines |
| Hosting | GitHub Pages | Free, org-native, automatic |
| CI/CD | GitHub Actions | Build + deploy + grade + certify |
| Grading | Docker sandbox (`ubuntu-latest`) | Reproducible, isolated, zero server cost |
| Quiz grading | Claude API (Anthropic) | Semantic evaluation, not keyword matching |
| Certificates | GPG-signed GitHub Releases | Cryptographically verifiable |

**Browser payload per page visit:**

| Asset | Size |
|-------|------|
| CSS (entire design system) | 42 KB |
| Global JS (theme + ⌘K) | 2 KB |
| Page JS (catalog / graph, loaded only where needed) | 6–9 KB |
| HTML (pre-rendered at build time) | 30–150 KB |
| Fonts (cached after first visit) | ~60 KB |

No framework runtime. No hydration. No client-side routing overhead.

---

## Deployment

The site deploys automatically when anything in `site/**` is pushed to `main`.

```
push to main (site/** changed)
       │
       ▼
GitHub Actions: deploy-site.yml
       ├── bun install
       ├── astro build  (SITE_URL + BASE_PATH from repo vars)
       └── upload site/dist/ → GitHub Pages
```

**Live at:** [https://opencourses-org.github.io/opencourses](https://opencourses-org.github.io/opencourses)

To trigger manually: **Actions → Deploy Site to GitHub Pages → Run workflow**

---

## Quick Links

| Resource | Link |
|----------|------|
| 🌐 Website | [opencourses-org.github.io/opencourses](https://opencourses-org.github.io/opencourses) |
| 📚 Course catalog | [/courses](https://opencourses-org.github.io/opencourses/courses) |
| 🗺️ Knowledge graph | [/tracks](https://opencourses-org.github.io/opencourses/tracks) |
| 👥 Contributors | [/contributors](https://opencourses-org.github.io/opencourses/contributors) |
| 📋 Curriculum | [engine/CURRICULUM.md](engine/CURRICULUM.md) |
| 🏆 Leaderboard | [engine/LEADERBOARD.md](engine/LEADERBOARD.md) |
| 🎓 Certified | [engine/CERTIFIED.md](engine/CERTIFIED.md) |
| 🛠️ Setup guide | [SETUP.md](SETUP.md) |

---

## License

**Engine & site code** — [MIT](LICENSE)  
**Course content** (`site/src/content/`, `engine/curriculum/`) — [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

Fork the code freely. Use and remix the content freely. Credit us either way.

---

## Security

Found a vulnerability? **Do not open a public issue.**  
Report via [GitHub Security Advisories](https://github.com/opencourses-org/opencourses/security/advisories/new). We respond within 72 hours.

---

<div align="center">

Built in the open · Shipped like software · Free forever

**[opencourses-org.github.io/opencourses](https://opencourses-org.github.io/opencourses)**

</div>
