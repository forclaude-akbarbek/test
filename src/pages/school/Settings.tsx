import { useState } from 'react'
import { PasswordForm } from '../../components/PasswordForm'
import { Progress } from '../../components/ui'
import { seatsUsed, updateOrg, useSession } from '../../lib/store'
import { PageTitle } from '../portal/Layout'
import { useSchool } from './context'

export default function SchoolSettings() {
  const { org, state, teacherId } = useSchool()
  const { user } = useSession()
  const [name, setName] = useState(org.name)
  const [city, setCity] = useState(org.city)
  const [saved, setSaved] = useState(false)
  const used = seatsUsed(org.id, state)
  const parent = state.orgs.find((o) => o.id === org.parentId)
  const isDirector = user?.role !== 'teacher'
  return (
    <div className="space-y-6">
      <PageTitle title="Settings" />
      <div className="grid gap-6 lg:grid-cols-2">
        {isDirector && !teacherId && (
          <div className="card p-6">
            <div className="text-lg font-semibold">School</div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                updateOrg(org.id, { name: name.trim() || org.name, city: city.trim() || org.city })
                setSaved(true)
                setTimeout(() => setSaved(false), 2000)
              }}
              className="mt-4 space-y-4"
            >
              <div>
                <label className="label" htmlFor="org-name">School name</label>
                <input id="org-name" className="input" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label" htmlFor="org-city">City</label>
                  <input id="org-city" className="input" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div>
                  <div className="label">Region</div>
                  <div className="input bg-ink/[0.03]">{org.region}</div>
                </div>
              </div>
              {parent && <div className="text-sm text-muted">Part of <b className="text-ink">{parent.name}</b></div>}
              <button className="btn-primary">{saved ? 'Saved' : 'Save changes'}</button>
            </form>
          </div>
        )}
        {isDirector && !teacherId && (
          <div className="card p-6">
            <div className="text-lg font-semibold">Licence</div>
            <div className="mt-4 space-y-4 text-sm">
              <div>
                <div className="mb-1.5 flex justify-between">
                  <span>Student seats</span>
                  <span className="font-semibold tabular-nums">{used} / {org.seats}</span>
                </div>
                <Progress value={(used / org.seats) * 100} tone={used / org.seats > 0.9 ? 'warn' : undefined} />
              </div>
              <div className="flex justify-between border-t border-line pt-3">
                <span className="text-muted">Plan</span>
                <span className="font-semibold">{org.kind === 'private' ? 'School licence' : 'Government programme'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Valid until</span>
                <span className="font-semibold">{new Date(org.licenseUntil).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Includes</span>
                <span className="text-right font-semibold">Premium for every student</span>
              </div>
              <p className="rounded-xl bg-ink/[0.04] p-3 text-xs text-muted">Need more seats? Contact your Horizon SAT account manager at schools@horizonsat.uz.</p>
            </div>
          </div>
        )}
        <div className="card p-6">
          <div className="text-lg font-semibold">Your account</div>
          <div className="mt-2 text-sm text-muted">
            {user?.name} · <span className="select-all">{user?.email}</span>
          </div>
          <div className="mt-5">
            <PasswordForm />
          </div>
        </div>
      </div>
    </div>
  )
}
