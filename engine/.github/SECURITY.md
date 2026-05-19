# Security Policy

## Reporting a Vulnerability

**Please do not open public GitHub Issues for security vulnerabilities.**

If you discover a security vulnerability in the OpenCourses engine, graders, or workflows, please report it responsibly:

1. **GitHub Private Advisory** — [Open a private security advisory](../../security/advisories/new) (preferred)
2. **Email** — security@opencourses.dev

Include:
- A description of the vulnerability
- Steps to reproduce
- Potential impact (e.g., sandbox escape, grade tampering, credential exposure)
- Any suggested fix (optional but appreciated)

We aim to acknowledge reports within **48 hours** and provide a fix or mitigation within **14 days** for critical issues.

## Scope

| In Scope | Out of Scope |
|----------|--------------|
| Sandbox escape (Docker breakout) | Third-party dependencies (report upstream) |
| Grade tampering via PR manipulation | GitHub platform itself |
| GPG certificate forgery | Course content accuracy |
| Workflow injection via PR body | UI/cosmetic issues |
| SSRF via link/video checkers | Low-severity info disclosure |

## Supported Versions

| Version | Supported |
|---------|-----------|
| latest (main) | ✅ |
| Previous minor | ⚠️ (critical only) |
| Older | ❌ |

## Security Design

The engine is built with a defense-in-depth approach:

- **Grading sandbox:** `--network none --memory 128m --read-only --user 1001:1001 --security-opt no-new-privileges`
- **Tamper detection:** PRs modifying `tests/`, `.github/`, or `scripts/graders/` are rejected
- **Rate limiting:** Max 5 submission attempts per stage per student
- **Audit log:** Append-only JSONL log of all automation events
- **GPG signing:** Certificates are cryptographically signed and verifiable

## Hall of Fame

Responsible disclosures that lead to a fix will be credited here.

_No disclosures yet._
