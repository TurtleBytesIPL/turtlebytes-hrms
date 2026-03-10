import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Building2, CalendarDays, Clock,
  CreditCard, BarChart3, Package, Megaphone, LogOut,
  Turtle, CalendarCheck, UserPlus, FileText, User, Rocket,
} from 'lucide-react'
import { useAuthStore } from '../../store/auth'
import { getInitials, avatarColor, cn } from '../../utils/helpers'

const NAV_ITEMS = [
  { to: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard',    roles: ['ALL'] },
  { to: '/employees',     icon: Users,           label: 'Employees',    roles: ['SUPER_ADMIN','HR_ADMIN','MANAGER'] },
  { to: '/departments',   icon: Building2,       label: 'Departments',  roles: ['SUPER_ADMIN','HR_ADMIN','MANAGER'] },
  { to: '/recruitment',   icon: UserPlus,        label: 'Recruitment',  roles: ['SUPER_ADMIN','HR_ADMIN','MANAGER'] },
  { to: '/onboarding',    icon: Rocket,          label: 'Onboarding',   roles: ['SUPER_ADMIN','HR_ADMIN','MANAGER'] },
  { to: '/documents',     icon: FileText,        label: 'Documents',    roles: ['ALL'] },
  { to: '/attendance',    icon: Clock,           label: 'Attendance',   roles: ['ALL'] },
  { to: '/leaves',        icon: CalendarDays,    label: 'Leave',        roles: ['ALL'] },
  { to: '/payroll',       icon: CreditCard,      label: 'Payroll',      roles: ['SUPER_ADMIN','HR_ADMIN'] },
  { to: '/performance',   icon: BarChart3,       label: 'Performance',  roles: ['SUPER_ADMIN','HR_ADMIN','MANAGER'] },
  { to: '/assets',        icon: Package,         label: 'Assets',       roles: ['SUPER_ADMIN','HR_ADMIN'] },
  { to: '/announcements', icon: Megaphone,       label: 'Announcements',roles: ['ALL'] },
  { to: '/holidays',      icon: CalendarCheck,   label: 'Holidays',     roles: ['ALL'] },
]

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const role = user?.role || 'EMPLOYEE'

  const visibleNav = NAV_ITEMS.filter(item =>
    item.roles.includes('ALL') || item.roles.includes(role)
  )

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const displayName = user?.employee?.name || user?.email || 'User'
  const roleLabel = role.replace('_', ' ')

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-100 flex flex-col z-30">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-slate-100 shrink-0">
        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
          <Turtle className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800 leading-none">TurtleBytes</p>
          <p className="text-xs text-slate-400 font-medium">HRMS</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {visibleNav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => cn('sidebar-link', isActive && 'active')}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* ─── Bottom section: Profile + Logout ─────────────────────────── */}
      <div className="border-t border-slate-100 px-3 py-3 space-y-1 shrink-0">

        {/* Profile link */}
        <NavLink
          to="/profile"
          className={({ isActive }) => cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full',
            isActive
              ? 'bg-primary-50 text-primary-700'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
          )}
        >
          {/* Avatar */}
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
            avatarColor(displayName)
          )}>
            {getInitials(displayName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-700 truncate leading-tight">{displayName}</p>
            <p className="text-xs text-slate-400 truncate leading-tight">{roleLabel}</p>
          </div>
          <User className="w-3.5 h-3.5 text-slate-300 shrink-0" />
        </NavLink>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all w-full"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
