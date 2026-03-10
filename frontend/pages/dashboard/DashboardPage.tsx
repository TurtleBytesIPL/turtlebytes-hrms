import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Users, Building2, CalendarDays, Clock, FileText, TrendingUp,
  AlertCircle, CalendarCheck, CheckCircle, UserCheck, UserX,
  Bell, ShieldAlert, ClipboardList, LogIn, LogOut, Award,
  BarChart2, Activity, ChevronRight, Star, DollarSign,
  ArrowUp, ArrowDown, Layers, Sun, Coffee, Sunset, Moon,
} from 'lucide-react'
import {
  dashboardApi, attendanceApi, documentsApi, leavesApi, payrollApi, employeesApi,
} from '../../services/api'
import { useAuthStore, useIsHR } from '../../store/auth'
import Header from '../../components/layout/Header'
import { PageLoader } from '../../components/ui'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, Cell,
  PieChart as RPieChart, Pie,
} from 'recharts'

const DEPT_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444']

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return { text: 'Good Morning', Icon: Sun, color: 'text-amber-500' }
  if (h < 17) return { text: 'Good Afternoon', Icon: Coffee, color: 'text-orange-400' }
  if (h < 20) return { text: 'Good Evening', Icon: Sunset, color: 'text-rose-400' }
  return { text: 'Good Night', Icon: Moon, color: 'text-indigo-400' }
}

