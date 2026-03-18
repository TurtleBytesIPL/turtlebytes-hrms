import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle, XCircle, Clock, Users, CalendarDays,
  Edit3, ChevronDown, ChevronUp, Search, Filter,
} from 'lucide-react'
import { attendanceApi, employeesApi } from '../../services/api'
import { useAuthStore } from '../../store/auth'
import Header from '../../components/layout/Header'
import { PageLoader } from '../../components/ui'
import { formatDate, formatTime, MONTHS } from '../../utils/helpers'
import toast from 'react-hot-toast'

const STATUS_COLOR: Record<string, string> = {
  PRESENT:  'bg-emerald-100 text-emerald-700',
  ABSENT:   'bg-red-100 text-red-700',
  LATE:     'bg-amber-100 text-amber-700',
  HALF_DAY: 'bg-blue-100 text-blue-700',
  ON_LEAVE: 'bg-violet-100 text-violet-700',
  WEEKEND:  'bg-slate-100 text-slate-400',
  HOLIDAY:  'bg-pink-100 text-pink-700',
}

function StatCard({ label, value, icon: Icon, color, onClick, active }: any) {
  return (
    <button
      onClick={onClick}
      className={`bg-white rounded-2xl border shadow-sm p-5 flex items-center gap-4 w-full text-left transition-all ${active ? 'border-indigo-400 shadow-indigo-100' : 'border-slate-100 hover:border-slate-200'}`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value ?? 0}</p>
        <p className="text-xs font-medium text-slate-400">{label}</p>
      </div>
    </button>
  )
}

function RejectModal({ onConfirm, onClose }: any) {
  const [reason, setReason] = useState('')
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
        <h3 className="font-bold text-slate-900">Reject Attendance</h3>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Reason *</label>
          <textarea className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="Enter rejection reason..." />
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={() => reason && onConfirm(reason)} disabled={!reason} className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50">Reject</button>
        </div>
      </div>
    </div>
  )
}

