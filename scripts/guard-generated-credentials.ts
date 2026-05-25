#!/usr/bin/env bun
import { execFileSync } from 'node:child_process';

const generatedRoots = [
  'engine/dist/certs/',
  'dist/certs/',
  'certs/',
  'certificates/',
  'credentials/',
  'site/public/certs/',
  'site/public/certificates/',
  'site/public/credentials/',
];

const allowedTemplateRoots = [
  'engine/templates/',
];

const protectedNames = new Set([
  'certificate.pdf',
  'acknowledgment-of-course-completion.pdf',
  'openbadge.json',
  'certificate.svg.sig',
  'certificate.svg.asc',
  'certificate.pdf.sig',
  'certificate.pdf.asc',
  'openbadge.json.sig',
  'openbadge.json.asc',
]);

function normalizedTrackedFiles(): string[] {
  const output = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' });
  return output
    .split('\0')
    .filter(Boolean)
    .map((file) => file.replace(/\\/g, '/'));
}

function basename(file: string): string {
  const index = file.lastIndexOf('/');
  return index === -1 ? file : file.slice(index + 1);
}

function isUnder(path: string, roots: string[]): boolean {
  return roots.some((root) => path === root.slice(0, -1) || path.startsWith(root));
}

function isProtectedGeneratedArtifact(file: string): boolean {
  if (isUnder(file, allowedTemplateRoots)) return false;

  const name = basename(file).toLowerCase();
  const lower = file.toLowerCase();

  if (isUnder(lower, generatedRoots)) return true;
  if (protectedNames.has(name)) return true;
  if (/\.badge\.json(\.(sig|asc))?$/.test(name)) return true;
  if (/^certificate\.(svg|pdf)\.(sig|asc)$/.test(name)) return true;
  if (/^openbadge\.json\.(sig|asc)$/.test(name)) return true;

  return false;
}

const offenders = normalizedTrackedFiles().filter(isProtectedGeneratedArtifact);

if (offenders.length > 0) {
  console.error('Generated credential artifacts must not be committed by hand.');
  console.error('They are release-only outputs created by .github/workflows/issue-cert.yml.');
  console.error('Move source artwork/templates to engine/templates/ and let the certificate workflow generate final assets.');
  console.error('');
  console.error('Blocked tracked files:');
  for (const offender of offenders) console.error(`- ${offender}`);
  process.exit(1);
}

console.log('No generated credential artifacts are tracked.');
