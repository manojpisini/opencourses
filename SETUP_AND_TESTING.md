# OpenCourses — Complete Setup & Testing Guide

Every step, in order, for every part of this repo. Do not skip sections.

---

## PART 0 — Prerequisites

Install these before anything else.

```bash
# 1. Bun (JavaScript runtime + package manager)
#    Windows:
powershell -c "irm bun.sh/install.ps1 | iex"
#    macOS/Linux:
curl -fsSL https://bun.sh/install | bash

# 2. Git
git --version    # need ≥ 2.39

# 3. Docker Desktop (for engine grader testing)
#    https://www.docker.com/products/docker-desktop
docker --version

# 4. Node.js (for engine scripts — bun can run .ts, node for .js scripts)
node --version   # need ≥ 18

# 5. GPG (for certificate signing)
#    Windows: install Gpg4win https://www.gpg4win.org/
#    macOS: brew install gnupg
#    Linux: apt install gnupg
gpg --version
```

---

## PART 1 — Local Clone & Install

```bash
git clone https://github.com/manojpisini/opencourses.git
cd opencourses
```

### 1.1 — Install site dependencies

```bash
cd site
bun install
cd ..
```

### 1.2 — Install engine dependencies

```bash
cd engine
bun install
cd ..
```

### 1.3 — Verify site builds

```bash
cd site
bun run build
```

**Expected output — exactly:**
```
41 page(s) built in X.XXs
[build] Complete!
```

Zero errors. If you see a TypeScript error, something in `src/data/oc.ts` has an invalid value.

### 1.4 — Verify engine TypeScript

```bash
cd engine
npx tsc --noEmit
```

**Expected:** No output (zero errors). Any output means a type error in an engine script.

---

## PART 2 — GitHub Repository Setup

Do all of these steps on the GitHub web UI before running any Actions.

### 2.1 — Enable GitHub Pages

1. Go to `https://github.com/manojpisini/opencourses/settings/pages`
2. Under **Source**: select **GitHub Actions** (not "Deploy from a branch")
3. Click **Save**

> Without this, every deploy workflow run will fail with "Pages not configured."

### 2.2 — Add Repository Variable (not secret — public value)

1. Go to `https://github.com/manojpisini/opencourses/settings/variables/actions`
2. Click **New repository variable**
3. Name: `SITE_URL`
   Value: `https://manojpisini.github.io`
4. Click **Add variable**

The `BASE_PATH` is auto-detected by the deploy workflow via `actions/configure-pages` — you do not need to set it manually.

### 2.3 — Create Required Repository Labels

The automation workflows trigger on **labels**, not on issue events directly. These labels must exist before any workflow will fire.

Go to `https://github.com/manojpisini/opencourses/labels` and create each one:

| Label name | Color | Used by |
|-----------|-------|---------|
| `enrollment-request` | `#0075ca` | Triggers `enroll.yml` |
| `enrolled` | `#2ea44f` | Added by bot after enrollment |
| `quiz-attempt` | `#e4e669` | Triggers `run-quiz.yml` |
| `passed` | `#3dd68c` | Added by grader on pass |
| `needs-work` | `#f97316` | Added by grader on fail |
| `certified` | `#a78bfa` | Added after certification |
| `grade-dispute` | `#d93f0b` | Triggers manual review |
| `plagiarism-flag` | `#b60205` | Added by plagiarism check |
| `help-wanted` | `#0e8a16` | Triggers help queue |
| `content-fix` | `#fbca04` | Content error reports |
| `video-suggestion` | `#c2e0c6` | Suggest video replacements |
| `bug` | `#d73a4a` | Bug reports |
| `stale` | `#cfd3d7` | Added by stale check |

**Quick way — GitHub CLI:**
```bash
gh label create enrollment-request --color 0075ca --repo manojpisini/opencourses
gh label create enrolled          --color 2ea44f --repo manojpisini/opencourses
gh label create quiz-attempt      --color e4e669 --repo manojpisini/opencourses
gh label create passed            --color 3dd68c --repo manojpisini/opencourses
gh label create needs-work        --color f97316 --repo manojpisini/opencourses
gh label create certified         --color a78bfa --repo manojpisini/opencourses
gh label create grade-dispute     --color d93f0b --repo manojpisini/opencourses
gh label create plagiarism-flag   --color b60205 --repo manojpisini/opencourses
gh label create help-wanted       --color 0e8a16 --repo manojpisini/opencourses
gh label create content-fix       --color fbca04 --repo manojpisini/opencourses
gh label create video-suggestion  --color c2e0c6 --repo manojpisini/opencourses
gh label create stale             --color cfd3d7 --repo manojpisini/opencourses
```

### 2.4 — Add Secrets

Go to `https://github.com/manojpisini/opencourses/settings/secrets/actions`

Click **New repository secret** for each:

#### Secret 1: `COURSE_BOT_TOKEN`

This is a GitHub Personal Access Token (PAT) with permission to write to the repo, close issues, add labels, and commit.

1. Go to `https://github.com/settings/tokens?type=beta` (Fine-grained tokens)
2. **New fine-grained personal access token**
3. Resource owner: `manojpisini`
4. Repository access: **Only selected repositories** → `manojpisini/opencourses`
5. Permissions:
   - **Issues** → Read and write
   - **Pull requests** → Read and write
   - **Contents** → Read and write
   - **Actions** → Read and write
   - **Metadata** → Read (auto-selected)
6. Generate token → copy it
7. Add as secret `COURSE_BOT_TOKEN`

> Used by: `enroll.yml`, `advance-stage.yml`, `issue-cert.yml`, `leaderboard.yml`, `build-data.yml`

#### Secret 2: `ANTHROPIC_API_KEY`

1. Go to `https://console.anthropic.com/settings/keys`
2. Create a new API key
3. Add as secret `ANTHROPIC_API_KEY`

