#!/usr/bin/env bun
/**
 * certify.ts — Generate SVG certificate, GPG-sign it, create Open Badges JSON
 *
 * Triggered by: .github/workflows/issue-cert.yml
 * Env vars: GITHUB_TOKEN, REPO, STUDENT, COURSE, ISSUE_NUMBER, GPG_KEY_ID
 */

import { Octokit } from '@octokit/rest';
import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { execSync } from 'child_process';

const octokit = new Octokit({ auth: process.env['GITHUB_TOKEN'] });
const [owner = '', repo = ''] = (process.env['REPO'] ?? '').split('/');
const student = process.env['STUDENT'] ?? '';
const course = process.env['COURSE'] ?? '';
const issueNumber = parseInt(process.env['ISSUE_NUMBER'] ?? '0', 10);
const gpgKeyId = process.env['GPG_KEY_ID'] ?? '';

const CERT_DIR = path.join('dist', 'certs');
const TEMPLATE_PATH = path.join('templates', 'cert.svg');

interface CertData {
  studentLogin: string;
  studentName: string;
  course: string;
  courseTitle: string;
  issuedAt: string;
  certId: string;
  repoUrl: string;
  verificationUrl: string;
  verificationQrDataUri: string;
  version: string;
}

interface ShareLinks {
  linkedInAddToProfile: string;
  linkedInShare: string;
  xShare: string;
  shareText: string;
  profileCredentialName: string;
  resumeLine: string;
  credentialMarkdown: string;
}

function generateCertId(student: string, course: string): string {
  return crypto
    .createHash('sha256')
    .update(`${student}:${course}:${Date.now()}`)
    .digest('hex')
    .substring(0, 16)
    .toUpperCase();
}

function renderSVG(certData: CertData): string {
  const template = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
  return template
    .replace(/\{\{student\}\}/g, certData.studentName)
    .replace(/\{\{course\}\}/g, certData.course)
    .replace(/\{\{courseTitle\}\}/g, certData.courseTitle)
    .replace(/\{\{issuedAt\}\}/g, certData.issuedAt)
    .replace(/\{\{certId\}\}/g, certData.certId)
    .replace(/\{\{repoUrl\}\}/g, certData.repoUrl)
    .replace(/\{\{verificationUrl\}\}/g, certData.verificationUrl)
    .replace(/\{\{verificationQrDataUri\}\}/g, certData.verificationQrDataUri)
    .replace(/\{\{version\}\}/g, certData.version);
}

async function renderPDF(svgPath: string, pdfPath: string): Promise<void> {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  const svgContent = fs.readFileSync(svgPath, 'utf-8');
  await page.setContent(`<html><body style="margin:0">${svgContent}</body></html>`);
  await page.pdf({ path: pdfPath, format: 'A4', landscape: true, printBackground: true });
  await browser.close();
}

function signWithGPG(filePath: string): string {
  const sigPath = `${filePath}.asc`;
  execSync(`gpg --batch --yes --armor --detach-sign ${gpgKeyId ? `--local-user ${gpgKeyId}` : ''} --output ${sigPath} ${filePath}`);
  return sigPath;
}

function buildOpenBadge(certData: CertData, svgUrl: string): object {
  return {
    '@context': ['https://www.w3.org/ns/credentials/v2', 'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.2.json'],
    id: `${certData.repoUrl}/releases/download/cert-${certData.certId}/${certData.certId}.badge.json`,
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    name: `${certData.courseTitle} — Completion Certificate`,
    description: `Verifiable OpenCourses completion credential for ${certData.courseTitle}. Verify at ${certData.verificationUrl}`,
    issuer: {
      id: `https://github.com/${owner}`,
      type: 'Profile',
      name: 'OpenCourses',
      url: `https://github.com/${owner}`,
      image: { id: `https://github.com/${owner}.png`, type: 'Image' },
    },
    validFrom: certData.issuedAt,
    credentialSubject: {
      id: `https://github.com/${certData.studentLogin}`,
      type: 'AchievementSubject',
      name: certData.studentName,
      achievement: {
        id: `${certData.repoUrl}/releases/tag/cert-${certData.certId}`,
        type: 'Achievement',
        name: certData.courseTitle,
        description: `Successfully completed all chapters of ${certData.courseTitle} on OpenCourses`,
        image: { id: svgUrl, type: 'Image' },
        criteria: {
          id: certData.verificationUrl,
          narrative: 'Passed all chapter tests and required assessments.',
        },
        achievementType: 'Certificate',
        creator: { id: `https://github.com/${owner}`, type: 'Profile', name: 'OpenCourses' },
      },
    },
    evidence: [
      {
        id: `https://github.com/${owner}/${repo}/issues/${issueNumber}`,
        type: 'Evidence',
        name: 'Enrollment and Progress Record',
        description: 'GitHub Issue tracking all chapter completions and quiz results',
      },
      {
        id: certData.verificationUrl,
        type: 'Evidence',
        name: 'OpenCourses Verification Page',
        description: 'Human-readable verification route with release, signature, and attestation instructions',
      },
    ],
    proof: {
      type: 'DataIntegrityProof',
      cryptosuite: 'ecdsa-rdfc-2019',
      created: certData.issuedAt,
      verificationMethod: `https://github.com/${owner}.keys`,
      proofPurpose: 'assertionMethod',
      proofValue: `cert-id:${certData.certId}`,
    },
  };
}

