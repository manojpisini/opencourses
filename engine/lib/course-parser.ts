/**
 * course-parser.ts — Load, parse, and validate a course.yaml file.
 *
 * course.yaml is pure YAML — no Markdown frontmatter splitting.
 * Answers are NOT in course.yaml; they live in the private solutions.yaml.
 *
 * Usage:
 *   import { parseCourseFile, findCourseYamlFiles } from './course-parser.ts';
 *   const course = parseCourseFile('engine/courses/javascript-fundamentals/course.yaml');
 */

import * as fs   from 'fs';
import * as yaml from 'js-yaml';
import type {
  Course,
  CourseMetadata,
  CourseIdentity,
  CourseClassification,
  CourseEffort,
  CoursePeople,
  CourseCredit,
  CoursePrerequisites,
  CourseOutcomes,
  Curriculum,
  Chapter,
  Section,
  Subsection,
  Lesson,
  LessonContent,
  ChapterTest,
  TestSection,
  CourseQuestion,
  ChapterAssignment,
  FinalTest,
  FinalAssignment,
  CourseCertificate,
  CourseAssets,
  CourseTriggers,
  CourseDiscussion,
  ChangelogEntry,
} from '../types/course.ts';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function err(msg: string): never { throw new Error(`[course-parser] ${msg}`); }

function r<T = unknown>(obj: Record<string, unknown>, key: string, ctx: string): T {
  if (obj[key] === undefined || obj[key] === null)
    err(`${ctx}: required field "${key}" is missing`);
  return obj[key] as T;
}

function str(obj: Record<string, unknown>, key: string, ctx: string): string {
  const v = r<unknown>(obj, key, ctx);
  if (typeof v !== 'string' || !v.trim())
    err(`${ctx}.${key} must be a non-empty string`);
  return (v as string).trim();
}

function num(obj: Record<string, unknown>, key: string, ctx: string): number {
  const v = r<unknown>(obj, key, ctx);
  if (typeof v !== 'number') err(`${ctx}.${key} must be a number`);
  return v as number;
}

function arr<T = unknown>(obj: Record<string, unknown>, key: string, ctx: string): T[] {
  const v = r<unknown>(obj, key, ctx);
  if (!Array.isArray(v)) err(`${ctx}.${key} must be an array`);
  return v as T[];
}

function optStr(obj: Record<string, unknown>, key: string): string | undefined {
  const v = obj[key];
  return typeof v === 'string' ? v : undefined;
}

function optNum(obj: Record<string, unknown>, key: string): number | undefined {
  const v = obj[key];
  return typeof v === 'number' ? v : undefined;
}

function optBool(obj: Record<string, unknown>, key: string): boolean | undefined {
  const v = obj[key];
  return typeof v === 'boolean' ? v : undefined;
}

function optArr<T = unknown>(obj: Record<string, unknown>, key: string): T[] | undefined {
  const v = obj[key];
  return Array.isArray(v) ? (v as T[]) : undefined;
}

function asObj(v: unknown, ctx: string): Record<string, unknown> {
  if (!v || typeof v !== 'object' || Array.isArray(v))
    err(`${ctx} must be a YAML mapping`);
  return v as Record<string, unknown>;
}

// ─── Section parsers ──────────────────────────────────────────────────────────

function parseMetadata(raw: Record<string, unknown>): CourseMetadata {
  const ctx = 'metadata';
  const ro = asObj(raw[ctx], ctx);
  return {
    id:               str(ro, 'id', ctx),
    version:          str(ro, 'version', ctx),
    schema_version:   str(ro, 'schema_version', ctx),
    status:           str(ro, 'status', ctx) as CourseMetadata['status'],
    visibility:       str(ro, 'visibility', ctx) as CourseMetadata['visibility'],
    created_at:       str(ro, 'created_at', ctx),
    updated_at:       str(ro, 'updated_at', ctx),
    published_at:     (ro['published_at'] as string | null) ?? null,
    language:         str(ro, 'language', ctx),
    locale:           optStr(ro, 'locale'),
    slug_aliases:     optArr<string>(ro, 'slug_aliases'),
    solutions_file:   str(ro, 'solutions_file', ctx),
  };
}

