#!/usr/bin/env bun
/**
 * build.ts — Generate README.md, PLAYLIST.md, CURRICULUM.md from curriculum YAML
 *
 * Triggered by: .github/workflows/build-readme.yml
 * Env vars: REPO
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

const REPO = process.env['REPO'] ?? 'opencourse/engine';
const CURRICULUM_DIR = 'curriculum';

interface StageMetadata {
  id: string;
  title: string;
  description: string;
  duration: string;
  xp: number;
  type: 'assignment' | 'quiz' | 'project' | 'debugging' | 'code-review';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites?: string[];
  resources?: { title: string; url: string }[];
}

interface CourseMeta {
  title: string;
  slug: string;
  version: string;
  track: string;
  difficulty: string;
  description: string;
  total_duration: string;
  maintainer: string;
  tags: string[];
  repo: string;
}

function loadStageMeta(stageDir: string): StageMetadata | null {
  const metaPath = path.join(stageDir, 'meta.yaml');
  if (!fs.existsSync(metaPath)) return null;
  return yaml.load(fs.readFileSync(metaPath, 'utf-8')) as StageMetadata;
}

function loadCourseMeta(): CourseMeta | null {
  const metaPath = path.join(CURRICULUM_DIR, 'meta.yaml');
  if (!fs.existsSync(metaPath)) return null;
  return yaml.load(fs.readFileSync(metaPath, 'utf-8')) as CourseMeta;
}

function getStages(): { dir: string; meta: StageMetadata }[] {
  if (!fs.existsSync(CURRICULUM_DIR)) return [];

  return fs
    .readdirSync(CURRICULUM_DIR)
    .filter((d) => d.match(/^stage-\d+/))
    .sort()
    .map((d) => ({ dir: path.join(CURRICULUM_DIR, d), name: d }))
    .map(({ dir, name }) => {
      const meta = loadStageMeta(dir);
      return meta ? { dir, meta } : null;
    })
    .filter(Boolean) as { dir: string; meta: StageMetadata }[];
}

function buildREADME(course: CourseMeta | null, stages: { dir: string; meta: StageMetadata }[]): string {
  const title = course?.title ?? 'OpenCourse';
  const description = course?.description ?? '';
  const track = course?.track ?? '';
  const difficulty = course?.difficulty ?? '';
  const version = course?.version ?? '1.0.0';
  const totalDuration = course?.total_duration ?? '';
  const tags = (course?.tags ?? []).map((t) => `\`${t}\``).join(' ');
  const repoUrl = `https://github.com/${REPO}`;

  const stageTable = stages
    .map((s, i) => {
      const num = String(i + 1).padStart(2, '0');
      const icon = { assignment: '📝', quiz: '❓', project: '🏗️', debugging: '🐛', 'code-review': '👁️' }[s.meta.type] ?? '📋';
      return `| ${num} | ${icon} [${s.meta.title}](curriculum/stage-${num}/README.md) | ${s.meta.duration} | ${s.meta.xp} XP | ${s.meta.difficulty} |`;
    })
    .join('\n');

  const totalXP = stages.reduce((sum, s) => sum + (s.meta.xp ?? 0), 0);

  return `<div align="center">

# ${title}

${description}

![Track](https://img.shields.io/badge/Track-${encodeURIComponent(track)}-0075ca?style=flat-square)
![Difficulty](https://img.shields.io/badge/Difficulty-${difficulty}-e11d48?style=flat-square)
![Version](https://img.shields.io/badge/Version-${version}-2ea44f?style=flat-square)
![XP](https://img.shields.io/badge/Total_XP-${totalXP}-f59e0b?style=flat-square)

</div>

## About

${description}

**Tags:** ${tags}
**Duration:** ${totalDuration}
**Maintainer:** @${course?.maintainer ?? 'opencourse-bot'}

## 📋 Curriculum

| # | Stage | Duration | XP | Level |
|---|-------|----------|----|-------|
${stageTable}

**Total XP:** ${totalXP}

## 🚀 How to Enroll

1. [Open an enrollment issue](../../issues/new?template=enroll.yml) with \`course: ${course?.slug ?? 'this-course'}\`
2. Get a welcome comment with your personalized learning path
3. Fork this repo and work on Stage 01
4. Submit via PR — automated grading will run instantly

## 📜 Certificate

Pass all ${stages.length} stages to earn a **cryptographically signed** completion certificate, compatible with [Open Badges 3.0](https://www.imsglobal.org/spec/ob/v3p0/).

## 📊 Progress Tracking

- [🏆 Leaderboard](LEADERBOARD.md)
- [📊 Dashboard](DASHBOARD.md) _(instructors)_
- [🎓 Certified Graduates](CERTIFIED.md)

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) to suggest improvements, fix typos, or add resources.

---

<div align="center">

_Built on [OpenCourses](https://github.com/opencourse) · Free forever · [CC BY 4.0](LICENSE)_

</div>
`;
}

function buildPLAYLIST(course: CourseMeta | null, stages: { dir: string; meta: StageMetadata }[]): string {
  const lines = [`# 📼 ${course?.title ?? 'Course'} — Learning Playlist\n`];

  for (let i = 0; i < stages.length; i++) {
    const s = stages[i]!;
    const num = String(i + 1).padStart(2, '0');
    lines.push(`## Stage ${num}: ${s.meta.title}\n`);
    lines.push(`**Type:** ${s.meta.type} · **Duration:** ${s.meta.duration} · **XP:** ${s.meta.xp}\n`);
    lines.push(`${s.meta.description}\n`);

    if (s.meta.resources && s.meta.resources.length > 0) {
      lines.push('**Resources:**\n');
      for (const r of s.meta.resources) {
        lines.push(`- [${r.title}](${r.url})`);
      }
      lines.push('');
    }
  }

  lines.push(`---\n_Generated from curriculum YAML · Do not edit manually_`);
  return lines.join('\n');
}

function buildCURRICULUM(course: CourseMeta | null, stages: { dir: string; meta: StageMetadata }[]): string {
  const totalXP = stages.reduce((sum, s) => sum + s.meta.xp, 0);
  const lines = [
    `# 🗺️ ${course?.title ?? 'Course'} — Full Curriculum\n`,
    `> Version \`${course?.version ?? '1.0.0'}\` · ${stages.length} stages · ${totalXP} XP total · ${course?.total_duration ?? ''}\n`,
  ];

  for (let i = 0; i < stages.length; i++) {
    const s = stages[i]!;
    const num = String(i + 1).padStart(2, '0');
    const prereqs = s.meta.prerequisites?.map((p) => `\`${p}\``).join(', ') ?? 'None';

    lines.push(`## Stage ${num}: ${s.meta.title}`);
    lines.push('');
    lines.push(`| Property | Value |`);
    lines.push(`|----------|-------|`);
    lines.push(`| Type | ${s.meta.type} |`);
    lines.push(`| Difficulty | ${s.meta.difficulty} |`);
    lines.push(`| Duration | ${s.meta.duration} |`);
    lines.push(`| XP | ${s.meta.xp} |`);
    lines.push(`| Prerequisites | ${prereqs} |`);
    lines.push('');
    lines.push(s.meta.description);
    lines.push('');
  }

  lines.push(`---\n_Auto-generated · [Source](curriculum/) · Last built: ${new Date().toISOString().split('T')[0]}_`);
  return lines.join('\n');
}

function main() {
  console.log('Building README, PLAYLIST, CURRICULUM...');

  const course = loadCourseMeta();
  const stages = getStages();

  if (stages.length === 0) {
    console.warn('No stage directories found in curriculum/. Creating placeholder files.');
  }

  fs.writeFileSync('README.md', buildREADME(course, stages));
  fs.writeFileSync('PLAYLIST.md', buildPLAYLIST(course, stages));
  fs.writeFileSync('CURRICULUM.md', buildCURRICULUM(course, stages));

  console.log(`✓ Built README.md, PLAYLIST.md, CURRICULUM.md (${stages.length} stages, ${stages.reduce((s, st) => s + st.meta.xp, 0)} XP total)`);
}

main();
