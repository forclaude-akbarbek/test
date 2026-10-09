import { AnimatePresence, motion } from 'framer-motion'
import { Building2, Landmark, LogOut, Plus, RotateCcw, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { ThemeToggle } from '../components/ThemeToggle'
import { fmtDate } from '../lib/analytics'
import { adminCreateAccount, adminDelete, adminSetActive, logout, resetDemo, useAppState } from '../lib/store'

export default function Admin() {
  const s = useAppState()
  const nav = useNavigate()
  const [creating, setCreating] = useState(false)
  const [tab, setTab] = useState<'all' | 'b2b' | 'b2g' | 'student'>('all')
  const users = s.users.filter((u) => u.role !== 'admin' && (tab === 'all' || u.role === tab))
  const counts = {
    student: s.users.filter((u) => u.role === 'student').length,
    b2b: s.users.filter((u) => u.role === 'b2b').length,
    b2g: s.users.filter((u) => u.role === 'b2g').length,
  }

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
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Accounts</h1>
            <p className="mt-1 text-muted">Create login credentials for private (B2B) and government (B2G) schools.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { if (confirm('Reset all demo data to its original state?')) { resetDemo(); nav('/login') } }} className="btn-outline"><RotateCcw size={16} /> Reset demo</button>
            <button onClick={() => setCreating(true)} className="btn-primary"><Plus size={16} /> New school account</button>
          </div>
        </div>
        <div className="mb-6 grid grid-cols-3 gap-4">
          {[['Students', counts.student], ['Private schools', counts.b2b], ['Government schools', counts.b2g]].map(([k, v]) => (
            <div key={k} className="card p-5">
              <div className="text-sm text-muted">{k}</div>
              <div className="text-3xl font-bold tabular-nums">{v}</div>
            </div>
          ))}
        </div>
        <div className="mb-4 inline-flex rounded-full border border-line bg-elevated p-1 text-sm">
          {(['all', 'b2b', 'b2g', 'student'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-1.5 font-medium transition ${tab === t ? 'bg-sky text-white dark:text-black' : 'text-muted'}`}>
              {t === 'all' ? 'All' : t === 'student' ? 'Students' : t.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-line bg-ink/[0.03] text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Type</th>
                <th className="px-5 py-3 font-semibold">Login</th>
                <th className="px-5 py-3 font-semibold">Created</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-5 py-3.5 font-medium">{u.org ?? u.name}</td>
                  <td className="px-5 py-3.5"><span className="chip bg-ink/5 text-muted">{u.role === 'student' ? 'Student' : u.role.toUpperCase()}</span></td>
                  <td className="px-5 py-3.5 text-muted">{u.email}</td>
                  <td className="px-5 py-3.5 text-muted">{fmtDate(u.createdAt)}</td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => adminSetActive(u.id, !u.active)} className={`chip ${u.active ? 'bg-good/15 text-good' : 'bg-ink/5 text-muted'}`}>{u.active ? 'Active' : 'Disabled'}</button>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {u.role !== 'student' && (
                      <button onClick={() => confirm(`Delete ${u.org ?? u.name}?`) && adminDelete(u.id)} className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-bad/10 hover:text-bad" aria-label="Delete account">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
      <AnimatePresence>{creating && <CreateModal onClose={() => setCreating(false)} />}</AnimatePresence>
    </div>
  )
}

function CreateModal({ onClose }: { onClose: () => void }) {
  const [f, setF] = useState({ role: 'b2b' as 'b2b' | 'b2g', org: '', email: '', password: Math.random().toString(36).slice(2, 10) })
  const [err, setErr] = useState('')
  const [done, setDone] = useState(false)
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const r = adminCreateAccount(f)
    if (!r.ok) return setErr(r.error)
    setDone(true)
  }
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed inset-x-4 top-[8vh] z-50 mx-auto max-w-md rounded-3xl bg-elevated p-7 shadow-lift" role="dialog" aria-label="New school account">
        <button onClick={onClose} className="absolute right-5 top-5 grid h-8 w-8 place-items-center rounded-full hover:bg-ink/5" aria-label="Close"><X size={18} /></button>
        {done ? (
          <div>
            <div className="text-2xl font-bold tracking-tight">Account created</div>
            <p className="mt-1 text-sm text-muted">Share these credentials with the school. They will be sent to the {f.role === 'b2b' ? 'private' : 'government'} school portal on login.</p>
            <div className="mt-5 space-y-2 rounded-2xl bg-ink/[0.04] p-4 font-mono text-sm">
              <div>Login: {f.email}</div>
              <div>Password: {f.password}</div>
            </div>
            <button onClick={onClose} className="btn-primary mt-6 w-full">Done</button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="text-2xl font-bold tracking-tight">New school account</div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {([['b2b', 'Private school', Building2], ['b2g', 'Government school', Landmark]] as const).map(([r, l, Icon]) => (
                <button type="button" key={r} onClick={() => setF({ ...f, role: r })} className={`rounded-2xl border-2 p-4 text-left transition ${f.role === r ? 'border-sky' : 'border-line'}`}>
                  <Icon size={20} className="text-sky" />
                  <div className="mt-2 text-sm font-semibold">{l}</div>
                  <div className="text-xs text-muted">{r.toUpperCase()}</div>
                </button>
              ))}
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <label className="label" htmlFor="org">School name</label>
                <input id="org" className="input" required value={f.org} onChange={(e) => setF({ ...f, org: e.target.value })} placeholder={f.role === 'b2b' ? 'e.g. Silk Road International School' : 'e.g. Specialized School No. 1, Bukhara'} />
              </div>
              <div>
                <label className="label" htmlFor="login">Login email</label>
                <input id="login" type="email" className="input" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="director@school.uz" />
              </div>
              <div>
                <label className="label" htmlFor="pw">Password</label>
                <input id="pw" className="input font-mono" required minLength={6} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
              </div>
            </div>
            {err && <div className="mt-3 rounded-xl bg-bad/10 px-4 py-2.5 text-sm text-bad">{err}</div>}
            <button className="btn-primary mt-6 w-full py-3">Create account</button>
          </form>
        )}
      </motion.div>
    </>
  )
}