function parseIdentity(raw: Record<string, unknown>): CourseIdentity {
  const ctx = 'identity';
  const ro  = asObj(raw[ctx], ctx);
  const desc = asObj(ro['description'] as Record<string, unknown> ?? {}, `${ctx}.description`);
  const cover = asObj(ro['cover'] as Record<string, unknown> ?? {}, `${ctx}.cover`);
  return {
    title:   str(ro, 'title', ctx),
    tagline: str(ro, 'tagline', ctx),
    description: {
      short: str(desc, 'short', `${ctx}.description`),
      full:  str(desc, 'full',  `${ctx}.description`),
    },
    cover: {
      thumbnail:       str(cover, 'thumbnail',       `${ctx}.cover`),
      banner:          str(cover, 'banner',          `${ctx}.cover`),
      og_image:        str(cover, 'og_image',        `${ctx}.cover`),
      color_primary:   str(cover, 'color_primary',   `${ctx}.cover`),
      color_secondary: str(cover, 'color_secondary', `${ctx}.cover`),
    },
  };
}

function parseClassification(raw: Record<string, unknown>): CourseClassification {
  const ctx = 'classification';
  const ro  = asObj(raw[ctx], ctx);
  return {
    category:        str(ro, 'category', ctx),
    subcategory:     str(ro, 'subcategory', ctx),
    tags:            arr<string>(ro, 'tags', ctx),
    topics:          optArr<string>(ro, 'topics') ?? [],
    level:           str(ro, 'level', ctx) as CourseClassification['level'],
    target_audience: optArr<string>(ro, 'target_audience') ?? [],
    skills_gained:   optArr<string>(ro, 'skills_gained') ?? [],
  };
}

function parseEffort(raw: Record<string, unknown>): CourseEffort {
  const ctx = 'effort';
  const ro  = asObj(raw[ctx], ctx);
  return {
    video_hours:              num(ro, 'video_hours', ctx),
    reading_hours:            num(ro, 'reading_hours', ctx),
    exercise_hours:           num(ro, 'exercise_hours', ctx),
    total_hours:              num(ro, 'total_hours', ctx),
    pace:                     str(ro, 'pace', ctx) as CourseEffort['pace'],
    weekly_commitment_hours:  num(ro, 'weekly_commitment_hours', ctx),
    completion_weeks:         num(ro, 'completion_weeks', ctx),
  };
}

function parsePeople(raw: Record<string, unknown>): CoursePeople {
  const ctx = 'people';
  const ro  = asObj(raw[ctx], ctx);
  const cur = asObj(ro['curator'] as Record<string, unknown>, `${ctx}.curator`);
  return {
    curator: {
      name:   str(cur, 'name', `${ctx}.curator`),
      github: str(cur, 'github', `${ctx}.curator`),
      role:   str(cur, 'role', `${ctx}.curator`),
      bio:    optStr(cur, 'bio'),
      avatar: cur['avatar'] as string | null | undefined,
    },
    contributors: ((ro['contributors'] as Record<string, unknown>[] | undefined) ?? []).map((c) => ({
      name:          str(c, 'name', `${ctx}.contributor`),
      github:        str(c, 'github', `${ctx}.contributor`),
      role:          str(c, 'role', `${ctx}.contributor`),
      contributions: optArr<string>(c, 'contributions'),
    })),
    reviewers: ((ro['reviewers'] as Record<string, unknown>[] | undefined) ?? []).map((c) => ({
      name:      str(c, 'name', `${ctx}.reviewer`),
      github:    str(c, 'github', `${ctx}.reviewer`),
      expertise: optStr(c, 'expertise'),
    })),
  };
}

