# Stage 01 — Git Foundations

> **Type:** Assignment · **XP:** 100 · **Duration:** 2-3 hours · **Difficulty:** Beginner

## Objective

Build a small project tracked entirely with Git. You'll practice the complete
local workflow: initialize a repo, write conventional commits, manage branches,
merge, tag, and maintain a clean `.gitignore`.

## Prerequisites

- A terminal (bash, zsh, or PowerShell)
- Git installed (`git --version` should return ≥ 2.35)
- A text editor

## What You'll Build

A simple **personal portfolio** directory: a `README.md`, an `about.md`, a
`projects.md`, and a `.gitignore`. The content doesn't matter — the Git
history does.

## Requirements

Your submission must satisfy all of the following:

| # | Requirement | Points |
|---|-------------|--------|
| 1 | Git repository initialized | 10 |
| 2 | At least **5 commits** in history | 15 |
| 3 | ≥ 60% of commits follow [Conventional Commits](https://www.conventionalcommits.org/) format | 10 |
| 4 | At least **one feature branch** (not main/master) | 15 |
| 5 | `.gitignore` ignores `node_modules` and `.env` | 10 |
| 6 | Feature branch **merged** into main | 15 |
| 7 | No binary files tracked in git | 10 |
| 8 | `README.md` exists and is >50 characters | 10 |
| 9 | At least one **git tag** (e.g. `v1.0.0`) | 5 |

**Passing threshold:** 75% (75/100 points)

## Step-by-Step Guide

### 1. Set Up

```bash
mkdir my-portfolio && cd my-portfolio
git init
git config user.name "Your Name"
git config user.email "you@example.com"
```

### 2. Create Your First File

```bash
echo "# My Portfolio" > README.md
git add README.md
git commit -m "docs: add README"
```

### 3. Add a .gitignore

```bash
cat > .gitignore << 'EOF'
node_modules/
.env
.env.local
*.log
dist/
.DS_Store
EOF

git add .gitignore
git commit -m "chore: add .gitignore"
```

### 4. Create a Feature Branch

```bash
git checkout -b feature/add-about-page
echo "# About Me\n\nI'm learning Git!" > about.md
git add about.md
git commit -m "docs: add about page"

# Make another commit on the branch
echo "- Git\n- Terminal\n- Open Source" >> about.md
git add about.md
git commit -m "docs: add skills to about page"
```

### 5. Merge Back to Main

```bash
git checkout main
git merge feature/add-about-page
git commit -m "merge: integrate about page"   # if not auto-committed
```

### 6. Add a Few More Commits

```bash
echo "## Projects\n\n- This portfolio" > projects.md
git add projects.md
git commit -m "docs: add projects page"
```

### 7. Tag a Release

```bash
git tag v1.0.0
git log --oneline  # review your history
```

## Submitting

1. Push your work to your fork:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/git-mastery
   git push -u origin main
   git push --tags
   ```

2. Open a PR against this repo with the title:
   ```
   [Stage 01] @your-username
   ```

3. The grader runs automatically. Check the PR comments for your score.

## Resources

- [Git - The Simple Guide](https://rogerdudler.github.io/git-guide/)
- [Pro Git Book (free)](https://git-scm.com/book/en/v2) — Chapters 1 & 2
- [Learn Git Branching](https://learngitbranching.js.org/) — interactive
- [Conventional Commits spec](https://www.conventionalcommits.org/)

## After Stage 01

Once you pass, you'll receive a quiz issue (Stage 01 Quiz). Answer the
questions there, then Stage 02 unlocks automatically. 🚀