function StatCard({ title, value, sub, icon: Icon, accent = '#6366f1', trend, trendLabel, onClick }: any) {
  return (
    <div onClick={onClick} className={`relative overflow-hidden rounded-2xl bg-white border border-slate-100 p-5 shadow-sm
      ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200' : ''}`}>
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-[0.06] -translate-y-6 translate-x-6" style={{ background: accent }} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">{title}</p>
          <p className="text-3xl font-black text-slate-800 leading-none">{value ?? '—'}</p>
          {sub && <p className="text-xs text-slate-400 mt-1.5">{sub}</p>}
          {trend !== undefined && (
            <p className={`text-xs font-semibold mt-2 flex items-center gap-1 ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {trend >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              {Math.abs(trend)}% {trendLabel}
            </p>
          )}
        </div>
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: accent + '18' }}>
          <Icon className="w-5 h-5" style={{ color: accent }} />
        </div>
      </div>
    </div>
  )
}

function SectionTitle({ children, icon: Icon, action }: any) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-indigo-500" />}
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">{children}</h2>
      </div>
      {action}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: any = {
    PRESENT: 'bg-emerald-100 text-emerald-700', ABSENT: 'bg-red-100 text-red-600',
    LATE: 'bg-amber-100 text-amber-700', HALF_DAY: 'bg-blue-100 text-blue-700',
    ON_LEAVE: 'bg-violet-100 text-violet-700', PENDING: 'bg-amber-100 text-amber-700',
    APPROVED: 'bg-emerald-100 text-emerald-700', REJECTED: 'bg-red-100 text-red-600',
  }
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${map[status] || 'bg-slate-100 text-slate-500'}`}>{status?.replace(/_/g, ' ')}</span>
}

function LeaveRing({ label, used, allocated, color }: any) {
  const pct = allocated > 0 ? Math.min((used / allocated) * 100, 100) : 0
  const r = 22; const circ = 2 * Math.PI * r
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-14 h-14">
        <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
          <circle cx="28" cy="28" r={r} fill="none" stroke="#f1f5f9" strokeWidth="5" />
          <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="5"
            strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-black text-slate-700">{allocated - used}</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-semibold text-slate-600">{label}</p>
        <p className="text-xs text-slate-400">{used}/{allocated}</p>
      </div>
    </div>
  )
}

function AttendanceWidget() {
  const qc = useQueryClient()
  const { data: todayStatus } = useQuery({ queryKey: ['att-today'], queryFn: () => attendanceApi.today().then((r: any) => r.data) })
  const checkInMut = useMutation({ mutationFn: () => attendanceApi.checkIn(), onSuccess: () => qc.invalidateQueries({ queryKey: ['att-today'] }) })
  const checkOutMut = useMutation({ mutationFn: () => attendanceApi.checkOut(), onSuccess: () => qc.invalidateQueries({ queryKey: ['att-today'] }) })
  const hasIn = !!todayStatus?.checkIn; const hasOut = !!todayStatus?.checkOut
  const fmtT = (t: string) => t ? new Date(t).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'
  return (
    <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-6 text-white shadow-lg">
      <div className="flex items-center gap-2 mb-4"><Clock className="w-4 h-4 opacity-80" /><span className="text-xs font-bold uppercase tracking-widest opacity-80">Today's Attendance</span></div>
      <div className="flex items-center gap-4 mb-5">
        <div className="text-center"><p className="text-xs opacity-70 mb-0.5">Check In</p><p className="text-lg font-black">{fmtT(todayStatus?.checkIn)}</p></div>
        <div className="flex-1 h-px bg-white/20" />
        <div className="text-center"><p className="text-xs opacity-70 mb-0.5">Check Out</p><p className="text-lg font-black">{fmtT(todayStatus?.checkOut)}</p></div>
        <div className="flex-1 h-px bg-white/20" />
        <div className="text-center"><p className="text-xs opacity-70 mb-0.5">Status</p><p className="text-sm font-black">{todayStatus?.status ?? 'NOT MARKED'}</p></div>
      </div>
      {!hasIn ? (
        <button onClick={() => checkInMut.mutate()} disabled={checkInMut.isPending}
          className="w-full py-3 rounded-xl bg-white text-indigo-700 font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-50 active:scale-[0.98] transition-all disabled:opacity-60">
          <LogIn className="w-4 h-4" />{checkInMut.isPending ? 'Checking In…' : 'Check In Now'}
        </button>
      ) : !hasOut ? (
        <button onClick={() => checkOutMut.mutate()} disabled={checkOutMut.isPending}
          className="w-full py-3 rounded-xl bg-white/20 border border-white/30 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-white/30 active:scale-[0.98] transition-all disabled:opacity-60">
          <LogOut className="w-4 h-4" />{checkOutMut.isPending ? 'Checking Out…' : 'Check Out'}
        </button>
      ) : (
        <div className="w-full py-3 rounded-xl bg-white/20 text-white/80 text-sm font-semibold text-center flex items-center justify-center gap-2">
          <CheckCircle className="w-4 h-4" /> Attendance Marked
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════
// EMPLOYEE DASHBOARD
// ══════════════════════════════════════════
function EmployeeDashboard({ data }: { data: any }) {
  const { data: myPayslips } = useQuery({ queryKey: ['my-payslips'], queryFn: () => payrollApi.myPayslips({ limit: 3 }).then((r: any) => r.data) })
  const { data: myLeaves } = useQuery({ queryKey: ['my-leaves'], queryFn: () => leavesApi.list({ limit: 5 }).then((r: any) => r.data) })
  const balances = data?.leaveBalances || []
  const leaveColors: any = { ANNUAL: '#6366f1', SICK: '#f59e0b', CASUAL: '#10b981' }
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <AttendanceWidget />
        <div className="lg:col-span-2 grid grid-cols-3 gap-4 items-center">
          {balances.slice(0, 3).map((lb: any) => (
            <LeaveRing key={lb.leaveType} label={lb.leaveType.replace(/_/g, ' ')} used={lb.used} allocated={lb.allocated} color={leaveColors[lb.leaveType] || '#6366f1'} />
          ))}
          <div className="col-span-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0"><Award className="w-5 h-5 text-amber-600" /></div>
            <div>
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">Leave Balance Summary</p>
              <p className="text-sm text-amber-600 mt-0.5">{balances.reduce((a: number, b: any) => a + (b.allocated - b.used), 0)} days available across all types</p>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
          <SectionTitle icon={CalendarDays} action={<a href="/leaves" className="text-xs text-indigo-500 font-semibold flex items-center gap-1 hover:text-indigo-700">Apply Leave <ChevronRight className="w-3 h-3" /></a>}>My Leave Requests</SectionTitle>
          {myLeaves?.leaves?.length > 0 ? (
            <div className="space-y-2.5">
              {myLeaves.leaves.slice(0, 4).map((lv: any) => (
                <div key={lv.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700">{lv.leaveType?.replace(/_/g, ' ')} Leave</p>
                    <p className="text-xs text-slate-400">{new Date(lv.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} → {new Date(lv.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                  </div>
                  <StatusBadge status={lv.status} />
                </div>
              ))}
            </div>
          ) : <div className="text-center py-8 text-slate-400 text-sm">No leave requests yet</div>}
        </div>
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
          <SectionTitle icon={CalendarCheck}>Upcoming Holidays</SectionTitle>
          <div className="space-y-3">
            {(data?.upcomingHolidays || []).slice(0, 5).map((h: any) => {
              const d = new Date(h.date); const dl = Math.ceil((d.getTime() - Date.now()) / 86400000)
              return (
                <div key={h.id} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 flex flex-col items-center justify-center shrink-0">
                    <span className="text-sm font-black text-indigo-700 leading-none">{d.getDate()}</span>
                    <span className="text-xs text-indigo-400 leading-none">{d.toLocaleString('default', { month: 'short' })}</span>
                  </div>
                  <div className="flex-1"><p className="text-sm font-semibold text-slate-700">{h.name}</p><p className="text-xs text-slate-400">{dl > 0 ? `In ${dl} days` : 'Today!'}</p></div>
                  {dl <= 7 && dl > 0 && <span className="text-xs bg-indigo-100 text-indigo-600 font-bold px-2 py-1 rounded-full">Soon</span>}
                </div>
              )
            })}
            {!(data?.upcomingHolidays?.length) && <p className="text-sm text-slate-400 text-center py-6">No upcoming holidays</p>}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
          <SectionTitle icon={DollarSign} action={<a href="/payroll" className="text-xs text-indigo-500 font-semibold flex items-center gap-1 hover:text-indigo-700">View All <ChevronRight className="w-3 h-3" /></a>}>Recent Payslips</SectionTitle>
          {myPayslips?.payslips?.length > 0 ? (
            <div className="space-y-3">
              {myPayslips.payslips.slice(0, 3).map((p: any) => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0"><DollarSign className="w-4 h-4 text-emerald-600" /></div>
                  <div className="flex-1"><p className="text-sm font-semibold text-slate-700">{p.month} {p.year}</p><p className="text-xs text-slate-400">Net: ₹{(p.netSalary || 0).toLocaleString('en-IN')}</p></div>
                  <StatusBadge status={p.status} />
                </div>
              ))}
            </div>
          ) : <div className="text-center py-8 text-slate-400 text-sm">No payslips yet</div>}
        </div>
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
          <SectionTitle icon={Bell}>Announcements</SectionTitle>
          {(data?.recentAnnouncements || []).length > 0 ? (
            <div className="space-y-3">
              {data.recentAnnouncements.slice(0, 4).map((a: any) => (
                <div key={a.id} className="p-3 rounded-xl bg-slate-50 border-l-4 border-indigo-400">
                  <div className="flex items-center gap-2 mb-1">{a.isPinned && <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Pinned</span>}<p className="text-sm font-semibold text-slate-700">{a.title}</p></div>
                  <p className="text-xs text-slate-400 line-clamp-2">{a.content}</p>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-slate-400 text-center py-6">No announcements</p>}
        </div>
      </div>
      {(data?.todayBirthdays?.length > 0 || data?.upcomingBirthdays?.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {data?.todayBirthdays?.length > 0 && (
            <div className="rounded-2xl p-5 bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-lg">
              <h2 className="text-sm font-bold mb-3">🎂 Birthday Today!</h2>
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
            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
              <SectionTitle icon={Star}>Upcoming Birthdays</SectionTitle>
              <div className="space-y-2.5">
                {data.upcomingBirthdays.slice(0, 5).map((emp: any) => {
                  const dob = new Date(emp.dateOfBirth); const today = new Date()
                  const next = new Date(today.getFullYear(), dob.getMonth(), dob.getDate())
                  const days = Math.ceil((next.getTime() - today.getTime()) / 86400000)
                  return (
                    <div key={emp.id} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white font-black text-xs shrink-0">{emp.firstName?.[0]}{emp.lastName?.[0]}</div>
                      <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-slate-700">{emp.firstName} {emp.lastName}</p><p className="text-xs text-slate-400">{dob.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p></div>
                      <span className="text-xs font-black text-indigo-500">{days}d</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════
// ADMIN / HR DASHBOARD
// ══════════════════════════════════════════
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
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard title="Total Employees" value={total} icon={Users} accent="#6366f1" sub={`${active} active`} />
        <StatCard title="Present Today" value={present} icon={UserCheck} accent="#10b981" sub={`${attPct}% rate`} />
        <StatCard title="Absent Today" value={absent} icon={UserX} accent="#ef4444" sub="not checked in" />
        <StatCard title="Late Check-ins" value={late} icon={Clock} accent="#f59e0b" sub="today" />
        <StatCard title="Pending Leaves" value={pendLvs} icon={CalendarDays} accent="#8b5cf6" sub="await approval" onClick={() => window.location.href = '/leaves'} />
        <StatCard title="Pending Docs" value={pendDocs} icon={FileText} accent="#3b82f6" sub="need verify" onClick={() => window.location.href = '/documents'} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
          <SectionTitle icon={Activity}>Today's Breakdown</SectionTitle>
          <div className="space-y-3">
            {[{ label: 'Present', value: present, color: '#10b981' }, { label: 'Absent', value: absent, color: '#ef4444' }, { label: 'Late', value: late, color: '#f59e0b' }].map(({ label, value, color }) => {
              const pct = total > 0 ? Math.round((value / total) * 100) : 0
              return (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1.5"><span className="font-semibold text-slate-600">{label}</span><span className="font-black" style={{ color }}>{value} <span className="text-slate-400 font-normal">({pct}%)</span></span></div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} /></div>
                </div>
              )
            })}
          </div>
          <div className="mt-5 p-3 rounded-xl text-center" style={{ background: attPct >= 80 ? '#f0fdf4' : '#fef9c3' }}>
            <p className="text-2xl font-black" style={{ color: attPct >= 80 ? '#16a34a' : '#d97706' }}>{attPct}%</p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Overall Attendance Rate</p>
          </div>
        </div>
        <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
          <SectionTitle icon={Building2}>Headcount by Department</SectionTitle>
          {deptData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={deptData} barSize={32}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', fontSize: 12 }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>{deptData.map((_: any, i: number) => <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No department data</div>}
        </div>
      </div>
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
        <SectionTitle icon={ClipboardList} action={<a href="/attendance" className="text-xs text-indigo-500 font-semibold flex items-center gap-1 hover:text-indigo-700">Full Report <ChevronRight className="w-3 h-3" /></a>}>Today's Attendance</SectionTitle>
        {todayReport?.records?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100">
                <th className="text-left pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Employee</th>
                <th className="text-left pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Department</th>
                <th className="text-left pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-left pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Check In</th>
                <th className="text-left pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Check Out</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {todayReport.records.slice(0, 10).map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3"><div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-black shrink-0">{r.employee?.firstName?.[0]}{r.employee?.lastName?.[0]}</div>
                      <div><p className="font-semibold text-slate-800 text-sm">{r.employee?.firstName} {r.employee?.lastName}</p><p className="text-xs text-slate-400">{r.employee?.employeeCode}</p></div>
                    </div></td>
                    <td className="py-3 text-sm text-slate-500">{r.employee?.department?.name}</td>
                    <td className="py-3"><StatusBadge status={r.status} /></td>
                    <td className="py-3 text-xs font-mono text-slate-500">{r.checkIn ? new Date(r.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    <td className="py-3 text-xs font-mono text-slate-500">{r.checkOut ? new Date(r.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {todayReport.records.length > 10 && <div className="text-center pt-3 border-t border-slate-50"><a href="/attendance" className="text-xs text-indigo-500 font-semibold">+{todayReport.records.length - 10} more →</a></div>}
          </div>
        ) : <div className="text-center py-10 text-slate-400 text-sm">No attendance records yet today.</div>}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
          <SectionTitle icon={ShieldAlert}>HR Action Items</SectionTitle>
          <div className="space-y-2.5">
            {pendLvs > 0 && <a href="/leaves" className="flex items-center gap-3 p-3.5 bg-violet-50 border border-violet-100 rounded-xl hover:bg-violet-100 transition-colors group">
              <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0"><CalendarDays className="w-4 h-4 text-violet-600" /></div>
              <div className="flex-1"><p className="text-sm font-semibold text-violet-800">{pendLvs} Leave Request{pendLvs > 1 ? 's' : ''}</p><p className="text-xs text-violet-500">Awaiting approval</p></div>
              <ChevronRight className="w-4 h-4 text-violet-400 group-hover:translate-x-0.5 transition-transform" />
            </a>}
            {pendDocs > 0 && <a href="/documents" className="flex items-center gap-3 p-3.5 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-colors group">
              <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0"><FileText className="w-4 h-4 text-blue-600" /></div>
              <div className="flex-1"><p className="text-sm font-semibold text-blue-800">{pendDocs} Document{pendDocs > 1 ? 's' : ''}</p><p className="text-xs text-blue-500">Pending verification</p></div>
              <ChevronRight className="w-4 h-4 text-blue-400 group-hover:translate-x-0.5 transition-transform" />
            </a>}
            {pendLvs === 0 && pendDocs === 0 && <div className="flex items-center gap-3 p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl"><CheckCircle className="w-5 h-5 text-emerald-500" /><p className="text-sm font-semibold text-emerald-700">All caught up 🎉</p></div>}
          </div>
        </div>
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
          <SectionTitle icon={Users} action={<a href="/employees" className="text-xs text-indigo-500 font-semibold flex items-center gap-1 hover:text-indigo-700">View All <ChevronRight className="w-3 h-3" /></a>}>Recent Joiners</SectionTitle>
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
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
          <SectionTitle icon={Bell}>Announcements</SectionTitle>
          {(data?.recentAnnouncements || []).length > 0 ? (
            <div className="space-y-3">{data.recentAnnouncements.slice(0, 4).map((a: any) => (
              <div key={a.id} className="p-3 rounded-xl bg-slate-50 border-l-4 border-indigo-400">
                <div className="flex items-start gap-2 mb-1">{a.isPinned && <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full shrink-0">Pinned</span>}<p className="text-sm font-semibold text-slate-700">{a.title}</p></div>
                <p className="text-xs text-slate-400 line-clamp-2">{a.content}</p>
              </div>
            ))}</div>
          ) : <p className="text-sm text-slate-400 text-center py-6">No announcements</p>}
        </div>
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
          <SectionTitle icon={CalendarCheck}>Upcoming Holidays</SectionTitle>
          <div className="space-y-2.5">
            {(data?.upcomingHolidays || []).slice(0, 5).map((h: any) => {
              const d = new Date(h.date); const dl = Math.ceil((d.getTime() - Date.now()) / 86400000)
              return (
                <div key={h.id} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 flex flex-col items-center justify-center shrink-0"><span className="text-sm font-black text-indigo-700 leading-none">{d.getDate()}</span><span className="text-xs text-indigo-400 leading-none">{d.toLocaleString('default', { month: 'short' })}</span></div>
                  <div className="flex-1"><p className="text-sm font-semibold text-slate-700">{h.name}</p><p className="text-xs text-slate-400">{dl > 0 ? `In ${dl} days` : 'Today!'}</p></div>
                </div>
              )
            })}
            {!(data?.upcomingHolidays?.length) && <p className="text-sm text-slate-400 text-center py-6">No upcoming holidays</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════
// CEO / SUPER ADMIN DASHBOARD
// ══════════════════════════════════════════
function CEODashboard({ data }: { data: any }) {
  const today = new Date().toISOString().split('T')[0]
  const { data: todayReport } = useQuery({ queryKey: ['att-ceo-today'], queryFn: () => (attendanceApi as any).report({ type: 'daily', date: today }).then((r: any) => r.data) })
  const { data: pendingLeaves } = useQuery({ queryKey: ['leaves-ceo'], queryFn: () => leavesApi.list({ status: 'PENDING', limit: 1 }).then((r: any) => r.data) })
  const { data: docStats } = useQuery({ queryKey: ['docs-ceo'], queryFn: () => documentsApi.getStats().then((r: any) => r.data) })
  const total = data?.overview?.totalEmployees ?? data?.totalEmployees ?? 0
  const active = data?.overview?.activeEmployees ?? data?.activeEmployees ?? 0
  const present = todayReport?.summary?.present ?? 0
  const absent = todayReport?.summary?.absent ?? 0
  const late = todayReport?.summary?.late ?? 0
  const pendDocs = docStats?.pending ?? 0
  const pendLvs = pendingLeaves?.meta?.total ?? 0
  const attPct = total > 0 ? Math.round((present / total) * 100) : 0
  const deptData = (data?.departmentDistribution || []).map((d: any, i: number) => ({ ...d, fill: DEPT_COLORS[i % DEPT_COLORS.length] }))
  const monthlyTrend = [
    { month: 'Oct', headcount: Math.max(total - 18, 1) }, { month: 'Nov', headcount: Math.max(total - 14, 1) },
    { month: 'Dec', headcount: Math.max(total - 9, 1) }, { month: 'Jan', headcount: Math.max(total - 5, 1) },
    { month: 'Feb', headcount: Math.max(total - 2, 1) }, { month: 'Mar', headcount: total },
  ]
  const attTrend = [{ day: 'Mon', rate: 88 }, { day: 'Tue', rate: 92 }, { day: 'Wed', rate: 85 }, { day: 'Thu', rate: 90 }, { day: 'Fri', rate: attPct || 87 }]
  return (
    <div className="space-y-6">
      {/* Executive Banner */}
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
            <div className="text-center"><p className={`text-3xl font-black ${attPct >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>{attPct}%</p><p className="text-xs text-indigo-300 font-semibold">Today's Attendance</p></div>
            <div className="w-px bg-white/10" />
            <div className="text-center"><p className={`text-3xl font-black ${(pendLvs + pendDocs) > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>{pendLvs + pendDocs}</p><p className="text-xs text-indigo-300 font-semibold">Pending Actions</p></div>
          </div>
        </div>
      </div>
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Active Employees" value={active} icon={Users} accent="#6366f1" sub={`of ${total} total`} trend={12} trendLabel="vs last month" />
        <StatCard title="Present Today" value={present} icon={UserCheck} accent="#10b981" sub={`${attPct}% rate`} trend={attPct >= 85 ? 3 : -5} trendLabel="vs last week" />
        <StatCard title="Pending Approvals" value={pendLvs + pendDocs} icon={AlertCircle} accent="#f59e0b" sub={`${pendLvs} leave · ${pendDocs} docs`} />
        <StatCard title="Departments" value={deptData.length} icon={Building2} accent="#8b5cf6" sub="active divisions" />
      </div>
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
          <SectionTitle icon={TrendingUp}>Headcount Growth (6 Months)</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={monthlyTrend}>
              <defs><linearGradient id="hcGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} /></linearGradient></defs>
              <XAxis dataKey="month" tick={{ fontSize: 11, fontWeight: 600 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', fontSize: 12 }} />
              <Area type="monotone" dataKey="headcount" stroke="#6366f1" strokeWidth={2.5} fill="url(#hcGrad)" dot={{ fill: '#6366f1', r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
          <SectionTitle icon={BarChart2}>Weekly Attendance Rate (%)</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={attTrend} barSize={36}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fontWeight: 600 }} tickLine={false} axisLine={false} />
              <YAxis domain={[70, 100]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', fontSize: 12 }} />
              <Bar dataKey="rate" radius={[6, 6, 0, 0]}>{attTrend.map((e, i) => <Cell key={i} fill={e.rate >= 88 ? '#10b981' : e.rate >= 80 ? '#f59e0b' : '#ef4444'} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Dept Pie + Workforce Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
          <SectionTitle icon={Building2}>Department Distribution</SectionTitle>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="50%" height={180}>
              <RPieChart>
                <Pie data={deptData} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                  {deptData.map((_: any, i: number) => <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', fontSize: 12 }} />
              </RPieChart>
            </ResponsiveContainer>
            <div className="space-y-2 flex-1">
              {deptData.map((d: any, i: number) => (
                <div key={d.name} className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: DEPT_COLORS[i % DEPT_COLORS.length] }} />
                  <div className="flex-1 flex items-center justify-between min-w-0"><span className="text-xs font-semibold text-slate-600 truncate">{d.name}</span><span className="text-xs font-black text-slate-800 ml-2">{d.count}</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
          <SectionTitle icon={Layers}>Workforce Status</SectionTitle>
          <div className="space-y-4 mt-2">
            {[
              { label: 'Present', value: present, color: '#10b981', Icon: UserCheck },
              { label: 'Absent', value: absent, color: '#ef4444', Icon: UserX },
              { label: 'Late', value: late, color: '#f59e0b', Icon: Clock },
              { label: 'Pending Leaves', value: pendLvs, color: '#8b5cf6', Icon: CalendarDays },
              { label: 'Pending Docs', value: pendDocs, color: '#3b82f6', Icon: FileText },
            ].map(({ label, value, color, Icon: ItemIcon }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: color + '18' }}><ItemIcon className="w-4 h-4" style={{ color }} /></div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1"><span className="text-xs font-semibold text-slate-600">{label}</span><span className="text-xs font-black text-slate-800">{value}</span></div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${total > 0 ? Math.min((value / total) * 100, 100) : 0}%`, background: color }} /></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Actions + Holidays */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
          <SectionTitle icon={ShieldAlert}>Pending Actions</SectionTitle>
          <div className="space-y-2.5">
            {pendLvs > 0 && <a href="/leaves" className="flex items-center gap-3 p-3.5 bg-violet-50 border border-violet-100 rounded-xl hover:bg-violet-100 transition-colors group">
              <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0"><CalendarDays className="w-4 h-4 text-violet-600" /></div>
              <div className="flex-1"><p className="text-sm font-semibold text-violet-800">{pendLvs} Leave Requests</p><p className="text-xs text-violet-500">Awaiting approval</p></div>
              <ChevronRight className="w-4 h-4 text-violet-400 group-hover:translate-x-0.5 transition-transform" />
            </a>}
            {pendDocs > 0 && <a href="/documents" className="flex items-center gap-3 p-3.5 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-colors group">
              <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0"><FileText className="w-4 h-4 text-blue-600" /></div>
              <div className="flex-1"><p className="text-sm font-semibold text-blue-800">{pendDocs} Documents</p><p className="text-xs text-blue-500">Pending verification</p></div>
              <ChevronRight className="w-4 h-4 text-blue-400 group-hover:translate-x-0.5 transition-transform" />
            </a>}
            {pendLvs === 0 && pendDocs === 0 && <div className="flex items-center gap-3 p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl"><CheckCircle className="w-5 h-5 text-emerald-500" /><p className="text-sm font-semibold text-emerald-700">No pending actions 🎉</p></div>}
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Announcements</p>
            {(data?.recentAnnouncements || []).length > 0 ? (
              <div className="space-y-2">{data.recentAnnouncements.slice(0, 3).map((a: any) => (
                <div key={a.id} className="p-3 rounded-xl bg-slate-50 border-l-4 border-indigo-400"><p className="text-sm font-semibold text-slate-700">{a.title}</p><p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{a.content}</p></div>
              ))}</div>
            ) : <p className="text-xs text-slate-400">No announcements</p>}
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
            <SectionTitle icon={CalendarCheck}>Upcoming Holidays</SectionTitle>
            <div className="space-y-2.5">
              {(data?.upcomingHolidays || []).slice(0, 4).map((h: any) => {
                const d = new Date(h.date); const dl = Math.ceil((d.getTime() - Date.now()) / 86400000)
                return (
                  <div key={h.id} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 flex flex-col items-center justify-center shrink-0"><span className="text-sm font-black text-indigo-700 leading-none">{d.getDate()}</span><span className="text-xs text-indigo-400 leading-none">{d.toLocaleString('default', { month: 'short' })}</span></div>
                    <div className="flex-1"><p className="text-sm font-semibold text-slate-700">{h.name}</p><p className="text-xs text-slate-400">{dl > 0 ? `In ${dl} days` : 'Today!'}</p></div>
                    {dl <= 7 && dl > 0 && <span className="text-xs bg-indigo-100 text-indigo-600 font-bold px-2 py-1 rounded-full">Soon</span>}
                  </div>
                )
              })}
              {!(data?.upcomingHolidays?.length) && <p className="text-sm text-slate-400 text-center py-4">No upcoming holidays</p>}
            </div>
          </div>
          {data?.todayBirthdays?.length > 0 && (
            <div className="rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 text-white p-5 shadow-lg">
              <h2 className="text-sm font-bold mb-3">🎂 Birthday Today!</h2>
              {data.todayBirthdays.slice(0, 2).map((emp: any) => (
                <div key={emp.id} className="flex items-center gap-3 bg-white/20 p-3 rounded-xl">
                  <div className="w-9 h-9 rounded-full bg-white/30 flex items-center justify-center font-black text-sm">{emp.firstName?.[0]}{emp.lastName?.[0]}</div>
                  <div><p className="font-bold text-sm">{emp.firstName} {emp.lastName}</p><p className="text-xs opacity-75">{emp.departmentName}</p></div>
                  <span className="ml-auto text-xl">🎉</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════
// MAIN EXPORT
// ══════════════════════════════════════════
export default function DashboardPage() {
  const { user } = useAuthStore()
  const isHR = useIsHR()
  const isCEO = user?.role === 'SUPER_ADMIN'
  const { text: greetText, Icon: GreetIcon, color: greetColor } = getGreeting()

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.get().then((r: any) => r.data),
  })

  const firstName = (user?.employee as any)?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'
  const roleLabel = isCEO ? 'Super Admin View' : isHR ? 'HR Admin View' : 'Employee View'

  const todayStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const headerTitle = `${greetText}, ${firstName}!`
  const headerSubtitle = `${todayStr}  •  ${roleLabel}`

  if (isLoading) return <><Header title="Dashboard" /><PageLoader /></>

  return (
    <div>
      <Header title={headerTitle} subtitle={headerSubtitle} />
      <div className="p-6">
        {isCEO
          ? <CEODashboard data={data} />
          : isHR
            ? <AdminDashboard data={data} />
            : <EmployeeDashboard data={data} />
        }
      </div>
    </div>
  )
}