function parseCredits(raw: Record<string, unknown>): CourseCredit[] {
  const list = raw['credits'] as Record<string, unknown>[] | undefined;
  if (!list) return [];
  return list.map((c, i) => ({
    id:           str(c, 'id', `credits[${i}]`),
    type:         str(c, 'type', `credits[${i}]`) as CourseCredit['type'],
    title:        str(c, 'title', `credits[${i}]`),
    author:       str(c, 'author', `credits[${i}]`),
    organization: c['organization'] as string | null | undefined,
    url:          str(c, 'url', `credits[${i}]`),
    license:      str(c, 'license', `credits[${i}]`),
    license_url:  c['license_url'] as string | null | undefined,
    accessed_at:  str(c, 'accessed_at', `credits[${i}]`),
    notes:        optStr(c, 'notes'),
    archived_url: c['archived_url'] as string | null | undefined,
  }));
}

function parsePrerequisites(raw: Record<string, unknown>): CoursePrerequisites | undefined {
  const ro = raw['prerequisites'] as Record<string, unknown> | undefined;
  if (!ro) return undefined;
  return {
    knowledge: optArr<string>(ro, 'knowledge'),
    courses:   optArr<string>(ro, 'courses') ?? [],
    tools: ((ro['tools'] as Record<string, unknown>[] | undefined) ?? []).map((t) => ({
      name:             str(t, 'name', 'prerequisites.tool'),
      url:              str(t, 'url', 'prerequisites.tool'),
      required:         Boolean(t['required']),
      install_guide:    optStr(t, 'install_guide'),
      version_minimum:  t['version_minimum'] as string | null | undefined,
    })),
    accounts: ((ro['accounts'] as Record<string, unknown>[] | undefined) ?? []).map((a) => ({
      service:  str(a, 'service', 'prerequisites.account'),
      url:      str(a, 'url', 'prerequisites.account'),
      required: Boolean(a['required']),
      reason:   optStr(a, 'reason'),
    })),
  };
}

function parseOutcomes(raw: Record<string, unknown>): CourseOutcomes | undefined {
  const ro = raw['outcomes'] as Record<string, unknown> | undefined;
  if (!ro) return undefined;
  return {
    by_completion: optArr<string>(ro, 'by_completion') ?? [],
    by_chapter:    ro['by_chapter'] as Record<string, string[]> | undefined,
  };
}

// ── Lesson / content parsing ────────────────────────────────────────────────

function parseLessonContent(raw: Record<string, unknown>): LessonContent {
  return {
    video:       raw['video']     ? raw['video']     as LessonContent['video']     : undefined,
    reading:     raw['reading']   ? raw['reading']   as LessonContent['reading']   : undefined,
    text:        raw['text']      ? raw['text']      as LessonContent['text']      : undefined,
    code_blocks: raw['code_blocks'] ? raw['code_blocks'] as LessonContent['code_blocks'] : undefined,
    exercise:    raw['exercise']  ? raw['exercise']  as LessonContent['exercise']  : undefined,
    supplemental: raw['supplemental'] ? raw['supplemental'] as LessonContent['supplemental'] : undefined,
    hints:       raw['hints']     ? raw['hints']     as LessonContent['hints']     : undefined,
    links:       raw['links']     ? raw['links']     as LessonContent['links']     : undefined,
    files:       raw['files']     ? raw['files']     as LessonContent['files']     : undefined,
  };
}

function parseLesson(raw: Record<string, unknown>, ctx: string): Lesson {
  return {
    id:               str(raw, 'id', ctx),
    title:            str(raw, 'title', ctx),
    type:             str(raw, 'type', ctx) as Lesson['type'],
    duration_minutes: optNum(raw, 'duration_minutes'),
    free_preview:     optBool(raw, 'free_preview'),
    description:      optStr(raw, 'description'),
    content:          raw['content'] ? parseLessonContent(asObj(raw['content'] as Record<string, unknown>, `${ctx}.content`)) : undefined,
    tags:             optArr<string>(raw, 'tags'),
  };
}

