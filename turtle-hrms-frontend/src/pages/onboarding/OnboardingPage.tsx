
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle, Circle, ChevronRight, BarChart2, Building2, Clock,
  XCircle, Rocket, UserMinus, FileText, AlertTriangle, RefreshCw, Filter,
} from 'lucide-react'
import { onboardingApi, documentsApi } from '../../services/api'
import { useIsHR } from '../../store/auth'
import Header from '../../components/layout/Header'
import { Avatar, Modal, FormField, PageLoader, Table, Badge } from '../../components/ui'
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

// ─── Document Dashboard with clickable status filters ────────────────────────
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
  // All documents - for filtered list view
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
          filterStatus === 'COMPLETED' ? d.employee?.onboarding?.completed === true :
          true
        const deptMatch = filterDept === 'ALL' || d.employee?.department?.name === filterDept
        return statusMatch && deptMatch
      })
    : []

  const stats = [
    { key: 'PENDING',   label: 'Pending Review',           value: globalStats?.pending  ?? 0, color: 'bg-amber-50 border-amber-200',   text: 'text-amber-700',  icon: Clock,        iconColor: 'text-amber-500' },
    { key: 'VERIFIED',  label: 'Verified',                 value: globalStats?.verified ?? 0, color: 'bg-emerald-50 border-emerald-200',text: 'text-emerald-700',icon: CheckCircle,  iconColor: 'text-emerald-500' },
    { key: 'REJECTED',  label: 'Rejected / Reupload Req.', value: globalStats?.rejected ?? 0, color: 'bg-red-50 border-red-200',        text: 'text-red-700',    icon: XCircle,      iconColor: 'text-red-400' },
    { key: null,        label: 'Total Documents',          value: globalStats?.total    ?? 0, color: 'bg-white border-slate-200',       text: 'text-slate-700',  icon: FileText,     iconColor: 'text-slate-400' },
  ]

  const chartData = (deptStats as any[]).map((d: any) => ({
    name: d.department,
    Verified: d.verified,
    Pending: d.pending,
    Rejected: d.rejected,
  }))

  const depts = ['ALL', ...(deptStats as any[]).map((d: any) => d.department)]

  return (
    <div className="space-y-5">
      {/* Clickable stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(s => (
          <button key={String(s.key)}
            onClick={() => setFilterStatus(filterStatus === s.key ? null : s.key)}
            className={`card p-4 text-left transition-all border-2 hover:shadow-md ${
              filterStatus === s.key ? 'ring-2 ring-primary-400 shadow-md' : ''
            } ${s.color}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-500">{s.label}</p>
              <s.icon className={`w-4 h-4 ${s.iconColor}`} />
            </div>
            <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
            {s.key && <p className="text-xs text-slate-400 mt-1">Click to view list</p>}
          </button>
        ))}
      </div>

      {/* Filtered document list panel */}
      {filterStatus !== null && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary-500" />
              {stats.find(s => s.key === filterStatus)?.label} Documents
              <span className="text-xs font-normal text-slate-400">({filteredDocs.length})</span>
            </h3>
            <div className="flex items-center gap-2">
              <select className="input text-xs py-1 h-8" value={filterDept}
                onChange={e => setFilterDept(e.target.value)}>
                {depts.map(d => <option key={d} value={d}>{d === 'ALL' ? 'All Departments' : d}</option>)}
              </select>
              <button onClick={() => setFilterStatus(null)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><XCircle className="w-4 h-4" /></button>
            </div>
          </div>
          {docsLoading ? <PageLoader /> : filteredDocs.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-8">No documents found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase">Employee</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase">Department</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase">Document</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase">Type</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase">Status</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase">Uploaded</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase">Remarks</th>
                    <th className="px-4 py-2.5"></th>
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
                      <td className="px-4 py-3 text-slate-500 text-xs">{d.type?.replace(/_/g,' ')}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          d.status === 'VERIFIED'  ? 'bg-emerald-100 text-emerald-700' :
                          d.status === 'REJECTED'  ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>{d.status}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">{d.uploadedAt ? formatDate(d.uploadedAt) : '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-400 max-w-[150px] truncate">{d.remarks || '—'}</td>
                      <td className="px-4 py-3">
                        {d.fileUrl && (
                          <a href={d.fileUrl} target="_blank" rel="noreferrer"
                            className="text-xs text-primary-600 underline">View</a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Bar chart */}
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
              <Bar dataKey="Verified" fill="#10b981" radius={[3,3,0,0]} />
              <Bar dataKey="Pending"  fill="#f59e0b" radius={[3,3,0,0]} />
              <Bar dataKey="Rejected" fill="#ef4444" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-5 mt-3 justify-center text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Verified</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-400 inline-block" /> Pending</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-400 inline-block" /> Rejected</span>
          </div>
        </div>
      )}

      {/* Dept table */}
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

export default function OnboardingPage() {
  const isHR = useIsHR()
  const qc = useQueryClient()
  const [tab, setTab] = useState<'dashboard' | 'onboarding' | 'offboarding'>('dashboard')
  const [selected, setSelected] = useState<any>(null)
  const [showOffboardInit, setShowOffboardInit] = useState<any>(null)
  const [relievingDate, setRelievingDate] = useState('')

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
  const initOffboardMut = useMutation({
    mutationFn: ({ empId, date }: any) => onboardingApi.initiateOffboarding(empId, { relievingDate: date }),
    onSuccess: () => { toast.success('Offboarding initiated'); qc.invalidateQueries({ queryKey: ['offboarding-all'] }); setShowOffboardInit(null) },
  })

  const tasks: any[] = Array.isArray(empTasks) ? empTasks : (empTasks?.tasks ?? [])
  const list = tab === 'onboarding' ? onboardingList : offboardingList

  return (
    <div>
      <Header title="Onboarding" subtitle="Employee onboarding & document management" />
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

        {/* Document Dashboard */}
        {tab === 'dashboard' && <DocDashboard />}

        {/* Onboarding / Offboarding */}
        {(tab === 'onboarding' || tab === 'offboarding') && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                  {tab === 'onboarding' ? 'New Joiners' : 'Exiting Employees'}
                </p>
                {tab === 'offboarding' && (
                  <button className="text-xs text-primary-600 font-medium hover:underline"
                    onClick={() => setShowOffboardInit({})}>+ Initiate</button>
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
                      <div key={task.id} className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all ${task.completedAt ? 'bg-emerald-50/50 border-emerald-100' : 'bg-white border-slate-100 hover:border-primary-200'}`}>
                        <button
                          onClick={() => tab === 'onboarding' ? completeOnMut.mutate(task.id) : completeOffMut.mutate(task.id)}
                          disabled={!!task.completedAt}
                          className={`mt-0.5 shrink-0 transition-all ${task.completedAt ? 'text-emerald-500 cursor-default' : 'text-slate-300 hover:text-primary-500'}`}>
                          {task.completedAt ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold ${task.completedAt ? 'line-through text-slate-400' : 'text-slate-700'}`}>{task.title}</p>
                          {task.description && <p className="text-xs text-slate-400 mt-0.5">{task.description}</p>}
                        </div>
                        {task.completedAt && (
                          <span className="text-xs text-emerald-500 font-medium shrink-0">
                            {new Date(task.completedAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}
                          </span>
                        )}
                      </div>
                    ))}
                    {tasks.length === 0 && (
                      <p className="text-center text-sm text-slate-400 py-8">No tasks found</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Modal open={!!showOffboardInit} onClose={() => setShowOffboardInit(null)} title="Initiate Offboarding" width="max-w-md">
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-sm text-amber-700">
            ⚠️ This will start the offboarding process for the selected employee.
          </div>
          <FormField label="Relieving Date *">
            <input type="date" className="input" value={relievingDate}
              onChange={e => setRelievingDate(e.target.value)} />
          </FormField>
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={() => setShowOffboardInit(null)}>Cancel</button>
            <button className="btn-primary" disabled={!relievingDate || initOffboardMut.isPending}
              onClick={() => initOffboardMut.mutate({ empId: showOffboardInit?.id, date: relievingDate })}>
              Initiate Offboarding
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