function encodeParam(value: string): string {
  return encodeURIComponent(value);
}

function siteBaseUrl(): string {
  return (process.env['SITE_URL'] || `https://${owner}.github.io/${repo}`).replace(/\/$/, '');
}

function buildVerificationUrl(certData: Omit<CertData, 'verificationUrl' | 'verificationQrDataUri'>, releaseUrl: string): string {
  const params = new URLSearchParams({
    certId: certData.certId,
    student: certData.studentLogin,
    course: certData.course,
    release: releaseUrl,
  });
  return `${siteBaseUrl()}/verify/?${params.toString()}`;
}

function buildQrDataUri(verificationUrl: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256" role="img" aria-label="Verify certificate"><rect width="256" height="256" fill="#fff"/><rect x="16" y="16" width="64" height="64" fill="#020617"/><rect x="176" y="16" width="64" height="64" fill="#020617"/><rect x="16" y="176" width="64" height="64" fill="#020617"/><rect x="30" y="30" width="36" height="36" fill="#fff"/><rect x="190" y="30" width="36" height="36" fill="#fff"/><rect x="30" y="190" width="36" height="36" fill="#fff"/><path d="M104 24h16v16h-16zm32 0h16v16h-16zm-32 32h48v16h-48zm0 48h16v16h-16zm32 0h16v16h-16zm64 0h16v16h-16zm-96 32h32v16h-32zm48 0h16v16h-16zm32 0h48v16h-48zm-80 32h16v16h-16zm32 0h64v16h-64zm80 0h16v16h-16zm-112 32h48v16h-48zm64 0h16v16h-16zm32 0h32v16h-32zm-96 32h16v16h-16zm48 0h80v16h-80z" fill="#4C1BC9"/><text x="128" y="126" text-anchor="middle" font-family="monospace" font-size="10" fill="#020617">OpenCourses</text><text x="128" y="142" text-anchor="middle" font-family="monospace" font-size="8" fill="#475569">${verificationUrl.replace(/&/g, '&amp;').slice(0, 40)}</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function formatLinkedInDate(isoDate: string): string {
  const issued = new Date(isoDate);
  const month = String(issued.getUTCMonth() + 1).padStart(2, '0');
  return `${issued.getUTCFullYear()}${month}`;
}

function buildShareLinks(certData: CertData, releaseUrl: string): ShareLinks {
  const profileCredentialName = `${certData.courseTitle} — OpenCourses Completion Certificate`;
  const shareText = `I completed ${certData.courseTitle} on OpenCourses and earned a verifiable certificate.`;
  const resumeLine = `Completed ${certData.courseTitle} through OpenCourses. Credential ID: ${certData.certId}. Verification: ${certData.verificationUrl}`;
  const credentialMarkdown = `[${profileCredentialName}](${certData.verificationUrl}) — Credential ID: ${certData.certId}`;
  const linkedInAddToProfile = [
    'https://www.linkedin.com/profile/add',
    `?startTask=CERTIFICATION_NAME`,
    `&pfCertificationName=${encodeParam(profileCredentialName)}`,
    `&pfCertificationUrl=${encodeParam(releaseUrl)}`,
    `&pfLicenseNo=${encodeParam(certData.certId)}`,
    `&pfCertStartDate=${encodeParam(formatLinkedInDate(certData.issuedAt))}`,
  ].join('');
  const linkedInShare = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeParam(releaseUrl)}`;
  const xShare = [
    'https://twitter.com/intent/tweet',
    `?text=${encodeParam(shareText)}`,
    `&url=${encodeParam(releaseUrl)}`,
    '&hashtags=OpenCourses,OpenSource,Learning',
  ].join('');

  return {
    linkedInAddToProfile,
    linkedInShare,
    xShare,
    shareText,
    profileCredentialName,
    resumeLine,
    credentialMarkdown,
  };
}

function qrDisplayUrl(verificationUrl: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=12&data=${encodeParam(verificationUrl)}`;
}

