/**
 * course.ts — TypeScript interfaces for the course.yaml schema v3.0.
 * A single course.yaml is the sole source of truth for a course.
 * Answers/solutions live in the companion solutions.yaml (private, never committed).
 */

// ─── Primitive helpers ────────────────────────────────────────────────────────

export type CourseStatus     = 'draft' | 'review' | 'published' | 'archived' | 'deprecated';
export type CourseVisibility = 'public' | 'unlisted' | 'private';
export type CourseLevel      = 'beginner' | 'intermediate' | 'advanced' | 'mixed';
export type CoursePace       = 'self-paced' | 'scheduled';
export type LessonType       = 'video' | 'reading' | 'code' | 'exercise' | 'reference' | 'project' | 'quiz' | 'discussion' | 'live';
export type CreditType       = 'video' | 'repo' | 'article' | 'book' | 'tool' | 'dataset' | 'course' | 'podcast';
export type QuestionType     = 'mcq' | 'multi' | 'truefalse' | 'short' | 'code_output' | 'code_fix' | 'code_write' | 'code_reading';
export type GradingMethod    = 'auto' | 'manual' | 'diff' | 'keywords';
export type ChangeType       = 'added' | 'changed' | 'fixed' | 'removed';
export type SubmissionType   = 'github_url' | 'file_upload' | 'inline';


// ─── Section 1: Metadata ─────────────────────────────────────────────────────

export interface CourseMetadata {
  id: string;               // kebab-case, globally unique course slug
  version: string;          // semver
  schema_version: string;   // course.yaml schema version, e.g. "3.0"
  status: CourseStatus;
  visibility: CourseVisibility;
  created_at: string;       // ISO 8601
  updated_at: string;
  published_at: string | null;
  language: string;         // ISO 639-1
  locale?: string;
  slug_aliases?: string[];
  solutions_file: string;   // path to companion solutions.yaml
}


// ─── Section 2: Identity ─────────────────────────────────────────────────────

export interface CourseIdentity {
  title: string;
  tagline: string;
  description: {
    short: string;
    full: string;
  };
  cover: {
    thumbnail: string;      // 16:9, min 800×450
    banner: string;         // 3:1, min 1200×400
    og_image: string;       // 1200×630
    color_primary: string;
    color_secondary: string;
  };
}


// ─── Section 3: Classification ───────────────────────────────────────────────

export interface CourseClassification {
  category: string;
  subcategory: string;
  tags: string[];
  topics: string[];
  level: CourseLevel;
  target_audience: string[];
  skills_gained: string[];
}


// ─── Section 4: Effort ───────────────────────────────────────────────────────

export interface CourseEffort {
  video_hours: number;
  reading_hours: number;
  exercise_hours: number;
  total_hours: number;
  pace: CoursePace;
  weekly_commitment_hours: number;
  completion_weeks: number;
}


// ─── Section 5: People ───────────────────────────────────────────────────────

export interface CourseCurator {
  name: string;
  github: string;
  role: string;
  bio?: string;
  avatar?: string | null;
}

export interface CourseContributor {
  name: string;
  github: string;
  role: string;
  contributions?: string[];
}

export interface CourseReviewer {
  name: string;
  github: string;
  expertise?: string;
}

export interface CoursePeople {
  curator: CourseCurator;
  contributors?: CourseContributor[];
  reviewers?: CourseReviewer[];
}


// ─── Section 6: Credits ──────────────────────────────────────────────────────

export interface CourseCredit {
  id: string;               // e.g. "src-01" — referenced by lessons via credit_id
  type: CreditType;
  title: string;
  author: string;
  organization?: string | null;
  url: string;
  license: string;
  license_url?: string | null;
  accessed_at: string;
  notes?: string;
  archived_url?: string | null;
}


// ─── Section 7: Prerequisites ────────────────────────────────────────────────

export interface PrerequisiteTool {
  name: string;
  url: string;
  required: boolean;
  install_guide?: string;
  version_minimum?: string | null;
}

export interface PrerequisiteAccount {
  service: string;
  url: string;
  required: boolean;
  reason?: string;
}

export interface CoursePrerequisites {
  knowledge?: string[];
  courses?: string[];       // other course IDs required first
  tools?: PrerequisiteTool[];
  accounts?: PrerequisiteAccount[];
}


