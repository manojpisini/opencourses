#!/usr/bin/env python3
"""
q6-palindrome-gen.py — Dynamic test generator for a "palindrome check" question.

Student task: Read a single word/phrase from stdin (lowercase, no spaces),
print "true" if it is a palindrome, "false" otherwise.

Example input:  racecar
Example output: true
"""

import argparse
import json
import random
import string


# Representative pool — half palindromes, half not
PALINDROMES = [
    "racecar", "level", "radar", "madam", "noon",
    "civic", "kayak", "refer", "rotor", "stats",
    "tenet", "deed", "peep", "redder", "repaper",
]
NON_PALINDROMES = [
    "hello", "world", "python", "algorithm", "function",
    "variable", "integer", "boolean", "string", "return",
    "class", "object", "method", "module", "package",
]


def random_palindrome(rng: random.Random) -> str:
    """Generate a random palindrome of length 3-9."""
    half_len = rng.randint(1, 4)
    half = ''.join(rng.choices(string.ascii_lowercase, k=half_len))
    middle = rng.choice(['', rng.choice(string.ascii_lowercase)])
    return half + middle + half[::-1]


def generate(seed: int, count: int) -> list[dict]:
    rng = random.Random(seed)
    cases = []

    for i in range(count):
        if rng.random() < 0.5:
            # Palindrome
            word     = rng.choice(PALINDROMES) if rng.random() < 0.6 else random_palindrome(rng)
            expected = "true"
        else:
            # Not palindrome
            word     = rng.choice(NON_PALINDROMES)
            expected = "false"

        cases.append({
            "input":           word,
            "expected_output": expected,
            "description":     f'Is "{word}" a palindrome?',
            "hidden":          i >= (count - 2),
        })

    return cases


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Palindrome test generator")
    p.add_argument("--seed",  type=int, default=42)
    p.add_argument("--count", type=int, default=10)
    return p.parse_args()


if __name__ == "__main__":
    args = parse_args()
    print(json.dumps(generate(args.seed, args.count), indent=2))
