import { ArrowRight } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BarList, LineChart } from '../../components/Charts'
import { RegionMap } from '../../components/RegionMap'
import { Histogram, Progress, Stat } from '../../components/ui'
import { DOMAINS, histogram, monthlyTrend } from '../../data/schools'
import { appliesTo, assignmentStatus, fmtDue } from '../../lib/school'
import { PageTitle } from '../portal/Layout'
import { useNetwork } from './data'

export default function NetworkOverview() {
  const { network, schools, students, total, regions, state } = useNetwork()
  const nav = useNavigate()
  const trend = useMemo(() => monthlyTrend(students), [students])
  const bins = useMemo(() => histogram(students), [students])
  const mapValues = Object.fromEntries(regions.map((r) => [r.name, { avg: r.sum.avg, students: r.sum.students, schools: r.schools.length }]))
  const ranked = [...schools].filter((s) => s.sum.avg != null).sort((a, b) => b.sum.avg! - a.sum.avg!)
  const mockDays = state.assignments.filter((a) => a.orgId === network.id).sort((a, b) => b.due.localeCompare(a.due)).slice(0, 2)
  const first = trend.find((t) => t.value != null)?.value
  const last = trend[trend.length - 1]?.value

  return (
    <div className="space-y-6">
      <PageTitle title={network.name} sub={`${schools.length} schools in ${regions.filter((r) => r.schools.length).length} regions · updated ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label="Students" value={total.students.toLocaleString('en-US')} note={`${schools.length} schools`} />
        <Stat label="Average score" value={total.avg ?? '—'} note={first && last ? `${last - first >= 0 ? '+' : ''}${last - first} in 6 months` : undefined} tone={first && last && last > first ? 'good' : undefined} />
        <Stat label="Active this week" value={`${Math.round((total.active7 / Math.max(1, total.students)) * 100)}%`} note={`${total.active7.toLocaleString('en-US')} students`} />
        <Stat label="Took a mock this month" value={`${Math.round(total.participation * 100)}%`} />
        <Stat label="Scoring 1400+" value={total.above1400.toLocaleString('en-US')} note={`${Math.round((total.above1400 / Math.max(1, total.tested)) * 100)}% of tested students`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="card min-w-0 p-6">
          <div className="mb-1 font-semibold">Average score by region</div>
          <div className="mb-4 text-xs text-muted">Select a region to see its schools</div>
          <RegionMap values={mapValues} onSelect={(r) => nav(`/network/regions/${encodeURIComponent(r)}`)} />
        </div>
        <div className="card p-6">
          <div className="font-semibold">Network average</div>
          <div className="mb-4 text-xs text-muted">Average predicted score, last 6 months</div>
          <LineChart ariaLabel="Network average score by month" labels={trend.map((t) => t.label)} series={[{ name: 'Average', color: 'var(--viz-1)', values: trend.map((t) => t.value) }]} height={220} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <div className="font-semibold">Score distribution</div>
          <div className="mb-6 text-xs text-muted">{total.tested.toLocaleString('en-US')} students with at least one mock · median {total.median}</div>
          <Histogram ariaLabel="Distribution of predicted scores across the network" bins={bins.map((b) => ({ label: `${b.from}–${b.to - 10}`, count: b.count }))} />
        </div>
        <div className="card p-6">
          <div className="mb-4 font-semibold">Accuracy by domain</div>
          <BarList rows={DOMAINS.map((d) => ({ label: d, value: total.domains[d] })).sort((a, b) => a.value - b.value)} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="font-semibold">Schools by average score</div>
            <Link to="/network/schools" className="text-sm font-semibold text-sky">All schools</Link>
          </div>
          <div className="grid gap-x-6 sm:grid-cols-2">
            {[['Highest', ranked.slice(0, 5)], ['Lowest', ranked.slice(-5).reverse()]].map(([label, rows]) => (
              <div key={label as string}>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">{label as string}</div>
                <div className="divide-y divide-line">
                  {(rows as typeof ranked).map((s) => (
                    <Link key={s.org.id} to={`/network/schools/${s.org.id}`} className="flex items-center justify-between gap-3 py-2 text-sm hover:text-sky">
                      <span className="truncate">{s.org.name}</span>
                      <span className="font-semibold tabular-nums">{s.sum.avg}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="font-semibold">Mock days</div>
            <Link to="/network/mock-days" className="text-sm font-semibold text-sky">Manage</Link>
          </div>
          <div className="space-y-4">
            {mockDays.map((a) => {
              const done = students.filter((s) => appliesTo(a, s) && assignmentStatus(state, a, s).done).length
              const pct = (done / Math.max(1, students.length)) * 100
              const past = new Date(a.due).getTime() < Date.now()
              return (
                <Link key={a.id} to="/network/mock-days" className="block rounded-2xl border border-line p-4 transition hover:border-sky">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <div>
                      <div className="font-semibold">{a.title}</div>
                      <div className="text-xs text-muted">{past ? 'Held' : 'Scheduled for'} {fmtDue(a.due)}</div>
                    </div>
                    <div className="text-right tabular-nums">
                      <div className="font-semibold">{past || done ? `${Math.round(pct)}%` : `in ${Math.max(0, Math.ceil((new Date(a.due).getTime() - Date.now()) / 864e5))} days`}</div>
                      <div className="text-xs text-muted">{past || done ? `${done.toLocaleString('en-US')} sat` : `${students.length.toLocaleString('en-US')} students`}</div>
                    </div>
                  </div>
                  <div className="mt-3"><Progress value={pct} /></div>
                </Link>
              )
            })}
          </div>
          <Link to="/network/talent" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-sky">
            See the talent pool <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}
