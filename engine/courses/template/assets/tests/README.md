# Test Generators

## Why dynamic test cases?

Static test cases (`test_cases:` in `solutions.yaml`) have a weakness: a student could
see fixed public inputs and hardcode outputs without understanding
the algorithm.

Dynamic test generators solve this by producing **random inputs with algorithmically
computed expected outputs** at grade time. Every submission gets a different set of
test cases (different seed). Students cannot memorise answers they have never seen.

## How it works

```
course.yaml + solutions.yaml                   Sandbox
────────────────────────────                   ───────
code question q5:          ──triggers──►  1. python3 gen.py --seed 839271 --count 10
  test_generator:                         2. Produces 10 random test cases as JSON
    "./assets/tests/q5-gen.py"            3. Runs student's code on each input
  test_count: 10           ◄── results ─  4. Compares stdout to expected_output
```

The seed is random per-submission and included in the failure feedback so a
student can share it with a maintainer for exact reproduction.

## Generator contract

A generator script must:

1. Accept `--seed <int>` and `--count <int>` CLI arguments
2. Print a **JSON array** to stdout — one object per test case:
   ```json
   [
     {
       "input":           "...",   // passed to student code via stdin
       "expected_output": "...",   // what student code's stdout should equal (stripped)
       "description":     "...",   // optional — shown in grade report
       "hidden":          false    // optional — hide input/expected from student
     },
     ...
   ]
   ```
3. Exit 0 on success

The sandbox compares `actual_stdout.strip()` == `expected_output.strip()`.

## Generator naming convention

| Question ID | Generator file              |
|-------------|-----------------------------|
| `q5`        | `assets/tests/q5-gen.py`    |
| `q3`        | `assets/tests/q3-gen.js`    |
| `ch-02-q1`  | `assets/tests/ch-02-q1-gen.py` |

Reference from `course.yaml` / `solutions.yaml`:
```yaml
- id: q5
  type: code
  language: python
  test_generator: "./assets/tests/q5-gen.py"
  test_count: 10
  points: 20
```

## Example generators in this folder

| File | Tests |
|------|-------|
| `q5-sort-gen.py` | Sort a list of integers |
| `q6-palindrome-gen.py` | Check if a string is a palindrome |
| `q7-fizzbuzz-gen.js` | FizzBuzz for a range |
