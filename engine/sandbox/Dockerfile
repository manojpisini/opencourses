# OpenCourses Grading Sandbox
# Hardened container for running student assignment submissions
#
# Security properties:
#   --network none          no network access during grading
#   --memory 128m           memory cap
#   --cpus 0.5              CPU cap
#   --read-only             immutable root filesystem
#   --tmpfs /tmp            writable scratch space only
#   --user 1001:1001        non-root execution
#   --security-opt no-new-privileges

FROM debian:bookworm-slim AS base

# Install runtimes without recommends to keep image minimal
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-pytest \
    nodejs \
    npm \
    curl \
    git \
    unzip \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash && \
    mv /root/.bun/bin/bun /usr/local/bin/bun

# Install common Python test tooling
RUN pip3 install --no-cache-dir pytest pytest-cov 2>/dev/null || true

# Create non-root grader user
RUN groupadd -g 1001 grader && useradd -u 1001 -g 1001 -m -s /bin/bash grader

# Create writable scratch space
RUN mkdir -p /tmp/results && chown grader:grader /tmp/results

# Copy graders into image (read-only mount in production via --read-only)
WORKDIR /grader
COPY scripts/graders/ ./graders/
COPY package.json ./
RUN bun install --production 2>/dev/null || npm ci --production 2>/dev/null || true

# Switch to non-root
USER grader

# Default: run stage-01 grader. Override with:
# docker run ... -e STAGE=02 opencourse-sandbox
ENTRYPOINT ["sh", "-c", "bun run /grader/graders/stage-${STAGE:-01}.ts"]
