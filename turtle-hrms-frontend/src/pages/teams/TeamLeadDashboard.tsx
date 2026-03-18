import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, XCircle, Clock, Users, CalendarDays, Edit3, ChevronDown, ChevronUp } from 'lucide-react'
import { attendanceApi } from '../../services/api'
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

function StatCard({ label, value, icon: Icon, color }: any) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value ?? '—'}</p>
        <p className="text-xs font-medium text-slate-400">{label}</p>
      </div>
    </div>
  )
}

function RejectModal({ onConfirm, onClose }: { onConfirm: (r: string) => void; onClose: () => void }) {
  const [reason, setReason] = useState('')
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
        <h3 className="font-bold text-slate-900">Reject Attendance</h3>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Reason *</label>
          <textarea className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="Enter rejection reason..." />
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
  const [form, setForm] = useState({ checkIn: toTime(rec.checkIn), checkOut: toTime(rec.checkOut), notes: rec.notes || '' })

  const save = () => {
    const base = new Date(rec.date)
    const toISO = (t: string) => { const d = new Date(base); const [h, m] = t.split(':'); d.setHours(+h, +m, 0, 0); return d.toISOString() }
    onSave({ checkIn: form.checkIn ? toISO(form.checkIn) : undefined, checkOut: form.checkOut ? toISO(form.checkOut) : undefined, notes: form.notes })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
        <div>
          <h3 className="font-bold text-slate-900">Edit Attendance</h3>
          <p className="text-sm text-slate-500 mt-0.5">{rec.employee?.firstName} {rec.employee?.lastName} · {formatDate(rec.date)}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Check In</label>
            <input type="time" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={form.checkIn} onChange={e => setForm(f => ({ ...f, checkIn: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Check Out</label>
            <input type="time" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={form.checkOut} onChange={e => setForm(f => ({ ...f, checkOut: e.target.value }))} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Notes</label>
          <input className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional note..." />
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
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [rejectRec, setRejectRec] = useState<any>(null)
  const [editRec, setEditRec] = useState<any>(null)
  const [expandedEmp, setExpandedEmp] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('')

  // Load team data
  const { data: teamData, isLoading: teamLoading } = useQuery({
    queryKey: ['tl-my-team'],
    queryFn: () => import('../../services/api').then(m => m.teamsApi.myTeam()).then(r => r.data),
  })

  // Load attendance for the team
  const { data: allRecords = [], isLoading: attLoading } = useQuery({
    queryKey: ['tl-attendance', teamData?.id, month, year],
    queryFn: () => import('../../services/api').then(m => m.teamsApi.getAttendance(teamData!.id, { month, year })).then(r => r.data),
    enabled: !!teamData?.id,
  })

  const records = statusFilter
    ? (allRecords as any[]).filter((r: any) => (r.approvalStatus || 'PENDING') === statusFilter)
    : allRecords as any[]

  const approveMut = useMutation({
    mutationFn: (id: string) => attendanceApi.approve(id),
    onSuccess: () => { toast.success('Approved ✅'); qc.invalidateQueries({ queryKey: ['tl-attendance'] }) },
  })
  const rejectMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => attendanceApi.reject(id, reason),
    onSuccess: () => { toast.success('Rejected'); setRejectRec(null); qc.invalidateQueries({ queryKey: ['tl-attendance'] }) },
  })
  const editMut = useMutation({
    mutationFn: ({ id, data }: any) => attendanceApi.update(id, data),
    onSuccess: () => { toast.success('Updated ✅'); setEditRec(null); qc.invalidateQueries({ queryKey: ['tl-attendance'] }) },
  })

  // Stats
  const total    = (allRecords as any[]).length
  const approved = (allRecords as any[]).filter((r: any) => r.approvalStatus === 'APPROVED').length
  const rejected = (allRecords as any[]).filter((r: any) => r.approvalStatus === 'REJECTED').length
  const pending  = (allRecords as any[]).filter((r: any) => !r.approvalStatus || r.approvalStatus === 'PENDING').length

  // Group by employee for summary view
  const byEmployee: Record<string, any[]> = {}
  ;(allRecords as any[]).forEach((r: any) => {
    const id = r.employee?.id || 'unknown'
    if (!byEmployee[id]) byEmployee[id] = []
    byEmployee[id].push(r)
  })

  const todayStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  if (teamLoading) return <><Header title="Attendance Management" /><PageLoader /></>

  return (
    <div>
      <Header
        title="Attendance Management"
        subtitle={`${todayStr} · Team Lead`}
      />

      <div className="p-6 space-y-6">

        {/* Team Info */}
        {teamData && (
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-200 text-sm font-medium mb-1">Managing Team</p>
                <h2 className="text-xl font-bold">{teamData.name}</h2>
                <p className="text-indigo-200 text-sm mt-1">{teamData.members?.length || 0} team members</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                <Users className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>
        )}

        {!teamData && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
            <p className="text-amber-700 font-medium">No team assigned yet.</p>
            <p className="text-amber-500 text-sm mt-1">Ask HR/Admin to assign you as Team Lead.</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Records"   value={total}    icon={CalendarDays} color="bg-indigo-50 text-indigo-600" />
          <StatCard label="Pending Review"  value={pending}  icon={Clock}        color="bg-amber-50 text-amber-600" />
          <StatCard label="Approved"        value={approved} icon={CheckCircle}  color="bg-emerald-50 text-emerald-600" />
          <StatCard label="Rejected"        value={rejected} icon={XCircle}      color="bg-red-50 text-red-600" />
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap items-center">
          <select className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-32" value={month} onChange={e => setMonth(+e.target.value)}>
            {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <select className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-24" value={year} onChange={e => setYear(+e.target.value)}>
            {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
            {[
              { key: '',         label: 'All' },
              { key: 'PENDING',  label: `Pending (${pending})` },
              { key: 'APPROVED', label: `Approved (${approved})` },
              { key: 'REJECTED', label: `Rejected (${rejected})` },
            ].map(f => (
              <button key={f.key} onClick={() => setStatusFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === f.key ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Employee Summary Cards */}
        {Object.keys(byEmployee).length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide">By Employee</h3>
            {Object.entries(byEmployee).map(([empId, empRecords]) => {
              const emp = empRecords[0]?.employee
              const empPresent  = empRecords.filter((r: any) => r.status === 'PRESENT' || r.status === 'LATE').length
              const empPending  = empRecords.filter((r: any) => !r.approvalStatus || r.approvalStatus === 'PENDING').length
              const empApproved = empRecords.filter((r: any) => r.approvalStatus === 'APPROVED').length
              const isExpanded  = expandedEmp === empId
              const filteredRecs = statusFilter
                ? empRecords.filter((r: any) => (r.approvalStatus || 'PENDING') === statusFilter)
                : empRecords

              if (filteredRecs.length === 0) return null

              return (
                <div key={empId} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  {/* Employee header row */}
                  <button
                    onClick={() => setExpandedEmp(isExpanded ? null : empId)}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                        {emp?.firstName?.[0]}{emp?.lastName?.[0]}
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-slate-800 text-sm">{emp?.firstName} {emp?.lastName}</p>
                        <p className="text-xs text-slate-400">{emp?.employeeCode} · {empRecords.length} records</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex gap-2 text-xs">
                        <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">{empPresent} present</span>
                        {empPending > 0 && <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">{empPending} pending</span>}
                        {empApproved > 0 && <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{empApproved} approved</span>}
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </button>

                  {/* Expanded records */}
                  {isExpanded && (
                    <div className="border-t border-slate-100">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50">
                            <tr>
                              {['Date','Status','Check In','Check Out','Hours','Approval','Actions'].map(h => (
                                <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {filteredRecs.map((rec: any) => (
                              <tr key={rec.id} className="hover:bg-slate-50/50">
                                <td className="px-4 py-3 text-slate-600 font-medium">{formatDate(rec.date)}</td>
                                <td className="px-4 py-3">
                                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[rec.status] || 'bg-slate-100 text-slate-500'}`}>
                                    {rec.status?.replace('_', ' ')}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-slate-500">{rec.checkIn ? formatTime(rec.checkIn) : '—'}</td>
                                <td className="px-4 py-3 text-slate-500">{rec.checkOut ? formatTime(rec.checkOut) : '—'}</td>
                                <td className="px-4 py-3 text-slate-500">{rec.workHours ? `${Number(rec.workHours).toFixed(1)}h` : '—'}</td>
                                <td className="px-4 py-3">
                                  {rec.approvalStatus === 'APPROVED' && <span className="text-xs text-emerald-600 font-semibold">✓ Approved</span>}
                                  {rec.approvalStatus === 'REJECTED' && <span className="text-xs text-red-500 font-semibold" title={rec.rejectReason}>✗ Rejected</span>}
                                  {(!rec.approvalStatus || rec.approvalStatus === 'PENDING') && <span className="text-xs text-amber-500 font-medium">⏳ Pending</span>}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex gap-1.5">
                                    {rec.approvalStatus !== 'APPROVED' && (
                                      <button
                                        onClick={() => approveMut.mutate(rec.id)}
                                        disabled={approveMut.isPending}
                                        className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-2.5 py-1 rounded-lg font-medium transition-colors"
                                      >
                                        <CheckCircle className="w-3 h-3" /> Approve
                                      </button>
                                    )}
                                    {rec.approvalStatus !== 'REJECTED' && (
                                      <button
                                        onClick={() => setRejectRec(rec)}
                                        className="flex items-center gap-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 px-2.5 py-1 rounded-lg font-medium transition-colors"
                                      >
                                        <XCircle className="w-3 h-3" /> Reject
                                      </button>
                                    )}
                                    <button
                                      onClick={() => setEditRec(rec)}
                                      className="flex items-center gap-1 text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 px-2.5 py-1 rounded-lg font-medium transition-colors"
                                    >
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

        {attLoading && <PageLoader />}

        {!attLoading && (allRecords as any[]).length === 0 && teamData && (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <CalendarDays className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No attendance records for this period</p>
            <p className="text-slate-300 text-sm mt-1">Records appear when team members check in</p>
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
