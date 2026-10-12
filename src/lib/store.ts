import { useSyncExternalStore } from 'react'
import type { Assignment, Attempt, ModuleResult, Org, SchoolClass, StudyPlan, Teacher, User, UserData } from './types'
import { GOV_DEMO_ID, NETWORK_ID, PRIVATE_ID, loginFor, seedOrgs, tempPassword } from '../data/schools'
import { PRACTICE_TESTS, ROUTE_THRESHOLD, scaleSection } from '../data/tests'
import { ALL_QUESTIONS } from '../data/tests'
import { WORDS } from '../data/vocab'
import { rng } from './rng'

// Demo persistence: everything lives in the browser's localStorage.
// Production will replace this module with API calls; the rest of the app only uses the exported functions.

const KEY = 'hz_state_v2'

export interface State {
  users: User[]
  orgs: Org[]
  classes: SchoolClass[]
  teachers: Teacher[]
  assignments: Assignment[]
  /** Students shortlisted by the network (talent pool), by roster id. */
  shortlist: string[]
  sessionId: string | null
  data: Record<string, UserData>
}

export const FREE_LIMITS = { fullExamsPerMonth: 1, plansPerMonth: 1, dailyWords: 5 }
export const PREMIUM_DAILY_WORDS = 20
export const PRICES = { monthly: 99000, yearly: 790000 }

export const DEMO_ACCOUNTS = [
  { label: 'Student', note: 'Independent learner, Free plan', email: 'student@horizonsat.uz', password: 'demo1234' },
  { label: 'School student', note: 'Registan Private School, 11-A', email: 'jasur@horizonsat.uz', password: 'jasur1234' },
  { label: 'Teacher', note: 'Registan Private School', email: 'teacher@horizonsat.uz', password: 'teacher1234' },
  { label: 'Private school (B2B)', note: 'Director, Registan Private School', email: 'school@horizonsat.uz', password: 'school1234' },
  { label: 'Government school (B2G)', note: 'Tashkent Presidential School', email: 'gov.school@horizonsat.uz', password: 'govschool1234' },
  { label: 'Government network (B2G)', note: 'State Specialized Schools Network', email: 'gov@horizonsat.uz', password: 'gov1234' },
  { label: 'Admin', note: 'Horizon SAT platform team', email: 'admin@horizonsat.uz', password: 'admin1234' },
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

function daysFromNow(n: number) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  d.setHours(18, 0, 0, 0)
  return d.toISOString()
}

