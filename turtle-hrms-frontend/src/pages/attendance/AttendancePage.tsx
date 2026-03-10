import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Clock, Calendar, Download, BarChart2, Filter, User, X, Search } from 'lucide-react'
import { attendanceApi, employeesApi } from '../../services/api'
import { useAuthStore, useIsHR } from '../../store/auth'
import Header from '../../components/layout/Header'
import { Badge, Table, PageLoader, Avatar, FormField, Modal } from '../../components/ui'
import { formatDate, formatTime, MONTHS } from '../../utils/helpers'
import toast from 'react-hot-toast'

const STATUS_COLOR: Record<string, string> = {
  PRESENT: 'bg-emerald-100 text-emerald-700',
  ABSENT: 'bg-red-100 text-red-700',
  LATE: 'bg-amber-100 text-amber-700',
  HALF_DAY: 'bg-blue-100 text-blue-700',
  ON_LEAVE: 'bg-violet-100 text-violet-700',
  WEEKEND: 'bg-slate-100 text-slate-400',
  HOLIDAY: 'bg-pink-100 text-pink-700',
}

// ─── HR Global Report Panel ───────────────────────────────────────────────────
function HRReportPanel() {
  const now = new Date()
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [reportDate, setReportDate] = useState(now.toISOString().split('T')[0])
  const [reportMonth, setReportMonth] = useState(now.getMonth() + 1)
  const [reportYear, setReportYear] = useState(now.getFullYear())
  const [downloading, setDownloading] = useState(false)

  const params: any = { type: reportType }
  if (reportType === 'daily') params.date = reportDate
  else if (reportType === 'weekly') params.date = reportDate
  else { params.month = reportMonth; params.year = reportYear }

  const { data, isLoading } = useQuery({
    queryKey: ['att-report', reportType, reportDate, reportMonth, reportYear],
    queryFn: () => attendanceApi.report(params).then((r: any) => r.data),
  })

  const handleDownload = async () => {
    setDownloading(true)
    try {
      await attendanceApi.downloadCsv(params, `attendance-${reportType}-${reportDate || `${reportMonth}-${reportYear}`}.csv`)
      toast.success('Report downloaded!')
    } catch {
      toast.error('Download failed. Check your connection.')
    } finally {
      setDownloading(false)
    }
  }

  const summary = data?.summary || {}
  const records = data?.records || []

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="card p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex rounded-xl overflow-hidden border border-slate-200">
            {(['daily', 'weekly', 'monthly'] as const).map((t) => (
              <button key={t} onClick={() => setReportType(t)}
                className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${reportType === t ? 'bg-primary-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}>{t}</button>
            ))}
          </div>
          {reportType !== 'monthly'
            ? <input type="date" className="input max-w-44" value={reportDate}
              onChange={(e: any) => setReportDate(e.target.value)} />
            : <div className="flex gap-2">
              <select className="input w-36" value={reportMonth}
                onChange={(e: any) => setReportMonth(+e.target.value)}>
                {MONTHS.map((m: string, i: number) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <select className="input w-24" value={reportYear}
                onChange={(e: any) => setReportYear(+e.target.value)}>
                {[2024, 2025, 2026].map((y: number) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          }
          <button onClick={handleDownload} disabled={downloading}
            className="btn-secondary gap-2 ml-auto">
            <Download className="w-4 h-4" />
            {downloading ? 'Downloading…' : 'Download CSV'}
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: 'Present', value: summary.present || 0, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Absent', value: summary.absent || 0, color: 'text-red-600 bg-red-50' },
          { label: 'Late', value: summary.late || 0, color: 'text-amber-600 bg-amber-50' },
          { label: 'Half Day', value: summary.halfDay || 0, color: 'text-blue-600 bg-blue-50' },
          { label: 'On Leave', value: summary.onLeave || 0, color: 'text-violet-600 bg-violet-50' },
          { label: 'Total', value: summary.total || 0, color: 'text-slate-700 bg-slate-50' },
        ].map((s: any) => (
          <div key={s.label} className={`card p-3 text-center ${s.color}`}>
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-xs font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Records table */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <p className="text-sm font-bold text-slate-700">{records.length} records</p>
        </div>
        {isLoading ? <PageLoader /> : (
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  {['Date', 'Employee', 'Department', 'Status', 'Check In', 'Check Out', 'Hours', 'Late (min)'].map((h: string) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.length === 0
                  ? <tr><td colSpan={8} className="text-center py-8 text-slate-400 text-sm">No records for this period</td></tr>
                  : records.map((r: any) => (
                    <tr key={r.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                      <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">{formatDate(r.date)}</td>
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-slate-800 whitespace-nowrap">{r.employee?.firstName} {r.employee?.lastName}</p>
                        <p className="text-xs text-slate-400">{r.employee?.employeeCode}</p>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-500">{r.employee?.department?.name || '—'}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[r.status] || ''}`}>{r.status}</span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-600">{r.checkIn ? formatTime(r.checkIn) : '—'}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-600">{r.checkOut ? formatTime(r.checkOut) : '—'}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-500">
                        {r.checkIn && r.checkOut
                          ? ((new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) / 3600000).toFixed(1) + 'h'
                          : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-500">{r.lateMinutes || 0}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Per-Employee Report Panel ────────────────────────────────────────────────
function EmployeeReportPanel() {
  const now = new Date()
  const [reportType, setReportType] = useState<'weekly' | 'monthly'>('monthly')
  const [reportDate, setReportDate] = useState(now.toISOString().split('T')[0])
  const [reportMonth, setReportMonth] = useState(now.getMonth() + 1)
  const [reportYear, setReportYear] = useState(now.getFullYear())
  const [empSearch, setEmpSearch] = useState('')
  const [selectedEmp, setSelectedEmp] = useState<any>(null)
  const [downloading, setDownloading] = useState(false)

  const { data: empResults } = useQuery({
    queryKey: ['emp-att-search', empSearch],
    queryFn: () => employeesApi.list({ search: empSearch, limit: 8 }).then((r: any) => r.data?.data || []),
    enabled: empSearch.length >= 2,
  })

  const params: any = { type: reportType }
  if (reportType === 'weekly') params.date = reportDate
  else { params.month = reportMonth; params.year = reportYear }

  const { data, isLoading } = useQuery({
    queryKey: ['emp-att-report', selectedEmp?.id, reportType, reportDate, reportMonth, reportYear],
    queryFn: () => attendanceApi.reportEmployee(selectedEmp.id, params).then((r: any) => r.data),
    enabled: !!selectedEmp,
  })

  const handleDownload = async () => {
    if (!selectedEmp) return
    setDownloading(true)
    try {
      const fname = `${selectedEmp.firstName}-${selectedEmp.lastName}-attendance-${reportType}.csv`
      await attendanceApi.downloadEmployeeCsv(selectedEmp.id, params, fname)
      toast.success('Report downloaded!')
    } catch {
      toast.error('Download failed')
    } finally {
      setDownloading(false)
    }
  }

  const records = data?.records || []
  const summary = data?.summary || {}

  return (
    <div className="space-y-4">
      {/* Employee search */}
      <div className="card p-4">
        <div className="flex gap-3 flex-wrap items-end">
          <div className="flex-1 min-w-48">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Search Employee</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input className="input pl-9" placeholder="Name or employee ID..."
                value={empSearch} onChange={(e: any) => setEmpSearch(e.target.value)} />
            </div>
            {empSearch.length >= 2 && (
              <div className="absolute z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg w-72 max-h-48 overflow-y-auto">
                {(empResults || []).map((emp: any) => (
                  <button key={emp.id} onClick={() => { setSelectedEmp(emp); setEmpSearch('') }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-left">
                    <Avatar name={`${emp.firstName} ${emp.lastName}`} size="sm" />
                    <div>
                      <p className="text-sm font-semibold">{emp.firstName} {emp.lastName}</p>
                      <p className="text-xs text-slate-400">{emp.employeeCode} · {emp.department?.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex rounded-xl overflow-hidden border border-slate-200">
            {(['weekly', 'monthly'] as const).map((t) => (
              <button key={t} onClick={() => setReportType(t)}
                className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${reportType === t ? 'bg-primary-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}>{t}</button>
            ))}
          </div>
          {reportType === 'weekly'
            ? <input type="date" className="input max-w-44" value={reportDate}
              onChange={(e: any) => setReportDate(e.target.value)} />
            : <div className="flex gap-2">
              <select className="input w-32" value={reportMonth}
                onChange={(e: any) => setReportMonth(+e.target.value)}>
                {MONTHS.map((m: string, i: number) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <select className="input w-24" value={reportYear}
                onChange={(e: any) => setReportYear(+e.target.value)}>
                {[2024, 2025, 2026].map((y: number) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          }
          {selectedEmp && (
            <button onClick={handleDownload} disabled={downloading}
              className="btn-secondary gap-2">
              <Download className="w-4 h-4" />
              {downloading ? 'Downloading…' : 'Download CSV'}
            </button>
          )}
        </div>
      </div>

      {/* Selected employee */}
      {selectedEmp && (
        <div className="flex items-center gap-3 bg-primary-50 border border-primary-100 rounded-xl px-4 py-3">
          <Avatar name={`${selectedEmp.firstName} ${selectedEmp.lastName}`} size="sm" />
          <div className="flex-1">
            <p className="font-bold text-slate-800">{selectedEmp.firstName} {selectedEmp.lastName}</p>
            <p className="text-xs text-slate-500">{selectedEmp.employeeCode} · {selectedEmp.department?.name} · {selectedEmp.jobTitle}</p>
          </div>
          <button onClick={() => setSelectedEmp(null)} className="p-1.5 hover:bg-white rounded-lg text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {!selectedEmp ? (
        <div className="card p-12 text-center">
          <User className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">Search and select an employee above</p>
          <p className="text-sm text-slate-400 mt-1">Then view their weekly or monthly attendance report</p>
        </div>
      ) : isLoading ? <PageLoader /> : (
        <>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { label: 'Present', value: summary.present || 0, color: 'text-emerald-600 bg-emerald-50' },
              { label: 'Absent', value: summary.absent || 0, color: 'text-red-600 bg-red-50' },
              { label: 'Late', value: summary.late || 0, color: 'text-amber-600 bg-amber-50' },
              { label: 'Half Day', value: summary.halfDay || 0, color: 'text-blue-600 bg-blue-50' },
              { label: 'On Leave', value: summary.onLeave || 0, color: 'text-violet-600 bg-violet-50' },
              { label: 'Total', value: summary.total || 0, color: 'text-slate-700 bg-slate-50' },
            ].map((s: any) => (
              <div key={s.label} className={`card p-3 text-center ${s.color}`}>
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-xs font-medium">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    {['Date', 'Day', 'Status', 'Check In', 'Check Out', 'Hours', 'Late (min)'].map((h: string) => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.length === 0
                    ? <tr><td colSpan={7} className="text-center py-8 text-slate-400 text-sm">No records</td></tr>
                    : records.map((r: any) => (
                      <tr key={r.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                        <td className="px-4 py-2.5 text-xs text-slate-600 whitespace-nowrap">{formatDate(r.date)}</td>
                        <td className="px-4 py-2.5 text-xs text-slate-400">{new Date(r.date).toLocaleDateString('en-IN', { weekday: 'short' })}</td>
                        <td className="px-4 py-2.5">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[r.status] || ''}`}>{r.status}</span>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-600">{r.checkIn ? formatTime(r.checkIn) : '—'}</td>
                        <td className="px-4 py-2.5 text-xs text-slate-600">{r.checkOut ? formatTime(r.checkOut) : '—'}</td>
                        <td className="px-4 py-2.5 text-xs text-slate-500">
                          {r.checkIn && r.checkOut
                            ? ((new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) / 3600000).toFixed(1) + 'h'
                            : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-500">{r.lateMinutes || 0}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── My Attendance (Employee view) ────────────────────────────────────────────
function MyAttendanceView() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  const { data: summary } = useQuery({
    queryKey: ['att-summary', month, year],
    queryFn: () => attendanceApi.summary({ month, year }).then((r: any) => r.data),
  })

  const { data: list } = useQuery({
    queryKey: ['att-list', month, year],
    queryFn: () => attendanceApi.list({ month, year, limit: 50 }).then((r: any) => r.data?.data || []),
  })

  return (
    <div className="space-y-4">
      <div className="card p-4 flex gap-3 items-center">
        <select className="input w-36" value={month} onChange={(e: any) => setMonth(+e.target.value)}>
          {MONTHS.map((m: string, i: number) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select className="input w-24" value={year} onChange={(e: any) => setYear(+e.target.value)}>
          {[2024, 2025, 2026].map((y: number) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {summary && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { label: 'Present', value: summary.present || 0, color: 'text-emerald-600 bg-emerald-50' },
            { label: 'Absent', value: summary.absent || 0, color: 'text-red-600 bg-red-50' },
            { label: 'Late', value: summary.late || 0, color: 'text-amber-600 bg-amber-50' },
            { label: 'Leaves', value: summary.onLeave || 0, color: 'text-violet-600 bg-violet-50' },
            { label: 'Half Day', value: summary.halfDay || 0, color: 'text-blue-600 bg-blue-50' },
            { label: 'Avg Hrs', value: summary.avgHours ? Number(summary.avgHours).toFixed(1) : '—', color: 'text-slate-700 bg-slate-50' },
          ].map((s: any) => (
            <div key={s.label} className={`card p-3 text-center ${s.color}`}>
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-xs font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {['Date', 'Day', 'Status', 'Check In', 'Check Out', 'Hours Worked', 'Late'].map((h: string) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(list || []).map((r: any) => (
                <tr key={r.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar
                        name={`${r.employee?.firstName || ''} ${r.employee?.lastName || ''}`}
                        size="sm"
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-700">
                          {r.employee?.firstName} {r.employee?.lastName}
                        </p>
                        <p className="text-xs text-slate-400">
                          {r.employee?.employeeCode}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{formatDate(r.date)}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{new Date(r.date).toLocaleDateString('en-IN', { weekday: 'short' })}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR[r.status] || ''}`}>
                      {r.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{r.checkIn ? formatTime(r.checkIn) : '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{r.checkOut ? formatTime(r.checkOut) : '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {r.workHours ? `${Number(r.workHours).toFixed(1)}h` : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {r.isLate ? <span className="text-amber-600 font-medium">{r.lateMinutes}m late</span> : <span className="text-slate-300">—</span>}
                  </td>
                </tr>
              ))}
              {(!list || list.length === 0) && (
                <tr><td colSpan={7} className="text-center py-8 text-slate-400 text-sm">No attendance records for this month</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AttendancePage() {
  const isHR = useIsHR()
  const [tab, setTab] = useState<'mine' | 'report' | 'employee'>('mine')

  const tabs = isHR
    ? [
      { key: 'mine', label: 'My Attendance' },
      { key: 'report', label: 'Team Report' },
      { key: 'employee', label: 'Employee Report' },
    ]
    : [{ key: 'mine', label: 'My Attendance' }]

  return (
    <div>
      <Header title="Attendance" subtitle="Track attendance and download reports" />
      <div className="p-6 space-y-5">

        {isHR && (
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
            {tabs.map((t: any) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}>{t.label}</button>
            ))}
          </div>
        )}

        {tab === 'mine' && <MyAttendanceView />}
        {tab === 'report' && isHR && <HRReportPanel />}
        {tab === 'employee' && isHR && <EmployeeReportPanel />}
      </div>
    </div>
  )
}
