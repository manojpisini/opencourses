/**
 * course.ts — Site-side TypeScript types for the course player.
 * These mirror the engine types but are defined separately so the site
 * doesn't depend on the engine workspace at build time.
 *
 * The authoritative definitions live in engine/types/course.ts.
 */

export type LessonType = 'video' | 'reading' | 'code' | 'exercise' | 'reference' | 'project' | 'quiz' | 'discussion' | 'live';
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced' | 'mixed';
export type CoursePace = 'self-paced' | 'scheduled';
export type CourseStatus = 'draft' | 'review' | 'published' | 'archived' | 'deprecated';
export type SubmissionType = 'github_url' | 'file_upload' | 'inline';

export interface PlayerLesson {
  id: string;
  title: string;
  type: LessonType;
  duration_minutes: number;
  free_preview: boolean;
  description?: string;
  tags?: string[];
  video?: {
    embed_url: string;
    url: string;
    source: string;
    channel?: string;
    subtitles_available?: boolean;
    timestamps?: Array<{ label: string; time: string }>;
  };
  reading?: {
    url: string;
    source: string;
    estimated_minutes?: number;
    sections_to_read?: string[];
  };
  text_md?: string;
  code_blocks?: Array<{
    id: string;
    title: string;
    language: string;
    snippet: string;
    explanation?: string;
    expected_output?: string;
    runnable?: boolean;
  }>;
  exercise?: {
    starter_repo: string;
    solution_repo?: string;
    test_command?: string;
    submission_type?: string;
  };
  hints?: Array<{ level: number; text: string }>;
  links?: Array<{ label: string; url: string; type: string; required?: boolean; note?: string }>;
  files?: Array<{ label: string; file: string; type: string }>;
  supplemental?: Array<{ label: string; url: string; type: string }>;
}

export interface PlayerChapter {
  id: string;
  title: string;
  description?: string;
  outcomes?: string[];
  lessons: PlayerLesson[];
  chapter_test_id: string;
  chapter_assignment_id?: string;
  lessonCount: number;
  duration_minutes: number;
  hasAssignment: boolean;
  test_summary: {
    title: string;
    passing_score: number;
    max_attempts: number;
    time_limit_minutes?: number;
    question_count: number;
    gates_next_chapter: boolean;
  };
}

export interface CertificateRequirement {
  type: 'final_test' | 'final_assignment' | 'chapter_test';
  id: string;
  min_score: number;
}

export interface CourseDetailJson {
  id: string;
  title: string;
  tagline: string;
  description_short: string;
  description_full_md: string;
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
  final_test?: {
    id: string;
    title: string;
    passing_score: number;
    max_attempts: number;
    time_limit_minutes?: number;
    question_count: number;
    required_for_certificate: boolean;
  };
  final_assignment?: {
    id: string;
    title: string;
    required_for_certificate: boolean;
    submission_type: SubmissionType;
  };
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