> Used by: `run-quiz.yml` → `quiz-engine.ts` for semantic answer grading.
> Without this, quiz grading workflows fail. Courses without quizzes still work.

#### Secret 3: `GPG_SIGNING_KEY` (optional — for signed certificates)

```bash
# Generate a GPG key pair if you don't have one
gpg --batch --gen-key <<EOF
Key-Type: RSA
Key-Length: 4096
Name-Real: OpenCourses Bot
Name-Email: bot@manojpisini.github.io
Expire-Date: 0
%no-passphrase
EOF

# Export the private key (base64-encoded for the secret)
gpg --export-secret-keys --armor "bot@manojpisini.github.io" | base64
```

Copy the base64 output → add as secret `GPG_SIGNING_KEY`.

Also find and add your key ID:
```bash
gpg --list-secret-keys --keyid-format LONG
# Look for the line: sec   rsa4096/XXXXXXXXXXXXXXXX
# That 16-char hex is your GPG_KEY_ID
```

Add `GPG_KEY_ID` as a separate secret with that hex value.

> Without these, `issue-cert.yml` still runs but skips the signing step.

---

## PART 3 — First Deploy (Site)

### 3.1 — Trigger the deploy workflow manually

```bash
gh workflow run deploy-site.yml --repo manojpisini/opencourses
```

Or: Actions → "Deploy Site to GitHub Pages" → "Run workflow" → **Run workflow**

### 3.2 — Watch it run

```
https://github.com/manojpisini/opencourses/actions
```

Expected steps, all green:
1. ✓ Checkout
2. ✓ Setup Bun
3. ✓ Install dependencies
4. ✓ Setup Pages (outputs `base_path = /opencourses`)
5. ✓ Build site (`41 page(s) built`)
6. ✓ Upload artifact
7. ✓ Deploy to GitHub Pages

**Total time:** ~60–90 seconds.

### 3.3 — Verify the live site

Open: `https://manojpisini.github.io/opencourses`

Check each URL returns 200 (not 404):
```
/opencourses/
/opencourses/courses
/opencourses/courses/rust-fundamentals
/opencourses/tracks
/opencourses/contributors
/opencourses/contributors/manoj
/opencourses/changelog
/opencourses/about
/opencourses/sitemap.xml
/opencourses/og-image.svg
/opencourses/favicon.svg
```

> **Critical:** If any internal link gives 404, the `BASE_PATH` is not being applied. Check the Actions log for `base_path` value in the "Setup Pages" step.

---

## PART 4 — Site Feature Testing (Local Dev Server)

```bash
cd site && bun run dev
# Opens at http://localhost:4321
```

Go through every feature below. Use DevTools (F12) → Console — zero errors expected.

### 4.1 — Homepage (`/`)

Open `http://localhost:4321` and verify:

- [ ] Banner / hero loads instantly (no layout shift)
- [ ] Three stat boxes show numbers: Courses · Contributors · Stars
- [ ] "Explore courses" button links to `/courses`
- [ ] "View tracks" button links to `/tracks`
- [ ] "Search" button opens command palette (overlay appears)
- [ ] Featured courses section: at least 3 CourseCards
- [ ] Each CourseCard has title, difficulty badge, track badge, sparkline
- [ ] Tracks grid: 5 track cards visible
- [ ] Click any track card → navigates to `/tracks#<slug>`
- [ ] Activity heatmap: 52 columns × 7 rows of colored squares
- [ ] "Top contributors" section: 6 contributor cards
- [ ] Click a contributor card → navigates to `/contributors/<login>` (not `/contributors`)
- [ ] Recent changes section: 3 changelog entries
- [ ] Click a changelog entry → navigates to `/courses/<slug>`
- [ ] All internal nav links in footer work

### 4.2 — Course Catalog (`/courses`)

- [ ] 16 course cards render by default
- [ ] Count shows "16 of 16 courses"
- [ ] **Search:** Type "rust" → only Rust courses remain → count updates
- [ ] **Search:** Clear field → all 16 return
- [ ] **Track filter:** Select "Systems" → only systems-track courses shown
- [ ] **Track filter:** Select "All" → resets
- [ ] **Difficulty filter:** Select "Beginner" → filters correctly
- [ ] **Status filter:** Select "Added" → filters by status
- [ ] **Duration filter:** "0–5 h" → hides long courses
- [ ] **Sort by Stars:** Cards reorder (highest first)
- [ ] **Sort by Recent:** Cards reorder by updatedAt
- [ ] **Sort by Name:** Alphabetical
- [ ] **Grid/List toggle:** Layout switches, cards remain
- [ ] Click a tag chip on a card → that tag auto-applied as filter
- [ ] "Clear filters" button → all 16 courses, all filters reset
- [ ] Clicking any card → navigates to `/courses/<slug>`

### 4.3 — Course Detail (`/courses/rust-fundamentals`)

- [ ] Breadcrumb: `~ / courses / rust-fundamentals`
- [ ] Difficulty badge shows `[ADVANCED]`
- [ ] Track badge shows the track name
- [ ] Version tag `[v...]` visible
- [ ] Stars · Forks · Open Issues shown
- [ ] Module count shown
- [ ] Duration shown
- [ ] "Updated X days ago" (relative time)
- [ ] Contributor avatars render (gradient SVGs)
- [ ] Each contributor avatar links to `/contributors/<login>`
- [ ] Tags are shown
- [ ] "View on GitHub →" opens `github.com/manojpisini/opencourses` in new tab
- [ ] Course markdown body renders (`## What You'll Build`, `## Prerequisites` sections visible)
- [ ] Sparkline SVG renders in the stats row

Test also: `/courses/web-security-101`, `/courses/docker-basics` — each must load with their own data.

### 4.4 — Tracks / Knowledge Graph (`/tracks`)