function seed(): State {
  const now = new Date().toISOString()
  const { orgs, classes, teachers } = seedOrgs(now)
  const acct = (i: number) => ({ email: DEMO_ACCOUNTS[i].email, password: DEMO_ACCOUNTS[i].password })
  const student: User = {
    id: 'u-student', name: 'Dilnoza Karimova', ...acct(0), role: 'student',
    grade: '11', targetScore: 1450, testDate: nextSatDate(), plan: 'free', active: true, createdAt: monthsAgo(4, 2).toISOString(),
  }
  const jasur: User = {
    id: 'u-jasur', name: 'Jasur Toshmatov', ...acct(1), role: 'student', grade: '11', targetScore: 1400, testDate: nextSatDate(),
    plan: 'premium', active: true, createdAt: monthsAgo(3, 1).toISOString(), orgId: PRIVATE_ID, classId: `${PRIVATE_ID}-c3`,
  }
  const teacherRec = teachers.find((t) => t.id === `${PRIVATE_ID}-t0`)!
  teacherRec.userId = 'u-teacher'
  const users: User[] = [
    student,
    jasur,
    { id: 'u-teacher', name: teacherRec.name, ...acct(2), role: 'teacher', orgId: PRIVATE_ID, teacherId: teacherRec.id, plan: 'premium', active: true, createdAt: now },
    { id: 'u-b2b', name: 'Shavkat Rahimov', org: 'Registan Private School', ...acct(3), role: 'b2b', orgId: PRIVATE_ID, plan: 'premium', active: true, createdAt: now },
    { id: 'u-b2g-school', name: 'Malika Yusupova', org: 'Tashkent Presidential School', ...acct(4), role: 'b2g', orgId: GOV_DEMO_ID, plan: 'premium', active: true, createdAt: now },
    { id: 'u-b2g', name: 'Programme Office', org: 'State Specialized Schools Network', ...acct(5), role: 'b2g', orgId: NETWORK_ID, plan: 'premium', active: true, createdAt: now },
    { id: 'u-admin', name: 'Platform Admin', ...acct(6), role: 'admin', plan: 'premium', active: true, createdAt: now },
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

  const dj = emptyData()
  dj.attempts = [
    seedAttempt(0, monthsAgo(2, 18), { rw: [0.66, 0.52], math: [0.7, 0.56] }, 44),
    seedAttempt(1, monthsAgo(1, 20), { rw: [0.72, 0.6], math: [0.76, 0.62] }, 55),
  ]
  dj.vocab.mastered = WORDS.slice(30, 40).map((w) => w.word)
  dj.activity = [1, 2, 4].map((n) => {
    const x = new Date()
    x.setDate(x.getDate() - n)
    return x.toISOString().slice(0, 10)
  })

  const assignments: Assignment[] = [
    { id: 'a-oct-mock', orgId: PRIVATE_ID, classIds: [], title: 'Monthly mock exam', type: 'mock', testId: 'pt2', due: daysFromNow(5), createdAt: daysFromNow(-9), createdBy: 'u-b2b' },
    { id: 'a-transitions', orgId: PRIVATE_ID, classIds: [`${PRIVATE_ID}-c3`, `${PRIVATE_ID}-c4`], title: 'Transitions practice set', type: 'quick', section: 'rw', skill: 'Transitions', due: daysFromNow(-2), createdAt: daysFromNow(-12), createdBy: 'u-teacher' },
    { id: 'a-vocab', orgId: PRIVATE_ID, classIds: [], title: 'Vocabulary: Tone & Attitude', type: 'vocab', list: 'Tone & Attitude', due: daysFromNow(7), createdAt: daysFromNow(-3), createdBy: 'u-teacher' },
    { id: 'a-math-section', orgId: GOV_DEMO_ID, classIds: [], title: 'Math section test', type: 'section', testId: 'pt1', section: 'math', due: daysFromNow(4), createdAt: daysFromNow(-6), createdBy: 'u-b2g-school' },
    { id: 'a-national-oct', orgId: NETWORK_ID, classIds: [], title: 'Regional Mock Day — October', type: 'mock', testId: 'pt1', due: daysFromNow(-6), createdAt: daysFromNow(-24), createdBy: 'u-b2g' },
    { id: 'a-national-nov', orgId: NETWORK_ID, classIds: [], title: 'National Mock Day — November', type: 'mock', testId: 'pt3', due: daysFromNow(21), createdAt: daysFromNow(-2), createdBy: 'u-b2g' },
  ]

  return { users, orgs, classes, teachers, assignments, shortlist: [], sessionId: null, data: { [student.id]: d, [jasur.id]: dj } }
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
    if (raw) {
      const parsed = JSON.parse(raw) as State
      if (Array.isArray(parsed.orgs) && Array.isArray(parsed.assignments)) return parsed
    }
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
export function orgOf(user: User | null | undefined, st: State = state) {
  return user?.orgId ? st.orgs.find((o) => o.id === user.orgId) : undefined
}

/** Where each account lands after signing in. */
export function homePath(user: User, st: State = state) {
  if (user.mustChangePassword) return '/welcome'
  if (user.role === 'student') return '/app'
  if (user.role === 'admin') return '/admin'
  if (user.role === 'b2g' && orgOf(user, st)?.kind === 'network') return '/network'
  return '/school'
}

const MAX_ATTEMPTS = 5
const LOCK_SECONDS = 60

export function login(email: string, password: string): { ok: true; path: string } | { ok: false; error: string } {
  const u = state.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase())
  if (!u) return { ok: false, error: 'Incorrect email or password.' }
  if (u.lockedUntil && new Date(u.lockedUntil).getTime() > Date.now()) {
    const secs = Math.ceil((new Date(u.lockedUntil).getTime() - Date.now()) / 1000)
    return { ok: false, error: `Too many failed attempts. Try again in ${secs} seconds.` }
  }
  if (u.password !== password) {
    const failed = (u.failedLogins ?? 0) + 1
    const locked = failed >= MAX_ATTEMPTS
    commit({
      ...state,
      users: state.users.map((x) => (x.id === u.id ? { ...x, failedLogins: locked ? 0 : failed, lockedUntil: locked ? new Date(Date.now() + LOCK_SECONDS * 1000).toISOString() : undefined } : x)),
    })
    if (locked) return { ok: false, error: `Too many failed attempts. For your security, sign-in is paused for ${LOCK_SECONDS} seconds.` }
    const left = MAX_ATTEMPTS - failed
    return { ok: false, error: `Incorrect email or password.${left <= 2 ? ` ${left} attempt${left === 1 ? '' : 's'} left before sign-in is paused.` : ''}` }
  }
  if (!u.active) return { ok: false, error: 'This account has been disabled. Please contact your administrator.' }
  const org = orgOf(u)
  if (org && new Date(org.licenseUntil).getTime() < Date.now()) return { ok: false, error: `${org.name}'s licence has expired. Please contact Horizon SAT.` }
  const updated = { ...u, failedLogins: 0, lockedUntil: undefined, lastLogin: new Date().toISOString() }
  commit({ ...state, users: state.users.map((x) => (x.id === u.id ? updated : x)), sessionId: u.id })
  return { ok: true, path: homePath(updated) }
}

export function signup(input: { name: string; email: string; password: string; grade: string; targetScore: number; testDate: string }) {
  if (state.users.some((u) => u.email.toLowerCase() === input.email.trim().toLowerCase())) return { ok: false as const, error: 'An account with this email already exists. Try logging in instead.' }
  const user: User = { id: `u-${uid()}`, ...input, email: input.email.trim(), role: 'student', plan: 'free', active: true, createdAt: new Date().toISOString(), lastLogin: new Date().toISOString() }
  commit({ ...state, users: [...state.users, user], sessionId: user.id, data: { ...state.data, [user.id]: emptyData() } })
  return { ok: true as const }
}

export const logout = () => commit({ ...state, sessionId: null })

export function updateProfile(patch: Partial<Pick<User, 'name' | 'grade' | 'targetScore' | 'testDate' | 'plan'>>) {
  const id = sessionUserId()
  commit({ ...state, users: state.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) })
}

