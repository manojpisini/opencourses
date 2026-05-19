#!/usr/bin/env node
/**
 * q7-fizzbuzz-gen.js — Dynamic test generator for a FizzBuzz question (JS).
 *
 * Student task: Read a single integer N from stdin.
 * Print numbers 1..N, one per line, replacing:
 *   - multiples of 3 with "Fizz"
 *   - multiples of 5 with "Buzz"
 *   - multiples of both with "FizzBuzz"
 *
 * Example input:  15
 * Example output: 1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz
 */

const { argv } = process;

function parseArgs() {
  const args = { seed: 42, count: 10 };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--seed')  args.seed  = parseInt(argv[i + 1]);
    if (argv[i] === '--count') args.count = parseInt(argv[i + 1]);
  }
  return args;
}

// Simple seedable RNG (mulberry32)
function makeRng(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function fizzBuzzExpected(n) {
  const lines = [];
  for (let i = 1; i <= n; i++) {
    if (i % 15 === 0)     lines.push('FizzBuzz');
    else if (i % 3 === 0) lines.push('Fizz');
    else if (i % 5 === 0) lines.push('Buzz');
    else                  lines.push(String(i));
  }
  return lines.join('\n');
}

function generate(seed, count) {
  const rng = makeRng(seed);
  const cases = [];

  for (let i = 0; i < count; i++) {
    const n        = Math.floor(rng() * 28) + 3;   // 3 to 30
    const expected = fizzBuzzExpected(n);
    cases.push({
      input:           String(n),
      expected_output: expected,
      description:     `FizzBuzz(${n})`,
      hidden:          i >= count - 2,
    });
  }

  return cases;
}

const { seed, count } = parseArgs();
console.log(JSON.stringify(generate(seed, count), null, 2));
