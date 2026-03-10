import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Clock, Calendar } from 'lucide-react'
import { attendanceApi } from '../../services/api'
import { useAuthStore } from '../../store/auth'
import Header from '../../components/layout/Header'
import { Badge, Table, PageLoader, EmptyState } from '../../components/ui'
import { formatDate, formatTime } from '../../utils/helpers'
import toast from 'react-hot-toast'

export default function AttendancePage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  const { data: summary, isLoading } = useQuery({
    queryKey: ['attendance-summary', month, year],
    queryFn: () => attendanceApi.summary({ month, year }).then(r => r.data),
  })

  const { data: todayAtt } = useQuery({
    queryKey: ['attendance-today'],
    queryFn: () => attendanceApi.today().then(r => r.data),
  })

  const checkInMut = useMutation({
    mutationFn: () => attendanceApi.checkIn(),
    onSuccess: () => { toast.success('Checked in!'); qc.invalidateQueries({ queryKey: ['attendance-today'] }); qc.invalidateQueries({ queryKey: ['attendance-summary'] }) },
  })
  const checkOutMut = useMutation({
    mutationFn: () => attendanceApi.checkOut(),
    onSuccess: () => { toast.success('Checked out! Have a great day!'); qc.invalidateQueries({ queryKey: ['attendance-today'] }); qc.invalidateQueries({ queryKey: ['attendance-summary'] }) },
  })

  const statusColors: any = {
    PRESENT: 'bg-emerald-100 text-emerald-700',
    ABSENT: 'bg-red-100 text-red-700',
    LATE: 'bg-amber-100 text-amber-700',
    HALF_DAY: 'bg-blue-100 text-blue-700',
    ON_LEAVE: 'bg-violet-100 text-violet-700',
    WEEKEND: 'bg-slate-100 text-slate-400',
    HOLIDAY: 'bg-pink-100 text-pink-700',
  }

  return (
    <div>
      <Header title="Attendance" subtitle="Track your work hours" />
      <div className="p-6 space-y-5">

        {/* Check in/out card */}
        <div className="card p-5 flex items-center gap-6">
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-700">Today — {formatDate(new Date())}</p>
            <div className="flex gap-6 mt-2">
              <div>
                <p className="text-xs text-slate-400">Check In</p>
                <p className="text-sm font-bold text-slate-800">
                  {todayAtt?.record?.checkIn ? formatTime(todayAtt.record.checkIn) : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Check Out</p>
                <p className="text-sm font-bold text-slate-800">
                  {todayAtt?.record?.checkOut ? formatTime(todayAtt.record.checkOut) : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Hours</p>
                <p className="text-sm font-bold text-slate-800">
                  {todayAtt?.record?.workHours ? `${todayAtt.record.workHours}h` : '—'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {!todayAtt?.checkedIn && (
              <button className="btn-primary" onClick={() => checkInMut.mutate()} disabled={checkInMut.isPending}>
                <Clock className="w-4 h-4" /> Check In
              </button>
            )}
            {todayAtt?.checkedIn && !todayAtt?.checkedOut && (
              <button className="btn-secondary" onClick={() => checkOutMut.mutate()} disabled={checkOutMut.isPending}>
                <Clock className="w-4 h-4" /> Check Out
              </button>
            )}
          </div>
        </div>

        {/* Month summary stats */}
        {summary && (
          <div className="grid grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              { label: 'Present', value: summary.present, color: 'text-emerald-600' },
              { label: 'Absent', value: summary.absent, color: 'text-red-500' },
              { label: 'Late', value: summary.late, color: 'text-amber-500' },
              { label: 'Half Day', value: summary.halfDay, color: 'text-blue-500' },
              { label: 'On Leave', value: summary.onLeave, color: 'text-violet-500' },
              { label: 'Total Hours', value: `${summary.totalWorkHours?.toFixed(1)}h`, color: 'text-slate-700' },
            ].map(s => (
              <div key={s.label} className="card p-3 text-center">
                <p className="text-xs text-slate-400">{s.label}</p>
                <p className={`text-xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Month selector */}
        <div className="flex items-center gap-2">
          <select className="input max-w-xs" value={month} onChange={e => setMonth(+e.target.value)}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i+1} value={i+1}>{new Date(2024, i).toLocaleString('default', { month: 'long' })}</option>
            ))}
          </select>
          <select className="input w-24" value={year} onChange={e => setYear(+e.target.value)}>
            {[2023,2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Records table */}
        <div className="card">
          <Table headers={['Date', 'Check In', 'Check Out', 'Hours', 'Status', 'Late']} loading={isLoading}>
            {summary?.records?.map((r: any) => (
              <tr key={r.id} className="hover:bg-slate-50/50">
                <td className="table-td font-medium">{formatDate(r.date)}</td>
                <td className="table-td text-slate-500">{r.checkIn ? formatTime(r.checkIn) : '—'}</td>
                <td className="table-td text-slate-500">{r.checkOut ? formatTime(r.checkOut) : '—'}</td>
                <td className="table-td font-semibold">{r.workHours ? `${r.workHours}h` : '—'}</td>
                <td className="table-td"><Badge label={r.status} color={statusColors[r.status] || ''} /></td>
                <td className="table-td">{r.isLate ? <span className="text-amber-600 text-xs font-medium">{r.lateMinutes}m late</span> : '—'}</td>
              </tr>
            ))}
            {!isLoading && !summary?.records?.length && (
              <tr><td colSpan={6}><EmptyState icon={Calendar} title="No records" description="No attendance records for this month" /></td></tr>
            )}
          </Table>
        </div>
      </div>
    </div>
  )
}
