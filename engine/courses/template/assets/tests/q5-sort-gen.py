#!/usr/bin/env python3
"""
q5-sort-gen.py — Dynamic test generator for a "sort a list" code question.

Student task: Read a JSON array of integers from stdin, print the sorted
array as JSON to stdout.

Example input:  [3, 1, 4, 1, 5, 9, 2, 6]
Example output: [1, 1, 2, 3, 4, 5, 6, 9]
"""

import argparse
import json
import random
import sys


def generate(seed: int, count: int) -> list[dict]:
    rng = random.Random(seed)
    cases = []
    for i in range(count):
        length    = rng.randint(3, 20)
        lo, hi    = rng.choice([(-100, 100), (0, 1000), (-50, 50)])
        arr       = [rng.randint(lo, hi) for _ in range(length)]
        expected  = sorted(arr)
        hidden    = i >= (count - 2)   # last 2 cases are hidden

        cases.append({
            "input":           json.dumps(arr),
            "expected_output": json.dumps(expected),
            "description":     f"Sort {arr[:4]}{'...' if len(arr) > 4 else ''}",
            "hidden":          hidden,
        })
    return cases


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Sort-list test generator")
    p.add_argument("--seed",  type=int, default=42, help="RNG seed for reproducibility")
    p.add_argument("--count", type=int, default=10, help="Number of test cases to generate")
    return p.parse_args()


if __name__ == "__main__":
    args = parse_args()
    cases = generate(args.seed, args.count)
    print(json.dumps(cases, indent=2))
