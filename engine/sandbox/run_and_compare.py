#!/usr/bin/env python3
"""
run_and_compare.py — Language-aware test runner for the grading sandbox.

For each test case:
  1. Write the student's code to a temp file (or use as-is for a file submission)
  2. Invoke the appropriate runtime with the test input on stdin
  3. Compare stdout (stripped) against expected_output
  4. Record pass/fail

Supported languages: python, javascript (node), bash, java, go, c, cpp

Output format (written to --output):
{
  "passed":   bool,     # all cases passed
  "score":    int,      # number of cases passed
  "maxScore": int,      # total cases
  "seed":     int,      # seed used (if dynamic)
  "language": str,
  "tests": [
    {
      "name":      str,
      "passed":    bool,
      "score":     int,   # 0 or 1 per case
      "maxScore":  1,
      "hidden":    bool,
      "input":     str,   # shown only if not hidden
      "expected":  str,   # shown only if not hidden
      "actual":    str,   # shown only if not hidden
      "error":     str    # timeout / runtime error message
    }
  ],
  "duration": int        # total ms
}
"""

import argparse
import json
import os
import subprocess
import sys
import tempfile
import time


# ── Language runners ──────────────────────────────────────────────────────────

TIMEOUT = 5  # seconds per test case

def _run(cmd: list[str], stdin_text: str) -> tuple[str, int, str]:
    """Run a subprocess, return (stdout, returncode, stderr)."""
    try:
        r = subprocess.run(
            cmd,
            input=stdin_text,
            capture_output=True,
            text=True,
            timeout=TIMEOUT,
        )
        return r.stdout.strip(), r.returncode, r.stderr.strip()
    except subprocess.TimeoutExpired:
        return '', -1, f'Timeout after {TIMEOUT}s'
    except Exception as e:
        return '', -1, str(e)


def run_python(code_file: str, input_str: str) -> tuple[str, int, str]:
    return _run(['python3', code_file], input_str)


def run_node(code_file: str, input_str: str) -> tuple[str, int, str]:
    return _run(['node', code_file], input_str)


def run_bash(code_file: str, input_str: str) -> tuple[str, int, str]:
    return _run(['bash', code_file], input_str)


def run_java(code_file: str, input_str: str) -> tuple[str, int, str]:
    # Compile
    build = subprocess.run(
        ['javac', code_file], capture_output=True, text=True, timeout=15
    )
    if build.returncode != 0:
        return '', build.returncode, build.stderr
    class_dir = os.path.dirname(code_file)
    class_name = os.path.splitext(os.path.basename(code_file))[0]
    return _run(['java', '-cp', class_dir, class_name], input_str)


def run_go(code_file: str, input_str: str) -> tuple[str, int, str]:
    return _run(['go', 'run', code_file], input_str)


def _compile_and_run(
    code_file: str, input_str: str,
    compiler: list[str], ext: str,
) -> tuple[str, int, str]:
    out_bin = code_file.replace(ext, '')
    build = subprocess.run(
        compiler + ['-o', out_bin, code_file],
        capture_output=True, text=True, timeout=15,
    )
    if build.returncode != 0:
        return '', build.returncode, build.stderr
    return _run([out_bin], input_str)


def run_c(code_file: str, input_str: str) -> tuple[str, int, str]:
    return _compile_and_run(code_file, input_str, ['gcc', '-O2'], '.c')


def run_cpp(code_file: str, input_str: str) -> tuple[str, int, str]:
    return _compile_and_run(code_file, input_str, ['g++', '-O2', '-std=c++17'], '.cpp')


RUNNERS = {
    'python':     run_python,
    'python3':    run_python,
    'javascript': run_node,
    'js':         run_node,
    'node':       run_node,
    'bash':       run_bash,
    'sh':         run_bash,
    'java':       run_java,
    'go':         run_go,
    'c':          run_c,
    'cpp':        run_cpp,
    'c++':        run_cpp,
}

LANG_EXT = {
    'python': '.py', 'python3': '.py',
    'javascript': '.js', 'js': '.js', 'node': '.js',
    'bash': '.sh', 'sh': '.sh',
    'java': '.java',
    'go': '.go',
    'c': '.c',
    'cpp': '.cpp', 'c++': '.cpp',
}


# ── Normalise output ───────────────────────────────────────────────────────────

def normalise(s: str) -> str:
    """Strip trailing whitespace from each line; collapse blank lines at end."""
    lines = [l.rstrip() for l in s.splitlines()]
    while lines and not lines[-1]:
        lines.pop()
    return '\n'.join(lines)


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument('--language', required=True)
    p.add_argument('--code',     required=True, help='Path to student code file')
    p.add_argument('--tests',    required=True, help='Path to test cases JSON')
    p.add_argument('--output',   required=True, help='Where to write results JSON')
    p.add_argument('--seed',     type=int, default=42)
    args = p.parse_args()

    lang = args.language.lower()
    runner = RUNNERS.get(lang)
    if not runner:
        sys.exit(f'Unsupported language: {lang}. Supported: {", ".join(RUNNERS)}')

    with open(args.tests) as f:
        test_cases: list[dict] = json.load(f)

    # If the student code file is raw source text (not a proper extension),
    # copy it to a temp file with the right extension.
    ext = LANG_EXT.get(lang, '')
    code_file = args.code
    if not code_file.endswith(ext) and ext:
        tmp = tempfile.NamedTemporaryFile(suffix=ext, delete=False, mode='w')
        with open(args.code) as src:
            tmp.write(src.read())
        tmp.close()
        code_file = tmp.name

    results = []
    passed_count = 0
    t0 = time.time()

    for i, tc in enumerate(test_cases):
        inp      = str(tc.get('input', ''))
        expected = normalise(str(tc.get('expected_output', '')))
        hidden   = bool(tc.get('hidden', False))
        name     = tc.get('description') or f'Test case {i + 1}'

        actual, rc, err = runner(code_file, inp)
        actual = normalise(actual)

        if rc == -1:
            # Timeout or crash
            results.append({
                'name':     name,
                'passed':   False,
                'score':    0,
                'maxScore': 1,
                'hidden':   hidden,
                'error':    err,
                **({} if hidden else {'input': inp, 'expected': expected, 'actual': ''}),
            })
        else:
            ok = actual == expected
            if ok:
                passed_count += 1
            results.append({
                'name':     name,
                'passed':   ok,
                'score':    1 if ok else 0,
                'maxScore': 1,
                'hidden':   hidden,
                **({} if hidden else {
                    'input':    inp,
                    'expected': expected,
                    'actual':   actual,
                    **(({'error': f'Exit code {rc}'}) if rc != 0 else {}),
                }),
            })

    duration_ms = int((time.time() - t0) * 1000)

    report = {
        'passed':   passed_count == len(test_cases),
        'score':    passed_count,
        'maxScore': len(test_cases),
        'seed':     args.seed,
        'language': lang,
        'tests':    results,
        'duration': duration_ms,
    }

    with open(args.output, 'w') as f:
        json.dump(report, f, indent=2)

    print(f'[run_and_compare] {passed_count}/{len(test_cases)} passed ({duration_ms}ms)')


if __name__ == '__main__':
    main()
