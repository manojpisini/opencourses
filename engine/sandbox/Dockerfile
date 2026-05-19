# OpenCourses Grading Sandbox
# Generic multi-language code runner with dynamic test-case generation.
#
# Security hardening applied at runtime:
#   --network none          no network access during grading
#   --memory 256m           memory cap
#   --cpus 1                CPU cap
#   --read-only             immutable root filesystem
#   --tmpfs /tmp:size=100m  writable scratch space only
#   --user 1001:1001        non-root execution
#   --security-opt no-new-privileges

FROM debian:bookworm-slim

# ── System runtimes ────────────────────────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    nodejs \
    npm \
    default-jdk-headless \
    golang-go \
    gcc \
    g++ \
    bash \
    curl \
    ca-certificates \
    jq \
    && rm -rf /var/lib/apt/lists/*

# ── Python packages ────────────────────────────────────────────────────────────
RUN pip3 install --no-cache-dir pytest 2>/dev/null || true

# ── Non-root grader user ───────────────────────────────────────────────────────
RUN groupadd -g 1001 grader && \
    useradd -u 1001 -g 1001 -m -s /bin/bash grader && \
    mkdir -p /tmp/results && chown grader:grader /tmp/results

# ── Grader scripts ─────────────────────────────────────────────────────────────
WORKDIR /grader
COPY sandbox/run_and_compare.py ./run_and_compare.py
COPY sandbox/grade.sh           ./grade.sh
RUN chmod +x /grader/grade.sh

USER grader

# ── Entrypoint ─────────────────────────────────────────────────────────────────
# All configuration is passed via environment variables — see grade.sh.
ENTRYPOINT ["/grader/grade.sh"]
