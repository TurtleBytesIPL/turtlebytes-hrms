import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CreditCard, Download } from 'lucide-react'
import { payrollApi } from '../../services/api'
import { useIsHR } from '../../store/auth'
import Header from '../../components/layout/Header'
import { Badge, Table, PageLoader, Pagination, EmptyState, Modal, FormField } from '../../components/ui'
import { formatCurrency, payrollStatusColor, MONTHS } from '../../utils/helpers'
import toast from 'react-hot-toast'

export default function PayrollPage() {
  const isHR = useIsHR()
  const qc = useQueryClient()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [page, setPage] = useState(1)
  const [showSlip, setShowSlip] = useState<any>(null)

  const endpoint = isHR ? payrollApi.list : payrollApi.myPayslips
  const { data, isLoading } = useQuery({
    queryKey: ['payroll', page, year, month, isHR],
    queryFn: () => endpoint({ page, limit: 15, year, month }).then(r => r.data),
  })

  const statusMut = useMutation({
    mutationFn: ({ id, status }: any) => payrollApi.updateStatus(id, status),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries({ queryKey: ['payroll'] }) },
  })

  return (
    <div>
      <Header title="Payroll" subtitle={isHR ? 'Process & manage payroll' : 'Your payslips'} />
      <div className="p-6 space-y-5">

        {/* Filters */}
        <div className="flex gap-2">
          <select className="input max-w-xs" value={month} onChange={e => setMonth(+e.target.value)}>
            {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <select className="input w-24" value={year} onChange={e => setYear(+e.target.value)}>
            {[2023,2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div className="card">
          <Table headers={['Employee', 'Month', 'Gross', 'Deductions', 'Net Salary', 'Status', '']} loading={isLoading}>
            {data?.data?.map((p: any) => (
              <tr key={p.id} className="hover:bg-slate-50/50">
                <td className="table-td">
                  <p className="font-semibold text-slate-800">{p.employee?.firstName} {p.employee?.lastName}</p>
                  <p className="text-xs text-slate-400">{p.employee?.employeeCode}</p>
                </td>
                <td className="table-td text-slate-500">{MONTHS[p.month-1]} {p.year}</td>
                <td className="table-td font-medium">{formatCurrency(p.grossSalary)}</td>
                <td className="table-td text-red-500">−{formatCurrency(p.totalDeductions)}</td>
                <td className="table-td font-bold text-emerald-600">{formatCurrency(p.netSalary)}</td>
                <td className="table-td"><Badge label={p.status} color={payrollStatusColor[p.status] || ''} /></td>
                <td className="table-td">
                  <button className="btn-ghost h-8 px-2 text-xs gap-1" onClick={() => setShowSlip(p)}>
                    <Download className="w-3.5 h-3.5" /> View
                  </button>
                </td>
              </tr>
            ))}
            {!isLoading && !data?.data?.length && (
              <tr><td colSpan={7}><EmptyState icon={CreditCard} title="No payroll records" description="Payroll will appear here once processed" /></td></tr>
            )}
          </Table>
          <Pagination meta={data?.meta} onChange={setPage} />
        </div>
      </div>

      {/* Payslip Modal */}
      <Modal open={!!showSlip} onClose={() => setShowSlip(null)} title="Payslip" width="max-w-2xl">
        {showSlip && (
          <div className="space-y-4">
            <div className="bg-primary-600 rounded-xl p-5 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-lg">{showSlip.employee?.firstName} {showSlip.employee?.lastName}</p>
                  <p className="text-primary-200 text-sm">{showSlip.employee?.department?.name} · {showSlip.employee?.employeeCode}</p>
                </div>
                <div className="text-right">
                  <p className="text-primary-200 text-sm">{MONTHS[showSlip.month-1]} {showSlip.year}</p>
                  <Badge label={showSlip.status} color="bg-white/20 text-white" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-primary-500">
                <p className="text-primary-200 text-xs">Net Salary</p>
                <p className="text-3xl font-bold">{formatCurrency(showSlip.netSalary)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Earnings</p>
                {[
                  ['Basic Salary', showSlip.basicSalary],
                  ['HRA', showSlip.hra],
                  ['Conveyance', showSlip.conveyance],
                  ['Medical', showSlip.medicalAllowance],
                  ['Special Allowance', showSlip.specialAllowance],
                  ...(showSlip.bonus > 0 ? [['Bonus', showSlip.bonus]] : []),
                ].map(([k, v]: any) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-slate-500">{k}</span>
                    <span className="font-medium">{formatCurrency(v)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-bold border-t pt-2 border-slate-100">
                  <span>Gross Salary</span>
                  <span className="text-emerald-600">{formatCurrency(showSlip.grossSalary)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Deductions</p>
                {[
                  ['Provident Fund', showSlip.pf],
                  ['ESI', showSlip.esi],
                  ['Professional Tax', showSlip.professionalTax],
                  ['TDS', showSlip.tds],
                ].filter(([, v]: any) => v > 0).map(([k, v]: any) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-slate-500">{k}</span>
                    <span className="font-medium text-red-500">−{formatCurrency(v)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-bold border-t pt-2 border-slate-100">
                  <span>Total Deductions</span>
                  <span className="text-red-500">−{formatCurrency(showSlip.totalDeductions)}</span>
                </div>
              </div>
            </div>

            {isHR && showSlip.status === 'DRAFT' && (
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button className="btn-primary" onClick={() => { statusMut.mutate({ id: showSlip.id, status: 'PROCESSED' }); setShowSlip(null) }}>
                  Mark Processed
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
