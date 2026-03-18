import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Building2, CalendarDays, Clock,
  CreditCard, BarChart3, Package, Megaphone, LogOut,
  Turtle, CalendarCheck, UserPlus, FileText, Rocket, UsersRound,
} from 'lucide-react'
import { useAuthStore } from '../../store/auth'
import { getInitials, avatarColor, cn } from '../../utils/helpers'

// Role-based nav definitions
const EMPLOYEE_NAV = [
  { to: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/attendance',    icon: Clock,           label: 'Attendance' },
  { to: '/leaves',        icon: CalendarDays,    label: 'Leave' },
  { to: '/documents',     icon: FileText,        label: 'Documents' },
  { to: '/announcements', icon: Megaphone,       label: 'Announcements' },
  { to: '/holidays',      icon: CalendarCheck,   label: 'Holidays' },
]

// Team Lead sees ONLY attendance management — no employee dashboard items
const TEAM_LEAD_NAV = [
  { to: '/dashboard',     icon: LayoutDashboard, label: 'Attendance Dashboard' },
  { to: '/teams',         icon: UsersRound,      label: 'My Team' },
]

const HR_NAV = [
  { to: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/employees',     icon: Users,           label: 'Employees' },
  { to: '/departments',   icon: Building2,       label: 'Departments' },
  { to: '/teams',         icon: UsersRound,      label: 'Teams' },
  { to: '/attendance',    icon: Clock,           label: 'Attendance' },
  { to: '/leaves',        icon: CalendarDays,    label: 'Leave' },
  { to: '/recruitment',   icon: UserPlus,        label: 'Recruitment' },
  { to: '/onboarding',    icon: Rocket,          label: 'Onboarding' },
  { to: '/documents',     icon: FileText,        label: 'Documents' },
  { to: '/payroll',       icon: CreditCard,      label: 'Payroll' },
  { to: '/performance',   icon: BarChart3,       label: 'Performance' },
  { to: '/assets',        icon: Package,         label: 'Assets' },
  { to: '/announcements', icon: Megaphone,       label: 'Announcements' },
  { to: '/holidays',      icon: CalendarCheck,   label: 'Holidays' },
]

const ADMIN_NAV = HR_NAV  // same as HR

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const role = (user?.role as string) || 'EMPLOYEE'

  const navItems =
    role === 'TEAM_LEAD'                          ? TEAM_LEAD_NAV :
    role === 'HR_ADMIN' || role === 'SUPER_ADMIN' ? (role === 'SUPER_ADMIN' ? ADMIN_NAV : HR_NAV) :
    EMPLOYEE_NAV

  const handleLogout = () => { logout(); navigate('/login') }

  const emp      = user?.employee
  const initials = emp ? getInitials(emp.name) : 'U'
  const bgColor  = avatarColor(emp?.name || 'User')

  // Role label
  const roleLabel =
    role === 'SUPER_ADMIN' ? 'Super Admin' :
    role === 'HR_ADMIN'    ? 'HR Admin' :
    role === 'TEAM_LEAD'   ? 'Team Lead' :
    role === 'MANAGER'     ? 'Manager' : 'Employee'

  return (
    <aside className="w-64 bg-slate-900 flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700/50 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
          <Turtle className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-white font-bold text-sm leading-tight">TurtleBytes</p>
          <p className="text-slate-400 text-xs leading-tight">HRMS</p>
        </div>
      </div>

      {/* Role badge for Team Lead */}
      {role === 'TEAM_LEAD' && (
        <div className="mx-3 mt-3 px-3 py-2 bg-indigo-600/20 rounded-xl border border-indigo-500/30">
          <p className="text-indigo-300 text-xs font-semibold text-center">👔 Manager Account</p>
          <p className="text-indigo-400 text-xs text-center mt-0.5">Attendance Management</p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
              isActive
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-slate-700/50 shrink-0">
        <div
          className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          onClick={() => role !== 'TEAM_LEAD' && navigate('/profile')}
        >
          {emp?.profilePhoto
            ? <img src={emp.profilePhoto} className="w-8 h-8 rounded-full object-cover shrink-0" alt="" />
            : <div className={`w-8 h-8 rounded-full ${bgColor} flex items-center justify-center text-white text-xs font-bold shrink-0`}>{initials}</div>
          }
          <div className="min-w-0 flex-1">
            <p className="text-white text-xs font-semibold truncate leading-tight">{emp?.name || user?.email}</p>
            <p className="text-slate-400 text-xs truncate leading-tight">{roleLabel}</p>
          </div>
          <button
            onClick={e => { e.stopPropagation(); handleLogout() }}
            className="text-slate-400 hover:text-red-400 transition-colors shrink-0"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
