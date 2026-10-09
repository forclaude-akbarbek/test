import { useSyncExternalStore } from 'react'
import type { Attempt, ModuleResult, Role, StudyPlan, User, UserData } from './types'
import { PRACTICE_TESTS, ROUTE_THRESHOLD, scaleSection } from '../data/tests'
import { ALL_QUESTIONS } from '../data/tests'
import { WORDS } from '../data/vocab'
import { rng } from './rng'

// Demo persistence: everything lives in the browser's localStorage.
// Production will replace this module with API calls; the rest of the app only uses the exported functions.

const KEY = 'hz_state_v1'

interface State {
  users: User[]
  sessionId: string | null
  data: Record<string, UserData>
}

export const FREE_LIMITS = { fullExamsPerMonth: 1, plansPerMonth: 1, dailyWords: 5 }
export const PREMIUM_DAILY_WORDS = 20
export const PRICES = { monthly: 99000, yearly: 790000 }

export const DEMO_ACCOUNTS = [
  { label: 'Student', email: 'student@horizonsat.uz', password: 'demo1234' },
  { label: 'Private school (B2B)', email: 'school@horizonsat.uz', password: 'school1234' },
  { label: 'Government school (B2G)', email: 'gov@horizonsat.uz', password: 'gov1234' },
  { label: 'Admin', email: 'admin@horizonsat.uz', password: 'admin1234' },
]

const uid = () => Math.random().toString(36).slice(2, 10)
export const today = () => new Date().toISOString().slice(0, 10)
const emptyData = (): UserData => ({ attempts: [], bq: {}, bookmarks: [], vocab: { mastered: [], learning: [], daily: [] }, plans: [], activity: [] })

/** Turns raw module results into section and total scores. */
export function scoreModules(modules: ModuleResult[]) {
  const frac = (m?: ModuleResult) => (m && m.responses.length ? m.responses.filter((r) => r.correct).length / m.responses.length : 0)
  const section = (s: 'rw' | 'math') => {
    const mods = modules.filter((m) => m.section === s)
    if (!mods.length) return null
    const m2 = mods[1]
    const route = m2?.route ?? (frac(mods[0]) >= ROUTE_THRESHOLD ? 'hard' : 'easy')
    return scaleSection(frac(mods[0]), m2 ? frac(m2) : frac(mods[0]), route)
  }
  const rw = section('rw')
  const math = section('math')
  return { rw, math, total: (rw ?? 0) + (math ?? 0) }
}

/** Fabricated exam with exact accuracy targets per module, so the demo history shows steady growth. */
function seedAttempt(testIndex: number, date: Date, targets: { rw: [number, number]; math: [number, number] }, seed: number): Attempt {
  const t = PRACTICE_TESTS[testIndex]
  const r = rng(seed)
  const rank = { E: 0, M: 1, H: 2 }
  const answerModule = (key: string, title: string, section: 'rw' | 'math', qs: typeof t.rw1.questions, p: number, route?: 'easy' | 'hard'): ModuleResult => {
    const nCorrect = Math.round(qs.length * p)
    // Easier questions are more likely to be the ones answered correctly.
    const order = [...qs].map((q) => ({ q, k: rank[q.difficulty] + r.next() * 1.6 })).sort((a, b) => a.k - b.k)
    const correctIds = new Set(order.slice(0, nCorrect).map((x) => x.q.id))
    return {
      key, title, section, route,
      responses: qs.map((q) => {
        const correct = correctIds.has(q.id)
        const wrongLetter = 'ABCD'.replace(q.answer, '')[r.int(0, 2)]
        return {
          qid: q.id,
          answer: correct ? q.answer : q.type === 'mcq' ? wrongLetter : String(Number(q.answer) + r.int(1, 5)),
          correct,
          timeSec: Math.round((section === 'rw' ? 55 : 75) * (0.6 + r.next())),
        }
      }),
    }
  }
  const route = (p: number) => (p >= ROUTE_THRESHOLD ? 'hard' : 'easy')
  const rwRoute = route(targets.rw[0])
  const mRoute = route(targets.math[0])
  const modules = [
    answerModule('rw1', t.rw1.title, 'rw', t.rw1.questions, targets.rw[0]),
    answerModule('rw2', t.rw2[rwRoute].title, 'rw', t.rw2[rwRoute].questions, targets.rw[1], rwRoute),
    answerModule('m1', t.math1.title, 'math', t.math1.questions, targets.math[0]),
    answerModule('m2', t.math2[mRoute].title, 'math', t.math2[mRoute].questions, targets.math[1], mRoute),
  ]
  const end = new Date(date.getTime() + 134 * 60000)
  return { id: uid(), testId: t.id, title: t.title, kind: 'full', startedAt: date.toISOString(), finishedAt: end.toISOString(), modules, scores: scoreModules(modules) }
}

function monthsAgo(n: number, day: number) {
  const d = new Date()
  d.setMonth(d.getMonth() - n, day)
  d.setHours(10, 0, 0, 0)
  return d
}

