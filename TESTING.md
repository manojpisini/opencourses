# OpenCourses — Complete Testing Guide

Everything in this repo that can be tested, and exactly how to test it.
Sections are ordered from "run this first" to "engine automation last."

---

## 0 — Prerequisites

```bash
# Required tools
node --version      # ≥ 18
bun --version       # ≥ 1.x
git --version

# Clone and install
git clone https://github.com/manojpisini/opencourses.git
cd opencourses
cd site && bun install && cd ..
```

---

## 1 — Site: Build

```bash
cd site
bun run build
```

**Expected output:**
- `41 page(s) built` — no errors, no warnings
- `site/dist/` directory created
- `site/dist/sitemap.xml` present
- `site/dist/index.html` present

**What to verify:**
- Zero TypeScript errors in the build output
- All 18 contributor pages generated: `dist/contributors/<login>/index.html`
- All 16 course pages generated: `dist/courses/<slug>/index.html`
- `dist/sitemap.xml` contains all 41 routes

---

## 2 — Site: Dev Server

```bash
cd site
bun run dev
# Opens at http://localhost:4321
```

Open each URL below and verify manually:

### 2.1 — Homepage (`/`)

| Element | What to check |
|---------|--------------|
| Hero section | Title "Learning, in the open." visible |
| Hero stats | Three stat boxes: Courses / Contributors / Stars |
| CTA buttons | "Explore courses" and "View tracks" are clickable links |
| "Search" button | Opens command palette on click |
| Featured courses | At least 3 CourseCard components visible |
| Tracks grid | 5 track cards visible |
| Activity heatmap | SVG grid of colored squares (52 columns × 7 rows) |
| Top contributors | 6 contributor cards, each links to `/contributors/<login>` |
| Recent changes | 3 changelog entries with diff lines (+/−/~) |

### 2.2 — Courses Index (`/courses`)

| Element | What to check |
|---------|--------------|
| Course cards | 16 cards render (default view) |
| Search box | Typing filters cards in real-time (no page reload) |
| Track filter dropdown | Selecting "Web" shows only web-track courses |
| Difficulty filter | "Beginner" hides advanced/draft courses |
| Status filter | "Added" shows only green-status courses |
| Duration filter | "0–5 h" hides courses longer than 5 hours |
| Sort: Stars | Cards reorder by star count |
| Sort: Recent | Cards reorder by updatedAt descending |
| Sort: Name | Cards reorder alphabetically |
| View toggle | Switch between grid and list view |
| Course count | "Showing N of 16 courses" updates with filters |
| Tag chips | Clicking a tag on a card applies that tag filter |
| Clear filters | "Clear" button resets everything, shows all 16 |

### 2.3 — Individual Course (`/courses/rust-fundamentals`)

| Element | What to check |
|---------|--------------|
| Breadcrumb | `~ / courses / rust-fundamentals` |
| Title | "Rust Fundamentals" |
| Difficulty badge | "[BEGINNER]" or similar |
| Track badge | "Systems" |
| Version tag | "[v1.x.x]" |
| Git status chip | Colored status indicator |
| Sparkline | Tiny SVG activity chart |
| Stats row | Modules count · Duration · Stars · Forks |
| Contributors | Avatar chips, each links to `/contributors/<login>` |
| Tags | Clickable tag chips |
| Markdown body | Course description/content rendered as HTML |
| Prerequisites | Listed if course has them (check `async-rust` — has prereqs) |
| "View on GitHub" | External link opens to `github.com/manojpisini/opencourses` |

Test all 16 courses are reachable — spot-check 3–4:

```
/courses/rust-fundamentals
/courses/web-security-101
/courses/docker-basics
/courses/git-internals
```

### 2.4 — Tracks (`/tracks`)

| Element | What to check |
|---------|--------------|
| Breadcrumb | `~ / tracks` |
| Graph SVG | Renders a force-directed graph with colored nodes |
| Nodes | 16 course nodes, colored by track |
| Node drag | Dragging a node moves it; physics simulation responds |
| Node click | Clicking a node opens the detail panel on the right |
| Detail panel | Shows course title, module count, description |
| "View course →" | Link navigates to `/courses/<slug>` |
| Close button | `✕ close` hides the detail panel |
| Track filter dropdown | "Web" grays out non-web nodes |
| Reset view | Resets zoom/pan |
| Track legend | 5 colored legend items (fundamentals / systems / web / devops / security) |
| Track cards below | 5 cards each showing course count and sample titles |
| Track card click | Navigates to `/courses?track=<slug>` |

