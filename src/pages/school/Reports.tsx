import { Download, FileText, Printer } from 'lucide-react'
import { useMemo, useState } from 'react'
import { DOMAINS, summarize } from '../../data/schools'
import { appliesTo, assignmentStatus, assignmentsForSchool, downloadCsv, relDays } from '../../lib/school'
import { PageTitle } from '../portal/Layout'
import { useSchool } from './context'

export default function Reports() {
  const { org, roster, classes, className, state } = useSchool()
  const [preview, setPreview] = useState(false)
  const sum = useMemo(() => summarize(roster), [roster])
  const assignments = assignmentsForSchool(state, org)
  const stamp = new Date().toISOString().slice(0, 10)

  const exports = [
    {
      t: 'Student results',
      d: 'Every student with class, scores, target, mocks taken and last activity.',
      run: () =>
        downloadCsv(`${org.name} — student results ${stamp}.csv`, [
          ['Name', 'Class', 'Predicted', 'R&W', 'Math', 'Target', 'Mocks taken', 'Questions answered', 'Last active'],
          ...roster.map((s) => [s.name, className(s.classId), s.predicted, s.rw, s.math, s.targetScore, s.examsTaken, s.questionsAnswered, relDays(s.lastActiveDays)]),
        ]),
    },
    {
      t: 'Skills by student',
      d: 'Accuracy in all eight SAT domains for every student.',
      run: () => downloadCsv(`${org.name} — skills ${stamp}.csv`, [['Name', 'Class', ...DOMAINS], ...roster.map((s) => [s.name, className(s.classId), ...DOMAINS.map((d) => s.domains[d])])]),
    },
    {
      t: 'Assignment completion',
      d: 'Completion and score for every assignment and student.',
      run: () =>
        downloadCsv(`${org.name} — assignments ${stamp}.csv`, [
          ['Assignment', 'Due', 'Student', 'Class', 'Done', 'Score'],
          ...assignments.flatMap((a) => roster.filter((s) => appliesTo(a, s)).map((s) => {
            const st = assignmentStatus(state, a, s)
            return [a.title, a.due.slice(0, 10), s.name, className(s.classId), st.done ? 'Yes' : 'No', st.score ?? '']
          })),
        ]),
    },
    {
      t: 'Class summary',
      d: 'Average score, activity and domain accuracy for each class.',
      run: () =>
        downloadCsv(`${org.name} — classes ${stamp}.csv`, [
          ['Class', 'Students', 'Average', 'Active this week', '1400+', ...DOMAINS],
          ...classes.map((c) => {
            const cs = summarize(roster.filter((s) => s.classId === c.id))
            return [c.name, cs.students, cs.avg, cs.active7, cs.above1400, ...DOMAINS.map((d) => Math.round(cs.domains[d]))]
          }),
        ]),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <PageTitle title="Reports" sub="Download data for your records or print a one-page summary." right={<button onClick={() => setPreview(!preview)} className="btn-primary"><FileText size={16} /> {preview ? 'Hide summary' : 'School summary'}</button>} />
        <div className="grid gap-4 sm:grid-cols-2">
          {exports.map((e) => (
            <div key={e.t} className="card flex items-start justify-between gap-4 p-5">
              <div>
                <div className="font-semibold">{e.t}</div>
                <div className="mt-1 text-sm text-muted">{e.d}</div>
              </div>
              <button onClick={e.run} className="btn-outline shrink-0"><Download size={16} /> CSV</button>
            </div>
          ))}
        </div>
      </div>

      {preview && (
        <div className="card p-8 print:border-0 print:p-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted">Horizon SAT · School summary</div>
              <h2 className="mt-1 text-2xl font-bold">{org.name}</h2>
              <div className="text-sm text-muted">{org.city} · {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
            <button onClick={() => window.print()} className="btn-outline print:hidden"><Printer size={16} /> Print</button>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              ['Students', sum.students],
              ['Average score', sum.avg ?? '—'],
              ['Active this week', `${sum.students ? Math.round((sum.active7 / sum.students) * 100) : 0}%`],
              ['Average growth', sum.growth != null ? `+${sum.growth}` : '—'],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl border border-line p-3">
                <div className="text-xs text-muted">{k}</div>
                <div className="text-xl font-bold tabular-nums">{v}</div>
              </div>
            ))}
          </div>
          <table className="mt-6 w-full text-sm">
            <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="py-2 font-semibold">Class</th>
                <th className="py-2 text-right font-semibold">Students</th>
                <th className="py-2 text-right font-semibold">Average</th>
                <th className="py-2 text-right font-semibold">R&W</th>
                <th className="py-2 text-right font-semibold">Math</th>
                <th className="py-2 text-right font-semibold">1400+</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {classes.map((c) => {
                const cs = summarize(roster.filter((s) => s.classId === c.id))
                return (
                  <tr key={c.id}>
                    <td className="py-2 font-medium">{c.name}</td>
                    <td className="py-2 text-right tabular-nums">{cs.students}</td>
                    <td className="py-2 text-right font-semibold tabular-nums">{cs.avg ?? '—'}</td>
                    <td className="py-2 text-right tabular-nums">{cs.avgRw ?? '—'}</td>
                    <td className="py-2 text-right tabular-nums">{cs.avgMath ?? '—'}</td>
                    <td className="py-2 text-right tabular-nums">{cs.above1400}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="mt-6 text-sm">
            <div className="font-semibold">Domain accuracy</div>
            <div className="mt-2 grid grid-cols-2 gap-x-8 gap-y-1 sm:grid-cols-4">
              {DOMAINS.map((d) => (
                <div key={d} className="flex justify-between gap-2 border-b border-line py-1">
                  <span className="truncate text-muted">{d}</span>
                  <span className="font-semibold tabular-nums">{Math.round(sum.domains[d])}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