function seed(): State {
  const now = new Date().toISOString()
  const student: User = {
    id: 'u-student', name: 'Dilnoza Karimova', email: DEMO_ACCOUNTS[0].email, password: DEMO_ACCOUNTS[0].password, role: 'student',
    grade: '11', targetScore: 1450, testDate: nextSatDate(), plan: 'free', active: true, createdAt: monthsAgo(4, 2).toISOString(),
  }
  const users: User[] = [
    student,
    { id: 'u-b2b', name: 'Registan Private School', org: 'Registan Private School', email: DEMO_ACCOUNTS[1].email, password: DEMO_ACCOUNTS[1].password, role: 'b2b', plan: 'premium', active: true, createdAt: now },
    { id: 'u-b2g', name: 'Presidential School (demo)', org: 'Presidential School — Namangan (demo)', email: DEMO_ACCOUNTS[2].email, password: DEMO_ACCOUNTS[2].password, role: 'b2g', plan: 'premium', active: true, createdAt: now },
    { id: 'u-admin', name: 'Platform Admin', email: DEMO_ACCOUNTS[3].email, password: DEMO_ACCOUNTS[3].password, role: 'admin', plan: 'premium', active: true, createdAt: now },
  ]
  const d = emptyData()
  d.attempts = [
    seedAttempt(0, monthsAgo(3, 12), { rw: [0.63, 0.5], math: [0.62, 0.45] }, 11),
    seedAttempt(1, monthsAgo(2, 9), { rw: [0.7, 0.58], math: [0.68, 0.55] }, 22),
    seedAttempt(2, monthsAgo(1, 14), { rw: [0.78, 0.66], math: [0.76, 0.64] }, 33),
  ]
  // Some Question Bank history and bookmarks
  const r = rng(77)
  for (const q of r.shuffle(ALL_QUESTIONS).slice(0, 46)) {
    const correct = r.next() < (q.difficulty === 'E' ? 0.85 : q.difficulty === 'M' ? 0.65 : 0.4)
    d.bq[q.id] = { answer: correct ? q.answer : 'X', correct, at: monthsAgo(r.int(0, 2), r.int(1, 27)).toISOString() }
  }
  d.bookmarks = Object.keys(d.bq).slice(0, 6)
  d.vocab.mastered = WORDS.slice(0, 18).map((w) => w.word)
  d.vocab.learning = WORDS.slice(18, 27).map((w) => w.word)
  // A streak of recent activity
  d.activity = Array.from({ length: 6 }, (_, i) => {
    const x = new Date()
    x.setDate(x.getDate() - (i + 1))
    return x.toISOString().slice(0, 10)
  })
  return { users, sessionId: null, data: { [student.id]: d } }
}

/** Next "SAT-like" date: first Saturday of the month at least ~8 weeks out. */
function nextSatDate() {
  const d = new Date()
  d.setDate(d.getDate() + 56)
  d.setDate(1)
  while (d.getDay() !== 6) d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as State
  } catch {
    /* storage unavailable: fall through to fresh seed */
  }
  return seed()
}

let state: State = load()
const listeners = new Set<() => void>()

function commit(next: State) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* ignore quota / private mode */
  }
  listeners.forEach((l) => l())
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useAppState() {
  return useSyncExternalStore(subscribe, () => state)
}

export function useSession() {
  const s = useAppState()
  const user = s.users.find((u) => u.id === s.sessionId) ?? null
  const data = user ? s.data[user.id] ?? emptyData() : emptyData()
  return { user, data }
}

function updateData(userId: string, fn: (d: UserData) => UserData) {
  const cur = state.data[userId] ?? emptyData()
  commit({ ...state, data: { ...state.data, [userId]: fn(cur) } })
}

const sessionUserId = () => {
  if (!state.sessionId) throw new Error('Not signed in')
  return state.sessionId
}

// ── Auth ──
export function login(email: string, password: string): { ok: true; role: Role } | { ok: false; error: string } {
  const u = state.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase())
  if (!u || u.password !== password) return { ok: false, error: 'Incorrect email or password.' }
  if (!u.active) return { ok: false, error: 'This account has been disabled. Please contact your administrator.' }
  commit({ ...state, sessionId: u.id })
  return { ok: true, role: u.role }
}

export function signup(input: { name: string; email: string; password: string; grade: string; targetScore: number; testDate: string }) {
  if (state.users.some((u) => u.email.toLowerCase() === input.email.trim().toLowerCase())) return { ok: false as const, error: 'An account with this email already exists.' }
  const user: User = { id: `u-${uid()}`, ...input, email: input.email.trim(), role: 'student', plan: 'free', active: true, createdAt: new Date().toISOString() }
  commit({ ...state, users: [...state.users, user], sessionId: user.id, data: { ...state.data, [user.id]: emptyData() } })
  return { ok: true as const }
}

export const logout = () => commit({ ...state, sessionId: null })

export function updateProfile(patch: Partial<Pick<User, 'name' | 'grade' | 'targetScore' | 'testDate' | 'plan'>>) {
  const id = sessionUserId()
  commit({ ...state, users: state.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) })
}

