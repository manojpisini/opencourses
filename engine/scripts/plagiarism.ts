#!/usr/bin/env bun
/**
 * plagiarism.ts — AST-based similarity detection for assignment submissions
 *
 * Triggered by: .github/workflows/plagiarism-check.yml
 * Env vars: GITHUB_TOKEN, REPO, PR_NUMBER, PR_AUTHOR, SIMILARITY_THRESHOLD
 */

import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const octokit = new Octokit({ auth: process.env['GITHUB_TOKEN'] });
const [owner, repo] = (process.env['REPO'] ?? '').split('/');
const prNumber = parseInt(process.env['PR_NUMBER'] ?? '0', 10);
const prAuthor = process.env['PR_AUTHOR'] ?? '';
const threshold = parseFloat(process.env['SIMILARITY_THRESHOLD'] ?? '0.85');

const FINGERPRINTS_FILE = path.join('submissions', 'fingerprints.json');

interface Fingerprint {
  author: string;
  stage: string;
  hash: string;
  ngrams: string[];
  timestamp: string;
  pr: number;
}

interface FingerprintStore {
  fingerprints: Fingerprint[];
}

function loadFingerprints(): FingerprintStore {
  if (!fs.existsSync(FINGERPRINTS_FILE)) {
    return { fingerprints: [] };
  }
  return JSON.parse(fs.readFileSync(FINGERPRINTS_FILE, 'utf-8')) as FingerprintStore;
}

function saveFingerprints(store: FingerprintStore) {
  fs.mkdirSync(path.dirname(FINGERPRINTS_FILE), { recursive: true });
  fs.writeFileSync(FINGERPRINTS_FILE, JSON.stringify(store, null, 2));
}

/**
 * Normalize source code: remove comments, whitespace, variable names
 * for language-agnostic structural similarity.
 */
function normalizeCode(code: string): string {
  return code
    // Strip single-line comments
    .replace(/\/\/[^\n]*/g, '')
    .replace(/#[^\n]*/g, '')
    // Strip multi-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Normalize variable names (replace identifiers with placeholder)
    .replace(/\b[a-z_][a-z0-9_]{2,}\b/gi, 'VAR')
    // Normalize string literals
    .replace(/"[^"]*"/g, '"STR"')
    .replace(/'[^']*'/g, "'STR'")
    // Normalize numbers
    .replace(/\b\d+(\.\d+)?\b/g, 'NUM')
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generate character n-grams for Jaccard similarity
 */
function generateNgrams(text: string, n = 5): string[] {
  const ngrams: string[] = [];
  for (let i = 0; i <= text.length - n; i++) {
    ngrams.push(text.substring(i, i + n));
  }
  return ngrams;
}

/**
 * Jaccard similarity between two n-gram sets
 */
function jaccardSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 1;
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

async function fetchPRFiles(): Promise<{ filename: string; content: string }[]> {
  const { data: files } = await octokit.pulls.listFiles({ owner, repo, pull_number: prNumber });
  const results = [];

  for (const file of files) {
    if (!file.filename.match(/\.(py|ts|js|java|go|rs|cpp|c|rb|php)$/)) continue;
    if (!file.raw_url) continue;

    try {
      const response = await fetch(file.raw_url, {
        headers: { Authorization: `Bearer ${process.env['GITHUB_TOKEN']}` },
      });
      const content = await response.text();
      results.push({ filename: file.filename, content });
    } catch {
      console.warn(`Could not fetch ${file.filename}`);
    }
  }

  return results;
}

interface SimilarityMatch {
  author: string;
  stage: string;
  similarity: number;
  pr: number;
}

function checkSimilarity(submissionNgrams: string[], store: FingerprintStore): SimilarityMatch[] {
  const matches: SimilarityMatch[] = [];

  for (const fp of store.fingerprints) {
    if (fp.author === prAuthor) continue; // Skip self-comparison
    const sim = jaccardSimilarity(submissionNgrams, fp.ngrams);
    if (sim >= threshold * 0.7) { // Lower bar to include borderline cases in report
      matches.push({ author: fp.author, stage: fp.stage, similarity: sim, pr: fp.pr });
    }
  }

  return matches.sort((a, b) => b.similarity - a.similarity);
}

function stageFromPRTitle(title: string): string {
  const m = title.match(/\[Stage\s+(0\d)\]/i);
  return m?.[1] ?? 'unknown';
}

function writeOutputs(flagged: boolean, similarity: number, matches: SimilarityMatch[]) {
  const matchList = matches
    .slice(0, 5)
    .map((m) => `- **${(m.similarity * 100).toFixed(1)}%** similar to @${m.author} (PR #${m.pr}, Stage ${m.stage})`)
    .join('\n');

  const outputs = [
    `flagged=${flagged}`,
    `similarity=${(similarity * 100).toFixed(1)}`,
    `matches=${matchList.replace(/\n/g, '%0A')}`,
  ];
  const outputFile = process.env['GITHUB_OUTPUT'];
  if (outputFile) {
    fs.appendFileSync(outputFile, outputs.join('\n') + '\n');
  }
}

async function main() {
  console.log(`Running plagiarism check on PR #${prNumber} by @${prAuthor}`);

  const { data: pr } = await octokit.pulls.get({ owner, repo, pull_number: prNumber });
  const stage = stageFromPRTitle(pr.title);

  const files = await fetchPRFiles();
  if (files.length === 0) {
    console.log('No gradeable source files found in PR, skipping.');
    writeOutputs(false, 0, []);
    return;
  }

  // Concatenate and normalize all files
  const combined = files.map((f) => f.content).join('\n');
  const normalized = normalizeCode(combined);
  const ngrams = generateNgrams(normalized);
  const hash = crypto.createHash('sha256').update(normalized).digest('hex');

  const store = loadFingerprints();

  // Check similarity against existing fingerprints
  const matches = checkSimilarity(ngrams, store);
  const maxSimilarity = matches[0]?.similarity ?? 0;
  const flagged = maxSimilarity >= threshold;

  console.log(`Max similarity: ${(maxSimilarity * 100).toFixed(1)}% (threshold: ${(threshold * 100).toFixed(0)}%)`);
  if (flagged) {
    console.log(`⚠️ Flagged! Matches found against: ${matches.slice(0, 3).map((m) => m.author).join(', ')}`);
  } else {
    console.log('✓ No significant similarity detected');
  }

  // Save fingerprint for future checks
  store.fingerprints.push({
    author: prAuthor,
    stage,
    hash,
    ngrams: ngrams.slice(0, 2000), // cap stored n-grams
    timestamp: new Date().toISOString(),
    pr: prNumber,
  });
  saveFingerprints(store);

  writeOutputs(flagged, maxSimilarity, matches);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
