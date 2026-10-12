import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PasswordForm } from '../../components/PasswordForm'
import { orgOf, updateProfile, useAppState, useSession } from '../../lib/store'
import { PageTitle } from './Layout'

export default function AccountSettings() {
  const { user } = useSession()
  const st = useAppState()
  const org = orgOf(user, st)
  const cls = st.classes.find((c) => c.id === user?.classId)
  const [f, setF] = useState({ name: user?.name ?? '', grade: user?.grade ?? '11', targetScore: user?.targetScore ?? 1400, testDate: user?.testDate ?? '' })
  const [saved, setSaved] = useState(false)
  if (!user) return null
  return (
    <div className="space-y-6">
      <PageTitle title="Settings" sub="Your profile, goals and password." />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <div className="text-lg font-semibold">Profile</div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              updateProfile({ name: f.name.trim() || user.name, grade: f.grade, targetScore: f.targetScore, testDate: f.testDate })
              setSaved(true)
              setTimeout(() => setSaved(false), 2000)
            }}
            className="mt-4 space-y-4"
          >
            <div>
              <label className="label" htmlFor="s-name">Full name</label>
              <input id="s-name" className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} disabled={!!org} />
              {org && <p className="mt-1 text-xs text-muted">Your school manages your name and class.</p>}
            </div>
            <div>
              <div className="label">Email</div>
              <div className="input select-all bg-ink/[0.03]">{user.email}</div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label" htmlFor="s-grade">Grade</label>
                <select id="s-grade" className="input" value={f.grade} onChange={(e) => setF({ ...f, grade: e.target.value })} disabled={!!org}>
                  {['9', '10', '11', '12', 'Gap year'].map((g) => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="s-target">Target</label>
                <select id="s-target" className="input" value={f.targetScore} onChange={(e) => setF({ ...f, targetScore: Number(e.target.value) })}>
                  {[1200, 1250, 1300, 1350, 1400, 1450, 1500, 1550, 1600].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="s-date">Test date</label>
                <input id="s-date" type="date" className="input px-2" value={f.testDate} onChange={(e) => setF({ ...f, testDate: e.target.value })} />
              </div>
            </div>
            <button className="btn-primary">{saved ? 'Saved' : 'Save changes'}</button>
          </form>
        </div>
        <div className="space-y-6">
          {org && (
            <div className="card p-6">
              <div className="text-lg font-semibold">School</div>
              <div className="mt-3 text-sm">
                <div className="font-semibold">{org.name}</div>
                <div className="text-muted">{cls ? `Class ${cls.name}` : 'No class yet'} · {org.city}</div>
              </div>
              <p className="mt-3 text-sm text-muted">Your Premium access is included in your school's licence.</p>
            </div>
          )}
          <div className="card p-6">
            <div className="text-lg font-semibold">Password</div>
            <div className="mt-4">
              <PasswordForm />
            </div>
          </div>
          {!org && (
            <div className="card p-6 text-sm">
              <div className="text-lg font-semibold">Plan</div>
              <p className="mt-1 text-muted">You're on the {user.plan === 'premium' ? 'Premium' : 'Free'} plan.</p>
              <Link to="/app/subscription" className="btn-outline mt-4">Manage subscription</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