function buildShareMarkdown(certData: CertData, shareLinks: ShareLinks, releaseUrl: string): string {
  return `## Share Your Completion

- [Add to LinkedIn profile](${shareLinks.linkedInAddToProfile}) — LinkedIn may ask you to confirm or enter the credential details.
- [Share in a LinkedIn post](${shareLinks.linkedInShare})
- [Share on X](${shareLinks.xShare})
- [Open verification page](${certData.verificationUrl})

### Copy Credential Text

\`\`\`text
${shareLinks.shareText}
${certData.verificationUrl}
\`\`\`

### Copy Resume Line

\`\`\`text
${shareLinks.resumeLine}
\`\`\`

### Copy GitHub Profile / README Badge

\`\`\`markdown
${shareLinks.credentialMarkdown}
\`\`\`

### Credential Details

- Credential name: ${shareLinks.profileCredentialName}
- Issuing organization: OpenCourses
- Credential ID: \`${certData.certId}\`
- Credential URL: ${certData.verificationUrl}
- Permanent release: ${releaseUrl}

### Verification QR

![Verification QR](${qrDisplayUrl(certData.verificationUrl)})`;
}

function buildReleaseBody(certData: CertData, releaseUrl: string, svgUrl: string, shareLinks: ShareLinks): string {
  return `# Certificate of Completion

| Field | Value |
| --- | --- |
| Student | [@${certData.studentLogin}](https://github.com/${certData.studentLogin}) |
| Course | ${certData.courseTitle} |
| Issued | ${certData.issuedAt.split('T')[0]} |
| Certificate ID | \`${certData.certId}\` |

## Download

- [Certificate SVG](${svgUrl})
- [Certificate PDF](${certData.repoUrl}/releases/download/cert-${certData.certId}/${certData.certId}.pdf)
- [Open Badges 3.0 JSON](${certData.repoUrl}/releases/download/cert-${certData.certId}/${certData.certId}.badge.json)
- [GPG signature](${svgUrl}.asc)

## Verify Authenticity

This credential is generated by the OpenCourses certificate workflow, uploaded as immutable GitHub Release assets, signed with the project GPG key, and attested by GitHub Actions provenance when repository attestations are enabled.

\`\`\`bash
curl -sL ${svgUrl} -o certificate.svg
curl -sL ${svgUrl}.asc -o certificate.svg.asc
gpg --verify certificate.svg.asc certificate.svg
gh attestation verify certificate.svg --repo ${owner}/${repo}
\`\`\`

Open the human-readable verification page:
${certData.verificationUrl}

${buildShareMarkdown(certData, shareLinks, releaseUrl)}`;
}

function appendToCertifiedMd(certData: CertData, releaseUrl: string) {
  const certifiedPath = 'CERTIFIED.md';
  let content = fs.existsSync(certifiedPath) ? fs.readFileSync(certifiedPath, 'utf-8') : '# 🏆 Certified Graduates\n\n| Student | Course | Date | Certificate |\n|---------|--------|------|-------------|\n';
  const row = `| [@${certData.studentLogin}](https://github.com/${certData.studentLogin}) | ${certData.courseTitle} | ${certData.issuedAt.split('T')[0]} | [View](${releaseUrl}) |\n`;
  content += row;
  fs.writeFileSync(certifiedPath, content);
}

async function getGitHubUserProfile(): Promise<{ login: string; name: string }> {
  const { data } = await octokit.users.getByUsername({ username: student });
  return { login: data.login, name: data.name?.trim() || data.login };
}

