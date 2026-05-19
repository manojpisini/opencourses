#!/usr/bin/env bash
# grade.sh — Sandbox entrypoint. Handles both static and dynamic test cases.
#
# Environment variables:
#
#   LANGUAGE          python | javascript | bash | java | go | c | cpp
#   STUDENT_CODE_FILE Path to the file containing the student's code answer
#   TEST_OUTPUT_FILE  Where to write the JSON results  (default /tmp/test-results.json)
#   COURSE_DIR        Mounted course directory          (default /workspace/course)
#
#   Static mode (use one of):
#     TEST_CASES_JSON   Inline JSON array of {input, expected_output, ...}
#     TEST_CASES_FILE   Path to a JSON file with the same array
#
#   Dynamic mode:
#     TEST_GENERATOR    Path to generator script, relative to COURSE_DIR
#                       e.g.  ./assets/tests/ch-01-q5-gen.py
#     SEED              Integer seed for reproducibility (default: random)
#     TEST_COUNT        Number of cases to generate     (default: 10)

set -euo pipefail

LANGUAGE="${LANGUAGE:-python}"
STUDENT_CODE_FILE="${STUDENT_CODE_FILE:-/tmp/student_code}"
TEST_OUTPUT_FILE="${TEST_OUTPUT_FILE:-/tmp/test-results.json}"
COURSE_DIR="${COURSE_DIR:-/workspace/course}"
TEST_GENERATOR="${TEST_GENERATOR:-}"
SEED="${SEED:-$RANDOM}"
TEST_COUNT="${TEST_COUNT:-10}"

CASES_FILE="/tmp/grade-test-cases-$$.json"

# ── Step 1: Produce test cases ─────────────────────────────────────────────────

if [ -n "$TEST_GENERATOR" ]; then
  GEN_PATH="${COURSE_DIR}/${TEST_GENERATOR}"
  if [ ! -f "$GEN_PATH" ]; then
    echo "ERROR: test generator not found: $GEN_PATH" >&2
    echo '{"passed":false,"score":0,"maxScore":1,"language":"'"$LANGUAGE"'","tests":[{"name":"Setup","passed":false,"score":0,"maxScore":1,"hidden":false,"error":"Generator not found: '"$TEST_GENERATOR"'"}]}' > "$TEST_OUTPUT_FILE"
    exit 1
  fi
  echo "[grade.sh] Running generator: $GEN_PATH (seed=$SEED, count=$TEST_COUNT)"
  python3 "$GEN_PATH" --seed "$SEED" --count "$TEST_COUNT" > "$CASES_FILE"

elif [ -n "${TEST_CASES_JSON:-}" ]; then
  echo "$TEST_CASES_JSON" > "$CASES_FILE"

elif [ -n "${TEST_CASES_FILE:-}" ] && [ -f "${TEST_CASES_FILE}" ]; then
  cp "$TEST_CASES_FILE" "$CASES_FILE"

else
  echo "ERROR: No test cases provided (set TEST_GENERATOR, TEST_CASES_JSON or TEST_CASES_FILE)" >&2
  echo '{"passed":false,"score":0,"maxScore":1,"language":"'"$LANGUAGE"'","tests":[{"name":"Setup","passed":false,"score":0,"maxScore":1,"hidden":false,"error":"No test cases configured"}]}' > "$TEST_OUTPUT_FILE"
  exit 1
fi

# ── Step 2: Run student code against test cases ────────────────────────────────

echo "[grade.sh] Grading $LANGUAGE code: $STUDENT_CODE_FILE"
echo "[grade.sh] Test cases: $CASES_FILE"

python3 /grader/run_and_compare.py \
  --language  "$LANGUAGE" \
  --code      "$STUDENT_CODE_FILE" \
  --tests     "$CASES_FILE" \
  --output    "$TEST_OUTPUT_FILE" \
  --seed      "$SEED"

echo "[grade.sh] Done. Results written to $TEST_OUTPUT_FILE"
cat "$TEST_OUTPUT_FILE"