- [ ] Page loads, breadcrumb shows `~ / tracks`
- [ ] `<svg id="graph-svg">` is present and has content (nodes visible)
- [ ] **Nodes:** 16 circles, each colored by track
- [ ] **Drag a node:** grab and drag → it moves, others respond via physics
- [ ] **Click a node:** right-side detail panel appears
- [ ] Detail panel shows: course title, module count, description
- [ ] "View course →" in panel → navigates to `/courses/<slug>`
- [ ] "✕ close" button → hides panel
- [ ] **Track filter dropdown:** Select "Web" → non-web nodes become gray/dim
- [ ] Select "All tracks" → all nodes return to full color
- [ ] **Reset view** button → graph returns to default position/zoom
- [ ] Legend at bottom: 5 items (one per track) with colored dot
- [ ] Track cards below graph: 5 cards
- [ ] Each track card shows course count and up to 3 sample course titles
- [ ] Click a track card → navigates to `/courses?track=<slug>`

### 4.5 — Command Palette

Press `Ctrl+K` (Windows) or `Cmd+K` (Mac):

- [ ] Overlay appears, input focused automatically
- [ ] Typing "rust" → shows courses containing "rust"
- [ ] Typing "web" → shows courses + Web track result
- [ ] Typing "manoj" → shows contributor result
- [ ] Clicking a course result → navigates to `/courses/<slug>`
- [ ] Clicking a track result → navigates to `/tracks#<slug>`
- [ ] Clicking a contributor result → navigates to `/contributors/<login>` (not `/contributors`)
- [ ] `↓` arrow key → moves selection down
- [ ] `↑` arrow key → moves selection up
- [ ] `Enter` key → navigates to selected item
- [ ] `Escape` → closes palette
- [ ] Clicking outside the palette box → closes
- [ ] Clicking "Search courses…" in navbar → opens palette
- [ ] Clicking search button in hero → opens palette
- [ ] Results immediately on open (not waiting for input)

### 4.6 — Theme Toggle

- [ ] Click ☀ / 🌑 button in top-right navbar
- [ ] Page switches between dark and light theme
- [ ] All colors change (not just background — text, cards, borders)
- [ ] Refresh page — same theme persists (no flash to wrong theme)
- [ ] Open in a new tab — same theme (no flash)
- [ ] Check `localStorage.getItem('oc-theme')` in DevTools console — returns `'dark'` or `'light'`

### 4.7 — Contributors (`/contributors`)

- [ ] 18 contributor cards
- [ ] Each card: gradient avatar SVG with initials, name, role, commit/course counts
- [ ] No broken avatar images (all SVGs with gradient backgrounds)
- [ ] Click any card → navigates to `/contributors/<login>`
- [ ] Activity heatmap at bottom of page

### 4.8 — Contributor Profile (`/contributors/manoj`)

- [ ] Breadcrumb: `~ / contributors / manoj`
- [ ] Large avatar (2xl size)
- [ ] Full name heading
- [ ] Role badge (`Maintainer · Systems` or similar)
- [ ] Commit count + course count
- [ ] Track chips → each links to `/courses?track=<slug>`
- [ ] "View on GitHub ↗" → opens `https://github.com/manoj` in new tab
- [ ] Courses grid below: all courses where maintainer or contributor is this user

Test a contributor with no courses (e.g., `/contributors/milo`) — should show "No courses yet."

### 4.9 — Changelog (`/changelog`)

- [ ] 3 month groups: May 2026, April 2026, March 2026
- [ ] Each entry: course title, version tag, date
- [ ] Change lines: green `+` added, red `−` removed, orange `~` modified
- [ ] Course title in each entry links to `/courses/<slug>`

### 4.10 — About (`/about`)

- [ ] Page loads without errors
- [ ] Content renders (headings, text)
- [ ] No "undefined" or missing data

### 4.11 — 404 Page

Visit `http://localhost:4321/this-does-not-exist`

- [ ] Custom 404 page renders (not browser default)
- [ ] "Go home" or back link visible

### 4.12 — Sitemap

```
http://localhost:4321/sitemap.xml
```

- [ ] Returns XML content (not HTML)
- [ ] Contains `<url>` tags
- [ ] First URL should be `/` or `https://manojpisini.github.io/opencourses/`

### 4.13 — Build Status Bar

- [ ] Thin colored bar at very top of every page
- [ ] On page load: starts as orange/running
- [ ] After ~3.2 seconds: changes to green/success
- [ ] Consistent across all pages

### 4.14 — Responsive Layout

Open DevTools → Toggle device toolbar → test:

| Width | What to verify |
|-------|---------------|
| 375px | Hero stacks, single-column course grid, no horizontal scroll |
| 768px | 2-column course grid, tracks stack |
| 1024px | 3-column grid, full nav |
| 1440px | Content centered, nothing stretches too wide |

---

## PART 5 — Add a Demo Course

This tests the full "add a course" workflow.

### 5.1 — Add to the catalog (site/src/data/oc.ts)

Open `site/src/data/oc.ts`. Find the `COURSES` array and add this entry:

```ts
{
  slug: "linux-command-line",
  title: "Linux Command Line Mastery",
  description: "Learn the terminal from first principles. Files, processes, pipes, scripts, and cron jobs.",
  track: "fundamentals",
  difficulty: "beginner",
  duration: "6h",
  modules: 8,
  maintainer: "manoj",
  contributors: ["manoj"],
  tags: ["linux", "terminal", "bash", "shell", "cli"],
  prerequisites: [],
  repo: "manojpisini/opencourses",
  version: "v1.0.0",
  updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  featured: true,
  stars: 0,
  forks: 0,
  openIssues: 0,
  status: "added",
  lastCommit: "Initial release",
},
```

### 5.2 — Add course content (site/src/content/courses/)

