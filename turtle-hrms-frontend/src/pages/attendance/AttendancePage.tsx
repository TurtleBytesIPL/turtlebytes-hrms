// // import { useState } from 'react'
// // import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
// // import { Clock, Calendar, Download, BarChart2, Filter, User, X, Search } from 'lucide-react'
// // import { attendanceApi, employeesApi } from '../../services/api'
// // import { useAuthStore, useIsHR } from '../../store/auth'
// // import Header from '../../components/layout/Header'
// // import { Badge, Table, PageLoader, Avatar, FormField, Modal } from '../../components/ui'
// // import { formatDate, formatTime, MONTHS } from '../../utils/helpers'
// // import toast from 'react-hot-toast'

// // const STATUS_COLOR: Record<string, string> = {
// //   PRESENT:  'bg-emerald-100 text-emerald-700',
// //   ABSENT:   'bg-red-100 text-red-700',
// //   LATE:     'bg-amber-100 text-amber-700',
// //   HALF_DAY: 'bg-blue-100 text-blue-700',
// //   ON_LEAVE: 'bg-violet-100 text-violet-700',
// //   WEEKEND:  'bg-slate-100 text-slate-400',
// //   HOLIDAY:  'bg-pink-100 text-pink-700',
// // }

// // // ─── HR Global Report Panel ───────────────────────────────────────────────────
// // function HRReportPanel() {
// //   const now = new Date()
// //   const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily')
// //   const [reportDate, setReportDate] = useState(now.toISOString().split('T')[0])
// //   const [reportMonth, setReportMonth] = useState(now.getMonth() + 1)
// //   const [reportYear, setReportYear] = useState(now.getFullYear())
// //   const [downloading, setDownloading] = useState(false)

// //   const params: any = { type: reportType }
// //   if (reportType === 'daily') params.date = reportDate
// //   else if (reportType === 'weekly') params.date = reportDate
// //   else { params.month = reportMonth; params.year = reportYear }

// //   const { data, isLoading } = useQuery({
// //     queryKey: ['att-report', reportType, reportDate, reportMonth, reportYear],
// //     queryFn: () => attendanceApi.report(params).then((r: any) => r.data),
// //   })

// //   const handleDownload = async () => {
// //     setDownloading(true)
// //     try {
// //       await attendanceApi.downloadCsv(params, `attendance-${reportType}-${reportDate || `${reportMonth}-${reportYear}`}.csv`)
// //       toast.success('Report downloaded!')
// //     } catch {
// //       toast.error('Download failed. Check your connection.')
// //     } finally {
// //       setDownloading(false)
// //     }
// //   }

// //   const summary = data?.summary || {}
// //   const records = data?.records || []

// //   return (
// //     <div className="space-y-4">
// //       {/* Controls */}
// //       <div className="card p-4">
// //         <div className="flex items-center gap-3 flex-wrap">
// //           <div className="flex rounded-xl overflow-hidden border border-slate-200">
// //             {(['daily', 'weekly', 'monthly'] as const).map((t) => (
// //               <button key={t} onClick={() => setReportType(t)}
// //                 className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
// //                   reportType === t ? 'bg-primary-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
// //                 }`}>{t}</button>
// //             ))}
// //           </div>
// //           {reportType !== 'monthly'
// //             ? <input type="date" className="input max-w-44" value={reportDate}
// //                 onChange={(e: any) => setReportDate(e.target.value)} />
// //             : <div className="flex gap-2">
// //                 <select className="input w-36" value={reportMonth}
// //                   onChange={(e: any) => setReportMonth(+e.target.value)}>
// //                   {MONTHS.map((m: string, i: number) => <option key={i} value={i + 1}>{m}</option>)}
// //                 </select>
// //                 <select className="input w-24" value={reportYear}
// //                   onChange={(e: any) => setReportYear(+e.target.value)}>
// //                   {[2024, 2025, 2026].map((y: number) => <option key={y} value={y}>{y}</option>)}
// //                 </select>
// //               </div>
// //           }
// //           <button onClick={handleDownload} disabled={downloading}
// //             className="btn-secondary gap-2 ml-auto">
// //             <Download className="w-4 h-4" />
// //             {downloading ? 'Downloading…' : 'Download CSV'}
// //           </button>
// //         </div>
// //       </div>

// //       {/* Summary cards */}
// //       <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
// //         {[
// //           { label: 'Present',  value: summary.present  || 0, color: 'text-emerald-600 bg-emerald-50' },
// //           { label: 'Absent',   value: summary.absent   || 0, color: 'text-red-600 bg-red-50' },
// //           { label: 'Late',     value: summary.late     || 0, color: 'text-amber-600 bg-amber-50' },
// //           { label: 'Half Day', value: summary.halfDay  || 0, color: 'text-blue-600 bg-blue-50' },
// //           { label: 'On Leave', value: summary.onLeave  || 0, color: 'text-violet-600 bg-violet-50' },
// //           { label: 'Total',    value: summary.total    || 0, color: 'text-slate-700 bg-slate-50' },
// //         ].map((s: any) => (
// //           <div key={s.label} className={`card p-3 text-center ${s.color}`}>
// //             <p className="text-xl font-bold">{s.value}</p>
// //             <p className="text-xs font-medium">{s.label}</p>
// //           </div>
// //         ))}
// //       </div>

// //       {/* Records table */}
// //       <div className="card overflow-hidden">
// //         <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
// //           <p className="text-sm font-bold text-slate-700">{records.length} records</p>
// //         </div>
// //         {isLoading ? <PageLoader /> : (
// //           <div className="overflow-x-auto max-h-96">
// //             <table className="w-full text-sm">
// //               <thead className="bg-slate-50 sticky top-0">
// //                 <tr>
// //                   {['Date', 'Employee', 'Department', 'Status', 'Check In', 'Check Out', 'Hours', 'Late (min)'].map((h: string) => (
// //                     <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase whitespace-nowrap">{h}</th>
// //                   ))}
// //                 </tr>
// //               </thead>
// //               <tbody>
// //                 {records.length === 0
// //                   ? <tr><td colSpan={8} className="text-center py-8 text-slate-400 text-sm">No records for this period</td></tr>
// //                   : records.map((r: any) => (
// //                     <tr key={r.id} className="border-t border-slate-50 hover:bg-slate-50/50">
// //                       <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">{formatDate(r.date)}</td>
// //                       <td className="px-4 py-2.5">
// //                         <p className="font-medium text-slate-800 whitespace-nowrap">{r.employee?.firstName} {r.employee?.lastName}</p>
// //                         <p className="text-xs text-slate-400">{r.employee?.employeeCode}</p>
// //                       </td>
// //                       <td className="px-4 py-2.5 text-xs text-slate-500">{r.employee?.department?.name || '—'}</td>
// //                       <td className="px-4 py-2.5">
// //                         <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[r.status] || ''}`}>{r.status}</span>
// //                       </td>
// //                       <td className="px-4 py-2.5 text-xs text-slate-600">{r.checkIn ? formatTime(r.checkIn) : '—'}</td>
// //                       <td className="px-4 py-2.5 text-xs text-slate-600">{r.checkOut ? formatTime(r.checkOut) : '—'}</td>
// //                       <td className="px-4 py-2.5 text-xs text-slate-500">
// //                         {r.checkIn && r.checkOut
// //                           ? ((new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) / 3600000).toFixed(1) + 'h'
// //                           : '—'}
// //                       </td>
// //                       <td className="px-4 py-2.5 text-xs text-slate-500">{r.lateMinutes || 0}</td>
// //                     </tr>
// //                   ))}
// //               </tbody>
// //             </table>
// //           </div>
// //         )}
// //       </div>
// //     </div>
// //   )
// // }

// // // ─── Per-Employee Report Panel ────────────────────────────────────────────────
// // function EmployeeReportPanel() {
// //   const now = new Date()
// //   const [reportType, setReportType] = useState<'weekly' | 'monthly'>('monthly')
// //   const [reportDate, setReportDate] = useState(now.toISOString().split('T')[0])
// //   const [reportMonth, setReportMonth] = useState(now.getMonth() + 1)
// //   const [reportYear, setReportYear] = useState(now.getFullYear())
// //   const [empSearch, setEmpSearch] = useState('')
// //   const [selectedEmp, setSelectedEmp] = useState<any>(null)
// //   const [downloading, setDownloading] = useState(false)

// //   const { data: empResults } = useQuery({
// //     queryKey: ['emp-att-search', empSearch],
// //     queryFn: () => employeesApi.list({ search: empSearch, limit: 8 }).then((r: any) => r.data?.data || []),
// //     enabled: empSearch.length >= 2,
// //   })

// //   const params: any = { type: reportType }
// //   if (reportType === 'weekly') params.date = reportDate
// //   else { params.month = reportMonth; params.year = reportYear }

// //   const { data, isLoading } = useQuery({
// //     queryKey: ['emp-att-report', selectedEmp?.id, reportType, reportDate, reportMonth, reportYear],
// //     queryFn: () => attendanceApi.reportEmployee(selectedEmp.id, params).then((r: any) => r.data),
// //     enabled: !!selectedEmp,
// //   })

// //   const handleDownload = async () => {
// //     if (!selectedEmp) return
// //     setDownloading(true)
// //     try {
// //       const fname = `${selectedEmp.firstName}-${selectedEmp.lastName}-attendance-${reportType}.csv`
// //       await attendanceApi.downloadEmployeeCsv(selectedEmp.id, params, fname)
// //       toast.success('Report downloaded!')
// //     } catch {
// //       toast.error('Download failed')
// //     } finally {
// //       setDownloading(false)
// //     }
// //   }

// //   const records = data?.records || []
// //   const summary = data?.summary || {}

