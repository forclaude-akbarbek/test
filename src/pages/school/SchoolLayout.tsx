import { AnimatePresence, motion } from 'framer-motion'
import { BarChart3, ClipboardList, FileText, LayoutDashboard, LogOut, Menu, School, Settings, UserRound, Users, X } from 'lucide-react'
import { useState } from 'react'
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Logo } from '../../components/Logo'
import { ThemeToggle } from '../../components/ThemeToggle'
import { logout, orgOf, useSession } from '../../lib/store'
import { SchoolProvider } from './context'

export function schoolSections(isTeacher: boolean, base = '/school') {
  return [
    { to: base, label: 'Overview', icon: LayoutDashboard, end: true },
    { to: `${base}/students`, label: 'Students', icon: Users },
    { to: `${base}/classes`, label: 'Classes', icon: School },
    { to: `${base}/assignments`, label: 'Assignments', icon: ClipboardList },
    { to: `${base}/results`, label: 'Results', icon: BarChart3 },
    ...(isTeacher ? [] : [{ to: `${base}/teachers`, label: 'Teachers', icon: UserRound }]),
    { to: `${base}/reports`, label: 'Reports', icon: FileText },
    { to: `${base}/settings`, label: 'Settings', icon: Settings },
  ]
}

export default function SchoolLayout() {
  const { user } = useSession()
  const nav = useNavigate()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const org = orgOf(user)
  if (!user || !org || org.kind === 'network') return <Navigate to="/login" replace />
  const isTeacher = user.role === 'teacher'
  const sections = schoolSections(isTeacher)
  const current = sections.find((s) => (s.end ? pathname === s.to : pathname.startsWith(s.to)))
  const kindLabel = isTeacher ? 'Teacher' : org.kind === 'private' ? 'Private school' : 'Government school'

  const side = (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5">
        <Logo to="/school" />
      </div>
      <div className="mx-3 mb-3 rounded-2xl bg-sky-soft/70 px-4 py-3">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-sky-deep dark:text-sky">{kindLabel}</div>
        <div className="mt-0.5 text-sm font-semibold leading-snug">{org.name}</div>
        <div className="text-xs text-muted">{org.city}</div>
      </div>
      <nav className="flex-1 space-y-0.5 px-3">
        {sections.map((s) => (
          <NavLink
            key={s.to}
            to={s.to}
            end={s.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) => `relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? 'text-sky-deep dark:text-sky' : 'text-ink/75 hover:bg-ink/5 hover:text-ink'}`}
          >
            {({ isActive }) => (
              <>
                {isActive && <motion.span layoutId="school-nav" className="absolute inset-0 rounded-xl bg-sky-soft" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
                <s.icon size={18} className="relative" />
                <span className="relative">{s.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="m-3 flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sky text-sm font-bold text-white dark:text-black">
          {user.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{user.name}</div>
          <div className="truncate text-xs text-muted">{isTeacher ? 'Teacher' : org.kind === 'private' ? 'Director' : 'School administrator'}</div>
        </div>
        <button onClick={() => { logout(); nav('/') }} className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-ink/5 hover:text-ink" aria-label="Log out" title="Log out">
          <LogOut size={16} />
        </button>
      </div>
    </div>
  )

  return (
    <SchoolProvider value={{ org, readOnly: false, teacherId: isTeacher ? user.teacherId : undefined, base: '/school' }}>
      <div className="min-h-screen bg-surface">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line bg-bg print:hidden lg:block">{side}</aside>
        <AnimatePresence>
          {open && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />
              <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'spring', stiffness: 400, damping: 38 }} className="fixed inset-y-0 left-0 z-50 w-64 border-r border-line bg-bg lg:hidden">
                {side}
              </motion.aside>
            </>
          )}
        </AnimatePresence>
        <div className="lg:pl-64 print:pl-0">
          <header className="glass sticky top-0 z-20 flex h-14 items-center justify-between px-4 print:hidden sm:px-8">
            <div className="flex items-center gap-2">
              <button className="grid h-9 w-9 place-items-center rounded-full hover:bg-ink/5 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
                {open ? <X size={18} /> : <Menu size={18} />}
              </button>
              <div className="text-sm font-semibold">{current?.label}</div>
            </div>
            <ThemeToggle />
          </header>
          <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SchoolProvider>
  )
}
