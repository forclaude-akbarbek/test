import { AnimatePresence, motion } from 'framer-motion'
import { BarChart3, BookA, CalendarCheck, ClipboardList, Crown, LayoutDashboard, Library, LogOut, Menu, PenLine, Settings, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Logo } from '../../components/Logo'
import { ThemeToggle } from '../../components/ThemeToggle'
import { logout, touchActivity, useSession } from '../../lib/store'

export const SECTIONS = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/practice', label: 'Practice', icon: PenLine },
  { to: '/app/plan', label: 'Study Plan', icon: CalendarCheck },
  { to: '/app/results', label: 'Results', icon: ClipboardList },
  { to: '/app/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/app/bank', label: 'Question Bank', icon: Library },
  { to: '/app/vocabulary', label: 'Vocabulary', icon: BookA },
  { to: '/app/subscription', label: 'Subscription', icon: Crown },
]

function SideNav({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useSession()
  const nav = useNavigate()
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5">
        <Logo to="/app" />
      </div>
      <nav className="flex-1 space-y-0.5 px-3">
        {SECTIONS.map((s) => (
          <NavLink
            key={s.to}
            to={s.to}
            end={s.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? 'text-sky-deep dark:text-sky' : 'text-ink/75 hover:bg-ink/5 hover:text-ink'}`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <motion.span layoutId="nav-active" className="absolute inset-0 rounded-xl bg-sky-soft" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
                <s.icon size={18} className="relative" />
                <span className="relative">{s.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="m-3 rounded-2xl border border-line bg-surface p-3">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-sky text-sm font-bold text-white dark:text-black">
            {user?.name
              .split(' ')
              .map((p) => p[0])
              .slice(0, 2)
              .join('')}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{user?.name}</div>
            <div className="truncate text-xs text-muted">{user?.orgId ? 'Premium · school licence' : user?.plan === 'premium' ? 'Premium' : 'Free plan'}</div>
          </div>
          <NavLink to="/app/settings" onClick={onNavigate} className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-ink/5 hover:text-ink" aria-label="Settings" title="Settings">
            <Settings size={16} />
          </NavLink>
          <button
            onClick={() => {
              logout()
              nav('/')
            }}
            className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-ink/5 hover:text-ink"
            aria-label="Log out"
            title="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PortalLayout() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => {
    touchActivity()
  }, [])
  const current = pathname === '/app/settings' ? { label: 'Settings' } : SECTIONS.find((s) => (s.end ? pathname === s.to : pathname.startsWith(s.to)))
  return (
    <div className="min-h-screen bg-surface">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line bg-bg lg:block">
        <SideNav />
      </aside>
      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'spring', stiffness: 400, damping: 38 }} className="fixed inset-y-0 left-0 z-50 w-64 border-r border-line bg-bg lg:hidden">
              <SideNav onNavigate={() => setOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      <div className="lg:pl-64">
        <header className="glass sticky top-0 z-20 flex h-14 items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-2">
            <button className="grid h-9 w-9 place-items-center rounded-full hover:bg-ink/5 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div className="text-sm font-semibold">{current?.label}</div>
          </div>
          <ThemeToggle />
        </header>
        <main key={pathname} className="page-enter mx-auto max-w-6xl px-4 py-8 sm:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export function PageTitle({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        {sub && <p className="mt-1.5 text-muted">{sub}</p>}
      </div>
      {right}
    </div>
  )
}
