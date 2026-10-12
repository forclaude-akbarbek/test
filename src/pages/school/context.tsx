import { createContext, useContext, useMemo } from 'react'
import type { RosterStudent } from '../../data/schools'
import { schoolRoster } from '../../lib/school'
import { useAppState } from '../../lib/store'
import type { Org, SchoolClass } from '../../lib/types'

export interface SchoolCtx {
  org: Org
  /** Network users see a school without editing it. */
  readOnly: boolean
  /** Teachers only see their own classes. */
  teacherId?: string
  /** Base path for links inside this school's pages. */
  base: string
}

const Ctx = createContext<SchoolCtx | null>(null)
export const SchoolProvider = Ctx.Provider

export function useSchool() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useSchool outside SchoolProvider')
  const st = useAppState()
  const org = st.orgs.find((o) => o.id === ctx.org.id) ?? ctx.org
  const classes: SchoolClass[] = useMemo(() => {
    const all = st.classes.filter((c) => c.orgId === org.id).sort((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true }))
    return ctx.teacherId ? all.filter((c) => c.teacherId === ctx.teacherId) : all
  }, [st.classes, org.id, ctx.teacherId])
  const roster: RosterStudent[] = useMemo(() => {
    const all = schoolRoster(st, org.id)
    if (!ctx.teacherId) return all
    const ids = new Set(classes.map((c) => c.id))
    return all.filter((s) => s.classId && ids.has(s.classId))
  }, [st, org.id, ctx.teacherId, classes])
  const className = (id?: string) => st.classes.find((c) => c.id === id)?.name ?? 'Unassigned'
  const teachers = st.teachers.filter((t) => t.orgId === org.id)
  return { ...ctx, org, classes, roster, className, teachers, state: st }
}
