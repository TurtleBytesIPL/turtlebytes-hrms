import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/auth'
import Layout from './components/layout/Layout'
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import EmployeesPage from './pages/employees/EmployeesPage'
import { DepartmentsPage } from './pages/departments/DepartmentsPage'
import DepartmentEmployeesPage from './pages/departments/DepartmentEmployeesPage'
import LeavesPage from './pages/leaves/LeavesPage'
import AttendancePage from './pages/attendance/AttendancePage'
import PayrollPage from './pages/payroll/PayrollPage'
import { PerformancePage, AssetsPage, AnnouncementsPage, HolidaysPage } from './pages/misc/MiscPages'
import RecruitmentPage from './pages/recruitment/RecruitmentPage'
import OnboardingPage from './pages/onboarding/OnboardingPage'
import DocumentsPage from './pages/documents/DocumentsPage'
import ProfilePage from './pages/profile/ProfilePage'


function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="departments" element={<DepartmentsPage />} />
          <Route path="departments/:id" element={<DepartmentEmployeesPage />} />
          <Route path="leaves" element={<LeavesPage />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="payroll" element={<PayrollPage />} />
          <Route path="performance" element={<PerformancePage />} />
          <Route path="assets" element={<AssetsPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
          <Route path="holidays" element={<HolidaysPage />} />
          <Route path="recruitment" element={<RecruitmentPage />} />
          <Route path="onboarding" element={<OnboardingPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
