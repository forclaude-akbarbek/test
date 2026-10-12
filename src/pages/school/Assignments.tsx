import { ArrowLeft, Check, ClipboardList, Download, Plus, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Empty, Modal, Progress, Segmented, Stat } from '../../components/ui'
import { MATH_DOMAINS } from '../../data/math'
import { RW_DOMAINS } from '../../data/rw'
import { PRACTICE_TESTS } from '../../data/tests'
import { WORD_LISTS } from '../../data/vocab'
import { appliesTo, assignmentLabel, assignmentStatus, assignmentsForSchool, downloadCsv, fmtDue } from '../../lib/school'
import { createAssignment, deleteAssignment } from '../../lib/store'
import type { Assignment, AssignmentType } from '../../lib/types'
import { PageTitle } from '../portal/Layout'
import { useSchool } from './context'

export default function Assignments() {
  const { org, roster, classes, base, state, readOnly } = useSchool()
  const [creating, setCreating] = useState(false)
  const [tab, setTab] = useState<'current' | 'past'>('current')
  const all = assignmentsForSchool(state, org).sort((a, b) => a.due.localeCompare(b.due))
  const now = Date.now()
  const list = all.filter((a) => (tab === 'current' ? new Date(a.due).getTime() >= now : new Date(a.due).getTime() < now))
  if (tab === 'past') list.reverse()

  return (
    <div>
      <PageTitle
        title="Assignments"
        sub="Mocks, section tests, practice sets and vocabulary for your classes. Students see them on their dashboard."
        right={!readOnly ? <button onClick={() => setCreating(true)} className="btn-primary"><Plus size={16} /> New assignment</button> : undefined}
      />
      <div className="mb-4">
        <Segmented value={tab} onChange={setTab} options={[{ value: 'current', label: 'Current' }, { value: 'past', label: 'Closed' }]} />
      </div>
      {list.length ? (
        <div className="space-y-3">
          {list.map((a) => {
            const targets = roster.filter((s) => appliesTo(a, s))
            const done = targets.filter((s) => assignmentStatus(state, a, s).done).length
            const pct = targets.length ? (done / targets.length) * 100 : 0
            return (
              <Link key={a.id} to={`${base}/assignments/${a.id}`} className="card flex flex-col gap-4 p-5 transition hover:border-sky sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{a.title}</span>
                    <span className="chip bg-ink/5 text-muted">{assignmentLabel[a.type]}</span>
                    {a.orgId === org.parentId && <span className="chip bg-sky-soft text-sky-deep dark:text-sky">From the network</span>}
                  </div>
                  <div className="mt-1 text-sm text-muted">
                    {tab === 'current' ? 'Due' : 'Closed'} {fmtDue(a.due)} · {a.classIds.length ? a.classIds.map((id) => classes.find((c) => c.id === id)?.name).filter(Boolean).join(', ') : 'Whole school'} · {targets.length} students
                  </div>
                </div>
                <div className="w-full sm:w-56">
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span className="text-muted">Completed</span>
                    <span className="font-semibold tabular-nums">{done}/{targets.length}</span>
                  </div>
                  <Progress value={pct} tone={tab === 'past' && pct < 70 ? 'warn' : undefined} />
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <Empty icon={ClipboardList} title={tab === 'current' ? 'No current assignments' : 'No closed assignments'} body={tab === 'current' && !readOnly ? 'Create one to get your classes practising.' : undefined} />
      )}
      {creating && <NewAssignment onClose={() => setCreating(false)} />}
    </div>
  )
}

export function NewAssignment({ onClose, network }: { onClose: () => void; network?: { orgId: string } }) {
  const ctx = network ? null : useSchool()
  const nav = useNavigate()
  const [type, setType] = useState<AssignmentType>(network ? 'mock' : 'mock')
  const [testId, setTestId] = useState(PRACTICE_TESTS[0].id)
  const [section, setSection] = useState<'rw' | 'math'>('math')
  const [skill, setSkill] = useState('')
  const [list, setList] = useState(WORD_LISTS[0])
  const [classIds, setClassIds] = useState<string[]>([])
  const [due, setDue] = useState(() => new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10))
  const [title, setTitle] = useState('')
  const classes = ctx?.classes ?? []
  const skills = section === 'rw' ? Object.values(RW_DOMAINS).flat() : Object.values(MATH_DOMAINS).flat()

  const autoTitle =
    type === 'mock'
      ? `${PRACTICE_TESTS.find((t) => t.id === testId)?.title.replace('Full-Length ', '')}`
      : type === 'section'
        ? `${section === 'rw' ? 'Reading and Writing' : 'Math'} section test`
        : type === 'quick'
          ? `${skill || (section === 'rw' ? 'Reading and Writing' : 'Math')} practice set`
          : `Vocabulary: ${list}`

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const a: Omit<Assignment, 'id' | 'createdAt' | 'createdBy'> = {
      orgId: network?.orgId ?? ctx!.org.id,
      classIds: ctx?.teacherId && !classIds.length ? classes.map((c) => c.id) : classIds,
      title: title.trim() || autoTitle,
      type,
      testId: type === 'mock' || type === 'section' ? testId : undefined,
      section: type === 'section' || type === 'quick' ? section : undefined,
      skill: type === 'quick' && skill ? skill : undefined,
      list: type === 'vocab' ? list : undefined,
      due: new Date(due + 'T18:00:00').toISOString(),
    }
    const id = createAssignment(a)
    onClose()
    nav(network ? `/network/mock-days` : `${ctx!.base}/assignments/${id}`)
  }

  return (
    <Modal open onClose={onClose} title={network ? 'Schedule a mock day' : 'New assignment'} wide>
      <form onSubmit={submit} className="space-y-5">
        {!network && (
          <div>
            <div className="label">Type</div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(['mock', 'section', 'quick', 'vocab'] as const).map((t) => (
                <button type="button" key={t} onClick={() => setType(t)} className={`rounded-2xl border-2 p-3 text-left text-sm transition ${type === t ? 'border-sky' : 'border-line'}`}>
                  <div className="font-semibold">{assignmentLabel[t]}</div>
                  <div className="text-xs text-muted">{t === 'mock' ? 'Adaptive, 98 questions' : t === 'section' ? 'One section, 2 modules' : t === 'quick' ? '10 questions by skill' : 'Master a word list'}</div>
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {(type === 'mock' || type === 'section') && (
            <div>
              <label className="label" htmlFor="as-test">Practice test</label>
              <select id="as-test" className="input" value={testId} onChange={(e) => setTestId(e.target.value)}>
                {PRACTICE_TESTS.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </div>
          )}
          {(type === 'section' || type === 'quick') && (
            <div>
              <label className="label" htmlFor="as-section">Section</label>
              <select id="as-section" className="input" value={section} onChange={(e) => { setSection(e.target.value as 'rw' | 'math'); setSkill('') }}>
                <option value="rw">Reading and Writing</option>
                <option value="math">Math</option>
              </select>
            </div>
          )}
          {type === 'quick' && (
            <div>
              <label className="label" htmlFor="as-skill">Skill</label>
              <select id="as-skill" className="input" value={skill} onChange={(e) => setSkill(e.target.value)}>
                <option value="">Mixed skills</option>
                {skills.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          )}
          {type === 'vocab' && (
            <div>
              <label className="label" htmlFor="as-list">Word list</label>
              <select id="as-list" className="input" value={list} onChange={(e) => setList(e.target.value)}>
                {WORD_LISTS.map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="label" htmlFor="as-due">{network ? 'Mock day' : 'Due date'}</label>
            <input id="as-due" type="date" className="input" required value={due} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDue(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="as-title">Title</label>
          <input id="as-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={network ? 'e.g. National Mock Day — December' : autoTitle} />
        </div>
        {!network && (
          <div>
            <div className="label">Who</div>
            <div className="flex flex-wrap gap-2">
              {!ctx?.teacherId && (
                <button type="button" onClick={() => setClassIds([])} className={`chip border px-3 py-1.5 ${!classIds.length ? 'border-sky bg-sky-soft text-sky-deep dark:text-sky' : 'border-line text-muted'}`}>
                  Whole school
                </button>
              )}
              {classes.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setClassIds(classIds.includes(c.id) ? classIds.filter((x) => x !== c.id) : [...classIds, c.id])}
                  className={`chip border px-3 py-1.5 ${classIds.includes(c.id) ? 'border-sky bg-sky-soft text-sky-deep dark:text-sky' : 'border-line text-muted'}`}
                  aria-pressed={classIds.includes(c.id)}
                >
                  {c.name}
                </button>
              ))}
            </div>
            {ctx?.teacherId && !classIds.length && <p className="mt-1.5 text-xs text-muted">No class selected: all of your classes will get it.</p>}
          </div>
        )}
        {network && <p className="rounded-2xl bg-ink/[0.04] p-4 text-sm text-muted">Every school in the network will see this on their Assignments page, and every student will see it on their dashboard.</p>}
        <button className="btn-primary w-full py-3">{network ? 'Schedule mock day' : 'Assign'}</button>
      </form>
    </Modal>
  )
}

export function AssignmentDetail() {
  const { id } = useParams()
  const { org, roster, classes, className, base, state, readOnly } = useSchool()
  const nav = useNavigate()
  const [filter, setFilter] = useState<'all' | 'done' | 'missing'>('all')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const a = state.assignments.find((x) => x.id === id)
  const rows = useMemo(() => (a ? roster.filter((s) => appliesTo(a, s)).map((s) => ({ s, st: assignmentStatus(state, a, s) })) : []), [a, roster, state])
  if (!a) return <Empty icon={ClipboardList} title="Assignment not found" action={<Link to={`${base}/assignments`} className="btn-primary">All assignments</Link>} />
  const done = rows.filter((r) => r.st.done)
  const scores = done.map((r) => r.st.score).filter((x): x is number => x != null)
  const avg = scores.length ? Math.round(scores.reduce((x, y) => x + y, 0) / scores.length / (a.type === 'quick' || a.type === 'vocab' ? 1 : 10)) * (a.type === 'quick' || a.type === 'vocab' ? 1 : 10) : null
  const past = new Date(a.due).getTime() < Date.now()
  const shown = rows.filter((r) => (filter === 'done' ? r.st.done : filter === 'missing' ? !r.st.done : true)).sort((x, y) => Number(y.st.done) - Number(x.st.done) || (y.st.score ?? 0) - (x.st.score ?? 0))
  const pctUnit = a.type === 'quick' || a.type === 'vocab' ? '%' : ''
  const own = a.orgId === org.id

  return (
    <div className="space-y-6">
      <Link to={`${base}/assignments`} className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft size={15} /> All assignments</Link>
      <PageTitle
        title={a.title}
        sub={`${assignmentLabel[a.type]} · ${past ? 'Closed' : 'Due'} ${fmtDue(a.due)} · ${a.classIds.length ? a.classIds.map((x) => classes.find((c) => c.id === x)?.name).filter(Boolean).join(', ') : a.orgId === org.parentId ? 'All network schools' : 'Whole school'}`}
        right={
          <div className="flex gap-2">
            <button onClick={() => downloadCsv(`${a.title}.csv`, [['Student', 'Class', 'Status', 'Score', 'Completed'], ...rows.map((r) => [r.s.name, className(r.s.classId), r.st.done ? 'Done' : past ? 'Missed' : 'Not started', r.st.score ?? '', r.st.at ? new Date(r.st.at).toLocaleDateString('en-US') : ''])])} className="btn-ghost"><Download size={16} /> CSV</button>
            {!readOnly && own &&
              (confirmDelete ? (
                <button onClick={() => { deleteAssignment(a.id); nav(`${base}/assignments`) }} onBlur={() => setConfirmDelete(false)} className="btn bg-bad text-white" autoFocus>Confirm delete</button>
              ) : (
                <button onClick={() => setConfirmDelete(true)} className="btn-ghost text-bad"><Trash2 size={16} /> Delete</button>
              ))}
          </div>
        }
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Completed" value={`${rows.length ? Math.round((done.length / rows.length) * 100) : 0}%`} note={`${done.length} of ${rows.length} students`} />
        <Stat label={a.type === 'vocab' ? 'Average mastery' : 'Average score'} value={avg != null ? `${avg}${pctUnit}` : '—'} />
        <Stat label={past ? 'Missed' : 'Not started yet'} value={rows.length - done.length} tone={past && rows.length - done.length > 0 ? 'bad' : undefined} note={past ? 'Did not complete by the deadline' : 'Students can still complete it'} />
        <Stat label="Highest" value={scores.length ? `${Math.max(...scores)}${pctUnit}` : '—'} />
      </div>
      <div className="card overflow-x-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
          <Segmented value={filter} onChange={setFilter} options={[{ value: 'all', label: `All (${rows.length})` }, { value: 'done', label: `Done (${done.length})` }, { value: 'missing', label: `${past ? 'Missed' : 'Not started'} (${rows.length - done.length})` }]} />
        </div>
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-ink/[0.03] text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-5 py-3 font-semibold">Student</th>
              <th className="px-3 py-3 font-semibold">Class</th>
              <th className="px-3 py-3 font-semibold">Status</th>
              <th className="px-3 py-3 text-right font-semibold">Score</th>
              <th className="px-5 py-3 font-semibold">Completed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {shown.map(({ s, st: status }) => (
              <tr key={s.id}>
                <td className="px-5 py-3 font-medium">{s.name}</td>
                <td className="px-3 py-3 text-muted">{className(s.classId)}</td>
                <td className="px-3 py-3">
                  {status.done ? (
                    <span className="chip bg-good/15 text-good"><Check size={12} /> Done</span>
                  ) : past ? (
                    <span className="chip bg-bad/15 text-bad"><X size={12} /> Missed</span>
                  ) : (
                    <span className="chip bg-ink/5 text-muted">Not started</span>
                  )}
                </td>
                <td className="px-3 py-3 text-right font-semibold tabular-nums">{status.score != null ? `${status.score}${pctUnit}` : '—'}</td>
                <td className="px-5 py-3 text-muted">{status.at ? new Date(status.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