function parseSubsection(raw: Record<string, unknown>, ctx: string): Subsection {
  const lessons = arr<Record<string, unknown>>(raw, 'lessons', ctx)
    .map((l, i) => parseLesson(l, `${ctx}.lessons[${i}]`));
  return {
    id:          str(raw, 'id', ctx),
    title:       str(raw, 'title', ctx),
    description: optStr(raw, 'description'),
    lessons,
  };
}

function parseSection(raw: Record<string, unknown>, ctx: string): Section {
  const subsections = raw['subsections']
    ? (raw['subsections'] as Record<string, unknown>[]).map((s, i) =>
        parseSubsection(s, `${ctx}.subsections[${i}]`))
    : undefined;
  const lessons = raw['lessons']
    ? (raw['lessons'] as Record<string, unknown>[]).map((l, i) =>
        parseLesson(l, `${ctx}.lessons[${i}]`))
    : undefined;
  return {
    id:           str(raw, 'id', ctx),
    title:        str(raw, 'title', ctx),
    description:  optStr(raw, 'description'),
    subsections,
    lessons,
  };
}

function parseChapter(raw: Record<string, unknown>, idx: number): Chapter {
  const ctx = `curriculum.chapters[${idx}]`;
  const sections = raw['sections']
    ? (raw['sections'] as Record<string, unknown>[]).map((s, i) =>
        parseSection(s, `${ctx}.sections[${i}]`))
    : undefined;
  const lessons = raw['lessons']
    ? (raw['lessons'] as Record<string, unknown>[]).map((l, i) =>
        parseLesson(l, `${ctx}.lessons[${i}]`))
    : undefined;
  return {
    id:                    str(raw, 'id', ctx),
    title:                 str(raw, 'title', ctx),
    description:           optStr(raw, 'description'),
    duration_minutes:      optNum(raw, 'duration_minutes'),
    free_preview:          optBool(raw, 'free_preview'),
    outcomes:              optArr<string>(raw, 'outcomes'),
    sections,
    lessons,
    chapter_test_id:       str(raw, 'chapter_test_id', ctx),
    chapter_assignment_id: optStr(raw, 'chapter_assignment_id'),
  };
}

function parseCurriculum(raw: Record<string, unknown>): Curriculum {
  const ro = asObj(raw['curriculum'], 'curriculum');
  const chapters = arr<Record<string, unknown>>(ro, 'chapters', 'curriculum')
    .map((ch, i) => parseChapter(ch, i));
  return { chapters };
}

// ── Assessment parsing ──────────────────────────────────────────────────────

function parseQuestion(raw: Record<string, unknown>, ctx: string): CourseQuestion {
  const q: CourseQuestion = {
    id:         str(raw, 'id', ctx),
    type:       str(raw, 'type', ctx) as CourseQuestion['type'],
    points:     num(raw, 'points', ctx),
    difficulty: optStr(raw, 'difficulty') as CourseQuestion['difficulty'],
    topic:      optStr(raw, 'topic'),
    chapter:    optStr(raw, 'chapter'),
    question:   str(raw, 'question', ctx),
  };
  if (raw['options'])    q.options  = raw['options'] as string[];
  if (raw['code'])       q.code     = raw['code'] as CourseQuestion['code'];
  if (raw['grading'])    q.grading  = raw['grading'] as CourseQuestion['grading'];
  if (raw['starter'])    q.starter  = raw['starter'] as string;
  if (raw['keywords'])   q.keywords = raw['keywords'] as string[];
  if (raw['language'])   q.language = raw['language'] as string;
  return q;
}

function parseTestSection(raw: Record<string, unknown>, ctx: string): TestSection {
  const questions = arr<Record<string, unknown>>(raw, 'questions', ctx)
    .map((q, i) => parseQuestion(q, `${ctx}.questions[${i}]`));
  return {
    id:        str(raw, 'id', ctx),
    title:     str(raw, 'title', ctx),
    weight:    num(raw, 'weight', ctx),
    questions,
  };
}