Create `site/src/content/courses/linux-command-line.md`:

```markdown
---
title: "Linux Command Line Mastery"
description: "Learn the terminal from first principles. Files, processes, pipes, scripts, and cron jobs."
track: "fundamentals"
difficulty: "beginner"
modules: 8
duration: "6h"
updatedAt: "2026-05-19T00:00:00Z"
status: "added"
tags: ["linux", "terminal", "bash", "shell", "cli"]
stars: 0
version: "v1.0.0"
maintainer: "manoj"
repo: "manojpisini/opencourses"
prerequisites: []
language: "en"
---

The command line is the most powerful tool a developer has. Yet most developers never learn it properly.

This course teaches the Linux terminal the way professional sysadmins and DevOps engineers use it — not as a collection of commands to memorize, but as a composable, scriptable, automatable environment.

## What You'll Build

By the end of this course you will have:

- A fully automated backup script using `rsync` and `cron`
- A log parser using `grep`, `awk`, and `sed` pipelines
- A process monitor using `ps`, `top`, and `kill`
- A dotfiles setup with symlinks and shell aliases

## Prerequisites

- A computer running Linux, macOS, or WSL2 on Windows
- Curiosity about how computers actually work

## Modules

1. Filesystem Navigation — `ls`, `cd`, `pwd`, `find`, `tree`
2. File Operations — `cp`, `mv`, `rm`, `ln`, `chmod`, `chown`
3. Text Processing — `cat`, `less`, `head`, `tail`, `grep`, `wc`
4. Pipes & Redirection — `|`, `>`, `>>`, `<`, `2>&1`, `tee`
5. Processes — `ps`, `top`, `htop`, `kill`, `jobs`, `fg`, `bg`
6. Text Editors — `vim` and `nano` basics
7. Shell Scripting — variables, loops, functions, `if`, `case`
8. Automation — `cron`, `at`, `systemd` timers
```

### 5.3 — Verify the demo course builds

```bash
cd site && bun run build
```

**Expected:** `42 page(s) built` (one more than before).

Look for: `/courses/linux-command-line/index.html` in the output.

### 5.4 — Test the demo course in the dev server

```bash
cd site && bun run dev
```

- `http://localhost:4321/courses/linux-command-line` — course page loads
- Course appears in the catalog at `/courses`
- Course appears in the "Featured" section on homepage (because `featured: true`)
- Course appears on `/contributors/manoj` profile
- "Linux" tag filter works in catalog
- Knowledge graph at `/tracks` has a new node for this course in "fundamentals" track
- Command palette: typing "linux" shows the course

### 5.5 — Commit and push the demo course

```bash
git add site/src/data/oc.ts site/src/content/courses/linux-command-line.md
git commit -m "course: add Linux Command Line Mastery"
git push
```

The deploy workflow triggers automatically. Wait 60 seconds, then verify it's live:
```
https://manojpisini.github.io/opencourses/courses/linux-command-line
```

---

## PART 6 — Engine: Local Testing

### 6.1 — TypeScript check

```bash
cd engine
npx tsc --noEmit
```

Expected: zero output (zero errors).

### 6.2 — Validate curriculum schema

```bash
cd engine
REPO=manojpisini/opencourses bun run validate
```

This validates `engine/curriculum/schema.yaml` against the course schema. Should print no errors.

### 6.3 — Build curriculum docs

```bash
cd engine
REPO=manojpisini/opencourses bun run build
```

This regenerates `engine/CURRICULUM.md` from the curriculum content. Check the file was updated.

### 6.4 — Check links

```bash
cd engine
REPO=manojpisini/opencourses GITHUB_TOKEN=<your-PAT> bun run check-links
```

Scans all `.md` files for dead external links. Posts an issue if any found (requires token + live internet).

### 6.5 — Simulate grading (Docker required)

First, build the Docker sandbox image:

```bash
cd engine
docker build -t opencourse-sandbox -f sandbox/Dockerfile .
```

This installs Python, Node, Bun, pytest inside a hardened Debian container. Takes ~2–3 minutes first time.

**Simulate a passing submission:**

```bash
# Create a fake test results file
echo '{
  "passed": true,
  "score": 9,
  "maxScore": 10,
  "percentage": 90,
  "tests": [
    {"name": "test_basic_commit", "passed": true, "score": 1, "maxScore": 1},
    {"name": "test_branch_creation", "passed": true, "score": 1, "maxScore": 1},
    {"name": "test_merge_no_conflict", "passed": false, "score": 0, "maxScore": 1, "message": "Expected branch merged cleanly"}
  ],
  "duration": 4200,
  "xpEarned": 100
}' > /tmp/test-results.json

cd engine
GITHUB_TOKEN=<your-PAT> \
REPO=manojpisini/opencourses \
PR_NUMBER=1 \
STUDENT=testuser \
STAGE=01 \
ATTEMPT=1 \
TEST_OUTPUT_FILE=/tmp/test-results.json \
bun run grade
```

**What to see:** Script posts a grade comment to PR #1 (or errors if PR doesn't exist — create a test PR first).

**Simulate a failing submission (below 75%):**

```bash
echo '{
  "passed": false,
  "score": 6,
  "maxScore": 10,
  "percentage": 60,
  "tests": [],
  "duration": 3100,
  "xpEarned": 0
}' > /tmp/test-results.json

GITHUB_TOKEN=<your-PAT> REPO=manojpisini/opencourses PR_NUMBER=1 \
STUDENT=testuser STAGE=01 ATTEMPT=1 TEST_OUTPUT_FILE=/tmp/test-results.json \
bun run grade
```

Expected: posts "needs-work" feedback, no XP awarded.

### 6.6 — Test Docker sandbox isolation