// //   return (
// //     <div className="space-y-4">
// //       {/* Employee search */}
// //       <div className="card p-4">
// //         <div className="flex gap-3 flex-wrap items-end">
// //           <div className="flex-1 min-w-48">
// //             <label className="block text-xs font-semibold text-slate-500 mb-1">Search Employee</label>
// //             <div className="relative">
// //               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
// //               <input className="input pl-9" placeholder="Name or employee ID..."
// //                 value={empSearch} onChange={(e: any) => setEmpSearch(e.target.value)} />
// //             </div>
// //             {empSearch.length >= 2 && (
// //               <div className="absolute z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg w-72 max-h-48 overflow-y-auto">
// //                 {(empResults || []).map((emp: any) => (
// //                   <button key={emp.id} onClick={() => { setSelectedEmp(emp); setEmpSearch('') }}
// //                     className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-left">
// //                     <Avatar name={`${emp.firstName} ${emp.lastName}`} size="sm" />
// //                     <div>
// //                       <p className="text-sm font-semibold">{emp.firstName} {emp.lastName}</p>
// //                       <p className="text-xs text-slate-400">{emp.employeeCode} · {emp.department?.name}</p>
// //                     </div>
// //                   </button>
// //                 ))}
// //               </div>
// //             )}
// //           </div>
// //           <div className="flex rounded-xl overflow-hidden border border-slate-200">
// //             {(['weekly', 'monthly'] as const).map((t) => (
// //               <button key={t} onClick={() => setReportType(t)}
// //                 className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
// //                   reportType === t ? 'bg-primary-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
// //                 }`}>{t}</button>
// //             ))}
// //           </div>
// //           {reportType === 'weekly'
// //             ? <input type="date" className="input max-w-44" value={reportDate}
// //                 onChange={(e: any) => setReportDate(e.target.value)} />
// //             : <div className="flex gap-2">
// //                 <select className="input w-32" value={reportMonth}
// //                   onChange={(e: any) => setReportMonth(+e.target.value)}>
// //                   {MONTHS.map((m: string, i: number) => <option key={i} value={i + 1}>{m}</option>)}
// //                 </select>
// //                 <select className="input w-24" value={reportYear}
// //                   onChange={(e: any) => setReportYear(+e.target.value)}>
// //                   {[2024, 2025, 2026].map((y: number) => <option key={y} value={y}>{y}</option>)}
// //                 </select>
// //               </div>
// //           }
// //           {selectedEmp && (
// //             <button onClick={handleDownload} disabled={downloading}
// //               className="btn-secondary gap-2">
// //               <Download className="w-4 h-4" />
// //               {downloading ? 'Downloading…' : 'Download CSV'}
// //             </button>
// //           )}
// //         </div>
// //       </div>

// //       {/* Selected employee */}
// //       {selectedEmp && (
// //         <div className="flex items-center gap-3 bg-primary-50 border border-primary-100 rounded-xl px-4 py-3">
// //           <Avatar name={`${selectedEmp.firstName} ${selectedEmp.lastName}`} size="sm" />
// //           <div className="flex-1">
// //             <p className="font-bold text-slate-800">{selectedEmp.firstName} {selectedEmp.lastName}</p>
// //             <p className="text-xs text-slate-500">{selectedEmp.employeeCode} · {selectedEmp.department?.name} · {selectedEmp.jobTitle}</p>
// //           </div>
// //           <button onClick={() => setSelectedEmp(null)} className="p-1.5 hover:bg-white rounded-lg text-slate-400">
// //             <X className="w-4 h-4" />
// //           </button>
// //         </div>
// //       )}

// //       {!selectedEmp ? (
// //         <div className="card p-12 text-center">
// //           <User className="w-12 h-12 text-slate-200 mx-auto mb-3" />
// //           <p className="text-slate-400 font-medium">Search and select an employee above</p>
// //           <p className="text-sm text-slate-400 mt-1">Then view their weekly or monthly attendance report</p>
// //         </div>
// //       ) : isLoading ? <PageLoader /> : (
// //         <>
// //           <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
// //             {[
// //               { label: 'Present',  value: summary.present  || 0, color: 'text-emerald-600 bg-emerald-50' },
// //               { label: 'Absent',   value: summary.absent   || 0, color: 'text-red-600 bg-red-50' },
// //               { label: 'Late',     value: summary.late     || 0, color: 'text-amber-600 bg-amber-50' },
// //               { label: 'Half Day', value: summary.halfDay  || 0, color: 'text-blue-600 bg-blue-50' },
// //               { label: 'On Leave', value: summary.onLeave  || 0, color: 'text-violet-600 bg-violet-50' },
// //               { label: 'Total',    value: summary.total    || 0, color: 'text-slate-700 bg-slate-50' },
// //             ].map((s: any) => (
// //               <div key={s.label} className={`card p-3 text-center ${s.color}`}>
// //                 <p className="text-xl font-bold">{s.value}</p>
// //                 <p className="text-xs font-medium">{s.label}</p>
// //               </div>
// //             ))}
// //           </div>
// //           <div className="card overflow-hidden">
// //             <div className="overflow-x-auto max-h-96">
// //               <table className="w-full text-sm">
// //                 <thead className="bg-slate-50 sticky top-0">
// //                   <tr>
// //                     {['Date', 'Day', 'Status', 'Check In', 'Check Out', 'Hours', 'Late (min)'].map((h: string) => (
// //                       <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase">{h}</th>
// //                     ))}
// //                   </tr>
// //                 </thead>
// //                 <tbody>
// //                   {records.length === 0
// //                     ? <tr><td colSpan={7} className="text-center py-8 text-slate-400 text-sm">No records</td></tr>
// //                     : records.map((r: any) => (
// //                       <tr key={r.id} className="border-t border-slate-50 hover:bg-slate-50/50">
// //                         <td className="px-4 py-2.5 text-xs text-slate-600 whitespace-nowrap">{formatDate(r.date)}</td>
// //                         <td className="px-4 py-2.5 text-xs text-slate-400">{new Date(r.date).toLocaleDateString('en-IN', { weekday: 'short' })}</td>
// //                         <td className="px-4 py-2.5">
// //                           <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[r.status] || ''}`}>{r.status}</span>
// //                         </td>
// //                         <td className="px-4 py-2.5 text-xs text-slate-600">{r.checkIn ? formatTime(r.checkIn) : '—'}</td>
// //                         <td className="px-4 py-2.5 text-xs text-slate-600">{r.checkOut ? formatTime(r.checkOut) : '—'}</td>
// //                         <td className="px-4 py-2.5 text-xs text-slate-500">
// //                           {r.checkIn && r.checkOut
// //                             ? ((new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) / 3600000).toFixed(1) + 'h'
// //                             : '—'}
// //                         </td>
// //                         <td className="px-4 py-2.5 text-xs text-slate-500">{r.lateMinutes || 0}</td>
// //                       </tr>
// //                     ))}
// //                 </tbody>
// //               </table>
// //             </div>
// //           </div>
// //         </>
// //       )}
// //     </div>
// //   )
// // }

// // // ─── My Attendance (Employee view) ────────────────────────────────────────────
// // function MyAttendanceView() {
// //   const now = new Date()
// //   const [month, setMonth] = useState(now.getMonth() + 1)
// //   const [year, setYear] = useState(now.getFullYear())

// //   // ── get logged-in user from auth store ──
// //   const { user } = useAuthStore()
// //   const fullName = user?.employee?.name ?? ''

// //   const { data: summary } = useQuery({
// //     queryKey: ['att-summary', month, year],
// //     queryFn: () => attendanceApi.summary({ month, year }).then((r: any) => r.data),
// //   })

// //   const { data: list } = useQuery({
// //     queryKey: ['att-list', month, year],
// //     queryFn: () => attendanceApi.list({ month, year, limit: 50 }).then((r: any) => r.data?.data || []),
// //   })

// //   return (
// //     <div className="space-y-4">
// //       <div className="card p-4 flex gap-3 items-center">
// //         <select className="input w-36" value={month} onChange={(e: any) => setMonth(+e.target.value)}>
// //           {MONTHS.map((m: string, i: number) => <option key={i} value={i + 1}>{m}</option>)}
// //         </select>
// //         <select className="input w-24" value={year} onChange={(e: any) => setYear(+e.target.value)}>
// //           {[2024, 2025, 2026].map((y: number) => <option key={y} value={y}>{y}</option>)}
// //         </select>
// //       </div>

// //       {summary && (
// //         <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
// //           {[
// //             { label: 'Present',  value: summary.present  || 0, color: 'text-emerald-600 bg-emerald-50' },
// //             { label: 'Absent',   value: summary.absent   || 0, color: 'text-red-600 bg-red-50' },
// //             { label: 'Late',     value: summary.late     || 0, color: 'text-amber-600 bg-amber-50' },
// //             { label: 'Leaves',   value: summary.onLeave  || 0, color: 'text-violet-600 bg-violet-50' },
// //             { label: 'Half Day', value: summary.halfDay  || 0, color: 'text-blue-600 bg-blue-50' },
// //             { label: 'Avg Hrs',  value: summary.avgHours ? Number(summary.avgHours).toFixed(1) : '—', color: 'text-slate-700 bg-slate-50' },
// //           ].map((s: any) => (
// //             <div key={s.label} className={`card p-3 text-center ${s.color}`}>
// //               <p className="text-xl font-bold">{s.value}</p>
// //               <p className="text-xs font-medium">{s.label}</p>
// //             </div>
// //           ))}
// //         </div>
// //       )}

// //       <div className="card overflow-hidden">
// //         <div className="overflow-x-auto">
// //           <table className="w-full text-sm">
// //             <thead className="bg-slate-50">
// //               <tr>
// //                 {/* ── Employee column added ── */}
// //                 {['Employee', 'Date', 'Day', 'Status', 'Check In', 'Check Out', 'Hours Worked', 'Late'].map((h: string) => (
// //                   <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">{h}</th>
// //                 ))}
// //               </tr>
// //             </thead>
// //             <tbody>
// //               {(list || []).map((r: any) => (
// //                 <tr key={r.id} className="border-t border-slate-50 hover:bg-slate-50/50">

