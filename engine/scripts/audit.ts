#!/usr/bin/env bun
/**
 * audit.ts — Append a structured entry to audit/log.jsonl
 *
 * Triggered by: .github/workflows/audit-log.yml
 * Env vars: GITHUB_TOKEN, REPO, EVENT_TYPE, ACTOR, SUBJECT, PAYLOAD, RUN_ID
 */

import * as fs from 'fs';
import * as path from 'path';

const LOG_PATH = path.join('audit', 'log.jsonl');

interface AuditEntry {
  ts: string;
  event: string;
  actor: string;
  subject?: string;
  repo: string;
  run_id?: string;
  payload?: unknown;
}

function appendEntry(entry: AuditEntry) {
  fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
  fs.appendFileSync(LOG_PATH, JSON.stringify(entry) + '\n');
}

function main() {
  const eventType = process.env['EVENT_TYPE'];
  const actor = process.env['ACTOR'];

  if (!eventType || !actor) {
    console.error('EVENT_TYPE and ACTOR are required');
    process.exit(1);
  }

  let payload: unknown = {};
  try {
    payload = JSON.parse(process.env['PAYLOAD'] ?? '{}');
  } catch {
    payload = { raw: process.env['PAYLOAD'] };
  }

  const entry: AuditEntry = {
    ts: new Date().toISOString(),
    event: eventType,
    actor,
    subject: process.env['SUBJECT'] || undefined,
    repo: process.env['REPO'] ?? '',
    run_id: process.env['RUN_ID'] || undefined,
    payload,
  };

  appendEntry(entry);
  console.log(`✓ Audit entry written: ${eventType} by ${actor}`);
}

main();
