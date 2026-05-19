#!/usr/bin/env bun
/**
 * validate.ts — YAML schema validation + PR integrity checks
 *
 * Modes:
 *   --mode schema   Validate all curriculum YAML files against JSON schema
 *   --mode pr       Validate a PR (title format, tamper detection)
 *
 * Env vars: GITHUB_TOKEN, REPO, PR_NUMBER (pr mode only)
 */

import { Octokit } from '@octokit/rest';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

const mode = process.argv.includes('--mode') ? process.argv[process.argv.indexOf('--mode') + 1] : 'schema';
const octokit = new Octokit({ auth: process.env['GITHUB_TOKEN'] });
const [owner, repo] = (process.env['REPO'] ?? '').split('/');
const prNumber = parseInt(process.env['PR_NUMBER'] ?? '0', 10);

// ─── Schema Validation ──────────────────────────────────────────────────────

function loadSchema(): object {
  const schemaPath = path.join('schema', 'course-schema.json');
  if (!fs.existsSync(schemaPath)) {
    console.warn('schema/course-schema.json not found, skipping validation');
    return {};
  }
  return JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
}

function validateYAMLFiles(): { errors: string[]; validated: number } {
  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);
  const schema = loadSchema();
  const validate = ajv.compile(schema);
  const errors: string[] = [];
  let validated = 0;

  const metaFiles = fs.readdirSync('curriculum', { recursive: true, withFileTypes: true })
    .filter((f) => f.isFile() && f.name === 'meta.yaml')
    .map((f) => path.join(f.parentPath ?? f.path, f.name));

  for (const file of metaFiles) {
    try {
      const data = yaml.load(fs.readFileSync(file, 'utf-8'));
      const valid = validate(data);
      if (!valid) {
        for (const err of validate.errors ?? []) {
          errors.push(`${file}: ${err.instancePath} ${err.message}`);
        }
      }
      validated++;
    } catch (e) {
      errors.push(`${file}: parse error — ${(e as Error).message}`);
    }
  }

  return { errors, validated };
}

// ─── PR Validation ───────────────────────────────────────────────────────────

const PR_TITLE_RE = /^\[Stage\s+0[1-5]\]\s+@[\w-]+$/;

const PROTECTED_PATHS = [
  'tests/',
  '.github/',
  'scripts/graders/',
  'scripts/validate.ts',
  'schema/',
  'sandbox/',
];

async function validatePR(): Promise<{ valid: boolean; stage: string; student: string; attempt: number }> {
  const { data: pr } = await octokit.pulls.get({ owner, repo, pull_number: prNumber });
  const errors: string[] = [];

  // Title format check
  if (!PR_TITLE_RE.test(pr.title)) {
    errors.push(`PR title must match \`[Stage 0N] @username\`. Got: "${pr.title}"`);
  }

  const stageMatch = pr.title.match(/Stage\s+(0[1-5])/i);
  const stage = stageMatch ? stageMatch[1]! : '01';
  const student = pr.user?.login ?? '';

  // Tamper detection — check diff for protected file paths
  const { data: files } = await octokit.pulls.listFiles({ owner, repo, pull_number: prNumber });
  const tampered = files.filter((f) =>
    PROTECTED_PATHS.some((p) => f.filename.startsWith(p))
  );

  if (tampered.length > 0) {
    errors.push(
      `**Tampered protected files detected:**\n${tampered.map((f) => `- \`${f.filename}\``).join('\n')}\n\nSubmissions must not modify test files, graders, schemas, or workflow files.`
    );
  }

  // Rate limiting — count previous attempts this stage
  const { data: closedPRs } = await octokit.pulls.list({
    owner, repo, state: 'closed',
    per_page: 100,
  });
  const attempt = closedPRs.filter(
    (p) => p.user?.login === student && p.title.includes(`[Stage ${stage}]`)
  ).length + 1;

  if (attempt > 5) {
    errors.push(`Maximum 5 attempts per stage reached for @${student} on Stage ${stage}. Contact an instructor.`);
  }

  if (errors.length > 0) {
    await octokit.issues.createComment({
      owner, repo, issue_number: prNumber,
      body: `## ❌ Validation Failed\n\n${errors.map((e) => `- ${e}`).join('\n\n')}\n\nFix the issues above and push again.`,
    });
    // Write outputs
    console.log(`::set-output name=valid::false`);
    console.log(`::set-output name=stage::${stage}`);
    console.log(`::set-output name=student::${student}`);
    console.log(`::set-output name=attempt::${attempt}`);
    process.exit(1);
  }

  console.log(`::set-output name=valid::true`);
  console.log(`::set-output name=stage::${stage}`);
  console.log(`::set-output name=student::${student}`);
  console.log(`::set-output name=attempt::${attempt}`);

  return { valid: true, stage, student, attempt };
}

// ─── Main ─────────────────────────────────────────────────────────────────

async function main() {
  if (mode === 'schema') {
    console.log('Validating YAML files against schema...');
    const { errors, validated } = validateYAMLFiles();
    console.log(`Validated ${validated} meta.yaml files`);
    if (errors.length > 0) {
      console.error(`\n${errors.length} validation error(s):\n`);
      errors.forEach((e) => console.error('  ' + e));
      process.exit(1);
    }
    console.log('✓ All YAML files valid');
  } else if (mode === 'pr') {
    await validatePR();
  } else {
    console.error(`Unknown mode: ${mode}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