// //                   {/* ── Employee name + avatar cell ── */}
// //                   <td className="px-4 py-3">
// //                     <div className="flex items-center gap-2">
// //                       <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold shrink-0">
// //                         {user?.employee?.name?.[0]}
// //                       </div>
// //                       <div>
// //                         <p className="text-sm font-medium text-slate-800 whitespace-nowrap">{fullName}</p>
// //                         <p className="text-xs text-slate-400">{user?.employee?.employeeCode}</p>
// //                       </div>
// //                     </div>
// //                   </td>

// //                   <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{formatDate(r.date)}</td>
// //                   <td className="px-4 py-3 text-xs text-slate-400">{new Date(r.date).toLocaleDateString('en-IN', { weekday: 'short' })}</td>
// //                   <td className="px-4 py-3">
// //                     <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR[r.status] || ''}`}>
// //                       {r.status?.replace('_', ' ')}
// //                     </span>
// //                   </td>
// //                   <td className="px-4 py-3 text-sm text-slate-600">{r.checkIn ? formatTime(r.checkIn) : '—'}</td>
// //                   <td className="px-4 py-3 text-sm text-slate-600">{r.checkOut ? formatTime(r.checkOut) : '—'}</td>
// //                   <td className="px-4 py-3 text-sm text-slate-500">
// //                     {r.workHours ? `${Number(r.workHours).toFixed(1)}h` : '—'}
// //                   </td>
// //                   <td className="px-4 py-3 text-xs">
// //                     {r.isLate
// //                       ? <span className="text-amber-600 font-medium">{r.lateMinutes}m late</span>
// //                       : <span className="text-slate-300">—</span>}
// //                   </td>
// //                 </tr>
// //               ))}
// //               {(!list || list.length === 0) && (
// //                 <tr>
// //                   {/* colspan updated from 7 → 8 */}
// //                   <td colSpan={8} className="text-center py-8 text-slate-400 text-sm">
// //                     No attendance records for this month
// //                   </td>
// //                 </tr>
// //               )}
// //             </tbody>
// //           </table>
// //         </div>
// //       </div>
// //     </div>
// //   )
// // }

// // // ─── Team Lead Approval Panel ─────────────────────────────────────────────────
// // function TeamLeadPanel() {
// //   const qc = useQueryClient()
// //   const now = new Date()
// //   const [month, setMonth] = useState(now.getMonth() + 1)
// //   const [year, setYear] = useState(now.getFullYear())
// //   const [rejectId, setRejectId] = useState<string | null>(null)
// //   const [rejectReason, setRejectReason] = useState('')
// //   const [editRec, setEditRec] = useState<any>(null)
// //   const [editForm, setEditForm] = useState({ checkIn: '', checkOut: '', notes: '' })

// //   const { data: teamData } = useQuery({
// //     queryKey: ['my-team-tl'],
// //     queryFn: () => import('../../services/api').then(m => m.teamsApi.myTeam()).then(r => r.data),
// //   })

// //   const { data: records = [], isLoading } = useQuery({
// //     queryKey: ['tl-team-attendance', teamData?.id, month, year],
// //     queryFn: () => import('../../services/api').then(m => m.teamsApi.getAttendance(teamData!.id, { month, year })).then(r => r.data),
// //     enabled: !!teamData?.id,
// //   })

// //   const approveMut = useMutation({
// //     mutationFn: (id: string) => attendanceApi.approve(id),
// //     onSuccess: () => { toast.success('Approved'); qc.invalidateQueries({ queryKey: ['tl-team-attendance'] }) },
// //   })
// //   const rejectMut = useMutation({
// //     mutationFn: ({ id, reason }: { id: string; reason: string }) => attendanceApi.reject(id, reason),
// //     onSuccess: () => { toast.success('Rejected'); setRejectId(null); setRejectReason(''); qc.invalidateQueries({ queryKey: ['tl-team-attendance'] }) },
// //   })
// //   const editMut = useMutation({
// //     mutationFn: ({ id, data }: any) => attendanceApi.update(id, data),
// //     onSuccess: () => { toast.success('Updated'); setEditRec(null); qc.invalidateQueries({ queryKey: ['tl-team-attendance'] }) },
// //   })

// //   const openEdit = (rec: any) => {
// //     setEditRec(rec)
// //     const toTime = (dt: string) => dt ? new Date(dt).toTimeString().slice(0, 5) : ''
// //     setEditForm({ checkIn: toTime(rec.checkIn), checkOut: toTime(rec.checkOut), notes: rec.notes || '' })
// //   }

// //   const saveEdit = () => {
// //     const base = new Date(editRec.date)
// //     const toISO = (t: string) => { const d = new Date(base); const [h, m] = t.split(':'); d.setHours(+h, +m, 0, 0); return d.toISOString() }
// //     editMut.mutate({ id: editRec.id, data: { checkIn: editForm.checkIn ? toISO(editForm.checkIn) : undefined, checkOut: editForm.checkOut ? toISO(editForm.checkOut) : undefined, notes: editForm.notes } })
// //   }

// //   if (!teamData) return <div className="card p-8 text-center text-slate-400">No team assigned to you. Contact admin.</div>

// //   return (
// //     <div className="space-y-4">
// //       <div className="card p-4 flex items-center justify-between flex-wrap gap-3">
// //         <div>
// //           <p className="font-semibold text-slate-800">{teamData.name}</p>
// //           <p className="text-xs text-slate-400">{teamData.members?.length || 0} members</p>
// //         </div>
// //         <div className="flex gap-2">
// //           <select className="input w-32 text-sm py-1.5" value={month} onChange={e => setMonth(+e.target.value)}>
// //             {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
// //           </select>
// //           <select className="input w-24 text-sm py-1.5" value={year} onChange={e => setYear(+e.target.value)}>
// //             {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
// //           </select>
// //         </div>
// //       </div>

// //       {isLoading ? <PageLoader /> : (
// //         <div className="card overflow-hidden">
// //           <div className="overflow-x-auto">
// //             <table className="w-full text-sm">
// //               <thead className="bg-slate-50">
// //                 <tr>{['Employee','Date','Status','Check In','Check Out','Hours','Approval','Actions'].map(h => (
// //                   <th key={h} className="table-th">{h}</th>
// //                 ))}</tr>
// //               </thead>
// //               <tbody className="divide-y divide-slate-50">
// //                 {(records as any[]).length === 0 && (
// //                   <tr><td colSpan={8} className="text-center py-10 text-slate-400">No attendance records for this period</td></tr>
// //                 )}
// //                 {(records as any[]).map((rec: any) => (
// //                   <tr key={rec.id} className="hover:bg-slate-50/50">
// //                     <td className="table-td">
// //                       <div className="flex items-center gap-2">
// //                         <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold">
// //                           {rec.employee?.firstName?.[0]}{rec.employee?.lastName?.[0]}
// //                         </div>
// //                         <span className="font-medium">{rec.employee?.firstName} {rec.employee?.lastName}</span>
// //                       </div>
// //                     </td>
// //                     <td className="table-td text-slate-500">{formatDate(rec.date)}</td>
// //                     <td className="table-td">
// //                       <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[rec.status] || 'bg-slate-100 text-slate-500'}`}>
// //                         {rec.status?.replace('_', ' ')}
// //                       </span>
// //                     </td>
// //                     <td className="table-td text-slate-500">{rec.checkIn ? formatTime(rec.checkIn) : '—'}</td>
// //                     <td className="table-td text-slate-500">{rec.checkOut ? formatTime(rec.checkOut) : '—'}</td>
// //                     <td className="table-td text-slate-500">{rec.workHours ? `${Number(rec.workHours).toFixed(1)}h` : '—'}</td>
// //                     <td className="table-td">
// //                       {rec.approvalStatus === 'APPROVED' && <span className="text-xs text-emerald-600 font-semibold">✓ Approved</span>}
// //                       {rec.approvalStatus === 'REJECTED' && <span className="text-xs text-red-500 font-semibold" title={rec.rejectReason}>✗ Rejected</span>}
// //                       {(!rec.approvalStatus || rec.approvalStatus === 'PENDING') && <span className="text-xs text-amber-500">Pending</span>}
// //                     </td>
// //                     <td className="table-td">
// //                       <div className="flex gap-1">
// //                         {rec.approvalStatus !== 'APPROVED' && (
// //                           <button onClick={() => approveMut.mutate(rec.id)} className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-2 py-1 rounded-md font-medium">Approve</button>
// //                         )}
// //                         {rec.approvalStatus !== 'REJECTED' && (
// //                           <button onClick={() => setRejectId(rec.id)} className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-2 py-1 rounded-md font-medium">Reject</button>
// //                         )}
// //                         <button onClick={() => openEdit(rec)} className="text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 px-2 py-1 rounded-md font-medium">Edit</button>
// //                       </div>
// //                     </td>
// //                   </tr>
// //                 ))}
// //               </tbody>
// //             </table>
// //           </div>
// //         </div>
// //       )}

// //       {rejectId && (
// //         <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
// //           <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
// //             <h3 className="font-bold text-slate-900">Reject Attendance</h3>
// //             <div><label className="label">Reason *</label>
// //               <textarea className="input resize-none" rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Enter reason..." />
// //             </div>
// //             <div className="flex gap-2 justify-end">
// //               <button onClick={() => { setRejectId(null); setRejectReason('') }} className="btn-secondary text-sm">Cancel</button>
// //               <button onClick={() => rejectId && rejectReason && rejectMut.mutate({ id: rejectId, reason: rejectReason })} disabled={!rejectReason} className="btn-danger text-sm">Reject</button>
// //             </div>
// //           </div>
// //         </div>
// //       )}