export function passwordProblem(pw: string) {
  if (pw.length < 8) return 'Use at least 8 characters.'
  if (!/[a-zA-Z]/.test(pw) || !/[0-9]/.test(pw)) return 'Use both letters and numbers.'
  return null
}

export function changePassword(current: string, next: string): { ok: true } | { ok: false; error: string } {
  const id = sessionUserId()
  const u = state.users.find((x) => x.id === id)!
  if (!u.mustChangePassword && u.password !== current) return { ok: false, error: 'Your current password is incorrect.' }
  const problem = passwordProblem(next)
  if (problem) return { ok: false, error: problem }
  if (next === u.password) return { ok: false, error: 'Choose a password different from your current one.' }
  commit({ ...state, users: state.users.map((x) => (x.id === id ? { ...x, password: next, mustChangePassword: false } : x)) })
  return { ok: true }
}

/** Demo version of "forgot password": always answers the same way so it never reveals which emails exist. */
export function requestPasswordReset(email: string) {
  const u = state.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase())
  return { schoolManaged: !!u && u.role !== 'student' ? true : !!u?.orgId }
}

// ── Schools ──
function setUsers(fn: (u: User[]) => User[]) {
  commit({ ...state, users: fn(state.users) })
}

export function seatsUsed(orgId: string, st: State = state) {
  const org = st.orgs.find((o) => o.id === orgId)
  return (org?.generated ?? 0) + st.users.filter((u) => u.role === 'student' && u.orgId === orgId).length
}

export interface IssuedLogin {
  name: string
  email: string
  password: string
  className?: string
}

