import { Building2, KeyRound, Landmark, LogOut, Network, Plus, RotateCcw, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { ThemeToggle } from '../components/ThemeToggle'
import { IssuedLogins, Modal, Segmented, Stat } from '../components/ui'
import { REGIONS } from '../data/schools'
import { fmtDate } from '../lib/analytics'
import { adminCreateOrg, adminDelete, adminSetActive, logout, resetDemo, resetUserPassword, seatsUsed, useAppState, type IssuedLogin } from '../lib/store'
import type { Org, Role } from '../lib/types'

const ROLE_LABEL: Record<Role, string> = { student: 'Student', teacher: 'Teacher', b2b: 'School (B2B)', b2g: 'Government (B2G)', admin: 'Admin' }

export default function Admin() {
  const s = useAppState()
  const nav = useNavigate()
  const [tab, setTab] = useState<'orgs' | 'users'>('orgs')
  const [creating, setCreating] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [issued, setIssued] = useState<IssuedLogin | null>(null)
  const [q, setQ] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | Role>('all')
  const orgName = (id?: string) => s.orgs.find((o) => o.id === id)?.name

  const users = useMemo(
    () => s.users.filter((u) => u.role !== 'admin' && (roleFilter === 'all' || u.role === roleFilter) && (!q || `${u.name} ${u.email} ${orgName(u.orgId) ?? ''}`.toLowerCase().includes(q.toLowerCase()))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [s.users, roleFilter, q],
  )
  const orgs = [...s.orgs].sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === 'network' ? -1 : b.kind === 'network' ? 1 : a.kind === 'private' ? -1 : 1))

  return (
    <div className="min-h-screen bg-surface">
      <header className="glass sticky top-0 z-20">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo to="/admin" />
            <span className="chip bg-ink/5 text-muted">Admin</span>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button onClick={() => { logout(); nav('/') }} className="btn-ghost px-3 text-sm"><LogOut size={16} /> Log out</button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Platform administration</h1>
            <p className="mt-1 text-muted">Create school and government accounts, manage logins and licences.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                if (!confirmReset) return setConfirmReset(true)
                resetDemo()
                nav('/login')
              }}
              onBlur={() => setConfirmReset(false)}
              className={confirmReset ? 'btn bg-bad text-white hover:bg-bad/90' : 'btn-outline'}
            >
              <RotateCcw size={16} /> {confirmReset ? 'Click again to reset' : 'Reset demo'}
            </button>
            <button onClick={() => setCreating(true)} className="btn-primary"><Plus size={16} /> New organization</button>
          </div>
        </div>
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Private schools" value={s.orgs.filter((o) => o.kind === 'private').length} />
          <Stat label="Government schools" value={s.orgs.filter((o) => o.kind === 'government').length} note={`${s.orgs.filter((o) => o.kind === 'network').length} network`} />
          <Stat label="Licensed seats" value={s.orgs.filter((o) => o.kind !== 'network').reduce((n, o) => n + o.seats, 0).toLocaleString('en-US')} />
          <Stat label="Login accounts" value={s.users.length} />
        </div>
        <div className="mb-4">
          <Segmented value={tab} onChange={setTab} options={[{ value: 'orgs', label: 'Organizations' }, { value: 'users', label: 'Logins' }]} />
        </div>

        {tab === 'orgs' ? (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b border-line bg-ink/[0.03] text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-3 font-semibold">Organization</th>
                  <th className="px-3 py-3 font-semibold">Type</th>
                  <th className="px-3 py-3 font-semibold">Region</th>
                  <th className="px-3 py-3 text-right font-semibold">Seats used</th>
                  <th className="px-3 py-3 font-semibold">Licence until</th>
                  <th className="px-5 py-3 text-right font-semibold">Logins</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {orgs.map((o) => (
                  <tr key={o.id}>
                    <td className="px-5 py-3">
                      <div className="font-medium">{o.name}</div>
                      {o.parentId && <div className="text-xs text-muted">{orgName(o.parentId)}</div>}
                    </td>
                    <td className="px-3 py-3"><span className="chip bg-ink/5 text-muted">{o.kind === 'private' ? 'Private (B2B)' : o.kind === 'government' ? 'Government (B2G)' : 'Network (B2G)'}</span></td>
                    <td className="px-3 py-3 text-muted">{o.region}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{o.kind === 'network' ? '—' : `${seatsUsed(o.id, s)} / ${o.seats}`}</td>
                    <td className="px-3 py-3 text-muted">{fmtDate(o.licenseUntil)}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{s.users.filter((u) => u.orgId === o.id).length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input className="input pl-10" placeholder="Search by name, email or organization" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search logins" />
              </div>
              <select className="input sm:w-52" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as 'all' | Role)} aria-label="Account type">
                <option value="all">All account types</option>
                {(['student', 'teacher', 'b2b', 'b2g'] as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </select>
            </div>
            <div className="card overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead className="border-b border-line bg-ink/[0.03] text-left text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Name</th>
                    <th className="px-3 py-3 font-semibold">Type</th>
                    <th className="px-3 py-3 font-semibold">Organization</th>
                    <th className="px-3 py-3 font-semibold">Last sign-in</th>
                    <th className="px-3 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="px-5 py-3">
                        <div className="font-medium">{u.name}</div>
                        <div className="text-xs text-muted">{u.email}</div>
                      </td>
                      <td className="px-3 py-3"><span className="chip bg-ink/5 text-muted">{ROLE_LABEL[u.role]}</span></td>
                      <td className="px-3 py-3 text-muted">{orgName(u.orgId) ?? 'Independent'}</td>
                      <td className="px-3 py-3 text-muted">{u.lastLogin ? fmtDate(u.lastLogin) : 'Never'}</td>
                      <td className="px-3 py-3">
                        <button onClick={() => adminSetActive(u.id, !u.active)} className={`chip ${u.active ? 'bg-good/15 text-good' : 'bg-ink/5 text-muted'}`} title={u.active ? 'Click to disable' : 'Click to enable'}>
                          {u.active ? 'Active' : 'Disabled'}
                        </button>
                        {u.mustChangePassword && <span className="ml-1 chip bg-warn/15 text-warn">Temp password</span>}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => setIssued(resetUserPassword(u.id))} className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-ink/5 hover:text-ink" title="Reset password" aria-label={`Reset password for ${u.name}`}>
                            <KeyRound size={15} />
                          </button>
                          {confirmDelete === u.id ? (
                            <button onClick={() => adminDelete(u.id)} onBlur={() => setConfirmDelete(null)} className="chip bg-bad text-white" autoFocus>Confirm delete</button>
                          ) : (
                            <button onClick={() => setConfirmDelete(u.id)} className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-bad/10 hover:text-bad" title="Delete login" aria-label={`Delete ${u.name}`}>
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
      {creating && <CreateOrg onClose={() => setCreating(false)} />}
      <Modal open={!!issued} onClose={() => setIssued(null)} title="New temporary password" wide>
        {issued && <IssuedLogins logins={[issued]} filename="login.csv" />}
      </Modal>
    </div>
  )
}

function CreateOrg({ onClose }: { onClose: () => void }) {
  const s = useAppState()
  const networks = s.orgs.filter((o) => o.kind === 'network')
  const [f, setF] = useState({ kind: 'private' as Org['kind'], name: '', region: 'Tashkent City', city: '', seats: 150, parentId: networks[0]?.id ?? '', contactName: '', email: '' })
  const [err, setErr] = useState('')
  const [login, setLogin] = useState<IssuedLogin | null>(null)
  const types = [
    { k: 'private' as const, l: 'Private school', d: 'B2B', icon: Building2 },
    { k: 'government' as const, l: 'Government school', d: 'B2G', icon: Landmark },
    { k: 'network' as const, l: 'Government network', d: 'B2G, many schools', icon: Network },
  ]
  return (
    <Modal open onClose={onClose} title={login ? 'Organization created' : 'New organization'} wide>
      {login ? (
        <>
          <p className="mb-4 text-sm text-muted">
            <b className="text-ink">{f.name}</b> is ready. Share the administrator's sign-in details below. On first sign-in they'll set their own password and land in their {f.kind === 'network' ? 'network' : 'school'} portal.
          </p>
          <IssuedLogins logins={[login]} filename={`${f.name} login.csv`} />
          <button onClick={onClose} className="btn-primary mt-6 w-full">Done</button>
        </>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const r = adminCreateOrg({ ...f, seats: Number(f.seats) })
            if (!r.ok) return setErr(r.error)
            setLogin(r.login)
          }}
          className="space-y-4"
        >
          <div className="grid gap-2 sm:grid-cols-3">
            {types.map((t) => (
              <button type="button" key={t.k} onClick={() => setF({ ...f, kind: t.k })} className={`rounded-2xl border-2 p-4 text-left transition ${f.kind === t.k ? 'border-sky' : 'border-line'}`} aria-pressed={f.kind === t.k}>
                <t.icon size={20} className="text-sky" />
                <div className="mt-2 text-sm font-semibold">{t.l}</div>
                <div className="text-xs text-muted">{t.d}</div>
              </button>
            ))}
          </div>
          <div>
            <label className="label" htmlFor="o-name">Name</label>
            <input id="o-name" className="input" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder={f.kind === 'private' ? 'e.g. Silk Road International School' : f.kind === 'government' ? 'e.g. Bukhara Specialized School No. 3' : 'e.g. Creative Schools Programme'} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="o-region">Region</label>
              <select id="o-region" className="input" value={f.region} onChange={(e) => setF({ ...f, region: e.target.value, city: REGIONS.find((r) => r.name === e.target.value)?.city ?? '' })}>
                {REGIONS.map((r) => <option key={r.name}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="o-city">City</label>
              <input id="o-city" className="input" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} placeholder={REGIONS.find((r) => r.name === f.region)?.city} />
            </div>
            {f.kind !== 'network' && (
              <div>
                <label className="label" htmlFor="o-seats">Student seats</label>
                <input id="o-seats" type="number" min={1} className="input" value={f.seats} onChange={(e) => setF({ ...f, seats: Number(e.target.value) })} />
              </div>
            )}
          </div>
          {f.kind === 'government' && (
            <div>
              <label className="label" htmlFor="o-parent">Network</label>
              <select id="o-parent" className="input" value={f.parentId} onChange={(e) => setF({ ...f, parentId: e.target.value })}>
                <option value="">Not part of a network</option>
                {networks.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
              </select>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="o-contact">Administrator's name</label>
              <input id="o-contact" className="input" required value={f.contactName} onChange={(e) => setF({ ...f, contactName: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="o-email">Administrator's email (login)</label>
              <input id="o-email" type="email" className="input" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="director@school.uz" />
            </div>
          </div>
          {err && <div className="rounded-xl bg-bad/10 px-4 py-3 text-sm text-bad">{err}</div>}
          <button className="btn-primary w-full py-3">Create organization and login</button>
        </form>
      )}
    </Modal>
  )
}
