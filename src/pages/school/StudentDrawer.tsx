import { Check, KeyRound, Mail, UserMinus, X } from 'lucide-react'
import { useState } from 'react'
import { BarList, LineChart } from '../../components/Charts'
import { Drawer, IssuedLogins, StatusPill } from '../../components/ui'
import { DOMAINS, type RosterStudent } from '../../data/schools'
import { fmtDate } from '../../lib/analytics'
import { assignmentStatus, assignmentsForSchool, appliesTo, fmtDue, relDays } from '../../lib/school'
import { moveStudent, removeStudentFromSchool, resetUserPassword, useAppState, type IssuedLogin } from '../../lib/store'
import type { Org } from '../../lib/types'

export function StudentDrawer({ student, org, onClose, readOnly }: { student: RosterStudent | null; org: Org; onClose: () => void; readOnly?: boolean }) {
  const st = useAppState()
  const [issued, setIssued] = useState<IssuedLogin | null>(null)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const s = student
  const classes = st.classes.filter((c) => c.orgId === org.id)
  const assignments = s ? assignmentsForSchool(st, org).filter((a) => appliesTo(a, s)) : []

  return (
    <Drawer open={!!s} onClose={() => { setIssued(null); setConfirmRemove(false); onClose() }} label="Student details">
      {s && (
        <div className="space-y-6 p-6 sm:p-8">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill days={s.lastActiveDays} />
              {s.real && <span className="chip bg-sky-soft text-sky-deep dark:text-sky">Has login</span>}
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight">{s.name}</h2>
            <div className="mt-1 text-sm text-muted">
              Class {classes.find((c) => c.id === s.classId)?.name ?? '—'} · Last active {relDays(s.lastActiveDays).toLowerCase()}
            </div>
            {s.email && (
              <div className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                <Mail size={14} /> <span className="select-all">{s.email}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ['Predicted', s.predicted ?? '—'],
              ['Target', s.targetScore],
              ['R&W', s.rw ?? '—'],
              ['Math', s.math ?? '—'],
            ].map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-ink/[0.04] p-3">
                <div className="text-xs text-muted">{k}</div>
                <div className="text-xl font-bold tabular-nums">{v}</div>
              </div>
            ))}
          </div>

          {s.history.length > 1 && (
            <div>
              <div className="mb-2 font-semibold">Score history</div>
              <LineChart ariaLabel={`${s.name} score history`} labels={s.history.map((h) => fmtDate(h.date, { month: 'short', day: 'numeric' }))} series={[{ name: 'Total', color: 'var(--viz-1)', values: s.history.map((h) => h.total) }]} yMin={400} yMax={1600} height={200} />
            </div>
          )}

          <div>
            <div className="mb-3 font-semibold">Accuracy by domain</div>
            {s.examsTaken || s.questionsAnswered ? (
              <BarList rows={DOMAINS.map((d) => ({ label: d, value: s.domains[d] ?? 0 }))} />
            ) : (
              <div className="text-sm text-muted">No practice yet.</div>
            )}
          </div>

          <div>
            <div className="mb-3 font-semibold">Assignments</div>
            <div className="divide-y divide-line rounded-2xl border border-line">
              {assignments.map((a) => {
                const status = assignmentStatus(st, a, s)
                return (
                  <div key={a.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{a.title}</div>
                      <div className="text-xs text-muted">Due {fmtDue(a.due)}</div>
                    </div>
                    {status.done ? (
                      <span className="chip shrink-0 bg-good/15 text-good">
                        <Check size={12} /> Done{status.score != null ? ` · ${status.score}${a.type === 'quick' || a.type === 'vocab' ? '%' : ''}` : ''}
                      </span>
                    ) : new Date(a.due).getTime() < Date.now() ? (
                      <span className="chip shrink-0 bg-bad/15 text-bad">
                        <X size={12} /> Missed
                      </span>
                    ) : (
                      <span className="chip shrink-0 bg-ink/5 text-muted">Not started</span>
                    )}
                  </div>
                )
              })}
              {!assignments.length && <div className="px-4 py-3 text-sm text-muted">No assignments yet.</div>}
            </div>
          </div>

          {!readOnly && s.real && s.userId && (
            <div className="space-y-4 border-t border-line pt-6">
              <div className="font-semibold">Manage account</div>
              <div>
                <label className="label" htmlFor="move-class">Class</label>
                <select id="move-class" className="input" value={s.classId ?? ''} onChange={(e) => moveStudent(s.userId!, e.target.value)}>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              {issued ? (
                <IssuedLogins logins={[issued]} filename={`${s.name}-login.csv`} />
              ) : (
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setIssued(resetUserPassword(s.userId!))} className="btn-outline">
                    <KeyRound size={16} /> Reset password
                  </button>
                  {confirmRemove ? (
                    <button onClick={() => { removeStudentFromSchool(s.userId!); onClose() }} onBlur={() => setConfirmRemove(false)} className="btn bg-bad text-white hover:bg-bad/90" autoFocus>
                      Confirm: remove from school
                    </button>
                  ) : (
                    <button onClick={() => setConfirmRemove(true)} className="btn-ghost text-bad">
                      <UserMinus size={16} /> Remove from school
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Drawer>
  )
}