// //       {editRec && (
// //         <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
// //           <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
// //             <h3 className="font-bold text-slate-900">Edit — {editRec.employee?.firstName} {editRec.employee?.lastName}</h3>
// //             <p className="text-sm text-slate-500">{formatDate(editRec.date)}</p>
// //             <div className="grid grid-cols-2 gap-3">
// //               <div><label className="label">Check In</label><input type="time" className="input" value={editForm.checkIn} onChange={e => setEditForm(f => ({ ...f, checkIn: e.target.value }))} /></div>
// //               <div><label className="label">Check Out</label><input type="time" className="input" value={editForm.checkOut} onChange={e => setEditForm(f => ({ ...f, checkOut: e.target.value }))} /></div>
// //             </div>
// //             <div><label className="label">Notes</label><input className="input" value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional..." /></div>
// //             <div className="flex gap-2 justify-end">
// //               <button onClick={() => setEditRec(null)} className="btn-secondary text-sm">Cancel</button>
// //               <button onClick={saveEdit} disabled={editMut.isPending} className="btn-primary text-sm">{editMut.isPending ? 'Saving...' : 'Save'}</button>
// //             </div>
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   )
// // }

// // // ─── Main ─────────────────────────────────────────────────────────────────────
// // export default function AttendancePage() {
// //   const isHR = useIsHR()
// //   const { user } = useAuthStore()
// //   const isTeamLead = (user?.role as string) === 'TEAM_LEAD'
// //   const [tab, setTab] = useState('mine')

// //   const tabs = isHR
// //     ? [
// //         { key: 'mine',     label: 'My Attendance' },
// //         { key: 'report',   label: 'Team Report' },
// //         { key: 'employee', label: 'Employee Report' },
// //       ]
// //     : isTeamLead
// //     ? [
// //         { key: 'mine', label: 'My Attendance' },
// //         { key: 'team', label: 'Team Approval' },
// //       ]
// //     : [{ key: 'mine', label: 'My Attendance' }]

// //   return (
// //     <div>
// //       <Header title="Attendance" subtitle="Track attendance and manage approvals" />
// //       <div className="p-6 space-y-5">
// //         {tabs.length > 1 && (
// //           <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
// //             {tabs.map((t: any) => (
// //               <button key={t.key} onClick={() => setTab(t.key)}
// //                 className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
// //                   tab === t.key ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
// //                 }`}>{t.label}</button>
// //             ))}
// //           </div>
// //         )}
// //         {tab === 'mine'     && <MyAttendanceView />}
// //         {tab === 'team'     && isTeamLead && <TeamLeadPanel />}
// //         {tab === 'report'   && isHR && <HRReportPanel />}
// //         {tab === 'employee' && isHR && <EmployeeReportPanel />}
// //       </div>
// //     </div>
// //   )
// // }
// import { useState } from 'react'
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
// import { Clock, Calendar, Download, Search, Users, User } from 'lucide-react'
// import { attendanceApi, employeesApi } from '../../services/api'
// import { useAuthStore, useIsHR } from '../../store/auth'
// import Header from '../../components/layout/Header'
// import { Badge, PageLoader, EmptyState, Avatar } from '../../components/ui'
// import { formatDate, formatTime } from '../../utils/helpers'
// import toast from 'react-hot-toast'

// // ─── Constants ────────────────────────────────────────────────────────────────
// const STATUS_COLOR: Record<string, string> = {
//   PRESENT:  'bg-emerald-100 text-emerald-700',
//   ABSENT:   'bg-red-100 text-red-700',
//   LATE:     'bg-amber-100 text-amber-700',
//   HALF_DAY: 'bg-blue-100 text-blue-700',
//   ON_LEAVE: 'bg-violet-100 text-violet-700',
//   WEEKEND:  'bg-slate-100 text-slate-400',
//   HOLIDAY:  'bg-pink-100 text-pink-700',
// }

// const MONTHS = [
//   'January','February','March','April','May','June',
//   'July','August','September','October','November','December',
// ]

// // ─── Helper: today's date as YYYY-MM-DD ──────────────────────────────────────
// function todayStr() {
//   return new Date().toISOString().split('T')[0]
// }

// // ─── HR Daily All-Employee View ───────────────────────────────────────────────
// function HRDailyView() {
//   const [date, setDate]         = useState(todayStr())
//   const [search, setSearch]     = useState('')
//   const [downloading, setDown]  = useState(false)

//   const { data, isLoading } = useQuery({
//     queryKey: ['hr-daily-all', date],
//     queryFn: () =>
//       attendanceApi.list({ startDate: date, endDate: date, limit: 200 }).then((r: any) => r.data?.data || []),
//   })

//   const records: any[] = data || []

//   // Filter by search
//   const filtered = records.filter((r: any) => {
//     if (!search) return true
//     const name = `${r.employee?.firstName} ${r.employee?.lastName}`.toLowerCase()
//     const code  = r.employee?.employeeCode?.toLowerCase() || ''
//     const dept  = r.employee?.department?.name?.toLowerCase() || ''
//     return name.includes(search.toLowerCase()) || code.includes(search.toLowerCase()) || dept.includes(search.toLowerCase())
//   })

//   // Summary counts from filtered
//   const present  = filtered.filter((r: any) => r.status === 'PRESENT').length
//   const absent   = filtered.filter((r: any) => r.status === 'ABSENT').length
//   const late     = filtered.filter((r: any) => r.isLate).length
//   const halfDay  = filtered.filter((r: any) => r.status === 'HALF_DAY').length
//   const onLeave  = filtered.filter((r: any) => r.status === 'ON_LEAVE').length
//   const total    = filtered.length

//   const handleDownload = async () => {
//     setDown(true)
//     try {
//       await attendanceApi.downloadCsv(
//         { type: 'daily', date },
//         `attendance-daily-${date}.csv`,
//       )
//       toast.success('Downloaded!')
//     } catch {
//       toast.error('Download failed')
//     } finally {
//       setDown(false)
//     }
//   }

//   return (
//     <div className="space-y-4">

//       {/* Controls */}
//       <div className="card p-4 flex flex-wrap items-center gap-3">
//         <div className="flex items-center gap-2">
//           <Calendar className="w-4 h-4 text-slate-400" />
//           <input
//             type="date"
//             className="input max-w-44"
//             value={date}
//             onChange={e => setDate(e.target.value)}
//           />
//         </div>

//         <div className="relative flex-1 min-w-48">
//           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
//           <input
//             className="input pl-9 w-full"
//             placeholder="Search by name, ID or department..."
//             value={search}
//             onChange={e => setSearch(e.target.value)}
//           />
//         </div>

//         <button
//           onClick={handleDownload}
//           disabled={downloading}
//           className="btn-secondary gap-2 ml-auto">
//           <Download className="w-4 h-4" />
//           {downloading ? 'Downloading…' : 'Download CSV'}
//         </button>
//       </div>

//       {/* Summary Cards */}
//       <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
//         {[
//           { label: 'Present',  value: present,  color: 'text-emerald-600 bg-emerald-50' },
//           { label: 'Absent',   value: absent,   color: 'text-red-600 bg-red-50' },
//           { label: 'Late',     value: late,     color: 'text-amber-600 bg-amber-50' },
//           { label: 'Half Day', value: halfDay,  color: 'text-blue-600 bg-blue-50' },
//           { label: 'On Leave', value: onLeave,  color: 'text-violet-600 bg-violet-50' },
//           { label: 'Total',    value: total,    color: 'text-slate-700 bg-slate-50' },
//         ].map(s => (
//           <div key={s.label} className={`card p-3 text-center ${s.color}`}>
//             <p className="text-xl font-bold">{s.value}</p>
//             <p className="text-xs font-medium">{s.label}</p>
//           </div>
//         ))}
//       </div>

//       {/* Table */}
//       <div className="card overflow-hidden">
//         <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
//           <Users className="w-4 h-4 text-slate-400" />
//           <p className="text-sm font-bold text-slate-700">
//             {filtered.length} employee{filtered.length !== 1 ? 's' : ''} — {new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
//           </p>
//         </div>

//         {isLoading ? <PageLoader /> : (
//           <div className="overflow-x-auto">
//             <table className="w-full text-sm">
//               <thead className="bg-slate-50 sticky top-0">
//                 <tr>
//                   {['Employee', 'Department', 'Status', 'Check In', 'Check Out', 'Hours Worked', 'Late'].map(h => (
//                     <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase whitespace-nowrap">
//                       {h}
//                     </th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody>
//                 {filtered.length === 0 ? (
//                   <tr>
//                     <td colSpan={7}>
//                       <EmptyState
//                         icon={Calendar}
//                         title="No attendance records"
//                         description={`No records found for ${new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`}
//                       />
//                     </td>
//                   </tr>
//                 ) : filtered.map((r: any) => (
//                   <tr key={r.id} className="border-t border-slate-50 hover:bg-slate-50/50">
//                     <td className="px-4 py-3">
//                       <div className="flex items-center gap-2">
//                         <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold shrink-0">
//                           {r.employee?.firstName?.[0]}{r.employee?.lastName?.[0]}
//                         </div>
//                         <div>
//                           <p className="text-sm font-medium text-slate-800 whitespace-nowrap">
//                             {r.employee?.firstName} {r.employee?.lastName}
//                           </p>
//                           <p className="text-xs text-slate-400">{r.employee?.employeeCode}</p>
//                         </div>
//                       </div>
//                     </td>
//                     <td className="px-4 py-3 text-xs text-slate-500">{r.employee?.department?.name || '—'}</td>
//                     <td className="px-4 py-3">
//                       <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR[r.status] || 'bg-slate-100 text-slate-500'}`}>
//                         {r.status?.replace('_', ' ')}
//                       </span>
//                     </td>
//                     <td className="px-4 py-3 text-sm text-slate-600">{r.checkIn ? formatTime(r.checkIn) : '—'}</td>
//                     <td className="px-4 py-3 text-sm text-slate-600">{r.checkOut ? formatTime(r.checkOut) : '—'}</td>
//                     <td className="px-4 py-3 text-sm text-slate-500">
//                       {r.workHours ? `${Number(r.workHours).toFixed(1)}h` : '—'}
//                     </td>
//                     <td className="px-4 py-3 text-xs">
//                       {r.isLate
//                         ? <span className="text-amber-600 font-medium">{r.lateMinutes}m late</span>
//                         : <span className="text-slate-300">—</span>}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }

