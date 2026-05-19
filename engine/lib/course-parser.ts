/**
 * course-parser.ts — Load, parse and validate a course.md file.
 *
 * The frontmatter YAML block is extracted, parsed with js-yaml, and
 * validated against the Course interface.  The markdown body below
 * the closing `---` is returned as `body` for documentation use.
 */

import * as fs   from 'fs';
import * as yaml from 'js-yaml';
import type { Course, Chapter, ChapterTest, Question } from '../types/course.ts';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function err(msg: string): never { throw new Error(`[course-parser] ${msg}`); }

function requireStr(obj: Record<string, unknown>, key: string, ctx: string): string {
  const v = obj[key];
  if (typeof v !== 'string' || !v.trim())
    err(`${ctx}: field "${key}" must be a non-empty string (got ${JSON.stringify(v)})`);
  return v.trim();
}

function requireNum(obj: Record<string, unknown>, key: string, ctx: string): number {
  const v = obj[key];
  if (typeof v !== 'number') err(`${ctx}: field "${key}" must be a number`);
  return v;
}

function requireArr<T>(obj: Record<string, unknown>, key: string, ctx: string): T[] {
  const v = obj[key];
  if (!Array.isArray(v)) err(`${ctx}: field "${key}" must be an array`);
  return v as T[];
}

// ─── Question parsing ─────────────────────────────────────────────────────────

function parseQuestion(raw: Record<string, unknown>, ctx: string): Question {
  const type = requireStr(raw, 'type', ctx);
  const id   = requireStr(raw, 'id', ctx);
  const pts  = requireNum(raw, 'points', ctx);
  const q    = requireStr(raw, 'question', ctx);

  switch (type) {
    case 'mcq': return {
      id, type: 'mcq', question: q,
      options: requireArr(raw, 'options', ctx),
      answer: requireStr(raw, 'answer', ctx),
      explanation: raw['explanation'] as string | undefined,
      points: pts,
    };
    case 'multi': return {
      id, type: 'multi', question: q,
      options: requireArr(raw, 'options', ctx),
      answer: requireArr(raw, 'answer', ctx),
      explanation: raw['explanation'] as string | undefined,
      points: pts,
    };
    case 'true-false': return {
      id, type: 'true-false', question: q,
      answer: Boolean(raw['answer']),
      explanation: raw['explanation'] as string | undefined,
      points: pts,
    };
    case 'short': {
      const kws = requireArr<string>(raw, 'keywords', ctx);
      const min  = typeof raw['min_keywords'] === 'number'
        ? raw['min_keywords']
        : kws.length;
      return {
        id, type: 'short', question: q, keywords: kws, min_keywords: min,
        sample_answer: raw['sample_answer'] as string | undefined,
        points: pts,
      };
    }
    case 'code': return {
      id, type: 'code', question: q,
      language: requireStr(raw, 'language', ctx),
      starter_code: raw['starter_code'] as string | undefined,
      test_cases: requireArr(raw, 'test_cases', ctx),
      points: pts,
    };
    default:
      err(`${ctx}: unknown question type "${type}"`);
  }
}

function parseChapterTest(raw: Record<string, unknown>, ctx: string): ChapterTest {
  const questions = requireArr<Record<string, unknown>>(raw, 'questions', ctx)
    .map((q, i) => parseQuestion(q, `${ctx}.questions[${i}]`));
  return {
    id:                  requireStr(raw, 'id', ctx),
    title:               requireStr(raw, 'title', ctx),
    pass_score:          requireNum(raw, 'pass_score', ctx),
    max_attempts:        requireNum(raw, 'max_attempts', ctx),
    time_limit_minutes:  raw['time_limit_minutes'] as number | undefined,
    questions,
  };
}

