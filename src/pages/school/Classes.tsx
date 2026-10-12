import { ArrowLeft, Plus, School } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Empty, Heatmap, Modal, SeqLegend, Stat } from '../../components/ui'
import { DOMAINS, DOMAIN_SHORT, summarize, type RosterStudent } from '../../data/schools'
import { createClass, updateClass } from '../../lib/store'
import { PageTitle } from '../portal/Layout'
import { useSchool } from './context'
import { StudentDrawer } from './StudentDrawer'

export default function Classes() {
  const { classes, roster, teachers, base, readOnly, teacherId, org } = useSchool()
  const [creating, setCreating] = useState(false)
  return (
    <div>
      <PageTitle
        title="Classes"
        sub={`${classes.length} classes`}
        right={!readOnly && !teacherId ? <button onClick={() => setCreating(true)} className="btn-primary"><Plus size={16} /> New class</button> : undefined}
      />
      {classes.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c) => {
            const cs = summarize(roster.filter((s) => s.classId === c.id))
            const t = teachers.find((x) => x.id === c.teacherId)
            return (
              <Link key={c.id} to={`${base}/classes/${c.id}`} className="card p-6 transition hover:-translate-y-0.5 hover:border-sky">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-2xl font-bold tracking-tight">{c.name}</div>
                    <div className="text-sm text-muted">Grade {c.grade} · {t?.name ?? 'No teacher assigned'}</div>
                  </div>
                  <span className="chip bg-ink/5 text-muted">{cs.students} students</span>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <div className="text-xs text-muted">Average</div>
                    <div className="text-lg font-bold tabular-nums">{cs.avg ?? '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted">Active</div>
                    <div className="text-lg font-bold tabular-nums">{cs.students ? Math.round((cs.active7 / cs.students) * 100) : 0}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted">≥ 1400</div>
                    <div className="text-lg font-bold tabular-nums">{cs.above1400}</div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <Empty icon={School} title={teacherId ? 'No classes assigned to you yet' : 'No classes yet'} body={teacherId ? 'Ask your school administrator to assign you a class.' : 'Create your first class to start adding students.'} />
      )}
      {creating && <NewClass onClose={() => setCreating(false)} orgId={org.id} />}
    </div>
  )
}

function NewClass({ onClose, orgId }: { onClose: () => void; orgId: string }) {
  const { teachers } = useSchool()
  const [name, setName] = useState('')
  const [grade, setGrade] = useState('11')
  const [teacherId, setTeacherId] = useState('')
  const [err, setErr] = useState('')
  return (
    <Modal open onClose={onClose} title="New class">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          const r = createClass(orgId, name, grade, teacherId || undefined)
          if (!r.ok) return setErr(r.error)
          onClose()
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="c-name">Class name</label>
            <input id="c-name" className="input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. 11-C" autoFocus />
          </div>
          <div>
            <label className="label" htmlFor="c-grade">Grade</label>
            <select id="c-grade" className="input" value={grade} onChange={(e) => setGrade(e.target.value)}>
              {['9', '10', '11', '12'].map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="c-teacher">Teacher</label>
          <select id="c-teacher" className="input" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
            <option value="">No teacher yet</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.name} · {t.subject}</option>)}
          </select>
        </div>
        {err && <div className="rounded-xl bg-bad/10 px-4 py-3 text-sm text-bad">{err}</div>}
        <button className="btn-primary w-full py-3">Create class</button>
      </form>
    </Modal>
  )
}

export function ClassDetail() {
  const { id } = useParams()
  const { classes, roster, teachers, base, org, readOnly, teacherId } = useSchool()
  const [open, setOpen] = useState<RosterStudent | null>(null)
  const c = classes.find((x) => x.id === id)
  const students = useMemo(() => roster.filter((s) => s.classId === id).sort((a, b) => a.name.localeCompare(b.name)), [roster, id])
  const sum = useMemo(() => summarize(students), [students])
  if (!c) return <Empty icon={School} title="Class not found" action={<Link to={`${base}/classes`} className="btn-primary">All classes</Link>} />
  const weakest = [...DOMAINS].sort((a, b) => sum.domains[a] - sum.domains[b]).slice(0, 2)
  return (
    <div className="space-y-6">
      <Link to={`${base}/classes`} className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft size={15} /> All classes</Link>
      <PageTitle
        title={`Class ${c.name}`}
        sub={`Grade ${c.grade} · ${students.length} students`}
        right={
          !readOnly && !teacherId ? (
            <select className="input w-64" value={c.teacherId ?? ''} onChange={(e) => updateClass(c.id, { teacherId: e.target.value || undefined })} aria-label="Class teacher">
              <option value="">No teacher assigned</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>Teacher: {t.name}</option>)}
            </select>
          ) : undefined
        }
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Average score" value={sum.avg ?? '—'} note={sum.avgRw ? `R&W ${sum.avgRw} · Math ${sum.avgMath}` : undefined} />
        <Stat label="Active this week" value={`${sum.students ? Math.round((sum.active7 / sum.students) * 100) : 0}%`} />
        <Stat label="Average growth" value={sum.growth != null ? `+${sum.growth}` : '—'} tone="good" note="Points since first mock" />
        <Stat label="Focus next" value={<span className="text-lg">{DOMAIN_SHORT[weakest[0]]}</span>} note={`then ${DOMAIN_SHORT[weakest[1]]}`} />
      </div>
      <div className="card p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-semibold">Skills heatmap</div>
            <div className="text-xs text-muted">Accuracy by domain for every student. Select a name to open their profile.</div>
          </div>
          <SeqLegend />
        </div>
        <Heatmap
          rowLabel="Student"
          rows={[{ id: '__avg', label: 'Class average' }, ...students.map((s) => ({ id: s.id, label: s.name }))]}
          cols={DOMAINS}
          colLabel={(d) => DOMAIN_SHORT[d]}
          value={(rid, d) => {
            if (rid === '__avg') return sum.domains[d]
            const s = students.find((x) => x.id === rid)
            return s && (s.examsTaken || s.questionsAnswered) ? s.domains[d] : null
          }}
          onRow={(rid) => setOpen(students.find((s) => s.id === rid) ?? null)}
        />
      </div>
      <StudentDrawer student={open} org={org} onClose={() => setOpen(null)} readOnly={readOnly} />
    </div>
  )
}
