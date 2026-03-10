import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Search, Phone, Calendar, FileText, CheckCircle,
  XCircle, Users, Briefcase, TrendingUp, PhoneCall,
  PhoneMissed, ChevronRight, Clock, Star, X
} from 'lucide-react'
import { recruitmentApi, departmentsApi } from '../../services/api'
import { useIsHR, useIsManager } from '../../store/auth'
import Header from '../../components/layout/Header'
import { Badge, Modal, FormField, PageLoader, Pagination, EmptyState, StatCard, Avatar } from '../../components/ui'
import { formatDate, formatDateTime, formatCurrency, cn } from '../../utils/helpers'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-slate-100 text-slate-600',
  CALLED: 'bg-blue-100 text-blue-700',
  NO_ANSWER: 'bg-gray-100 text-gray-500',
  CALLBACK_LATER: 'bg-yellow-100 text-yellow-700',
  INTERESTED: 'bg-cyan-100 text-cyan-700',
  NOT_INTERESTED: 'bg-red-100 text-red-500',
  SCREENING: 'bg-violet-100 text-violet-700',
  INTERVIEW_SCHEDULED: 'bg-indigo-100 text-indigo-700',
  INTERVIEW_DONE: 'bg-purple-100 text-purple-700',
  SELECTED: 'bg-emerald-100 text-emerald-700',
  OFFER_SENT: 'bg-orange-100 text-orange-700',
  OFFER_ACCEPTED: 'bg-green-100 text-green-700',
  OFFER_REJECTED: 'bg-red-100 text-red-700',
  JOINED: 'bg-emerald-200 text-emerald-800',
  DROPPED: 'bg-slate-100 text-slate-400',
  REJECTED: 'bg-red-100 text-red-600',
}

const PIPELINE_STAGES = [
  { key: 'new', label: 'New', statuses: ['NEW'] },
  { key: 'contacted', label: 'Contacted', statuses: ['CALLED', 'NO_ANSWER', 'CALLBACK_LATER', 'INTERESTED'] },
  { key: 'screening', label: 'Screening', statuses: ['SCREENING'] },
  { key: 'interview', label: 'Interview', statuses: ['INTERVIEW_SCHEDULED', 'INTERVIEW_DONE'] },
  { key: 'offer', label: 'Offer', statuses: ['SELECTED', 'OFFER_SENT', 'OFFER_ACCEPTED'] },
  { key: 'hired', label: 'Hired', statuses: ['JOINED'] },
]

const SOURCES = ['LinkedIn', 'Job Portal', 'Referral', 'Walk-in', 'Campus', 'Agency', 'Website', 'Other']