// // ─── HR Global Report Panel (Team Report tab) ─────────────────────────────────
// function HRReportPanel() {
//   const now = new Date()
//   const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily')
//   const [reportDate, setReportDate] = useState(todayStr())
//   const [reportMonth, setReportMonth] = useState(now.getMonth() + 1)
//   const [reportYear, setReportYear]   = useState(now.getFullYear())
//   const [downloading, setDownloading] = useState(false)

//   const params: any = { type: reportType }
//   if (reportType === 'daily')   params.date = reportDate
//   if (reportType === 'weekly')  params.date = reportDate
//   if (reportType === 'monthly') { params.month = reportMonth; params.year = reportYear }

//   const { data, isLoading } = useQuery({
//     queryKey: ['att-report', reportType, reportDate, reportMonth, reportYear],
//     queryFn: () => attendanceApi.report(params).then((r: any) => r.data),
//   })

//   const handleDownload = async () => {
//     setDownloading(true)
//     try {
//       await attendanceApi.downloadCsv(params, `attendance-${reportType}-${reportDate || `${reportMonth}-${reportYear}`}.csv`)
//       toast.success('Report downloaded!')
//     } catch {
//       toast.error('Download failed.')
//     } finally {
//       setDownloading(false)
//     }
//   }

//   const summary = data?.summary || {}
//   const records = data?.records || []

//   return (
//     <div className="space-y-4">
//       <div className="card p-4">
//         <div className="flex items-center gap-3 flex-wrap">
//           <div className="flex rounded-xl overflow-hidden border border-slate-200">
//             {(['daily', 'weekly', 'monthly'] as const).map(t => (
//               <button key={t} onClick={() => setReportType(t)}
//                 className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
//                   reportType === t ? 'bg-primary-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
//                 }`}>{t}</button>
//             ))}
//           </div>
//           {reportType !== 'monthly'
//             ? <input type="date" className="input max-w-44" value={reportDate}
//                 onChange={(e: any) => setReportDate(e.target.value)} />
//             : <div className="flex gap-2">
//                 <select className="input w-36" value={reportMonth}
//                   onChange={(e: any) => setReportMonth(+e.target.value)}>
//                   {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
//                 </select>
//                 <select className="input w-24" value={reportYear}
//                   onChange={(e: any) => setReportYear(+e.target.value)}>
//                   {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
//                 </select>
//               </div>
//           }
//           <button onClick={handleDownload} disabled={downloading} className="btn-secondary gap-2 ml-auto">
//             <Download className="w-4 h-4" />
//             {downloading ? 'Downloading…' : 'Download CSV'}
//           </button>
//         </div>
//       </div>

//       <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
//         {[
//           { label: 'Present',  value: summary.present  || 0, color: 'text-emerald-600 bg-emerald-50' },
//           { label: 'Absent',   value: summary.absent   || 0, color: 'text-red-600 bg-red-50' },
//           { label: 'Late',     value: summary.late     || 0, color: 'text-amber-600 bg-amber-50' },
//           { label: 'Half Day', value: summary.halfDay  || 0, color: 'text-blue-600 bg-blue-50' },
//           { label: 'On Leave', value: summary.onLeave  || 0, color: 'text-violet-600 bg-violet-50' },
//           { label: 'Total',    value: summary.total    || 0, color: 'text-slate-700 bg-slate-50' },
//         ].map(s => (
//           <div key={s.label} className={`card p-3 text-center ${s.color}`}>
//             <p className="text-xl font-bold">{s.value}</p>
//             <p className="text-xs font-medium">{s.label}</p>
//           </div>
//         ))}
//       </div>

//       <div className="card overflow-hidden">
//         <div className="px-4 py-3 border-b border-slate-100">
//           <p className="text-sm font-bold text-slate-700">{records.length} records</p>
//         </div>
//         {isLoading ? <PageLoader /> : (
//           <div className="overflow-x-auto max-h-[500px]">
//             <table className="w-full text-sm">
//               <thead className="bg-slate-50 sticky top-0">
//                 <tr>
//                   {['Date', 'Employee', 'Department', 'Status', 'Check In', 'Check Out', 'Hours', 'Late (min)'].map(h => (
//                     <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase whitespace-nowrap">{h}</th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody>
//                 {records.length === 0
//                   ? <tr><td colSpan={8} className="text-center py-8 text-slate-400 text-sm">No records for this period</td></tr>
//                   : records.map((r: any) => (
//                     <tr key={r.id} className="border-t border-slate-50 hover:bg-slate-50/50">
//                       <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">{formatDate(r.date)}</td>
//                       <td className="px-4 py-2.5">
//                         <p className="font-medium text-slate-800 whitespace-nowrap">{r.employee?.firstName} {r.employee?.lastName}</p>
//                         <p className="text-xs text-slate-400">{r.employee?.employeeCode}</p>
//                       </td>
//                       <td className="px-4 py-2.5 text-xs text-slate-500">{r.employee?.department?.name || '—'}</td>
//                       <td className="px-4 py-2.5">
//                         <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[r.status] || ''}`}>{r.status}</span>
//                       </td>
//                       <td className="px-4 py-2.5 text-xs text-slate-600">{r.checkIn ? formatTime(r.checkIn) : '—'}</td>
//                       <td className="px-4 py-2.5 text-xs text-slate-600">{r.checkOut ? formatTime(r.checkOut) : '—'}</td>
//                       <td className="px-4 py-2.5 text-xs text-slate-500">
//                         {r.checkIn && r.checkOut
//                           ? ((new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) / 3600000).toFixed(1) + 'h'
//                           : '—'}
//                       </td>
//                       <td className="px-4 py-2.5 text-xs text-slate-500">{r.lateMinutes || 0}</td>
//                     </tr>
//                   ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }

// // ─── Per-Employee Report Panel ────────────────────────────────────────────────
// function EmployeeReportPanel() {
//   const now = new Date()
//   const [reportType, setReportType]   = useState<'weekly' | 'monthly'>('monthly')
//   const [reportDate, setReportDate]   = useState(todayStr())
//   const [reportMonth, setReportMonth] = useState(now.getMonth() + 1)
//   const [reportYear, setReportYear]   = useState(now.getFullYear())
//   const [empSearch, setEmpSearch]     = useState('')
//   const [selectedEmp, setSelectedEmp] = useState<any>(null)
//   const [downloading, setDownloading] = useState(false)

//   const { data: empResults } = useQuery({
//     queryKey: ['emp-att-search', empSearch],
//     queryFn: () => employeesApi.list({ search: empSearch, limit: 8 }).then((r: any) => r.data?.data || []),
//     enabled: empSearch.length >= 2,
//   })

//   const params: any = { type: reportType }
//   if (reportType === 'weekly')  params.date = reportDate
//   else { params.month = reportMonth; params.year = reportYear }

//   const { data, isLoading } = useQuery({
//     queryKey: ['emp-att-report', selectedEmp?.id, reportType, reportDate, reportMonth, reportYear],
//     queryFn: () => attendanceApi.reportEmployee(selectedEmp.id, params).then((r: any) => r.data),
//     enabled: !!selectedEmp,
//   })

//   const handleDownload = async () => {
//     if (!selectedEmp) return
//     setDownloading(true)
//     try {
//       await attendanceApi.downloadEmployeeCsv(selectedEmp.id, params, `${selectedEmp.firstName}-${selectedEmp.lastName}-attendance.csv`)
//       toast.success('Downloaded!')
//     } catch {
//       toast.error('Download failed')
//     } finally {
//       setDownloading(false)
//     }
//   }

//   const records = data?.records || []
//   const summary = data?.summary || {}

//   return (
//     <div className="space-y-4">
//       <div className="card p-4">
//         <div className="flex gap-3 flex-wrap items-end">
//           <div className="flex-1 min-w-48 relative">
//             <label className="block text-xs font-semibold text-slate-500 mb-1">Search Employee</label>
//             <div className="relative">
//               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
//               <input className="input pl-9" placeholder="Name or employee ID..."
//                 value={empSearch} onChange={(e: any) => setEmpSearch(e.target.value)} />
//             </div>
//             {empSearch.length >= 2 && (
//               <div className="absolute z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg w-72 max-h-48 overflow-y-auto">
//                 {(empResults || []).map((emp: any) => (
//                   <button key={emp.id} onClick={() => { setSelectedEmp(emp); setEmpSearch('') }}
//                     className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-left">
//                     <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold">
//                       {emp.firstName?.[0]}{emp.lastName?.[0]}
//                     </div>
//                     <div>
//                       <p className="text-sm font-semibold">{emp.firstName} {emp.lastName}</p>
//                       <p className="text-xs text-slate-400">{emp.employeeCode} · {emp.department?.name}</p>
//                     </div>
//                   </button>
//                 ))}
//               </div>
//             )}
//           </div>

//           <div className="flex rounded-xl overflow-hidden border border-slate-200">
//             {(['weekly', 'monthly'] as const).map(t => (
//               <button key={t} onClick={() => setReportType(t)}
//                 className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
//                   reportType === t ? 'bg-primary-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
//                 }`}>{t}</button>
//             ))}
//           </div>

//           {reportType === 'weekly'
//             ? <input type="date" className="input max-w-44" value={reportDate}
//                 onChange={(e: any) => setReportDate(e.target.value)} />
//             : <div className="flex gap-2">
//                 <select className="input w-32" value={reportMonth}
//                   onChange={(e: any) => setReportMonth(+e.target.value)}>
//                   {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
//                 </select>
//                 <select className="input w-24" value={reportYear}
//                   onChange={(e: any) => setReportYear(+e.target.value)}>
//                   {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
//                 </select>
//               </div>
//           }
//           {selectedEmp && (
//             <button onClick={handleDownload} disabled={downloading} className="btn-secondary gap-2">
//               <Download className="w-4 h-4" />
//               {downloading ? 'Downloading…' : 'Download CSV'}
//             </button>
//           )}
//         </div>
//       </div>

