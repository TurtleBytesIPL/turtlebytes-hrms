import { useQuery } from '@tanstack/react-query'
import { BarChart3, Package, Megaphone, CalendarCheck } from 'lucide-react'
import { performanceApi, assetsApi, announcementsApi, holidaysApi } from '../../services/api'
import Header from '../../components/layout/Header'
import { Badge, Table, PageLoader, EmptyState } from '../../components/ui'
import { formatDate } from '../../utils/helpers'

// ─── Performance Page ─────────────────────────────────────────────────────────
export function PerformancePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['performance'],
    queryFn: () => performanceApi.list().then(r => r.data),
  })

  const ratingColors: any = {
    OUTSTANDING: 'bg-emerald-100 text-emerald-700',
    EXCEEDS_EXPECTATIONS: 'bg-blue-100 text-blue-700',
    MEETS_EXPECTATIONS: 'bg-violet-100 text-violet-700',
    NEEDS_IMPROVEMENT: 'bg-amber-100 text-amber-700',
    UNSATISFACTORY: 'bg-red-100 text-red-700',
  }

  return (
    <div>
      <Header title="Performance" subtitle="Employee reviews & ratings" />
      <div className="p-6">
        <div className="card">
          <Table headers={['Employee', 'Reviewer', 'Period', 'Rating', 'Status', 'Date']} loading={isLoading}>
            {data?.data?.map((r: any) => (
              <tr key={r.id} className="hover:bg-slate-50/50">
                <td className="table-td">
                  <p className="font-medium text-slate-800">{r.reviewee?.firstName} {r.reviewee?.lastName}</p>
                  <p className="text-xs text-slate-400">{r.reviewee?.department?.name}</p>
                </td>
                <td className="table-td text-slate-500">{r.reviewer?.firstName} {r.reviewer?.lastName}</td>
                <td className="table-td"><Badge label={r.reviewPeriod} color="bg-slate-100 text-slate-600" /></td>
                <td className="table-td"><Badge label={r.overallRating.replace(/_/g,' ')} color={ratingColors[r.overallRating] || ''} /></td>
                <td className="table-td"><Badge label={r.status} color="bg-slate-100 text-slate-500" /></td>
                <td className="table-td text-slate-400">{formatDate(r.reviewDate)}</td>
              </tr>
            ))}
            {!isLoading && !data?.data?.length && (
              <tr><td colSpan={6}><EmptyState icon={BarChart3} title="No reviews yet" description="Performance reviews will appear here" /></td></tr>
            )}
          </Table>
        </div>
      </div>
    </div>
  )
}

// ─── Assets Page ──────────────────────────────────────────────────────────────
export function AssetsPage() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: () => assetsApi.list().then(r => r.data),
  })

  const statusColors: any = {
    AVAILABLE: 'bg-emerald-100 text-emerald-700',
    ASSIGNED: 'bg-blue-100 text-blue-700',
    UNDER_REPAIR: 'bg-amber-100 text-amber-700',
    RETIRED: 'bg-slate-100 text-slate-400',
  }

  return (
    <div>
      <Header title="Assets" subtitle="Company assets & assignments" />
      <div className="p-6">
        <div className="card">
          <Table headers={['Asset', 'Category', 'Serial No.', 'Status', 'Assigned To']} loading={isLoading}>
            {data.map((a: any) => (
              <tr key={a.id} className="hover:bg-slate-50/50">
                <td className="table-td">
                  <p className="font-medium text-slate-800">{a.name}</p>
                  <p className="text-xs text-slate-400">{a.assetCode} · {a.brand}</p>
                </td>
                <td className="table-td text-slate-500">{a.category}</td>
                <td className="table-td font-mono text-xs text-slate-400">{a.serialNumber || '—'}</td>
                <td className="table-td"><Badge label={a.status} color={statusColors[a.status] || ''} /></td>
                <td className="table-td">
                  {a.assignedTo
                    ? <p className="text-sm">{a.assignedTo.firstName} {a.assignedTo.lastName} <span className="text-slate-400">({a.assignedTo.employeeCode})</span></p>
                    : <span className="text-slate-300">—</span>
                  }
                </td>
              </tr>
            ))}
            {!isLoading && !data.length && (
              <tr><td colSpan={5}><EmptyState icon={Package} title="No assets" description="Add company assets to track them" /></td></tr>
            )}
          </Table>
        </div>
      </div>
    </div>
  )
}

// ─── Announcements Page ───────────────────────────────────────────────────────
export function AnnouncementsPage() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => announcementsApi.list().then(r => r.data),
  })

  const typeColors: any = {
    GENERAL: 'bg-slate-100 text-slate-600',
    URGENT: 'bg-red-100 text-red-700',
    POLICY: 'bg-blue-100 text-blue-700',
    HOLIDAY: 'bg-emerald-100 text-emerald-700',
    BIRTHDAY: 'bg-pink-100 text-pink-700',
  }

  if (isLoading) return <><Header title="Announcements" /><PageLoader /></>

  return (
    <div>
      <Header title="Announcements" subtitle="Company news & updates" />
      <div className="p-6 space-y-4">
        {data.map((a: any) => (
          <div key={a.id} className={`card p-5 ${a.isPinned ? 'border-l-4 border-l-primary-500' : ''}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {a.isPinned && <span className="text-xs font-semibold text-primary-600">📌 Pinned</span>}
                  <Badge label={a.type} color={typeColors[a.type] || ''} />
                </div>
                <h3 className="font-bold text-slate-800">{a.title}</h3>
                <p className="text-sm text-slate-500 mt-1">{a.content}</p>
              </div>
              <p className="text-xs text-slate-400 shrink-0">{formatDate(a.publishedAt)}</p>
            </div>
          </div>
        ))}
        {!data.length && <EmptyState icon={Megaphone} title="No announcements" description="Company announcements will appear here" />}
      </div>
    </div>
  )
}

// ─── Holidays Page ────────────────────────────────────────────────────────────
export function HolidaysPage() {
  const year = new Date().getFullYear()
  const { data = [], isLoading } = useQuery({
    queryKey: ['holidays', year],
    queryFn: () => holidaysApi.list(year).then(r => r.data),
  })

  if (isLoading) return <><Header title="Holidays" /><PageLoader /></>

  return (
    <div>
      <Header title={`Holidays ${year}`} subtitle={`${data.length} holidays this year`} />
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((h: any) => {
            const d = new Date(h.date)
            return (
              <div key={h.id} className="card p-4 flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-primary-50 flex flex-col items-center justify-center shrink-0">
                  <span className="text-xl font-bold text-primary-700 leading-none">{d.getDate()}</span>
                  <span className="text-xs text-primary-400">{d.toLocaleString('default', { month: 'short' })}</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{h.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{d.toLocaleDateString('en-IN', { weekday: 'long' })}</p>
                  {h.isOptional && <span className="text-xs text-amber-600 font-medium">Optional</span>}
                </div>
              </div>
            )
          })}
          {!data.length && <EmptyState icon={CalendarCheck} title="No holidays defined" description="Add holidays to the calendar" />}
        </div>
      </div>
    </div>
  )
}
