import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, CheckCircle, XCircle, Calendar } from 'lucide-react'
import { leavesApi } from '../../services/api'
import { useAuthStore, useIsManager } from '../../store/auth'
import Header from '../../components/layout/Header'
import { Badge, Modal, FormField, PageLoader, Table, Pagination, EmptyState } from '../../components/ui'
import { leaveStatusColor, formatDate } from '../../utils/helpers'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

const LEAVE_TYPES = ['ANNUAL','SICK','CASUAL','MATERNITY','PATERNITY','UNPAID','COMPENSATORY','OTHER']

export default function LeavesPage() {
  const { user } = useAuthStore()
  const isManager = useIsManager()
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [showApply, setShowApply] = useState(false)
  const [approveLeave, setApproveLeave] = useState<any>(null)
  const { register, handleSubmit, reset } = useForm()

  const { data, isLoading } = useQuery({
    queryKey: ['leaves', page],
    queryFn: () => leavesApi.list({ page, limit: 15 }).then(r => r.data),
  })

  const { data: balances } = useQuery({
    queryKey: ['leave-balances'],
    queryFn: () => leavesApi.myBalances().then(r => r.data),
  })

  const applyMut = useMutation({
    mutationFn: (d: any) => leavesApi.apply(d),
    onSuccess: () => { toast.success('Leave applied!'); qc.invalidateQueries({ queryKey: ['leaves'] }); qc.invalidateQueries({ queryKey: ['leave-balances'] }); setShowApply(false); reset() },
  })

  const approveMut = useMutation({
    mutationFn: ({ id, status, remarks }: any) => leavesApi.approve(id, { status, remarks }),
    onSuccess: () => { toast.success('Leave updated!'); qc.invalidateQueries({ queryKey: ['leaves'] }); setApproveLeave(null) },
  })

  const cancelMut = useMutation({
    mutationFn: (id: string) => leavesApi.cancel(id),
    onSuccess: () => { toast.success('Leave cancelled'); qc.invalidateQueries({ queryKey: ['leaves'] }) },
  })

  return (
    <div>
      <Header title="Leaves" subtitle="Manage your leave requests" />
      <div className="p-6 space-y-5">

        {/* Leave balances */}
        {balances?.length > 0 && (
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
            {balances.map((b: any) => (
              <div key={b.id} className="card p-3 text-center">
                <p className="text-xs text-slate-400 truncate">{b.leaveType.replace('_', ' ')}</p>
                <p className="text-xl font-bold text-slate-800">{b.allocated - b.used - b.pending}</p>
                <p className="text-xs text-slate-400">/{b.allocated}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end">
          <button className="btn-primary" onClick={() => setShowApply(true)}>
            <Plus className="w-4 h-4" /> Apply Leave
          </button>
        </div>

        <div className="card">
          <Table headers={['Employee', 'Type', 'Dates', 'Days', 'Status', 'Actions']} loading={isLoading}>
            {data?.data?.map((leave: any) => (
              <tr key={leave.id} className="hover:bg-slate-50/50">
                <td className="table-td">
                  <p className="font-medium text-slate-800">{leave.employee?.firstName} {leave.employee?.lastName}</p>
                  <p className="text-xs text-slate-400">{leave.reason}</p>
                </td>
                <td className="table-td"><Badge label={leave.leaveType} color="bg-blue-100 text-blue-700" /></td>
                <td className="table-td text-slate-500">
                  {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
                </td>
                <td className="table-td font-semibold">{leave.totalDays}d</td>
                <td className="table-td"><Badge label={leave.status} color={leaveStatusColor[leave.status] || ''} /></td>
                <td className="table-td">
                  <div className="flex gap-1">
                    {isManager && leave.status === 'PENDING' && (
                      <>
                        <button className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors" title="Approve"
                          onClick={() => setApproveLeave({ ...leave, action: 'APPROVED' })}>
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors" title="Reject"
                          onClick={() => setApproveLeave({ ...leave, action: 'REJECTED' })}>
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {leave.employeeId === user?.employee?.id && leave.status === 'PENDING' && (
                      <button className="text-xs text-slate-400 hover:text-red-500 px-2 py-1 rounded"
                        onClick={() => cancelMut.mutate(leave.id)}>Cancel</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && !data?.data?.length && (
              <tr><td colSpan={6}><EmptyState icon={Calendar} title="No leave requests" description="Apply for leave using the button above" /></td></tr>
            )}
          </Table>
          <Pagination meta={data?.meta} onChange={setPage} />
        </div>
      </div>

      {/* Apply Modal */}
      <Modal open={showApply} onClose={() => setShowApply(false)} title="Apply for Leave">
        <form onSubmit={handleSubmit(d => applyMut.mutate(d))} className="space-y-4">
          <FormField label="Leave Type">
            <select className="input" {...register('leaveType', { required: true })}>
              <option value="">Select type</option>
              {LEAVE_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Start Date">
              <input type="date" className="input" {...register('startDate', { required: true })} />
            </FormField>
            <FormField label="End Date">
              <input type="date" className="input" {...register('endDate', { required: true })} />
            </FormField>
          </div>
          <FormField label="Reason">
            <textarea className="input resize-none h-20" {...register('reason', { required: true })} placeholder="Reason for leave..." />
          </FormField>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setShowApply(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={applyMut.isPending}>Apply</button>
          </div>
        </form>
      </Modal>

      {/* Approve/Reject Modal */}
      <Modal open={!!approveLeave} onClose={() => setApproveLeave(null)}
        title={approveLeave?.action === 'APPROVED' ? 'Approve Leave' : 'Reject Leave'}>
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            {approveLeave?.action === 'APPROVED' ? 'Approve' : 'Reject'} leave for{' '}
            <strong>{approveLeave?.employee?.firstName} {approveLeave?.employee?.lastName}</strong>?
          </p>
          <FormField label="Remarks (optional)">
            <textarea className="input resize-none h-20" id="remarks" placeholder="Add any remarks..." />
          </FormField>
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={() => setApproveLeave(null)}>Cancel</button>
            <button
              className={approveLeave?.action === 'APPROVED' ? 'btn-primary' : 'btn-danger'}
              disabled={approveMut.isPending}
              onClick={() => approveMut.mutate({
                id: approveLeave.id,
                status: approveLeave.action,
                remarks: (document.getElementById('remarks') as HTMLTextAreaElement)?.value,
              })}>
              {approveLeave?.action === 'APPROVED' ? 'Approve' : 'Reject'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
