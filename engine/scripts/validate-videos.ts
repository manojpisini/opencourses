#!/usr/bin/env bun
/**
 * validate-videos.ts — Check all YouTube video URLs via oEmbed API
 *
 * Triggered by: .github/workflows/check-videos.yml
 * Env vars: GITHUB_TOKEN, REPO
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

interface DeadVideo {
  file: string;
  url: string;
  title?: string;
  error: string;
}

const YOUTUBE_OEMBED = 'https://www.youtube.com/oembed?format=json&url=';

async function checkYouTubeURL(url: string): Promise<{ alive: boolean; title?: string; error?: string }> {
  try {
    const oembedUrl = `${YOUTUBE_OEMBED}${encodeURIComponent(url)}`;
    const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(10000) });

    if (res.status === 404) return { alive: false, error: 'Video not found (404)' };
    if (res.status === 401) return { alive: false, error: 'Video is private (401)' };
    if (!res.ok) return { alive: false, error: `HTTP ${res.status}` };

    const data = await res.json() as { title?: string };
    return { alive: true, title: data.title };
  } catch (e) {
    return { alive: false, error: (e as Error).message };
  }
}

function extractYouTubeURLs(content: string): string[] {
  const patterns = [
    /https?:\/\/(?:www\.)?youtube\.com\/watch\?v=[\w-]+/g,
    /https?:\/\/youtu\.be\/[\w-]+/g,
    /https?:\/\/(?:www\.)?youtube\.com\/embed\/[\w-]+/g,
  ];
  const urls: string[] = [];
  for (const pattern of patterns) {
    const matches = content.match(pattern) ?? [];
    urls.push(...matches);
  }
  return [...new Set(urls)];
}

function scanDirectory(dir: string): { file: string; url: string }[] {
  const results: { file: string; url: string }[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { recursive: true, withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name);
    if (!['.md', '.yaml', '.yml', '.json'].includes(ext)) continue;

    const fullPath = path.join(entry.parentPath ?? entry.path, entry.name);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const urls = extractYouTubeURLs(content);
    for (const url of urls) {
      results.push({ file: fullPath, url });
    }
  }

  return results;
}

function writeOutputs(deadCount: number, report: string) {
  const outputFile = process.env['GITHUB_OUTPUT'];
  if (outputFile) {
    fs.appendFileSync(outputFile, `dead_count=${deadCount}\nreport=${report.replace(/\n/g, '%0A')}\n`);
  }
}

async function main() {
  console.log('Scanning for YouTube video URLs...');

  const allLinks = scanDirectory('curriculum');
  console.log(`Found ${allLinks.length} YouTube URLs across ${new Set(allLinks.map((l) => l.file)).size} files`);

  const dead: DeadVideo[] = [];
  let checked = 0;

  // Rate-limit: check 5 at a time with small delay
  const BATCH_SIZE = 5;
  for (let i = 0; i < allLinks.length; i += BATCH_SIZE) {
    const batch = allLinks.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async ({ file, url }) => {
        const result = await checkYouTubeURL(url);
        checked++;
        if (!result.alive) {
          console.log(`❌ Dead: ${url} (${result.error})`);
          dead.push({ file, url, error: result.error ?? 'Unknown error' });
        } else {
          console.log(`✓ Live: ${result.title?.slice(0, 50)}`);
        }
        return result;
      })
    );

    if (i + BATCH_SIZE < allLinks.length) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  console.log(`\nChecked ${checked} URLs: ${dead.length} dead, ${checked - dead.length} live`);

  const report = dead.length === 0
    ? '_All videos are accessible._'
    : dead
        .map((d) => `**File:** \`${d.file}\`\n**URL:** ${d.url}\n**Error:** ${d.error}`)
        .join('\n\n---\n\n');

  writeOutputs(dead.length, report);

  if (dead.length > 0) {
    console.log(`\n⚠️ ${dead.length} dead video(s) found — GitHub Issue will be created/updated`);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
