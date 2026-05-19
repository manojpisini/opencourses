# Contributing to OpenCourses Engine

Thank you for wanting to improve this course! Contributions are welcome from everyone — students, educators, and developers.

## Ways to Contribute

| Type | How |
|------|-----|
| 🐛 Bug in grader/workflow | [Open a bug report](../../issues/new?template=report-bug.yml) |
| 📝 Improve stage content | Edit `curriculum/stage-NN/README.md` and open a PR |
| ❓ Add quiz questions | Edit `curriculum/stage-NN/quiz/questions.yaml` |
| 📺 Fix dead video | [Suggest a video](../../issues/new?template=suggest-video.yml) |
| 🔗 Fix dead link | Open a PR updating the broken link |
| 🌐 New course | Open a discussion first — see [Course Proposals](#course-proposals) |

## Contribution Guidelines

### Stage Content

- Keep explanations beginner-friendly — assume no prior knowledge beyond prerequisites
- Include runnable code examples for every concept
- Add at least 2 learning resources (video + article/docs)
- Test your changes locally before submitting a PR

### Graders (`scripts/graders/`)

- Graders must be deterministic — the same correct submission always passes
- Keep test cases targeted — one assertion per `test()` call
- Add a hint for every failing test
- New graders must be tested against at least 3 known-good and 2 known-bad submissions

### Quiz Questions

- MCQ questions must have exactly one unambiguously correct answer
- Short-answer questions must include at least 4 `keywords`
- Avoid trick questions — the goal is learning, not gotchas
- Every new question must include a `points` value

### Workflow Files (`.github/workflows/`)

> ⚠️ Workflow changes require maintainer approval and extra review.

- Never reduce security hardening (sandbox flags, rate limits, tamper detection)
- Test with `act` locally before opening a PR
- Document any new env vars in this file

## Peer Review Rubric

When assigned as a peer reviewer on Stage 05 (Final Project):

| Criterion | Weight |
|-----------|--------|
| Correctness — does it work? | 30% |
| Code quality — readable, typed, documented | 25% |
| Tests — meaningful coverage | 20% |
| Architecture — clear design decisions | 15% |
| Commits — descriptive history | 10% |

Use GitHub's PR review interface. Leave inline comments on specific lines.
Submit your review within **72 hours** of assignment.

## Course Proposals

To propose a new course:

1. Open a [Discussion](../../discussions) with the `course-proposal` category
2. Include: title, track, difficulty, 5 stages outline, target audience
3. Gather at least 5 👍 reactions from the community
4. A maintainer will convert it to a tracked issue

## Code of Conduct

All contributors must follow our [Code of Conduct](CODE_OF_CONDUCT.md).
We are committed to a welcoming, inclusive community.

---

_Questions? Open a [support issue](../../issues/new?template=support.yml) or start a [Discussion](../../discussions)._
