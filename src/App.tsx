import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './store/auth'
import type { Role } from './types'

import LoginPage        from './pages/LoginPage'
import TVDisplay        from './pages/TVDisplay'
import Layout           from './layouts/Layout'
import Overview         from './pages/admin/Overview'
import UsersPage        from './pages/admin/Users'
import VenuesPage       from './pages/admin/Venues'
import TimetablePage    from './pages/admin/Timetable'
import ImportPage       from './pages/admin/Import'
import RequestsAdmin    from './pages/admin/Requests'
import AcademicYears    from './pages/admin/AcademicYears'
import CRPortal         from './pages/cr/CRPortal'
import LecturerPage     from './pages/lecturer/Schedule'
import type { JSX } from 'react'

function Guard({ children, roles }: { children: JSX.Element; roles?: Role[] }) {
  const { isAuth, user } = useAuth()
  if (!isAuth) return <Navigate to="/login" replace />
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

function Home() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'ADMIN')     return <Navigate to="/dashboard" replace />
  if (user.role === 'CLASS_REP') return <Navigate to="/cr" replace />
  return <Navigate to="/lecturer" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"        element={<Home />} />
        <Route path="/login"   element={<LoginPage />} />
        <Route path="/display" element={<TVDisplay />} />

        {/* Admin */}
        <Route path="/dashboard" element={<Guard roles={['ADMIN']}><Layout /></Guard>}>
          <Route index element={<Overview />} />
          <Route path="users"          element={<UsersPage />} />
          <Route path="venues"         element={<VenuesPage />} />
          <Route path="timetable"      element={<TimetablePage />} />
          <Route path="timetable/import" element={<ImportPage />} />
          <Route path="requests"       element={<RequestsAdmin />} />
          <Route path="academic-years" element={<AcademicYears />} />
        </Route>

        {/* Class Rep */}
        <Route path="/cr" element={<Guard roles={['CLASS_REP']}><Layout /></Guard>}>
          <Route index element={<CRPortal />} />
        </Route>

        {/* Lecturer */}
        <Route path="/lecturer" element={<Guard roles={['LECTURER']}><Layout /></Guard>}>
          <Route index element={<LecturerPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