// ── Admin ──
export function adminCreateAccount(input: { org: string; email: string; password: string; role: 'b2b' | 'b2g' }) {
  if (state.users.some((u) => u.email.toLowerCase() === input.email.trim().toLowerCase())) return { ok: false as const, error: 'Email already in use.' }
  const user: User = { id: `u-${uid()}`, name: input.org, org: input.org, email: input.email.trim(), password: input.password, role: input.role, plan: 'premium', active: true, createdAt: new Date().toISOString() }
  commit({ ...state, users: [...state.users, user] })
  return { ok: true as const }
}
export const adminSetActive = (id: string, active: boolean) => commit({ ...state, users: state.users.map((u) => (u.id === id ? { ...u, active } : u)) })
export const adminDelete = (id: string) => commit({ ...state, users: state.users.filter((u) => u.id !== id) })

export function resetDemo() {
  const fresh = seed()
  commit({ ...fresh, sessionId: null })
}

// ── Activity / practice ──
export function touchActivity() {
  const id = state.sessionId
  if (!id) return
  const t = today()
  if (state.data[id]?.activity.includes(t)) return
  updateData(id, (d) => ({ ...d, activity: [...d.activity, t] }))
}

export function addAttempt(a: Attempt) {
  const id = sessionUserId()
  updateData(id, (d) => ({ ...d, attempts: [...d.attempts, a], activity: d.activity.includes(today()) ? d.activity : [...d.activity, today()] }))
}

export function answerBank(qid: string, answer: string, correct: boolean) {
  const id = sessionUserId()
  updateData(id, (d) => ({ ...d, bq: { ...d.bq, [qid]: { answer, correct, at: new Date().toISOString() } }, activity: d.activity.includes(today()) ? d.activity : [...d.activity, today()] }))
}

export function toggleBookmark(qid: string) {
  const id = sessionUserId()
  updateData(id, (d) => ({ ...d, bookmarks: d.bookmarks.includes(qid) ? d.bookmarks.filter((x) => x !== qid) : [...d.bookmarks, qid] }))
}

export function setWordStatus(word: string, status: 'mastered' | 'learning' | 'new') {
  const id = sessionUserId()
  updateData(id, (d) => {
    const mastered = d.vocab.mastered.filter((w) => w !== word)
    const learning = d.vocab.learning.filter((w) => w !== word)
    if (status === 'mastered') mastered.push(word)
    if (status === 'learning') learning.push(word)
    return { ...d, vocab: { ...d.vocab, mastered, learning } }
  })
}

/** Today's widget words: picks unseen words once per day and remembers them. */
export function ensureDailyWords(count: number): string[] {
  const id = state.sessionId
  if (!id) return []
  const d = state.data[id] ?? emptyData()
  const t = today()
  const existing = d.vocab.daily.find((x) => x.date === t)
  if (existing && existing.words.length >= count) return existing.words.slice(0, count)
  const seen = new Set([...d.vocab.daily.flatMap((x) => x.words), ...d.vocab.mastered])
  const pool = WORDS.filter((w) => !seen.has(w.word))
  const picked = (pool.length >= count ? pool : WORDS).slice(0, count).map((w) => w.word)
  updateData(id, (cur) => ({ ...cur, vocab: { ...cur.vocab, daily: [...cur.vocab.daily.filter((x) => x.date !== t), { date: t, words: picked }] } }))
  return picked
}

export function addPlan(p: StudyPlan) {
  const id = sessionUserId()
  updateData(id, (d) => ({ ...d, plans: [...d.plans, p] }))
}

export function togglePlanTask(planId: string, key: string) {
  const id = sessionUserId()
  updateData(id, (d) => ({
    ...d,
    plans: d.plans.map((p) => (p.id === planId ? { ...p, done: p.done?.includes(key) ? p.done.filter((k) => k !== key) : [...(p.done ?? []), key] } : p)),
  }))
}

// ── Limits ──
const sameMonth = (iso: string) => {
  const a = new Date(iso), b = new Date()
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}
export function usage(user: User | null, data: UserData) {
  const premium = user?.plan === 'premium'
  const examsUsed = data.attempts.filter((a) => a.kind === 'full' && sameMonth(a.startedAt)).length
  const plansUsed = data.plans.filter((p) => sameMonth(p.createdAt)).length
  return {
    premium,
    examsUsed,
    examsLeft: premium ? Infinity : Math.max(0, FREE_LIMITS.fullExamsPerMonth - examsUsed),
    plansUsed,
    plansLeft: premium ? Infinity : Math.max(0, FREE_LIMITS.plansPerMonth - plansUsed),
    dailyWords: premium ? PREMIUM_DAILY_WORDS : FREE_LIMITS.dailyWords,
  }
}

export function streak(activity: string[]) {
  const set = new Set(activity)
  let n = 0
  const d = new Date()
  if (!set.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1)
  while (set.has(d.toISOString().slice(0, 10))) {
    n++
    d.setDate(d.getDate() - 1)
  }
  return n
}

export { uid }
