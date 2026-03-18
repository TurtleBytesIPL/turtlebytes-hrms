import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, CheckCircle, XCircle, Calendar, Clock,
  CalendarDays, Heart, Briefcase, FileText, ChevronDown
} from 'lucide-react'
import { leavesApi } from '../../services/api'
import { useAuthStore, useIsManager } from '../../store/auth'
import Header from '../../components/layout/Header'
import { Badge, Modal, FormField, PageLoader, Table, Pagination, EmptyState } from '../../components/ui'
import { leaveStatusColor, formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'

// ─── Leave Type Config ────────────────────────────────────────────────────────
const LEAVE_TYPES = [
  { value: 'ANNUAL', label: 'Annual Leave', desc: 'Planned vacation or personal time' },
  { value: 'SICK', label: 'Sick Leave', desc: ' Sick leave' },
  { value: 'UNPAID', label: 'Unpaid Leave', desc: 'Leave of absence without pay' },
  { value: 'OTHER', label: 'Other', desc: 'Miscellaneous leave reasons' },
]

const LEAVE_ICON_COLOR: Record<string, string> = {
  ANNUAL: 'bg-blue-50 text-blue-600 border-blue-100',
  SICK: 'bg-blue-50 text-blue-600 border-blue-100',
  UNPAID: 'bg-slate-50 text-slate-600 border-slate-200',
  OTHER: 'bg-violet-50 text-violet-600 border-violet-100',
}

function LeaveIcon({ type, size = 'sm' }: { type: string; size?: 'sm' | 'md' }) {
  const icons: Record<string, any> = {
    ANNUAL: CalendarDays, MATERNITY: Heart, UNPAID: Briefcase, OTHER: FileText,
  }
  const Icon = icons[type] || FileText
  const cls = LEAVE_ICON_COLOR[type] || 'bg-slate-50 text-slate-500 border-slate-200'
  const sz = size === 'md' ? 'w-5 h-5' : 'w-4 h-4'
  const pad = size === 'md' ? 'p-2.5' : 'p-1.5'
  return (
    <div className={`${pad} rounded-xl border ${cls} shrink-0`}>
      <Icon className={sz} />
    </div>
  )
}

export default function LeavesPage() {
  const { user } = useAuthStore()
  const isManager = useIsManager()
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [showApply, setShowApply] = useState(false)
  const [approveLeave, setApproveLeave] = useState<any>(null)
  const [form, setForm] = useState({
    leaveType: 'ANNUAL', startDate: '', endDate: '', reason: '', isHalfDay: false,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['leaves', page],
    queryFn: () => leavesApi.list({ page, limit: 15 }).then(r => r.data),
  })

  const { data: balancesRaw } = useQuery({
    queryKey: ['leave-balances'],
    queryFn: () => leavesApi.myBalances().then(r => r.data),
  })
  const balances: any[] = Array.isArray(balancesRaw) ? balancesRaw : []

  const applyMut = useMutation({
    mutationFn: (d: any) => leavesApi.apply(d),
    onSuccess: () => {
      toast.success('Leave application submitted successfully.')
      qc.invalidateQueries({ queryKey: ['leaves'] })
      qc.invalidateQueries({ queryKey: ['leave-balances'] })
      setShowApply(false)
      setForm({ leaveType: 'ANNUAL', startDate: '', endDate: '', reason: '', isHalfDay: false })
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message
      toast.error(Array.isArray(msg) ? msg[0] : (msg || 'Failed to submit leave request'))
    },
  })

  const approveMut = useMutation({
    mutationFn: ({ id, status }: any) => leavesApi.approve(id, { status }),
    onSuccess: () => {
      toast.success('Leave status updated.')
      qc.invalidateQueries({ queryKey: ['leaves'] })
      setApproveLeave(null)
    },
  })

  const cancelMut = useMutation({
    mutationFn: (id: string) => leavesApi.cancel(id),
    onSuccess: () => { toast.success('Leave cancelled.'); qc.invalidateQueries({ queryKey: ['leaves'] }) },
  })

  const leaves = data?.data || []
  const selectedType = LEAVE_TYPES.find(t => t.value === form.leaveType)
  

const uniqueBalances = Object.values(
  balances.reduce((acc: any, curr: any) => {
    acc[curr.leaveType] = curr
    return acc
  }, {})
  
)

  return (
    <div>
      <Header title="Leave Management" subtitle="Apply and manage leave requests" />

      <div className="p-6 space-y-5">

        {/* ── Leave Balance Cards ──────────────────────────────────────── */}
        {uniqueBalances.length > 0 &&  (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {uniqueBalances.map((b: any) => {
              const available = b.allocated - b.used - b.pending
              const pct = b.allocated > 0 ? Math.min(100, Math.round((available / b.allocated) * 100)) : 0
              const barColor = available > 5 ? 'bg-emerald-500' : available > 0 ? 'bg-amber-400' : 'bg-red-400'
              return (
                <div key={b.leaveType} className="card p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <LeaveIcon type={b.leaveType} size="md" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-500 truncate">
                        {LEAVE_TYPES.find(t => t.value === b.leaveType)?.label || b.leaveType}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-slate-800">{available}</span>
                    <span className="text-sm text-slate-400">/ {b.allocated} days</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                    <div className={`h-1.5 rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">{b.used} used · {b.pending} pending</p>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Toolbar ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">
            {data?.meta?.total ?? 0} leave request{(data?.meta?.total ?? 0) !== 1 ? 's' : ''}
          </p>
          <button className="btn-primary gap-2" onClick={() => setShowApply(true)}>
            <Plus className="w-4 h-4" /> Apply Leave
          </button>
        </div>

        {/* ── Leaves Table ─────────────────────────────────────────────── */}
        <div className="card overflow-hidden">
          {isLoading ? <PageLoader /> : (
            <Table
              headers={isManager
                ? ['Employee', 'Type', 'Dates', 'Days', 'Reason', 'Status', 'Actions']
                : ['Type', 'Dates', 'Days', 'Reason', 'Status', 'Actions']}
            >
              {leaves.map((l: any) => (
                <tr key={l.id} className="hover:bg-slate-50/40 transition-colors">
                  {isManager && (
                    <td className="table-td">
                      <p className="font-semibold text-slate-800 text-sm">
                        {l.employee?.firstName} {l.employee?.lastName}
                      </p>
                      <p className="text-xs text-slate-400">{l.employee?.employeeCode}</p>
                    </td>
                  )}
                  <td className="table-td">
                    <div className="flex items-center gap-2.5">
                      <LeaveIcon type={l.leaveType} />
                      <span className="text-sm font-medium text-slate-700">
                        {LEAVE_TYPES.find(t => t.value === l.leaveType)?.label || l.leaveType}
                      </span>
                    </div>
                  </td>
                  <td className="table-td whitespace-nowrap">
                    <p className="text-sm text-slate-700">{formatDate(l.startDate)}</p>
                    {l.endDate !== l.startDate &&
                      <p className="text-xs text-slate-400">to {formatDate(l.endDate)}</p>}
                  </td>
                  <td className="table-td">
                    <span className="font-bold text-slate-700">{l.totalDays}</span>
                    {l.isHalfDay && <span className="text-xs text-slate-400 ml-1">½</span>}
                  </td>
                  <td className="table-td max-w-[180px]">
                    <p className="text-sm text-slate-500 truncate">{l.reason}</p>
                  </td>
                  <td className="table-td">
                    <Badge label={l.status} color={leaveStatusColor[l.status] || ''} />
                  </td>
                  <td className="table-td">
                    {isManager && l.status === 'PENDING' && (
                      <button
                        className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-800 transition-colors"
                        onClick={() => setApproveLeave(l)}
                      >
                        Review
                      </button>
                    )}
                    {!isManager && l.status === 'PENDING' && (
                      <button
                        className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors"
                        onClick={() => { if (confirm('Cancel this leave request?')) cancelMut.mutate(l.id) }}
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!leaves.length && (
                <tr><td colSpan={isManager ? 7 : 6}>
                  <EmptyState
                    icon={Calendar}
                    title="No leave requests"
                    description="Leave applications will appear here"
                    action={
                      <button className="btn-primary gap-2 mt-3" onClick={() => setShowApply(true)}>
                        <Plus className="w-4 h-4" /> Apply Leave
                      </button>
                    }
                  />
                </td></tr>
              )}
            </Table>
          )}
          <Pagination meta={data?.meta} onChange={setPage} />
        </div>
      </div>

      {/* ── Apply Leave Modal ──────────────────────────────────────────── */}
      <Modal open={showApply} onClose={() => setShowApply(false)} title="Apply for Leave" width="max-w-lg">
        <div className="space-y-5">
          {/* Type selector */}
          <FormField label="Leave Type *">
            <div className="grid grid-cols-2 gap-2">
              {LEAVE_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, leaveType: t.value }))}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${form.leaveType === t.value
                    ? 'border-primary-500 bg-primary-50/60'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                >
                  <LeaveIcon type={t.value} size="md" />
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{t.label}</p>
                    <p className="text-xs text-slate-400">{t.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Start Date *">
              <input type="date" className="input" value={form.startDate}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
            </FormField>
            <FormField label="End Date *">
              <input type="date" className="input" value={form.endDate}
                min={form.startDate}
                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
            </FormField>
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox" checked={form.isHalfDay}
              className="w-4 h-4 rounded accent-primary-600"
              onChange={e => setForm(f => ({ ...f, isHalfDay: e.target.checked }))}
            />
            <span className="text-sm text-slate-600 font-medium">Half day only</span>
          </label>

          <FormField label="Reason *">
            <textarea
              className="input min-h-[90px] resize-none"
              placeholder="Please describe the reason for your leave request…"
              value={form.reason}
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
            <button className="btn-secondary" onClick={() => setShowApply(false)}>Cancel</button>
            <button
              className="btn-primary gap-2"
              disabled={!form.startDate || !form.endDate || !form.reason.trim() || applyMut.isPending}
              onClick={() => applyMut.mutate(form)}
            >
              {applyMut.isPending ? 'Submitting…' : 'Submit Application'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Approve / Reject Modal ─────────────────────────────────────── */}
      <Modal
        open={!!approveLeave}
        onClose={() => setApproveLeave(null)}
        title="Review Leave Request"
        width="max-w-md"
      >
        {approveLeave && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4 space-y-2 border border-slate-100">
              <div className="flex items-center gap-3">
                <LeaveIcon type={approveLeave.leaveType} size="md" />
                <div>
                  <p className="font-bold text-slate-800">
                    {approveLeave.employee?.firstName} {approveLeave.employee?.lastName}
                  </p>
                  <p className="text-sm text-slate-500">
                    {LEAVE_TYPES.find(t => t.value === approveLeave.leaveType)?.label} ·{' '}
                    {approveLeave.totalDays} day{approveLeave.totalDays > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="text-sm text-slate-500 pt-1">
                <p>{formatDate(approveLeave.startDate)} → {formatDate(approveLeave.endDate)}</p>
                <p className="mt-1 italic text-slate-600">"{approveLeave.reason}"</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl transition-colors"
                onClick={() => approveMut.mutate({ id: approveLeave.id, status: 'APPROVED' })}
              >
                <CheckCircle className="w-4 h-4" /> Approve
              </button>
              <button
                className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl transition-colors"
                onClick={() => approveMut.mutate({ id: approveLeave.id, status: 'REJECTED' })}
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
