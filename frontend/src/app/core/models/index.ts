// ── Auth ─────────────────────────────────────────────────────────────────────
export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface JwtPayload {
  user_id: number;
  university_email: string;
  is_staff: boolean;
  exp: number;
}

export interface Student {
  id: number;
  username: string;
  university_email: string;
  is_verified: boolean;
  karma: number;
  is_staff: boolean;
}

// ── Teacher ──────────────────────────────────────────────────────────────────
export interface AverageRatings {
  clarity: number;
  objectivity: number;
  accessibility: number;
  workload: number;
  overall: number;
  difficulty?: number;
}

export interface TeachingHistory {
  year_interval: string;
  subject_name: string;
  role: string;
  course_instance_id: number;
}

export interface Teacher {
  id: number;
  full_name: string;
  photo: string | null;
  description?: string;
  age_range: string;
  is_verified: boolean;
  gender_bias_score: number;
  average_ratings: AverageRatings;
  teaching_history?: TeachingHistory[];
  review_count: number;
  show_gender_bias?: boolean;
}

// ── Subject ──────────────────────────────────────────────────────────────────
export interface SubjectTeacherEntry {
  teacher_id: number;
  teacher_name: string;
  course_instance_id: number;
  avg_difficulty: number;
  avg_rating: number;
  grade_avg: number;
  review_count: number;
}

export interface Subject {
  id: number;
  title: string;
  category: 'mandatory' | 'elective' | 'major' | 'minor' | 'profile';
  credits: number;
  description?: string;
  overall_difficulty: number;
  teacher_dependency_ratio: number;
  teachers?: SubjectTeacherEntry[];
}

// ── Course Instance ───────────────────────────────────────────────────────────
export interface WeeklyPlanItem {
  week: number;
  topic: string;
  type: 'lecture' | 'practice' | 'lab';
}

export interface GradeDistribution {
  A: number; 'A-': number; 'B+': number; B: number; 'B-': number;
  'C+': number; C: number; 'C-': number; 'D+': number; D: number;
  F: number; FX: number;
}

export interface SyllabusVersion {
  id: number;
  file: string;
  year: number;
  uploaded_by_name: string;
  uploaded_at: string;
}

export interface CourseInstance {
  id: number;
  teacher: Teacher;
  subject: Subject;
  year_interval: string;
  role: string;
  grading_policy: string;
  weekly_plan: WeeklyPlanItem[];
  grade_distribution: GradeDistribution;
  syllabus_history: SyllabusVersion[];
  reviews?: Review[];
  average_ratings: AverageRatings;
}

// ── Review ────────────────────────────────────────────────────────────────────
export interface SensitiveMarkers {
  gender_bias: boolean;
  favoritism: boolean;
}

export interface Review {
  id: number;
  author_name: string;
  course_instance: number;
  text: string;
  rating: number;
  difficulty_rating: number;
  clarity_rating: number;
  objectivity_rating: number;
  accessibility_rating: number;
  workload_rating: number;
  is_anonymous: boolean;
  sensitive_markers: SensitiveMarkers;
  helpful_votes: number;
  took_this_course: boolean;
  created_at: string;
  report_count: number;
}

export interface ReviewCreatePayload {
  course_instance: number;
  text: string;
  rating: number;
  difficulty_rating: number;
  clarity_rating: number;
  objectivity_rating: number;
  accessibility_rating: number;
  workload_rating: number;
  is_anonymous: boolean;
  took_this_course: boolean;
  sensitive_markers: SensitiveMarkers;
}

// ── Study Material ────────────────────────────────────────────────────────────
export interface StudyMaterial {
  id: number;
  title: string;
  link: string;
  file: string;
  type: 'lecture' | 'exam' | 'book' | 'other';
  status: 'pending' | 'approved' | 'rejected';
  subject: number;
  contributor_name: string;
  contributor_karma: number;
  created_at: string;
}

// ── Admin ─────────────────────────────────────────────────────────────────────
export interface AdminStats {
  total_teachers: number;
  total_subjects: number;
  total_reviews: number;
  total_users: number;
  new_reviews_today: number;
  pending_materials: number;
  open_reports: number;
  reviews_last_7_days: { date: string; count: number }[];
}

export interface AdminReport {
  id: number;
  review: number;
  review_text: string;
  reporter_name: string;
  reason: string;
  status: 'open' | 'resolved';
  created_at: string;
}

// ── Pagination ────────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
