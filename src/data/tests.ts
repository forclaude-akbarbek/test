import type { Difficulty, Question, Section } from '../lib/types'
import { rng } from '../lib/rng'
import { RW_QUESTIONS } from './rw'
import { MATH_QUESTIONS, mathTestPool } from './math'

export const ALL_QUESTIONS: Question[] = [...RW_QUESTIONS, ...MATH_QUESTIONS]

export interface ModuleSpec {
  key: string
  title: string
  section: Section
  minutes: number
  questions: Question[]
}

export interface PracticeTest {
  id: string
  title: string
  subtitle: string
  rw1: ModuleSpec
  rw2: { easy: ModuleSpec; hard: ModuleSpec }
  math1: ModuleSpec
  math2: { easy: ModuleSpec; hard: ModuleSpec }
}

const order: Record<'hard' | 'easy' | 'mixed', Difficulty[]> = {
  hard: ['H', 'M', 'E'],
  easy: ['E', 'M', 'H'],
  mixed: ['M', 'E', 'H'],
}

function take(pool: Question[], count: number, mode: 'hard' | 'easy' | 'mixed', seed: number, exclude: Set<string>) {
  const r = rng(seed)
  const avail = r.shuffle(pool.filter((q) => !exclude.has(q.id)))
  let picked: Question[]
  if (mode === 'mixed') {
    // Roughly one-third each difficulty, like a routing module.
    const per = Math.ceil(count / 3)
    picked = (['E', 'M', 'H'] as Difficulty[]).flatMap((d) => avail.filter((q) => q.difficulty === d).slice(0, per))
    picked = picked.slice(0, count)
  } else {
    picked = order[mode].flatMap((d) => avail.filter((q) => q.difficulty === d)).slice(0, count)
  }
  // Top up from anything left if the pool was short.
  if (picked.length < count) picked.push(...avail.filter((q) => !picked.includes(q)).slice(0, count - picked.length))
  // Present easier questions first, as the real test tends to.
  const rank = { E: 0, M: 1, H: 2 }
  return picked.sort((a, b) => rank[a.difficulty] - rank[b.difficulty] || (a.type === 'spr' ? 1 : 0) - (b.type === 'spr' ? 1 : 0))
}

function makeTest(index: number): PracticeTest {
  const id = `pt${index}`
  const seed = 4242 * index
  const rw1q = take(RW_QUESTIONS, 27, 'mixed', seed + 1, new Set())
  const used = new Set(rw1q.map((q) => q.id))
  const mathPool = mathTestPool(index)
  const m1q = take(mathPool, 22, 'mixed', seed + 2, new Set())
  const mUsed = new Set(m1q.map((q) => q.id))
  const mod = (key: string, title: string, section: Section, minutes: number, questions: Question[]): ModuleSpec => ({
    key, title, section, minutes, questions,
  })
  return {
    id,
    title: `Full-Length Practice Test ${index}`,
    subtitle: 'Adaptive · 98 questions · 2 h 14 min',
    rw1: mod('rw1', 'Section 1, Module 1: Reading and Writing', 'rw', 32, rw1q),
    rw2: {
      easy: mod('rw2', 'Section 1, Module 2: Reading and Writing', 'rw', 32, take(RW_QUESTIONS, 27, 'easy', seed + 3, used)),
      hard: mod('rw2', 'Section 1, Module 2: Reading and Writing', 'rw', 32, take(RW_QUESTIONS, 27, 'hard', seed + 4, used)),
    },
    math1: mod('m1', 'Section 2, Module 1: Math', 'math', 35, m1q),
    math2: {
      easy: mod('m2', 'Section 2, Module 2: Math', 'math', 35, take(mathPool, 22, 'easy', seed + 5, mUsed)),
      hard: mod('m2', 'Section 2, Module 2: Math', 'math', 35, take(mathPool, 22, 'hard', seed + 6, mUsed)),
    },
  }
}

export const PRACTICE_TESTS: PracticeTest[] = [makeTest(1), makeTest(2), makeTest(3)]

const testQuestionIndex = new Map<string, Question>()
for (const t of PRACTICE_TESTS)
  for (const m of [t.rw1, t.rw2.easy, t.rw2.hard, t.math1, t.math2.easy, t.math2.hard])
    for (const q of m.questions) testQuestionIndex.set(q.id, q)
for (const q of ALL_QUESTIONS) testQuestionIndex.set(q.id, q)

export const getQuestion = (id: string) => testQuestionIndex.get(id)

/** Routing threshold: share of Module 1 answered correctly to reach the harder Module 2. */
export const ROUTE_THRESHOLD = 0.6

/**
 * Demo scaling model (placeholder until official conversion tables are supplied).
 * Harder route can reach 800; easier route is capped at 650, as on the real test.
 */
export function scaleSection(p1: number, p2: number, route: 'easy' | 'hard') {
  const w = 0.45 * p1 + 0.55 * p2
  const f = route === 'hard' ? 0.3 + 0.7 * w : 0.75 * w
  return Math.max(200, Math.min(800, Math.round((200 + 600 * f) / 10) * 10))
}

/** Checks a response, accepting equivalent numeric forms for grid-ins (e.g. ".5", "1/2"). */
export function isCorrect(q: Question, answer: string | null | undefined) {
  if (answer == null || answer === '') return false
  if (q.type === 'mcq') return answer === q.answer
  const val = (s: string) => {
    const t = s.trim().replace(/\s+/g, '')
    if (/^-?\d+\/\d+$/.test(t)) {
      const [a, b] = t.split('/').map(Number)
      return b === 0 ? NaN : a / b
    }
    return Number(t)
  }
  const target = [q.answer, ...(q.accepted ?? [])].map(val)
  const v = val(answer)
  return !Number.isNaN(v) && target.some((t) => Math.abs(t - v) < 1e-6)
}
