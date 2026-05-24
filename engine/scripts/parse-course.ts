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
import type {
  Course, CourseJson, CourseDetailJson,
  PlayerChapter, PlayerLesson, Lesson, ContentBlueprintFlowStage,
  CourseQuestion, ChapterTest, FinalTest, ChapterAssignment, FinalAssignment,
  PlayerQuestion, PlayerTest, PlayerAssignment,
} from '../types/course.ts';

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

  const REQUIRED_BLUEPRINT_FLOW: ContentBlueprintFlowStage[] = [
    'foundations',
    'environment-setup',
    'guided-fundamentals',
    'incremental-challenges',
    'production-engineering',
    'open-source-exploration',
    'capstone-project',
    'contribution-path',
  ];
  if (!course.content_blueprint) {
    warnings.push('content_blueprint section is missing — new courses should follow the OpenCourses content blueprint');
  } else {
    const flow = course.content_blueprint.flow ?? [];
    const missingFlow = REQUIRED_BLUEPRINT_FLOW.filter((stage) => !flow.includes(stage));
    const invalidFlow = flow.filter((stage) => !REQUIRED_BLUEPRINT_FLOW.includes(stage));
    if (missingFlow.length > 0)
      warnings.push(`content_blueprint.flow is missing recommended content stages: ${missingFlow.join(', ')}`);
    if (invalidFlow.length > 0)
      warnings.push(`content_blueprint.flow has unknown stages: ${invalidFlow.join(', ')}`);
    if ((course.content_blueprint.principles ?? []).length < 4)
      warnings.push('content_blueprint.principles should list at least four open-source-first content principles');
    if ((course.content_blueprint.resource_strategy?.repositories ?? []).length === 0)
      warnings.push('content_blueprint.resource_strategy.repositories should include at least one open-source repository');
    if ((course.content_blueprint.testing?.types ?? []).length === 0)
      warnings.push('content_blueprint.testing.types should list deterministic, edge-case, fuzz, property, benchmark, or stress testing plans');
    if (!course.content_blueprint.capstone)
      warnings.push('content_blueprint.capstone should describe the production-ready final project');
    if ((course.content_blueprint.contribution_path ?? []).length === 0)
      warnings.push('content_blueprint.contribution_path should explain how learners become contributors');
  }

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

// ─── Video embed URL derivation ───────────────────────────────────────────────

function deriveEmbedUrl(url: string, embedUrl?: string): string {
  if (embedUrl) return embedUrl;
  // YouTube standard: youtube.com/watch?v=ID
  const ytWatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (ytWatch) return `https://www.youtube-nocookie.com/embed/${ytWatch[1]}`;
  // YouTube embed already
  if (url.includes('youtube.com/embed/') || url.includes('youtube-nocookie.com/embed/')) return url;
  // Vimeo: vimeo.com/NUMERIC_ID
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  // Vimeo player already
  if (url.includes('player.vimeo.com/video/')) return url;
  // Fallback: return original
  return url;
}

// ─── Flatten lessons from a chapter (sections → subsections → lessons) ───────

function flattenLessons(ch: Course['curriculum']['chapters'][number]): Lesson[] {
  const out: Lesson[] = [];
  if (ch.lessons) out.push(...ch.lessons);
  for (const sec of ch.sections ?? []) {
    if (sec.lessons) out.push(...sec.lessons);
    for (const sub of sec.subsections ?? []) {
      out.push(...sub.lessons);
    }
  }
  return out;
}

// ─── Build a PlayerLesson from a raw Lesson ───────────────────────────────────