function EditModal({ rec, onSave, onClose }: any) {
  const toTime = (dt: string) => dt ? new Date(dt).toTimeString().slice(0, 5) : ''
  const [form, setForm] = useState({
    checkIn: toTime(rec.checkIn),
    checkOut: toTime(rec.checkOut),
    notes: rec.notes || '',
    status: rec.status || 'PRESENT',
  })

  const save = () => {
    const base = new Date(rec.date)
    const toISO = (t: string) => {
      const d = new Date(base)
      const [h, m] = t.split(':')
      d.setHours(+h, +m, 0, 0)
      return d.toISOString()
    }
    onSave({
      checkIn:  form.checkIn  ? toISO(form.checkIn)  : undefined,
      checkOut: form.checkOut ? toISO(form.checkOut) : undefined,
      notes:  form.notes,
      status: form.status,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
        <div>
          <h3 className="font-bold text-slate-900">Edit Attendance</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            {rec.employee?.firstName} {rec.employee?.lastName} · {formatDate(rec.date)}
          </p>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Status</label>
          <select className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            {['PRESENT','ABSENT','LATE','HALF_DAY','ON_LEAVE'].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Check In</label>
            <input type="time" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.checkIn} onChange={e => setForm(f => ({ ...f, checkIn: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Check Out</label>
            <input type="time" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.checkOut} onChange={e => setForm(f => ({ ...f, checkOut: e.target.value }))} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Notes</label>
          <input className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional note..." />
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={save} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700">Save Changes</button>
        </div>
      </div>
    </div>
  )
}

export default function TeamLeadDashboard() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const now = new Date()

  // Filters
  const [month, setMonth]             = useState(now.getMonth() + 1)
  const [year, setYear]               = useState(now.getFullYear())
  const [search, setSearch]           = useState('')
  const [deptFilter, setDeptFilter]   = useState('')
  const [approvalFilter, setApprovalFilter] = useState('')
  const [expandedEmp, setExpandedEmp] = useState<string | null>(null)

  // Modals
  const [rejectRec, setRejectRec] = useState<any>(null)
  const [editRec, setEditRec]     = useState<any>(null)

  // Fetch ALL attendance — Team Lead & HR see everything
  const { data: allRecords = [], isLoading } = useQuery({
    queryKey: ['tl-all-attendance', month, year],
    queryFn: () => attendanceApi.list({ month, year, limit: 500 }).then((r: any) => r.data?.data || []),
  })

  // Fetch departments for filter
  const { data: deptData } = useQuery({
    queryKey: ['departments-simple'],
    queryFn: () => import('../../services/api').then(m => m.departmentsApi.list()).then((r: any) => r.data),
  })
  const departments: any[] = Array.isArray(deptData) ? deptData : (deptData?.data || [])

  // Mutations
  const approveMut = useMutation({
    mutationFn: (id: string) => attendanceApi.approve(id),
    onSuccess: () => { toast.success('Approved ✅'); qc.invalidateQueries({ queryKey: ['tl-all-attendance'] }) },
    onError: () => toast.error('Failed to approve'),
  })
  const rejectMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => attendanceApi.reject(id, reason),
    onSuccess: () => { toast.success('Rejected'); setRejectRec(null); qc.invalidateQueries({ queryKey: ['tl-all-attendance'] }) },
  })
  const editMut = useMutation({
    mutationFn: ({ id, data }: any) => attendanceApi.update(id, data),
    onSuccess: () => { toast.success('Updated ✅'); setEditRec(null); qc.invalidateQueries({ queryKey: ['tl-all-attendance'] }) },
  })

  // Stats
  const records   = allRecords as any[]
  const total     = records.length
  const pending   = records.filter(r => !r.approvalStatus || r.approvalStatus === 'PENDING').length
  const approved  = records.filter(r => r.approvalStatus === 'APPROVED').length
  const rejected  = records.filter(r => r.approvalStatus === 'REJECTED').length

  // Group by employee
  const byEmployee: Record<string, any[]> = {}
  records.forEach(r => {
    const id = r.employee?.id || 'unknown'
    if (!byEmployee[id]) byEmployee[id] = []
    byEmployee[id].push(r)
  })

  // Filter employees
  const filteredEmployees = Object.entries(byEmployee).filter(([_, recs]) => {
    const emp = recs[0]?.employee
    const nameMatch = !search || `${emp?.firstName} ${emp?.lastName} ${emp?.employeeCode}`.toLowerCase().includes(search.toLowerCase())
    const deptMatch = !deptFilter || emp?.department?.name === deptFilter
    const approvalMatch = !approvalFilter || recs.some(r => (r.approvalStatus || 'PENDING') === approvalFilter)
    return nameMatch && deptMatch && approvalMatch
  })

  const todayStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div>
      <Header title="Attendance Management" subtitle={`${todayStr} · Attendance Manager`} />

      <div className="p-6 space-y-5">

        {/* Stats — clickable to filter */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Records"  value={total}    icon={CalendarDays} color="bg-indigo-50 text-indigo-600"  onClick={() => setApprovalFilter('')}         active={approvalFilter === ''} />
          <StatCard label="Pending Review" value={pending}  icon={Clock}        color="bg-amber-50 text-amber-600"   onClick={() => setApprovalFilter('PENDING')}  active={approvalFilter === 'PENDING'} />
          <StatCard label="Approved"       value={approved} icon={CheckCircle}  color="bg-emerald-50 text-emerald-600" onClick={() => setApprovalFilter('APPROVED')} active={approvalFilter === 'APPROVED'} />
          <StatCard label="Rejected"       value={rejected} icon={XCircle}      color="bg-red-50 text-red-600"       onClick={() => setApprovalFilter('REJECTED')} active={approvalFilter === 'REJECTED'} />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Search employee name or ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {/* Month */}
          <select className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-32"
            value={month} onChange={e => setMonth(+e.target.value)}>
            {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          {/* Year */}
          <select className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-24"
            value={year} onChange={e => setYear(+e.target.value)}>
            {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {/* Department */}
          <select className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
            <option value="">All Departments</option>
            {departments.map((d: any) => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>
          {/* Clear filters */}
          {(search || deptFilter || approvalFilter) && (
            <button onClick={() => { setSearch(''); setDeptFilter(''); setApprovalFilter('') }}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
              <XCircle className="w-4 h-4" /> Clear
            </button>
          )}
          <span className="text-xs text-slate-400 ml-auto">
            {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Employee cards */}
        {isLoading ? <PageLoader /> : filteredEmployees.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <CalendarDays className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No attendance records found</p>
            <p className="text-slate-300 text-sm mt-1">
              {search || deptFilter ? 'Try clearing the filters' : 'Records appear when employees check in'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEmployees.map(([empId, empRecs]) => {
              const emp        = empRecs[0]?.employee
              const present    = empRecs.filter(r => ['PRESENT','LATE'].includes(r.status)).length
              const empPending  = empRecs.filter(r => !r.approvalStatus || r.approvalStatus === 'PENDING').length
              const empApproved = empRecs.filter(r => r.approvalStatus === 'APPROVED').length
              const empRejected = empRecs.filter(r => r.approvalStatus === 'REJECTED').length
              const isExpanded  = expandedEmp === empId

              // Filter records by approvalFilter
              const visibleRecs = approvalFilter
                ? empRecs.filter(r => (r.approvalStatus || 'PENDING') === approvalFilter)
                : empRecs

              if (visibleRecs.length === 0) return null

              return (
                <div key={empId} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  {/* Header row — click to expand */}
                  <button
                    onClick={() => setExpandedEmp(isExpanded ? null : empId)}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                        {emp?.firstName?.[0]}{emp?.lastName?.[0]}
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-slate-800 text-sm">{emp?.firstName} {emp?.lastName}</p>
                        <p className="text-xs text-slate-400">{emp?.employeeCode} · {emp?.department?.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">{present} present</span>
                      {empPending  > 0 && <span className="text-xs bg-amber-50   text-amber-700   px-2 py-0.5 rounded-full font-medium">{empPending} pending</span>}
                      {empApproved > 0 && <span className="text-xs bg-indigo-50  text-indigo-700  px-2 py-0.5 rounded-full font-medium">{empApproved} approved</span>}
                      {empRejected > 0 && <span className="text-xs bg-red-50     text-red-600     px-2 py-0.5 rounded-full font-medium">{empRejected} rejected</span>}
                      {isExpanded
                        ? <ChevronUp   className="w-4 h-4 text-slate-400 ml-1" />
                        : <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
                      }
                    </div>
                  </button>

                  {/* Expanded attendance rows */}
                  {isExpanded && (
                    <div className="border-t border-slate-100">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50">
                            <tr>
                              {['Date','Status','Check In','Check Out','Hours','Approval','Actions'].map(h => (
                                <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {visibleRecs.map((rec: any) => (
                              <tr key={rec.id} className="hover:bg-slate-50/50">
                                <td className="px-4 py-3 text-slate-600 font-medium whitespace-nowrap">{formatDate(rec.date)}</td>
                                <td className="px-4 py-3">
                                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_COLOR[rec.status] || 'bg-slate-100 text-slate-500'}`}>
                                    {rec.status?.replace('_', ' ')}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{rec.checkIn  ? formatTime(rec.checkIn)  : '—'}</td>
                                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{rec.checkOut ? formatTime(rec.checkOut) : '—'}</td>
                                <td className="px-4 py-3 text-slate-500">{rec.workHours ? `${Number(rec.workHours).toFixed(1)}h` : '—'}</td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  {rec.approvalStatus === 'APPROVED' && <span className="text-xs text-emerald-600 font-semibold">✓ Approved</span>}
                                  {rec.approvalStatus === 'REJECTED' && <span className="text-xs text-red-500   font-semibold" title={rec.rejectReason}>✗ Rejected</span>}
                                  {(!rec.approvalStatus || rec.approvalStatus === 'PENDING') && <span className="text-xs text-amber-500 font-medium">⏳ Pending</span>}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex gap-1.5 flex-nowrap">
                                    {rec.approvalStatus !== 'APPROVED' && (
                                      <button onClick={() => approveMut.mutate(rec.id)} disabled={approveMut.isPending}
                                        className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-2.5 py-1 rounded-lg font-medium whitespace-nowrap">
                                        <CheckCircle className="w-3 h-3" /> Approve
                                      </button>
                                    )}
                                    {rec.approvalStatus !== 'REJECTED' && (
                                      <button onClick={() => setRejectRec(rec)}
                                        className="flex items-center gap-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 px-2.5 py-1 rounded-lg font-medium whitespace-nowrap">
                                        <XCircle className="w-3 h-3" /> Reject
                                      </button>
                                    )}
                                    <button onClick={() => setEditRec(rec)}
                                      className="flex items-center gap-1 text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 px-2.5 py-1 rounded-lg font-medium whitespace-nowrap">
                                      <Edit3 className="w-3 h-3" /> Edit
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {rejectRec && (
        <RejectModal
          onConfirm={(reason: string) => rejectMut.mutate({ id: rejectRec.id, reason })}
          onClose={() => setRejectRec(null)}
        />
      )}
      {editRec && (
        <EditModal
          rec={editRec}
          onSave={(data: any) => editMut.mutate({ id: editRec.id, data })}
          onClose={() => setEditRec(null)}
        />
      )}
    </div>
  )
}
