# Changelog

All notable changes to OpenCourses are documented here.

Format: `[version or date] — Summary` followed by categorised entries.  
Categories: **Site** · **Courses** · **Engine** · **Workflows** · **Infra** · **Docs**

---

## [2026-05-19] — Initial public launch

### Site
- Launched OpenCourses at manojpisini.github.io/opencourses
- Homepage with featured courses, contributor grid, and stats
- Course catalog with difficulty/track filters
- Track overview page with force-directed dependency graph
- Contributor profiles with course listings
- Command palette (Ctrl+K) with fuzzy search across courses, tracks, contributors
- Dark/light theme toggle with localStorage persistence
- Dynamic sitemap at `/sitemap.xml`
- OG image for social sharing
- Responsive layout across mobile, tablet, and desktop
- Build status bar animation on page load

### Courses (18 active)
- **git-mastery** — Git from first commit to interactive rebase and internals
- **web-security-101** — OWASP Top 10, XSS, SQLi, authentication flaws
- **docker-fundamentals** — Containers, images, Compose, production patterns
- **algorithms-and-ds** — Sorting, trees, graphs, dynamic programming
- **linux-command-line** — Shell navigation, scripting, process management
- **typescript-deep-dive** — Type system, generics, advanced patterns
- **react-fundamentals** — Components, hooks, state, routing
- **system-design-primer** — Scalability, databases, caching, messaging
- **rust-for-beginners** — Ownership, borrowing, traits, error handling
- **python-for-data** — NumPy, Pandas, Matplotlib, ML pipeline basics
- **kubernetes-zero-to-prod** — Pods, services, deployments, Helm
- **go-concurrency** — Goroutines, channels, sync primitives, patterns
- **api-design-rest** — REST principles, OpenAPI, versioning, auth
- **devops-ci-cd** — GitHub Actions, pipelines, deployment strategies
- **database-internals** — Storage engines, indexing, transactions, replication
- **network-fundamentals** — TCP/IP, DNS, HTTP/S, TLS, firewalls
- **compiler-design** — Lexing, parsing, IR, code generation
- **embedded-c** — Memory, interrupts, peripherals, RTOS basics

### Engine
- Grading engine with Docker sandbox (`--network none --memory 128m --read-only`)
- TypeScript validation framework for assignment submissions
- Quiz grader with 75% pass threshold
- XP system: Stage 01 → 100 XP through Stage 05 → 400 XP
- Certificate generation and GPG signing workflow
- Enrollment via issue label (`enrollment-request`)
- Quiz submission via issue label (`quiz-attempt`)
- Assignment grading via PR to `engine/curriculum/**`

### Workflows (11)
- `deploy-site.yml` — Astro build → GitHub Pages
- `enroll.yml` — Student enrollment on label
- `run-quiz.yml` — Quiz grading on label
- `grade-assignment.yml` — Assignment grading on PR
- `advance-stage.yml` — Stage progression (workflow_dispatch)
- `issue-cert.yml` — Certificate generation (workflow_dispatch)
- `build-readme.yml` — Regenerate engine docs on curriculum change
- `build-data.yml` — Refresh site data from GitHub API
- `validate-pr.yml` — PR quality checks
- `stale-check.yml` — Weekly stale issue/PR management
- `audit-log.yml` — Enrollment audit logging

### Docs
- README with full platform overview
- SETUP_AND_TESTING.md — 14-part setup and testing guide
- CONTRIBUTING.md, CURATION.md, SECURITY.md, CODE_OF_CONDUCT.md, CREDITS.md, CHANGELOG.md

### Infra
- MIT license for code and workflows
- CC BY-SA 4.0 for course content
- GitHub Pages deployment with custom base path
- Bun workspace monorepo (site + engine)

---

## Unreleased

Changes merged to `main` but not yet formally versioned.

<!-- Add entries here as changes land -->

---

## Format Reference

```
### Category
- **scope**: Description of change (links to issue/PR if applicable)
```

Example:
```
### Courses
- **git-mastery**: Added Stage 04 — rebasing and conflict resolution (#42)

### Engine
- Fix: quiz grader returned wrong exit code on partial pass (#51)

### Site
- Command palette now shows recent courses first when query is empty
```
