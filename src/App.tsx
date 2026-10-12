import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Landing from './pages/Landing'
import Auth, { Forgot, Welcome } from './pages/Auth'
import PortalLayout from './pages/portal/Layout'
import Dashboard from './pages/portal/Dashboard'
import Practice from './pages/portal/Practice'
import StudyPlan from './pages/portal/StudyPlan'
import Results from './pages/portal/Results'
import ResultDetail from './pages/portal/ResultDetail'
import Analytics from './pages/portal/Analytics'
import QuestionBank from './pages/portal/QuestionBank'
import Vocabulary from './pages/portal/Vocabulary'
import Subscription from './pages/portal/Subscription'
import AccountSettings from './pages/portal/AccountSettings'
import ExamRunner from './pages/exam/ExamRunner'
import Admin from './pages/Admin'
import SchoolLayout from './pages/school/SchoolLayout'
import SchoolOverview from './pages/school/Overview'
import Students from './pages/school/Students'
import Classes, { ClassDetail } from './pages/school/Classes'
import Assignments, { AssignmentDetail } from './pages/school/Assignments'
import SchoolResults from './pages/school/Results'
import Teachers from './pages/school/Teachers'
import Reports from './pages/school/Reports'
import SchoolSettings from './pages/school/Settings'
import NetworkLayout from './pages/network/NetworkLayout'
import NetworkOverview from './pages/network/Overview'
import { MockDays, NetworkReports, NetworkSettings, RegionDetail, Regions, SchoolView, Schools, Talent } from './pages/network/Pages'
import { homePath, useSession } from './lib/store'
import type { Role } from './lib/types'

function RequireRole({ roles, children }: { roles: Role[]; children: React.ReactNode }) {
  const { user } = useSession()
  if (!user) return <Navigate to="/login" replace />
  if (user.mustChangePassword) return <Navigate to="/welcome" replace />
  if (!roles.includes(user.role)) return <Navigate to={homePath(user)} replace />
  return <>{children}</>
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo(0, 0), [pathname])
  return null
}

const schoolPages = (
  <>
    <Route path="students" element={<Students />} />
    <Route path="classes" element={<Classes />} />
    <Route path="classes/:id" element={<ClassDetail />} />
    <Route path="assignments" element={<Assignments />} />
    <Route path="assignments/:id" element={<AssignmentDetail />} />
    <Route path="results" element={<SchoolResults />} />
  </>
)

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Auth mode="login" />} />
        <Route path="/signup" element={<Auth mode="signup" />} />
        <Route path="/forgot" element={<Forgot />} />
        <Route path="/welcome" element={<Welcome />} />

        <Route path="/app" element={<RequireRole roles={['student']}><PortalLayout /></RequireRole>}>
          <Route index element={<Dashboard />} />
          <Route path="practice" element={<Practice />} />
          <Route path="plan" element={<StudyPlan />} />
          <Route path="results" element={<Results />} />
          <Route path="results/:id" element={<ResultDetail />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="bank" element={<QuestionBank />} />
          <Route path="vocabulary" element={<Vocabulary />} />
          <Route path="subscription" element={<Subscription />} />
          <Route path="settings" element={<AccountSettings />} />
        </Route>
        <Route path="/exam/:testId" element={<RequireRole roles={['student']}><ExamRunner /></RequireRole>} />

        <Route path="/school" element={<RequireRole roles={['b2b', 'b2g', 'teacher']}><SchoolLayout /></RequireRole>}>
          <Route index element={<SchoolOverview />} />
          {schoolPages}
          <Route path="teachers" element={<Teachers />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<SchoolSettings />} />
        </Route>

        <Route path="/network" element={<RequireRole roles={['b2g']}><NetworkLayout /></RequireRole>}>
          <Route index element={<NetworkOverview />} />
          <Route path="regions" element={<Regions />} />
          <Route path="regions/:name" element={<RegionDetail />} />
          <Route path="schools" element={<Schools />} />
          <Route path="schools/:orgId" element={<SchoolView />}>
            <Route index element={<SchoolOverview embedded />} />
            {schoolPages}
          </Route>
          <Route path="talent" element={<Talent />} />
          <Route path="mock-days" element={<MockDays />} />
          <Route path="reports" element={<NetworkReports />} />
          <Route path="settings" element={<NetworkSettings />} />
        </Route>

        <Route path="/admin" element={<RequireRole roles={['admin']}><Admin /></RequireRole>} />
        <Route path="/b2b" element={<Navigate to="/school" replace />} />
        <Route path="/b2g" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
