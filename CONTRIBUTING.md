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

Use GitHub Issues with the appropriate label:

| Type | Label |
|---|---|
| Site bug (broken page, wrong link) | `bug` |
| Content error (wrong info, broken resource) | `content-fix` |
| Workflow failure | `ci` |
| Security issue | See [SECURITY.md](SECURITY.md) — do NOT open a public issue |

Include: steps to reproduce, expected vs. actual behaviour, browser/OS if relevant.

---

## 3. Adding a Course

### 3a. Check the quality bar

Read [CURATION.md](CURATION.md) fully before proposing. A course must:
- Cover a topic not already addressed at sufficient depth
- Source from freely available, reputable material
- Have at least one complete stage (structured assignments or quiz)

### 3b. Add the course entry

Edit `site/src/data/oc.ts` and add a `Course` object to `COURSES`:

```ts
{
  slug: "your-course-slug",          // kebab-case, unique
  title: "Your Course Title",
  description: "One-sentence description of what learners gain.",
  track: "web",                      // must match a TRACKS slug
  difficulty: "beginner",            // beginner | intermediate | advanced
  duration: "4 weeks",
  tags: ["tag1", "tag2"],
  maintainer: "your-github-login",   // your login in CONTRIBUTORS
  contributors: ["your-github-login"],
  status: "active",                  // active | draft | attention | archived
  featured: false,
  lastCommit: "2026-06-01",
  xp: 500,
},
```

Add yourself to `CONTRIBUTORS` if not already present:

```ts
{ login: "your-login", name: "Your Name", role: "Contributor", commits: 1, courses: 1, hue: 200 },
```

### 3c. Write the course page

Create `site/src/content/courses/<slug>.md`:

```markdown
---
title: "Your Course Title"
description: "One-sentence description."
track: web
difficulty: beginner
duration: 4 weeks
tags: [tag1, tag2]
---

## Overview

What this course covers and who it is for.

## Learning Objectives

- Objective one
- Objective two
- Objective three

## Prerequisites

What the learner should know before starting.

## Curriculum

### Week 1 — Topic Name
...

## Resources

- [Resource Name](https://example.com) — brief description
```

### 3d. Engine stages (optional)

If the course has graded stages, add a directory under `engine/curriculum/<slug>/`:

```
engine/curriculum/your-course-slug/
  meta.yaml          ← course metadata + stage list
  stage-01/
    README.md        ← assignment brief shown to learners
    quiz.yaml        ← quiz questions (if quiz stage)
    tests/           ← automated test scripts (if code stage)
```

See existing stages in `engine/curriculum/git-mastery/` for reference.

---

## 4. Fixing Existing Content

For typos, broken links, or outdated information:

1. Fix the relevant file in `site/src/content/courses/` or `engine/curriculum/`
2. If a resource URL changed, update both the markdown and `oc.ts` if referenced there
3. Open a PR with label `content-fix`

For structural corrections to `oc.ts` data (wrong difficulty, wrong track, stale status):
- Open an issue first if the change is significant
- PRs that change `status: "active"` → `"archived"` need a brief explanation

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
| Data | `site/src/data/oc.ts` |

**Rules:**
- No framework additions (no React, Vue, Svelte, Tailwind)
- Client JS must be framework-free IIFEs in `public/js/`
- All links must use `${base}/...` prefix (GitHub Pages subpath)
- Test locally with `bun dev` before opening a PR

---

## 6. Engine Changes

The grading engine lives in `engine/`. It runs in a Docker sandbox and is called by GitHub Actions workflows.

- TypeScript source in `engine/scripts/`
- Docker config in `engine/Dockerfile`
- Workflows in `.github/workflows/`

Before changing any workflow:
- Read the trigger conditions carefully — most fire on labels, not push
- Test changes in a fork first if touching the Docker sandbox
- Workflow changes touching `grade-assignment.yml` or `run-quiz.yml` need thorough testing

---

## 7. Pull Request Checklist

- [ ] `bun run build` passes with no errors locally
- [ ] No TypeScript errors (`cd engine && bun run tsc --noEmit`)
- [ ] New course entries follow the `Course` interface in `oc.ts`
- [ ] Markdown front matter is complete and valid
- [ ] No hardcoded URLs — use `${base}/` for internal links
- [ ] PR description explains _why_, not just _what_
- [ ] Added yourself to `CONTRIBUTORS` in `oc.ts` if it's your first contribution

---

## 8. Commit Style

Use conventional commits:

```
feat: add linux-command-line course
fix: broken link in git-mastery stage 02
content: update docker-fundamentals week 3 resources
chore: bump astro to 4.17
docs: clarify CONTRIBUTING quiz format
```

Types: `feat` `fix` `content` `chore` `docs` `ci` `style` `refactor`

Keep the subject line under 72 characters. Body lines under 100.