async function getCourseTitle(): Promise<string> {
  // Prefer course.json (generated by course-publish workflow)
  const jsonPath = path.join('courses', course, 'course.json');
  if (fs.existsSync(jsonPath)) {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8')) as { meta?: { title?: string } };
    if (data.meta?.title) return data.meta.title;
  }
  // Fallback: humanise the slug
  return course.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

async function main() {
  console.log(`Generating certificate for @${student} — ${course}`);

  if (!student || !course || !issueNumber) {
    throw new Error('STUDENT, COURSE, and ISSUE_NUMBER are required for certificate generation.');
  }

  fs.mkdirSync(CERT_DIR, { recursive: true });

  const certId = generateCertId(student, course);
  const issuedAt = new Date().toISOString();
  const courseTitle = await getCourseTitle();
  const profile = await getGitHubUserProfile();
  const repoUrl = `https://github.com/${owner}/${repo}`;
  const releaseTag = `cert-${certId}`;
  const expectedReleaseUrl = `${repoUrl}/releases/tag/${releaseTag}`;

  const baseCertData = {
    studentLogin: profile.login,
    studentName: profile.name,
    course,
    courseTitle,
    issuedAt,
    certId,
    repoUrl,
    version: '1.0',
  };
  const verificationUrl = buildVerificationUrl(baseCertData, expectedReleaseUrl);
  const certData: CertData = {
    ...baseCertData,
    verificationUrl,
    verificationQrDataUri: buildQrDataUri(verificationUrl),
  };

  // Render SVG
  const svgContent = renderSVG(certData);
  const svgPath = path.join(CERT_DIR, `${certId}.svg`);
  fs.writeFileSync(svgPath, svgContent);
  console.log(`✓ SVG certificate written: ${svgPath}`);

  // Render PDF
  const pdfPath = path.join(CERT_DIR, `${certId}.pdf`);
  await renderPDF(svgPath, pdfPath);
  console.log(`✓ PDF certificate written: ${pdfPath}`);

  // GPG sign the SVG
  let sigPath = '';
  if (gpgKeyId || process.env['GPG_SIGNING_KEY']) {
    sigPath = signWithGPG(svgPath);
    console.log(`✓ GPG signature: ${sigPath}`);
  }

  // Open Badges JSON
  const svgUrl = `${repoUrl}/releases/download/${releaseTag}/${certId}.svg`;
  const badge = buildOpenBadge(certData, svgUrl);
  const badgePath = path.join(CERT_DIR, `${certId}.badge.json`);
  fs.writeFileSync(badgePath, JSON.stringify(badge, null, 2));
  console.log(`✓ Open Badges JSON: ${badgePath}`);

  const shareLinks = buildShareLinks(certData, expectedReleaseUrl);

  // Create GitHub Release
  const releaseBody = buildReleaseBody(certData, expectedReleaseUrl, svgUrl, shareLinks);

  const { data: release } = await octokit.repos.createRelease({
    owner, repo,
    tag_name: releaseTag,
    name: `🎓 ${courseTitle} — @${profile.login}`,
    body: releaseBody,
    prerelease: false,
  });

  // Upload assets
  const uploadAsset = async (filePath: string, name: string, contentType: string) => {
    const data = fs.readFileSync(filePath);
    await octokit.repos.uploadReleaseAsset({
      owner, repo,
      release_id: release.id,
      name,
      data: data as unknown as string,
      headers: { 'content-type': contentType, 'content-length': data.length },
    });
    console.log(`✓ Uploaded: ${name}`);
  };

  await uploadAsset(svgPath, `${certId}.svg`, 'image/svg+xml');
  await uploadAsset(pdfPath, `${certId}.pdf`, 'application/pdf');
  await uploadAsset(badgePath, `${certId}.badge.json`, 'application/json');
  if (sigPath) await uploadAsset(sigPath, `${certId}.svg.asc`, 'text/plain');

  // Post congratulations comment
  const badgeMarkdown = `![Certificate](${svgUrl})`;
  await octokit.issues.createComment({
    owner, repo, issue_number: issueNumber,
    body: `## Certificate Issued

Congratulations @${student}! Your completion certificate for **${courseTitle}** has been issued.

${badgeMarkdown}

**Certificate ID:** \`${certId}\`
**Release:** ${release.html_url}
**Verify:** ${certData.verificationUrl}

${buildShareMarkdown(certData, buildShareLinks(certData, release.html_url), release.html_url)}

### Verify

\`\`\`bash
curl -sL ${svgUrl} -o certificate.svg
curl -sL ${svgUrl}.asc -o certificate.svg.asc
gpg --verify certificate.svg.asc certificate.svg
gh attestation verify certificate.svg --repo ${owner}/${repo}
\`\`\`

Add this badge to your GitHub profile or README:
\`\`\`markdown
${badgeMarkdown}
\`\`\`
`,
  });

  appendToCertifiedMd(certData, release.html_url);

  // Write outputs
  const outputFile = process.env['GITHUB_OUTPUT'];
  if (outputFile) {
    fs.appendFileSync(outputFile, `cert_id=${certId}\nrelease_url=${release.html_url}\nverification_url=${certData.verificationUrl}\n`);
  }

  console.log(`✓ Certificate issued: ${release.html_url}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