//       {selectedEmp && (
//         <div className="flex items-center gap-3 bg-primary-50 border border-primary-100 rounded-xl px-4 py-3">
//           <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold">
//             {selectedEmp.firstName?.[0]}{selectedEmp.lastName?.[0]}
//           </div>
//           <div className="flex-1">
//             <p className="font-bold text-slate-800">{selectedEmp.firstName} {selectedEmp.lastName}</p>
//             <p className="text-xs text-slate-500">{selectedEmp.employeeCode} · {selectedEmp.department?.name}</p>
//           </div>
//           <button onClick={() => setSelectedEmp(null)} className="text-xs text-slate-400 hover:text-slate-600">✕</button>
//         </div>
//       )}

//       {!selectedEmp ? (
//         <div className="card p-12 text-center">
//           <User className="w-12 h-12 text-slate-200 mx-auto mb-3" />
//           <p className="text-slate-400 font-medium">Search and select an employee above</p>
//         </div>
//       ) : isLoading ? <PageLoader /> : (
//         <>
//           <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
//             {[
//               { label: 'Present',  value: summary.present  || 0, color: 'text-emerald-600 bg-emerald-50' },
//               { label: 'Absent',   value: summary.absent   || 0, color: 'text-red-600 bg-red-50' },
//               { label: 'Late',     value: summary.late     || 0, color: 'text-amber-600 bg-amber-50' },
//               { label: 'Half Day', value: summary.halfDay  || 0, color: 'text-blue-600 bg-blue-50' },
//               { label: 'On Leave', value: summary.onLeave  || 0, color: 'text-violet-600 bg-violet-50' },
//               { label: 'Total',    value: summary.total    || 0, color: 'text-slate-700 bg-slate-50' },
//             ].map(s => (
//               <div key={s.label} className={`card p-3 text-center ${s.color}`}>
//                 <p className="text-xl font-bold">{s.value}</p>
//                 <p className="text-xs font-medium">{s.label}</p>
//               </div>
//             ))}
//           </div>
//           <div className="card overflow-hidden">
//             <div className="overflow-x-auto max-h-96">
//               <table className="w-full text-sm">
//                 <thead className="bg-slate-50 sticky top-0">
//                   <tr>
//                     {['Date', 'Day', 'Status', 'Check In', 'Check Out', 'Hours', 'Late'].map(h => (
//                       <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase">{h}</th>
//                     ))}
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {records.length === 0
//                     ? <tr><td colSpan={7} className="text-center py-8 text-slate-400 text-sm">No records</td></tr>
//                     : records.map((r: any) => (
//                       <tr key={r.id} className="border-t border-slate-50 hover:bg-slate-50/50">
//                         <td className="px-4 py-2.5 text-xs text-slate-600 whitespace-nowrap">{formatDate(r.date)}</td>
//                         <td className="px-4 py-2.5 text-xs text-slate-400">{new Date(r.date).toLocaleDateString('en-IN', { weekday: 'short' })}</td>
//                         <td className="px-4 py-2.5">
//                           <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[r.status] || ''}`}>{r.status}</span>
//                         </td>
//                         <td className="px-4 py-2.5 text-xs text-slate-600">{r.checkIn ? formatTime(r.checkIn) : '—'}</td>
//                         <td className="px-4 py-2.5 text-xs text-slate-600">{r.checkOut ? formatTime(r.checkOut) : '—'}</td>
//                         <td className="px-4 py-2.5 text-xs text-slate-500">
//                           {r.checkIn && r.checkOut
//                             ? ((new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) / 3600000).toFixed(1) + 'h'
//                             : '—'}
//                         </td>
//                         <td className="px-4 py-2.5 text-xs text-slate-500">{r.lateMinutes || 0}</td>
//                       </tr>
//                     ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         </>
//       )}
//     </div>
//   )
// }

// // ─── Employee Self View (non-HR) ──────────────────────────────────────────────
// function MyAttendanceSelfView() {
//   const { user } = useAuthStore()
//   const qc = useQueryClient()
//   const now = new Date()
//   const [month, setMonth] = useState(now.getMonth() + 1)
//   const [year,  setYear]  = useState(now.getFullYear())

//   const { data: todayAtt } = useQuery({
//     queryKey: ['attendance-today'],
//     queryFn: () => attendanceApi.today().then((r: any) => r.data),
//   })

//   const { data: summary, isLoading } = useQuery({
//     queryKey: ['attendance-summary', month, year],
//     queryFn: () => attendanceApi.summary({ month, year }).then((r: any) => r.data),
//   })

//   const checkInMut = useMutation({
//     mutationFn: () => attendanceApi.checkIn(),
//     onSuccess: () => {
//       toast.success('Checked in!')
//       qc.invalidateQueries({ queryKey: ['attendance-today'] })
//       qc.invalidateQueries({ queryKey: ['attendance-summary'] })
//     },
//   })
//   const checkOutMut = useMutation({
//     mutationFn: () => attendanceApi.checkOut(),
//     onSuccess: () => {
//       toast.success('Checked out!')
//       qc.invalidateQueries({ queryKey: ['attendance-today'] })
//       qc.invalidateQueries({ queryKey: ['attendance-summary'] })
//     },
//   })

//   const fullName = `${(user as any)?.employee?.firstName ?? (user as any)?.name ?? ''}`

//   return (
//     <div className="space-y-4">
//       {/* Check In/Out card */}
//       <div className="card p-5 flex items-center gap-6 flex-wrap">
//         <div className="flex-1">
//           <p className="text-sm font-semibold text-slate-700">Today — {formatDate(new Date())}</p>
//           <div className="flex gap-6 mt-2">
//             {[
//               { label: 'Check In',  value: todayAtt?.record?.checkIn  ? formatTime(todayAtt.record.checkIn)  : '—' },
//               { label: 'Check Out', value: todayAtt?.record?.checkOut ? formatTime(todayAtt.record.checkOut) : '—' },
//               { label: 'Hours',     value: todayAtt?.record?.workHours ? `${todayAtt.record.workHours}h`     : '—' },
//             ].map(s => (
//               <div key={s.label}>
//                 <p className="text-xs text-slate-400">{s.label}</p>
//                 <p className="text-sm font-bold text-slate-800">{s.value}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//         <div className="flex gap-2">
//           {!todayAtt?.checkedIn && (
//             <button className="btn-primary flex items-center gap-2" onClick={() => checkInMut.mutate()} disabled={checkInMut.isPending}>
//               <Clock className="w-4 h-4" /> Check In
//             </button>
//           )}
//           {todayAtt?.checkedIn && !todayAtt?.checkedOut && (
//             <button className="btn-secondary flex items-center gap-2" onClick={() => checkOutMut.mutate()} disabled={checkOutMut.isPending}>
//               <Clock className="w-4 h-4" /> Check Out
//             </button>
//           )}
//         </div>
//       </div>

//       {/* Month selectors */}
//       <div className="card p-4 flex gap-3 items-center">
//         <select className="input w-36" value={month} onChange={e => setMonth(+e.target.value)}>
//           {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
//         </select>
//         <select className="input w-24" value={year} onChange={e => setYear(+e.target.value)}>
//           {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
//         </select>
//       </div>

//       {/* Summary cards */}
//       {summary && (
//         <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
//           {[
//             { label: 'Present',  value: summary.present   || 0, color: 'text-emerald-600 bg-emerald-50' },
//             { label: 'Absent',   value: summary.absent    || 0, color: 'text-red-600 bg-red-50' },
//             { label: 'Late',     value: summary.late      || 0, color: 'text-amber-600 bg-amber-50' },
//             { label: 'Leaves',   value: summary.onLeave   || 0, color: 'text-violet-600 bg-violet-50' },
//             { label: 'Half Day', value: summary.halfDay   || 0, color: 'text-blue-600 bg-blue-50' },
//             { label: 'Avg Hrs',  value: summary.avgHours  ? Number(summary.avgHours).toFixed(1) : '—', color: 'text-slate-700 bg-slate-50' },
//           ].map(s => (
//             <div key={s.label} className={`card p-3 text-center ${s.color}`}>
//               <p className="text-xl font-bold">{s.value}</p>
//               <p className="text-xs font-medium">{s.label}</p>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Records table */}
//       <div className="card overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full text-sm">
//             <thead className="bg-slate-50">
//               <tr>
//                 {['Date', 'Day', 'Status', 'Check In', 'Check Out', 'Hours Worked', 'Late'].map(h => (
//                   <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">{h}</th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {isLoading ? (
//                 <tr><td colSpan={7}><PageLoader /></td></tr>
//               ) : (summary?.records || []).map((r: any) => (
//                 <tr key={r.id} className="border-t border-slate-50 hover:bg-slate-50/50">
//                   <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{formatDate(r.date)}</td>
//                   <td className="px-4 py-3 text-xs text-slate-400">{new Date(r.date).toLocaleDateString('en-IN', { weekday: 'short' })}</td>
//                   <td className="px-4 py-3">
//                     <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR[r.status] || ''}`}>
//                       {r.status?.replace('_', ' ')}
//                     </span>
//                   </td>
//                   <td className="px-4 py-3 text-sm text-slate-600">{r.checkIn ? formatTime(r.checkIn) : '—'}</td>
//                   <td className="px-4 py-3 text-sm text-slate-600">{r.checkOut ? formatTime(r.checkOut) : '—'}</td>
//                   <td className="px-4 py-3 text-sm text-slate-500">{r.workHours ? `${Number(r.workHours).toFixed(1)}h` : '—'}</td>
//                   <td className="px-4 py-3 text-xs">
//                     {r.isLate
//                       ? <span className="text-amber-600 font-medium">{r.lateMinutes}m late</span>
//                       : <span className="text-slate-300">—</span>}
//                   </td>
//                 </tr>
//               ))}
//               {!isLoading && !(summary?.records?.length) && (
//                 <tr><td colSpan={7} className="text-center py-8 text-slate-400 text-sm">No attendance records for this month</td></tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   )
// }

// // ─── Main Page ────────────────────────────────────────────────────────────────
// export default function AttendancePage() {
//   const isHR = useIsHR()
//   const { user } = useAuthStore()
//   const isTeamLead = (user?.role as string) === 'TEAM_LEAD'
//   const [tab, setTab] = useState('mine')

//   const tabs = isHR
//     ? [
//         { key: 'mine',     label: 'Daily Attendance' },
//         { key: 'report',   label: 'Team Report' },
//         { key: 'employee', label: 'Employee Report' },
//       ]
//     : isTeamLead
//     ? [
//         { key: 'mine', label: 'My Attendance' },
//         { key: 'team', label: 'Team Approval' },
//       ]
//     : [{ key: 'mine', label: 'My Attendance' }]

//   return (
//     <div>
//       <Header
//         title="Attendance"
//         subtitle={isHR ? 'Daily attendance overview and reports' : 'Track attendance and manage approvals'}
//       />
//       <div className="p-6 space-y-5">
//         {tabs.length > 1 && (
//           <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
//             {tabs.map(t => (
//               <button key={t.key} onClick={() => setTab(t.key)}
//                 className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
//                   tab === t.key ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
//                 }`}>{t.label}</button>
//             ))}
//           </div>
//         )}

//         {/* HR: Daily Attendance tab = all employees for selected date */}
//         {tab === 'mine'     && isHR        && <HRDailyView />}

//         {/* Non-HR: My Attendance = self view */}
//         {tab === 'mine'     && !isHR       && <MyAttendanceSelfView />}

//         {tab === 'report'   && isHR        && <HRReportPanel />}
//         {tab === 'employee' && isHR        && <EmployeeReportPanel />}
//       </div>
//     </div>
//   )
// }
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Clock, Calendar, Download, Search, Users, User } from 'lucide-react'
import { attendanceApi, employeesApi } from '../../services/api'
import { useAuthStore, useIsHR } from '../../store/auth'
import Header from '../../components/layout/Header'
import { Badge, PageLoader, EmptyState, Avatar } from '../../components/ui'
import { formatDate, formatTime } from '../../utils/helpers'
import toast from 'react-hot-toast'

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_COLOR: Record<string, string> = {
  PRESENT:  'bg-emerald-100 text-emerald-700',
  ABSENT:   'bg-red-100 text-red-700',
  LATE:     'bg-amber-100 text-amber-700',
  HALF_DAY: 'bg-blue-100 text-blue-700',
  ON_LEAVE: 'bg-violet-100 text-violet-700',
  WEEKEND:  'bg-slate-100 text-slate-400',
  HOLIDAY:  'bg-pink-100 text-pink-700',
}

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