```bash
cd engine

# Build the sandbox
docker build -t opencourse-sandbox -f sandbox/Dockerfile .

# Run with no network, memory cap, read-only FS
docker run \
  --network none \
  --memory 128m \
  --cpus 0.5 \
  --read-only \
  --tmpfs /tmp:size=50m \
  --user 1001:1001 \
  --security-opt no-new-privileges \
  -e STAGE=01 \
  -e TEST_OUTPUT_FILE=/tmp/test-results.json \
  -v $(pwd):/workspace:ro \
  -v /tmp:/tmp \
  opencourse-sandbox
```

**Expected:** The grader script runs in the container. `/tmp/test-results.json` is written inside the container.

**Verify isolation — these should fail:**
```bash
# Network access blocked
docker run --network none opencourse-sandbox sh -c "curl google.com"
# Expected: curl: (6) Could not resolve host

# Can't write to root filesystem (read-only)
docker run --read-only opencourse-sandbox sh -c "echo x > /etc/test"
# Expected: /etc/test: Read-only file system
```

### 6.7 — Test leaderboard rebuild

```bash
cd engine
GITHUB_TOKEN=<your-PAT> REPO=manojpisini/opencourses bun run leaderboard
```

Expected: `engine/LEADERBOARD.md` is created or updated with current data.

---

## PART 7 — GitHub Actions: Full Workflow Testing

### 7.1 — Deploy: Auto-trigger on push

Push any change to `site/`:

```bash
echo "# test" >> site/src/data/oc.ts
git add site/src/data/oc.ts
# revert it
git checkout site/src/data/oc.ts
git add site/
git commit -m "chore: trigger deploy test" --allow-empty
git push
```

Go to Actions → watch `deploy-site.yml` run automatically.

Or: push the demo course from Part 5 — that's the real test.

**Verify in Actions log:**
- Step "Setup Pages" → outputs `base_path: /opencourses`
- Step "Build site" → `41 page(s) built` (or 42 with demo course)
- Step "Deploy" → green, shows deployment URL

---

### 7.2 — Enrollment Workflow

This is the most important flow to test. Read carefully.

**How it works:**
1. Someone opens an issue using the "📚 Enroll in a Course" template
2. They fill in: course slug, track, experience level
3. Issue is created automatically with the label `enrollment-request`
4. That label triggers `enroll.yml`
5. `enroll.ts` reads the issue body, parses form fields, posts welcome comment, adds `enrolled` + `course:<slug>` labels

**Step-by-step test:**

1. Go to `https://github.com/manojpisini/opencourses/issues/new/choose`
2. Click "📚 Enroll in a Course"
3. Fill in:
   - Course: `linux-command-line`
   - Track: `fundamentals`
   - Experience Level: `Complete beginner`
   - Check all three agreement boxes
4. Title: `[Enrollment] @yourusername — Linux Command Line`
5. Submit issue

**What should happen within ~30 seconds:**
- Issue is created with label `enrollment-request`
- `enroll.yml` triggers (check Actions tab)
- Bot posts a comment on the issue:
  - "Welcome @yourusername!"
  - Course enrollment confirmed
  - Stage 01 instructions
  - Link to Stage 01 assignment
- Labels added: `enrolled` and `course:linux-command-line`
- Issue title may be normalized

**Verify in Actions log:**
```
Actions → Enroll Student → [most recent run]
```
- ✓ Process enrollment (no errors)
- ✓ Commit audit log

**If it doesn't trigger:**
- Verify the label `enrollment-request` exists (Part 2.3)
- Verify `COURSE_BOT_TOKEN` secret is set (Part 2.4)
- Verify the issue was actually labeled (GitHub sometimes has a brief delay)

---

### 7.3 — PR Validation (validate-pr.yml)

This runs on every PR that touches `engine/curriculum/**`.

**Test — invalid PR title (should be rejected):**

1. Create a branch:
   ```bash
   git checkout -b test/invalid-pr
   echo "# test" >> engine/curriculum/meta.yaml
   git add engine/curriculum/meta.yaml
   git commit -m "test commit"
   git push origin test/invalid-pr
   ```
2. Open a PR with title: `My submission` (no stage number, no username)
3. Wait for `validate-pr.yml`

**Expected:** Bot posts a comment explaining the required format. PR is blocked.

**Test — valid PR title format:**

Required format: `[Stage 01] @your-github-username`

Create another PR:
```bash
git checkout -b test/stage-01-yourusername
# add a file under engine/curriculum/
echo "# test solution" > engine/curriculum/test-solution.md
git add engine/curriculum/test-solution.md
git commit -m "[Stage 01] test"
git push origin test/stage-01-yourusername
```

Open PR with title: `[Stage 01] @yourusername`

**Expected:** `validate-pr.yml` passes, `grade-assignment.yml` starts.

---

### 7.4 — Assignment Grading (grade-assignment.yml)

This runs after a valid PR title passes validation. It builds Docker, runs graders, posts a score.

**Full flow:**

1. Open a PR with title `[Stage 01] @yourusername` that touches `engine/curriculum/**`
2. Wait for Actions — you will see two workflows run:
   - `validate-pr.yml` — checks title format
   - `grade-assignment.yml` — runs the grader
3. The grader workflow:
   - Builds `engine/sandbox/Dockerfile` (takes ~2 min on first run, ~20s cached)
   - Runs Docker with `--network none --memory 128m --read-only`
   - Copies `/tmp/test-results.json` from container
   - Runs `engine/scripts/grade.ts`
   - Posts grade comment on the PR

**Expected grade comment format:**
```markdown
## Stage 01 Graded ✓

Score: 9/10 (90%) — PASSED ≥ 75% threshold

XP earned: +100

### Test Results
| Test | Result | Points |
|------|--------|--------|
| test_basic_commit | ✓ | 1/1 |
...

### Next Steps
Stage 02 has been unlocked. See your enrollment issue for instructions.
```

