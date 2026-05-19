---
# ═══════════════════════════════════════════════════════════════════════════════
#  COURSE TEMPLATE — OpenCourses
#  Copy this file to engine/courses/<your-slug>/course.md and fill it out.
#  This single file is the complete source of truth for your course.
#  All GitHub Actions, grading, enrollment, and the site are driven from it.
# ═══════════════════════════════════════════════════════════════════════════════

meta:
  slug: your-course-slug          # URL-safe, lowercase, hyphens only. e.g. git-mastery
  title: "Your Course Title"
  version: "1.0.0"                # Bump on breaking curriculum changes
  description: >
    One paragraph that sells this course. What will students know/be able to
    do after completing it? Keep it under 200 words.
  track: foundations              # foundations | systems | web | devops | data | security | open-source | ai-ml
  difficulty: beginner            # beginner | intermediate | advanced
  tags:
    - git
    - version-control
  prerequisites: []               # slugs of courses that must be completed first
  estimated_hours: 10
  license: "CC BY-SA 4.0"
  repo: "https://github.com/manojpisini/opencourses"

# ─── Contributors ─────────────────────────────────────────────────────────────
# Listed explicitly. git-log contributors are auto-detected and merged.
contributors:
  - name: "Your Name"
    github: "your-github-username"
    role: "author"                # author | reviewer | translator | illustrator
    email: "you@example.com"      # optional

# ─── Credits / Attributions ───────────────────────────────────────────────────
credits:
  - title: "Pro Git (book)"
    url: "https://git-scm.com/book/en/v2"
    author: "Scott Chacon & Ben Straub"
    license: "CC BY-NC-SA 3.0"
    type: book                    # book | paper | video | course | tool | dataset | other

# ─── Chapters ─────────────────────────────────────────────────────────────────
chapters:

  - id: ch-01
    title: "Chapter 1: Getting Started"
    description: >
      A short chapter description that appears in the course outline.

    lessons:
      - id: lesson-1-1
        title: "What is version control?"
        type: video               # video | reading | exercise | lab
        duration_minutes: 12
        url: "https://youtube.com/watch?v=EXAMPLE"
        description: "Introduction to version control concepts."

      - id: lesson-1-2
        title: "Installing Git"
        type: reading
        duration_minutes: 5
        url: "https://git-scm.com/downloads"

      - id: lesson-1-3
        title: "Your first commit"
        type: exercise
        duration_minutes: 20
        description: "Hands-on: initialise a repo, stage files, commit."
        # Optional in-lesson quiz (auto-graded)
        quiz:
          id: lesson-1-3-quiz
          title: "Quick check: first commit"
          pass_score: 60
          max_attempts: 3
          questions:
            - id: q1
              type: mcq
              question: "Which command stages all changes in the current directory?"
              options:
                - "A. git commit"
                - "B. git add ."
                - "C. git push"
                - "D. git status"
              answer: "B"
              explanation: "`git add .` stages all modified/new files in the working tree."
              points: 5

    # ── Chapter Test (required) ────────────────────────────────────────────────
    chapter_test:
      id: ch-01-test
      title: "Chapter 1 Test"
      pass_score: 75              # percentage required to pass
      max_attempts: 3
      time_limit_minutes: 30
      questions:

        - id: q1
          type: mcq
          question: "What does `git init` do?"
          options:
            - "A. Creates a new remote repository"
            - "B. Initialises a local Git repository in the current directory"
            - "C. Clones an existing repository"
            - "D. Deletes all commits"
          answer: "B"
          explanation: "`git init` creates the hidden `.git` directory that Git uses to track history."
          points: 10

        - id: q2
          type: true-false
          question: "The staging area is also called the index."
          answer: true
          explanation: "Both terms refer to the same concept — the area where changes are prepared for a commit."
          points: 5

        - id: q3
          type: multi
          question: "Which of the following are valid Git object types? (Select all that apply)"
          options:
            - "A. blob"
            - "B. tree"
            - "C. branch"
            - "D. commit"
          answer: ["A", "B", "D"]
          explanation: "Git's four object types are: blob, tree, commit, and tag. Branch is a reference, not an object."
          points: 15

        - id: q4
          type: short
          question: "Explain in your own words why commits are immutable in Git."
          keywords:
            - SHA
            - hash
            - content
            - history
          min_keywords: 2
          sample_answer: >
            Each commit's SHA-1 hash is derived from its content (tree, parent, message, author).
            Changing any part of the content would produce a different hash, effectively creating
            a new object — the original commit remains unchanged in the object store.
          points: 20

        - id: q5
          type: code
          question: |
            Write a shell command (one line) that creates a new file `hello.txt` with the text
            "Hello, Git!" and stages it for commit.
          language: bash
          starter_code: "# Your command here"
          test_cases:
            - input: ""
              expected_output: "hello.txt staged"
              description: "File exists and is staged"
            - input: "cat hello.txt"
              expected_output: "Hello, Git!"
              description: "File content is correct"
              hidden: false
          points: 20

    # ── Chapter Project (optional) ─────────────────────────────────────────────
    project:
      id: ch-01-project
      title: "Set up a personal dotfiles repo"
      description: >
        Create a public GitHub repository containing at least three dotfiles
        (e.g. `.bashrc`, `.gitconfig`, `.vimrc`). Use conventional commits.
      deliverables:
        - "Public GitHub repository URL"
        - "At least 5 commits with meaningful commit messages"
        - "A README.md explaining each dotfile"
      test_cases:
        - input: "check_repo_public"
          expected_output: "true"
          description: "Repository is public"
          hidden: false
        - input: "count_commits"
          expected_output: ">=5"
          description: "At least 5 commits"
          hidden: false
      manual_review: false
      grading_rubric:
        - criterion: "Repository structure"
          max_points: 20
          description: "Files are organised and named correctly"
        - criterion: "Commit quality"
          max_points: 30
          description: "Commits are atomic, descriptive, use conventional format"
        - criterion: "README"
          max_points: 20
          description: "README explains the purpose of each dotfile"
      pass_score: 70
      points: 70

  # ─── Add more chapters below following the same structure ──────────────────
  # - id: ch-02
  #   title: "Chapter 2: Branching and Merging"
  #   ...

# ─── Certificate ──────────────────────────────────────────────────────────────
certificate:
  requires_all_chapter_tests: true
  requires_final_project: false
  min_overall_score: 75           # average across all chapter tests

  # Optional comprehensive final test
  # final_test:
  #   id: final-test
  #   title: "Final Exam"
  #   pass_score: 80
  #   max_attempts: 2
  #   questions:
  #     - id: fq1
  #       type: mcq
  #       ...

# ─── Automation (optional) ────────────────────────────────────────────────────
automation:
  notify_discord: false
  notify_slack: false

# ─── Changelog ────────────────────────────────────────────────────────────────
changelog:
  - version: "1.0.0"
    date: "2026-05-19"
    changes:
      - type: added
        text: "Initial course release"
---

# Your Course Title

> **Difficulty:** Beginner · **Track:** Foundations · **Est. time:** 10h

## About This Course

Write a longer introduction here. This markdown body is rendered as the course
landing page on the OpenCourses site. The YAML frontmatter above drives all
automation — this section is purely for human readers.

## Prerequisites

- A computer with internet access
- No prior experience required

## What You'll Learn

- Core concept 1
- Core concept 2
- Core concept 3

## How to Enroll

[Open an enrollment issue](../../issues/new?template=enroll.yml) and enter
`your-course-slug` as the course name.
