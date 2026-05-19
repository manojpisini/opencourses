# Security Policy

## Scope

This policy covers the OpenCourses platform repository at `github.com/manojpisini/opencourses`, including:

- The Astro static site (`site/`)
- The grading engine and Docker sandbox (`engine/`)
- GitHub Actions workflows (`.github/workflows/`)
- Automation scripts and tooling (`engine/scripts/`)

**Out of scope:** Third-party services the site links to, GitHub infrastructure itself, or vulnerabilities in upstream dependencies that have no realistic exploitation path in this project.

---

## Supported Versions

| Component | Status |
|---|---|
| `main` branch (current) | Actively maintained |
| Older branches / forks | Not supported |

---

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Report privately via [GitHub Security Advisories](https://github.com/manojpisini/opencourses/security/advisories/new).

Include in your report:

1. **Description** — what the vulnerability is and what it affects
2. **Steps to reproduce** — minimal reproduction case
3. **Impact** — what an attacker could do if this were exploited
4. **Suggested fix** (optional but appreciated)

---

## Response Timeline

| Stage | Target |
|---|---|
| Initial acknowledgement | Within 72 hours |
| Triage and severity assessment | Within 5 days |
| Fix or mitigation deployed | Within 14 days for high/critical; 30 days for medium/low |
| Public disclosure | After fix is deployed, coordinated with reporter |

We follow [responsible disclosure](https://en.wikipedia.org/wiki/Coordinated_vulnerability_disclosure). You will be credited in the fix commit unless you prefer anonymity.

---

## Severity Guide

| Severity | Examples |
|---|---|
| **Critical** | Remote code execution, sandbox escape in grading engine, workflow injection that executes arbitrary code |
| **High** | Secret exfiltration via workflow, privilege escalation in engine |
| **Medium** | Stored XSS in rendered content, SSRF in fetch scripts |
| **Low** | Information disclosure, open redirect, missing security headers |

---

## Known Limitations (Not Vulnerabilities)

- The site is a **static site** with no user authentication, database, or server-side processing. There is no login system, session management, or user data stored anywhere on the platform.
- The grading engine runs in a **Docker sandbox** with these constraints:
  ```
  --network none             # no outbound network
  --memory 256m              # memory cap
  --cpus 1                   # CPU cap
  --read-only                # read-only root filesystem
  --user 1001:1001           # non-root user
  --security-opt no-new-privileges
  --tmpfs /tmp:size=100m     # 100 MB writable temp only
  ```
  Sandbox escapes are **in scope**. Sandbox-contained resource exhaustion (e.g. slow code) is not.
- Workflow secrets (`GITHUB_TOKEN`, `GPG_SIGNING_KEY`, etc.) are scoped to this repository and not accessible from forks due to GitHub's pull-request secret isolation.

---

## Contact

For non-security questions, use GitHub Issues.  
For security reports only: [GitHub Security Advisories](https://github.com/manojpisini/opencourses/security/advisories/new)