export function createStudents(orgId: string, entries: { name: string; classId?: string; email?: string }[]): { ok: true; logins: IssuedLogin[] } | { ok: false; error: string } {
  const org = state.orgs.find((o) => o.id === orgId)
  if (!org) return { ok: false, error: 'School not found.' }
  const clean = entries.map((e) => ({ ...e, name: e.name.trim().replace(/\s+/g, ' ') })).filter((e) => e.name)
  if (!clean.length) return { ok: false, error: 'Add at least one student name.' }
  const free = org.seats - seatsUsed(orgId)
  if (clean.length > free) return { ok: false, error: `Your licence has ${free} free seat${free === 1 ? '' : 's'}, but you're adding ${clean.length} students. Remove some names or contact Horizon SAT for more seats.` }
  const taken = new Set(state.users.map((u) => u.email.toLowerCase()))
  const logins: IssuedLogin[] = []
  const newUsers: User[] = clean.map((e) => {
    let email = (e.email?.trim() || loginFor(e.name, org)).toLowerCase()
    let n = 2
    const base = email
    while (taken.has(email)) email = base.replace('@', `${n++}@`)
    taken.add(email)
    const password = tempPassword()
    const cls = state.classes.find((c) => c.id === e.classId)
    logins.push({ name: e.name, email, password, className: cls?.name })
    return {
      id: `u-${uid()}`, name: e.name, email, password, role: 'student', orgId, classId: e.classId, grade: cls?.grade ?? '11',
      targetScore: 1400, plan: 'premium', active: true, mustChangePassword: true, createdAt: new Date().toISOString(),
    }
  })
  commit({ ...state, users: [...state.users, ...newUsers], data: { ...state.data, ...Object.fromEntries(newUsers.map((u) => [u.id, emptyData()])) } })
  return { ok: true, logins }
}

export function resetUserPassword(userId: string): IssuedLogin | null {
  const u = state.users.find((x) => x.id === userId)
  if (!u) return null
  const password = tempPassword()
  setUsers((us) => us.map((x) => (x.id === userId ? { ...x, password, mustChangePassword: true, failedLogins: 0, lockedUntil: undefined } : x)))
  return { name: u.name, email: u.email, password }
}

export const moveStudent = (userId: string, classId: string) => setUsers((us) => us.map((u) => (u.id === userId ? { ...u, classId, grade: state.classes.find((c) => c.id === classId)?.grade ?? u.grade } : u)))
export const removeStudentFromSchool = (userId: string) => setUsers((us) => us.map((u) => (u.id === userId ? { ...u, orgId: undefined, classId: undefined, plan: 'free' } : u)))

export function createClass(orgId: string, name: string, grade: string, teacherId?: string) {
  const exists = state.classes.some((c) => c.orgId === orgId && c.name.toLowerCase() === name.trim().toLowerCase())
  if (exists) return { ok: false as const, error: `A class named ${name.trim()} already exists.` }
  commit({ ...state, classes: [...state.classes, { id: `${orgId}-c-${uid()}`, orgId, name: name.trim(), grade, teacherId }] })
  return { ok: true as const }
}
export const updateClass = (id: string, patch: Partial<SchoolClass>) => commit({ ...state, classes: state.classes.map((c) => (c.id === id ? { ...c, ...patch } : c)) })

export function createTeacher(orgId: string, input: { name: string; email?: string; subject: Teacher['subject'] }): { ok: true; login: IssuedLogin } | { ok: false; error: string } {
  const org = state.orgs.find((o) => o.id === orgId)
  if (!org || !input.name.trim()) return { ok: false, error: 'Enter the teacher\'s name.' }
  const email = (input.email?.trim() || loginFor(input.name, org)).toLowerCase()
  if (state.users.some((u) => u.email.toLowerCase() === email)) return { ok: false, error: 'That email already has an account.' }
  const id = `${orgId}-t-${uid()}`
  const userId = `u-${uid()}`
  const password = tempPassword()
  commit({
    ...state,
    teachers: [...state.teachers, { id, orgId, name: input.name.trim(), email, subject: input.subject, userId }],
    users: [...state.users, { id: userId, name: input.name.trim(), email, password, role: 'teacher', orgId, teacherId: id, plan: 'premium', active: true, mustChangePassword: true, createdAt: new Date().toISOString() }],
  })
  return { ok: true, login: { name: input.name.trim(), email, password } }
}

export function removeTeacher(id: string) {
  const t = state.teachers.find((x) => x.id === id)
  commit({
    ...state,
    teachers: state.teachers.filter((x) => x.id !== id),
    classes: state.classes.map((c) => (c.teacherId === id ? { ...c, teacherId: undefined } : c)),
    users: state.users.map((u) => (t?.userId && u.id === t.userId ? { ...u, active: false } : u)),
  })
}

