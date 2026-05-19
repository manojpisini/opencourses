#!/usr/bin/env bun
/**
 * check-links.ts — Scan all Markdown files for dead HTTP(S) links
 *
 * Triggered by: .github/workflows/check-links.yml
 * Env vars: GITHUB_TOKEN, REPO
 */

import * as fs from 'fs';
import * as path from 'path';

interface DeadLink {
  file: string;
  url: string;
  status: number | string;
}

const IGNORE_PATTERNS = [
  /^https?:\/\/localhost/,
  /^https?:\/\/127\./,
  /^https?:\/\/example\.com/,
  /^https?:\/\/your-repo/,
  /placeholder/i,
];

const TIMEOUT_MS = 15000;
const BATCH_SIZE = 10;

function extractLinks(content: string): string[] {
  const mdLinkRe = /\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g;
  const rawUrlRe = /(?<![(\[`])(https?:\/\/[^\s)\]`"'<>]+)/g;
  const urls: string[] = [];
  let m: RegExpExecArray | null;

  while ((m = mdLinkRe.exec(content)) !== null) urls.push(m[2]!);
  while ((m = rawUrlRe.exec(content)) !== null) {
    const url = m[1]!.replace(/[.,;:!?)]+$/, ''); // strip trailing punctuation
    if (!urls.includes(url)) urls.push(url);
  }

  return [...new Set(urls)].filter((url) =>
    !IGNORE_PATTERNS.some((p) => p.test(url))
  );
}

function scanDirectory(dir: string): { file: string; url: string }[] {
  const results: { file: string; url: string }[] = [];
  if (!fs.existsSync(dir)) return results;

  const walk = (d: string) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const fullPath = path.join(d, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const urls = extractLinks(content);
        urls.forEach((url) => results.push({ file: fullPath, url }));
      }
    }
  };

  walk(dir);
  return results;
}

async function checkURL(url: string): Promise<{ ok: boolean; status: number | string }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: { 'User-Agent': 'opencourse-link-checker/1.0' },
      redirect: 'follow',
    });
    clearTimeout(timer);

    // Some servers don't support HEAD, retry with GET
    if (res.status === 405) {
      const res2 = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { 'User-Agent': 'opencourse-link-checker/1.0' },
      });
      return { ok: res2.ok, status: res2.status };
    }

    return { ok: res.ok || res.status === 429, status: res.status }; // 429 = alive but rate-limited
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.includes('abort')) return { ok: false, status: 'timeout' };
    return { ok: false, status: msg.slice(0, 50) };
  }
}

function writeOutputs(deadCount: number, report: string) {
  const outputFile = process.env['GITHUB_OUTPUT'];
  if (outputFile) {
    fs.appendFileSync(outputFile, `dead_count=${deadCount}\nreport=${report.replace(/\n/g, '%0A')}\n`);
  }
}

async function main() {
  console.log('Scanning Markdown files for links...');

  const allLinks = scanDirectory('.');
  const unique = [...new Map(allLinks.map((l) => [l.url, l])).values()];
  console.log(`Found ${unique.length} unique URLs across ${new Set(allLinks.map((l) => l.file)).size} files`);

  const dead: DeadLink[] = [];

  for (let i = 0; i < unique.length; i += BATCH_SIZE) {
    const batch = unique.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async ({ file, url }) => {
        const { ok, status } = await checkURL(url);
        if (!ok) {
          console.log(`❌ [${status}] ${url} (in ${file})`);
          dead.push({ file, url, status });
        } else {
          process.stdout.write('.');
        }
      })
    );
    // Small delay between batches to be a good citizen
    if (i + BATCH_SIZE < unique.length) await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\n\nChecked ${unique.length} URLs: ${dead.length} dead`);

  const report = dead.length === 0
    ? '_All links are reachable._'
    : dead
        .map((d) => `**File:** \`${d.file}\`\n**URL:** ${d.url}\n**Status:** ${d.status}`)
        .join('\n\n---\n\n');

  writeOutputs(dead.length, report);
}

main().catch((err) => { console.error(err); process.exit(1); });
