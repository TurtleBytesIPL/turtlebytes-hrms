import { cn, getInitials, avatarColor } from '../../utils/helpers'
import { Loader2 } from 'lucide-react'

// ─── Stat Card ────────────────────────────────────────────────────────────────
export function StatCard({ title, value, icon: Icon, color = 'primary', trend }: any) {
  const colors: any = {
    primary: 'bg-primary-50 text-primary-600',
    green:   'bg-emerald-50 text-emerald-600',
    orange:  'bg-orange-50 text-orange-600',
    red:     'bg-red-50 text-red-600',
    blue:    'bg-blue-50 text-blue-600',
    violet:  'bg-violet-50 text-violet-600',
  }
  return (
    <div className="card p-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{value ?? '—'}</p>
          {trend && <p className="text-xs text-slate-400 mt-1">{trend}</p>}
        </div>
        <div className={cn('p-2.5 rounded-xl', colors[color])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
export function Avatar({ name, size = 'sm', photo }: { name: string; size?: 'xs' | 'sm' | 'md' | 'lg'; photo?: string }) {
  const sizes = { xs: 'w-6 h-6 text-xs', sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' }
  if (photo) return <img src={photo} className={cn('rounded-full object-cover', sizes[size])} alt={name} />
  return (
    <div className={cn('rounded-full flex items-center justify-center font-bold shrink-0', sizes[size], avatarColor(name))}>
      {getInitials(name)}
    </div>
  )
}

// ─── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ label, color }: { label: string; color: string }) {
  return <span className={cn('badge', color)}>{label}</span>
}

// ─── Loading Spinner ──────────────────────────────────────────────────────────
export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('animate-spin text-primary-600', className || 'w-6 h-6')} />
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <Spinner className="w-8 h-8" />
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }: any) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-4 bg-slate-100 rounded-2xl mb-4">
        <Icon className="w-8 h-8 text-slate-400" />
      </div>
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {description && <p className="text-xs text-slate-400 mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ─── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, width = 'max-w-lg' }: any) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative bg-white rounded-2xl shadow-2xl w-full animate-fade-in max-h-[90vh] overflow-y-auto', width)}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="btn-ghost h-8 w-8 !p-0 rounded-lg text-slate-400">✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

// ─── Table ─────────────────────────────────────────────────────────────────────
export function Table({ headers, children, loading }: { headers: string[]; children: React.ReactNode; loading?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-100">
            {headers.map((h) => <th key={h} className="table-th">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {loading ? (
            <tr><td colSpan={headers.length} className="py-12 text-center"><Spinner /></td></tr>
          ) : children}
        </tbody>
      </table>
    </div>
  )
}

// ─── Form Field ───────────────────────────────────────────────────────────────
export function FormField({ label, error, children }: any) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export function Pagination({ meta, onChange }: { meta: any; onChange: (page: number) => void }) {
  if (!meta || meta.totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
      <p className="text-xs text-slate-400">
        Showing {((meta.page - 1) * meta.limit) + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
      </p>
      <div className="flex gap-1">
        <button className="btn-secondary h-8 px-3 text-xs" disabled={meta.page === 1} onClick={() => onChange(meta.page - 1)}>Prev</button>
        <button className="btn-secondary h-8 px-3 text-xs" disabled={meta.page === meta.totalPages} onClick={() => onChange(meta.page + 1)}>Next</button>
      </div>
    </div>
  )
}
