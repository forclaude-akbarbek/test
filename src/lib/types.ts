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

export type Role = 'student' | 'teacher' | 'b2b' | 'b2g' | 'admin'

/** private = B2B school, government = B2G school, network = B2G body overseeing many government schools */
export type OrgKind = 'private' | 'government' | 'network'

export interface Org {
  id: string
  name: string
  kind: OrgKind
  tier?: 'presidential' | 'specialized' | 'private' | 'network'
  region: string
  city: string
  parentId?: string
  seats: number
  licenseUntil: string
  createdAt: string
  /** How many fabricated demo students the school has, generated deterministically from `seed`. */
  generated: number
  seed: number
  /** Ability baseline for fabricated students (0–1). */
  level: number
}

export interface SchoolClass {
  id: string
  orgId: string
  name: string
  grade: string
  teacherId?: string
}

export interface Teacher {
  id: string
  orgId: string
  name: string
  email: string
  subject: 'Reading and Writing' | 'Math'
  userId?: string
}

export type AssignmentType = 'mock' | 'section' | 'quick' | 'vocab'

export interface Assignment {
  id: string
  /** School or network that created it. Network assignments reach every school in the network. */
  orgId: string
  /** Empty = everyone in the school (or every school in the network). */
  classIds: string[]
  title: string
  type: AssignmentType
  testId?: string
  section?: 'rw' | 'math'
  skill?: string
  list?: string
  due: string
  createdAt: string
  createdBy: string
}

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
  orgId?: string
  classId?: string
  teacherId?: string
  /** School-issued accounts must set their own password on first sign-in. */
  mustChangePassword?: boolean
  failedLogins?: number
  lockedUntil?: string
  lastLogin?: string
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