function toPlayerLesson(lesson: Lesson): PlayerLesson {
  const c = lesson.content;
  const pl: PlayerLesson = {
    id:               lesson.id,
    title:            lesson.title,
    type:             lesson.type,
    duration_minutes: lesson.duration_minutes ?? 0,
    free_preview:     lesson.free_preview ?? false,
    description:      lesson.description,
    tags:             lesson.tags,
  };

  if (c?.video) {
    pl.video = {
      embed_url:            deriveEmbedUrl(c.video.url, c.video.embed_url),
      url:                  c.video.url,
      source:               c.video.source,
      channel:              c.video.channel,
      subtitles_available:  c.video.subtitles_available,
      timestamps:           c.video.timestamps,
    };
  }
  if (c?.reading) {
    pl.reading = {
      url:                c.reading.url,
      source:             c.reading.source,
      estimated_minutes:  c.reading.estimated_minutes,
      sections_to_read:   c.reading.sections_to_read,
    };
  }
  if (c?.text?.body) {
    pl.text_md = c.text.body;
  }
  if (c?.code_blocks) {
    pl.code_blocks = c.code_blocks.map((cb) => ({
      id:              cb.id,
      title:           cb.title,
      language:        cb.language,
      snippet:         cb.snippet,
      explanation:     cb.explanation,
      expected_output: cb.expected_output,
      runnable:        cb.runnable,
    }));
  }
  if (c?.exercise) {
    pl.exercise = {
      starter_repo:    c.exercise.starter_repo,
      solution_repo:   c.exercise.solution_repo ?? undefined,
      entry_file:      c.exercise.entry_file,
      test_command:    c.exercise.test_command,
      submission_type: c.exercise.submission_type,
    };
  }
  if (c?.hints) {
    pl.hints = c.hints.map((h) => ({ level: h.level, text: h.text }));
  }
  if (c?.links)        pl.links        = c.links;
  if (c?.files)        pl.files        = c.files;
  if (c?.supplemental) pl.supplemental = c.supplemental;

  return pl;
}

function toPlayerQuestion(question: CourseQuestion): PlayerQuestion {
  return {
    id:         question.id,
    type:       question.type,
    points:     question.points,
    difficulty: question.difficulty,
    topic:      question.topic,
    question:   question.question,
    options:    question.options,
    code:       question.code,
    starter:    question.starter,
    language:   question.language,
  };
}

function toPlayerTest(test: ChapterTest | FinalTest): PlayerTest {
  return {
    id:                 test.id,
    title:              test.title,
    attached_to:        test.attached_to,
    passing_score:      test.passing_score,
    max_attempts:       test.max_attempts,
    time_limit_minutes: test.time_limit_minutes,
    question_count:     test.sections.flatMap((section) => section.questions).length,
    sections:           test.sections.map((section) => ({
      id:        section.id,
      title:     section.title,
      weight:    section.weight,
      questions: section.questions.map(toPlayerQuestion),
    })),
    gates_next_chapter: 'gates_next_chapter' in test ? test.gates_next_chapter : undefined,
    required_for_certificate: 'required_for_certificate' in test ? test.required_for_certificate : undefined,
  };
}

function toPlayerAssignment(assignment: ChapterAssignment | FinalAssignment): PlayerAssignment {
  return {
    id:                       assignment.id,
    title:                    assignment.title,
    attached_to:              assignment.attached_to,
    required_for_progress:    'required_for_progress' in assignment ? assignment.required_for_progress : undefined,
    required_for_certificate: 'required_for_certificate' in assignment ? assignment.required_for_certificate : undefined,
    submission_type:          assignment.submission_type,
    content:                  assignment.content,
    milestones:               'milestones' in assignment ? assignment.milestones : undefined,
    rubric:                   assignment.rubric,
    total_points:             assignment.total_points,
    passing_score:            assignment.passing_score,
    review:                   assignment.review,
  };
}

// ─── Build full CourseDetailJson ──────────────────────────────────────────────