export default function RecruitmentPage() {
  const isHR = useIsHR()
  const isManager = useIsManager()
  const qc = useQueryClient()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null)
  const [showAddCandidate, setShowAddCandidate] = useState(false)
  const [showAddJob, setShowAddJob] = useState(false)
  const [showCallModal, setShowCallModal] = useState(false)
  const [showInterviewModal, setShowInterviewModal] = useState(false)
  const [showOfferModal, setShowOfferModal] = useState(false)
  const [view, setView] = useState<'list' | 'pipeline'>('list')

  const { register, handleSubmit, reset } = useForm()
  const callForm = useForm()
  const interviewForm = useForm()
  const offerForm = useForm()
  const jobForm = useForm()

  // ─── Queries ────────────────────────────────────────────────────────────────
  const { data: stats } = useQuery({
    queryKey: ['recruitment-stats'],
    queryFn: () => recruitmentApi.getStats().then(r => r.data),
  })

  const { data: candidatesData, isLoading } = useQuery({
    queryKey: ['candidates', page, search, statusFilter],
    queryFn: () => recruitmentApi.getCandidates({
      page, limit: 15,
      search: search || undefined,
      status: statusFilter || undefined,
    }).then(r => r.data),
  })

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => recruitmentApi.getJobs().then(r => r.data),
  })

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.list().then(r => r.data),
  })

  const { data: candidateDetail } = useQuery({
    queryKey: ['candidate', selectedCandidate?.id],
    queryFn: () => recruitmentApi.getCandidate(selectedCandidate.id).then(r => r.data),
    enabled: !!selectedCandidate?.id,
  })

  // ─── Mutations ──────────────────────────────────────────────────────────────
  const createCandidateMut = useMutation({
    mutationFn: (d: any) => {
      // Strip empty UUID fields that would fail backend validation
      const clean: any = {}
      Object.entries(d).forEach(([k, v]) => { if (v !== '' && v !== null && v !== undefined) clean[k] = v })
      if (!clean.jobOpeningId) delete clean.jobOpeningId
      if (clean.experience) clean.experience = Number(clean.experience)
      if (clean.expectedSalary) clean.expectedSalary = Number(clean.expectedSalary)
      if (clean.noticePeriod) clean.noticePeriod = Number(clean.noticePeriod)
      return recruitmentApi.createCandidate(clean)
    },
    onSuccess: () => { toast.success('Candidate added!'); qc.invalidateQueries({ queryKey: ['candidates'] }); qc.invalidateQueries({ queryKey: ['recruitment-stats'] }); setShowAddCandidate(false); reset() },
  })

  const updateStatusMut = useMutation({
    mutationFn: ({ id, status }: any) => recruitmentApi.updateCandidate(id, { status }),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries({ queryKey: ['candidates'] }); qc.invalidateQueries({ queryKey: ['candidate', selectedCandidate?.id] }); qc.invalidateQueries({ queryKey: ['recruitment-stats'] }) },
  })

  const addCallMut = useMutation({
    mutationFn: ({ id, data }: any) => recruitmentApi.addCall(id, data),
    onSuccess: () => { toast.success('Call logged!'); qc.invalidateQueries({ queryKey: ['candidate', selectedCandidate?.id] }); qc.invalidateQueries({ queryKey: ['candidates'] }); setShowCallModal(false); callForm.reset() },
  })

  const scheduleInterviewMut = useMutation({
    mutationFn: ({ id, data }: any) => recruitmentApi.scheduleInterview(id, data),
    onSuccess: () => { toast.success('Interview scheduled!'); qc.invalidateQueries({ queryKey: ['candidate', selectedCandidate?.id] }); qc.invalidateQueries({ queryKey: ['candidates'] }); setShowInterviewModal(false); interviewForm.reset() },
  })

  const createOfferMut = useMutation({
    mutationFn: ({ id, data }: any) => recruitmentApi.createOffer(id, data),
    onSuccess: () => { toast.success('Offer sent!'); qc.invalidateQueries({ queryKey: ['candidate', selectedCandidate?.id] }); qc.invalidateQueries({ queryKey: ['candidates'] }); setShowOfferModal(false); offerForm.reset() },
  })

  const markJoinedMut = useMutation({
    mutationFn: (id: string) => recruitmentApi.markJoined(id),
    onSuccess: () => { toast.success('🎉 Candidate marked as Joined!'); qc.invalidateQueries({ queryKey: ['candidates'] }); qc.invalidateQueries({ queryKey: ['candidate', selectedCandidate?.id] }); qc.invalidateQueries({ queryKey: ['recruitment-stats'] }) },
  })

  const createJobMut = useMutation({
    mutationFn: (d: any) => {
      const clean: any = {}
      Object.entries(d).forEach(([k, v]) => { if (v !== '' && v !== null && v !== undefined) clean[k] = v })
      if (clean.openings) clean.openings = Number(clean.openings)
      if (!clean.departmentId) { toast.error('Please select a department'); throw new Error('Department required') }
      return recruitmentApi.createJob(clean)
    },
    onSuccess: () => { toast.success('Job opening created!'); qc.invalidateQueries({ queryKey: ['jobs'] }); setShowAddJob(false); jobForm.reset() },
  })

  const deleteCandidateMut = useMutation({
    mutationFn: (id: string) => recruitmentApi.deleteCandidate(id),
    onSuccess: () => { toast.success('Candidate removed'); qc.invalidateQueries({ queryKey: ['candidates'] }); setSelectedCandidate(null) },
  })

  // ─── Pipeline view ──────────────────────────────────────────────────────────
  const candidates = candidatesData?.data || []

  const renderPipeline = () => (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {PIPELINE_STAGES.map(stage => {
        const stageCandidates = candidates.filter((c: any) => stage.statuses.includes(c.status))
        return (
          <div key={stage.key} className="min-w-64 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-700">{stage.label}</h3>
              <span className="text-xs bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded-full">{stageCandidates.length}</span>
            </div>
            <div className="space-y-2">
              {stageCandidates.map((c: any) => (
                <div key={c.id}
                  className="bg-white border border-slate-100 rounded-xl p-3 cursor-pointer hover:shadow-card-hover transition-all"
                  onClick={() => setSelectedCandidate(c)}>
                  <div className="flex items-start gap-2">
                    <Avatar name={c.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{c.name}</p>
                      <p className="text-xs text-slate-400 truncate">{c.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge label={c.status.replace(/_/g, ' ')} color={STATUS_COLORS[c.status] || ''} />
                    {c._count?.calls > 0 && <span className="text-xs text-slate-400 flex items-center gap-1"><Phone className="w-3 h-3" />{c._count.calls}</span>}
                  </div>
                </div>
              ))}
              {stageCandidates.length === 0 && (
                <div className="border-2 border-dashed border-slate-100 rounded-xl p-4 text-center">
                  <p className="text-xs text-slate-300">No candidates</p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )

  return (
    <div>
      <Header title="Recruitment" subtitle="Manage hiring pipeline & candidates" />
      <div className="p-6 space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard title="Total Candidates" value={stats?.total || 0} icon={Users} color="primary" />
          <StatCard title="Active Jobs" value={stats?.activeJobs || 0} icon={Briefcase} color="blue" />
          <StatCard title="In Pipeline" value={stats?.inProgress || 0} icon={TrendingUp} color="violet" />
          <StatCard title="Joined" value={stats?.joined || 0} icon={CheckCircle} color="green" />
          <StatCard title="Today's Interviews" value={stats?.todayInterviews?.length || 0} icon={Calendar} color="orange" />
        </div>

        {/* Today's interviews banner */}
        {stats?.todayInterviews?.length > 0 && (
          <div className="card p-4 border-l-4 border-l-indigo-500 bg-indigo-50/50">
            <p className="text-sm font-bold text-indigo-700 mb-2">📅 Today's Interviews ({stats.todayInterviews.length})</p>
            <div className="flex flex-wrap gap-2">
              {stats.todayInterviews.map((i: any) => (
                <span key={i.id} className="text-xs bg-white border border-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium">
                  {i.candidate?.name} — {new Date(i.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input className="input pl-9" placeholder="Search candidates..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>

          <select className="input max-w-48" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
            <option value="">All Statuses</option>
            {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>

          {/* View toggle */}
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            <button onClick={() => setView('list')} className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-all', view === 'list' ? 'bg-white shadow text-slate-800' : 'text-slate-400')}>List</button>
            <button onClick={() => setView('pipeline')} className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-all', view === 'pipeline' ? 'bg-white shadow text-slate-800' : 'text-slate-400')}>Pipeline</button>
          </div>

          <div className="flex gap-2 ml-auto">
            {isHR && (
              <button className="btn-secondary text-sm" onClick={() => setShowAddJob(true)}>
                <Briefcase className="w-4 h-4" /> Add Job
              </button>
            )}
            {isManager && (
              <button className="btn-primary" onClick={() => setShowAddCandidate(true)}>
                <Plus className="w-4 h-4" /> Add Candidate
              </button>
            )}
          </div>
        </div>

        {/* Active Jobs chips */}
        {jobs.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-slate-400 font-medium py-1">Open roles:</span>
            {jobs.map((j: any) => (
              <button key={j.id} onClick={() => setStatusFilter('')}
                className="text-xs bg-primary-50 text-primary-700 border border-primary-100 px-3 py-1 rounded-full font-medium hover:bg-primary-100 transition-colors">
                {j.title} ({j._count?.candidates})
              </button>
            ))}
          </div>
        )}

        {/* Main content */}
        {view === 'pipeline' ? renderPipeline() : (
          <div className="card">
            {isLoading ? <div className="py-12 text-center"><div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" /></div> : (
              <>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['Candidate', 'Role', 'Source', 'Experience', 'Status', 'Last Activity', ''].map(h => (
                        <th key={h} className="table-th">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {candidates.map((c: any) => (
                      <tr key={c.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => setSelectedCandidate(c)}>
                        <td className="table-td">
                          <div className="flex items-center gap-3">
                            <Avatar name={c.name} size="sm" />
                            <div>
                              <p className="font-semibold text-slate-800 text-sm">{c.name}</p>
                              <p className="text-xs text-slate-400">{c.phone} {c.email && `· ${c.email}`}</p>
                            </div>
                          </div>
                        </td>
                        <td className="table-td">
                          <p className="text-sm font-medium text-slate-700">{c.role}</p>
                          {c.currentCompany && <p className="text-xs text-slate-400">{c.currentCompany}</p>}
                        </td>
                        <td className="table-td text-slate-500 text-sm">{c.source || '—'}</td>
                        <td className="table-td text-sm">{c.experience ? `${c.experience}y` : '—'}</td>
                        <td className="table-td">
                          <Badge label={c.status.replace(/_/g, ' ')} color={STATUS_COLORS[c.status] || ''} />
                        </td>
                        <td className="table-td text-xs text-slate-400">
                          {c.calls?.[0] ? formatDate(c.calls[0].calledAt) : formatDate(c.createdAt)}
                        </td>
                        <td className="table-td">
                          <ChevronRight className="w-4 h-4 text-slate-300" />
                        </td>
                      </tr>
                    ))}
                    {!candidates.length && (
                      <tr><td colSpan={7}>
                        <EmptyState icon={Users} title="No candidates yet" description="Add candidates to start tracking your hiring pipeline"
                          action={isManager && <button className="btn-primary" onClick={() => setShowAddCandidate(true)}><Plus className="w-4 h-4" /> Add Candidate</button>} />
                      </td></tr>
                    )}
                  </tbody>
                </table>
                {candidatesData?.meta && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                    <p className="text-xs text-slate-400">Total {candidatesData.meta.total} candidates</p>
                    <div className="flex gap-1">
                      <button className="btn-secondary h-8 px-3 text-xs" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
                      <button className="btn-secondary h-8 px-3 text-xs" disabled={page === candidatesData.meta.totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ─── Candidate Detail Drawer ────────────────────────────────────────── */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="absolute inset-0 bg-black/20" onClick={() => setSelectedCandidate(null)} />
          <div className="relative w-full max-w-lg bg-white shadow-2xl overflow-y-auto animate-fade-in">
            {candidateDetail ? (
              <>
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-start justify-between z-10">
                  <div className="flex items-center gap-3">
                    <Avatar name={candidateDetail.name} size="md" />
                    <div>
                      <h2 className="font-bold text-slate-800">{candidateDetail.name}</h2>
                      <p className="text-sm text-slate-500">{candidateDetail.role}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedCandidate(null)} className="btn-ghost h-8 w-8 !p-0 rounded-lg">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-6 space-y-5">
                  {/* Status badge + quick actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge label={candidateDetail.status.replace(/_/g, ' ')} color={STATUS_COLORS[candidateDetail.status] || ''} />
                    <div className="flex gap-1.5 ml-auto flex-wrap">
                      {isManager && (
                        <>
                          <button className="btn-secondary h-8 px-3 text-xs gap-1.5" onClick={() => setShowCallModal(true)}>
                            <Phone className="w-3.5 h-3.5" /> Log Call
                          </button>
                          <button className="btn-secondary h-8 px-3 text-xs gap-1.5" onClick={() => setShowInterviewModal(true)}>
                            <Calendar className="w-3.5 h-3.5" /> Schedule Interview
                          </button>
                        </>
                      )}
                      {isHR && candidateDetail.status === 'SELECTED' && (
                        <button className="btn-primary h-8 px-3 text-xs gap-1.5" onClick={() => setShowOfferModal(true)}>
                          <FileText className="w-3.5 h-3.5" /> Send Offer
                        </button>
                      )}
                      {isHR && candidateDetail.status === 'OFFER_ACCEPTED' && (
                        <button className="bg-emerald-600 text-white h-8 px-3 text-xs rounded-lg gap-1.5 flex items-center font-medium hover:bg-emerald-700"
                          onClick={() => markJoinedMut.mutate(candidateDetail.id)}>
                          🎉 Mark as Joined
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Quick status update */}
                  {isManager && (
                    <div>
                      <label className="label">Update Status</label>
                      <select className="input" value={candidateDetail.status}
                        onChange={e => updateStatusMut.mutate({ id: candidateDetail.id, status: e.target.value })}>
                        {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                      </select>
                    </div>
                  )}

                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ['Phone', candidateDetail.phone],
                      ['Email', candidateDetail.email],
                      ['Current Company', candidateDetail.currentCompany],
                      ['Experience', candidateDetail.experience ? `${candidateDetail.experience} years` : null],
                      ['Expected Salary', candidateDetail.expectedSalary ? formatCurrency(candidateDetail.expectedSalary) : null],
                      ['Notice Period', candidateDetail.noticePeriod ? `${candidateDetail.noticePeriod} days` : null],
                      ['Source', candidateDetail.source],
                      ['Location', candidateDetail.location],
                    ].filter(([, v]) => v).map(([k, v]) => (
                      <div key={k as string} className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs text-slate-400 font-medium">{k}</p>
                        <p className="text-sm font-semibold text-slate-700 mt-0.5">{v}</p>
                      </div>
                    ))}
                  </div>

                  {candidateDetail.skills && (
                    <div>
                      <p className="label">Skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {candidateDetail.skills.split(',').map((s: string) => (
                          <span key={s} className="text-xs bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full font-medium">{s.trim()}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Call History */}
                  <div>
                    <p className="label flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5" /> Call History ({candidateDetail.calls?.length || 0})
                    </p>
                    <div className="space-y-2">
                      {candidateDetail.calls?.map((call: any) => (
                        <div key={call.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                          <div className={cn('p-1.5 rounded-lg shrink-0',
                            call.status === 'NO_ANSWER' ? 'bg-red-100' : 'bg-emerald-100')}>
                            {call.status === 'NO_ANSWER'
                              ? <PhoneMissed className="w-3.5 h-3.5 text-red-500" />
                              : <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-700">{call.status.replace(/_/g, ' ')}</span>
                              <span className="text-xs text-slate-400">{formatDateTime(call.calledAt)}</span>
                            </div>
                            {call.notes && <p className="text-xs text-slate-500 mt-0.5">{call.notes}</p>}
                            {call.nextCallDate && <p className="text-xs text-amber-600 mt-0.5">📅 Callback: {formatDate(call.nextCallDate)}</p>}
                          </div>
                        </div>
                      ))}
                      {!candidateDetail.calls?.length && <p className="text-xs text-slate-400 py-2">No calls logged yet</p>}
                    </div>
                  </div>

                  {/* Interviews */}
                  <div>
                    <p className="label flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" /> Interviews ({candidateDetail.interviews?.length || 0})
                    </p>
                    <div className="space-y-2">
                      {candidateDetail.interviews?.map((iv: any) => (
                        <div key={iv.id} className="p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-700">Round {iv.round} — {iv.mode?.replace(/_/g, ' ')}</span>
                            <span className={cn('text-xs font-bold', iv.result === 'PASS' ? 'text-emerald-600' : iv.result === 'FAIL' ? 'text-red-500' : 'text-slate-400')}>
                              {iv.result || 'Pending'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{formatDateTime(iv.scheduledAt)}</p>
                          {iv.rating && (
                            <div className="flex items-center gap-1 mt-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={cn('w-3 h-3', i < iv.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200')} />
                              ))}
                            </div>
                          )}
                          {iv.feedback && <p className="text-xs text-slate-500 mt-1 italic">"{iv.feedback}"</p>}
                        </div>
                      ))}
                      {!candidateDetail.interviews?.length && <p className="text-xs text-slate-400 py-2">No interviews scheduled yet</p>}
                    </div>
                  </div>

                  {/* Offer */}
                  {candidateDetail.offer && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                      <p className="text-xs font-bold text-emerald-700 mb-2">💼 Offer Details</p>
                      <p className="text-lg font-bold text-emerald-800">{formatCurrency(candidateDetail.offer.offeredSalary)}</p>
                      {candidateDetail.offer.joiningDate && (
                        <p className="text-xs text-emerald-600 mt-1">Joining: {formatDate(candidateDetail.offer.joiningDate)}</p>
                      )}
                      <div className="flex gap-2 mt-3">
                        {!candidateDetail.offer.offerAccepted && candidateDetail.offer.offerAccepted !== false && isHR && (
                          <>
                            <button className="btn-primary h-8 px-3 text-xs" onClick={() => recruitmentApi.acceptOffer(candidateDetail.id).then(() => { toast.success('Offer accepted!'); qc.invalidateQueries({ queryKey: ['candidate', candidateDetail.id] }) })}>
                              ✓ Accept
                            </button>
                            <button className="btn-danger h-8 px-3 text-xs" onClick={() => recruitmentApi.rejectOffer(candidateDetail.id).then(() => { toast.success('Offer rejected'); qc.invalidateQueries({ queryKey: ['candidate', candidateDetail.id] }) })}>
                              ✗ Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {candidateDetail.notes && (
                    <div className="bg-amber-50 rounded-xl p-4">
                      <p className="text-xs font-bold text-amber-700 mb-1">Notes</p>
                      <p className="text-sm text-amber-800">{candidateDetail.notes}</p>
                    </div>
                  )}

                  {isHR && (
                    <button className="text-xs text-red-400 hover:text-red-600 mt-4"
                      onClick={() => { if (confirm('Delete this candidate?')) deleteCandidateMut.mutate(candidateDetail.id) }}>
                      Delete Candidate
                    </button>
                  )}
                </div>
              </>
            ) : <div className="flex items-center justify-center h-40"><div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>}
          </div>
        </div>
      )}

      {/* ─── Add Candidate Modal ──────────────────────────────────────────── */}
      <Modal open={showAddCandidate} onClose={() => setShowAddCandidate(false)} title="Add Candidate" width="max-w-2xl">
        <form onSubmit={handleSubmit(d => createCandidateMut.mutate(d))} className="grid grid-cols-2 gap-4">
          <FormField label="Full Name *">
            <input className="input" {...register('name', { required: true })} />
          </FormField>
          <FormField label="Phone *">
            <input className="input" {...register('phone', { required: true })} />
          </FormField>
          <FormField label="Email">
            <input className="input" type="email" {...register('email')} />
          </FormField>
          <FormField label="Role Applied For *">
            <input className="input" {...register('role', { required: true })} placeholder="e.g. Software Engineer" />
          </FormField>
          <FormField label="Job Opening">
            <select className="input" {...register('jobOpeningId')}>
              <option value="">Select job (optional)</option>
              {jobs.map((j: any) => <option key={j.id} value={j.id}>{j.title}</option>)}
            </select>
          </FormField>
          <FormField label="Source">
            <select className="input" {...register('source')}>
              <option value="">Select source</option>
              {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </FormField>
          <FormField label="Current Company">
            <input className="input" {...register('currentCompany')} />
          </FormField>
          <FormField label="Experience (years)">
            <input className="input" type="number" step="0.5" {...register('experience')} />
          </FormField>
          <FormField label="Expected Salary (₹)">
            <input className="input" type="number" {...register('expectedSalary')} />
          </FormField>
          <FormField label="Notice Period (days)">
            <input className="input" type="number" {...register('noticePeriod')} />
          </FormField>
          <FormField label="Skills">
            <input className="input" {...register('skills')} placeholder="React, Node.js, PostgreSQL" />
          </FormField>
          <FormField label="Referred By">
            <input className="input" {...register('referredBy')} />
          </FormField>
          <div className="col-span-2">
            <FormField label="Notes">
              <textarea className="input resize-none h-16" {...register('notes')} />
            </FormField>
          </div>
          <div className="col-span-2 flex justify-end gap-2 pt-2 border-t">
            <button type="button" className="btn-secondary" onClick={() => setShowAddCandidate(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={createCandidateMut.isPending}>
              {createCandidateMut.isPending ? 'Adding...' : 'Add Candidate'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── Log Call Modal ───────────────────────────────────────────────── */}
      <Modal open={showCallModal} onClose={() => setShowCallModal(false)} title={`Log Call — ${selectedCandidate?.name}`}>
        <form onSubmit={callForm.handleSubmit(d => addCallMut.mutate({ id: selectedCandidate?.id, data: d }))} className="space-y-4">
          <FormField label="Call Outcome *">
            <select className="input" {...callForm.register('status', { required: true })}>
              <option value="">Select outcome</option>
              <option value="ANSWERED">✅ Answered</option>
              <option value="NO_ANSWER">📵 No Answer</option>
              <option value="CALLBACK">⏰ Callback Later</option>
              <option value="INTERESTED">🟢 Interested</option>
              <option value="NOT_INTERESTED">🔴 Not Interested</option>
            </select>
          </FormField>
          <FormField label="Notes">
            <textarea className="input resize-none h-24" {...callForm.register('notes')} placeholder="What was discussed..." />
          </FormField>
          <FormField label="Next Call Date (if callback)">
            <input className="input" type="datetime-local" {...callForm.register('nextCallDate')} />
          </FormField>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setShowCallModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={addCallMut.isPending}>Log Call</button>
          </div>
        </form>
      </Modal>

      {/* ─── Schedule Interview Modal ─────────────────────────────────────── */}
      <Modal open={showInterviewModal} onClose={() => setShowInterviewModal(false)} title={`Schedule Interview — ${selectedCandidate?.name}`}>
        <form onSubmit={interviewForm.handleSubmit(d => scheduleInterviewMut.mutate({ id: selectedCandidate?.id, data: d }))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Interview Round">
              <select className="input" {...interviewForm.register('round')}>
                <option value="1">Round 1</option>
                <option value="2">Round 2</option>
                <option value="3">Round 3</option>
                <option value="4">HR Round</option>
              </select>
            </FormField>
            <FormField label="Mode">
              <select className="input" {...interviewForm.register('mode')}>
                <option value="IN_PERSON">In Person</option>
                <option value="VIDEO">Video Call</option>
                <option value="PHONE">Phone</option>
                <option value="TECHNICAL">Technical</option>
                <option value="HR_ROUND">HR Round</option>
              </select>
            </FormField>
          </div>
          <FormField label="Date & Time *">
            <input className="input" type="datetime-local" {...interviewForm.register('scheduledAt', { required: true })} />
          </FormField>
          <FormField label="Meeting Link (for video)">
            <input className="input" {...interviewForm.register('meetingLink')} placeholder="https://meet.google.com/..." />
          </FormField>
          <FormField label="Location (for in-person)">
            <input className="input" {...interviewForm.register('location')} placeholder="Conference Room A" />
          </FormField>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setShowInterviewModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={scheduleInterviewMut.isPending}>Schedule</button>
          </div>
        </form>
      </Modal>

      {/* ─── Send Offer Modal ─────────────────────────────────────────────── */}
      <Modal open={showOfferModal} onClose={() => setShowOfferModal(false)} title={`Send Offer — ${selectedCandidate?.name}`}>
        <form onSubmit={offerForm.handleSubmit(d => createOfferMut.mutate({ id: selectedCandidate?.id, data: { ...d, offeredSalary: Number(d.offeredSalary) } }))} className="space-y-4">
          <FormField label="Offered Salary (₹ per year) *">
            <input className="input" type="number" {...offerForm.register('offeredSalary', { required: true })} placeholder="e.g. 600000" />
          </FormField>
          <FormField label="Proposed Joining Date">
            <input className="input" type="date" {...offerForm.register('joiningDate')} />
          </FormField>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setShowOfferModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={createOfferMut.isPending}>Send Offer</button>
          </div>
        </form>
      </Modal>

      {/* ─── Add Job Modal ────────────────────────────────────────────────── */}
      <Modal open={showAddJob} onClose={() => setShowAddJob(false)} title="Create Job Opening">
        <form onSubmit={jobForm.handleSubmit(d => createJobMut.mutate({ ...d, openings: Number(d.openings) || 1 }))} className="space-y-4">
          <FormField label="Job Title *">
            <input className="input" {...jobForm.register('title', { required: true })} placeholder="e.g. Senior React Developer" />
          </FormField>
          <FormField label="Department *">
            <select className="input" {...jobForm.register('departmentId', { required: true })}>
              <option value="">Select department</option>
              {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Min Salary (₹)">
              <input className="input" type="number" {...jobForm.register('minSalary')} />
            </FormField>
            <FormField label="Max Salary (₹)">
              <input className="input" type="number" {...jobForm.register('maxSalary')} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="No. of Openings">
              <input className="input" type="number" defaultValue={1} {...jobForm.register('openings')} />
            </FormField>
            <FormField label="Closing Date">
              <input className="input" type="date" {...jobForm.register('closingDate')} />
            </FormField>
          </div>
          <FormField label="Description">
            <textarea className="input resize-none h-20" {...jobForm.register('description')} />
          </FormField>
          <FormField label="Requirements">
            <textarea className="input resize-none h-20" {...jobForm.register('requirements')} placeholder="3+ years React, Node.js..." />
          </FormField>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setShowAddJob(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={createJobMut.isPending}>Create Job</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
