
import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle, Circle, ChevronRight, BarChart2, Building2, Clock,
  XCircle, Rocket, FileText, AlertTriangle, Search, User, Calendar,
  CheckSquare,
} from 'lucide-react'
import { onboardingApi, documentsApi, employeesApi } from '../../services/api'
import { useIsHR } from '../../store/auth'
import Header from '../../components/layout/Header'
import { Avatar, Modal, FormField, PageLoader, Badge } from '../../components/ui'
import { formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
      <div className={`h-2 rounded-full transition-all ${value === 100 ? 'bg-emerald-500' : 'bg-primary-500'}`}
        style={{ width: `${value}%` }} />
    </div>
  )
}

// ─── Document Dashboard ───────────────────────────────────────────────────────
function DocDashboard() {
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [filterDept, setFilterDept] = useState<string>('ALL')

  const { data: deptStats = [], isLoading: statsLoading } = useQuery({
    queryKey: ['doc-dept-stats'],
    queryFn: () => documentsApi.getDeptStats().then(r => r.data),
  })
  const { data: globalStats } = useQuery({
    queryKey: ['doc-global-stats'],
    queryFn: () => documentsApi.getStats().then(r => r.data),
  })
  const { data: allDocsPayload, isLoading: docsLoading } = useQuery({
    queryKey: ['docs-all'],
    queryFn: () => documentsApi.list({ limit: 200 }).then(r => r.data),
    enabled: filterStatus !== null,
  })

  const allDocs: any[] = Array.isArray(allDocsPayload)
    ? allDocsPayload
    : (allDocsPayload?.docs ?? allDocsPayload?.data ?? [])

  const filteredDocs = filterStatus
    ? allDocs.filter((d: any) => {
        const statusMatch =
          filterStatus === 'PENDING' ? d.status === 'PENDING' :
          filterStatus === 'VERIFIED' ? d.status === 'VERIFIED' :
          filterStatus === 'REJECTED' ? d.status === 'REJECTED' :
          true
        const deptMatch = filterDept === 'ALL' || d.employee?.department?.name === filterDept
        return statusMatch && deptMatch
      })
    : []

  const stats = [
    { key: 'PENDING',  label: 'Pending Review', value: globalStats?.pending  ?? 0, color: 'bg-amber-50 border-amber-200',    text: 'text-amber-700',   icon: Clock,       iconColor: 'text-amber-500' },
    { key: 'VERIFIED', label: 'Verified',        value: globalStats?.verified ?? 0, color: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', icon: CheckCircle, iconColor: 'text-emerald-500' },
    { key: 'REJECTED', label: 'Rejected',        value: globalStats?.rejected ?? 0, color: 'bg-red-50 border-red-200',         text: 'text-red-700',     icon: XCircle,     iconColor: 'text-red-400' },
    { key: null,       label: 'Total Documents', value: globalStats?.total    ?? 0, color: 'bg-white border-slate-200',        text: 'text-slate-700',   icon: FileText,    iconColor: 'text-slate-400' },
  ]

  const chartData = (deptStats as any[]).map((d: any) => ({
    name: d.department, Verified: d.verified, Pending: d.pending, Rejected: d.rejected,
  }))
  const depts = ['ALL', ...(deptStats as any[]).map((d: any) => d.department)]

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(s => (
          <button key={String(s.key)}
            onClick={() => setFilterStatus(filterStatus === s.key ? null : s.key)}
            className={`card p-4 text-left transition-all border-2 hover:shadow-md ${filterStatus === s.key ? 'ring-2 ring-primary-400 shadow-md' : ''} ${s.color}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-500">{s.label}</p>
              <s.icon className={`w-4 h-4 ${s.iconColor}`} />
            </div>
            <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
            {s.key && <p className="text-xs text-slate-400 mt-1">Click to view list</p>}
          </button>
        ))}
      </div>

      {filterStatus !== null && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-700">
              {stats.find(s => s.key === filterStatus)?.label} Documents
              <span className="text-xs font-normal text-slate-400 ml-1">({filteredDocs.length})</span>
            </h3>
            <div className="flex items-center gap-2">
              <select className="input text-xs py-1 h-8" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
                {depts.map(d => <option key={d} value={d}>{d === 'ALL' ? 'All Departments' : d}</option>)}
              </select>
              <button onClick={() => setFilterStatus(null)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
          {docsLoading ? <PageLoader /> : filteredDocs.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-8">No documents found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    {['Employee', 'Department', 'Document', 'Type', 'Status', 'Uploaded', 'Remarks', ''].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredDocs.slice(0, 50).map((d: any) => (
                    <tr key={d.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">{d.employee?.firstName} {d.employee?.lastName}</p>
                        <p className="text-xs text-slate-400">{d.employee?.employeeCode}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{d.employee?.department?.name}</td>
                      <td className="px-4 py-3 font-medium text-slate-700">{d.name}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{d.type?.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          d.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' :
                          d.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>{d.status}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">{d.uploadedAt ? formatDate(d.uploadedAt) : '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-400 max-w-[150px] truncate">{d.remarks || '—'}</td>
                      <td className="px-4 py-3">
                        {d.fileUrl && <a href={d.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-primary-600 underline">View</a>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {chartData.length > 0 && !filterStatus && (
        <div className="card p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary-500" /> Document Status by Department
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barSize={18} barGap={2}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="Verified" fill="#10b981" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Pending" fill="#f59e0b" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Rejected" fill="#ef4444" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-5 mt-3 justify-center text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Verified</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-400 inline-block" /> Pending</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-400 inline-block" /> Rejected</span>
          </div>
        </div>
      )}

      {!filterStatus && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-700">Department-wise Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Department</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Employees</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-emerald-500 uppercase">Verified</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-amber-500 uppercase">Pending</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-red-400 uppercase">Rejected</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Completion</th>
                </tr>
              </thead>
              <tbody>
                {statsLoading ? (
                  <tr><td colSpan={6} className="text-center py-8"><div className="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
                ) : (deptStats as any[]).map((d: any) => (
                  <tr key={d.department} className="border-t border-slate-50 hover:bg-slate-50/50">
                    <td className="px-5 py-3 font-semibold text-slate-800">
                      <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-slate-300" />{d.department}</div>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-500">{d.employeeCount}</td>
                    <td className="px-4 py-3 text-center font-bold text-emerald-600">{d.verified}</td>
                    <td className="px-4 py-3 text-center font-bold text-amber-600">{d.pending}</td>
                    <td className="px-4 py-3 text-center font-bold text-red-500">{d.rejected}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <div className="flex-1 bg-slate-100 rounded-full h-2">
                          <div className={`h-2 rounded-full ${d.completionRate === 100 ? 'bg-emerald-500' : d.completionRate > 60 ? 'bg-primary-500' : 'bg-amber-400'}`}
                            style={{ width: `${d.completionRate}%` }} />
                        </div>
                        <span className="text-xs font-bold text-slate-600 w-10 text-right">{d.completionRate}%</span>
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
}

// ─── Employee Card ────────────────────────────────────────────────────────────
function EmployeeCard({ emp, onClick, isSelected }: any) {
  return (
    <button onClick={() => onClick(emp)}
      className={`w-full text-left card p-4 transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-primary-500 bg-primary-50/30' : ''}`}>
      <div className="flex items-center gap-3 mb-3">
        <Avatar name={`${emp.firstName} ${emp.lastName}`} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 text-sm truncate">{emp.firstName} {emp.lastName}</p>
          <p className="text-xs text-slate-400 truncate">{emp.employeeCode} · {emp.department?.name}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
      </div>
      <ProgressBar value={emp.progress || 0} />
      <div className="flex justify-between mt-1.5">
        <span className="text-xs text-slate-400">{emp.completed || 0}/{emp.total || 0} tasks</span>
        <span className={`text-xs font-bold ${emp.progress === 100 ? 'text-emerald-600' : 'text-primary-600'}`}>{emp.progress || 0}%</span>
      </div>
    </button>
  )
}

// ─── Offboarding History Table ────────────────────────────────────────────────
const REASON_LABELS: Record<string, string> = {
  RESIGNATION: 'Resignation',
  TERMINATION: 'Termination',
  CONTRACT_END: 'Contract End',
  OTHER: 'Other',
}

function OffboardingHistory({ list }: { list: any[] }) {
  if (list.length === 0) return null
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
        <CheckSquare className="w-4 h-4 text-slate-400" />
        <h3 className="text-sm font-bold text-slate-700">All Offboarding Records</h3>
        <span className="text-xs text-slate-400 font-normal">({list.length})</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50">
              {['Employee', 'Department', 'Designation', 'Reason', 'Last Working Day', 'Progress', 'Remarks'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map((emp: any) => (
              <tr key={emp.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar name={`${emp.firstName} ${emp.lastName}`} size="xs" />
                    <div>
                      <p className="font-semibold text-slate-800">{emp.firstName} {emp.lastName}</p>
                      <p className="text-xs text-slate-400">{emp.employeeCode}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs">{emp.department?.name || '—'}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{emp.jobTitle || '—'}</td>
                <td className="px-4 py-3">
                  {emp.resignationReason ? (
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      emp.resignationReason === 'TERMINATION' ? 'bg-red-100 text-red-700' :
                      emp.resignationReason === 'RESIGNATION' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>{REASON_LABELS[emp.resignationReason] || emp.resignationReason}</span>
                  ) : '—'}
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                  {emp.relievingDate ? new Date(emp.relievingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 min-w-[100px]">
                    <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${emp.progress === 100 ? 'bg-emerald-500' : 'bg-primary-500'}`}
                        style={{ width: `${emp.progress || 0}%` }} />
                    </div>
                    <span className="text-xs font-bold text-slate-600 w-8 text-right">{emp.progress || 0}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-slate-400 max-w-[160px] truncate">{emp.offboardingRemarks || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Initiate Offboarding Modal ───────────────────────────────────────────────
const REASONS = [
  { value: 'RESIGNATION', label: 'Resignation' },
  { value: 'TERMINATION', label: 'Termination' },
  { value: 'CONTRACT_END', label: 'Contract End' },
  { value: 'OTHER', label: 'Other' },
]

type ModalStep = 'form' | 'confirm' | 'success'

function InitOffboardingModal({ open, onClose, onSuccess }: {
  open: boolean; onClose: () => void; onSuccess: () => void
}) {
  const [step, setStep] = useState<ModalStep>('form')
  const [search, setSearch] = useState('')
  const [selectedEmp, setSelectedEmp] = useState<any>(null)
  const [relievingDate, setRelievingDate] = useState('')
  const [reason, setReason] = useState('RESIGNATION')
  const [remarks, setRemarks] = useState('')
  const [result, setResult] = useState<any>(null)

  const todayStr = new Date().toISOString().split('T')[0]

  const { data: employeesPayload } = useQuery({
    queryKey: ['active-employees', search],
    queryFn: () => employeesApi.list({ status: 'ACTIVE', search, limit: 20 }).then(r => r.data),
    enabled: open && search.length >= 1,
  })

  const employees: any[] = useMemo(() => {
    if (!employeesPayload) return []
    return Array.isArray(employeesPayload) ? employeesPayload : (employeesPayload?.data ?? employeesPayload?.employees ?? [])
  }, [employeesPayload])

  const initMut = useMutation({
    mutationFn: () => onboardingApi.initiateOffboarding(selectedEmp.id, {
      relievingDate: relievingDate || undefined,
      reason,
      remarks: remarks || undefined,
    }),
    onSuccess: (res) => {
      setResult(res.data)
      setStep('success')
      onSuccess()
    },
    onError: () => toast.error('Failed to initiate offboarding'),
  })

  const handleClose = () => {
    setStep('form'); setSearch(''); setSelectedEmp(null)
    setRelievingDate(''); setReason('RESIGNATION'); setRemarks(''); setResult(null)
    onClose()
  }

  const canSubmit = !!selectedEmp && !!relievingDate && !!reason

  return (
    <Modal open={open} onClose={handleClose} title="Initiate Offboarding" width="max-w-xl">
      {/* ── FORM STEP ── */}
      {step === 'form' && (
        <div className="space-y-5">
          {/* Employee Search */}
          <FormField label="Search Employee *">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                className="input pl-9"
                placeholder="Type name or employee code..."
                value={search}
                onChange={e => { setSearch(e.target.value); setSelectedEmp(null) }}
              />
            </div>
            {search.length >= 1 && employees.length > 0 && !selectedEmp && (
              <div className="mt-1 border border-slate-200 rounded-xl overflow-hidden shadow-lg bg-white z-10 max-h-52 overflow-y-auto">
                {employees.map((emp: any) => (
                  <button key={emp.id} type="button"
                    onClick={() => { setSelectedEmp(emp); setSearch(`${emp.firstName} ${emp.lastName}`) }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-primary-50 text-left border-b border-slate-50 last:border-0">
                    <Avatar name={`${emp.firstName} ${emp.lastName}`} size="xs" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{emp.firstName} {emp.lastName}</p>
                      <p className="text-xs text-slate-400">{emp.employeeCode} · {emp.department?.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </FormField>

          {/* Auto-filled Employee Details */}
          {selectedEmp && (
            <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-100">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-200">
                <Avatar name={`${selectedEmp.firstName} ${selectedEmp.lastName}`} size="sm" />
                <div>
                  <p className="font-bold text-slate-800">{selectedEmp.firstName} {selectedEmp.lastName}</p>
                  <p className="text-xs text-slate-400">{selectedEmp.jobTitle}</p>
                </div>
                <div className="ml-auto">
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">Active</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-start gap-2">
                  <User className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-slate-400">Employee ID</p>
                    <p className="font-semibold text-slate-700">{selectedEmp.employeeCode}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-slate-400">Department</p>
                    <p className="font-semibold text-slate-700">{selectedEmp.department?.name || '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <User className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-slate-400">Reporting Manager</p>
                    <p className="font-semibold text-slate-700">
                      {selectedEmp.manager ? `${selectedEmp.manager.firstName} ${selectedEmp.manager.lastName}` : '—'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-slate-400">Joining Date</p>
                    <p className="font-semibold text-slate-700">
                      {selectedEmp.joiningDate ? new Date(selectedEmp.joiningDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Last Working Day */}
          <FormField label="Last Working Day *">
            <input
              type="date"
              className="input"
              min={todayStr}
              value={relievingDate}
              onChange={e => setRelievingDate(e.target.value)}
            />
          </FormField>

          {/* Reason */}
          <FormField label="Separation Reason *">
            <select className="input" value={reason} onChange={e => setReason(e.target.value)}>
              {REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </FormField>

          {/* Remarks */}
          <FormField label="Remarks (optional)">
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="Any additional notes..."
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-1">
            <button className="btn-secondary" onClick={handleClose}>Cancel</button>
            <button
              className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
              disabled={!canSubmit}
              onClick={() => setStep('confirm')}>
              Review & Submit
            </button>
          </div>
        </div>
      )}

      {/* ── CONFIRM STEP ── */}
      {step === 'confirm' && selectedEmp && (
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-700 text-sm">Confirm Offboarding</p>
              <p className="text-xs text-red-500 mt-0.5">
                This will mark the employee as Resigned and start the offboarding checklist. This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm border border-slate-100">
            <div className="flex justify-between">
              <span className="text-slate-500">Employee</span>
              <span className="font-semibold text-slate-800">{selectedEmp.firstName} {selectedEmp.lastName} ({selectedEmp.employeeCode})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Department</span>
              <span className="font-semibold text-slate-800">{selectedEmp.department?.name || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Designation</span>
              <span className="font-semibold text-slate-800">{selectedEmp.jobTitle || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Last Working Day</span>
              <span className="font-semibold text-slate-800">
                {new Date(relievingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Reason</span>
              <span className="font-semibold text-slate-800">{REASON_LABELS[reason]}</span>
            </div>
            {remarks && (
              <div className="flex justify-between">
                <span className="text-slate-500">Remarks</span>
                <span className="font-semibold text-slate-800 max-w-[200px] text-right">{remarks}</span>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button className="btn-secondary" onClick={() => setStep('form')}>Back</button>
            <button
              className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
              disabled={initMut.isPending}
              onClick={() => initMut.mutate()}>
              {initMut.isPending ? 'Processing...' : 'Confirm Offboarding'}
            </button>
          </div>
        </div>
      )}

      {/* ── SUCCESS STEP ── */}
      {step === 'success' && selectedEmp && (
        <div className="space-y-4 text-center">
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-9 h-9 text-emerald-500" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-lg">Offboarding Initiated</p>
              <p className="text-sm text-slate-400 mt-0.5">The offboarding checklist has been created.</p>
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm border border-slate-100 text-left">
            <div className="flex justify-between">
              <span className="text-slate-500">Employee</span>
              <span className="font-semibold text-slate-800">{selectedEmp.firstName} {selectedEmp.lastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Employee ID</span>
              <span className="font-semibold text-slate-800">{selectedEmp.employeeCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Department</span>
              <span className="font-semibold text-slate-800">{selectedEmp.department?.name || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Last Working Day</span>
              <span className="font-semibold text-slate-800">
                {new Date(relievingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Reason</span>
              <span className="font-semibold text-slate-800">{REASON_LABELS[reason]}</span>
            </div>
            {remarks && (
              <div className="flex justify-between">
                <span className="text-slate-500">Remarks</span>
                <span className="font-semibold text-slate-800 max-w-[200px] text-right">{remarks}</span>
              </div>
            )}
            <div className="flex justify-between pt-1 border-t border-slate-200">
              <span className="text-slate-500">Checklist Tasks</span>
              <span className="font-bold text-primary-600">{Array.isArray(result?.tasks) ? result.tasks.length : '—'} tasks created</span>
            </div>
          </div>
          <button className="btn-primary w-full" onClick={handleClose}>Done</button>
        </div>
      )}
    </Modal>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const isHR = useIsHR()
  const qc = useQueryClient()
  const [tab, setTab] = useState<'dashboard' | 'onboarding' | 'offboarding'>('dashboard')
  const [selected, setSelected] = useState<any>(null)
  const [showOffboardModal, setShowOffboardModal] = useState(false)

  const { data: onboardingList = [], isLoading: loadOn } = useQuery({
    queryKey: ['onboarding-all'],
    queryFn: () => onboardingApi.getAll().then(r => r.data),
    enabled: isHR,
  })
  const { data: offboardingList = [], isLoading: loadOff } = useQuery({
    queryKey: ['offboarding-all'],
    queryFn: () => onboardingApi.getAllOffboarding().then(r => r.data),
    enabled: isHR,
  })
  const { data: empTasks } = useQuery({
    queryKey: ['onboarding-emp', selected?.id, tab],
    queryFn: () => tab === 'onboarding'
      ? onboardingApi.getEmployee(selected.id).then(r => r.data)
      : onboardingApi.getEmployeeOffboarding(selected.id).then(r => r.data),
    enabled: !!selected && tab !== 'dashboard',
  })

  const completeOnMut = useMutation({
    mutationFn: (taskId: string) => onboardingApi.completeTask(taskId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['onboarding-emp'] }); qc.invalidateQueries({ queryKey: ['onboarding-all'] }) },
  })
  const completeOffMut = useMutation({
    mutationFn: (taskId: string) => onboardingApi.completeOffboardingTask(taskId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['onboarding-emp'] }); qc.invalidateQueries({ queryKey: ['offboarding-all'] }) },
  })

  const tasks: any[] = Array.isArray(empTasks) ? empTasks : (empTasks?.tasks ?? [])
  const list = tab === 'onboarding' ? onboardingList : offboardingList

  return (
    <div>
      <Header title="Onboarding & Offboarding" subtitle="Employee lifecycle management" />
      <div className="p-6 space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          {[
            { key: 'dashboard',   label: '📊 Document Dashboard' },
            { key: 'onboarding',  label: '🚀 Onboarding' },
            { key: 'offboarding', label: '👋 Offboarding' },
          ].map(t => (
            <button key={t.key} onClick={() => { setTab(t.key as any); setSelected(null) }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'dashboard' && <DocDashboard />}

        {(tab === 'onboarding' || tab === 'offboarding') && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Employee List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                    {tab === 'onboarding' ? 'New Joiners' : 'Exiting Employees'}
                  </p>
                  {tab === 'offboarding' && isHR && (
                    <button
                      className="text-xs bg-red-50 text-red-600 border border-red-100 px-3 py-1.5 rounded-lg font-semibold hover:bg-red-100"
                      onClick={() => setShowOffboardModal(true)}>
                      + Initiate
                    </button>
                  )}
                </div>
                {(loadOn || loadOff) ? <PageLoader /> : (list as any[]).length === 0 ? (
                  <div className="card p-8 text-center text-slate-400 text-sm">No records found</div>
                ) : (
                  (list as any[]).map((emp: any) => (
                    <EmployeeCard key={emp.id} emp={emp} onClick={setSelected} isSelected={selected?.id === emp.id} />
                  ))
                )}
              </div>

              {/* Task Panel */}
              <div className="lg:col-span-2">
                {!selected ? (
                  <div className="card p-12 text-center">
                    <Rocket className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400 font-medium">Select an employee to view tasks</p>
                  </div>
                ) : (
                  <div className="card p-5 space-y-4">
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                      <Avatar name={`${selected.firstName} ${selected.lastName}`} size="sm" />
                      <div className="flex-1">
                        <p className="font-bold text-slate-800">{selected.firstName} {selected.lastName}</p>
                        <p className="text-xs text-slate-400">{selected.department?.name}</p>
                      </div>
                      <div className="text-right min-w-[120px]">
                        <ProgressBar value={selected.progress || 0} />
                        <p className="text-xs text-slate-400 mt-1">{selected.completed || 0}/{selected.total || 0} tasks</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {tasks.map((task: any) => (
                        <div key={task.id}
                          className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all ${task.completedAt ? 'bg-emerald-50/50 border-emerald-100' : 'bg-white border-slate-100 hover:border-primary-200'}`}>
                          <button
                            onClick={() => tab === 'onboarding' ? completeOnMut.mutate(task.id) : completeOffMut.mutate(task.id)}
                            disabled={!!task.completedAt}
                            className={`mt-0.5 shrink-0 transition-all ${task.completedAt ? 'text-emerald-500 cursor-default' : 'text-slate-300 hover:text-primary-500'}`}>
                            {task.completedAt ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold ${task.completedAt ? 'line-through text-slate-400' : 'text-slate-700'}`}>{task.title || task.task}</p>
                            {task.description && <p className="text-xs text-slate-400 mt-0.5">{task.description}</p>}
                          </div>
                          {task.completedAt && (
                            <span className="text-xs text-emerald-500 font-medium shrink-0">
                              {new Date(task.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                        </div>
                      ))}
                      {tasks.length === 0 && <p className="text-center text-sm text-slate-400 py-8">No tasks found</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* History table — offboarding only */}
            {tab === 'offboarding' && !loadOff && (
              <OffboardingHistory list={offboardingList as any[]} />
            )}
          </div>
        )}
      </div>

      <InitOffboardingModal
        open={showOffboardModal}
        onClose={() => setShowOffboardModal(false)}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: ['offboarding-all'] })
          qc.invalidateQueries({ queryKey: ['onboarding-all'] })
        }}
      />
    </div>
  )
}
