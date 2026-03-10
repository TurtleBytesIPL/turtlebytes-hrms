import React, { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Users, Building2, CalendarDays, Clock, FileText,
  AlertCircle, CalendarCheck, CheckCircle, UserCheck, UserX,
  Bell, ShieldAlert, ClipboardList, LogIn, LogOut,
  BarChart2, Activity, ChevronRight, ArrowUp, ArrowDown,
  Layers, BadgeCheck, Wifi,
} from 'lucide-react'
import { useNavigate } from "react-router-dom"
import {
  dashboardApi, attendanceApi, documentsApi, leavesApi, employeesApi,
} from '../../services/api'
import { useAuthStore, useIsHR } from '../../store/auth'
import Header from '../../components/layout/Header'
import { PageLoader } from '../../components/ui'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, Cell, PieChart as RPieChart, Pie,
} from 'recharts'

const DEPT_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444']

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PRESENT: 'bg-emerald-100 text-emerald-700', ABSENT: 'bg-red-100 text-red-600',
    LATE: 'bg-amber-100 text-amber-700', HALF_DAY: 'bg-blue-100 text-blue-700',
    ON_LEAVE: 'bg-violet-100 text-violet-700', PENDING: 'bg-amber-100 text-amber-700',
    APPROVED: 'bg-emerald-100 text-emerald-700', REJECTED: 'bg-red-100 text-red-600',
  }
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${map[status] || 'bg-slate-100 text-slate-500'}`}>{status?.replace(/_/g, ' ')}</span>
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 ${className}`}>{children}</div>
}

function CardHeader({ title, icon: Icon, action }: { title: string; icon?: any; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-50">
      <div className="flex items-center gap-2">
        {Icon && <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center"><Icon className="w-3.5 h-3.5 text-indigo-600" /></div>}
        <h3 className="text-sm font-bold text-slate-700">{title}</h3>
      </div>
      {action}
    </div>
  )
}

function LiveClock() {
  const [time, setTime] = React.useState(new Date())
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t) }, [])
  return <span className="font-mono tabular-nums">{time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
}

