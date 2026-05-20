#!/usr/bin/env bun
/**
 * parse-course.ts — Validate a course.yaml and emit site-ready course.json.
 *
 * Usage:
 *   bun run scripts/parse-course.ts --path engine/courses/javascript-fundamentals/course.yaml
 *   bun run scripts/parse-course.ts --all        # scan all courses
 *
 * Triggered by: .github/workflows/course-publish.yml (validate step)
 * Also usable locally for authoring feedback.
 */

import * as fs   from 'fs';
import * as path from 'path';
import { parseCourseFile, findCourseYamlFiles, countLessons, countQuestions } from '../lib/course-parser.ts';
import { setOutput } from '../lib/github.ts';
import type { Course, CourseJson } from '../types/course.ts';

const args      = process.argv.slice(2);
const allMode   = args.includes('--all');
const pathFlag  = args.indexOf('--path');
const single    = pathFlag !== -1 ? args[pathFlag + 1] : undefined;

function summarize(course: Course): string {
  const totalLessons   = countLessons(course);
  const totalQuestions = countQuestions(course);

  return [
    `📚 **${course.identity.title}** \`v${course.metadata.version}\``,
    `   ID: ${course.metadata.id} · Level: ${course.classification.level} · Status: ${course.metadata.status}`,
    `   Chapters: ${course.curriculum.chapters.length} · Lessons: ${totalLessons} · Questions: ${totalQuestions}`,
    `   Chapter Tests: ${course.chapter_tests.length} · Assignments: ${course.chapter_assignments?.length ?? 0}`,
    `   Final Test: ${course.final_test ? 'yes' : 'no'} · Final Assignment: ${course.final_assignment ? 'yes' : 'no'}`,
    `   Curator: @${course.people.curator.github} · Contributors: ${course.people.contributors?.length ?? 0}`,
    `   Tags: ${course.classification.tags.join(', ')}`,
  ].join('\n');
}

function validateCourse(course: Course): string[] {
  const warnings: string[] = [];

  if (course.effort.total_hours <= 0)
    warnings.push('effort.total_hours should be > 0');

  if (!course.people.curator.github)
    warnings.push('people.curator.github is required');

  for (const ch of course.curriculum.chapters) {
    const test = course.chapter_tests.find((t) => t.id === ch.chapter_test_id);
    if (!test)
      warnings.push(`Chapter "${ch.id}" references chapter_test_id "${ch.chapter_test_id}" but no matching test found`);
    else if (test.sections.flatMap((s) => s.questions).length === 0)
      warnings.push(`Chapter test "${ch.chapter_test_id}" has no questions`);
  }

  if (!course.certificate.enabled && !course.final_test)
    warnings.push('Certificate is disabled and no final test is defined — students have no completion target');

  const VALID_LEVELS = ['beginner', 'intermediate', 'advanced', 'mixed'];
  if (!VALID_LEVELS.includes(course.classification.level))
    warnings.push(`classification.level "${course.classification.level}" must be one of: ${VALID_LEVELS.join(', ')}`);

  return warnings;
}

/** Build the stripped public course.json from a parsed Course */
function buildCourseJson(course: Course): CourseJson {
  const totalLessons = countLessons(course);

  const chapters = course.curriculum.chapters.map((ch) => {
    let lessonCount = ch.lessons?.length ?? 0;
    for (const sec of ch.sections ?? []) {
      lessonCount += sec.lessons?.length ?? 0;
      for (const sub of sec.subsections ?? []) {
        lessonCount += sub.lessons.length;
      }
    }
    return {
      id:           ch.id,
      title:        ch.title,
      description:  ch.description,
      lessonCount,
      hasAssignment: !!ch.chapter_assignment_id,
    };
  });

  return {
    id:              course.metadata.id,
    title:           course.identity.title,
    tagline:         course.identity.tagline,
    description:     course.identity.description.short,
    track:           course.classification.category,
    level:           course.classification.level,
    tags:            course.classification.tags,
    topics:          course.classification.topics,
    prerequisites:   course.prerequisites?.courses ?? [],
    total_hours:     course.effort.total_hours,
    thumbnail:       course.identity.cover.thumbnail,
    banner:          course.identity.cover.banner,
    color_primary:   course.identity.cover.color_primary,
    status:          course.metadata.status,
    version:         course.metadata.version,
    curator:         course.people.curator.github,
    chapters,
    totalLessons,
    totalChapterTests:   course.chapter_tests.length,
    hasFinaTest:         !!course.final_test,
    hasFinalAssignment:  !!course.final_assignment,
    certificate: {
      enabled:      course.certificate.enabled,
      requirements: course.certificate.requirements,
    },
    changelog: course.changelog?.map((e) => ({
      version: e.version,
      date:    e.date,
      author:  e.author,
      changes: e.changes,
    })),
    generatedAt: new Date().toISOString(),
  };
}

function processCourse(filePath: string): boolean {
  console.log(`\nParsing: ${filePath}`);
  try {
    const course = parseCourseFile(filePath);
    console.log(summarize(course));

    const warnings = validateCourse(course);
    if (warnings.length > 0) {
      console.warn('\n⚠️  Warnings:');
      warnings.forEach((w) => console.warn(`  - ${w}`));
    } else {
      console.log('  ✅ No warnings');
    }

    // Emit site-consumable JSON next to course.yaml
    const outPath = path.join(path.dirname(filePath), 'course.json');
    fs.writeFileSync(outPath, JSON.stringify(buildCourseJson(course), null, 2));
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
    files = findCourseYamlFiles('courses');
    console.log(`Found ${files.length} course.yaml files`);
  } else if (single) {
    files = [single];
  } else {
    const envPath = process.env['COURSE_PATH'];
    if (!envPath) {
      console.error('Usage: --path <file.yaml> | --all');
      process.exit(1);
    }
    files = [envPath];
  }

  if (files.length === 0) {
    console.log('No course.yaml files found');
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