function buildCourseDetailJson(course: Course): CourseDetailJson {
  const chapters: PlayerChapter[] = course.curriculum.chapters.map((ch) => {
    const rawLessons = flattenLessons(ch);
    const lessons    = rawLessons.map(toPlayerLesson);
    const testObj    = course.chapter_tests.find((t) => t.id === ch.chapter_test_id);

    const durationMins = lessons.reduce((s, l) => s + l.duration_minutes, 0);
    const questionCount = testObj
      ? testObj.sections.flatMap((s) => s.questions).length
      : 0;

    return {
      id:                    ch.id,
      title:                 ch.title,
      description:           ch.description,
      outcomes:              ch.outcomes,
      lessons,
      chapter_test_id:       ch.chapter_test_id,
      chapter_assignment_id: ch.chapter_assignment_id,
      lessonCount:           lessons.length,
      duration_minutes:      durationMins,
      hasAssignment:         !!ch.chapter_assignment_id,
      test_summary: {
        title:              testObj?.title ?? ch.chapter_test_id,
        passing_score:      testObj?.passing_score ?? 70,
        max_attempts:       testObj?.max_attempts ?? 3,
        time_limit_minutes: testObj?.time_limit_minutes,
        question_count:     questionCount,
        gates_next_chapter: testObj?.gates_next_chapter ?? false,
      },
    } satisfies PlayerChapter;
  });

  const totalLessons  = chapters.reduce((s, ch) => s + ch.lessonCount, 0);
  const totalDuration = chapters.reduce((s, ch) => s + ch.duration_minutes, 0);

  const chapterTests = course.chapter_tests.map(toPlayerTest);
  const chapterAssignments = (course.chapter_assignments ?? []).map(toPlayerAssignment);

  return {
    id:                  course.metadata.id,
    title:               course.identity.title,
    tagline:             course.identity.tagline,
    description_short:   course.identity.description.short,
    description_full_md: course.identity.description.full,
    cover: {
      thumbnail:       course.identity.cover.thumbnail,
      banner:          course.identity.cover.banner,
      color_primary:   course.identity.cover.color_primary,
      color_secondary: course.identity.cover.color_secondary,
    },
    level:        course.classification.level,
    track:        course.classification.category,
    tags:         course.classification.tags,
    topics:       course.classification.topics,
    skills_gained: course.classification.skills_gained,
    effort: {
      video_hours:              course.effort.video_hours,
      reading_hours:            course.effort.reading_hours,
      exercise_hours:           course.effort.exercise_hours,
      total_hours:              course.effort.total_hours,
      pace:                     course.effort.pace,
      weekly_commitment_hours:  course.effort.weekly_commitment_hours,
      completion_weeks:         course.effort.completion_weeks,
    },
    curator: {
      name:   course.people.curator.name,
      github: course.people.curator.github,
      role:   course.people.curator.role,
      bio:    course.people.curator.bio,
      avatar: course.people.curator.avatar ?? undefined,
    },
    prerequisites: {
      knowledge: course.prerequisites?.knowledge ?? [],
      courses:   course.prerequisites?.courses   ?? [],
      tools:     (course.prerequisites?.tools ?? []).map((t) => ({
        name:            t.name,
        url:             t.url,
        required:        t.required,
        version_minimum: t.version_minimum ?? undefined,
      })),
      accounts: (course.prerequisites?.accounts ?? []).map((a) => ({
        service:  a.service,
        url:      a.url,
        required: a.required,
        reason:   a.reason,
      })),
    },
    outcomes: {
      by_completion: course.outcomes?.by_completion ?? [],
      by_chapter:    course.outcomes?.by_chapter    ?? {},
    },
    chapters,
    chapter_tests: chapterTests,
    chapter_assignments: chapterAssignments,
    final_test: course.final_test ? toPlayerTest(course.final_test) : undefined,
    final_assignment: course.final_assignment ? toPlayerAssignment(course.final_assignment) : undefined,
    certificate: {
      enabled:      course.certificate.enabled,
      title:        course.certificate.title,
      subtitle:     course.certificate.subtitle,
      requirements: course.certificate.requirements,
    },
    discussion: {
      enabled:     course.discussion?.enabled ?? false,
      category:    course.discussion?.category,
      per_chapter: course.discussion?.per_chapter,
    },
    version:              course.metadata.version,
    status:               course.metadata.status,
    totalLessons,
    totalChapters:        chapters.length,
    totalDurationMinutes: totalDuration,
    generatedAt:          new Date().toISOString(),
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

    // Emit full player-ready detail JSON (all lesson content, video embeds, etc.)
    const detailPath = path.join(path.dirname(filePath), 'course-detail.json');
    fs.writeFileSync(detailPath, JSON.stringify(buildCourseDetailJson(course), null, 2));
    console.log(`  📄 Wrote course-detail.json`);
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