function parseChapterTests(raw: Record<string, unknown>): ChapterTest[] {
  const list = raw['chapter_tests'] as Record<string, unknown>[] | undefined;
  if (!list) return [];
  return list.map((t, i) => {
    const ctx = `chapter_tests[${i}]`;
    const sections = arr<Record<string, unknown>>(t, 'sections', ctx)
      .map((s, si) => parseTestSection(s, `${ctx}.sections[${si}]`));
    return {
      id:                  str(t, 'id', ctx),
      title:               str(t, 'title', ctx),
      attached_to:         str(t, 'attached_to', ctx),
      gates_next_chapter:  Boolean(t['gates_next_chapter'] ?? true),
      passing_score:       num(t, 'passing_score', ctx),
      max_attempts:        num(t, 'max_attempts', ctx),
      time_limit_minutes:  optNum(t, 'time_limit_minutes'),
      randomize_questions: optBool(t, 'randomize_questions'),
      randomize_options:   optBool(t, 'randomize_options'),
      show_answers_after:  optStr(t, 'show_answers_after') as ChapterTest['show_answers_after'],
      sections,
    };
  });
}

function parseChapterAssignments(raw: Record<string, unknown>): ChapterAssignment[] {
  const list = raw['chapter_assignments'] as Record<string, unknown>[] | undefined;
  if (!list) return [];
  return list.map((a, i) => {
    const ctx = `chapter_assignments[${i}]`;
    return {
      id:                       str(a, 'id', ctx),
      title:                    str(a, 'title', ctx),
      attached_to:              str(a, 'attached_to', ctx),
      required_for_progress:    Boolean(a['required_for_progress'] ?? false),
      submission_type:          str(a, 'submission_type', ctx) as ChapterAssignment['submission_type'],
      due_after_enrollment_days: optNum(a, 'due_after_enrollment_days'),
      max_resubmissions:        optNum(a, 'max_resubmissions'),
      content:                  a['content'] as ChapterAssignment['content'],
      rubric:                   a['rubric'] as ChapterAssignment['rubric'],
      total_points:             optNum(a, 'total_points'),
      passing_score:            optNum(a, 'passing_score'),
      review:                   a['review'] as ChapterAssignment['review'],
    };
  });
}

function parseFinalTest(raw: Record<string, unknown>): FinalTest | undefined {
  const ft = raw['final_test'] as Record<string, unknown> | undefined;
  if (!ft) return undefined;
  const ctx = 'final_test';
  const sections = arr<Record<string, unknown>>(ft, 'sections', ctx)
    .map((s, i) => parseTestSection(s, `${ctx}.sections[${i}]`));
  return {
    id:                    str(ft, 'id', ctx),
    title:                 str(ft, 'title', ctx),
    attached_to:           'final',
    unlocks:               optStr(ft, 'unlocks'),
    passing_score:         num(ft, 'passing_score', ctx),
    max_attempts:          num(ft, 'max_attempts', ctx),
    time_limit_minutes:    optNum(ft, 'time_limit_minutes'),
    randomize_questions:   optBool(ft, 'randomize_questions'),
    randomize_options:     optBool(ft, 'randomize_options'),
    show_answers_after:    optStr(ft, 'show_answers_after') as FinalTest['show_answers_after'],
    required_for_certificate: Boolean(ft['required_for_certificate'] ?? true),
    coverage:              optArr<string>(ft, 'coverage'),
    sections,
  };
}

function parseFinalAssignment(raw: Record<string, unknown>): FinalAssignment | undefined {
  const fa = raw['final_assignment'] as Record<string, unknown> | undefined;
  if (!fa) return undefined;
  const ctx = 'final_assignment';
  return {
    id:                      str(fa, 'id', ctx),
    title:                   str(fa, 'title', ctx),
    attached_to:             'final',
    unlocked_by:             optStr(fa, 'unlocked_by'),
    required_for_certificate: Boolean(fa['required_for_certificate'] ?? true),
    submission_type:         str(fa, 'submission_type', ctx) as FinalAssignment['submission_type'],
    due_after_unlock_days:   optNum(fa, 'due_after_unlock_days'),
    max_resubmissions:       optNum(fa, 'max_resubmissions'),
    content:                 fa['content'] as FinalAssignment['content'],
    milestones:              fa['milestones'] as FinalAssignment['milestones'],
    rubric:                  fa['rubric'] as FinalAssignment['rubric'],
    total_points:            optNum(fa, 'total_points'),
    passing_score:           optNum(fa, 'passing_score'),
    review:                  fa['review'] as FinalAssignment['review'],
  };
}

