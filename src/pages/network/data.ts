import { useMemo } from 'react'
import { REGIONS, summarize, type RosterStudent, type SchoolSummary } from '../../data/schools'
import { childSchools, schoolRoster } from '../../lib/school'
import { orgOf, useAppState, useSession } from '../../lib/store'
import type { Org } from '../../lib/types'

export interface SchoolRow {
  org: Org
  roster: RosterStudent[]
  sum: SchoolSummary
}

/** All schools of the signed-in network with their rosters and summaries. */
export function useNetwork() {
  const st = useAppState()
  const { user } = useSession()
  const network = orgOf(user, st)!
  const schools: SchoolRow[] = useMemo(
    () =>
      childSchools(st, network.id).map((org) => {
        const roster = schoolRoster(st, org.id)
        return { org, roster, sum: summarize(roster) }
      }),
    [st, network.id],
  )
  const students = useMemo(() => schools.flatMap((s) => s.roster), [schools])
  const total = useMemo(() => summarize(students), [students])
  const regions = useMemo(
    () =>
      REGIONS.map((r) => {
        const rs = schools.filter((s) => s.org.region === r.name)
        const roster = rs.flatMap((s) => s.roster)
        return { name: r.name, city: r.city, schools: rs, roster, sum: summarize(roster) }
      }),
    [schools],
  )
  return { network, schools, students, total, regions, state: st }
}
