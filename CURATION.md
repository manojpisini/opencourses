# Curation Standards

This document defines what gets into OpenCourses, how quality is evaluated, and how content gaps are filled. Read this before proposing a new course or resource.

---

## The Core Question

> "Would a working developer recommend this to a colleague who wants to get genuinely good at this topic — not just familiar with it?"

If the answer is yes, it belongs here. If it produces checkbox learners who can recite facts but cannot build things, it does not.

---

## Course Inclusion Criteria

A course proposal must satisfy **all** of the following:

### 1. Topic Validity
- Covers a real skill used in professional software development, DevOps, security, or adjacent technical fields
- Not a vanity topic, trend-chasing, or marketing material disguised as education
- Has durable value — not so version-specific that it will be obsolete in 12 months

### 2. Unique Coverage
- Fills a gap not already covered by an existing course at the same depth
- If a similar course exists: the proposal must be demonstrably better structured, deeper, or cover a meaningfully different angle
- Shallow duplicates of existing content are rejected

### 3. Resource Quality
All resources linked in a course must meet the following bar:

| Resource Type | Criteria |
|---|---|
| Video | From a practitioner or recognised educator; not a marketing tutorial; no paywall |
| Repository | Actively maintained or historically significant; well-documented |
| Documentation | Official or authoritative; up to date |
| Article / post | Technically accurate; written by someone with demonstrated expertise |

Resources that are **not acceptable:**
- Content behind a paywall (unless the course explicitly notes it as optional enrichment)
- Vendor marketing dressed as education
- AI-generated content with no editorial review
- Outdated tutorials that reflect deprecated practices

### 4. Structure
- A course must have a clear progression — learners know what they're building toward
- At minimum: a learning objective, prerequisites, and a chapter-based curriculum outline in `course.yaml`
- Courses with graded stages must have at least one completable chapter with a defined `pass_score`
- New courses should complete `content_blueprint` in `course.yaml`: open-source-first principles, flow, repository/book/paper/spec resources, deterministic testing strategy, capstone expectations, and contribution path

### 5. Licensing Compatibility
- All linked resources must be freely accessible (no login required to view core content)
- Original authors retain their copyright; we link, we do not copy
- If a resource is adapted (text summarised, diagrams recreated), the original must be credited in `CREDITS.md`

---

## Quality Bar for Graded Chapters

Chapter tests and code assignments defined in `course.yaml` must:

- Test understanding, not memorisation — questions should require the learner to apply knowledge
- Have unambiguous pass/fail criteria set in the chapter's `chapter_test.pass_score` field
- For code assignments: test scripts must be deterministic and not rely on timing or network
- For chapter tests: all correct answers must be verifiable against a primary source (add a `source` field to each question)
- Pass threshold: ≥ 75% correct to advance (configurable per chapter via `pass_score`)

---

## Valid Track Slugs

Every course must set `classification.category` to exactly one of the 12 valid slugs:

| Slug | Track Name | Covers |
|---|---|---|
| `foundations` | Foundations & Theory | Git, DS&A, algorithms, complexity, discrete math, logic, theory |
| `languages` | Languages & Paradigms | Low-level, OOP, functional, scripting, logic programming, query |
| `web` | Web & Mobile | HTML/CSS/JS/TS, frameworks, iOS, Android, PWA, WebAssembly |
| `backend` | Backend & Databases | APIs, SQL/NoSQL/graph DBs, microservices, GraphQL, gRPC |
| `systems` | Systems & Infrastructure | OS, compilers, Docker, Kubernetes, cloud, CI/CD, IaC, SRE |
| `networks` | Networks & Protocols | TCP/IP, HTTP/1–3, TLS, BGP, WebRTC, SDN, 5G, MPLS |
| `data` | Data & AI | ETL, ML, deep learning, LLMs, MLOps, computer vision |
| `security` | Security & Cryptography | OWASP, crypto, pentesting, CTF, post-quantum, ZKPs |
| `architecture` | Architecture & Engineering | System design, patterns, DDD, TDD, distributed systems |
| `creative` | Creative Computing | Graphics, shaders, game engines, simulation, generative |
| `emerging` | Emerging Technologies | Quantum, neuromorphic, blockchain, formal verification |
| `applied` | Applied & Cross-Domain | Computational physics/biology, robotics, HPC, GIS, FPGA |

---

## How Gaps Are Filled

When a content gap is identified (via issues, community feedback, or maintainer review):

1. **Open an issue** tagged `content-gap` describing what's missing and why it matters
2. **Research existing resources** — prefer the best freely available material over creating new explanatory text
3. **Draft in a branch** — copy the template to `engine/courses/{slug}/` and set `metadata.status: "draft"` in `course.yaml`
4. **Review cycle** — at least one other contributor reads the full course page before it goes `active`
5. **Graded chapters are optional** — a course can ship as `active` with site content only; chapter tests and code assignments can follow

---

## What Gets Rejected

- Courses that are just link dumps without structure
- Topics covered by a single 10-minute video with no depth
- Content that requires learners to pay for anything to complete the course
- Courses that cannot be meaningfully assessed (too vague, too subjective)
- Proposals without a champion willing to maintain the course

---

## Maintaining Existing Courses

Courses are reviewed annually (or when a maintainer flags `metadata.status: "attention"` in `course.yaml`):

- Resources that go offline or become paywalled must be replaced or removed
- Courses using deprecated tooling get an `attention` status and a 90-day window to update
- Courses with no maintainer activity for 12 months move to `archived` after a public notice period of 30 days

---

## Proposing a New Course

Open a GitHub issue with:

```
Title: [Course Proposal] Your Course Title

Track: <one of the 12 valid slugs above>
Difficulty: beginner | intermediate | advanced
Duration estimate: X weeks

Problem statement:
  What gap does this fill? Who is the target learner?

Resource plan:
  List of primary resources you plan to use (links + brief justification)

Maintainer commitment:
  Are you willing to maintain this course ongoing?
```

Proposals that skip the issue step and go straight to a PR will be asked to open an issue first.
