import { AlertTriangle, ArrowRight, TrendingUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { LineChart } from '../../components/Charts'
import { Histogram, Progress, Stat } from '../../components/ui'
import { DOMAINS, histogram, monthlyTrend, summarize, type RosterStudent } from '../../data/schools'
import { appliesTo, assignmentStatus, assignmentsForSchool, fmtDue, relDays } from '../../lib/school'
import { seatsUsed, useSession } from '../../lib/store'
import { PageTitle } from '../portal/Layout'
import { useSchool } from './context'
import { StudentDrawer } from './StudentDrawer'

const greeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

export default function SchoolOverview({ embedded }: { embedded?: boolean }) {
  const { org, roster, classes, base, state, readOnly, teacherId } = useSchool()
  const { user } = useSession()
  const [open, setOpen] = useState<RosterStudent | null>(null)
  const sum = useMemo(() => summarize(roster), [roster])
  const trend = useMemo(() => monthlyTrend(roster), [roster])
  const bins = useMemo(() => histogram(roster), [roster])
  const used = seatsUsed(org.id, state)
  const upcoming = assignmentsForSchool(state, org)
    .filter((a) => new Date(a.due).getTime() > Date.now() - 864e5 * 7)
    .sort((a, b) => a.due.localeCompare(b.due))
    .slice(0, 4)
  const inactive = roster.filter((s) => s.lastActiveDays == null || s.lastActiveDays > 14).sort((a, b) => (b.lastActiveDays ?? 99) - (a.lastActiveDays ?? 99))
  const improvers = roster
    .filter((s) => s.history.length > 1)
    .map((s) => ({ s, g: s.history[s.history.length - 1].total - s.history[0].total }))
    .sort((a, b) => b.g - a.g)
    .slice(0, 5)
  const weakest = [...DOMAINS].sort((a, b) => sum.domains[a] - sum.domains[b])[0]

  return (
    <div className="space-y-6">
      {!embedded && (
        <PageTitle
          title={readOnly ? org.name : `${greeting()}, ${user?.name.split(' ')[0]}.`}
          sub={teacherId ? `Your classes at ${org.name}: ${classes.map((c) => c.name).join(', ') || 'none assigned yet'}` : `${org.name} · ${org.city}`}
        />
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label="Students" value={sum.students} note={teacherId ? `${classes.length} classes` : `${used} of ${org.seats} seats used`} />
        <Stat label="Average score" value={sum.avg ?? '—'} note={sum.avgRw ? `R&W ${sum.avgRw} · Math ${sum.avgMath}` : undefined} />
        <Stat label="Active this week" value={`${sum.students ? Math.round((sum.active7 / sum.students) * 100) : 0}%`} note={`${sum.active7} students`} />
        <Stat label="Took a mock this month" value={`${Math.round(sum.participation * 100)}%`} />
        <Stat label="Average growth" value={sum.growth != null ? `+${sum.growth}` : '—'} note="Points since first mock" tone={sum.growth && sum.growth > 0 ? 'good' : undefined} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-6">
          <div className="font-semibold">Average predicted score</div>
          <div className="mb-4 text-xs text-muted">Last 6 months, all students with at least one mock</div>
          <LineChart ariaLabel="Average predicted score by month" labels={trend.map((t) => t.label)} series={[{ name: 'Average', color: 'var(--viz-1)', values: trend.map((t) => t.value) }]} />
        </div>
        <div className="card p-6">
          <div className="font-semibold">Score distribution</div>
          <div className="mb-6 text-xs text-muted">
            Students by predicted total · {sum.above1400} at 1400 or above
          </div>
          <Histogram ariaLabel="Distribution of predicted scores" bins={bins.map((b) => ({ label: `${b.from}–${b.to - 10}`, count: b.count }))} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div className="font-semibold">Assignments</div>
            <Link to={`${base}/assignments`} className="text-sm font-semibold text-sky">All assignments</Link>
          </div>
          <div className="space-y-4">
            {upcoming.map((a) => {
              const targets = roster.filter((s) => appliesTo(a, s))
              const done = targets.filter((s) => assignmentStatus(state, a, s).done).length
              const pct = targets.length ? (done / targets.length) * 100 : 0
              const past = new Date(a.due).getTime() < Date.now()
              return (
                <Link key={a.id} to={`${base}/assignments/${a.id}`} className="block rounded-2xl border border-line p-4 transition hover:border-sky">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{a.title}</div>
                      <div className="text-xs text-muted">
                        {past ? 'Closed' : 'Due'} {fmtDue(a.due)} · {a.orgId === org.parentId ? 'From the network' : a.classIds.length ? a.classIds.map((id) => classes.find((c) => c.id === id)?.name ?? '').filter(Boolean).join(', ') || 'Selected classes' : 'Whole school'}
                      </div>
                    </div>
                    <div className="text-right tabular-nums">
                      <div className="font-semibold">{Math.round(pct)}%</div>
                      <div className="text-xs text-muted">{done}/{targets.length}</div>
                    </div>
                  </div>
                  <div className="mt-3"><Progress value={pct} tone={past && pct < 70 ? 'warn' : undefined} /></div>
                </Link>
              )
            })}
            {!upcoming.length && <div className="text-sm text-muted">No current assignments.</div>}
          </div>
        </div>
        <div className="space-y-4">
          <div className="card p-6">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle size={16} className="text-warn" /> Needs attention
            </div>
            <div className="mt-1 text-xs text-muted">{inactive.length} students inactive for 2+ weeks</div>
            <div className="mt-3 divide-y divide-line">
              {inactive.slice(0, 4).map((s) => (
                <button key={s.id} onClick={() => setOpen(s)} className="flex w-full items-center justify-between py-2 text-left text-sm hover:text-sky">
                  <span className="truncate">{s.name}</span>
                  <span className="shrink-0 text-xs text-muted">{relDays(s.lastActiveDays)}</span>
                </button>
              ))}
            </div>
            <Link to={`${base}/students?status=inactive`} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-sky">
              View all <ArrowRight size={14} />
            </Link>
            <div className="mt-4 rounded-xl bg-ink/[0.04] p-3 text-xs">
              Weakest domain: <b>{weakest}</b> ({Math.round(sum.domains[weakest])}% accuracy)
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center gap-2 font-semibold">
              <TrendingUp size={16} className="text-good" /> Top improvers
            </div>
            <div className="mt-3 divide-y divide-line">
              {improvers.map(({ s, g }) => (
                <button key={s.id} onClick={() => setOpen(s)} className="flex w-full items-center justify-between py-2 text-left text-sm hover:text-sky">
                  <span className="truncate">{s.name}</span>
                  <span className="shrink-0 text-xs font-semibold text-good tabular-nums">+{g}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="border-b border-line bg-ink/[0.03] text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-5 py-3 font-semibold">Class</th>
              <th className="px-5 py-3 text-right font-semibold">Students</th>
              <th className="px-5 py-3 text-right font-semibold">Average</th>
              <th className="px-5 py-3 text-right font-semibold">Active this week</th>
              <th className="px-5 py-3 text-right font-semibold">≥ 1400</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {classes.map((c) => {
              const cs = summarize(roster.filter((s) => s.classId === c.id))
              return (
                <tr key={c.id} className="hover:bg-ink/[0.02]">
                  <td className="px-5 py-3 font-medium">
                    <Link to={`${base}/classes/${c.id}`} className="hover:text-sky">{c.name}</Link>
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">{cs.students}</td>
                  <td className="px-5 py-3 text-right font-semibold tabular-nums">{cs.avg ?? '—'}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{cs.students ? Math.round((cs.active7 / cs.students) * 100) : 0}%</td>
                  <td className="px-5 py-3 text-right tabular-nums">{cs.above1400}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <StudentDrawer student={open} org={org} onClose={() => setOpen(null)} readOnly={readOnly} />
    </div>
  )
}
