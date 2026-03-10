import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BarChart3, Package, Megaphone, CalendarCheck, Plus, Trash2, Pin, Bell, Edit2 } from 'lucide-react'
import { performanceApi, assetsApi, announcementsApi, holidaysApi } from '../../services/api'
import Header from '../../components/layout/Header'
import { Badge, Table, PageLoader, EmptyState, Modal, FormField } from '../../components/ui'
import { formatDate } from '../../utils/helpers'
import { useAuthStore, useIsHR } from '../../store/auth'
import toast from 'react-hot-toast'

// ─── Performance Page ─────────────────────────────────────────────────────────
export function PerformancePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['performance'],
    queryFn: () => performanceApi.list().then((r: any) => r.data),
  })
  const ratingColors: any = {
    OUTSTANDING: 'bg-emerald-100 text-emerald-700',
    EXCEEDS_EXPECTATIONS: 'bg-blue-100 text-blue-700',
    MEETS_EXPECTATIONS: 'bg-violet-100 text-violet-700',
    NEEDS_IMPROVEMENT: 'bg-amber-100 text-amber-700',
    UNSATISFACTORY: 'bg-red-100 text-red-700',
  }
  if (isLoading) return <><Header title="Performance" /><PageLoader /></>
  return (
    <div>
      <Header title="Performance" subtitle="Employee performance reviews" />
      <div className="p-6">
        <div className="card">
          <Table headers={['Employee', 'Reviewer', 'Period', 'Rating', 'Score', 'Status']}>
            {(data?.data || []).map((r: any) => (
              <tr key={r.id} className="hover:bg-slate-50/50">
                <td className="table-td font-semibold">{r.reviewee?.firstName} {r.reviewee?.lastName}</td>
                <td className="table-td text-slate-500">{r.reviewer?.firstName} {r.reviewer?.lastName}</td>
                <td className="table-td text-slate-500">{r.reviewPeriod}</td>
                <td className="table-td"><Badge label={r.rating?.replace('_', ' ')} color={ratingColors[r.rating] || ''} /></td>
                <td className="table-td font-bold text-primary-600">{r.overallScore}/100</td>
                <td className="table-td"><Badge label={r.status} color="" /></td>
              </tr>
            ))}
          </Table>
        </div>
      </div>
    </div>
  )
}

// ─── Assets Page ──────────────────────────────────────────────────────────────
export function AssetsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: () => assetsApi.list().then((r: any) => r.data),
  })
  if (isLoading) return <><Header title="Assets" /><PageLoader /></>
  return (
    <div>
      <Header title="Assets" subtitle="Company asset management" />
      <div className="p-6">
        <div className="card">
          <Table headers={['Asset', 'Category', 'Serial No.', 'Assigned To', 'Status']}>
            {(data?.data || []).map((a: any) => (
              <tr key={a.id} className="hover:bg-slate-50/50">
                <td className="table-td font-semibold">{a.name}</td>
                <td className="table-td text-slate-500">{a.category}</td>
                <td className="table-td text-slate-500">{a.serialNumber || '—'}</td>
                <td className="table-td">{a.employee ? `${a.employee.firstName} ${a.employee.lastName}` : <span className="text-slate-300">Unassigned</span>}</td>
                <td className="table-td"><Badge label={a.status} color="" /></td>
              </tr>
            ))}
          </Table>
        </div>
      </div>
    </div>
  )
}