**If score ≥ 75% (PASSED):**
- PR gets label `passed`
- PR is auto-merged
- `advance-stage.yml` dispatched with `student`, `stage=01`, `score`

**If score < 75% (FAILED):**
- PR gets label `needs-work`
- Feedback posted, PR stays open
- Student can push new commits to re-trigger grading

**Verify in Actions log:**
- Step "Build sandbox image" → Docker image built
- Step "Run grader in sandbox" → docker run completes
- Step "Parse and post grading report" → grade.ts ran

---

### 7.5 — Stage Advancement (advance-stage.yml)

This is `workflow_dispatch` — it's triggered automatically by the grader on pass, or you can trigger manually.

**Manual test:**

```bash
gh workflow run advance-stage.yml \
  --repo manojpisini/opencourses \
  --field student=yourusername \
  --field stage=01 \
  --field trigger=assignment \
  --field score=90
```

**Expected:**
- `advance.ts` runs
- Finds student's enrollment issue (by `enrolled` + `course:*` labels)
- Posts comment: "Stage 02 unlocked! Here are your Stage 02 instructions..."
- If stage was 05: triggers `issue-cert.yml` automatically
- Triggers `leaderboard.yml`

---

### 7.6 — Quiz Grading (run-quiz.yml)

This uses Claude to semantically grade quiz answers.

**How it works:**
1. Student opens an issue using "❓ Quiz Attempt" template
2. Issue is labeled `quiz-attempt` (template does this automatically)
3. `run-quiz.yml` triggers
4. `quiz-engine.ts` reads `engine/curriculum/stage-01/quiz/questions.yaml`
5. Sends each answer to Claude for grading
6. Posts detailed feedback comment on the issue
7. Closes the issue

**Step-by-step test:**

1. Go to `https://github.com/manojpisini/opencourses/issues/new/choose`
2. Click "❓ Quiz Attempt"
3. Fill in:
   - Stage Number: `01`
   - Q1: Write any answer (e.g., "Git is a distributed version control system that tracks changes...")
   - Q2: Write any answer
   - Q3: Write any answer
4. Title: `[Quiz] Stage 01 — @yourusername`
5. Submit

**Wait for `run-quiz.yml` in Actions:**
- ✓ Grade quiz (Claude API called)
- Bot posts detailed feedback per question
- Issue auto-closed when done

**If ANTHROPIC_API_KEY is not set:** The workflow will fail with an auth error. Add the secret and re-trigger via Actions → "Run Quiz" → "Run workflow" with the issue number.

---

### 7.7 — Certification (issue-cert.yml)

**How it works:**
- Triggered automatically after `advance-stage.yml` detects stage 05 complete
- Or manually dispatched

**Manual test:**