### 2.5 — Contributors Index (`/contributors`)

| Element | What to check |
|---------|--------------|
| Breadcrumb | `~ / contributors` |
| Contributor cards | 18 cards visible |
| Avatar | Gradient SVG with initials (no broken images) |
| Name + role | Displayed below avatar |
| Stats | Commits + Courses count |
| Card click | Navigates to `/contributors/<login>` |
| Activity heatmap | Shows at bottom of page |

### 2.6 — Contributor Profile (`/contributors/manoj`)

| Element | What to check |
|---------|--------------|
| Breadcrumb | `~ / contributors / manoj` |
| Avatar (2xl) | Large gradient SVG |
| Name heading | Full name displayed |
| Role badge | e.g., "Maintainer · Systems" |
| Stats | Commits · Courses counts |
| Track chips | Clickable, links to `/courses?track=<slug>` |
| GitHub button | Opens `https://github.com/manoj` in new tab |
| Courses grid | Shows all courses maintained by or contributed to by this user |

Test at least 3 different contributor profiles. Some contributors have no courses — verify the "No courses yet." message appears for those.

### 2.7 — Changelog (`/changelog`)

| Element | What to check |
|---------|--------------|
| Month groups | 3 groups: May, April, March 2026 |
| Entries | Each entry has course name, version tag, date |
| Change lines | `+` (added), `−` (removed), `~` (modified) in correct colors |
| Course links | Entry title links to `/courses/<slug>` |

### 2.8 — About (`/about`)

| Element | What to check |
|---------|--------------|
| Page loads | No crash, content visible |
| Section headings | Mission, how it works, etc. |
| Contributor avatars | If rendered, load without broken images |

### 2.9 — 404 Page (`/nonexistent-path`)

| Element | What to check |
|---------|--------------|
| Page loads | Custom 404 page, not browser default |
| "Go home" link | Navigates back to `/` |

### 2.10 — Sitemap (`/sitemap.xml`)

```
http://localhost:4321/sitemap.xml
```

- Returns valid XML
- Contains `<url>` entries for all major routes
- No localhost URLs when built with `SITE_URL`

---

## 3 — Site: Interactive Features

### 3.1 — Command Palette (⌘K / Ctrl+K)

1. Press `Ctrl+K` (Windows) or `Cmd+K` (Mac) — palette opens
2. Type "rust" → shows "Rust Fundamentals" and "Async Rust"
3. Press `↓` → second result highlights
4. Press `Enter` → navigates to that course
5. Press `Ctrl+K` again → palette reopens
6. Type "web" → shows courses + "Web" track
7. Click a track result → navigates to `/tracks#web`
8. Type "manoj" → contributor result appears
9. Click contributor → navigates to `/contributors/manoj`
10. Press `Escape` → palette closes
11. Click outside the palette box → closes
12. Click "Search courses…" in navbar → palette opens

### 3.2 — Theme Toggle

1. Click the ☀ / 🌑 button in the top-right navbar
2. Page switches between dark and light mode
3. Refresh the page — theme persists (stored in `localStorage`)
4. Open a new tab — same theme applied before any flicker

### 3.3 — Knowledge Graph Physics

1. Navigate to `/tracks`
2. Click and drag a node — it moves
3. Release — node returns to physics-simulated position
4. Click a node — detail panel appears
5. Drag the canvas (empty space) — pans the view
6. Scroll wheel — zooms in/out
7. Click "Reset view" — returns to default zoom/pan
8. Select a track from the dropdown — off-track nodes fade out

### 3.4 — Catalog Filter (Persistence)

1. Go to `/courses`
2. Set filter: Track = Web, Difficulty = Intermediate
3. Copy the URL — filters are NOT in the URL (client-side only)
4. Navigate away, come back — filters reset (expected behavior)
5. Verify tag click: on any CourseCard, click a tag chip → filter applies automatically

### 3.5 — Build Status Bar

1. On any page, look for the thin bar at the very top
2. On load it should animate from "building" to "success" within ~3 seconds
3. Color changes: orange/yellow → green

---

## 4 — Site: Responsive Layout

Test at these viewport widths in DevTools:

