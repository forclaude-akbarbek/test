import { Download, Search, Upload, UserPlus, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Empty, IssuedLogins, Modal, StatusPill } from '../../components/ui'
import type { RosterStudent } from '../../data/schools'
import { downloadCsv, relDays } from '../../lib/school'
import { createStudents, seatsUsed, type IssuedLogin } from '../../lib/store'
import { PageTitle } from '../portal/Layout'
import { useSchool } from './context'
import { StudentDrawer } from './StudentDrawer'

type Status = 'all' | 'active' | 'slowing' | 'inactive' | 'none'
type Sort = 'name' | 'score-desc' | 'score-asc' | 'growth' | 'recent'

const statusOf = (s: RosterStudent): Status => (s.lastActiveDays == null ? 'none' : s.lastActiveDays <= 7 ? 'active' : s.lastActiveDays <= 14 ? 'slowing' : 'inactive')

export default function Students({ embedded }: { embedded?: boolean }) {
  const { org, roster, classes, className, readOnly, state, teacherId } = useSchool()
  const [params] = useSearchParams()
  const [q, setQ] = useState('')
  const [cls, setCls] = useState('all')
  const [status, setStatus] = useState<Status>((params.get('status') as Status) || 'all')
  const [sort, setSort] = useState<Sort>('name')
  const [shown, setShown] = useState(40)
  const [open, setOpen] = useState<RosterStudent | null>(null)
  const [adding, setAdding] = useState<'one' | 'bulk' | null>(null)

  const list = useMemo(() => {
    const growth = (s: RosterStudent) => (s.history.length > 1 ? s.history[s.history.length - 1].total - s.history[0].total : -999)
    return roster
      .filter((s) => (cls === 'all' || s.classId === cls) && (status === 'all' || statusOf(s) === status) && (!q || s.name.toLowerCase().includes(q.toLowerCase())))
      .sort((a, b) => {
        if (sort === 'score-desc') return (b.predicted ?? -1) - (a.predicted ?? -1)
        if (sort === 'score-asc') return (a.predicted ?? 9999) - (b.predicted ?? 9999)
        if (sort === 'growth') return growth(b) - growth(a)
        if (sort === 'recent') return (a.lastActiveDays ?? 999) - (b.lastActiveDays ?? 999)
        return a.name.localeCompare(b.name)
      })
  }, [roster, cls, status, q, sort])

  const used = seatsUsed(org.id, state)
  const exportCsv = () =>
    downloadCsv(`${org.name} students.csv`, [
      ['Name', 'Class', 'Predicted', 'R&W', 'Math', 'Target', 'Mocks taken', 'Last active', 'Login'],
      ...list.map((s) => [s.name, className(s.classId), s.predicted, s.rw, s.math, s.targetScore, s.examsTaken, relDays(s.lastActiveDays), s.email ?? '']),
    ])

  return (
    <div>
      {!embedded && (
        <PageTitle
          title="Students"
          sub={teacherId ? `${roster.length} students in your classes` : `${roster.length} students · ${used} of ${org.seats} licence seats used`}
          right={
            !readOnly && !teacherId ? (
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setAdding('bulk')} className="btn-outline"><Upload size={16} /> Import list</button>
                <button onClick={() => setAdding('one')} className="btn-primary"><UserPlus size={16} /> Add student</button>
              </div>
            ) : undefined
          }
        />
      )}
      <div className="mb-4 flex flex-col gap-2 lg:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input className="input pl-10" placeholder="Search students" value={q} onChange={(e) => { setQ(e.target.value); setShown(40) }} aria-label="Search students" />
        </div>
        <div className="grid grid-cols-3 gap-2 lg:flex">
          <select className="input lg:w-36" value={cls} onChange={(e) => setCls(e.target.value)} aria-label="Class">
            <option value="all">All classes</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="input lg:w-40" value={status} onChange={(e) => setStatus(e.target.value as Status)} aria-label="Status">
            <option value="all">Any status</option>
            <option value="active">Active (7 days)</option>
            <option value="slowing">Slowing (8–14 days)</option>
            <option value="inactive">Inactive (14+ days)</option>
            <option value="none">Not started</option>
          </select>
          <select className="input lg:w-44" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort">
            <option value="name">Sort: Name</option>
            <option value="score-desc">Highest score</option>
            <option value="score-asc">Lowest score</option>
            <option value="growth">Most improved</option>
            <option value="recent">Recently active</option>
          </select>
        </div>
        <button onClick={exportCsv} className="btn-ghost shrink-0"><Download size={16} /> CSV</button>
      </div>

      {list.length ? (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-line bg-ink/[0.03] text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3 font-semibold">Student</th>
                <th className="px-3 py-3 font-semibold">Class</th>
                <th className="px-3 py-3 text-right font-semibold">Predicted</th>
                <th className="px-3 py-3 text-right font-semibold">R&W</th>
                <th className="px-3 py-3 text-right font-semibold">Math</th>
                <th className="px-3 py-3 text-right font-semibold">Mocks</th>
                <th className="px-3 py-3 font-semibold">Last active</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.slice(0, shown).map((s) => (
                <tr key={s.id} onClick={() => setOpen(s)} className="cursor-pointer transition hover:bg-sky-soft/40">
                  <td className="px-5 py-3">
                    <button className="text-left font-medium hover:text-sky" onClick={(e) => { e.stopPropagation(); setOpen(s) }}>{s.name}</button>
                    {s.real && <span className="ml-2 chip bg-sky-soft px-2 py-0.5 text-[10px] text-sky-deep dark:text-sky">Login</span>}
                  </td>
                  <td className="px-3 py-3 text-muted">{className(s.classId)}</td>
                  <td className="px-3 py-3 text-right font-semibold tabular-nums">{s.predicted ?? '—'}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-muted">{s.rw ?? '—'}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-muted">{s.math ?? '—'}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-muted">{s.examsTaken}</td>
                  <td className="px-3 py-3 text-muted">{relDays(s.lastActiveDays)}</td>
                  <td className="px-5 py-3"><StatusPill days={s.lastActiveDays} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {shown < list.length && (
            <div className="border-t border-line p-3 text-center">
              <button onClick={() => setShown(shown + 40)} className="btn-ghost">Show more ({list.length - shown} left)</button>
            </div>
          )}
        </div>
      ) : (
        <Empty icon={Users} title="No students match" body="Try a different class, status or search." />
      )}

      <StudentDrawer student={open ? roster.find((x) => x.id === open.id) ?? null : null} org={org} onClose={() => setOpen(null)} readOnly={readOnly} />
      {adding && <AddStudents mode={adding} onClose={() => setAdding(null)} />}
    </div>
  )
}

function AddStudents({ mode, onClose }: { mode: 'one' | 'bulk'; onClose: () => void }) {
  const { org, classes, state } = useSchool()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [classId, setClassId] = useState(classes[0]?.id ?? '')
  const [text, setText] = useState('')
  const [err, setErr] = useState('')
  const [logins, setLogins] = useState<IssuedLogin[] | null>(null)
  const free = org.seats - seatsUsed(org.id, state)

  const parsed = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [n, c] = line.split(/[,;\t]/).map((x) => x.trim())
      const match = c ? classes.find((k) => k.name.toLowerCase() === c.toLowerCase()) : undefined
      return { name: n, classId: match?.id ?? classId, unknownClass: !!c && !match }
    })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setErr('')
    const r = mode === 'one' ? createStudents(org.id, [{ name, classId, email: email || undefined }]) : createStudents(org.id, parsed)
    if (!r.ok) return setErr(r.error)
    setLogins(r.logins)
  }

  return (
    <Modal open onClose={onClose} title={logins ? `${logins.length} student${logins.length === 1 ? '' : 's'} added` : mode === 'one' ? 'Add a student' : 'Import a class list'} wide={!!logins || mode === 'bulk'}>
      {logins ? (
        <>
          <IssuedLogins logins={logins} filename={`${org.name} new logins.csv`} />
          <button onClick={onClose} className="btn-primary mt-6 w-full">Done</button>
        </>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {mode === 'one' ? (
            <>
              <div>
                <label className="label" htmlFor="st-name">Full name</label>
                <input id="st-name" className="input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Aziza Rahimova" autoFocus />
              </div>
              <div>
                <label className="label" htmlFor="st-email">Email (optional)</label>
                <input id="st-email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Leave empty to create a school login automatically" />
              </div>
            </>
          ) : (
            <div>
              <label className="label" htmlFor="st-list">Students, one per line</label>
              <textarea
                id="st-list"
                className="input min-h-[180px] font-mono text-xs"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={'Aziza Rahimova, 10-A\nBekzod Nazarov, 10-A\nMalika Saidova, 11-B'}
                autoFocus
              />
              <p className="mt-1.5 text-xs text-muted">Paste from Excel or type “Name, Class”. Lines without a class go to the class selected below.</p>
              {parsed.length > 0 && (
                <div className="mt-2 text-sm">
                  <b>{parsed.length}</b> student{parsed.length === 1 ? '' : 's'} ready
                  {parsed.some((p) => p.unknownClass) && <span className="text-warn"> · some classes weren't recognised and will use the default class</span>}
                </div>
              )}
            </div>
          )}
          <div>
            <label className="label" htmlFor="st-class">{mode === 'one' ? 'Class' : 'Default class'}</label>
            <select id="st-class" className="input" value={classId} onChange={(e) => setClassId(e.target.value)}>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="text-xs text-muted">{free} licence seat{free === 1 ? '' : 's'} available</div>
          {err && <div className="rounded-xl bg-bad/10 px-4 py-3 text-sm text-bad" role="alert">{err}</div>}
          <button className="btn-primary w-full py-3">{mode === 'one' ? 'Create student login' : `Create ${parsed.length || ''} logins`}</button>
        </form>
      )}
    </Modal>
  )
}
