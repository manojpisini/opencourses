# 🚀 OpenCourses — Setup Guide

Complete step-by-step guide to get the monorepo running on GitHub with the site live on GitHub Pages and all automations active.

---

## Prerequisites

- Git installed locally
- [Bun](https://bun.sh) installed (`curl -fsSL https://bun.sh/install | bash`)
- A GitHub account with permission to create organizations

---

## Step 1 — Create a GitHub Organization

1. Go to **github.com → + → New organization**
2. Choose the **Free** plan
3. Name it (e.g. `opencourse` — this becomes `github.com/opencourse`)
4. Skip inviting members for now

> 💡 If you already have an org or want to use a personal account, skip this step.

---

## Step 2 — Create the Repository

1. Inside your org, click **New repository**
2. Name it **`engine`** (this becomes the main course repo)
3. Set visibility to **Public** (required for free GitHub Pages)
4. **Do NOT** initialize with README, .gitignore, or license — you already have those
5. Click **Create repository**

GitHub will show you the empty repo page with push instructions. Copy the remote URL.

---

## Step 3 — Enable GitHub Pages

1. In your new repo, go to **Settings → Pages**
2. Under **Source**, select **GitHub Actions** ← *(not "Deploy from a branch")*
3. Click **Save**

That's it — the `deploy-site.yml` workflow will handle the rest on first push.

---

## Step 4 — Add Repository Secrets

Go to **Settings → Secrets and variables → Actions** and add:

### Required Secrets

| Secret name | What it is | How to get it |
|-------------|-----------|---------------|
| `COURSE_BOT_TOKEN` | Fine-grained PAT for bot commits and issue management | See Step 4a |
| `ANTHROPIC_API_KEY` | Claude API key for quiz LLM grading | [console.anthropic.com](https://console.anthropic.com) |

### Optional Secrets (for certificate signing)

| Secret name | What it is | How to get it |
|-------------|-----------|---------------|
| `GPG_SIGNING_KEY` | Base64-encoded GPG private key | See Step 4b |
| `GPG_KEY_ID` | GPG key fingerprint (last 16 chars) | See Step 4b |

---

### Step 4a — Create `COURSE_BOT_TOKEN`

The bot token needs write access to issues, PRs, and contents so the grader can post comments, merge PRs, and commit files.

**Option A: Fine-grained PAT (recommended)**
1. GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens
2. Click **Generate new token**
3. Set name: `opencourse-bot`
4. Set expiration: 1 year
5. Resource owner: your org
6. Repository access: **Only select repositories** → select `engine`
7. Permissions needed:
   - **Contents** → Read and write
   - **Issues** → Read and write
   - **Pull requests** → Read and write
   - **Actions** → Read and write *(for workflow_dispatch triggers)*
   - **Metadata** → Read only (auto-included)
8. Click **Generate token**, copy it
9. Add as secret `COURSE_BOT_TOKEN`

**Option B: Classic PAT (simpler but broader)**
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Scopes: `repo`, `workflow`
3. Add as secret `COURSE_BOT_TOKEN`

---

### Step 4b — Set Up GPG Certificate Signing (Optional)

If you skip this, certificates are still generated but not GPG-signed.

```bash
# Generate a new GPG key
gpg --batch --gen-key <<EOF
Key-Type: EdDSA
Key-Curve: ed25519
Name-Real: OpenCourses Bot
Name-Email: bot@opencourses.dev
Expire-Date: 2y
%no-passphrase
%commit
EOF

# Get your key ID (last 16 chars of fingerprint)
gpg --list-secret-keys --keyid-format=long

# Export as base64 for the secret
gpg --armor --export-secret-keys YOUR_KEY_ID | base64 > gpg-key-b64.txt
```

Add:
- `GPG_SIGNING_KEY` → contents of `gpg-key-b64.txt`
- `GPG_KEY_ID` → your key fingerprint (e.g. `3AA5C34371567BD2`)

Delete `gpg-key-b64.txt` afterward.

---

## Step 5 — Add Repository Variables

Go to **Settings → Secrets and variables → Actions → Variables tab**:

| Variable | Value | Purpose |
|----------|-------|---------|
| `SITE_URL` | `https://YOUR_ORG.github.io` | Astro site URL for builds |

If you have a custom domain (e.g. `opencourses.dev`), set `SITE_URL` to `https://opencourses.dev` instead.

---

## Step 6 — Create Required Labels

The engine workflows use custom labels to manage student state. Run this script once after pushing (requires `gh` CLI):

```bash
gh auth login
gh label create "enrollment-request" --color "2ea44f" --description "New enrollment to process"
gh label create "enrolled"            --color "0075ca" --description "Active student"
gh label create "quiz-attempt"        --color "e4e669" --description "Quiz submission ready to grade"
gh label create "active"             --color "2ea44f" --description "Active in last 5 days"
gh label create "stale"              --color "e4e669" --description "Inactive > 5 days"
gh label create "certified"          --color "6e40c9" --description "Course completed, certificate issued"
gh label create "all-stages-complete" --color "f59e0b" --description "All stages passed"
gh label create "pending-certification" --color "f59e0b" --description "Awaiting certificate generation"
gh label create "plagiarism-flag"    --color "e11d48" --description "Similarity check flagged"
gh label create "grade-dispute"      --color "d93f0b" --description "Student disputes a grade"
gh label create "help-wanted"        --color "0075ca" --description "Student needs help"
gh label create "needs-peer-review"  --color "bfd4f2" --description "Stage 5 ready for peer review"
gh label create "peer-review-complete" --color "2ea44f" --description "Peer reviews tallied"
gh label create "dead-video"         --color "d93f0b" --description "Broken video URL"
gh label create "dead-link"          --color "d93f0b" --description "Broken link detected"
gh label create "content-fix"        --color "fef2c0" --description "Content needs updating"
gh label create "mentorship"         --color "bfd4f2" --description "Mentorship related"
gh label create "automated"          --color "ededed" --description "Created by automation"
gh label create "mentor"             --color "6e40c9" --description "Certified mentor volunteer"
gh label create "study-group"        --color "c2e0c6" --description "Study group coordination"
gh label create "video-suggestion"   --color "fef2c0" --description "Suggested video replacement"

# Stage labels (01-05)
for stage in 01 02 03 04 05; do
  gh label create "stage-${stage}-unlocked" --color "fbca04"
  gh label create "stage-${stage}-passed"   --color "2ea44f"
  gh label create "course:git-mastery"      --color "0075ca"
done
```

---

## Step 7 — Configure Branch Protection

1. Go to **Settings → Branches → Add branch protection rule**
2. Branch name pattern: `main`
3. Enable:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass — add `Validate PR` and `Grade Assignment`
   - ✅ Require branches to be up to date before merging
   - ✅ Do not allow bypassing the above settings (disable this for the bot token if needed)

---

## Step 8 — Push the Repository

```bash
# In D:\Manoj\Project\Undecided\OpenCourses\
git init
git add .
git commit -m "feat: initial OpenCourses monorepo"
git branch -M main
git remote add origin https://github.com/YOUR_ORG/engine.git
git push -u origin main
```

---

## Step 9 — Watch It Go Live

After pushing, visit **Actions** in your repo. You'll see:

| Workflow | Triggers |
|----------|---------|
| **Deploy Site to GitHub Pages** | Triggers immediately (site/** changed) |
| **Build Engine README** | Triggers immediately (curriculum/** changed) |
| **Rebuild Leaderboard** | Runs next midnight |
| **Cohort Nudge** | Runs next 09:00 UTC |
| *(others)* | On their schedules |

The site will be live at:
```
https://YOUR_ORG.github.io
```
(or your custom domain if configured)

Check: **Actions → Deploy Site to GitHub Pages → (latest run)** for the live URL.

---

## Step 10 — Custom Domain (Optional)

1. Add `CNAME` file to `site/public/`:
   ```
   opencourses.dev
   ```
2. In your DNS provider, add:
   ```
   CNAME www YOUR_ORG.github.io.
   A     @   185.199.108.153
   A     @   185.199.109.153
   A     @   185.199.110.153
   A     @   185.199.111.153
   ```
3. In **Settings → Pages → Custom domain**, enter your domain
4. Enable **Enforce HTTPS**
5. Update the `SITE_URL` variable to `https://opencourses.dev`

---

## Step 11 — Test the Full Flow

### Test enrollment
1. Go to **Issues → New issue → 📚 Enroll in a Course**
2. Fill in the form with `course: git-mastery`
3. Submit — a bot comment should appear within ~60 seconds

### Test grading
1. Fork the repo
2. Make changes in `engine/curriculum/stage-01/`
3. Open a PR with title `[Stage 01] @your-username`
4. Watch the **Grade Assignment** workflow run and post a score

### Test the site
Visit your GitHub Pages URL — the site should show the course catalog, tracks graph, and leaderboard.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Site shows 404 | Wait ~2 min for first deploy; check Actions → Deploy Site |
| Bot not commenting | Check `COURSE_BOT_TOKEN` secret is set and has issues:write |
| Quiz not grading | Check `ANTHROPIC_API_KEY` secret; confirm `quiz-attempt` label exists |
| Grade workflow fails | Check Docker is available on the runner (ubuntu-latest has it) |
| `bun install` fails | Check `engine/package.json` has correct deps; `bun.lockb` may need committing |
| YAML validation fails | Run `cd engine && bun run scripts/validate.ts --mode schema` locally |
| Pages deploy fails | Confirm Pages source is set to "GitHub Actions" not "Deploy from branch" |

---

## Directory Reference

```
opencourse/                          ← git repo root
├── .github/
│   ├── workflows/
│   │   ├── deploy-site.yml          ← Astro build → GitHub Pages
│   │   ├── build-data.yml           ← Refresh site data every 6h
│   │   ├── enroll.yml               ← Process enrollment issues
│   │   ├── grade-assignment.yml     ← Docker sandbox grading
│   │   ├── run-quiz.yml             ← LLM quiz grading
│   │   ├── advance-stage.yml        ← Stage unlock logic
│   │   ├── issue-cert.yml           ← GPG certificate generation
│   │   ├── validate-pr.yml          ← PR title + tamper check
│   │   ├── leaderboard.yml          ← Nightly LEADERBOARD.md
│   │   ├── build-readme.yml         ← README/PLAYLIST/CURRICULUM
│   │   ├── dashboard.yml            ← Weekly DASHBOARD.md
│   │   ├── check-videos.yml         ← Weekly YouTube oEmbed check
│   │   ├── check-links.yml          ← Weekly dead link scan
│   │   ├── cohort-nudge.yml         ← Daily inactivity nudge
│   │   ├── stale-check.yml          ← Quarterly stale cleanup
│   │   ├── plagiarism-check.yml     ← AST similarity on PRs
│   │   ├── peer-review-assign.yml   ← Assign peer reviewers
│   │   ├── peer-review-tally.yml    ← Tally peer review scores
│   │   ├── mentorship-match.yml     ← Weekly mentor matching
│   │   └── audit-log.yml            ← Append audit entries
│   ├── ISSUE_TEMPLATE/
│   │   ├── enroll.yml
│   │   ├── quiz-attempt.yml
│   │   ├── support.yml
│   │   ├── suggest-video.yml
│   │   ├── report-bug.yml
│   │   └── wrong-tier.yml
│   ├── pull_request_template.md
│   ├── profile/README.md            ← Org landing page
│   ├── SECURITY.md
│   ├── SUPPORT.md
│   └── FUNDING.yml
├── site/                            ← Astro 4 website
│   ├── src/
│   ├── public/
│   ├── scripts/
│   ├── package.json
│   └── astro.config.mjs
├── engine/                          ← Course engine
│   ├── curriculum/                  ← Stage content + YAML
│   ├── scripts/                     ← 17 TypeScript automation scripts
│   ├── scripts/graders/             ← Per-stage Docker graders
│   ├── sandbox/Dockerfile           ← Hardened grading container
│   ├── schema/course-schema.json    ← AJV YAML validation schema
│   ├── templates/cert.svg           ← Certificate SVG template
│   ├── audit/log.jsonl              ← Append-only audit log
│   ├── submissions/fingerprints.json ← Plagiarism fingerprint store
│   ├── README.md · LEADERBOARD.md · DASHBOARD.md · CERTIFIED.md
│   └── package.json · tsconfig.json
├── README.md
├── SETUP.md                         ← This file
├── package.json                     ← Bun workspaces root
└── .gitignore
```

---

## What NOT to Push

The `.gitignore` already excludes these, but double-check:

- `.env` files — use GitHub Secrets instead
- `engine/dist/certs/` — certificates are uploaded to GitHub Releases
- `site/dist/` — built by GitHub Actions
- `node_modules/` — installed by Actions on each run
- `GITHUB-COURSE-ENGINE.md` / `OPENCOURSES-WEBSITE-SPEC.md` — spec files only

---

*Questions? Open a [support issue](../../issues/new?template=support.yml).*