| Width | What to verify |
|-------|---------------|
| 375px (iPhone SE) | Navbar collapses, hero stacks vertically, no overflow |
| 768px (iPad) | Course grid is 2 columns, tracks stack |
| 1024px (laptop) | Full layout, 3-column course grid |
| 1440px (desktop) | Content stays centered, no excessive whitespace |

Specific components to check at mobile:
- Navbar: hamburger menu OR hidden links (no overflow)
- Command palette: full-width, scrollable results
- Knowledge graph: shrinks to container, still interactive
- Course cards: full-width single column

---

## 5 — Site: Performance & Correctness

### 5.1 — View Source / No Framework Check

Open any page → View Source (Ctrl+U):

- No `<script type="module">` from a framework
- No React/Vue/Svelte runtime JS
- All content is in raw HTML (pre-rendered)
- `<script src="/js/oc.js">` is the only global script

### 5.2 — Network Tab (DevTools → Network)

Reload the homepage with DevTools open:

| Resource | Expected size |
|----------|--------------|
| `global.css` | ~42 KB |
| `oc.js` | ~2 KB |
| `cmdpalette.js` | ~4 KB (loaded via CommandPalette component) |
| HTML (index) | 30–80 KB |
| Total (no fonts) | < 150 KB |

### 5.3 — OG / Meta Tags

Open homepage → View Source → search for `og:image`:

```html
<meta property="og:image" content="https://manojpisini.github.io/opencourses/og-image.svg" />
<meta name="twitter:card" content="summary_large_image" />
```

Both should be present. Verify `og:title` and `og:description` are also present.

### 5.4 — Sitemap

```bash
# After build
cat site/dist/sitemap.xml | grep '<url>' | wc -l
# Expected: 41 (or close)
```

---

## 6 — GitHub Actions: Deploy

After pushing to `main`, go to:
`https://github.com/manojpisini/opencourses/actions`

### 6.1 — deploy-site.yml

**Trigger:** Push to `main` that touches `site/**`

**Steps to verify:**
1. `Checkout` — green ✓
2. `Setup Bun` — installs bun
3. `Install dependencies` — `bun install` succeeds
4. `Setup Pages` — outputs `base_path` = `/opencourses`
5. `Build site` — `41 page(s) built` in stdout
6. `Upload artifact` — `site/dist` uploaded
7. Deploy job → `Deploy to GitHub Pages` — green ✓

**Post-deploy:**
- Visit `https://manojpisini.github.io/opencourses` — site loads
- Visit `https://manojpisini.github.io/opencourses/courses` — catalog loads
- All internal links work (no 404 from base-path mismatch)

**Trigger manually:**
Actions → "Deploy Site to GitHub Pages" → "Run workflow" → Run

---

## 7 — GitHub Actions: Enrollment Flow

**Trigger:** Create an issue with the enrollment template

### 7.1 — Setup

Go to `https://github.com/manojpisini/opencourses/issues/new/choose`

Select "Enroll in a Course" template. Fill in:
- GitHub login
- Course slug (e.g., `rust-fundamentals`)

Submit the issue.

**Expected:**
- `enroll.yml` triggers within seconds
- Bot posts a comment on the issue:
  - Welcome message
  - Stage 01 instructions
  - Label `enrolled` added to issue
  - Label `course:rust-fundamentals` added
  - Issue title normalized to `[Enroll] @username — rust-fundamentals`

**What to check in Actions log:**
- `engine/scripts/enroll.ts` ran without error
- GitHub API calls succeed (needs `GITHUB_TOKEN` secret, auto-available)

---

## 8 — GitHub Actions: Assignment Grading

**Trigger:** Open a PR with title `[Stage 01] @your-username`

### 8.1 — Submission Format

1. Fork the repo (or create a branch)
2. Add your solution to `engine/curriculum/rust-fundamentals/stage-01/`
3. Open a PR: title must match `[Stage NN] @login`

**Expected:**
- `validate-pr.yml` triggers — validates title format
- `grade-assignment.yml` triggers:
  - Checks out PR
  - Runs Docker sandbox: `engine/sandbox/Dockerfile`
  - Runs `engine/scripts/graders/stage-01.ts`
  - Posts a comment with score, feedback, and XP earned
  - If score ≥ 75%: labels PR `passed`, triggers `advance-stage.yml`
  - If score < 75%: labels PR `needs-work`, feedback posted