// ─── Section 8: Outcomes ─────────────────────────────────────────────────────

export interface CourseOutcomes {
  by_completion: string[];
  by_chapter?: Record<string, string[]>;  // chapter id → outcomes
}

// ─── Content blueprint: Open Source Course Blueprint ─────────────────────────

export type ContentBlueprintFlowStage =
  | 'foundations'
  | 'environment-setup'
  | 'guided-fundamentals'
  | 'incremental-challenges'
  | 'production-engineering'
  | 'open-source-exploration'
  | 'capstone-project'
  | 'contribution-path';

export interface CourseContentBlueprintResourceStrategy {
  repositories?: string[];
  open_books?: string[];
  papers?: string[];
  rfcs_and_specs?: string[];
}

export interface CourseContentBlueprintTesting {
  philosophy?: string[];
  types?: string[];
  generators?: string[];
}

export interface CourseContentBlueprintCapstone {
  level?: 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'elite' | 'frontier';
  type?: string;
  requirements?: string[];
}

export interface CourseContentBlueprint {
  philosophy?: string;
  principles?: string[];
  flow?: ContentBlueprintFlowStage[];
  chapter_structure?: string[];
  resource_strategy?: CourseContentBlueprintResourceStrategy;
  testing?: CourseContentBlueprintTesting;
  capstone?: CourseContentBlueprintCapstone;
  contribution_path?: string[];
}


// ─── Section 9: Curriculum ───────────────────────────────────────────────────

export interface VideoTimestamp {
  label: string;
  time: string;
}

export interface VideoContent {
  url: string;
  embed_url?: string;
  source: string;
  channel?: string;
  credit_id?: string;
  duration_seconds?: number;
  quality?: string;
  subtitles_available?: boolean;
  timestamps?: VideoTimestamp[];
}

export interface ReadingContent {
  url: string;
  source: string;
  credit_id?: string;
  estimated_minutes?: number;
  sections_to_read?: string[];
  sections_to_skip?: string[];
}

export interface TextContent {
  format: 'markdown' | 'plain' | 'html';
  body: string;
}

export interface CodeBlock {
  id: string;
  title: string;
  language: string;
  file?: string;
  runnable?: boolean;
  snippet: string;
  explanation?: string;
  expected_output?: string;
}

export interface ContentLink {
  label: string;
  url: string;
  type: string;
  credit_id?: string;
  required?: boolean;
  note?: string;
}

export interface ContentFile {
  label: string;
  file: string;
  type: string;
}

export interface ExerciseContent {
  starter_repo: string;
  solution_repo?: string | null;
  branch?: string;
  entry_file?: string;
  test_command?: string;
  submission_type?: SubmissionType;
}

export interface Hint {
  level: number;
  reveal_after_minutes: number;
  text: string;
}

export interface LessonContent {
  video?: VideoContent;
  reading?: ReadingContent;
  text?: TextContent;
  code_blocks?: CodeBlock[];
  exercise?: ExerciseContent;
  supplemental?: ContentLink[];
  hints?: Hint[];
  links?: ContentLink[];
  files?: ContentFile[];
}

export interface Lesson {
  id: string;
  title: string;
  type: LessonType;
  duration_minutes?: number;
  free_preview?: boolean;
  description?: string;
  content?: LessonContent;
  tags?: string[];
}

export interface Subsection {
  id: string;
  title: string;
  description?: string;
  lessons: Lesson[];
}

export interface Section {
  id: string;
  title: string;
  description?: string;
  subsections?: Subsection[];
  lessons?: Lesson[];   // direct lessons if no subsections
}

export interface Chapter {
  id: string;
  title: string;
  description?: string;
  duration_minutes?: number;
  free_preview?: boolean;
  outcomes?: string[];
  sections?: Section[];
  lessons?: Lesson[];   // direct lessons if no sections
  chapter_test_id: string;     // references chapter_tests[] by id
  chapter_assignment_id?: string; // references chapter_assignments[] by id
}

export interface Curriculum {
  chapters: Chapter[];
}


// ─── Section 10: Chapter Tests ───────────────────────────────────────────────

export interface QuestionCodeBlock {
  language: string;
  snippet: string;
}

