/**
 * course.ts — TypeScript interfaces for the course.md YAML schema.
 * A single course.md is the sole source of truth for a course.
 */

// ─── Primitive helpers ────────────────────────────────────────────────────────

export type QuestionType = 'mcq' | 'multi' | 'true-false' | 'short' | 'code';
export type Difficulty    = 'beginner' | 'intermediate' | 'advanced';
export type LessonType    = 'video' | 'reading' | 'exercise' | 'lab';
export type ChangeType    = 'added' | 'changed' | 'fixed' | 'removed';

// ─── Quiz questions ───────────────────────────────────────────────────────────

export interface MCQQuestion {
  id: string;
  type: 'mcq';
  question: string;
  options: string[];          // e.g. ["A. foo", "B. bar", "C. baz", "D. qux"]
  answer: string;             // "A" | "B" | "C" | "D"
  explanation?: string;
  points: number;
}

export interface MultiQuestion {
  id: string;
  type: 'multi';
  question: string;
  options: string[];
  answer: string[];           // e.g. ["A", "C"]  — order-independent
  explanation?: string;
  points: number;
}

export interface TrueFalseQuestion {
  id: string;
  type: 'true-false';
  question: string;
  answer: boolean;
  explanation?: string;
  points: number;
}

export interface ShortQuestion {
  id: string;
  type: 'short';
  question: string;
  keywords: string[];         // required keywords (all must appear, case-insensitive)
  sample_answer?: string;
  min_keywords: number;       // minimum keyword count to pass (default: all)
  points: number;
}

export interface CodeQuestion {
  id: string;
  type: 'code';
  question: string;
  language: string;
  starter_code?: string;
  test_cases: TestCase[];
  points: number;
}

export type Question =
  | MCQQuestion
  | MultiQuestion
  | TrueFalseQuestion
  | ShortQuestion
  | CodeQuestion;

export interface TestCase {
  input: string;
  expected_output: string;
  hidden?: boolean;           // hidden test cases not shown to student
  description?: string;
}

// ─── Quiz block (within a lesson or chapter) ─────────────────────────────────

export interface Quiz {
  id: string;
  title: string;
  pass_score: number;         // percentage 0-100
  max_attempts: number;
  time_limit_minutes?: number;
  questions: Question[];
}

// ─── Chapter test (end-of-chapter assessment) ────────────────────────────────

export interface ChapterTest {
  id: string;
  title: string;
  pass_score: number;
  max_attempts: number;
  time_limit_minutes?: number;
  questions: Question[];
}

// ─── Project ─────────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  title: string;
  description: string;
  deliverables: string[];
  test_cases?: TestCase[];    // auto-graded via Docker if present
  manual_review: boolean;     // always true if no test_cases
  grading_rubric?: RubricItem[];
  pass_score: number;
  points: number;
}

export interface RubricItem {
  criterion: string;
  max_points: number;
  description: string;
}

// ─── Lesson ───────────────────────────────────────────────────────────────────

export interface Lesson {
  id: string;
  title: string;
  type: LessonType;
  duration_minutes?: number;
  url?: string;               // video/reading URL
  description?: string;
  quiz?: Quiz;                // optional in-lesson quiz
}

// ─── Chapter ─────────────────────────────────────────────────────────────────

export interface Chapter {
  id: string;                 // e.g. "ch-01"
  title: string;
  description?: string;
  lessons: Lesson[];
  chapter_test: ChapterTest;
  project?: Project;
}

// ─── Certificate requirements ─────────────────────────────────────────────────

export interface Certificate {
  requires_all_chapter_tests: boolean;
  requires_final_project: boolean;
  min_overall_score: number;   // percentage
  final_test?: ChapterTest;    // optional grand final
  template?: string;           // path to cert SVG template
}

// ─── Contributor ─────────────────────────────────────────────────────────────

export interface CourseContributor {
  name: string;
  github: string;
  role: string;               // "author" | "reviewer" | "translator" | etc.
  email?: string;
}

// ─── Credit / Attribution ─────────────────────────────────────────────────────

export interface Credit {
  title: string;
  url?: string;
  author?: string;
  license?: string;
  type: 'book' | 'paper' | 'video' | 'course' | 'tool' | 'dataset' | 'other';
}

// ─── Automation triggers ─────────────────────────────────────────────────────

export interface AutomationTriggers {
  on_chapter_complete?: string[];    // workflow dispatch targets
  on_course_complete?: string[];
  on_certificate_issue?: string[];
  notify_slack?: boolean;
  notify_discord?: boolean;
}

// ─── Changelog entry ─────────────────────────────────────────────────────────

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: Array<{ type: ChangeType; text: string }>;
}

// ─── Course metadata ─────────────────────────────────────────────────────────

export interface CourseMeta {
  slug: string;               // unique URL-safe ID, e.g. "git-mastery"
  title: string;
  version: string;            // semver e.g. "1.0.0"
  description: string;
  track: string;              // e.g. "foundations" | "systems" | ...
  difficulty: Difficulty;
  tags: string[];
  prerequisites: string[];    // slugs of prerequisite courses
  estimated_hours: number;
  thumbnail?: string;
  repo?: string;              // GitHub repo URL
  license?: string;           // e.g. "CC BY-SA 4.0"
}

// ─── Full course document ─────────────────────────────────────────────────────

export interface Course {
  meta: CourseMeta;
  contributors: CourseContributor[];
  credits: Credit[];
  chapters: Chapter[];
  certificate: Certificate;
  automation?: AutomationTriggers;
  changelog?: ChangelogEntry[];
}

// ─── Enrollment / progress records (runtime, stored in GitHub Issues) ─────────

export interface EnrollmentRecord {
  login: string;
  name: string;
  email: string;
  courseSlug: string;
  issueNumber: number;
  enrolledAt: string;         // ISO-8601
  completedChapters: string[]; // chapter IDs
  scores: Record<string, number>; // test-id → score percentage
  certified: boolean;
  finishedAt?: string;
}

// ─── Leaderboard entry ────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number;
  login: string;
  name?: string;
  coursesCompleted: number;
  avgScore: number;           // average across all graded tests
  totalPoints: number;        // sum of earned points
  maxPoints: number;          // sum of possible points
  fastestCourse?: number;     // hours to complete fastest course
  certified: boolean;
  enrolledCourses: string[];  // course slugs
}

// ─── Grading results ─────────────────────────────────────────────────────────

export interface QuestionResult {
  questionId: string;
  earned: number;
  max: number;
  correct: boolean;
  feedback?: string;
}

export interface GradeReport {
  testId: string;
  courseSlug: string;
  student: string;
  totalEarned: number;
  totalMax: number;
  percentage: number;
  passed: boolean;
  results: QuestionResult[];
  gradedAt: string;
}