First, make sure an enrollment issue exists for the student:
1. Create an enrollment issue (Part 7.2)
2. Note the issue number (e.g., #5)

Then trigger certification:
```bash
gh workflow run issue-cert.yml \
  --repo manojpisini/opencourses \
  --field student=yourusername \
  --field course=linux-command-line
```

**Expected:**
- `certify.ts` runs
- Finds enrollment issue by searching for `enrolled` label + student username
- Generates certificate SVG
- If GPG keys configured: signs the cert
- Creates a GitHub Release: `cert/yourusername/linux-command-line`
- Posts comment on enrollment issue with release link
- Adds `certified` label to issue
- Closes the enrollment issue
- Appends to `engine/CERTIFIED.md`
- Commits `CERTIFIED.md` and `audit/log.jsonl`

**Verify in Actions log:**
- ✓ Import GPG signing key (if secret configured)
- ✓ Find enrollment issue number
- ✓ Generate certificate
- ✓ Commit CERTIFIED.md

**Check the release:**
```
https://github.com/manojpisini/opencourses/releases
```

Should show a release tagged `cert/yourusername/linux-command-line`.

---

### 7.8 — Plagiarism Check (plagiarism-check.yml)

Runs on every PR touching `engine/curriculum/**`.

**Test — submit identical code to an existing PR:**

1. Find an existing merged PR (or create one)
2. Copy its diff exactly
3. Open a new PR with the same content
4. `plagiarism-check.yml` should flag it

**Expected:** Bot posts warning with similarity score, adds `plagiarism-flag` label.

**Similarity threshold:** 85% (`SIMILARITY_THRESHOLD: '0.85'`)

Below 85% → no flag, grading proceeds normally.

---

### 7.9 — Leaderboard Rebuild (leaderboard.yml)

Runs nightly, or trigger manually:

```bash
gh workflow run leaderboard.yml --repo manojpisini/opencourses
```

**Expected:**
- `leaderboard.ts` runs
- Reads all enrolled issues, passed PRs, certified students
- Rewrites `engine/LEADERBOARD.md` with ranking table
- Commits and pushes

**Verify:**
```bash
git pull
cat engine/LEADERBOARD.md
```

---

### 7.10 — Site Data Refresh (build-data.yml)

Runs every 6 hours, or trigger manually:

```bash
gh workflow run build-data.yml --repo manojpisini/opencourses
```

**Expected:**
- `fetch-github-data.js` calls GitHub API → writes `site/src/data/stats.json`, `contributors.json`
- `build-search-index.js` → writes `site/public/search-index.json`
- Git commit with `[skip ci]` pushes updated data files

**If COURSE_BOT_TOKEN is not set:** The commit step fails (script runs fine, just can't push).

---

### 7.11 — All Scheduled Workflows

Test these by triggering them manually:

```bash
# Dashboard
gh workflow run dashboard.yml --repo manojpisini/opencourses

# Cohort nudge (posts comments on inactive student issues)
gh workflow run cohort-nudge.yml --repo manojpisini/opencourses

# Stale check (marks/closes old issues)
gh workflow run stale-check.yml --repo manojpisini/opencourses

# Mentorship match
gh workflow run mentorship-match.yml --repo manojpisini/opencourses

# Check links (scans for dead URLs)
gh workflow run check-links.yml --repo manojpisini/opencourses

# Check videos (validates YouTube links)
gh workflow run check-videos.yml --repo manojpisini/opencourses

# Peer review assign
gh workflow run peer-review-assign.yml --repo manojpisini/opencourses

# Audit log
gh workflow run audit-log.yml --repo manojpisini/opencourses

# Build README / CURRICULUM.md
gh workflow run build-readme.yml --repo manojpisini/opencourses
```

Each should complete green. Check the Actions log per workflow for what it wrote.

---

## PART 8 — Complete End-to-End Student Journey

This is the integration test. Do it as a real student would, in order.

### Step 1: Browse the site

- Visit `https://manojpisini.github.io/opencourses`
- Browse course catalog
- Use `⌘K` / `Ctrl+K` to search for "linux"
- Click on "Linux Command Line Mastery"
- Read the course overview

### Step 2: Enroll

- Go to Issues → New issue → "📚 Enroll in a Course"
- Fill in: course = `linux-command-line`, track = `fundamentals`
- Submit

Expected: Bot posts welcome comment within ~45 seconds.

### Step 3: Read the curriculum

- Read `engine/curriculum/meta.yaml` and `engine/curriculum/schema.yaml`
- Understand the stage structure

### Step 4: Submit Stage 01

- Fork the repo (or create a branch)
- Add your solution to `engine/curriculum/linux-command-line/stage-01/`
- Open a PR with title: `[Stage 01] @yourusername`
- Wait for grader

Expected: Grade comment within ~90 seconds (includes Docker build time on first run).

### Step 5: Iterate if needed

- If score < 75%: push more commits to the same branch/PR
- Each push re-triggers `grade-assignment.yml`
- Maximum 3 attempts (enforced by grader)

### Step 6: Stage passes → advance

- When score ≥ 75%, PR is auto-merged
- `advance-stage.yml` triggers
- Bot posts Stage 02 instructions on enrollment issue

### Step 7: Complete all 5 stages

Repeat Steps 4–6 for stages 02, 03, 04, 05.

Stage 05 is a project type with peer review — 2 certified peers must review before final grade.

### Step 8: Certification

When stage 05 passes:
- `issue-cert.yml` triggers automatically
- Certificate generated and signed
- GitHub Release created at `cert/yourusername/linux-command-line`
- Name appears in `engine/LEADERBOARD.md` and `engine/CERTIFIED.md`

### Step 9: Verify certificate

```bash
# Download the release asset
gh release download cert/yourusername/linux-command-line \
  --repo manojpisini/opencourses \
  --pattern "*.asc"

# Verify GPG signature
gpg --verify certificate.asc
```

Expected: `Good signature from "OpenCourses Bot"` (if GPG was configured).

---

## PART 9 — Adding Courses to the Engine

The engine's curriculum lives in `engine/curriculum/`. To add a course that the engine can grade:

### 9.1 — Directory structure

```
engine/curriculum/linux-command-line/
├── meta.yaml                    # Course metadata
├── stage-01/
│   ├── meta.yaml               # Stage metadata
│   ├── assignment/
│   │   ├── README.md           # Student instructions
│   │   ├── starter/            # Starter code
│   │   └── tests/              # Test files
│   └── quiz/
│       └── questions.yaml      # Quiz questions
├── stage-02/
│   └── ...
└── stage-03/
    └── ...
```

### 9.2 — Create meta.yaml

`engine/curriculum/linux-command-line/meta.yaml`:
```yaml
title: "Linux Command Line Mastery"
slug: "linux-command-line"
version: "1.0.0"
track: "fundamentals"
difficulty: "beginner"
description: >
  Learn the terminal from first principles.
total_duration: "6 hours"
maintainer: "manoj"
tags: ["linux", "bash", "terminal", "cli"]
repo: "manojpisini/opencourses"
prerequisites: []
language: "Any"
```

### 9.3 — Create stage-01/assignment/README.md

This is what students read to understand their task:

```markdown
# Stage 01 — Filesystem Navigation

## Your Task

Write a shell script `solution.sh` that:

1. Creates a directory called `workspace/`
2. Creates three files inside it: `notes.txt`, `code.sh`, `config.json`
3. Makes `code.sh` executable
4. Prints the directory tree

## Expected Output

```
workspace/
├── code.sh
├── config.json
└── notes.txt
```

## Submission

- Your solution goes in `engine/curriculum/linux-command-line/stage-01/solution.sh`
- Open a PR with title: `[Stage 01] @yourusername`
```

### 9.4 — Create stage-01/quiz/questions.yaml

```yaml
title: "Stage 01 Quiz — Filesystem Basics"
time_limit_minutes: 15
pass_score: 75
questions:
  - id: q1
    type: mcq
    question: "What command shows the current working directory?"
    options:
      - "A) ls"
      - "B) pwd"
      - "C) cd"
      - "D) find"
    answer: 1   # 0-indexed: B
    points: 20

  - id: q2
    type: short
    question: "What does 'chmod +x script.sh' do?"
    keywords: ["executable", "execute", "run", "permission", "x"]
    points: 20
    llm_grade: true

  - id: q3
    type: short
    question: "Explain the difference between absolute and relative paths."
    keywords: ["root", "/", "current", "relative", "absolute"]
    points: 30
    llm_grade: true

  - id: q4
    type: code
    question: "Write a one-liner to list all .txt files in the current directory and all subdirectories."
    answer: "find . -name '*.txt'"
    points: 30
    llm_grade: true
```

### 9.5 — Create stage-01 grader (if not already in engine/scripts/graders/)

`engine/scripts/graders/stage-01.ts` should already exist. Verify it reads from the correct path and handles the `linux-command-line` course.

### 9.6 — Test the quiz locally

```bash
cd engine
GITHUB_TOKEN=<your-PAT> \
REPO=manojpisini/opencourses \
ISSUE_NUMBER=<quiz-issue-number> \
STUDENT=yourusername \
STAGE=01 \
ANTHROPIC_API_KEY=<your-key> \
bun run quiz
```

---

## PART 10 — Site Data: Verifying Correctness

### 10.1 — Check all oc.ts data is consistent

After adding a course or contributor, run:

```bash
cd site && bun run build
```

Then inspect the built HTML:

```bash
# Verify course page was built
ls site/dist/courses/linux-command-line/

# Verify sitemap has the course
grep "linux-command-line" site/dist/sitemap.xml

# Verify no stale opencourses-org references
grep -r "opencourses-org" site/dist/    # Expected: zero matches

# Verify OG image reference
grep "og:image" site/dist/index.html

# Verify base path in links
grep 'href="/opencourses' site/dist/index.html   # Expected: zero (all links are relative)
```

### 10.2 — Verify all track values

Every course in `COURSES` must have `track` matching a value in `TRACKS`:

```
"fundamentals" | "systems" | "web" | "devops" | "security"
```

TypeScript enforces this at build time. If you see a type error, your track value is wrong.

### 10.3 — Verify contributor logins

Every `maintainer` and entry in `contributors[]` array of a course must match a `login` in `OC.CONTRIBUTORS`. Otherwise the contributor profile page will have no courses listed.

---

## PART 11 — Issue Templates Testing

Go to `https://github.com/manojpisini/opencourses/issues/new/choose` and verify all 6 templates appear:

| Template | Expected label | Triggers |
|---------|---------------|---------|
| 📚 Enroll in a Course | `enrollment-request` | `enroll.yml` |
| ❓ Quiz Attempt | `quiz-attempt` | `run-quiz.yml` |
| 💬 Get Help | `help-wanted` | (manual review) |
| 📺 Suggest a Video | `content-fix`, `video-suggestion` | (manual review) |
| 🐛 Report a Bug | `bug` | (manual review) |
| ⚠️ Wrong Tier / Grade Dispute | `grade-dispute` | (manual review) |

Click each template and verify:
- All form fields render correctly
- Required fields are marked
- Default labels are pre-filled
- Title template is pre-filled

---

## PART 12 — Common Issues & Exact Fixes

| Symptom | Root cause | Exact fix |
|---------|-----------|-----------|
| Deploy fails: "Pages not configured" | GitHub Pages source not set to GitHub Actions | Settings → Pages → Source → GitHub Actions |
| `enroll.yml` doesn't trigger | Label `enrollment-request` doesn't exist | Create the label (Part 2.3) |
| `enroll.yml` fails with 403 | `COURSE_BOT_TOKEN` missing or insufficient permissions | Create PAT with `Issues: write` + `Contents: write` (Part 2.4) |
| `run-quiz.yml` fails with auth error | `ANTHROPIC_API_KEY` not set | Add the secret in Settings → Secrets |
| `grade-assignment.yml` skips grading | PR title doesn't match format | Title must be exactly `[Stage 01] @username` |
| Grade comment not posted | `GITHUB_TOKEN` can't post — bot blocked | Check PR branch permissions in Settings → Actions |
| Cert workflow: "GPG import failed" | `GPG_SIGNING_KEY` is not base64-encoded | Re-export: `gpg --export-secret-keys --armor | base64` |
| Site links 404 on GitHub Pages | Base path missing | Check `BASE_PATH` env var in deploy workflow "Setup Pages" step output |
| Command palette shows empty results | `window.OC_BASE` not set | Check Base.astro define:vars block includes `BASE_URL: base` |
| Contributor profile shows "No courses" | `maintainer` in oc.ts doesn't match contributor `login` | Verify exact string match in oc.ts |
| Build fails with type error | `track`, `difficulty`, or `status` has invalid value | Check enum values in the `Course` interface in oc.ts |
| `build-data.yml` fails on commit | `COURSE_BOT_TOKEN` missing | Add the secret, or remove the commit step to make it non-blocking |
| Docker build fails in Actions | Ubuntu runner lacks Docker daemon | Should not happen — GitHub Actions runners have Docker by default |

---

## PART 13 — Secrets Quick Reference

| Secret | Where to get it | Used by |
|--------|----------------|---------|
| `COURSE_BOT_TOKEN` | GitHub → Settings → Developer settings → Fine-grained tokens | enroll, advance, certify, leaderboard, build-data |
| `ANTHROPIC_API_KEY` | console.anthropic.com/settings/keys | quiz-engine.ts |
| `GPG_SIGNING_KEY` | `gpg --export-secret-keys --armor \| base64` | certify.ts |
| `GPG_KEY_ID` | `gpg --list-keys --keyid-format LONG` | certify.ts |
| `GITHUB_TOKEN` | Auto-provided by GitHub Actions | All workflows (read/write to own repo) |

`GITHUB_TOKEN` — you never set this. GitHub provides it automatically for every workflow run. It can: create comments, add labels, open/close issues, read repo. It cannot: push to protected branches, create fine-grained releases in some cases (use `COURSE_BOT_TOKEN` there).

---

## PART 14 — Minimum Viable Setup (just the site)

If you only want the site live and don't need the engine:

1. ✓ Enable GitHub Pages → GitHub Actions (Part 2.1)
2. ✓ Add `SITE_URL` variable (Part 2.2)
3. ✓ Trigger deploy (Part 3.1)
4. Done — site is live, all 41 pages work

You can skip:
- All secrets
- Labels
- Engine Docker testing
- Workflow tests for grading/quiz/cert

Add secrets later when you want automation to work.