/** A question as stored in course.yaml — answers are in solutions.yaml */
export interface CourseQuestion {
  id: string;
  type: QuestionType;
  points: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  topic?: string;
  chapter?: string;
  question: string;
  /** For mcq, multi, code_output, code_fix: the options */
  options?: string[];
  /** For code_output, code_fix, code_write: the code block */
  code?: QuestionCodeBlock;
  /** For code_fix, code_write: the grading strategy */
  grading?: GradingMethod;
  /** For code_write: starter code */
  starter?: string;
  /** For short: keyword list for partial scoring */
  keywords?: string[];
  /** For short: language for syntax highlighting of expected block */
  language?: string;
}

export interface TestSection {
  id: string;
  title: string;
  weight: number;           // percentage weight of this section
  questions: CourseQuestion[];
}

export interface ChapterTest {
  id: string;
  title: string;
  attached_to: string;      // chapter id
  gates_next_chapter: boolean;
  passing_score: number;    // percentage 0–100
  max_attempts: number;
  time_limit_minutes?: number;
  randomize_questions?: boolean;
  randomize_options?: boolean;
  show_answers_after?: 'passed' | 'attempted' | 'never';
  sections: TestSection[];
}


// ─── Section 11: Chapter Assignments ────────────────────────────────────────

export interface RubricCriterion {
  criterion: string;
  points: number;
}

export interface ReviewSettings {
  type: 'maintainer' | 'auto';
  sla_days?: number;
  feedback_required?: boolean;
}

export interface AssignmentContent {
  text?: TextContent;
  links?: ContentLink[];
  files?: ContentFile[];
}

export interface ChapterAssignment {
  id: string;
  title: string;
  attached_to: string;      // chapter id
  required_for_progress: boolean;
  submission_type: SubmissionType;
  due_after_enrollment_days?: number;
  max_resubmissions?: number;
  content?: AssignmentContent;
  rubric?: RubricCriterion[];
  total_points?: number;
  passing_score?: number;
  review?: ReviewSettings;
}


// ─── Section 12: Final Test ──────────────────────────────────────────────────

export interface FinalTest {
  id: string;
  title: string;
  attached_to: 'final';
  unlocks?: string;         // id of final assignment
  passing_score: number;
  max_attempts: number;
  time_limit_minutes?: number;
  randomize_questions?: boolean;
  randomize_options?: boolean;
  show_answers_after?: 'passed' | 'attempted' | 'never';
  required_for_certificate: boolean;
  coverage?: string[];      // chapter ids
  sections: TestSection[];
}


// ─── Section 13: Final Assignment ────────────────────────────────────────────

export interface Milestone {
  id: string;
  title: string;
  due_day: number;
}

export interface FinalAssignment {
  id: string;
  title: string;
  attached_to: 'final';
  unlocked_by?: string;
  required_for_certificate: boolean;
  submission_type: SubmissionType;
  due_after_unlock_days?: number;
  max_resubmissions?: number;
  content?: AssignmentContent;
  milestones?: Milestone[];
  rubric?: RubricCriterion[];
  total_points?: number;
  passing_score?: number;
  review?: ReviewSettings;
}


// ─── Section 14: Certificate ─────────────────────────────────────────────────

export interface CertificateRequirement {
  type: 'final_test' | 'final_assignment' | 'chapter_test';
  id: string;
  min_score: number;
}

export interface CourseBadge {
  enabled: boolean;
  image: string;
  description: string;
}

export interface CourseCertificate {
  enabled: boolean;
  title: string;
  subtitle?: string;
  requirements: CertificateRequirement[];
  template?: string;
  custom_template?: string | null;
  badge?: CourseBadge;
}


// ─── Section 15: Assets ──────────────────────────────────────────────────────

export interface CourseAssets {
  images?: string[];
  code?: string[];
  docs?: string[];
  data?: string[];
  slides?: string[];
}


// ─── Section 16: Triggers ────────────────────────────────────────────────────

export interface CourseTriggers {
  on_publish?: string[];
  on_enrollment?: string[];
  on_chapter_complete?: string[];
  on_test_submit?: string[];
  on_assignment_submit?: string[];
  on_final_test_pass?: string[];
  on_certificate_earn?: string[];
  on_update?: string[];
}


// ─── Section 17: Discussion ──────────────────────────────────────────────────

