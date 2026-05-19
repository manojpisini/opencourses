# Contributing to OpenCourses

Thank you for helping make OpenCourses better. This guide covers how to add courses, fix content, improve the site, and submit engine changes.

---

## Table of Contents

1. [Before You Start](#1-before-you-start)
2. [Reporting Bugs](#2-reporting-bugs)
3. [Adding a Course](#3-adding-a-course)
4. [Fixing Existing Content](#4-fixing-existing-content)
5. [Improving the Site](#5-improving-the-site)
6. [Engine Changes](#6-engine-changes)
7. [Pull Request Checklist](#7-pull-request-checklist)
8. [Commit Style](#8-commit-style)

---

## 1. Before You Start

- Read [CURATION.md](CURATION.md) — understand the quality bar before proposing content
- Read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) — all contributors are bound by it
- Check open issues and PRs to avoid duplicating work
- For large changes, open an issue first to discuss scope

**Setup:**

```bash
git clone https://github.com/manojpisini/opencourses.git
cd opencourses
bun install          # installs all workspace packages
cd site && bun dev   # local dev server at http://localhost:4321
```

---

## 2. Reporting Bugs

Use GitHub Issues with the appropriate template:

| Type | Template |
|---|---|
| Site bug (broken page, wrong link) | `report-bug.yml` → component: Website |
| Content error (wrong info, broken resource) | `false-content.yml` |
| Workflow failure | `report-bug.yml` → component: appropriate workflow |
| Security issue | See [SECURITY.md](SECURITY.md) — do NOT open a public issue |

Include: steps to reproduce, expected vs. actual behaviour, browser/OS if relevant.

---

## 3. Adding a Course

### 3a. Check the quality bar

Read [CURATION.md](CURATION.md) fully before proposing. A course must:
- Cover a topic not already addressed at sufficient depth
- Source from freely available, reputable material
- Have at least one complete chapter (lessons or chapter test)

### 3b. Copy the course template

```bash
git checkout -b course/your-course-slug
cp -r engine/courses/template engine/courses/your-course-slug
```

### 3c. Edit `course.md`

Open `engine/courses/your-course-slug/course.md` — this is the **single source of truth**.
All site data (course page, contributor list, knowledge graph) is auto-generated from it.
**Do not edit `site/src/data/*.json` directly — they are machine-generated.**

Minimum required frontmatter:

```yaml
---
meta:
  slug: your-course-slug     # kebab-case, unique, permanent after publish
  title: "Your Course Title"
  description: "One sentence — what students will be able to do."
  track: web                 # must be one of the 12 valid slugs:
                             # foundations | languages | web | backend | systems
                             # networks | data | security | architecture | creative
                             # emerging | applied
  difficulty: beginner       # beginner | intermediate | advanced
  duration: "4 weeks"
  version: "v1.0.0"
  maintainer: your-github-login
  tags: [tag1, tag2]
  prerequisites: []          # array of course slugs; [] for none

changelog:
  - date: "2026-05-19"
    message: "Initial release"
---

## Overview
...
```

The body of `course.md` is the course content — chapters, lessons, chapter tests, projects.
See `engine/courses/template/course.md` for the full field reference and chapter structure.

**Contributor attribution is automatic.** `sync-site-data.ts` reads Git history and derives
all contributor data. You do not need to edit any contributor list manually.

### 3d. Open a PR

```bash
git add engine/courses/your-course-slug/
git commit -m "course: add Your Course Title"
git push -u origin course/your-course-slug
```

Open a PR. `validate-pr.yml` checks the `course.md` schema automatically.
On merge: `course-publish.yml` generates `course.json` → `sync-site-data.yml` aggregates →
`deploy-site.yml` rebuilds the site. **Live in ~90 seconds.**

---

## 4. Fixing Existing Content

For typos, broken links, or outdated information:

1. Edit `engine/courses/{slug}/course.md`
2. Open a PR with a brief description of what changed and why
3. If reporting rather than fixing, use the `false-content.yml` issue template

For structural corrections (wrong difficulty, wrong track, stale status):
- Open an issue first if the change is significant
- PRs that change `meta.status: "active"` → `"archived"` need a brief explanation

---

## 5. Improving the Site

The site is Astro 4 (`output: static`), vanilla CSS, no React.

**File map:**

| What | Where |
|---|---|
| Pages | `site/src/pages/` |
| Layouts | `site/src/layouts/` |
| Components | `site/src/components/` |
| Styles | `site/src/styles/global.css` |
| Client JS | `site/public/js/` |
| Data types | `site/src/data/oc.ts` |
| Data (auto-generated) | `site/src/data/*.json` |

**Rules:**
- No framework additions (no React, Vue, Svelte, Tailwind)
- Client JS must be framework-free IIFEs in `public/js/`
- All links must use `${base}/...` prefix (GitHub Pages subpath)
- Test locally with `bun dev` before opening a PR

---

## 6. Engine Changes

The grading engine lives in `engine/`. It runs in a Docker sandbox and is called by GitHub Actions workflows.

- TypeScript source in `engine/scripts/`
- Docker config in `engine/sandbox/Dockerfile`
- Workflows in `.github/workflows/`

Before changing any workflow:
- Read the trigger conditions carefully — most fire on issue labels or workflow_run, not push
- Test changes in a fork first if touching the Docker sandbox
- Workflow changes touching `grade-assignment.yml`, `run-quiz.yml`, or `issue-cert.yml` need thorough testing

The data pipeline (`sync-site-data.ts`) reads all `engine/courses/*/course.json` files and
writes to `site/src/data/*.json`. If adding a new data field to courses, update both
`engine/scripts/sync-site-data.ts` and the TypeScript interfaces in `site/src/data/oc.ts`.

---

## 7. Pull Request Checklist

- [ ] `bun run build` passes with no errors (run from `site/`)
- [ ] No TypeScript errors (`cd engine && bun run tsc --noEmit`)
- [ ] Course `meta.slug` is unique and matches the directory name
- [ ] Course `meta.track` is one of the 12 valid slugs
- [ ] `course.md` frontmatter is complete and valid YAML
- [ ] No hardcoded URLs — use `${base}/` for internal site links
- [ ] PR description explains _why_, not just _what_

---

## 8. Commit Style

Use conventional commits:

```
course: add linux-command-line course
fix: broken link in git-mastery chapter 02
content: update docker-fundamentals chapter 3 resources
chore: bump astro to 4.17
docs: clarify CONTRIBUTING quiz format
ci: fix sync-site-data workflow trigger
```

Types: `course` `feat` `fix` `content` `chore` `docs` `ci` `style` `refactor`

Keep the subject line under 72 characters. Body lines under 100.
