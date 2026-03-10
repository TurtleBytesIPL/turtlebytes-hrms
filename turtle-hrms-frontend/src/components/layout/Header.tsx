import { Bell } from 'lucide-react'
import { ReactNode } from 'react'
import { useAuthStore } from '../../store/auth'

interface HeaderProps {
  title: ReactNode
  subtitle?: ReactNode
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { user } = useAuthStore()

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-slate-100">
      <div>
        <h1 className="text-lg font-bold text-slate-800">{title}</h1>
        {subtitle && <div className="text-xs text-slate-400 mt-0.5">{subtitle}</div>}
      </div>
      <div className="flex items-center gap-2">
        <button className="btn-ghost h-9 w-9 !p-0 rounded-lg">
          <Bell className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-slate-200" />
        <div className="text-right">
          <p className="text-xs font-semibold text-slate-700">{user?.employee?.name || user?.email}</p>
          <p className="text-xs text-slate-400">{user?.employee?.jobTitle || user?.role}</p>
        </div>
      </div>
    </header>
  )
}