export interface CourseDiscussion {
  enabled: boolean;
  category?: string;
  per_chapter?: boolean;
  pinned_resources?: Array<{ title: string; file?: string; url?: string }>;
}


// ─── Section 18: Changelog ───────────────────────────────────────────────────

export interface ChangelogEntry {
  version: string;
  date: string;
  author?: string;
  changes: string[];
}


// ─── Full course document ─────────────────────────────────────────────────────

export interface Course {
  metadata: CourseMetadata;
  identity: CourseIdentity;
  classification: CourseClassification;
  effort: CourseEffort;
  people: CoursePeople;
  credits?: CourseCredit[];
  prerequisites?: CoursePrerequisites;
  outcomes?: CourseOutcomes;
  content_blueprint?: CourseContentBlueprint;
  curriculum: Curriculum;
  chapter_tests: ChapterTest[];
  chapter_assignments?: ChapterAssignment[];
  final_test?: FinalTest;
  final_assignment?: FinalAssignment;
  certificate: CourseCertificate;
  assets?: CourseAssets;
  triggers?: CourseTriggers;
  discussion?: CourseDiscussion;
  changelog?: ChangelogEntry[];
}


// ─── course.json output shape (written by parse-course, read by sync-site-data) ─

/** Stripped, public-safe representation written to course.json after publish. */
export interface CourseJson {
  id: string;
  title: string;
  tagline: string;
  description: string;           // short description
  track: string;                 // classification.category
  level: CourseLevel;
  tags: string[];
  topics: string[];
  prerequisites: string[];       // prerequisite course ids
  total_hours: number;
  thumbnail?: string;
  banner?: string;
  color_primary?: string;
  status: CourseStatus;
  version: string;
  curator: string;               // github login
  chapters: Array<{
    id: string;
    title: string;
    description?: string;
    lessonCount: number;
    hasAssignment: boolean;
  }>;
  totalLessons: number;
  totalChapterTests: number;
  hasFinaTest: boolean;
  hasFinalAssignment: boolean;
  certificate: {
    enabled: boolean;
    requirements: CertificateRequirement[];
  };
  changelog?: ChangelogEntry[];
  generatedAt: string;
}


// ─── Enrollment / progress records (runtime, stored in GitHub Issues) ─────────

export interface EnrollmentRecord {
  login: string;
  courseId: string;
  issueNumber: number;
  enrolledAt: string;
  completedChapters: string[];
  scores: Record<string, number>;   // test-id → score percentage
  certified: boolean;
  finishedAt?: string;
}


// ─── Leaderboard entry ────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number;
  login: string;
  name?: string;
  coursesCompleted: number;
  avgScore: number;
  totalPoints: number;
  maxPoints: number;
  fastestCourse?: number;         // hours
  certified: boolean;
  enrolledCourses: string[];
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
  courseId: string;
  student: string;
  totalEarned: number;
  totalMax: number;
  percentage: number;
  passed: boolean;
  results: QuestionResult[];
  gradedAt: string;
}


// ─── Course Detail JSON (written by parse-course, read by [slug].astro) ──────
// Full player-ready data for a course. Every lesson's content is inlined so the
// Astro page can render it at build time without reading additional files.

export interface PlayerLesson {
  id: string;
  title: string;
  type: LessonType;
  duration_minutes: number;
  free_preview: boolean;
  description?: string;
  tags?: string[];
  /** Video embed info — only present for type: video */
  video?: {
    embed_url: string;    // iframe src (youtube-nocookie or vimeo player)
    url: string;          // original URL for "open externally" link
    source: string;       // "youtube" | "vimeo" | etc.
    channel?: string;
    subtitles_available?: boolean;
    timestamps?: Array<{ label: string; time: string }>;
  };
  /** Reading link — only for type: reading */
  reading?: {
    url: string;
    source: string;
    estimated_minutes?: number;
    sections_to_read?: string[];
  };
  /** Curator notes body (raw markdown) — present on most lesson types */
  text_md?: string;
  /** Code blocks — for type: code */
  code_blocks?: Array<{
    id: string;
    title: string;
    language: string;
    snippet: string;
    explanation?: string;
    expected_output?: string;
    runnable?: boolean;
  }>;
  /** Exercise details — for type: exercise */
  exercise?: {
    starter_repo: string;
    solution_repo?: string;
    entry_file?: string;
    test_command?: string;
    submission_type?: string;
  };
  hints?: Array<{ level: number; text: string }>;
  links?: Array<{ label: string; url: string; type: string; required?: boolean; note?: string }>;
  files?: Array<{ label: string; file: string; type: string }>;
  supplemental?: Array<{ label: string; url: string; type: string }>;
}

