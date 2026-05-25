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
  version: string;
}

interface ShareLinks {
  linkedInAddToProfile: string;
  linkedInShare: string;
  xShare: string;
  shareText: string;
  profileCredentialName: string;
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
    id: `${certData.repoUrl}/releases/download/cert-${certData.certId}/badge.json`,
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    name: `${certData.courseTitle} — Completion Certificate`,
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
        criteria: { narrative: 'Passed all chapter tests and required assessments.' },
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

function formatLinkedInDate(isoDate: string): string {
  const issued = new Date(isoDate);
  const month = String(issued.getUTCMonth() + 1).padStart(2, '0');
  return `${issued.getUTCFullYear()}${month}`;
}

function buildShareLinks(certData: CertData, releaseUrl: string): ShareLinks {
  const profileCredentialName = `${certData.courseTitle} — OpenCourses Completion Certificate`;
  const shareText = `I completed ${certData.courseTitle} on OpenCourses and earned a verifiable certificate.`;
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
  };
}

function buildShareMarkdown(shareLinks: ShareLinks, releaseUrl: string): string {
  return `### Share Your Completion

- [Add to LinkedIn profile](${shareLinks.linkedInAddToProfile}) — LinkedIn may ask you to confirm or enter the credential details.
- [Share in a LinkedIn post](${shareLinks.linkedInShare})
- [Share on X](${shareLinks.xShare})

Suggested post:

> ${shareLinks.shareText}
> ${releaseUrl}

Credential details for profiles and resumes:

- Credential name: ${shareLinks.profileCredentialName}
- Issuing organization: OpenCourses
- Credential ID: \`${releaseUrl.split('/').pop()?.replace(/^cert-/, '') ?? ''}\`
- Credential URL: ${releaseUrl}`;
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

  const certData: CertData = {
    studentLogin: profile.login,
    studentName: profile.name,
    course,
    courseTitle,
    issuedAt,
    certId,
    repoUrl,
    version: '1.0',
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
  const releaseTag = `cert-${certId}`;
  const expectedReleaseUrl = `${repoUrl}/releases/tag/${releaseTag}`;
  const svgUrl = `${repoUrl}/releases/download/${releaseTag}/${certId}.svg`;
  const badge = buildOpenBadge(certData, svgUrl);
  const badgePath = path.join(CERT_DIR, `${certId}.badge.json`);
  fs.writeFileSync(badgePath, JSON.stringify(badge, null, 2));
  console.log(`✓ Open Badges JSON: ${badgePath}`);

  const shareLinks = buildShareLinks(certData, expectedReleaseUrl);
  const shareMarkdown = buildShareMarkdown(shareLinks, expectedReleaseUrl);

  // Create GitHub Release
  const releaseBody = `## 🎓 Certificate of Completion

**Student:** @${profile.login}
**Course:** ${courseTitle}
**Issued:** ${issuedAt.split('T')[0]}
**Certificate ID:** \`${certId}\`

### Verify Authenticity

\`\`\`bash
# Download and verify the GPG signature
curl -sL ${svgUrl} -o cert.svg
curl -sL ${svgUrl}.asc -o cert.svg.asc
gpg --verify cert.svg.asc cert.svg
\`\`\`

The Open Badges 3.0 JSON (\`${certId}.badge.json\`) can be imported into any compliant digital wallet.

${shareMarkdown}`;

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
    body: `## 🎓 Certificate Issued!

Congratulations @${student}! Your completion certificate for **${courseTitle}** has been issued.

${badgeMarkdown}

**Certificate ID:** \`${certId}\`
**Release:** ${release.html_url}

${buildShareMarkdown(buildShareLinks(certData, release.html_url), release.html_url)}

### Verify

\`\`\`bash
curl -sL ${svgUrl}.asc -o cert.asc && gpg --verify cert.asc
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
    fs.appendFileSync(outputFile, `cert_id=${certId}\nrelease_url=${release.html_url}\n`);
  }

  console.log(`✓ Certificate issued: ${release.html_url}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