export function createAssignment(a: Omit<Assignment, 'id' | 'createdAt' | 'createdBy'>) {
  const id = `a-${uid()}`
  commit({ ...state, assignments: [...state.assignments, { ...a, id, createdAt: new Date().toISOString(), createdBy: sessionUserId() }] })
  return id
}
export const deleteAssignment = (id: string) => commit({ ...state, assignments: state.assignments.filter((a) => a.id !== id) })

export const updateOrg = (id: string, patch: Partial<Pick<Org, 'name' | 'city'>>) => commit({ ...state, orgs: state.orgs.map((o) => (o.id === id ? { ...o, ...patch } : o)) })

export const toggleShortlist = (rosterId: string) =>
  commit({ ...state, shortlist: state.shortlist.includes(rosterId) ? state.shortlist.filter((x) => x !== rosterId) : [...state.shortlist, rosterId] })

/** Creates a login for a school that already exists in the network. */
export function createSchoolLogin(orgId: string, name: string, email: string): { ok: true; login: IssuedLogin } | { ok: false; error: string } {
  const org = state.orgs.find((o) => o.id === orgId)
  if (!org) return { ok: false, error: 'School not found.' }
  if (!name.trim() || !email.trim()) return { ok: false, error: 'Enter the person\'s name and email.' }
  if (state.users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) return { ok: false, error: 'That email already has an account.' }
  const password = tempPassword()
  const user: User = {
    id: `u-${uid()}`, name: name.trim(), org: org.name, email: email.trim().toLowerCase(), password, role: org.kind === 'private' ? 'b2b' : 'b2g',
    orgId, plan: 'premium', active: true, mustChangePassword: true, createdAt: new Date().toISOString(),
  }
  commit({ ...state, users: [...state.users, user] })
  return { ok: true, login: { name: user.name, email: user.email, password } }
}

// ── Admin ──
export function adminCreateOrg(input: {
  kind: Org['kind']
  name: string
  region: string
  city: string
  seats: number
  parentId?: string
  contactName: string
  email: string
}): { ok: true; login: IssuedLogin } | { ok: false; error: string } {
  if (!input.name.trim()) return { ok: false, error: 'Enter the organization name.' }
  if (state.users.some((u) => u.email.toLowerCase() === input.email.trim().toLowerCase())) return { ok: false, error: 'That email already has an account.' }
  const id = `org-${uid()}`
  const until = new Date()
  until.setFullYear(until.getFullYear() + 1)
  const org: Org = {
    id, name: input.name.trim(), kind: input.kind, tier: input.kind === 'network' ? 'network' : input.kind === 'private' ? 'private' : 'specialized',
    region: input.region, city: input.city.trim() || input.region, parentId: input.kind === 'government' ? input.parentId : undefined,
    seats: input.seats, licenseUntil: until.toISOString().slice(0, 10), createdAt: new Date().toISOString(), generated: 0, seed: Math.floor(Math.random() * 1e6), level: 0.5,
  }
  const classes: SchoolClass[] = input.kind === 'network' ? [] : ['9-A', '10-A', '11-A'].map((g) => ({ id: `${id}-c-${uid()}`, orgId: id, name: g, grade: g.split('-')[0] }))
  const password = tempPassword()
  const user: User = {
    id: `u-${uid()}`, name: input.contactName.trim() || input.name.trim(), org: org.name, email: input.email.trim().toLowerCase(), password,
    role: input.kind === 'private' ? 'b2b' : 'b2g', orgId: id, plan: 'premium', active: true, mustChangePassword: true, createdAt: new Date().toISOString(),
  }
  commit({ ...state, orgs: [...state.orgs, org], classes: [...state.classes, ...classes], users: [...state.users, user] })
  return { ok: true, login: { name: user.name, email: user.email, password } }
}
export const adminSetActive = (id: string, active: boolean) => commit({ ...state, users: state.users.map((u) => (u.id === id ? { ...u, active } : u)) })
export const adminDelete = (id: string) => commit({ ...state, users: state.users.filter((u) => u.id !== id) })

export function resetDemo() {
  const fresh = seed()
  commit({ ...fresh, sessionId: null })
}

/** Read-only snapshot for non-hook callers (e.g. route guards). */
export const getState = () => state

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
