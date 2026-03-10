import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/auth'
import Layout from './components/layout/Layout'
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import EmployeesPage from './pages/employees/EmployeesPage'
import DepartmentsPage from './pages/departments/DepartmentsPage'
import LeavesPage from './pages/leaves/LeavesPage'
import AttendancePage from './pages/attendance/AttendancePage'
import PayrollPage from './pages/payroll/PayrollPage'
import RecruitmentPage from './pages/recruitment/RecruitmentPage'
import DocumentsPage from './pages/documents/DocumentsPage'
import OnboardingPage from './pages/onboarding/OnboardingPage'
import ProfilePage from './pages/profile/ProfilePage'
import AnnouncementsPage from './pages/misc/AnnouncementsPage'

const qc = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30000 } } })

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"     element={<DashboardPage />} />
            <Route path="employees"     element={<EmployeesPage />} />
            <Route path="departments"   element={<DepartmentsPage />} />
            <Route path="recruitment"   element={<RecruitmentPage />} />
            <Route path="onboarding"    element={<OnboardingPage />} />
            <Route path="documents"     element={<DocumentsPage />} />
            <Route path="attendance"    element={<AttendancePage />} />
            <Route path="leaves"        element={<LeavesPage />} />
            <Route path="payroll"       element={<PayrollPage />} />
            <Route path="announcements" element={<AnnouncementsPage />} />
            <Route path="profile"       element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
