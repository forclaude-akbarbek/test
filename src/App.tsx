import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
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
import ExamRunner from './pages/exam/ExamRunner'
import OrgPortal from './pages/OrgPortal'
import Admin from './pages/Admin'
import { useSession } from './lib/store'
import type { Role } from './lib/types'

import { homeFor } from './lib/nav'

function RequireRole({ role, children }: { role: Role; children: React.ReactNode }) {
  const { user } = useSession()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) return <Navigate to={homeFor(user.role)} replace />
  return <>{children}</>
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo(0, 0), [pathname])
  return null
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Auth mode="login" />} />
        <Route path="/signup" element={<Auth mode="signup" />} />
        <Route
          path="/app"
          element={
            <RequireRole role="student">
              <PortalLayout />
            </RequireRole>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="practice" element={<Practice />} />
          <Route path="plan" element={<StudyPlan />} />
          <Route path="results" element={<Results />} />
          <Route path="results/:id" element={<ResultDetail />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="bank" element={<QuestionBank />} />
          <Route path="vocabulary" element={<Vocabulary />} />
          <Route path="subscription" element={<Subscription />} />
        </Route>
        <Route
          path="/exam/:testId"
          element={
            <RequireRole role="student">
              <ExamRunner />
            </RequireRole>
          }
        />
        <Route path="/b2b" element={<RequireRole role="b2b"><OrgPortal kind="b2b" /></RequireRole>} />
        <Route path="/b2g" element={<RequireRole role="b2g"><OrgPortal kind="b2g" /></RequireRole>} />
        <Route path="/admin" element={<RequireRole role="admin"><Admin /></RequireRole>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
