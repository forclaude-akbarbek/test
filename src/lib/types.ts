export type Section = 'rw' | 'math'
export type Difficulty = 'E' | 'M' | 'H'

export interface Question {
  id: string
  section: Section
  domain: string
  skill: string
  difficulty: Difficulty
  /** 'mcq' = multiple choice, 'spr' = student-produced response (grid-in) */
  type: 'mcq' | 'spr'
  passage?: string
  stem: string
  choices?: string[]
  /** Letter for mcq ('A'..'D'); canonical value for spr */
  answer: string
  /** Extra accepted values for spr (e.g. "0.5", "1/2") */
  accepted?: string[]
  explanation: string
}

export type Role = 'student' | 'b2b' | 'b2g' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  password: string
  role: Role
  org?: string
  grade?: string
  targetScore?: number
  testDate?: string
  plan: 'free' | 'premium'
  active: boolean
  createdAt: string
}

export interface ResponseRecord {
  qid: string
  answer: string | null
  correct: boolean
  timeSec: number
  marked?: boolean
}

export interface ModuleResult {
  key: string
  title: string
  section: Section
  route?: 'easy' | 'hard'
  responses: ResponseRecord[]
}

export type AttemptKind = 'full' | 'rw' | 'math' | 'quick'

export interface Attempt {
  id: string
  testId: string
  title: string
  kind: AttemptKind
  startedAt: string
  finishedAt: string
  modules: ModuleResult[]
  scores: { total: number; rw: number | null; math: number | null }
}

export interface StudyPlanWeek {
  week: number
  focus: string
  tasks: string[]
}

export interface StudyPlan {
  id: string
  createdAt: string
  baseline: number
  target: number
  testDate: string
  weakSkills: string[]
  summary: string
  weeks: StudyPlanWeek[]
  /** Completed task keys, formatted as `${week}-${taskIndex}` */
  done?: string[]
}

export interface UserData {
  attempts: Attempt[]
  bq: Record<string, { answer: string; correct: boolean; at: string }>
  bookmarks: string[]
  vocab: { mastered: string[]; learning: string[]; daily: { date: string; words: string[] }[] }
  plans: StudyPlan[]
  activity: string[] // ISO dates (yyyy-mm-dd) with any activity, for streaks
}
