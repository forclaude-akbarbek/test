import { useMemo } from 'react'
import { DOMAINS, generatedRoster, pairRandom, type RosterStudent } from '../data/schools'
import { WORDS } from '../data/vocab'
import { domainStats, fullAttempts, predictedScore, skillStats } from './analytics'
import { useAppState, type State } from './store'
import type { Assignment, Org, User, UserData } from './types'

const emptyData: UserData = { attempts: [], bq: {}, bookmarks: [], vocab: { mastered: [], learning: [], daily: [] }, plans: [], activity: [] }

/** A real (logged-in) student's record in roster form, computed from their actual practice. */
export function realStudent(u: User, data: UserData = emptyData): RosterStudent {
  const full = fullAttempts(data)
  const last = full[full.length - 1]
  const predicted = predictedScore(data)
  const dStats = domainStats(skillStats(data))
  const domains: Record<string, number> = {}
  for (const d of DOMAINS) domains[d] = Math.round(dStats.find((x) => x.domain === d)?.accuracy ?? 0)
  const lastDay = [...data.activity].sort().pop()
  const lastActiveDays = lastDay ? Math.max(0, Math.floor((Date.now() - new Date(lastDay + 'T12:00:00').getTime()) / 864e5)) : null
  const now = new Date()
  return {
    id: u.id,
    name: u.name,
    grade: u.grade ?? '11',
    classId: u.classId,
    orgId: u.orgId ?? '',
    real: true,
    userId: u.id,
    email: u.email,
    predicted,
    rw: last?.scores.rw ?? null,
    math: last?.scores.math ?? null,
    history: full.map((a) => ({ date: a.startedAt, total: a.scores.total })),
    domains,
    lastActiveDays,
    examsTaken: full.length,
    examsThisMonth: full.filter((a) => {
      const d = new Date(a.startedAt)
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    }).length,
    questionsAnswered: data.attempts.reduce((n, a) => n + a.modules.reduce((m, x) => m + x.responses.length, 0), 0) + Object.keys(data.bq).length,
    targetScore: u.targetScore ?? 1400,
  }
}

/** Everyone in a school: fabricated students plus real accounts the school created. */
export function schoolRoster(st: State, orgId: string): RosterStudent[] {
  const org = st.orgs.find((o) => o.id === orgId)
  if (!org) return []
  const real = st.users.filter((u) => u.role === 'student' && u.orgId === orgId && u.active).map((u) => realStudent(u, st.data[u.id]))
  return [...real, ...generatedRoster(org, st.classes)]
}

export function childSchools(st: State, networkId: string) {
  return st.orgs.filter((o) => o.parentId === networkId)
}

export function useSchoolRoster(orgId: string | undefined) {
  const st = useAppState()
  return useMemo(() => (orgId ? schoolRoster(st, orgId) : []), [st, orgId])
}

/** Assignments that apply to a school: its own plus its network's. */
export function assignmentsForSchool(st: State, org: Org) {
  return st.assignments.filter((a) => a.orgId === org.id || (org.parentId && a.orgId === org.parentId))
}

export function appliesTo(a: Assignment, s: { classId?: string; orgId: string }) {
  if (a.orgId !== s.orgId && a.classIds.length) return false
  return !a.classIds.length || (s.classId != null && a.classIds.includes(s.classId))
}

export interface AssignmentStatus {
  done: boolean
  score?: number
  at?: string
}

/** Whether a student has completed an assignment (real data for real students, fabricated for the rest). */
export function assignmentStatus(st: State, a: Assignment, s: RosterStudent): AssignmentStatus {
  if (s.real && s.userId) {
    const data = st.data[s.userId] ?? emptyData
    const after = data.attempts.filter((x) => x.finishedAt >= a.createdAt)
    if (a.type === 'mock') {
      const hit = after.find((x) => x.kind === 'full' && x.testId === a.testId) ?? after.find((x) => x.kind === 'full')
      return hit ? { done: true, score: hit.scores.total, at: hit.finishedAt } : { done: false }
    }
    if (a.type === 'section') {
      const hit = after.find((x) => x.kind === a.section)
      return hit ? { done: true, score: hit.scores.total, at: hit.finishedAt } : { done: false }
    }
    if (a.type === 'quick') {
      const hit = after.find((x) => x.kind === 'quick' && (!a.skill || x.title.includes(a.skill)))
      if (!hit) return { done: false }
      const rs = hit.modules.flatMap((m) => m.responses)
      return { done: true, score: Math.round((rs.filter((r) => r.correct).length / Math.max(1, rs.length)) * 100), at: hit.finishedAt }
    }
    const list = WORDS.filter((w) => w.list === a.list)
    const mastered = list.filter((w) => data.vocab.mastered.includes(w.word)).length
    return { done: list.length > 0 && mastered / list.length >= 0.6, score: Math.round((mastered / Math.max(1, list.length)) * 100) }
  }
  if (s.lastActiveDays == null) return { done: false }
  // Network mock days are a single sitting: nobody has taken one before the day itself.
  const byNetwork = st.orgs.find((o) => o.id === a.orgId)?.kind === 'network'
  if (byNetwork && new Date(a.due).getTime() > Date.now()) return { done: false }
  const created = new Date(a.createdAt).getTime()
  const due = new Date(a.due).getTime()
  const elapsed = Math.min(1, Math.max(0, (Date.now() - created) / Math.max(1, due - created)))
  const engagement = s.lastActiveDays <= 7 ? 0.93 : s.lastActiveDays <= 14 ? 0.7 : 0.3
  const p = pairRandom(s.id, a.id)
  if (p > engagement * (0.35 + 0.65 * elapsed)) return { done: false }
  const at = new Date(created + (Math.min(Date.now(), due) - created) * pairRandom(a.id, s.id)).toISOString()
  if (a.type === 'mock' || a.type === 'section') {
    const base = a.type === 'section' ? (a.section === 'math' ? s.math : s.rw) : s.predicted
    return { done: true, score: base == null ? undefined : Math.round((base + (p - 0.5) * 60) / 10) * 10, at }
  }
  return { done: true, score: Math.round(Math.min(100, 45 + (s.domains[DOMAINS[0]] ?? 60) * 0.5 + p * 15)), at }
}

export const assignmentLabel: Record<Assignment['type'], string> = {
  mock: 'Full-length mock',
  section: 'Section test',
  quick: 'Practice set',
  vocab: 'Vocabulary',
}

/** Link a student follows to start an assignment. */
export function assignmentHref(a: Assignment) {
  if (a.type === 'mock') return `/exam/${a.testId ?? 'pt1'}?mode=full`
  if (a.type === 'section') return `/exam/${a.testId ?? 'pt1'}?mode=${a.section ?? 'math'}`
  if (a.type === 'quick') return `/exam/quick?mode=quick${a.skill ? `&skill=${encodeURIComponent(a.skill)}` : `&section=${a.section ?? 'mixed'}`}`
  return '/app/vocabulary'
}

export const fmtDue = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

export function relDays(n: number | null) {
  if (n == null) return 'Never'
  if (n === 0) return 'Today'
  if (n === 1) return 'Yesterday'
  return `${n} days ago`
}

/** CSV download helper (works on normal hosting; embedded previews may block downloads). */
export function downloadCsv(filename: string, rows: (string | number | null | undefined)[][]) {
  const esc = (v: string | number | null | undefined) => {
    const s = v == null ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = '﻿' + rows.map((r) => r.map(esc).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
