
<img src="docs/banner.svg" alt="OpenCourses — Free, open-source developer education" width="100%"/>

<br/>
<br/>

[![Site](https://img.shields.io/badge/Website-Live-0075ca?style=for-the-badge&logo=github&logoColor=white)](https://manojpisini.github.io/opencourses)
[![Courses](https://img.shields.io/badge/dynamic/json?color=2ea44f&label=Courses&query=%24.courses&url=https%3A%2F%2Fmanojpisini.github.io%2Fopencourses%2Fstats.json&style=for-the-badge&logo=bookstack&logoColor=white)](https://manojpisini.github.io/opencourses/courses)
[![Contributors](https://img.shields.io/badge/dynamic/json?color=a78bfa&label=Contributors&query=%24.contributors&url=https%3A%2F%2Fmanojpisini.github.io%2Fopencourses%2Fstats.json&style=for-the-badge&logo=github&logoColor=white)](https://manojpisini.github.io/opencourses/contributors)
[![Deploy](https://img.shields.io/github/actions/workflow/status/manojpisini/opencourses/deploy-site.yml?label=Deploy&style=for-the-badge&logo=githubactions&logoColor=white)](https://github.com/manojpisini/opencourses/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-3b82f6?style=for-the-badge)](LICENSE)
[![License: CC BY-SA 4.0](https://img.shields.io/badge/Content-CC%20BY--SA%204.0-f5c542?style=for-the-badge)](LICENSE-CONTENT)

<br/>

```
Every course is a repo.  Every update is a commit.  Every contributor is a maintainer.
```

<br/>

---

## ✦ What Is OpenCourses?

**The first developer education platform built entirely on GitHub infrastructure.**

OpenCourses is not a MOOC. It is not a wiki. It is not a docs site behind a login wall.

It is a living curriculum — where course content lives in Git repositories,<br/>
learning progress is tracked in issues and pull requests,<br/>
and every update ships exactly like a software release.

Certificates are GPG-signed GitHub Releases.<br/>
Grades are run in a hardened Docker sandbox.<br/>
The leaderboard rebuilds itself every night.

<br/>

**No servers. No subscriptions. No lock-in. No friction.**

<br/>

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   "Git is not a backup tool.                                        │
│    Code is not the only thing that should be version-controlled."   │
│                                                                     │
│    OpenCourses is what happens when you apply that idea to          │
│    developer education — radically, completely, without compromise. │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

<br/>

---

## ✦ Why It Exists

| The old way | The OpenCourses way |
|:-----------:|:-------------------:|
| Content locked behind accounts | Everything public, on GitHub |
| No version history — errors persist silently | Every change is a commit, every fix is a PR |
| Black-box grading you can't inspect | Open-source Docker sandbox grader |
| Certificates you can't verify | GPG-signed GitHub Releases — cryptographically provable |
| Stale courses with no accountability | Maintainer listed, version tagged, status tracked |
| Platform disappears → learning gone | Fork the repo → nothing lost |
| Expensive subscriptions | Free. Always. No exceptions. |

<br/>

---

## ✦ The Platform at a Glance

```
                     ╔══════════════════════════════╗
                     ║      github.com/opencourses  ║
                     ╚══════════════════╤═══════════╝
                                        │
          ┌─────────────────────────────┼──────────────────────────┐
          │                             │                          │
          ▼                             ▼                          ▼
┌─────────────────┐          ┌─────────────────┐        ┌──────────────────┐
│   site/         │          │   engine/        │        │  .github/        │
│                 │          │                  │        │  workflows/      │
│  Astro 4        │          │  TypeScript      │        │                  │
│  Static site    │          │  grading engine  │        │  11 workflows    │
│  GitHub Pages   │          │  Docker sandbox  │        │  Zero servers    │
└────────┬────────┘          └────────┬─────────┘        └────────┬─────────┘
         │                           │                            │
         ▼                           ▼                            ▼
manojpisini             Grades code in < 60s          Enrolls · Certifies
.github.io/opencourses  GPG signs certificates        Nudges · Ranks
```

<br/>

---

## ✦ How Learning Works

```
  1. ENROLL ──────────────────────────────────────────────────────────────────
     Open a course page and choose Enroll.
     Use the web form, copy the gh command, or copy the generated body.
     The bot processes it instantly. Your student journey begins.

  2. LEARN ───────────────────────────────────────────────────────────────────
     Read Markdown content in this repo.
     Watch linked videos. Write code locally. No tracking. No timers.

  3. SUBMIT ──────────────────────────────────────────────────────────────────
     For code assignments: open a Pull Request "[Assignment] @username — course/ch-01"
     GitHub Actions runs your code in a hardened Docker sandbox.
     Score + line-by-line feedback posted as a PR comment in ~45 seconds.

  4. QUIZ ────────────────────────────────────────────────────────────────────
     For chapter and final tests: use the course page submission action.
     Prefer the web form, gh command, or copied body path you like.
     The grader checks your answers against the course answer key automatically.
     Feedback posted within minutes. No manual review for standard tests.

  5. ADVANCE ─────────────────────────────────────────────────────────────────
     Pass a chapter? The bot labels your enrollment issue automatically.
     Fail? Feedback posted. Iterate. No penalty. No lock-out.

  6. CERTIFY ─────────────────────────────────────────────────────────────────
     Submit the final test. Pass? A GPG-signed certificate is issued
     as a GitHub Release. Your name goes on the public leaderboard.
     The certificate lives on GitHub forever.
```

<br/>

---

## ✦ Course Tracks

OpenCourses uses 12 broad tracks that cover every area of computing:

| Track | Slug | Description |
|:-----:|:----:|:-----------:|
| 🔵 **Foundations & Theory** | `foundations` | Git, DS&A, algorithms, complexity, discrete math, theory |
| 🟣 **Languages & Paradigms** | `languages` | Low-level, OOP, functional, scripting, logic, query |
| 🔷 **Web & Mobile** | `web` | HTML/CSS/JS/TS, frameworks, iOS, Android, PWA, WebAssembly |
| 🩵 **Backend & Databases** | `backend` | APIs, SQL/NoSQL/graph DBs, microservices, GraphQL |
| 🟢 **Systems & Infrastructure** | `systems` | OS, compilers, Docker, Kubernetes, cloud, CI/CD, IaC |
| 🟡 **Networks & Protocols** | `networks` | TCP/IP, HTTP/1–3, TLS, BGP, WebRTC, SDN, 5G |
| 🟠 **Data & AI** | `data` | ETL, ML, deep learning, LLMs, MLOps, computer vision |
| 🔴 **Security & Cryptography** | `security` | OWASP, crypto, pentesting, CTF, post-quantum, ZKPs |
| ⚫ **Architecture & Engineering** | `architecture` | System design, patterns, DDD, TDD, distributed systems |
| 🩷 **Creative Computing** | `creative` | Graphics, shaders, game engines, simulation, generative |
| 🔵 **Emerging Technologies** | `emerging` | Quantum, neuromorphic, blockchain, formal verification |
| 🟩 **Applied & Cross-Domain** | `applied` | Computational physics/biology, robotics, HPC, GIS |

<br/>

**[Browse all courses →](https://manojpisini.github.io/opencourses/courses)**
&nbsp;&nbsp;·&nbsp;&nbsp;
**[Explore the knowledge graph →](https://manojpisini.github.io/opencourses/tracks)**

<br/>

---

## ✦ Feature Highlights

```
  ┌──────────────────────────┐   ┌──────────────────────────┐   ┌──────────────────────────┐
  │  ⌘K  Command Palette     │   │  ◉  Knowledge Graph       │   │  ▓  Build Status Bar      │
  │                          │   │                          │   │                          │
  │  Search any course,      │   │  Force-directed graph of  │   │  A real-time indicator   │
  │  track, or contributor   │   │  all courses, colored     │   │  that the site was built │
  │  instantly. Keyboard     │   │  by track, linked by      │   │  fresh. Green = latest   │
  │  navigable, fuzzy-       │   │  prerequisites. Click     │   │  commit deployed. Not    │
  │  scored. No mouse.       │   │  any node to explore.     │   │  decorative — functional.│
  └──────────────────────────┘   └──────────────────────────┘   └──────────────────────────┘

  ┌──────────────────────────┐   ┌──────────────────────────┐   ┌──────────────────────────┐
  │  ⚡  60-Second Grades     │   │  🏆  Leaderboard          │   │  🎓  GPG Certificates     │
  │                          │   │                          │   │                          │
  │  Assignment PRs graded   │   │  Rebuilt every night     │   │  Not a PDF. A signed     │
  │  in a hardened Docker    │   │  from live GitHub data.  │   │  GitHub Release. Verify  │
  │  sandbox. No manual      │   │  No manual updates.      │   │  with gpg --verify.      │
  │  review for automated    │   │  Always accurate.        │   │  Permanently public.     │
  │  stages.                 │   │                          │   │  Employer-checkable.     │
  └──────────────────────────┘   └──────────────────────────┘   └──────────────────────────┘
```

<br/>

---

## ✦ Repository Layout

```
opencourses/
│
├── 📁 .github/
│   ├── 📁 workflows/              11 GitHub Actions — the entire platform runs here
│   │   ├── deploy-site.yml        Astro build → GitHub Pages  (every push to main)
│   │   ├── course-publish.yml     Parse course.yaml → course.json on merge
│   │   ├── sync-site-data.yml     Aggregate engine JSON → site/src/data/*.json
│   │   ├── enroll.yml             Process enrollment issues
│   │   ├── run-quiz.yml           Chapter test grading
│   │   ├── grade-assignment.yml   Docker sandbox grader (code assignments)
│   │   ├── issue-cert.yml         GPG-signed certificate generation
│   │   ├── course-leaderboard.yml Nightly leaderboard rebuild
│   │   ├── validate-pr.yml        PR title + tamper detection
│   │   ├── check-links.yml        Weekly dead-link scan
│   │   └── check-videos.yml       Weekly YouTube oEmbed check
│   └── 📁 ISSUE_TEMPLATE/         Enrollment, quiz, assignment, support forms
│
├── 📁 site/                       ★ The website (auto-generated from engine data)
│   └── src/
│       ├── data/                  ★ JSON data files (machine-generated by sync-site-data)
│       │   ├── courses.json       Course catalog (auto-generated)
│       │   ├── contributors.json  Contributor list (auto-generated)
│       │   └── oc.ts              Type definitions + imports
│       ├── pages/                 One .astro file per route
│       ├── components/            Shared Astro components
│       └── styles/global.css      Full design system, no framework
│
└── 📁 engine/                     ★ The course engine — add courses here
    ├── courses/                   ★ One directory per course
    │   ├── template/              Copy this to start a new course
    │   │   └── course.yaml          Course manifest (pure YAML, schema v3.0)
    │   └── {slug}/
    │       ├── course.yaml          ★ The course (pure YAML manifest)
    │       ├── assets/            Images, starter code, data files
    │       └── course.json        Auto-generated by course-publish.yml
    ├── scripts/                   TypeScript automation scripts
    └── sandbox/Dockerfile         Hardened grading container
```

<br/>

---

## ✦ Adding a Course

> **All you need to touch is `engine/courses/`.**

### 1 — Copy the template

```bash
cp -r engine/courses/template engine/courses/your-course-slug
```

### 2 — Edit `course.yaml`

Open `engine/courses/your-course-slug/course.yaml` — a pure YAML file with 18 sections:

```yaml
metadata:
  id: your-course-slug            # permanent, kebab-case
  version: "1.0.0"
  status: draft                   # draft | review | published | archived
  solutions_file: solutions.yaml  # answers companion (never commit to main)

identity:
  title: "Your Course Title"
  tagline: "One compelling sentence."
  description:
    short: "Shown in course cards — under 200 characters."
    full: |
      Full multi-paragraph Markdown description.

classification:
  category: web                   # one of 12 track slugs (see /docs/creators)
  level: beginner                 # beginner | intermediate | advanced | mixed
  tags: [tag1, tag2]

people:
  curator:
    name: manojpisini
    github: manojpisini
    role: Curator & Maintainer

# ... chapters, chapter_tests, assignments, certificate, changelog ...
# See engine/courses/template/course.yaml for the full annotated template.
```

### 3 — Open a PR

```bash
git checkout -b course/your-course-slug
git add engine/courses/your-course-slug/
git commit -m "course: add Your Course Title"
git push -u origin course/your-course-slug
# Open a PR → validate-pr.yml checks the schema → merge → live in ~90 seconds
```

On merge: `course-publish.yml` parses `course.yaml` → writes `course.json` → `sync-site-data.yml` aggregates → `deploy-site.yml` rebuilds the site.

**You never manually edit `site/src/data/*.json` — they are machine-generated.**

<br/>

---

## ✦ Contributing

We welcome contributions of all kinds.

| Type | How |
|:----:|:---:|
| 📚 **New course** | Copy template → edit `course.yaml` → open a PR |
| ✏️ **Fix content** | Edit `engine/courses/{slug}/course.yaml` → PR |
| 🐛 **Report error** | Open an issue using the Bug Report template |
| 🚩 **Wrong content** | Open an issue using the False Content template |
| 💡 **Suggest course** | Open an issue — describe topic, audience, and gap |
| 🌍 **Translate** | Open an issue to coordinate before starting |
| 🎨 **Improve site** | Open a PR against anything in `site/` |

<br/>

**Ground rules**

1. Write for practitioners — assume the student has shipped something before
2. No paywalled resources — all exercises and readings must be freely accessible
3. Own your course — keep it accurate, use `status: "attention"` when you need help
4. One PR per course — don't bundle unrelated changes
5. Be honest about state — `difficulty: "beginner"` with `status: "draft"` is fine

<br/>

We follow the [Contributor Covenant v2.1](https://www.contributor-covenant.org/version/2/1/code_of_conduct/)

<br/>

---

## ✦ Tech Stack

| Layer | Technology | Notes |
|:-----:|:----------:|:-----:|
| Site framework | [Astro 4](https://astro.build) — `output: static` | Zero JS framework shipped to browsers |
| Interactivity | Vanilla JS IIFEs | Catalog filter, force-directed graph, ⌘K palette |
| Styling | Custom CSS design system | ~42 KB total, no Tailwind, no utility classes |
| Fonts | DM Sans + JetBrains Mono + Sora | Google Fonts, loaded from CDN |
| Knowledge graph | Custom force simulation | No D3 — pure physics in ~150 lines of JS |
| Hosting | GitHub Pages | Free, org-native, zero-config after setup |
| CI/CD | GitHub Actions | Build, deploy, grade, certify — all in one place |
| Grading | Docker on `ubuntu-latest` | Reproducible, isolated, deterministic — no AI |
| Certificates | GPG-signed GitHub Releases | Cryptographically verifiable, permanently public |
| Data pipeline | Bun + TypeScript scripts | Aggregates engine output → site JSON automatically |

<br/>

**What actually loads in a user's browser:**

```
CSS (entire design system)   →  ~42 KB  (one file, cached)
Global JS (theme + ⌘K)      →    2 KB
Page JS (only where needed)  →  6–9 KB  (catalog / graph)
HTML (pre-rendered)          →  30–150 KB per page
Fonts (Google Fonts CDN)     →  ~60 KB  (cached after first visit)
─────────────────────────────────────────────────────────────
Total first load             →  ~250 KB
No React. No hydration. No bundle. No runtime.
```

<br/>

---

## ✦ Deployment

```
push to main  →  deploy-site.yml triggers
                       │
               bun install + astro build
               (SITE_URL, BASE_PATH from repo vars)
                       │
               site/dist/ uploaded to GitHub Pages
                       │
               Live at: https://manojpisini.github.io/opencourses
```

Trigger manually: **Actions → Deploy Site to GitHub Pages → Run workflow**

<br/>

---

## ✦ Quick Links

| 🌐 [Website](https://manojpisini.github.io/opencourses) | 📚 [Courses](https://manojpisini.github.io/opencourses/courses) | 🗺️ [Knowledge Graph](https://manojpisini.github.io/opencourses/tracks) |
|:---:|:---:|:---:|
| **👥 [Contributors](https://manojpisini.github.io/opencourses/contributors)** | **📖 [Documentation](https://manojpisini.github.io/opencourses/docs)** | **🏆 [Leaderboard](https://manojpisini.github.io/opencourses/leaderboard)** |
| **☕ [Support](https://manojpisini.github.io/opencourses/support)** | **🐛 [Report a Bug](../../issues/new?template=report-bug.yml)** | **📋 [CONTRIBUTING.md](CONTRIBUTING.md)** |
| **📅 [Changelog](https://manojpisini.github.io/opencourses/changelog)** | **🤝 [Help Requests](../../issues?q=is%3Aissue+label%3Ahelp-wanted)** | **💻 [Source](https://github.com/manojpisini/opencourses)** |

<br/>

---

## ✦ Support OpenCourses

OpenCourses is free, public, and maintained by **Manoj Pisini** as the main maintainer and developer.

| Donate | Buy me a coffee | Help | Contribute |
|:---:|:---:|:---:|:---:|
| Link coming soon | Link coming soon | [Answer help requests](../../issues?q=is%3Aissue+label%3Ahelp-wanted) | [Open a PR](CONTRIBUTING.md) |

Maintainer socials: **GitHub:** [@manojpisini](https://github.com/manojpisini) · **Website:** coming soon · **LinkedIn:** coming soon · **X:** coming soon

<br/>

---

## ✦ License

This repository uses two licenses depending on the type of content:

[MIT License](./LICENSE) — engine & site code  
[CC BY-SA 4.0](./LICENSE-CONTENT) — course content

Course content is built from curated open-source videos, repositories, and
public resources. Original authors retain their respective copyrights.
When adapting or redistributing, attribution to both manojpisini and the
original sources is required.

<br/>

---

## ✦ Security

Found a vulnerability? **Do not open a public issue.**

Report privately via [GitHub Security Advisories](https://github.com/manojpisini/opencourses/security/advisories/new).<br/>
We respond within 72 hours. See [SECURITY.md](SECURITY.md) for our full disclosure policy.

<br/>

---

<br/>

```
Built in the open.  Shipped like software.  Free, forever.
```

<br/>

**[manojpisini.github.io/opencourses](https://manojpisini.github.io/opencourses)**

<br/>

<sub>Copyright © 2026 manojpisini &nbsp;·&nbsp; <a href="LICENSE">MIT</a> for code &nbsp;·&nbsp; <a href="LICENSE-CONTENT">CC BY-SA 4.0</a> for content</sub>
