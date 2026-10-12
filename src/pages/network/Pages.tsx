import { ArrowLeft, CalendarDays, Download, KeyRound, Plus, Search, Star } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useParams } from 'react-router-dom'
import { PasswordForm } from '../../components/PasswordForm'
import { RegionMap } from '../../components/RegionMap'
import { Empty, IssuedLogins, Modal, Progress, Segmented, Stat } from '../../components/ui'
import { DOMAINS, REGIONS, type RosterStudent } from '../../data/schools'
import { PRACTICE_TESTS } from '../../data/tests'
import { appliesTo, assignmentStatus, downloadCsv, fmtDue, relDays } from '../../lib/school'
import { createSchoolLogin, deleteAssignment, toggleShortlist, useSession, type IssuedLogin } from '../../lib/store'
import { PageTitle } from '../portal/Layout'
import { NewAssignment } from '../school/Assignments'
import { SchoolProvider } from '../school/context'
import { StudentDrawer } from '../school/StudentDrawer'
import { useNetwork, type SchoolRow } from './data'

const tierLabel = (t?: string) => (t === 'presidential' ? 'Presidential' : t === 'specialized' ? 'Specialized' : t === 'private' ? 'Private' : '—')

function SchoolTable({ rows }: { rows: SchoolRow[] }) {
  const [sort, setSort] = useState<'avg' | 'name' | 'students' | 'active' | 'growth'>('avg')
  const sorted = [...rows].sort((a, b) => {
    if (sort === 'name') return a.org.name.localeCompare(b.org.name)
    if (sort === 'students') return b.sum.students - a.sum.students
    if (sort === 'active') return b.sum.active7 / Math.max(1, b.sum.students) - a.sum.active7 / Math.max(1, a.sum.students)
    if (sort === 'growth') return (b.sum.growth ?? 0) - (a.sum.growth ?? 0)
    return (b.sum.avg ?? 0) - (a.sum.avg ?? 0)
  })
  const th = (key: typeof sort, label: string, right = true) => (
    <th className={`px-3 py-3 font-semibold ${right ? 'text-right' : ''}`}>
      <button onClick={() => setSort(key)} className={`uppercase tracking-wide ${sort === key ? 'text-ink' : ''}`} aria-pressed={sort === key}>
        {label}
        {sort === key ? ' ↓' : ''}
      </button>
    </th>
  )
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <thead className="border-b border-line bg-ink/[0.03] text-left text-xs text-muted">
          <tr>
            <th className="px-5 py-3 font-semibold">
              <button onClick={() => setSort('name')} className={`uppercase tracking-wide ${sort === 'name' ? 'text-ink' : ''}`}>School{sort === 'name' ? ' ↓' : ''}</button>
            </th>
            <th className="px-3 py-3 font-semibold uppercase tracking-wide">Region</th>
            {th('students', 'Students')}
            {th('avg', 'Average')}
            {th('active', 'Active')}
            {th('growth', 'Growth')}
            <th className="px-5 py-3 text-right font-semibold uppercase tracking-wide">1400+</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {sorted.map((s) => (
            <tr key={s.org.id} className="hover:bg-sky-soft/40">
              <td className="px-5 py-3">
                <Link to={`/network/schools/${s.org.id}`} className="font-medium hover:text-sky">{s.org.name}</Link>
                <div className="text-xs text-muted">{tierLabel(s.org.tier)}</div>
              </td>
              <td className="px-3 py-3 text-muted">{s.org.region}</td>
              <td className="px-3 py-3 text-right tabular-nums">{s.sum.students}</td>
              <td className="px-3 py-3 text-right font-semibold tabular-nums">{s.sum.avg ?? '—'}</td>
              <td className="px-3 py-3 text-right tabular-nums">{Math.round((s.sum.active7 / Math.max(1, s.sum.students)) * 100)}%</td>
              <td className="px-3 py-3 text-right tabular-nums text-good">{s.sum.growth != null ? `+${s.sum.growth}` : '—'}</td>
              <td className="px-5 py-3 text-right tabular-nums">{s.sum.above1400}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Regions() {
  const { regions } = useNetwork()
  const values = Object.fromEntries(regions.map((r) => [r.name, { avg: r.sum.avg, students: r.sum.students, schools: r.schools.length }]))
  const [sel, setSel] = useState<string | undefined>()
  const sorted = [...regions].sort((a, b) => (b.sum.avg ?? 0) - (a.sum.avg ?? 0))
  return (
    <div className="space-y-6">
      <PageTitle title="Regions" sub="Compare all 14 regions. Select one to see its schools." />
      <div className="card p-6">
        <RegionMap values={values} onSelect={setSel} selected={sel} />
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-line bg-ink/[0.03] text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-5 py-3 font-semibold">#</th>
              <th className="px-3 py-3 font-semibold">Region</th>
              <th className="px-3 py-3 text-right font-semibold">Schools</th>
              <th className="px-3 py-3 text-right font-semibold">Students</th>
              <th className="px-3 py-3 text-right font-semibold">Average</th>
              <th className="px-3 py-3 text-right font-semibold">Active</th>
              <th className="px-3 py-3 text-right font-semibold">Mock this month</th>
              <th className="px-5 py-3 text-right font-semibold">1400+</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {sorted.map((r, i) => (
              <tr key={r.name} className={`hover:bg-sky-soft/40 ${sel === r.name ? 'bg-sky-soft/50' : ''}`}>
                <td className="px-5 py-3 tabular-nums text-muted">{i + 1}</td>
                <td className="px-3 py-3 font-medium">
                  <Link to={`/network/regions/${encodeURIComponent(r.name)}`} className="hover:text-sky">{r.name}</Link>
                </td>
                <td className="px-3 py-3 text-right tabular-nums">{r.schools.length}</td>
                <td className="px-3 py-3 text-right tabular-nums">{r.sum.students.toLocaleString('en-US')}</td>
                <td className="px-3 py-3 text-right font-semibold tabular-nums">{r.sum.avg ?? '—'}</td>
                <td className="px-3 py-3 text-right tabular-nums">{Math.round((r.sum.active7 / Math.max(1, r.sum.students)) * 100)}%</td>
                <td className="px-3 py-3 text-right tabular-nums">{Math.round(r.sum.participation * 100)}%</td>
                <td className="px-5 py-3 text-right tabular-nums">{r.sum.above1400}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function RegionDetail() {
  const { name = '' } = useParams()
  const { regions } = useNetwork()
  const r = regions.find((x) => x.name === decodeURIComponent(name))
  if (!r) return <Empty icon={Search} title="Region not found" />
  return (
    <div className="space-y-6">
      <Link to="/network/regions" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft size={15} /> All regions</Link>
      <PageTitle title={r.name} sub={`${r.schools.length} schools · ${r.sum.students.toLocaleString('en-US')} students · centre: ${r.city}`} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Average score" value={r.sum.avg ?? '—'} note={`R&W ${r.sum.avgRw ?? '—'} · Math ${r.sum.avgMath ?? '—'}`} />
        <Stat label="Active this week" value={`${Math.round((r.sum.active7 / Math.max(1, r.sum.students)) * 100)}%`} />
        <Stat label="Average growth" value={r.sum.growth != null ? `+${r.sum.growth}` : '—'} tone="good" />
        <Stat label="Scoring 1400+" value={r.sum.above1400} />
      </div>
      <SchoolTable rows={r.schools} />
    </div>
  )
}

export function Schools() {
  const { schools } = useNetwork()
  const [q, setQ] = useState('')
  const [region, setRegion] = useState('all')
  const [tier, setTier] = useState('all')
  const rows = schools.filter((s) => (region === 'all' || s.org.region === region) && (tier === 'all' || s.org.tier === tier) && (!q || s.org.name.toLowerCase().includes(q.toLowerCase())))
  return (
    <div>
      <PageTitle title="Schools" sub={`${schools.length} schools in the network. Open any school to see its dashboard.`} />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input className="input pl-10" placeholder="Search schools" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search schools" />
        </div>
        <select className="input sm:w-56" value={region} onChange={(e) => setRegion(e.target.value)} aria-label="Region">
          <option value="all">All regions</option>
          {REGIONS.map((r) => <option key={r.name}>{r.name}</option>)}
        </select>
        <select className="input sm:w-44" value={tier} onChange={(e) => setTier(e.target.value)} aria-label="School type">
          <option value="all">All types</option>
          <option value="presidential">Presidential</option>
          <option value="specialized">Specialized</option>
        </select>
      </div>
      {rows.length ? <SchoolTable rows={rows} /> : <Empty icon={Search} title="No schools match" />}
    </div>
  )
}

/** A network user viewing one school's dashboard, read-only. */
export function SchoolView() {
  const { orgId } = useParams()
  const { schools } = useNetwork()
  const row = schools.find((s) => s.org.id === orgId)
  if (!row) return <Empty icon={Search} title="School not found" action={<Link to="/network/schools" className="btn-primary">All schools</Link>} />
  const base = `/network/schools/${row.org.id}`
  const tabs = [
    { to: base, label: 'Overview', end: true },
    { to: `${base}/students`, label: 'Students' },
    { to: `${base}/classes`, label: 'Classes' },
    { to: `${base}/assignments`, label: 'Assignments' },
    { to: `${base}/results`, label: 'Results' },
  ]
  return (
    <SchoolProvider value={{ org: row.org, readOnly: true, base }}>
      <Link to="/network/schools" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft size={15} /> All schools</Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-sm text-muted">{tierLabel(row.org.tier)} · {row.org.region}</div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{row.org.name}</h1>
        </div>
      </div>
      <div className="my-6 flex gap-1 overflow-x-auto border-b border-line">
        {tabs.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => `whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition ${isActive ? 'border-sky text-sky-deep dark:text-sky' : 'border-transparent text-muted hover:text-ink'}`}>
            {t.label}
          </NavLink>
        ))}
      </div>
      <Outlet />
    </SchoolProvider>
  )
}

export function Talent() {
  const { students, schools, state } = useNetwork()
  const [min, setMin] = useState(1400)
  const [region, setRegion] = useState('all')
  const [grade, setGrade] = useState('all')
  const [onlyShort, setOnlyShort] = useState(false)
  const [open, setOpen] = useState<RosterStudent | null>(null)
  const schoolOf = (id: string) => schools.find((s) => s.org.id === id)?.org
  const rows = useMemo(
    () =>
      students
        .filter((s) => s.predicted != null && s.predicted >= min && (grade === 'all' || s.grade === grade) && (region === 'all' || schoolOf(s.orgId)?.region === region) && (!onlyShort || state.shortlist.includes(s.id)))
        .sort((a, b) => b.predicted! - a.predicted!),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [students, min, region, grade, onlyShort, state.shortlist],
  )
  const openOrg = open ? schoolOf(open.orgId) : undefined
  return (
    <div>
      <PageTitle
        title="Talent pool"
        sub="Top-scoring students across the network, for scholarships, olympiads and international programmes."
        right={
          <button
            onClick={() => downloadCsv('Talent pool.csv', [['Name', 'School', 'Region', 'Grade', 'Predicted', 'R&W', 'Math', 'Shortlisted'], ...rows.map((s) => [s.name, schoolOf(s.orgId)?.name, schoolOf(s.orgId)?.region, s.grade, s.predicted, s.rw, s.math, state.shortlist.includes(s.id) ? 'Yes' : ''])])}
            className="btn-outline"
          >
            <Download size={16} /> Export
          </button>
        }
      />
      <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center">
        <select className="input lg:w-48" value={min} onChange={(e) => setMin(Number(e.target.value))} aria-label="Minimum score">
          {[1300, 1350, 1400, 1450, 1500].map((m) => <option key={m} value={m}>Score {m}+</option>)}
        </select>
        <select className="input lg:w-56" value={region} onChange={(e) => setRegion(e.target.value)} aria-label="Region">
          <option value="all">All regions</option>
          {REGIONS.map((r) => <option key={r.name}>{r.name}</option>)}
        </select>
        <select className="input lg:w-40" value={grade} onChange={(e) => setGrade(e.target.value)} aria-label="Grade">
          <option value="all">All grades</option>
          {['9', '10', '11'].map((g) => <option key={g} value={g}>Grade {g}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm lg:ml-2">
          <input type="checkbox" className="h-4 w-4 accent-sky-500" checked={onlyShort} onChange={(e) => setOnlyShort(e.target.checked)} /> Shortlisted only ({state.shortlist.length})
        </label>
      </div>
      <div className="mb-3 text-sm text-muted">{rows.length} students</div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-line bg-ink/[0.03] text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-5 py-3 font-semibold">#</th>
              <th className="px-3 py-3 font-semibold">Student</th>
              <th className="px-3 py-3 font-semibold">School</th>
              <th className="px-3 py-3 font-semibold">Grade</th>
              <th className="px-3 py-3 text-right font-semibold">Predicted</th>
              <th className="px-3 py-3 text-right font-semibold">R&W</th>
              <th className="px-3 py-3 text-right font-semibold">Math</th>
              <th className="px-5 py-3 text-right font-semibold">Shortlist</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.slice(0, 100).map((s, i) => {
              const o = schoolOf(s.orgId)
              const on = state.shortlist.includes(s.id)
              return (
                <tr key={s.id} className="hover:bg-sky-soft/40">
                  <td className="px-5 py-3 tabular-nums text-muted">{i + 1}</td>
                  <td className="px-3 py-3">
                    <button onClick={() => setOpen(s)} className="font-medium hover:text-sky">{s.name}</button>
                  </td>
                  <td className="px-3 py-3">
                    <div className="truncate">{o?.name}</div>
                    <div className="text-xs text-muted">{o?.region}</div>
                  </td>
                  <td className="px-3 py-3 tabular-nums">{s.grade}</td>
                  <td className="px-3 py-3 text-right font-semibold tabular-nums">{s.predicted}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-muted">{s.rw}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-muted">{s.math}</td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => toggleShortlist(s.id)} className={`grid h-8 w-8 place-items-center rounded-full transition ${on ? 'text-warn' : 'text-muted hover:text-ink'}`} aria-pressed={on} aria-label={on ? `Remove ${s.name} from shortlist` : `Shortlist ${s.name}`}>
                      <Star size={16} className={on ? 'fill-warn' : ''} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {rows.length > 100 && <div className="border-t border-line p-3 text-center text-xs text-muted">Showing the top 100. Export to see all {rows.length}.</div>}
      </div>
      {openOrg && <StudentDrawer student={open} org={openOrg} onClose={() => setOpen(null)} readOnly />}
    </div>
  )
}

export function MockDays() {
  const { network, students, regions, state } = useNetwork()
  const [creating, setCreating] = useState(false)
  const [confirm, setConfirm] = useState<string | null>(null)
  const days = state.assignments.filter((a) => a.orgId === network.id).sort((a, b) => b.due.localeCompare(a.due))
  return (
    <div>
      <PageTitle title="Mock days" sub="Schedule one full-length mock for every school in the network and follow participation by region." right={<button onClick={() => setCreating(true)} className="btn-primary"><Plus size={16} /> Schedule mock day</button>} />
      {days.length ? (
        <div className="space-y-4">
          {days.map((a) => {
            const past = new Date(a.due).getTime() < Date.now()
            const byRegion = regions.map((r) => {
              const rs = r.roster.filter((s) => appliesTo(a, s))
              const st = rs.map((s) => assignmentStatus(state, a, s))
              const done = st.filter((x) => x.done)
              const scores = done.map((x) => x.score).filter((x): x is number => x != null)
              return { name: r.name, n: rs.length, done: done.length, avg: scores.length ? Math.round(scores.reduce((x, y) => x + y, 0) / scores.length / 10) * 10 : null }
            })
            const done = byRegion.reduce((n, r) => n + r.done, 0)
            return (
              <div key={a.id} className="card p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-lg font-semibold">{a.title}</span>
                      <span className={`chip ${past ? 'bg-ink/5 text-muted' : 'bg-sky-soft text-sky-deep dark:text-sky'}`}>{past ? 'Completed' : 'Scheduled'}</span>
                    </div>
                    <div className="mt-1 text-sm text-muted">
                      {PRACTICE_TESTS.find((t) => t.id === a.testId)?.title} · {past ? 'held' : 'on'} {fmtDue(a.due)} · all {students.length.toLocaleString('en-US')} students
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      {past || done ? (
                        <>
                          <div className="text-2xl font-bold tabular-nums">{Math.round((done / Math.max(1, students.length)) * 100)}%</div>
                          <div className="text-xs text-muted">{done.toLocaleString('en-US')} sat</div>
                        </>
                      ) : (
                        <>
                          <div className="text-2xl font-bold tabular-nums">{Math.max(0, Math.ceil((new Date(a.due).getTime() - Date.now()) / 864e5))} days</div>
                          <div className="text-xs text-muted">until the mock day</div>
                        </>
                      )}
                    </div>
                    {!past &&
                      (confirm === a.id ? (
                        <button onClick={() => deleteAssignment(a.id)} onBlur={() => setConfirm(null)} className="chip bg-bad text-white" autoFocus>Confirm cancel</button>
                      ) : (
                        <button onClick={() => setConfirm(a.id)} className="btn-ghost px-3 text-sm text-bad">Cancel</button>
                      ))}
                  </div>
                </div>
                <div className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                  {byRegion.map((r) => (
                    <div key={r.name} className="text-sm">
                      <div className="mb-1 flex justify-between gap-2">
                        <span className="truncate">{r.name}</span>
                        <span className="shrink-0 tabular-nums text-muted">
                          {Math.round((r.done / Math.max(1, r.n)) * 100)}%{r.avg ? ` · avg ${r.avg}` : ''}
                        </span>
                      </div>
                      <Progress value={(r.done / Math.max(1, r.n)) * 100} />
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <Empty icon={CalendarDays} title="No mock days yet" body="Schedule one to test every student in the network on the same day." />
      )}
      {creating && <NewAssignment onClose={() => setCreating(false)} network={{ orgId: network.id }} />}
    </div>
  )
}

export function NetworkReports() {
  const { schools, regions, students, network } = useNetwork()
  const stamp = new Date().toISOString().slice(0, 10)
  const items = [
    {
      t: 'Regional summary',
      d: 'Schools, students, averages, activity and 1400+ counts for all 14 regions.',
      run: () => downloadCsv(`${network.name} — regions ${stamp}.csv`, [['Region', 'Schools', 'Students', 'Average', 'R&W', 'Math', 'Active this week', 'Mock this month %', '1400+'], ...regions.map((r) => [r.name, r.schools.length, r.sum.students, r.sum.avg, r.sum.avgRw, r.sum.avgMath, r.sum.active7, Math.round(r.sum.participation * 100), r.sum.above1400])]),
    },
    {
      t: 'School results',
      d: 'Every school with its type, region, average score, growth and activity.',
      run: () => downloadCsv(`${network.name} — schools ${stamp}.csv`, [['School', 'Type', 'Region', 'Students', 'Average', 'Growth', 'Active this week', '1400+'], ...schools.map((s) => [s.org.name, tierLabel(s.org.tier), s.org.region, s.sum.students, s.sum.avg, s.sum.growth, s.sum.active7, s.sum.above1400])]),
    },
    {
      t: 'Domain accuracy by school',
      d: 'Accuracy in all eight SAT domains for every school.',
      run: () => downloadCsv(`${network.name} — domains ${stamp}.csv`, [['School', 'Region', ...DOMAINS], ...schools.map((s) => [s.org.name, s.org.region, ...DOMAINS.map((d) => Math.round(s.sum.domains[d]))])]),
    },
    {
      t: 'All students',
      d: `${students.length.toLocaleString('en-US')} students with school, grade, scores and last activity.`,
      run: () => downloadCsv(`${network.name} — students ${stamp}.csv`, [['Name', 'School', 'Region', 'Grade', 'Predicted', 'R&W', 'Math', 'Last active'], ...students.map((s) => {
        const o = schools.find((x) => x.org.id === s.orgId)?.org
        return [s.name, o?.name, o?.region, s.grade, s.predicted, s.rw, s.math, relDays(s.lastActiveDays)]
      })]),
    },
  ]
  return (
    <div>
      <PageTitle title="Reports" sub="Download network data for ministry reporting." />
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((e) => (
          <div key={e.t} className="card flex items-start justify-between gap-4 p-5">
            <div>
              <div className="font-semibold">{e.t}</div>
              <div className="mt-1 text-sm text-muted">{e.d}</div>
            </div>
            <button onClick={e.run} className="btn-outline shrink-0"><Download size={16} /> CSV</button>
          </div>
        ))}
      </div>
    </div>
  )
}

export function NetworkSettings() {
  const { schools, state } = useNetwork()
  const { user } = useSession()
  const [tab, setTab] = useState<'accounts' | 'me'>('accounts')
  const [creating, setCreating] = useState<string | null>(null)
  return (
    <div>
      <PageTitle title="Settings" />
      <div className="mb-5">
        <Segmented value={tab} onChange={setTab} options={[{ value: 'accounts', label: 'School accounts' }, { value: 'me', label: 'Your account' }]} />
      </div>
      {tab === 'accounts' ? (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-line bg-ink/[0.03] text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3 font-semibold">School</th>
                <th className="px-3 py-3 font-semibold">Administrators</th>
                <th className="px-3 py-3 text-right font-semibold">Seats</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {schools.map((s) => {
                const admins = state.users.filter((u) => u.orgId === s.org.id && (u.role === 'b2g' || u.role === 'b2b'))
                return (
                  <tr key={s.org.id}>
                    <td className="px-5 py-3">
                      <div className="font-medium">{s.org.name}</div>
                      <div className="text-xs text-muted">{s.org.region}</div>
                    </td>
                    <td className="px-3 py-3">{admins.length ? admins.map((a) => <div key={a.id} className="text-xs"><span className="font-medium">{a.name}</span> <span className="text-muted">{a.email}</span></div>) : <span className="text-muted">No login yet</span>}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{s.sum.students} / {s.org.seats}</td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => setCreating(s.org.id)} className="btn-ghost px-3 py-1.5 text-xs"><KeyRound size={14} /> Add login</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card max-w-lg p-6">
          <div className="text-sm text-muted">{user?.name} · <span className="select-all">{user?.email}</span></div>
          <div className="mt-5"><PasswordForm /></div>
        </div>
      )}
      {creating && <AddSchoolLogin orgId={creating} onClose={() => setCreating(null)} />}
    </div>
  )
}

function AddSchoolLogin({ orgId, onClose }: { orgId: string; onClose: () => void }) {
  const { schools } = useNetwork()
  const org = schools.find((s) => s.org.id === orgId)?.org
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [err, setErr] = useState('')
  const [login, setLogin] = useState<IssuedLogin | null>(null)
  return (
    <Modal open onClose={onClose} title={login ? 'Login created' : `Add a login for ${org?.name}`} wide={!!login}>
      {login ? (
        <>
          <IssuedLogins logins={[login]} filename="school-login.csv" />
          <button onClick={onClose} className="btn-primary mt-6 w-full">Done</button>
        </>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const r = createSchoolLogin(orgId, name, email)
            if (!r.ok) return setErr(r.error)
            setLogin(r.login)
          }}
          className="space-y-4"
        >
          <div>
            <label className="label" htmlFor="sl-name">Administrator's name</label>
            <input id="sl-name" className="input" required value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="label" htmlFor="sl-email">Email</label>
            <input id="sl-email" type="email" className="input" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="director@school.uz" />
          </div>
          {err && <div className="rounded-xl bg-bad/10 px-4 py-3 text-sm text-bad">{err}</div>}
          <button className="btn-primary w-full py-3">Create login</button>
        </form>
      )}
    </Modal>
  )
}