**What to check in Actions log:**
- Docker build succeeded
- Test output captured
- Grade comment posted to PR

### 8.2 — Grade Comment Format

```
## Stage 01 Graded ✓

Score: 8 / 10 (80%)  ≥ 75% threshold → PASSED

XP earned: +100

### Feedback
[line-by-line test results]

### Next steps
Stage 02 has been unlocked. See the Stage 02 instructions issue.
```

---

## 9 — GitHub Actions: Quiz Grading

**Trigger:** Open an issue with the "Quiz Attempt" template

### 9.1 — Setup

Select "Quiz Attempt" template. Fill in:
- Course slug
- Stage number
- Your answers

Submit issue.

**Expected:**
- `run-quiz.yml` triggers
- `engine/scripts/quiz-engine.ts` calls Anthropic Claude API
- Posts a comment: per-question score, semantic feedback ("Your answer on Q2 correctly identified X but missed Y")
- NOT keyword matching — partial credit possible

**Required secret:** `ANTHROPIC_API_KEY` must be set in repo Settings → Secrets

---

## 10 — GitHub Actions: Certification

**Trigger:** All stages passed for a course

### 10.1 — Automatic Flow

When `advance-stage.yml` detects stage 05 passed:
- `issue-cert.yml` triggers
- `engine/scripts/certify.ts` runs:
  - Generates certificate content (name, course, date, score)
  - GPG-signs it with the repo's key
  - Creates a GitHub Release: `cert/username/rust-fundamentals`
  - Posts link on the enrollment issue

**To verify manually (without completing all stages):**
Dispatch `issue-cert.yml` manually from Actions with:
- `student`: your GitHub login
- `course`: `rust-fundamentals`

**Check:**
- Release appears at `github.com/manojpisini/opencourses/releases`
- Release body contains the signed certificate block
- `gpg --verify` works on the downloaded `.asc` file

---

## 11 — GitHub Actions: Automated Maintenance

These run on schedules. Verify they're configured correctly:

| Workflow | Schedule | What to check |
|---------|----------|--------------|
| `leaderboard.yml` | Nightly 02:00 UTC | `engine/LEADERBOARD.md` updated |
| `build-data.yml` | Every 6 hours | Fetches GitHub API stats, no crash |
| `check-links.yml` | Weekly Monday | Posts issue if dead links found |
| `check-videos.yml` | Weekly Tuesday | Posts issue if YouTube links 404 |
| `dashboard.yml` | Weekly Sunday | `engine/DASHBOARD.md` updated |
| `cohort-nudge.yml` | Daily 09:00 UTC | Comments on stale student issues |
| `stale-check.yml` | Daily | Closes issues inactive > 30 days |
| `audit-log.yml` | On every event | Appends to `engine/AUDIT.log` |
| `build-readme.yml` | On push | Regenerates `engine/CURRICULUM.md` |
| `plagiarism-check.yml` | On every PR | Compares AST similarity |
| `peer-review-assign.yml` | On Stage 5 PR | Assigns 2 peer reviewers |
| `mentorship-match.yml` | Weekly Saturday | Posts mentor matches |

**To test any of these manually:**
Actions → select workflow → "Run workflow" → Run

---

## 12 — Engine: TypeScript Compilation

```bash
cd engine
bun install
npx tsc --noEmit
```

**Expected:** Zero errors. All 19 scripts + 5 graders type-check cleanly.

---

## 13 — Engine: Script Dry-Runs

Each script reads from environment variables. You can dry-run them locally:

```bash
cd engine

# Validate curriculum schema
REPO=manojpisini/opencourses bun run validate

# Build README / CURRICULUM.md
REPO=manojpisini/opencourses bun run build

# Check external links
REPO=manojpisini/opencourses bun run check-links

# Build search index (site)
cd ../site && node scripts/build-search-index.js
```

---

## 14 — Engine: Grader Logic

```bash
cd engine

# Simulate a passing submission
echo '{"passed":9,"failed":1,"total":10}' > /tmp/test-results.json
STUDENT=testuser STAGE=01 REPO=manojpisini/opencourses bun run grade

# Simulate a failing submission
echo '{"passed":5,"failed":5,"total":10}' > /tmp/test-results.json
STUDENT=testuser STAGE=01 REPO=manojpisini/opencourses bun run grade
```