// ─── Helper: today's date as YYYY-MM-DD ──────────────────────────────────────
function todayStr() {
  return new Date().toISOString().split('T')[0]
}

// ─── HR Daily All-Employee View ───────────────────────────────────────────────
function HRDailyView() {
  const now = new Date()
  const [date, setDate]         = useState(todayStr())
  const [search, setSearch]     = useState('')
  const [downloading, setDown]  = useState(false)

  // Parse selected date into month+year for the API (avoids UTC boundary issues)
  const selectedDate  = new Date(date + 'T00:00:00')   // force local midnight
  const selMonth      = selectedDate.getMonth() + 1
  const selYear       = selectedDate.getFullYear()
  const selDateStr    = selectedDate.toISOString().split('T')[0]  // "YYYY-MM-DD"

  const { data, isLoading } = useQuery({
    queryKey: ['hr-daily-all', selYear, selMonth],
    queryFn: () =>
      attendanceApi.list({ month: selMonth, year: selYear, limit: 500 }).then((r: any) => r.data?.data || []),
  })

  // Filter to only the selected date (client-side, avoids UTC edge cases)
  const dayRecords: any[] = (data || []).filter((r: any) => {
    const recDate = r.date?.split('T')[0]   // "YYYY-MM-DD"
    return recDate === selDateStr
  })

  // Filter by search
  const filtered = dayRecords.filter((r: any) => {
    if (!search) return true
    const name = `${r.employee?.firstName} ${r.employee?.lastName}`.toLowerCase()
    const code  = r.employee?.employeeCode?.toLowerCase() || ''
    const dept  = r.employee?.department?.name?.toLowerCase() || ''
    return name.includes(search.toLowerCase()) || code.includes(search.toLowerCase()) || dept.includes(search.toLowerCase())
  })

  // Summary counts from filtered
  const present  = filtered.filter((r: any) => r.status === 'PRESENT').length
  const absent   = filtered.filter((r: any) => r.status === 'ABSENT').length
  const late     = filtered.filter((r: any) => r.isLate).length
  const halfDay  = filtered.filter((r: any) => r.status === 'HALF_DAY').length
  const onLeave  = filtered.filter((r: any) => r.status === 'ON_LEAVE').length
  const total    = filtered.length

  const handleDownload = async () => {
    setDown(true)
    try {
      await attendanceApi.downloadCsv(
        { type: 'daily', date },
        `attendance-daily-${date}.csv`,
      )
      toast.success('Downloaded!')
    } catch {
      toast.error('Download failed')
    } finally {
      setDown(false)
    }
  }

  return (
    <div className="space-y-4">

      {/* Controls */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            className="input max-w-44"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>

        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="input pl-9 w-full"
            placeholder="Search by name, ID or department..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <button
          onClick={handleDownload}
          disabled={downloading}
          className="btn-secondary gap-2 ml-auto">
          <Download className="w-4 h-4" />
          {downloading ? 'Downloading…' : 'Download CSV'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: 'Present',  value: present,  color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Absent',   value: absent,   color: 'text-red-600 bg-red-50' },
          { label: 'Late',     value: late,     color: 'text-amber-600 bg-amber-50' },
          { label: 'Half Day', value: halfDay,  color: 'text-blue-600 bg-blue-50' },
          { label: 'On Leave', value: onLeave,  color: 'text-violet-600 bg-violet-50' },
          { label: 'Total',    value: total,    color: 'text-slate-700 bg-slate-50' },
        ].map(s => (
          <div key={s.label} className={`card p-3 text-center ${s.color}`}>
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-xs font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-400" />
          <p className="text-sm font-bold text-slate-700">
            {filtered.length} employee{filtered.length !== 1 ? 's' : ''} — {new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {isLoading ? <PageLoader /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  {['Employee', 'Department', 'Status', 'Check In', 'Check Out', 'Hours Worked', 'Late'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState
                        icon={Calendar}
                        title="No attendance records"
                        description={`No records found for ${new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`}
                      />
                    </td>
                  </tr>
                ) : filtered.map((r: any) => (
                  <tr key={r.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold shrink-0">
                          {r.employee?.firstName?.[0]}{r.employee?.lastName?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800 whitespace-nowrap">
                            {r.employee?.firstName} {r.employee?.lastName}
                          </p>
                          <p className="text-xs text-slate-400">{r.employee?.employeeCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{r.employee?.department?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR[r.status] || 'bg-slate-100 text-slate-500'}`}>
                        {r.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{r.checkIn ? formatTime(r.checkIn) : '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{r.checkOut ? formatTime(r.checkOut) : '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {r.workHours ? `${Number(r.workHours).toFixed(1)}h` : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {r.isLate
                        ? <span className="text-amber-600 font-medium">{r.lateMinutes}m late</span>
                        : <span className="text-slate-300">—</span>}
                    </td>
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

// ─── HR Global Report Panel (Team Report tab) ─────────────────────────────────
function HRReportPanel() {
  const now = new Date()
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [reportDate, setReportDate] = useState(todayStr())
  const [reportMonth, setReportMonth] = useState(now.getMonth() + 1)
  const [reportYear, setReportYear]   = useState(now.getFullYear())
  const [downloading, setDownloading] = useState(false)

  const params: any = { type: reportType }
  if (reportType === 'daily')   params.date = reportDate
  if (reportType === 'weekly')  params.date = reportDate
  if (reportType === 'monthly') { params.month = reportMonth; params.year = reportYear }

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
      toast.error('Download failed.')
    } finally {
      setDownloading(false)
    }
  }

  const summary = data?.summary || {}
  const records = data?.records || []

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex rounded-xl overflow-hidden border border-slate-200">
            {(['daily', 'weekly', 'monthly'] as const).map(t => (
              <button key={t} onClick={() => setReportType(t)}
                className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                  reportType === t ? 'bg-primary-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}>{t}</button>
            ))}
          </div>
          {reportType !== 'monthly'
            ? <input type="date" className="input max-w-44" value={reportDate}
                onChange={(e: any) => setReportDate(e.target.value)} />
            : <div className="flex gap-2">
                <select className="input w-36" value={reportMonth}
                  onChange={(e: any) => setReportMonth(+e.target.value)}>
                  {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
                <select className="input w-24" value={reportYear}
                  onChange={(e: any) => setReportYear(+e.target.value)}>
                  {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
          }
          <button onClick={handleDownload} disabled={downloading} className="btn-secondary gap-2 ml-auto">
            <Download className="w-4 h-4" />
            {downloading ? 'Downloading…' : 'Download CSV'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: 'Present',  value: summary.present  || 0, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Absent',   value: summary.absent   || 0, color: 'text-red-600 bg-red-50' },
          { label: 'Late',     value: summary.late     || 0, color: 'text-amber-600 bg-amber-50' },
          { label: 'Half Day', value: summary.halfDay  || 0, color: 'text-blue-600 bg-blue-50' },
          { label: 'On Leave', value: summary.onLeave  || 0, color: 'text-violet-600 bg-violet-50' },
          { label: 'Total',    value: summary.total    || 0, color: 'text-slate-700 bg-slate-50' },
        ].map(s => (
          <div key={s.label} className={`card p-3 text-center ${s.color}`}>
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-xs font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-sm font-bold text-slate-700">{records.length} records</p>
        </div>
        {isLoading ? <PageLoader /> : (
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  {['Date', 'Employee', 'Department', 'Status', 'Check In', 'Check Out', 'Hours', 'Late (min)'].map(h => (
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
  const [reportType, setReportType]   = useState<'weekly' | 'monthly'>('monthly')
  const [reportDate, setReportDate]   = useState(todayStr())
  const [reportMonth, setReportMonth] = useState(now.getMonth() + 1)
  const [reportYear, setReportYear]   = useState(now.getFullYear())
  const [empSearch, setEmpSearch]     = useState('')
  const [selectedEmp, setSelectedEmp] = useState<any>(null)
  const [downloading, setDownloading] = useState(false)

  const { data: empResults } = useQuery({
    queryKey: ['emp-att-search', empSearch],
    queryFn: () => employeesApi.list({ search: empSearch, limit: 8 }).then((r: any) => r.data?.data || []),
    enabled: empSearch.length >= 2,
  })

  const params: any = { type: reportType }
  if (reportType === 'weekly')  params.date = reportDate
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
      await attendanceApi.downloadEmployeeCsv(selectedEmp.id, params, `${selectedEmp.firstName}-${selectedEmp.lastName}-attendance.csv`)
      toast.success('Downloaded!')
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
      <div className="card p-4">
        <div className="flex gap-3 flex-wrap items-end">
          <div className="flex-1 min-w-48 relative">
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
                    <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold">
                      {emp.firstName?.[0]}{emp.lastName?.[0]}
                    </div>
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
            {(['weekly', 'monthly'] as const).map(t => (
              <button key={t} onClick={() => setReportType(t)}
                className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                  reportType === t ? 'bg-primary-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}>{t}</button>
            ))}
          </div>

          {reportType === 'weekly'
            ? <input type="date" className="input max-w-44" value={reportDate}
                onChange={(e: any) => setReportDate(e.target.value)} />
            : <div className="flex gap-2">
                <select className="input w-32" value={reportMonth}
                  onChange={(e: any) => setReportMonth(+e.target.value)}>
                  {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
                <select className="input w-24" value={reportYear}
                  onChange={(e: any) => setReportYear(+e.target.value)}>
                  {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
          }
          {selectedEmp && (
            <button onClick={handleDownload} disabled={downloading} className="btn-secondary gap-2">
              <Download className="w-4 h-4" />
              {downloading ? 'Downloading…' : 'Download CSV'}
            </button>
          )}
        </div>
      </div>

      {selectedEmp && (
        <div className="flex items-center gap-3 bg-primary-50 border border-primary-100 rounded-xl px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold">
            {selectedEmp.firstName?.[0]}{selectedEmp.lastName?.[0]}
          </div>
          <div className="flex-1">
            <p className="font-bold text-slate-800">{selectedEmp.firstName} {selectedEmp.lastName}</p>
            <p className="text-xs text-slate-500">{selectedEmp.employeeCode} · {selectedEmp.department?.name}</p>
          </div>
          <button onClick={() => setSelectedEmp(null)} className="text-xs text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {!selectedEmp ? (
        <div className="card p-12 text-center">
          <User className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">Search and select an employee above</p>
        </div>
      ) : isLoading ? <PageLoader /> : (
        <>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { label: 'Present',  value: summary.present  || 0, color: 'text-emerald-600 bg-emerald-50' },
              { label: 'Absent',   value: summary.absent   || 0, color: 'text-red-600 bg-red-50' },
              { label: 'Late',     value: summary.late     || 0, color: 'text-amber-600 bg-amber-50' },
              { label: 'Half Day', value: summary.halfDay  || 0, color: 'text-blue-600 bg-blue-50' },
              { label: 'On Leave', value: summary.onLeave  || 0, color: 'text-violet-600 bg-violet-50' },
              { label: 'Total',    value: summary.total    || 0, color: 'text-slate-700 bg-slate-50' },
            ].map(s => (
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
                    {['Date', 'Day', 'Status', 'Check In', 'Check Out', 'Hours', 'Late'].map(h => (
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

// ─── Employee Self View (non-HR) ──────────────────────────────────────────────
function MyAttendanceSelfView() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year,  setYear]  = useState(now.getFullYear())

  const { data: todayAtt } = useQuery({
    queryKey: ['attendance-today'],
    queryFn: () => attendanceApi.today().then((r: any) => r.data),
  })

  const { data: summary, isLoading } = useQuery({
    queryKey: ['attendance-summary', month, year],
    queryFn: () => attendanceApi.summary({ month, year }).then((r: any) => r.data),
  })

  const checkInMut = useMutation({
    mutationFn: () => attendanceApi.checkIn(),
    onSuccess: () => {
      toast.success('Checked in!')
      qc.invalidateQueries({ queryKey: ['attendance-today'] })
      qc.invalidateQueries({ queryKey: ['attendance-summary'] })
    },
  })
  const checkOutMut = useMutation({
    mutationFn: () => attendanceApi.checkOut(),
    onSuccess: () => {
      toast.success('Checked out!')
      qc.invalidateQueries({ queryKey: ['attendance-today'] })
      qc.invalidateQueries({ queryKey: ['attendance-summary'] })
    },
  })

  const fullName = `${(user as any)?.employee?.firstName ?? (user as any)?.name ?? ''}`

  return (
    <div className="space-y-4">
      {/* Check In/Out card */}
      <div className="card p-5 flex items-center gap-6 flex-wrap">
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-700">Today — {formatDate(new Date())}</p>
          <div className="flex gap-6 mt-2">
            {[
              { label: 'Check In',  value: todayAtt?.record?.checkIn  ? formatTime(todayAtt.record.checkIn)  : '—' },
              { label: 'Check Out', value: todayAtt?.record?.checkOut ? formatTime(todayAtt.record.checkOut) : '—' },
              { label: 'Hours',     value: todayAtt?.record?.workHours ? `${todayAtt.record.workHours}h`     : '—' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-xs text-slate-400">{s.label}</p>
                <p className="text-sm font-bold text-slate-800">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          {!todayAtt?.checkedIn && (
            <button className="btn-primary flex items-center gap-2" onClick={() => checkInMut.mutate()} disabled={checkInMut.isPending}>
              <Clock className="w-4 h-4" /> Check In
            </button>
          )}
          {todayAtt?.checkedIn && !todayAtt?.checkedOut && (
            <button className="btn-secondary flex items-center gap-2" onClick={() => checkOutMut.mutate()} disabled={checkOutMut.isPending}>
              <Clock className="w-4 h-4" /> Check Out
            </button>
          )}
        </div>
      </div>

      {/* Month selectors */}
      <div className="card p-4 flex gap-3 items-center">
        <select className="input w-36" value={month} onChange={e => setMonth(+e.target.value)}>
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select className="input w-24" value={year} onChange={e => setYear(+e.target.value)}>
          {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { label: 'Present',  value: summary.present   || 0, color: 'text-emerald-600 bg-emerald-50' },
            { label: 'Absent',   value: summary.absent    || 0, color: 'text-red-600 bg-red-50' },
            { label: 'Late',     value: summary.late      || 0, color: 'text-amber-600 bg-amber-50' },
            { label: 'Leaves',   value: summary.onLeave   || 0, color: 'text-violet-600 bg-violet-50' },
            { label: 'Half Day', value: summary.halfDay   || 0, color: 'text-blue-600 bg-blue-50' },
            { label: 'Avg Hrs',  value: summary.avgHours  ? Number(summary.avgHours).toFixed(1) : '—', color: 'text-slate-700 bg-slate-50' },
          ].map(s => (
            <div key={s.label} className={`card p-3 text-center ${s.color}`}>
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-xs font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Records table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {['Date', 'Day', 'Status', 'Check In', 'Check Out', 'Hours Worked', 'Late'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7}><PageLoader /></td></tr>
              ) : (summary?.records || []).map((r: any) => (
                <tr key={r.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{formatDate(r.date)}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{new Date(r.date).toLocaleDateString('en-IN', { weekday: 'short' })}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR[r.status] || ''}`}>
                      {r.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{r.checkIn ? formatTime(r.checkIn) : '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{r.checkOut ? formatTime(r.checkOut) : '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{r.workHours ? `${Number(r.workHours).toFixed(1)}h` : '—'}</td>
                  <td className="px-4 py-3 text-xs">
                    {r.isLate
                      ? <span className="text-amber-600 font-medium">{r.lateMinutes}m late</span>
                      : <span className="text-slate-300">—</span>}
                  </td>
                </tr>
              ))}
              {!isLoading && !(summary?.records?.length) && (
                <tr><td colSpan={7} className="text-center py-8 text-slate-400 text-sm">No attendance records for this month</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AttendancePage() {
  const isHR = useIsHR()
  const { user } = useAuthStore()
  const isTeamLead = (user?.role as string) === 'TEAM_LEAD'
  const [tab, setTab] = useState('mine')

  const tabs = isHR
    ? [
        { key: 'mine',     label: 'Daily Attendance' },
        { key: 'report',   label: 'Team Report' },
        { key: 'employee', label: 'Employee Report' },
      ]
    : isTeamLead
    ? [
        { key: 'mine', label: 'My Attendance' },
        { key: 'team', label: 'Team Approval' },
      ]
    : [{ key: 'mine', label: 'My Attendance' }]

  return (
    <div>
      <Header
        title="Attendance"
        subtitle={isHR ? 'Daily attendance overview and reports' : 'Track attendance and manage approvals'}
      />
      <div className="p-6 space-y-5">
        {tabs.length > 1 && (
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === t.key ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}>{t.label}</button>
            ))}
          </div>
        )}

        {/* HR: Daily Attendance tab = all employees for selected date */}
        {tab === 'mine'     && isHR        && <HRDailyView />}

        {/* Non-HR: My Attendance = self view */}
        {tab === 'mine'     && !isHR       && <MyAttendanceSelfView />}

        {tab === 'report'   && isHR        && <HRReportPanel />}
        {tab === 'employee' && isHR        && <EmployeeReportPanel />}
      </div>
    </div>
  )
}
