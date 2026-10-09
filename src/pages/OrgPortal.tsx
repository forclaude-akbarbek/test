import { motion } from 'framer-motion'
import { BarChart3, Building2, ClipboardCheck, LogOut, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { ThemeToggle } from '../components/ThemeToggle'
import { logout, useSession } from '../lib/store'

export default function OrgPortal({ kind }: { kind: 'b2b' | 'b2g' }) {
  const { user } = useSession()
  const nav = useNavigate()
  const label = kind === 'b2b' ? 'Private School Portal' : 'Government School Portal'
  const upcoming = [
    { icon: Users, t: 'Classes & students', d: 'Bulk-import students and organize them into classes.' },
    { icon: ClipboardCheck, t: 'Assignments & test days', d: 'Assign mocks and practice sets, run supervised test days.' },
    { icon: BarChart3, t: kind === 'b2b' ? 'School analytics' : 'Programme analytics', d: kind === 'b2b' ? 'Class heatmaps by skill and score growth over time.' : 'Results across schools, regions and cohorts.' },
  ]
  return (
    <div className="min-h-screen bg-surface">
      <header className="glass sticky top-0 z-20">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo to={`/${kind}`} />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button onClick={() => { logout(); nav('/') }} className="btn-ghost px-3 text-sm"><LogOut size={16} /> Log out</button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-[32px] bg-gradient-to-br from-sky to-sky-deep p-10 text-white sm:p-14 dark:from-sky-soft dark:to-elevated dark:text-ink">
          <div className="flex items-center gap-2 text-sm font-semibold opacity-90">
            <Building2 size={16} /> {label}
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-6xl">{user?.org ?? user?.name}</h1>
          <p className="mt-4 max-w-xl text-lg opacity-90">Your dedicated portal is being prepared. Here is what your school will be able to do.</p>
          <div className="mt-6 inline-flex rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold backdrop-blur dark:bg-white/10">Coming soon</div>
        </motion.div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {upcoming.map((u, i) => (
            <motion.div key={u.t} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08 }} className="card p-6">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-soft text-sky-deep dark:text-sky"><u.icon size={22} /></div>
              <div className="mt-5 text-lg font-semibold">{u.t}</div>
              <div className="mt-1 text-sm text-muted">{u.d}</div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  )
}