// ─── Announcements Page ───────────────────────────────────────────────────────
export function AnnouncementsPage() {
  const { user } = useAuthStore()
  const isHR = useIsHR()
  const qc = useQueryClient()
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN'
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', type: 'GENERAL', isPinned: false })

  const { data = [], isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => announcementsApi.list().then((r: any) => r.data),
  })

  const createMut = useMutation({
    mutationFn: (d: any) => announcementsApi.create(d),
    onSuccess: () => {
      toast.success('📢 Announcement published!')
      qc.invalidateQueries({ queryKey: ['announcements'] })
      setShowCreate(false)
      setForm({ title: '', content: '', type: 'GENERAL', isPinned: false })
    },
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => announcementsApi.delete(id),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['announcements'] }) },
  })

  const typeColors: any = {
    GENERAL: 'bg-slate-100 text-slate-600',
    URGENT: 'bg-red-100 text-red-700',
    POLICY: 'bg-blue-100 text-blue-700',
    HOLIDAY: 'bg-emerald-100 text-emerald-700',
    BIRTHDAY: 'bg-pink-100 text-pink-700',
  }
  const typeEmoji: any = { GENERAL: '📢', URGENT: '🚨', POLICY: '📋', HOLIDAY: '🎉', BIRTHDAY: '🎂' }

  if (isLoading) return <><Header title="Announcements" /><PageLoader /></>

  return (
    <div>
      <Header title="Announcements" subtitle="Company news & updates" />
      <div className="p-6 space-y-4">
        {isSuperAdmin && (
          <div className="flex justify-end">
            <button onClick={() => setShowCreate(true)} className="btn-primary gap-2">
              <Plus className="w-4 h-4" /> Create Announcement
            </button>
          </div>
        )}

        {(data as any[]).length === 0 && (
          <EmptyState icon={Megaphone} title="No announcements yet" description="Company announcements will appear here" />
        )}

        <div className="space-y-3">
          {(data as any[]).map((a: any) => (
            <div key={a.id} className={`card p-5 transition-shadow hover:shadow-md ${a.isPinned ? 'border-l-4 border-l-primary-500' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="text-2xl mt-0.5">{typeEmoji[a.type] || '📢'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {a.isPinned && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                          <Pin className="w-3 h-3" /> Pinned
                        </span>
                      )}
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${typeColors[a.type] || ''}`}>{a.type}</span>
                    </div>
                    <h3 className="font-bold text-slate-800 text-base">{a.title}</h3>
                    <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{a.content}</p>
                    <p className="text-xs text-slate-400 mt-2">{formatDate(a.publishedAt || a.createdAt)}</p>
                  </div>
                </div>
                {isSuperAdmin && (
                  <button onClick={() => { if (confirm('Delete this announcement?')) deleteMut.mutate(a.id) }}
                    className="p-1.5 hover:bg-red-50 hover:text-red-500 text-slate-300 rounded-lg transition-colors shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="📢 Create Announcement" width="max-w-lg">
        <div className="space-y-4">
          <FormField label="Title *">
            <input className="input" placeholder="e.g. Office Closed on Friday"
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </FormField>
          <FormField label="Content *">
            <textarea className="input min-h-[120px] resize-none"
              placeholder="Write your announcement here..."
              value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
          </FormField>
          <FormField label="Type">
            <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              <option value="GENERAL">📢 General</option>
              <option value="URGENT">🚨 Urgent</option>
              <option value="POLICY">📋 Policy</option>
              <option value="HOLIDAY">🎉 Holiday</option>
              <option value="BIRTHDAY">🎂 Birthday</option>
            </select>
          </FormField>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.isPinned}
              onChange={e => setForm(f => ({ ...f, isPinned: e.target.checked }))}
              className="w-4 h-4 accent-primary-600" />
            <span className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
              <Pin className="w-4 h-4" /> Pin this announcement (shows at top)
            </span>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            <button className="btn-primary gap-2"
              disabled={!form.title.trim() || !form.content.trim() || createMut.isPending}
              onClick={() => createMut.mutate(form)}>
              <Bell className="w-4 h-4" /> {createMut.isPending ? 'Publishing...' : 'Publish Announcement'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ─── Holidays Page ────────────────────────────────────────────────────────────
export function HolidaysPage() {
  const year = new Date().getFullYear()
  const { data = [], isLoading } = useQuery({
    queryKey: ['holidays', year],
    queryFn: () => holidaysApi.list(year).then((r: any) => r.data),
  })
  if (isLoading) return <><Header title="Holidays" /><PageLoader /></>
  return (
    <div>
      <Header title={`Holidays ${year}`} subtitle={`${data.length} holidays this year`} />
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(data as any[]).map((h: any) => {
            const d = new Date(h.date)
            const isUpcoming = d >= new Date()
            return (
              <div key={h.id} className={`card p-4 flex items-center gap-4 ${isUpcoming ? 'border-l-4 border-l-primary-400' : ''}`}>
                <div className="w-14 h-14 rounded-xl bg-primary-50 flex flex-col items-center justify-center shrink-0">
                  <p className="text-xs font-bold text-primary-500 uppercase">{d.toLocaleString('en', { month: 'short' })}</p>
                  <p className="text-xl font-bold text-primary-700">{d.getDate()}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{h.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{d.toLocaleDateString('en-IN', { weekday: 'long' })}</p>
                  {isUpcoming && <span className="text-xs text-primary-500 font-medium">Upcoming</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
