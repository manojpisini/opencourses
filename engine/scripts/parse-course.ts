#!/usr/bin/env bun
/**
 * parse-course.ts — Validate a course.md and emit summary + site data.
 *
 * Usage:
 *   bun run scripts/parse-course.ts --path engine/courses/git-mastery/course.md
 *   bun run scripts/parse-course.ts --all        # scan all courses
 *
 * Triggered by: .github/workflows/course-publish.yml (validate step)
 * Also usable locally for authoring feedback.
 */

import * as fs   from 'fs';
import * as path from 'path';
import { parseCourseFile, findCourseMdFiles } from '../lib/course-parser.ts';
import { setOutput } from '../lib/github.ts';
import type { Course } from '../types/course.ts';

const args = process.argv.slice(2);
const allMode  = args.includes('--all');
const pathFlag = args.indexOf('--path');
const single   = pathFlag !== -1 ? args[pathFlag + 1] : undefined;

function summarize(course: Course): string {
  const totalLessons   = course.chapters.reduce((s, ch) => s + ch.lessons.length, 0);
  const totalQuestions = course.chapters.reduce((s, ch) =>
    s + ch.chapter_test.questions.length +
    ch.lessons.reduce((ls, l) => ls + (l.quiz?.questions.length ?? 0), 0),
  0) + (course.certificate.final_test?.questions.length ?? 0);
  const totalProjects = course.chapters.filter((ch) => ch.project).length;

  return [
    `📚 **${course.meta.title}** \`v${course.meta.version}\``,
    `   Slug: ${course.meta.slug} · Track: ${course.meta.track} · Difficulty: ${course.meta.difficulty}`,
    `   Chapters: ${course.chapters.length} · Lessons: ${totalLessons} · Questions: ${totalQuestions} · Projects: ${totalProjects}`,
    `   Contributors: ${course.contributors.length} · Credits: ${course.credits.length}`,
    `   Certificate: min ${course.certificate.min_overall_score}% · final test: ${course.certificate.final_test ? 'yes' : 'no'}`,
    `   Tags: ${course.meta.tags.join(', ')}`,
  ].join('\n');
}

function validateCourse(course: Course): string[] {
  const warnings: string[] = [];
  if (course.meta.estimated_hours <= 0)
    warnings.push('meta.estimated_hours should be > 0');
  if (course.contributors.length === 0)
    warnings.push('No contributors listed');
  for (const ch of course.chapters) {
    if (ch.lessons.length === 0)
      warnings.push(`Chapter "${ch.id}" has no lessons`);
    if (ch.chapter_test.questions.length === 0)
      warnings.push(`Chapter "${ch.id}" chapter_test has no questions`);
    if (ch.chapter_test.pass_score < 1 || ch.chapter_test.pass_score > 100)
      warnings.push(`Chapter "${ch.id}" chapter_test.pass_score must be 1-100`);
  }
  return warnings;
}

function processCourse(filePath: string): boolean {
  console.log(`\nParsing: ${filePath}`);
  try {
    const { course } = parseCourseFile(filePath);
    console.log(summarize(course));
    const warnings = validateCourse(course);
    if (warnings.length > 0) {
      console.warn('\n⚠️  Warnings:');
      warnings.forEach((w) => console.warn(`  - ${w}`));
    } else {
      console.log('  ✅ No warnings');
    }

    // Emit site-consumable JSON next to course.md
    const outPath = path.join(path.dirname(filePath), 'course.json');
    const stripped = {
      meta:         course.meta,
      contributors: course.contributors,
      credits:      course.credits,
      chapters:     course.chapters.map((ch) => ({
        id:          ch.id,
        title:       ch.title,
        description: ch.description,
        lessonCount: ch.lessons.length,
        hasProject:  !!ch.project,
      })),
      certificate: {
        requires_all_chapter_tests: course.certificate.requires_all_chapter_tests,
        requires_final_project:     course.certificate.requires_final_project,
        min_overall_score:          course.certificate.min_overall_score,
        has_final_test:             !!course.certificate.final_test,
      },
      totalLessons: course.chapters.reduce((s, c) => s + c.lessons.length, 0),
      totalChapterTests: course.chapters.length,
      generatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(outPath, JSON.stringify(stripped, null, 2));
    console.log(`  📄 Wrote course.json`);
    return true;
  } catch (e) {
    console.error(`  ❌ Parse error: ${(e as Error).message}`);
    return false;
  }
}

async function main() {
  let files: string[];
  if (allMode) {
    files = findCourseMdFiles('engine/courses');
    console.log(`Found ${files.length} course.md files`);
  } else if (single) {
    files = [single];
  } else {
    const envPath = process.env['COURSE_PATH'];
    if (!envPath) {
      console.error('Usage: --path <file> | --all');
      process.exit(1);
    }
    files = [envPath];
  }

  if (files.length === 0) {
    console.log('No course.md files found');
    setOutput('course_count', 0);
    return;
  }

  let ok = 0;
  for (const f of files) {
    if (processCourse(f)) ok++;
  }

  console.log(`\n✓ Processed ${ok}/${files.length} courses successfully`);
  setOutput('course_count', files.length);
  setOutput('valid_count', ok);
  if (ok < files.length) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