**Expected:**
- Passing (90%): Posts grade comment, awards 100 XP, labels `passed`
- Failing (50%): Posts feedback, labels `needs-work`, no XP

---

## 15 — Data Layer: oc.ts

```bash
cd site
# TypeScript type-check
npx tsc --noEmit
```

**Manual spot-checks in the built site:**

```bash
# After bun run build, inspect the HTML
grep -l "rust-fundamentals" site/dist/courses/*/index.html   # should exist
grep -c "<url>" site/dist/sitemap.xml                        # should be ~41
grep "manojpisini" site/dist/index.html                      # no opencourses-org refs
```

---

## 16 — GitHub Pages Setup (First Deploy)

Do this once after pushing to GitHub:

1. Go to `https://github.com/manojpisini/opencourses/settings/pages`
2. Source: **GitHub Actions** (not a branch)
3. Save

Then:

1. Go to `https://github.com/manojpisini/opencourses/settings`
2. Scroll to **Variables** (not Secrets) → "New repository variable"
3. Add: `SITE_URL` = `https://manojpisini.github.io`
4. Save

Trigger deploy:
- Actions → "Deploy Site to GitHub Pages" → "Run workflow"
- Wait ~60 seconds
- Visit `https://manojpisini.github.io/opencourses`

---

## 17 — Secrets Required for Full Automation

Go to `Settings → Secrets and variables → Actions → New repository secret`:

| Secret | Value | Used By |
|--------|-------|---------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key | `run-quiz.yml` → quiz-engine.ts |
| `COURSE_BOT_TOKEN` | GitHub PAT with `repo` + `issues` scope | `build-data.yml` (write-back commits) |
| `GPG_PRIVATE_KEY` | ASCII-armored GPG private key | `issue-cert.yml` → certify.ts |
| `GPG_PASSPHRASE` | Passphrase for GPG key | `issue-cert.yml` |

`GITHUB_TOKEN` is automatically provided by GitHub Actions — no setup needed.

---

## 18 — End-to-End Student Flow

This tests the entire platform as a student would experience it:

```
1. Browse → https://manojpisini.github.io/opencourses
2. Open courses catalog → /courses
3. Filter by "Systems" track → see Rust Fundamentals
4. Click course → read overview
5. Press ⌘K → search "rust" → navigate via keyboard
6. Go to /tracks → drag nodes in the knowledge graph
7. Open an Issue using "Enroll in a Course" template
8. Wait for bot welcome comment
9. Submit a Stage 01 PR
10. Wait for Docker grader comment with score
11. Iterate until 75%+ score
12. Stage 02 unlocks automatically
13. Complete Stage 01–05
14. Receive GPG-signed certificate as a GitHub Release
15. Verify certificate: gpg --verify <cert>.asc
```

---

## 19 — Regression Checklist (after any change to oc.ts)

Run this after every edit to `site/src/data/oc.ts`:

```bash
cd site && bun run build
```

Then verify:
- [ ] 41 pages built (no count change unless you added/removed courses or contributors)
- [ ] No TypeScript errors
- [ ] `/courses` catalog shows correct count
- [ ] `/tracks` graph has correct number of nodes
- [ ] `/contributors` shows correct count
- [ ] Sitemap entry count matches page count

---

## 20 — Common Issues & Fixes

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Course card links 404 on GitHub Pages | `base` URL not prefixed | Check `import.meta.env.BASE_URL` usage |
| Command palette opens empty | `window.OC_BASE` not set | Verify Base.astro `define:vars` block |
| Graph node click links to wrong URL | `window.OC_BASE` not set in graph.js | Check tracks/index.astro script tag |
| Contributor profile page crashes | Login not in `OC.CONTRIBUTORS` | Add contributor to oc.ts |
| Build fails TypeScript error | Type mismatch in oc.ts | Check `difficulty`, `status`, `track` values |
| Deploy workflow fails | GitHub Pages not set to "GitHub Actions" | Settings → Pages → Source |
| Quiz grading fails | Missing `ANTHROPIC_API_KEY` secret | Add secret in repo settings |
| Cert not GPG-signed | Missing `GPG_PRIVATE_KEY` secret | Add secret in repo settings |
| `build-data.yml` fails | Missing `COURSE_BOT_TOKEN` | Add secret (or remove commit step) |