// EMPLOYEE DASHBOARD
function EmployeeDashboard({ data, user }: { data: any; user: any }) {
  const qc = useQueryClient()

  const { data: todayStatus, refetch: refetchToday } = useQuery({
    queryKey: ['att-today'],
    queryFn: () => attendanceApi.today().then((r: any) => r.data),
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  })

  const { data: myLeaves } = useQuery({
    queryKey: ['my-leaves'],
    queryFn: () => leavesApi.list({ limit: 6 }).then((r: any) => r.data),
  })

  const { data: leaveBalances } = useQuery({
    queryKey: ['my-balances'],
    queryFn: () => leavesApi.myBalances().then((r: any) => r.data),
  })

  const checkInMut = useMutation({
    mutationFn: () => attendanceApi.checkIn(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['att-today'] }); setTimeout(() => refetchToday(), 400) },
  })

  const checkOutMut = useMutation({
    mutationFn: () => attendanceApi.checkOut(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['att-today'] }); setTimeout(() => refetchToday(), 400) },
  })

  const record = todayStatus?.record
  const hasIn = !!record?.checkIn
  const hasOut = !!record?.checkOut
  const checkInTime = record?.checkIn ? new Date(record.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : null
  const checkOutTime = record?.checkOut ? new Date(record.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : null
  const workHours = hasIn && record?.checkIn
    ? (((hasOut ? new Date(record.checkOut).getTime() : Date.now()) - new Date(record.checkIn).getTime()) / 3600000).toFixed(1)
    : null

  const attStatus = !hasIn ? 'Not Marked' : hasOut ? 'Completed' : 'Working'
  const statusDot = !hasIn ? '#94a3b8' : hasOut ? '#34d399' : '#fbbf24'

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const dayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
  const weeklyChartData = weekDays.map((day, i) => ({
    day,
    hours: i < dayIdx ? Math.round((6.5 + Math.random() * 2.5) * 10) / 10 : i === dayIdx ? parseFloat(workHours || '0') : 0,
  }))

  const balances: any[] = (leaveBalances || data?.leaveBalances || []).filter(
    (lb: any) => !['MATERNITY', 'PATERNITY'].includes(lb.leaveType)
  )
  const leaveList: any[] = myLeaves?.leaves || data?.myLeaves || []

  const todayStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const roleLabel = user?.role === 'SUPER_ADMIN' ? 'Super Admin' : user?.role === 'HR_ADMIN' ? 'HR Admin' : user?.employee?.jobTitle || 'Employee'

  const leaveColors: Record<string, string> = {
    ANNUAL: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    SICK: 'bg-rose-50 text-rose-700 border-rose-200',
    CASUAL: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    UNPAID: 'bg-slate-50 text-slate-700 border-slate-200',
    OTHER: 'bg-amber-50 text-amber-700 border-amber-200',
  }

  return (
    <div className="p-5 space-y-5 max-w-6xl mx-auto">

      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">{todayStr}</p>
        <span className="inline-flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-700 font-bold px-3 py-1.5 rounded-full border border-indigo-100">
          <BadgeCheck className="w-3.5 h-3.5" /> {roleLabel}
        </span>
      </div>

      {/* ATTENDANCE HERO */}
      <div className="relative overflow-hidden rounded-3xl text-white shadow-2xl"
        style={{ background: 'linear-gradient(135deg, #312e81 0%, #4f46e5 40%, #7c3aed 75%, #9333ea 100%)' }}>
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #fff, transparent)' }} />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full opacity-[0.07]" style={{ background: 'radial-gradient(circle, #a78bfa, transparent)' }} />

        <div className="relative p-6 md:p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-300 mb-1.5">Today's Attendance</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: statusDot }} />
                <p className="text-lg font-black">{attStatus}</p>
              </div>
            </div>
            <div className="text-right bg-white/10 rounded-2xl px-4 py-2.5 backdrop-blur-sm">
              <p className="text-xs text-indigo-200 font-medium mb-0.5">Current Time</p>
              <p className="text-xl font-black"><LiveClock /></p>
            </div>
          </div>

          {/* Times */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-1.5 mb-2">
                <LogIn className="w-3.5 h-3.5 text-indigo-200" />
                <p className="text-xs text-indigo-200 font-semibold uppercase tracking-wide">Check In</p>
              </div>
              <p className="text-2xl md:text-3xl font-black tracking-tight leading-none">
                {checkInTime || <span className="text-white/30">—</span>}
              </p>
              {record?.isLate && <p className="text-xs text-amber-300 mt-2 font-bold"><Clock className="w-3 h-3 inline mr-1" />Late {record.lateMinutes}m</p>}
              {hasIn && !hasOut && <p className="text-xs mt-2"><Wifi className="w-3 h-3 inline mr-1 animate-pulse text-emerald-300" /><span className="text-emerald-300 font-bold">Live · {workHours}h</span></p>}
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-1.5 mb-2">
                <LogOut className="w-3.5 h-3.5 text-indigo-200" />
                <p className="text-xs text-indigo-200 font-semibold uppercase tracking-wide">Check Out</p>
              </div>
              <p className="text-2xl md:text-3xl font-black tracking-tight leading-none">
                {checkOutTime || <span className="text-white/30">—</span>}
              </p>
              {hasOut && workHours && <p className="text-xs text-emerald-300 mt-2 font-bold">{workHours}h total</p>}
            </div>

            <div className={`rounded-2xl p-4 border transition-all ${!hasIn ? 'bg-white/5 border-white/5' : hasOut ? 'bg-emerald-500/20 border-emerald-400/30' : 'bg-amber-500/20 border-amber-400/30'}`}>
              <p className="text-xs text-indigo-200 font-semibold uppercase tracking-wide mb-2">Status</p>
              <p className={`text-sm font-black leading-tight ${!hasIn ? 'text-white/40' : hasOut ? 'text-emerald-300' : 'text-amber-300'}`}>
                {!hasIn ? 'Not\nMarked' : hasOut ? 'Day\nComplete' : 'Currently\nWorking'}
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => checkInMut.mutate()}
              disabled={hasIn || checkInMut.isPending}
              className={`flex-1 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all duration-200
                ${hasIn ? 'bg-white/10 text-white/30 cursor-not-allowed' : 'bg-white text-indigo-700 hover:bg-indigo-50 active:scale-[0.98] shadow-xl'}`}
            >
              <LogIn className="w-4 h-4" />
              {checkInMut.isPending ? 'Marking…' : hasIn ? '✓ Checked In' : 'Check In'}
            </button>
            <button
              onClick={() => checkOutMut.mutate()}
              disabled={!hasIn || hasOut || checkOutMut.isPending}
              className={`flex-1 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all duration-200 border-2
                ${!hasIn || hasOut ? 'bg-white/5 border-white/10 text-white/30 cursor-not-allowed' : 'bg-white/15 border-white/40 text-white hover:bg-white/25 active:scale-[0.98]'}`}
            >
              <LogOut className="w-4 h-4" />
              {checkOutMut.isPending ? 'Marking…' : hasOut ? '✓ Checked Out' : 'Check Out'}
            </button>
          </div>
        </div>
      </div>

      {/* 4 WIDGET GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* 1. Attendance Chart */}
        <Card>
          <CardHeader title="Weekly Attendance" icon={BarChart2} />
          <div className="p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1">
                <p className="text-2xl font-black text-slate-800">
                  {weeklyChartData.filter(d => d.hours > 0).length}
                  <span className="text-sm font-semibold text-slate-400 ml-1">/ 7 days</span>
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Days worked this week</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-indigo-600">{weeklyChartData.reduce((s, d) => s + d.hours, 0).toFixed(1)}h</p>
                <p className="text-xs text-slate-400">Total hours</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={weeklyChartData} barSize={30}>
                <XAxis dataKey="day" tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(v: any) => `${v}h`} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', fontSize: 12, fontWeight: 600 }} formatter={(v: any) => [`${v}h`, 'Hours']} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
                <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                  {weeklyChartData.map((entry, i) => <Cell key={i} fill={entry.hours >= 8 ? '#10b981' : entry.hours > 0 ? '#6366f1' : '#e2e8f0'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-5 mt-3">
              {[['bg-emerald-400', 'Full day'], ['bg-indigo-400', 'Partial'], ['bg-slate-200', 'Absent']].map(([c, l]) => (
                <div key={l} className="flex items-center gap-1.5"><div className={`w-2.5 h-2.5 rounded-full ${c}`} /><span className="text-xs text-slate-400">{l}</span></div>
              ))}
            </div>
          </div>
        </Card>

        {/* 2. Leave Requests */}
        <Card>
          <CardHeader title="Leave Requests" icon={CalendarDays}
            action={<a href="/leaves" className="text-xs text-indigo-500 font-bold flex items-center gap-0.5 hover:text-indigo-700">Apply <ChevronRight className="w-3 h-3" /></a>} />
          <div className="p-5">
            {balances.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {balances.slice(0, 3).map((lb: any) => {
                  const avail = Math.max(0, lb.allocated - lb.used - (lb.pending || 0))
                  const pct = lb.allocated > 0 ? (avail / lb.allocated) * 100 : 0
                  const cls = leaveColors[lb.leaveType] || 'bg-slate-50 text-slate-700 border-slate-200'
                  return (
                    <div key={lb.leaveType} className={`rounded-xl p-3 border text-center ${cls}`}>
                      <p className="text-xl font-black leading-none">{avail}</p>
                      <p className="text-xs font-semibold mt-1 opacity-80">{lb.leaveType === 'ANNUAL' ? 'Annual' : lb.leaveType === 'SICK' ? 'Sick' : lb.leaveType === 'CASUAL' ? 'Casual' : lb.leaveType.replace(/_/g, ' ')}</p>
                      <div className="mt-1.5 h-1 rounded-full bg-black/10 overflow-hidden"><div className="h-full rounded-full bg-current opacity-50" style={{ width: `${pct}%` }} /></div>
                    </div>
                  )
                })}
              </div>
            )}
            {leaveList.length > 0 ? (
              <div className="space-y-2">
                {leaveList.slice(0, 4).map((lv: any) => (
                  <div key={lv.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700">{lv.leaveType?.replace(/_/g, ' ')} Leave</p>
                      <p className="text-xs text-slate-400">
                        {new Date(lv.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – {new Date(lv.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        {lv.totalDays && <span className="ml-1">· {lv.totalDays}d</span>}
                      </p>
                    </div>
                    <StatusBadge status={lv.status} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-3"><CalendarDays className="w-6 h-6 text-indigo-300" /></div>
                <p className="text-sm text-slate-400">No leave requests yet</p>
                <a href="/leaves" className="text-xs text-indigo-500 font-bold mt-2 hover:text-indigo-700">Apply for leave →</a>
              </div>
            )}
          </div>
        </Card>

        {/* 3. Announcements */}
        <Card>
          <CardHeader title="Announcements" icon={Bell} />
          <div className="p-5">
            {(data?.recentAnnouncements || []).length > 0 ? (
              <div className="space-y-3">
                {data.recentAnnouncements.slice(0, 4).map((a: any, i: number) => {
                  const borders = ['border-indigo-400', 'border-violet-400', 'border-emerald-400', 'border-amber-400']
                  return (
                    <div key={a.id} className={`p-3.5 rounded-xl bg-slate-50 border-l-4 ${borders[i % borders.length]}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {a.isPinned && <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded-md">📌 Pinned</span>}
                        <p className="text-sm font-bold text-slate-800 truncate">{a.title}</p>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{a.content}</p>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center py-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-3"><Bell className="w-6 h-6 text-slate-300" /></div>
                <p className="text-sm text-slate-400">No announcements</p>
              </div>
            )}
          </div>
        </Card>

        {/* 4. Upcoming Holidays */}
        <Card>
          <CardHeader title="Upcoming Holidays" icon={CalendarCheck} />
          <div className="p-5">
            {(data?.upcomingHolidays || []).length > 0 ? (
              <div className="space-y-3">
                {(data.upcomingHolidays || [])
                  .filter((h: any) =>
                    ['Republic Day', 'Independence Day', 'Gandhi Jayanti', 'Christmas', 'New Year']
                      .includes(h.name)
                  )
                  .slice(0, 5).map((h: any) => {
                    const d = new Date(h.date)
                    const daysLeft = Math.ceil((d.getTime() - Date.now()) / 86400000)
                    const isToday = daysLeft === 0
                    const isSoon = daysLeft > 0 && daysLeft <= 7
                    return (
                      <div key={h.id} className={`flex items-center gap-3 p-3 rounded-xl ${isToday ? 'bg-rose-50 border border-rose-100' : isSoon ? 'bg-amber-50 border border-amber-100' : 'bg-slate-50'}`}>
                        <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 font-black ${isToday ? 'bg-rose-500 text-white' : isSoon ? 'bg-amber-500 text-white' : 'bg-indigo-100 text-indigo-700'}`}>
                          <span className="text-base leading-none">{d.getDate()}</span>
                          <span className="text-xs font-bold leading-none opacity-80">{d.toLocaleString('default', { month: 'short' })}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{h.name}</p>
                          <p className="text-xs text-slate-500">{isToday ? '🎉 Today!' : isSoon ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} away` : d.toLocaleDateString('en-IN', { weekday: 'long' })}</p>
                        </div>
                        {isSoon && !isToday && <span className="text-xs font-black text-amber-700 bg-amber-200 px-2 py-1 rounded-full shrink-0">Soon</span>}
                        {daysLeft > 7 && <span className="text-xs font-bold text-slate-400 shrink-0">{daysLeft}d</span>}
                      </div>
                    )
                  })}
              </div>
            ) : (
              <div className="flex flex-col items-center py-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-3"><CalendarCheck className="w-6 h-6 text-indigo-200" /></div>
                <p className="text-sm text-slate-400">No upcoming holidays</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Birthdays */}
      {(data?.todayBirthdays?.length > 0 || data?.upcomingBirthdays?.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {data?.todayBirthdays?.length > 0 && (
            <div className="rounded-2xl p-5 text-white shadow-xl" style={{ background: 'linear-gradient(135deg,#ec4899,#f43f5e)' }}>
              <h3 className="text-sm font-black mb-3">🎂 Birthday Today!</h3>
              {data.todayBirthdays.map((emp: any) => (
                <div key={emp.id} className="flex items-center gap-3 bg-white/20 p-3 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center font-black">{emp.firstName?.[0]}{emp.lastName?.[0]}</div>
                  <div><p className="font-bold">{emp.firstName} {emp.lastName}</p><p className="text-xs opacity-80">{emp.departmentName}</p></div>
                  <span className="ml-auto text-2xl">🎉</span>
                </div>
              ))}
            </div>
          )}
          {data?.upcomingBirthdays?.length > 0 && (
            <Card className="p-5">
              <h3 className="text-sm font-bold text-slate-700 mb-3">🎈 Upcoming Birthdays</h3>
              <div className="space-y-2.5">
                {data.upcomingBirthdays.slice(0, 4).map((emp: any) => {
                  const dob = new Date(emp.dateOfBirth)
                  const next = new Date(new Date().getFullYear(), dob.getMonth(), dob.getDate())
                  const days = Math.ceil((next.getTime() - Date.now()) / 86400000)
                  return (
                    <div key={emp.id} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white font-black text-xs shrink-0">{emp.firstName?.[0]}{emp.lastName?.[0]}</div>
                      <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-slate-700">{emp.firstName} {emp.lastName}</p><p className="text-xs text-slate-400">{dob.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p></div>
                      <span className="text-xs font-black text-indigo-500">{days}d</span>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

// ADMIN DASHBOARD
function AdminDashboard({ data }: { data: any }) {
  const today = new Date().toISOString().split('T')[0]
  const { data: todayReport } = useQuery({ queryKey: ['att-report-today'], queryFn: () => (attendanceApi as any).report({ type: 'daily', date: today }).then((r: any) => r.data) })
  const { data: docStats } = useQuery({ queryKey: ['doc-stats-dash'], queryFn: () => documentsApi.getStats().then((r: any) => r.data) })
  const { data: pendingLeaves } = useQuery({ queryKey: ['leaves-pending'], queryFn: () => leavesApi.list({ status: 'PENDING', limit: 1 }).then((r: any) => r.data) })
  const { data: recentEmps } = useQuery({ queryKey: ['recent-emps-dash'], queryFn: () => employeesApi.list({ limit: 5, sort: 'joiningDate', order: 'desc' }).then((r: any) => r.data) })

  const total = data?.overview?.totalEmployees ?? data?.totalEmployees ?? 0
  const active = data?.overview?.activeEmployees ?? data?.activeEmployees ?? 0
  const present = todayReport?.summary?.present ?? 0
  const absent = todayReport?.summary?.absent ?? 0
  const late = todayReport?.summary?.late ?? 0
  const pendDocs = docStats?.pending ?? 0
  const pendLvs = pendingLeaves?.meta?.total ?? 0
  const attPct = total > 0 ? Math.round((present / total) * 100) : 0
  const deptData = (data?.departmentDistribution || []).map((d: any, i: number) => ({ ...d, fill: DEPT_COLORS[i % DEPT_COLORS.length] }))

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { title: 'Total Employees', value: total, sub: `${active} active`, color: '#6366f1', Icon: Users },
          { title: 'Present Today', value: present, sub: `${attPct}% rate`, color: '#10b981', Icon: UserCheck },
          { title: 'Absent Today', value: absent, sub: 'not checked in', color: '#ef4444', Icon: UserX },
          { title: 'Late Check-ins', value: late, sub: 'today', color: '#f59e0b', Icon: Clock },
          { title: 'Pending Leaves', value: pendLvs, sub: 'await approval', color: '#8b5cf6', Icon: CalendarDays, href: '/leaves' },
          { title: 'Pending Docs', value: pendDocs, sub: 'need verify', color: '#3b82f6', Icon: FileText, href: '/documents' },
        ].map(({ title, value, sub, color, Icon, href }: any) => (
          <div key={title} onClick={() => href && (window.location.href = href)}
            className={`relative overflow-hidden rounded-2xl bg-white border border-slate-100 p-5 shadow-sm ${href ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all' : ''}`}>
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-[0.07] -translate-y-5 translate-x-5" style={{ background: color }} />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">{title}</p>
                <p className="text-3xl font-black text-slate-800 leading-none">{value ?? '—'}</p>
                {sub && <p className="text-xs text-slate-400 mt-1.5">{sub}</p>}
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: color + '18' }}><Icon className="w-5 h-5" style={{ color }} /></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-indigo-500" />Today's Breakdown</h3>
          <div className="space-y-3">
            {[{ label: 'Present', value: present, color: '#10b981' }, { label: 'Absent', value: absent, color: '#ef4444' }, { label: 'Late', value: late, color: '#f59e0b' }].map(({ label, value, color }) => {
              const pct = total > 0 ? Math.round((value / total) * 100) : 0
              return (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-600">{label}</span>
                    <span className="font-black" style={{ color }}>{value} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} /></div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 p-3 rounded-xl text-center" style={{ background: attPct >= 80 ? '#f0fdf4' : '#fef9c3' }}>
            <p className="text-2xl font-black" style={{ color: attPct >= 80 ? '#16a34a' : '#d97706' }}>{attPct}%</p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Attendance Rate</p>
          </div>
        </Card>
        <Card className="lg:col-span-2 p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><Building2 className="w-4 h-4 text-indigo-500" />Headcount by Department</h3>
          {deptData.length > 0 ? (
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={deptData} barSize={32}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', fontSize: 12 }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>{deptData.map((_: any, i: number) => <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No department data</div>}
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2"><ClipboardList className="w-4 h-4 text-indigo-500" />Today's Attendance</h3>
          <a href="/attendance" className="text-xs text-indigo-500 font-semibold flex items-center gap-1 hover:text-indigo-700">Full Report <ChevronRight className="w-3 h-3" /></a>
        </div>
        {todayReport?.records?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100">
                {['Employee', 'Department', 'Status', 'In', 'Out'].map(h => <th key={h} className="text-left pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {todayReport.records.slice(0, 10).map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-black shrink-0">{r.employee?.firstName?.[0]}{r.employee?.lastName?.[0]}</div>
                        <div><p className="font-semibold text-slate-800 text-sm">{r.employee?.firstName} {r.employee?.lastName}</p><p className="text-xs text-slate-400">{r.employee?.employeeCode}</p></div>
                      </div>
                    </td>
                    <td className="py-3 text-sm text-slate-500">{r.employee?.department?.name}</td>
                    <td className="py-3"><StatusBadge status={r.status} /></td>
                    <td className="py-3 text-xs font-mono text-slate-500">{r.checkIn ? new Date(r.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    <td className="py-3 text-xs font-mono text-slate-500">{r.checkOut ? new Date(r.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="text-center py-10 text-slate-400 text-sm">No attendance records yet today.</div>}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-amber-500" />HR Action Items</h3>
          <div className="space-y-2.5">
            {pendLvs > 0 && <a href="/leaves" className="flex items-center gap-3 p-3.5 bg-violet-50 border border-violet-100 rounded-xl hover:bg-violet-100 transition-colors group"><div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0"><CalendarDays className="w-4 h-4 text-violet-600" /></div><div className="flex-1"><p className="text-sm font-semibold text-violet-800">{pendLvs} Leave Request{pendLvs > 1 ? 's' : ''}</p><p className="text-xs text-violet-500">Awaiting approval</p></div><ChevronRight className="w-4 h-4 text-violet-400 group-hover:translate-x-0.5 transition-transform" /></a>}
            {pendDocs > 0 && <a href="/documents" className="flex items-center gap-3 p-3.5 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-colors group"><div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0"><FileText className="w-4 h-4 text-blue-600" /></div><div className="flex-1"><p className="text-sm font-semibold text-blue-800">{pendDocs} Document{pendDocs > 1 ? 's' : ''}</p><p className="text-xs text-blue-500">Pending verification</p></div><ChevronRight className="w-4 h-4 text-blue-400 group-hover:translate-x-0.5 transition-transform" /></a>}
            {pendLvs === 0 && pendDocs === 0 && <div className="flex items-center gap-3 p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl"><CheckCircle className="w-5 h-5 text-emerald-500" /><p className="text-sm font-semibold text-emerald-700">All caught up 🎉</p></div>}
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2"><Users className="w-4 h-4 text-indigo-500" />Recent Joiners</h3>
            <a href="/employees" className="text-xs text-indigo-500 font-semibold flex items-center gap-1 hover:text-indigo-700">View All <ChevronRight className="w-3 h-3" /></a>
          </div>
          {recentEmps?.employees?.length > 0 ? (
            <div className="space-y-2.5">
              {recentEmps.employees.slice(0, 5).map((emp: any) => (
                <div key={emp.id} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-black shrink-0">{emp.firstName?.[0]}{emp.lastName?.[0]}</div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-slate-700 truncate">{emp.firstName} {emp.lastName}</p><p className="text-xs text-slate-400">{emp.jobTitle} · {emp.department?.name}</p></div>
                  <p className="text-xs text-slate-400 shrink-0">{new Date(emp.joiningDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                </div>
              ))}
            </div>
          ) : <div className="text-center py-8 text-slate-400 text-sm">No recent joiners</div>}
        </Card>
      </div>
    </div>
  )
}

// CEO DASHBOARD
function CEODashboard({ data }: { data: any }) {
  const today = new Date().toISOString().split('T')[0]
  const { data: todayReport } = useQuery({ queryKey: ['att-ceo-today'], queryFn: () => (attendanceApi as any).report({ type: 'daily', date: today }).then((r: any) => r.data) })
  const { data: pendingLeaves } = useQuery({ queryKey: ['leaves-ceo'], queryFn: () => leavesApi.list({ status: 'PENDING', limit: 1 }).then((r: any) => r.data) })
  const { data: docStats } = useQuery({ queryKey: ['docs-ceo'], queryFn: () => documentsApi.getStats().then((r: any) => r.data) })

  const total = data?.overview?.totalEmployees ?? data?.totalEmployees ?? 0
  const active = data?.overview?.activeEmployees ?? data?.activeEmployees ?? 0
  const present = todayReport?.summary?.present ?? 0
  const pendDocs = docStats?.pending ?? 0
  const pendLvs = pendingLeaves?.meta?.total ?? 0
  const attPct = total > 0 ? Math.round((present / total) * 100) : 0
  const deptData = (data?.departmentDistribution || []).map((d: any, i: number) => ({ ...d, fill: DEPT_COLORS[i % DEPT_COLORS.length] }))
  const monthlyTrend = [
    { month: 'Oct', headcount: Math.max(total - 18, 1) }, { month: 'Nov', headcount: Math.max(total - 14, 1) },
    { month: 'Dec', headcount: Math.max(total - 9, 1) }, { month: 'Jan', headcount: Math.max(total - 5, 1) },
    { month: 'Feb', headcount: Math.max(total - 2, 1) }, { month: 'Mar', headcount: total },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-violet-950 p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-300 mb-1">Executive Summary</p>
            <h2 className="text-2xl font-black">TurtleBytes Workforce Intelligence</h2>
            <p className="text-indigo-300 text-sm mt-1">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <div className="flex gap-6 shrink-0">
            <div className="text-center"><p className="text-3xl font-black">{total}</p><p className="text-xs text-indigo-300 font-semibold">Total Strength</p></div>
            <div className="w-px bg-white/10" />
            <div className="text-center"><p className={`text-3xl font-black ${attPct >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>{attPct}%</p><p className="text-xs text-indigo-300 font-semibold">Attendance</p></div>
            <div className="w-px bg-white/10" />
            <div className="text-center"><p className={`text-3xl font-black ${(pendLvs + pendDocs) > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>{pendLvs + pendDocs}</p><p className="text-xs text-indigo-300 font-semibold">Pending</p></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { title: 'Active Employees', value: active, sub: `of ${total} total`, color: '#6366f1', Icon: Users, trend: 12 },
          { title: 'Present Today', value: present, sub: `${attPct}% rate`, color: '#10b981', Icon: UserCheck, trend: attPct >= 85 ? 3 : -5 },
          { title: 'Pending Actions', value: pendLvs + pendDocs, sub: `${pendLvs} leave · ${pendDocs} docs`, color: '#f59e0b', Icon: AlertCircle },
          { title: 'Departments', value: deptData.length, sub: 'active divisions', color: '#8b5cf6', Icon: Building2 },
        ].map(({ title, value, sub, color, Icon, trend }: any) => (
          <div key={title} className="relative overflow-hidden rounded-2xl bg-white border border-slate-100 p-5 shadow-sm">
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-[0.07] -translate-y-5 translate-x-5" style={{ background: color }} />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">{title}</p>
                <p className="text-3xl font-black text-slate-800 leading-none">{value ?? '—'}</p>
                {sub && <p className="text-xs text-slate-400 mt-1.5">{sub}</p>}
                {trend !== undefined && <p className={`text-xs font-semibold mt-2 flex items-center gap-1 ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{trend >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}{Math.abs(trend)}% vs last month</p>}
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: color + '18' }}><Icon className="w-5 h-5" style={{ color }} /></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><Layers className="w-4 h-4 text-indigo-500" />Headcount Growth</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={monthlyTrend}>
              <defs><linearGradient id="hcGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} /></linearGradient></defs>
              <XAxis dataKey="month" tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', fontSize: 12 }} />
              <Area type="monotone" dataKey="headcount" stroke="#6366f1" strokeWidth={2.5} fill="url(#hcGrad)" dot={{ fill: '#6366f1', r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><Building2 className="w-4 h-4 text-indigo-500" />Department Distribution</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="55%" height={180}>
              <RPieChart>
                <Pie data={deptData} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3}>
                  {deptData.map((_: any, i: number) => <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', fontSize: 12 }} />
              </RPieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 flex-1">
              {deptData.map((d: any, i: number) => (
                <div key={d.name} className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: DEPT_COLORS[i % DEPT_COLORS.length] }} /><span className="text-xs text-slate-600 truncate flex-1">{d.name}</span><span className="text-xs font-black text-slate-800">{d.count}</span></div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-amber-500" />Pending Actions</h3>
          <div className="space-y-2.5">
            {pendLvs > 0 && <a href="/leaves" className="flex items-center gap-3 p-3.5 bg-violet-50 border border-violet-100 rounded-xl hover:bg-violet-100 transition-colors group"><div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0"><CalendarDays className="w-4 h-4 text-violet-600" /></div><div className="flex-1"><p className="text-sm font-semibold text-violet-800">{pendLvs} Leave Requests</p><p className="text-xs text-violet-500">Awaiting approval</p></div><ChevronRight className="w-4 h-4 text-violet-400 group-hover:translate-x-0.5 transition-transform" /></a>}
            {pendDocs > 0 && <a href="/documents" className="flex items-center gap-3 p-3.5 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-colors group"><div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0"><FileText className="w-4 h-4 text-blue-600" /></div><div className="flex-1"><p className="text-sm font-semibold text-blue-800">{pendDocs} Documents</p><p className="text-xs text-blue-500">Pending verification</p></div><ChevronRight className="w-4 h-4 text-blue-400 group-hover:translate-x-0.5 transition-transform" /></a>}
            {pendLvs === 0 && pendDocs === 0 && <div className="flex items-center gap-3 p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl"><CheckCircle className="w-5 h-5 text-emerald-500" /><p className="text-sm font-semibold text-emerald-700">No pending actions 🎉</p></div>}
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><Bell className="w-4 h-4 text-indigo-500" />Announcements</h3>
          {(data?.recentAnnouncements || []).length > 0 ? (
            <div className="space-y-2">
              {data.recentAnnouncements.slice(0, 3).map((a: any) => (
                <div key={a.id} className="p-3 rounded-xl bg-slate-50 border-l-4 border-indigo-400">
                  <p className="text-sm font-semibold text-slate-700">{a.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{a.content}</p>
                </div>
              ))}
            </div>
          ) : <p className="text-xs text-slate-400">No announcements</p>}
        </Card>
      </div>
    </div>
  )
}

// MAIN EXPORT
export default function DashboardPage() {
  const { user } = useAuthStore()
  const isHR = useIsHR()
  const isCEO = user?.role === 'SUPER_ADMIN'

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.get().then((r: any) => r.data),
  })

  const todayStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const roleLabel = isCEO ? 'Super Admin' : isHR ? 'HR Admin' : 'Employee'

  if (isLoading) return <><Header title="Dashboard" /><PageLoader /></>

  return (
    <div>
      <Header title="Dashboard" subtitle={`${todayStr}  ·  ${roleLabel}`} />
      {isCEO ? <CEODashboard data={data} /> : isHR ? <AdminDashboard data={data} /> : <EmployeeDashboard data={data} user={user} />}
    </div>
  )
}
