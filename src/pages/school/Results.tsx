import { useMemo, useState } from 'react'
import { BarList } from '../../components/Charts'
import { Heatmap, Histogram, SeqLegend, Segmented } from '../../components/ui'
import { DOMAINS, DOMAIN_SHORT, histogram, summarize, type RosterStudent } from '../../data/schools'
import { relDays } from '../../lib/school'
import { PageTitle } from '../portal/Layout'
import { useSchool } from './context'
import { StudentDrawer } from './StudentDrawer'

export default function Results() {
  const { roster, classes, className, org, readOnly } = useSchool()
  const [cls, setCls] = useState('all')
  const [view, setView] = useState<'top' | 'risk'>('top')
  const [open, setOpen] = useState<RosterStudent | null>(null)
  const scope = useMemo(() => (cls === 'all' ? roster : roster.filter((s) => s.classId === cls)), [roster, cls])
  const sum = useMemo(() => summarize(scope), [scope])
  const bins = useMemo(() => histogram(scope), [scope])
  const ranked = scope.filter((s) => s.predicted != null).sort((a, b) => b.predicted! - a.predicted!)
  // At risk: far below target, or inactive with low scores.
  const atRisk = scope
    .filter((s) => s.predicted != null && (s.targetScore - s.predicted! >= 250 || ((s.lastActiveDays ?? 99) > 14 && s.predicted! < 1100)))
    .sort((a, b) => b.targetScore - b.predicted! - (a.targetScore - a.predicted!))

  return (
    <div className="space-y-6">
      <PageTitle
        title="Results"
        sub="How your students are performing across the SAT."
        right={
          <select className="input w-48" value={cls} onChange={(e) => setCls(e.target.value)} aria-label="Class">
            <option value="all">All classes</option>
            {classes.map((c) => <option key={c.id} value={c.id}>Class {c.name}</option>)}
          </select>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="card p-6">
          <div className="font-semibold">Score distribution</div>
          <div className="mb-6 text-xs text-muted">{sum.tested} students tested · median {sum.median ?? '—'}</div>
          <Histogram ariaLabel="Distribution of predicted scores" bins={bins.map((b) => ({ label: `${b.from}–${b.to - 10}`, count: b.count }))} />
        </div>
        <div className="card p-6">
          <div className="mb-4 font-semibold">Accuracy by domain</div>
          <BarList rows={DOMAINS.map((d) => ({ label: d, value: sum.domains[d] })).sort((a, b) => a.value - b.value)} />
        </div>
      </div>
      {cls === 'all' && classes.length > 1 && (
        <div className="card p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-semibold">Classes compared</div>
              <div className="text-xs text-muted">Average accuracy by domain for each class</div>
            </div>
            <SeqLegend />
          </div>
          <Heatmap rowLabel="Class" rows={classes.map((c) => ({ id: c.id, label: c.name }))} cols={DOMAINS} colLabel={(d) => DOMAIN_SHORT[d]} value={(cid, d) => summarize(roster.filter((s) => s.classId === cid)).domains[d]} onRow={(cid) => setCls(cid)} />
        </div>
      )}
      <div className="card overflow-x-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
          <Segmented value={view} onChange={setView} options={[{ value: 'top', label: 'Top students' }, { value: 'risk', label: `At risk (${atRisk.length})` }]} />
          <div className="text-xs text-muted">{view === 'top' ? 'Ranked by predicted score' : 'Far below target, or inactive with low scores'}</div>
        </div>
        <table className="w-full min-w-[600px] text-sm">
          <thead className="bg-ink/[0.03] text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-5 py-3 font-semibold">#</th>
              <th className="px-3 py-3 font-semibold">Student</th>
              <th className="px-3 py-3 font-semibold">Class</th>
              <th className="px-3 py-3 text-right font-semibold">Predicted</th>
              <th className="px-3 py-3 text-right font-semibold">Target</th>
              <th className="px-5 py-3 font-semibold">Last active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {(view === 'top' ? ranked : atRisk).slice(0, 15).map((s, i) => (
              <tr key={s.id} onClick={() => setOpen(s)} className="cursor-pointer hover:bg-sky-soft/40">
                <td className="px-5 py-3 tabular-nums text-muted">{i + 1}</td>
                <td className="px-3 py-3 font-medium">{s.name}</td>
                <td className="px-3 py-3 text-muted">{className(s.classId)}</td>
                <td className="px-3 py-3 text-right font-semibold tabular-nums">{s.predicted}</td>
                <td className={`px-3 py-3 text-right tabular-nums ${view === 'risk' ? 'text-bad' : 'text-muted'}`}>{s.targetScore}</td>
                <td className="px-5 py-3 text-muted">{relDays(s.lastActiveDays)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <StudentDrawer student={open} org={org} onClose={() => setOpen(null)} readOnly={readOnly} />
    </div>
  )
}