export interface PlayerQuestion {
  id: string;
  type: QuestionType;
  points: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  topic?: string;
  question: string;
  options?: string[];
  code?: QuestionCodeBlock;
  starter?: string;
  language?: string;
}

export interface PlayerTestSection {
  id: string;
  title: string;
  weight: number;
  questions: PlayerQuestion[];
}

export interface PlayerTest {
  id: string;
  title: string;
  attached_to: string;
  passing_score: number;
  max_attempts: number;
  time_limit_minutes?: number;
  question_count: number;
  sections: PlayerTestSection[];
  gates_next_chapter?: boolean;
  required_for_certificate?: boolean;
}

export interface PlayerAssignment {
  id: string;
  title: string;
  attached_to: string;
  required_for_progress?: boolean;
  required_for_certificate?: boolean;
  submission_type: SubmissionType;
  content?: AssignmentContent;
  milestones?: Milestone[];
  rubric?: RubricCriterion[];
  total_points?: number;
  passing_score?: number;
  review?: ReviewSettings;
}

export interface PlayerChapter {
  id: string;
  title: string;
  description?: string;
  outcomes?: string[];
  lessons: PlayerLesson[];   // flattened from sections/subsections/direct lessons
  chapter_test_id: string;
  chapter_assignment_id?: string;
  lessonCount: number;
  duration_minutes: number;
  hasAssignment: boolean;
  /** Chapter test summary (no answers — answers in solutions.yaml) */
  test_summary: {
    title: string;
    passing_score: number;
    max_attempts: number;
    time_limit_minutes?: number;
    question_count: number;
    gates_next_chapter: boolean;
  };
}

export interface CourseDetailJson {
  id: string;
  title: string;
  tagline: string;
  description_short: string;
  description_full_md: string;   // raw markdown — rendered at build time in Astro
  cover: {
    thumbnail?: string;
    banner?: string;
    color_primary?: string;
    color_secondary?: string;
  };
  level: CourseLevel;
  track: string;
  tags: string[];
  topics: string[];
  skills_gained: string[];
  effort: {
    video_hours: number;
    reading_hours: number;
    exercise_hours: number;
    total_hours: number;
    pace: CoursePace;
    weekly_commitment_hours: number;
    completion_weeks: number;
  };
  curator: {
    name: string;
    github: string;
    role: string;
    bio?: string;
    avatar?: string;
  };
  prerequisites: {
    knowledge: string[];
    courses: string[];
    tools: Array<{ name: string; url: string; required: boolean; version_minimum?: string }>;
    accounts: Array<{ service: string; url: string; required: boolean; reason?: string }>;
  };
  outcomes: {
    by_completion: string[];
    by_chapter: Record<string, string[]>;
  };
  chapters: PlayerChapter[];
  chapter_tests: PlayerTest[];
  chapter_assignments: PlayerAssignment[];
  final_test?: PlayerTest;
  final_assignment?: PlayerAssignment;
  certificate: {
    enabled: boolean;
    title: string;
    subtitle?: string;
    requirements: CertificateRequirement[];
  };
  discussion: {
    enabled: boolean;
    category?: string;
    per_chapter?: boolean;
  };
  version: string;
  status: CourseStatus;
  totalLessons: number;
  totalChapters: number;
  totalDurationMinutes: number;
  generatedAt: string;
}


// ─── Sandbox types ────────────────────────────────────────────────────────────

export interface CodeTestResult {
  name:       string;
  passed:     boolean;
  score:      number;
  maxScore:   number;
  hidden:     boolean;
  input?:     string;
  expected?:  string;
  actual?:    string;
  error?:     string;
}

export interface SandboxOutput {
  passed:    boolean;
  score:     number;
  maxScore:  number;
  seed?:     number;
  language:  string;
  tests:     CodeTestResult[];
  duration?: number;
}
