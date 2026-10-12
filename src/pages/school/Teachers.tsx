import { KeyRound, Trash2, UserPlus, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Empty, IssuedLogins, Modal } from '../../components/ui'
import { createTeacher, removeTeacher, resetUserPassword, type IssuedLogin } from '../../lib/store'
import type { Teacher } from '../../lib/types'
import { PageTitle } from '../portal/Layout'
import { useSchool } from './context'

export default function Teachers() {
  const { teachers, org, roster, state, readOnly } = useSchool()
  const [adding, setAdding] = useState(false)
  const [issued, setIssued] = useState<IssuedLogin | null>(null)
  const [confirm, setConfirm] = useState<string | null>(null)
  const allClasses = state.classes.filter((c) => c.orgId === org.id)
  return (
    <div>
      <PageTitle title="Teachers" sub="Teachers sign in to see and assign work to their own classes." right={!readOnly ? <button onClick={() => setAdding(true)} className="btn-primary"><UserPlus size={16} /> Add teacher</button> : undefined} />
      {teachers.length ? (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-line bg-ink/[0.03] text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3 font-semibold">Teacher</th>
                <th className="px-3 py-3 font-semibold">Subject</th>
                <th className="px-3 py-3 font-semibold">Classes</th>
                <th className="px-3 py-3 text-right font-semibold">Students</th>
                <th className="px-3 py-3 font-semibold">Login</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {teachers.map((t: Teacher) => {
                const tc = allClasses.filter((c) => c.teacherId === t.id)
                const n = roster.filter((s) => tc.some((c) => c.id === s.classId)).length
                const u = state.users.find((x) => x.id === t.userId)
                return (
                  <tr key={t.id}>
                    <td className="px-5 py-3">
                      <div className="font-medium">{t.name}</div>
                      <div className="text-xs text-muted">{t.email}</div>
                    </td>
                    <td className="px-3 py-3 text-muted">{t.subject}</td>
                    <td className="px-3 py-3">{tc.map((c) => c.name).join(', ') || <span className="text-muted">None</span>}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{n}</td>
                    <td className="px-3 py-3">{u?.active ? <span className="chip bg-good/15 text-good">Active</span> : <span className="chip bg-ink/5 text-muted">No login</span>}</td>
                    <td className="px-5 py-3 text-right">
                      {!readOnly && (
                        <div className="flex justify-end gap-1">
                          {u && (
                            <button onClick={() => setIssued(resetUserPassword(u.id))} className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-ink/5 hover:text-ink" title="Reset password" aria-label={`Reset password for ${t.name}`}>
                              <KeyRound size={15} />
                            </button>
                          )}
                          {confirm === t.id ? (
                            <button onClick={() => removeTeacher(t.id)} onBlur={() => setConfirm(null)} className="chip bg-bad text-white" autoFocus>Confirm remove</button>
                          ) : (
                            <button onClick={() => setConfirm(t.id)} className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-bad/10 hover:text-bad" title="Remove" aria-label={`Remove ${t.name}`}>
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty icon={UserRound} title="No teachers yet" body="Add teachers so they can manage their own classes." />
      )}
      <p className="mt-3 text-xs text-muted">Assign teachers to classes from each class page.</p>
      {adding && <AddTeacher onClose={() => setAdding(false)} />}
      <Modal open={!!issued} onClose={() => setIssued(null)} title="New temporary password" wide>
        {issued && <IssuedLogins logins={[issued]} filename="teacher-login.csv" />}
      </Modal>
    </div>
  )
}

function AddTeacher({ onClose }: { onClose: () => void }) {
  const { org } = useSchool()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState<Teacher['subject']>('Reading and Writing')
  const [err, setErr] = useState('')
  const [login, setLogin] = useState<IssuedLogin | null>(null)
  return (
    <Modal open onClose={onClose} title={login ? 'Teacher added' : 'Add a teacher'} wide={!!login}>
      {login ? (
        <>
          <IssuedLogins logins={[login]} filename="teacher-login.csv" />
          <button onClick={onClose} className="btn-primary mt-6 w-full">Done</button>
        </>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const r = createTeacher(org.id, { name, email, subject })
            if (!r.ok) return setErr(r.error)
            setLogin(r.login)
          }}
          className="space-y-4"
        >
          <div>
            <label className="label" htmlFor="t-name">Full name</label>
            <input id="t-name" className="input" required value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="label" htmlFor="t-email">Email (optional)</label>
            <input id="t-email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Leave empty to create a school login automatically" />
          </div>
          <div>
            <label className="label" htmlFor="t-subject">Subject</label>
            <select id="t-subject" className="input" value={subject} onChange={(e) => setSubject(e.target.value as Teacher['subject'])}>
              <option>Reading and Writing</option>
              <option>Math</option>
            </select>
          </div>
          {err && <div className="rounded-xl bg-bad/10 px-4 py-3 text-sm text-bad">{err}</div>}
          <button className="btn-primary w-full py-3">Create teacher login</button>
        </form>
      )}
    </Modal>
  )
}
