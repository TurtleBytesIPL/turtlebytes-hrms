import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BarChart3, Package, Megaphone, CalendarCheck, Plus, Trash2, Pin, Bell, Edit2 } from 'lucide-react'
import { performanceApi, assetsApi, announcementsApi, holidaysApi, employeesApi } from '../../services/api'
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
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const isHR = ['SUPER_ADMIN','HR_ADMIN'].includes(user?.role || '')
  const [filter, setFilter] = useState({ search: '', status: '', type: '' })
  const [showCreate, setShowCreate] = useState(false)
  const [assignAsset, setAssignAsset] = useState<any>(null)
  const [exporting, setExporting] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['assets', filter],
    queryFn: () => assetsApi.list(filter).then((r: any) => r.data),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => assetsApi.delete(id),
    onSuccess: () => { toast.success('Asset deleted'); qc.invalidateQueries({ queryKey: ['assets'] }) },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Delete failed'),
  })

  const unassignMut = useMutation({
    mutationFn: (id: string) => assetsApi.unassign(id),
    onSuccess: () => { toast.success('Asset unassigned'); qc.invalidateQueries({ queryKey: ['assets'] }) },
  })

  const handleExport = async () => {
    setExporting(true)
    try { await assetsApi.exportCsv(); toast.success('Exported!') }
    catch { toast.error('Export failed') }
    finally { setExporting(false) }
  }

  const statusColor = (s: string) => ({ AVAILABLE: 'green', ASSIGNED: 'blue', UNDER_REPAIR: 'orange', RETIRED: 'gray', DISPOSED: 'red', MAINTENANCE: 'yellow' } as any)[s] || 'gray'

  if (isLoading) return <><Header title="Assets" /><PageLoader /></>

  const assets = data || []

  return (
    <div>
      <Header title="Assets" subtitle={`${assets.length} total assets`} />
      <div className="p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            <input className="input text-sm py-1.5 w-48" placeholder="Search assets..." value={filter.search} onChange={e => setFilter(f => ({ ...f, search: e.target.value }))} />
            <select className="input text-sm py-1.5" value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}>
              <option value="">All Status</option>
              {['AVAILABLE','ASSIGNED','UNDER_REPAIR','MAINTENANCE','RETIRED','DISPOSED'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="input text-sm py-1.5" value={filter.type} onChange={e => setFilter(f => ({ ...f, type: e.target.value }))}>
              <option value="">All Types</option>
              {['LAPTOP','DESKTOP','MONITOR','PHONE','TABLET','KEYBOARD','MOUSE','HEADSET','CHARGER','OTHER'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {isHR && (
            <div className="flex gap-2">
              <button onClick={handleExport} disabled={exporting} className="btn-secondary px-3 py-1.5 text-sm flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                {exporting ? 'Exporting...' : 'Export CSV'}
              </button>
              <button onClick={() => setShowCreate(true)} className="btn-primary px-3 py-1.5 text-sm">+ Add Asset</button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  {['Asset Code','Name','Type','Ownership','Location','Brand','Serial No.','Assigned To','Status','Actions'].map(h => (
                    <th key={h} className="table-th text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {assets.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12 text-gray-400">No assets found</td></tr>
                ) : assets.map((a: any) => (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-td font-mono text-xs text-blue-600">{a.assetCode}</td>
                    <td className="table-td font-semibold text-gray-900">{a.name}</td>
                    <td className="table-td text-gray-500">{a.type || a.category || '—'}</td>
                    <td className="table-td">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${a.ownership === 'RENTED' ? 'bg-orange-100 text-orange-700' : a.ownership === 'LEASED' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {a.ownership === 'RENTED' ? '🔄 Rented' : a.ownership === 'LEASED' ? '📋 Leased' : '🏢 Owned'}
                      </span>
                    </td>
                    <td className="table-td text-gray-500 text-xs">{a.location || '—'}</td>
                    <td className="table-td text-gray-500">{a.brand || '—'}</td>
                    <td className="table-td text-gray-400 font-mono text-xs">{a.serialNumber || '—'}</td>
                    <td className="table-td">
                      {a.assignedTo
                        ? <span className="text-gray-900">{a.assignedTo.firstName} {a.assignedTo.lastName}</span>
                        : <span className="text-gray-300">Unassigned</span>}
                    </td>
                    <td className="table-td"><Badge label={a.status} color={statusColor(a.status)} /></td>
                    <td className="table-td">
                      {isHR && (
                        <div className="flex gap-1">
                          {a.status !== 'ASSIGNED' && (
                            <button onClick={() => setAssignAsset(a)} className="text-xs text-blue-600 hover:underline">Assign</button>
                          )}
                          {a.status === 'ASSIGNED' && (
                            <button onClick={() => unassignMut.mutate(a.id)} className="text-xs text-orange-600 hover:underline">Return</button>
                          )}
                          <button onClick={() => { if (confirm('Delete this asset?')) deleteMut.mutate(a.id) }} className="text-xs text-red-500 hover:underline ml-1">Del</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showCreate && <CreateAssetModal onClose={() => setShowCreate(false)} />}
      {assignAsset && <AssignAssetModal asset={assignAsset} onClose={() => setAssignAsset(null)} />}
    </div>
  )
}

function CreateAssetModal({ onClose }: any) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    name: '', type: 'LAPTOP', ownership: 'COMPANY_OWNED',
    brand: '', model: '', serialNumber: '',
    purchaseDate: '', purchaseValue: '', condition: '',
    location: '', description: '', assignedToId: '',
  })

  const { data: empsData } = useQuery({
    queryKey: ['employees-simple'],
    queryFn: () => employeesApi.list({ limit: 200 }).then((r: any) => r.data?.data || r.data || []),
  })
  const employees: any[] = Array.isArray(empsData) ? empsData : []

  const createMut = useMutation({
    mutationFn: () => assetsApi.create({
      ...form,
      purchaseValue: form.purchaseValue ? Number(form.purchaseValue) : undefined,
      assignedToId: form.assignedToId || undefined,
    }),
    onSuccess: () => { toast.success('Asset created'); qc.invalidateQueries({ queryKey: ['assets'] }); onClose() },
  })

  const f = (k: string) => (e: any) => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-gray-900">Add New Asset</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">

          {/* Asset Name */}
          <div className="col-span-2">
            <label className="label">Asset Name *</label>
            <input className="input" value={form.name} onChange={f('name')} placeholder="e.g. MacBook Pro" />
          </div>

          {/* Type + Ownership */}
          <div><label className="label">Type</label>
            <select className="input" value={form.type} onChange={f('type')}>
              {['LAPTOP','DESKTOP','MONITOR','PHONE','TABLET','KEYBOARD','MOUSE','HEADSET','CHARGER','OTHER'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div><label className="label">Ownership</label>
            <select className="input" value={form.ownership} onChange={f('ownership')}>
              <option value="COMPANY_OWNED">🏢 Company Owned</option>
              <option value="RENTED">🔄 Rented</option>
              <option value="LEASED">📋 Leased</option>
            </select>
          </div>

          {/* Brand + Model */}
          <div><label className="label">Brand</label><input className="input" value={form.brand} onChange={f('brand')} placeholder="e.g. Apple" /></div>
          <div><label className="label">Model</label><input className="input" value={form.model} onChange={f('model')} placeholder="e.g. M3 Pro" /></div>

          {/* Serial + Purchase Date */}
          <div><label className="label">Serial Number</label><input className="input" value={form.serialNumber} onChange={f('serialNumber')} placeholder="Serial No." /></div>
          <div><label className="label">Purchase Date</label><input className="input" type="date" value={form.purchaseDate} onChange={f('purchaseDate')} /></div>

          {/* Purchase Value + Condition */}
          <div><label className="label">Purchase Value (₹)</label><input className="input" type="number" value={form.purchaseValue} onChange={f('purchaseValue')} placeholder="0" /></div>
          <div><label className="label">Condition</label><input className="input" value={form.condition} onChange={f('condition')} placeholder="e.g. New, Good" /></div>

          {/* Location */}
          <div className="col-span-2">
            <label className="label">📍 Location</label>
            <input className="input" value={form.location} onChange={f('location')} placeholder="e.g. Head Office / 2nd Floor / Bangalore Office" />
          </div>

          {/* Assign to Employee */}
          <div className="col-span-2">
            <label className="label">👤 Assign to Employee (optional)</label>
            <select className="input" value={form.assignedToId} onChange={f('assignedToId')}>
              <option value="">— Not assigned yet —</option>
              {employees.map((e: any) => (
                <option key={e.id} value={e.id}>
                  {e.firstName} {e.lastName} ({e.employeeCode}) — {e.department?.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="col-span-2">
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={2} value={form.description} onChange={f('description')} placeholder="Any additional notes..." />
          </div>
        </div>

        <div className="p-4 border-t flex gap-2 justify-end sticky bottom-0 bg-white">
          <button onClick={onClose} className="btn-secondary px-4 py-2 text-sm">Cancel</button>
          <button onClick={() => createMut.mutate()} disabled={!form.name || createMut.isPending} className="btn-primary px-4 py-2 text-sm">
            {createMut.isPending ? 'Adding...' : 'Add Asset'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AssignAssetModal({ asset, onClose }: any) {
  const qc = useQueryClient()
  const { data: empData } = useQuery({ queryKey: ['employees-all'], queryFn: () => employeesApi.list({ limit: 200 }).then(r => r.data) })
  const [empId, setEmpId] = useState('')

  const assignMut = useMutation({
    mutationFn: () => assetsApi.assign(asset.id, empId),
    onSuccess: () => { toast.success('Asset assigned'); qc.invalidateQueries({ queryKey: ['assets'] }); onClose() },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Assign failed'),
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Assign — {asset.name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div>
          <label className="label">Select Employee *</label>
          <select className="input" value={empId} onChange={e => setEmpId(e.target.value)}>
            <option value="">Choose employee...</option>
            {(empData?.data || []).map((e: any) => (
              <option key={e.id} value={e.id}>{e.firstName} {e.lastName} — {e.employeeCode}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="btn-secondary px-3 py-2 text-sm">Cancel</button>
          <button onClick={() => assignMut.mutate()} disabled={!empId || assignMut.isPending} className="btn-primary px-3 py-2 text-sm">
            {assignMut.isPending ? 'Assigning...' : 'Assign'}
          </button>
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
