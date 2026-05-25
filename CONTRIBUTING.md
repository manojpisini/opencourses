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

OpenCourses has two main contribution paths:

| Path | You edit | Review focus |
|---|---|---|
| Course contribution | `engine/courses/<slug>/course.yaml`, lesson assets, tests, starter projects | Accuracy, teachability, assessment quality, credits, reproducibility |
| Code contribution | `site/`, `engine/`, `.github/workflows/`, shared docs | Correctness, accessibility, performance, security, maintainability |

Keep those paths separate when possible. A PR that fixes a parser bug should not
also rewrite a course chapter; a course PR should not casually change workflow
automation. Smaller review surfaces get merged faster and age better.

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
- Follow the [OpenCourses content blueprint](docs/course-blueprint.md) for open-source-first course design

### 3b. Copy the course template

```bash
git checkout -b course/your-course-slug
cp -r engine/courses/template engine/courses/your-course-slug
```

### 3c. Edit `course.yaml`

Open `engine/courses/your-course-slug/course.yaml` — this is the **single source of truth**.
It is a pure YAML file (no Markdown frontmatter). All site data is auto-generated from it.
**Do not edit `site/src/data/*.json` directly — they are machine-generated.**
The blueprint is a content-quality guide, not a separate structure. Put blueprint alignment in
the `content_blueprint` section of `course.yaml`.

Minimum required fields (see `engine/courses/template/course.yaml` for the full 18-section template):

```yaml
metadata:
  id: your-course-slug       # kebab-case, unique, permanent after publish
  version: "1.0.0"
  status: draft              # draft | review | published | archived | deprecated
  solutions_file: solutions.yaml  # companion file — never commit to main

identity:
  title: "Your Course Title"
  tagline: "One compelling sentence."
  description:
    short: "Shown in course cards — under 200 characters."
    full: "Full multi-paragraph Markdown description."
  cover:
    color_primary: "#4C1BC9"
    color_secondary: "#7C3AED"
    # Course card and hero artwork is generated from classification.category.

classification:
  category: web              # must be one of the 12 valid track slugs:
                             # foundations | languages | web | backend | systems
                             # networks | data | security | architecture | creative
                             # emerging | applied
  level: beginner            # beginner | intermediate | advanced | mixed
  tags: [tag1, tag2]

people:
  curator:
    name: manojpisini
    github: manojpisini
    role: Curator & Maintainer

content_blueprint:
  principles:
    - Uses open-source tooling whenever possible
    - References open-source implementations
    - Teaches through real repositories
    - Uses transparent evaluation systems
  flow:
    - foundations
    - environment-setup
    - guided-fundamentals
    - incremental-challenges
    - production-engineering
    - open-source-exploration
    - capstone-project
    - contribution-path
  resource_strategy:
    repositories:
      - https://github.com/org/repo
  testing:
    types: [deterministic, randomized, fuzz, property-based, benchmark]
  capstone:
    level: advanced
    type: scalable service
    requirements: [Production-ready, Deployable, Documented, Tested, Secure]

# ... curriculum, chapter_tests, chapter_assignments, final_test,
#     final_assignment, certificate, changelog ...
# See engine/courses/template/course.yaml for every section and every field.
```

**Answers are in `solutions.yaml`, never in `course.yaml`.** Add `solutions.yaml` to your
`.gitignore` before your first commit — it must never reach the main branch.

**Contributor attribution is automatic.** `sync-site-data.ts` derives all contributor data
from Git history and `people.curator`. You do not edit any contributor list manually.

### 3d. Course asset rules

Course-level artwork is not required. Do not add banners, thumbnails, OG images,
or certificate badge images just to make a course publishable. The site generates
track-specific abstracts from `classification.category` and uses optional accent
colors from `identity.cover`.

Use `assets/images/` only for lesson diagrams, screenshots, and visual references
that are explicitly used inside the curriculum. Every listed asset must be
referenced by a lesson, resource, assignment, or assessment.

### 3e. Course review standards

A course PR should answer these questions clearly:

- What will a learner be able to build or explain after finishing?
- Which open-source projects, papers, docs, or public references does it teach from?
- Are credits complete for every external resource?
- Do chapter tests check understanding rather than trivia?
- Do assignments have deterministic grading criteria where possible?
- Does `solutions.yaml` include complete answers, explanations, rubrics, and sample solutions where needed?

### 3f. Open a PR

```bash
git add engine/courses/your-course-slug/
git commit -m "course: add Your Course Title"
git push -u origin course/your-course-slug
```

Open a PR. `validate-pr.yml` parses `course.yaml` and checks the schema automatically.
On merge: `course-publish.yml` generates `course.json` → `sync-site-data.yml` aggregates →
`deploy-site.yml` rebuilds the site. **Live in ~90 seconds.**

---

## 4. Fixing Existing Content

For typos, broken links, or outdated information:

1. Edit `engine/courses/{slug}/course.yaml`
2. Open a PR with a brief description of what changed and why
3. If reporting rather than fixing, use the `false-content.yml` issue template

For structural corrections (wrong difficulty, wrong track, stale status):
- Open an issue first if the change is significant
- PRs that change `metadata.status: "published"` → `"archived"` need a brief explanation

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

### Code contribution standards

- Prefer small, focused changes with one behavioral purpose.
- Keep generated files generated: change the source script or YAML first, then regenerate.
- Avoid adding dependencies unless the repo has no small local alternative.
- Treat GitHub Actions and grading scripts as security-sensitive code.
- Preserve GitHub Pages base path support by using existing `base` helpers.
- For UI work, verify desktop and mobile layouts and avoid hidden overflow or clipped text.
- For parser/schema work, update `engine/types/course.ts`, parser logic, templates, site types, and docs together.

---

## 7. Pull Request Checklist

- [ ] `bun run build` passes with no errors (run from `site/`)
- [ ] No TypeScript errors (`cd engine && bun run tsc --noEmit`)
- [ ] Course `metadata.id` is unique and matches the directory name
- [ ] Course `classification.category` is one of the 12 valid slugs
- [ ] `course.yaml` is complete, valid YAML, and validated locally
- [ ] `content_blueprint` is complete enough to explain the course flow, open-source resources, testing strategy, capstone, and contribution path
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