function parseCertificate(raw: Record<string, unknown>): CourseCertificate {
  const ctx = 'certificate';
  const ro  = asObj(raw[ctx] ?? {}, ctx);
  return {
    enabled:         Boolean(ro['enabled'] ?? true),
    title:           str(ro, 'title', ctx),
    subtitle:        optStr(ro, 'subtitle'),
    requirements:    (ro['requirements'] as CourseCertificate['requirements']) ?? [],
    template:        optStr(ro, 'template'),
    custom_template: ro['custom_template'] as string | null | undefined,
    badge:           ro['badge'] as CourseCertificate['badge'],
  };
}

function parseChangelog(raw: Record<string, unknown>): ChangelogEntry[] {
  const list = raw['changelog'] as Record<string, unknown>[] | undefined;
  if (!list) return [];
  return list.map((e) => ({
    version: e['version'] as string,
    date:    e['date'] as string,
    author:  optStr(e as Record<string, unknown>, 'author'),
    changes: e['changes'] as string[],
  }));
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Parse a course.yaml file (pure YAML, no frontmatter).
 */
export function parseCourseFile(filePath: string): Course {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const doc = yaml.load(raw) as Record<string, unknown>;
  if (!doc || typeof doc !== 'object' || Array.isArray(doc))
    err(`"${filePath}" must be a YAML mapping at the top level`);

  return {
    metadata:              parseMetadata(doc),
    identity:              parseIdentity(doc),
    classification:        parseClassification(doc),
    effort:                parseEffort(doc),
    people:                parsePeople(doc),
    credits:               parseCredits(doc),
    prerequisites:         parsePrerequisites(doc),
    outcomes:              parseOutcomes(doc),
    curriculum:            parseCurriculum(doc),
    chapter_tests:         parseChapterTests(doc),
    chapter_assignments:   parseChapterAssignments(doc),
    final_test:            parseFinalTest(doc),
    final_assignment:      parseFinalAssignment(doc),
    certificate:           parseCertificate(doc),
    assets:                doc['assets'] as CourseCertificate['badge'] | undefined as unknown as CourseAssets,
    triggers:              doc['triggers'] as CourseTriggers | undefined,
    discussion:            doc['discussion'] as CourseDiscussion | undefined,
    changelog:             parseChangelog(doc),
  };
}

/**
 * Find all course.yaml files under a directory.
 */
export function findCourseYamlFiles(dir: string): string[] {
  const results: string[] = [];
  function walk(d: string) {
    if (!fs.existsSync(d)) return;
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = `${d}/${entry.name}`;
      if (entry.isDirectory()) walk(full);
      else if (entry.name === 'course.yaml') results.push(full);
    }
  }
  walk(dir);
  return results;
}

/**
 * Count total lessons across all chapter sections/subsections.
 */
export function countLessons(course: Course): number {
  let total = 0;
  for (const ch of course.curriculum.chapters) {
    if (ch.lessons) total += ch.lessons.length;
    for (const sec of ch.sections ?? []) {
      if (sec.lessons) total += sec.lessons.length;
      for (const sub of sec.subsections ?? []) {
        total += sub.lessons.length;
      }
    }
  }
  return total;
}

/**
 * Count total questions across all chapter tests, final test.
 */
export function countQuestions(course: Course): number {
  let total = 0;
  for (const ct of course.chapter_tests) {
    for (const sec of ct.sections) total += sec.questions.length;
  }
  if (course.final_test) {
    for (const sec of course.final_test.sections) total += sec.questions.length;
  }
  return total;
}