function parseChapter(raw: Record<string, unknown>, idx: number): Chapter {
  const ctx = `chapters[${idx}]`;
  const lessons = requireArr<Record<string, unknown>>(raw, 'lessons', ctx).map((l, i) => {
    const lCtx = `${ctx}.lessons[${i}]`;
    const lesson: Chapter['lessons'][0] = {
      id:               requireStr(l, 'id', lCtx),
      title:            requireStr(l, 'title', lCtx),
      type:             requireStr(l, 'type', lCtx) as 'video' | 'reading' | 'exercise' | 'lab',
      duration_minutes: l['duration_minutes'] as number | undefined,
      url:              l['url'] as string | undefined,
      description:      l['description'] as string | undefined,
    };
    if (l['quiz']) {
      const qr = l['quiz'] as Record<string, unknown>;
      const qs  = requireArr<Record<string, unknown>>(qr, 'questions', lCtx + '.quiz')
        .map((q, qi) => parseQuestion(q, `${lCtx}.quiz.questions[${qi}]`));
      lesson.quiz = {
        id:                 requireStr(qr, 'id', lCtx + '.quiz'),
        title:              requireStr(qr, 'title', lCtx + '.quiz'),
        pass_score:         requireNum(qr, 'pass_score', lCtx + '.quiz'),
        max_attempts:       requireNum(qr, 'max_attempts', lCtx + '.quiz'),
        time_limit_minutes: qr['time_limit_minutes'] as number | undefined,
        questions: qs,
      };
    }
    return lesson;
  });

  return {
    id:          requireStr(raw, 'id', ctx),
    title:       requireStr(raw, 'title', ctx),
    description: raw['description'] as string | undefined,
    lessons,
    chapter_test: parseChapterTest(
      raw['chapter_test'] as Record<string, unknown>,
      ctx + '.chapter_test',
    ),
    project: raw['project']
      ? (() => {
          const p   = raw['project'] as Record<string, unknown>;
          const pCtx = ctx + '.project';
          return {
            id:           requireStr(p, 'id', pCtx),
            title:        requireStr(p, 'title', pCtx),
            description:  requireStr(p, 'description', pCtx),
            deliverables: requireArr<string>(p, 'deliverables', pCtx),
            test_cases:   p['test_cases'] as Chapter['project'] extends object ? Chapter['project']['test_cases'] : undefined,
            manual_review: Boolean(p['manual_review'] ?? !p['test_cases']),
            grading_rubric: p['grading_rubric'] as Chapter['project'] extends object ? Chapter['project']['grading_rubric'] : undefined,
            pass_score:   requireNum(p, 'pass_score', pCtx),
            points:       requireNum(p, 'points', pCtx),
          };
        })()
      : undefined,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface ParseResult {
  course: Course;
  body: string;    // markdown below the frontmatter
  filePath: string;
}

/**
 * Parse a course.md file that starts with a YAML frontmatter block.
 *
 * The file format is:
 *   ---
 *   <YAML>
 *   ---
 *   # Markdown course description ...
 */
export function parseCourseFile(filePath: string): ParseResult {
  const raw = fs.readFileSync(filePath, 'utf-8');

  // Split frontmatter from body
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) err(`"${filePath}" must start with a YAML frontmatter block (---)`);

  const [, yamlBlock, body] = match!;
  const doc = yaml.load(yamlBlock!) as Record<string, unknown>;
  if (!doc || typeof doc !== 'object') err(`"${filePath}": frontmatter is not a YAML object`);

  // meta
  const rawMeta = doc['meta'] as Record<string, unknown>;
  if (!rawMeta) err('"meta" section is required');
  const meta = {
    slug:             requireStr(rawMeta, 'slug', 'meta'),
    title:            requireStr(rawMeta, 'title', 'meta'),
    version:          requireStr(rawMeta, 'version', 'meta'),
    description:      requireStr(rawMeta, 'description', 'meta'),
    track:            requireStr(rawMeta, 'track', 'meta'),
    difficulty:       requireStr(rawMeta, 'difficulty', 'meta') as Course['meta']['difficulty'],
    tags:             (rawMeta['tags'] as string[] | undefined) ?? [],
    prerequisites:    (rawMeta['prerequisites'] as string[] | undefined) ?? [],
    estimated_hours:  typeof rawMeta['estimated_hours'] === 'number' ? rawMeta['estimated_hours'] : 0,
    thumbnail:        rawMeta['thumbnail'] as string | undefined,
    repo:             rawMeta['repo'] as string | undefined,
    license:          (rawMeta['license'] as string | undefined) ?? 'CC BY-SA 4.0',
  };

  // contributors
  const contributors = ((doc['contributors'] as Record<string, unknown>[] | undefined) ?? []).map((c) => ({
    name:   requireStr(c, 'name', 'contributor'),
    github: requireStr(c, 'github', 'contributor'),
    role:   requireStr(c, 'role', 'contributor'),
    email:  c['email'] as string | undefined,
  }));

  // credits
  const credits = ((doc['credits'] as Record<string, unknown>[] | undefined) ?? []).map((c) => ({
    title:   requireStr(c, 'title', 'credit'),
    url:     c['url'] as string | undefined,
    author:  c['author'] as string | undefined,
    license: c['license'] as string | undefined,
    type:    (c['type'] as string | undefined) ?? 'other',
  })) as Course['credits'];

  // chapters
  const rawChapters = requireArr<Record<string, unknown>>(doc, 'chapters', 'root');
  const chapters = rawChapters.map((ch, i) => parseChapter(ch, i));

  // certificate
  const rawCert = doc['certificate'] as Record<string, unknown>;
  if (!rawCert) err('"certificate" section is required');
  const certificate: Course['certificate'] = {
    requires_all_chapter_tests: Boolean(rawCert['requires_all_chapter_tests'] ?? true),
    requires_final_project:     Boolean(rawCert['requires_final_project'] ?? false),
    min_overall_score:          requireNum(rawCert, 'min_overall_score', 'certificate'),
    final_test: rawCert['final_test']
      ? parseChapterTest(rawCert['final_test'] as Record<string, unknown>, 'certificate.final_test')
      : undefined,
    template: rawCert['template'] as string | undefined,
  };

  // automation (optional)
  const automation = doc['automation']
    ? (doc['automation'] as Course['automation'])
    : undefined;

  // changelog (optional)
  const changelog = doc['changelog']
    ? (doc['changelog'] as Course['changelog'])
    : undefined;

  const course: Course = { meta, contributors, credits, chapters, certificate, automation, changelog };
  return { course, body: body ?? '', filePath };
}

/**
 * Find all course.md files under a directory.
 */
export function findCourseMdFiles(dir: string): string[] {
  const results: string[] = [];
  function walk(d: string) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = `${d}/${entry.name}`;
      if (entry.isDirectory()) walk(full);
      else if (entry.name === 'course.md') results.push(full);
    }
  }
  walk(dir);
  return results;
}
