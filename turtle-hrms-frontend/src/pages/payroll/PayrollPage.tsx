import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CreditCard, Download, FileText, TrendingDown, TrendingUp, Building2, User } from 'lucide-react'
import { payrollApi } from '../../services/api'
import { useIsHR } from '../../store/auth'
import Header from '../../components/layout/Header'
import { Badge, Table, PageLoader, Pagination, EmptyState, Modal, FormField } from '../../components/ui'
import { formatCurrency, payrollStatusColor, MONTHS } from '../../utils/helpers'
import toast from 'react-hot-toast'

function SalaryRow({ label, value, red }: { label: string; value: number; red?: boolean }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`text-sm font-semibold ${red ? 'text-red-500' : 'text-slate-700'}`}>
        {red ? '−' : ''}{formatCurrency(value)}
      </span>
    </div>
  )
}

function PayslipModal({ slip, onClose, onMarkProcessed, isHR }: any) {
  const handlePrint = () => {
    window.print()
  }

  return (
    <Modal open onClose={onClose} title="Payslip Details" width="max-w-2xl">
      <div className="space-y-5" id="payslip-print">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-primary-200 text-xs font-medium uppercase tracking-widest mb-1">Pay Slip</p>
              <p className="font-bold text-xl">{slip.employee?.firstName} {slip.employee?.lastName}</p>
              <p className="text-primary-200 text-sm mt-0.5">{slip.employee?.employeeCode}</p>
              {slip.employee?.department?.name && (
                <div className="flex items-center gap-1.5 mt-2 text-primary-200 text-sm">
                  <Building2 className="w-3.5 h-3.5" />
                  {slip.employee.department.name}
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-primary-200 text-sm">{MONTHS[slip.month - 1]} {slip.year}</p>
              <span className="inline-block mt-1 px-2.5 py-1 rounded-full bg-white/20 text-xs font-semibold">{slip.status}</span>
              <div className="mt-4">
                <p className="text-primary-200 text-xs uppercase tracking-wide">Net Take Home</p>
                <p className="text-3xl font-bold">{formatCurrency(slip.netSalary)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          {/* Earnings */}
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
              <div className="p-1.5 bg-emerald-50 rounded-lg"><TrendingUp className="w-4 h-4 text-emerald-500" /></div>
              <p className="font-bold text-slate-700 text-sm">Earnings</p>
            </div>
            <SalaryRow label="Basic Salary" value={slip.basicSalary} />
            <SalaryRow label="HRA" value={slip.hra} />
            <SalaryRow label="Conveyance Allowance" value={slip.conveyance} />
            <SalaryRow label="Medical Allowance" value={slip.medicalAllowance} />
            <SalaryRow label="Special Allowance" value={slip.specialAllowance} />
            <SalaryRow label="Other Allowances" value={slip.otherAllowances} />
            {slip.bonus > 0 && <SalaryRow label="Bonus" value={slip.bonus} />}
            {slip.incentives > 0 && <SalaryRow label="Incentives" value={slip.incentives} />}
            <div className="flex justify-between items-center pt-3 mt-1 border-t-2 border-emerald-200">
              <span className="text-sm font-bold text-slate-700">Gross Salary</span>
              <span className="text-base font-bold text-emerald-600">{formatCurrency(slip.grossSalary)}</span>
            </div>
          </div>

          {/* Deductions */}
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
              <div className="p-1.5 bg-red-50 rounded-lg"><TrendingDown className="w-4 h-4 text-red-400" /></div>
              <p className="font-bold text-slate-700 text-sm">Deductions</p>
            </div>
            <SalaryRow label="Provident Fund (PF 12%)" value={slip.pf} red />
            <SalaryRow label="ESI" value={slip.esi} red />
            <SalaryRow label="Professional Tax" value={slip.professionalTax} red />
            {slip.tds > 0 && <SalaryRow label="TDS" value={slip.tds} red />}
            {slip.lopDays > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-sm text-slate-500">LOP ({slip.lopDays} days)</span>
                <span className="text-sm font-semibold text-red-500">−{formatCurrency(slip.lopDeduction || 0)}</span>
              </div>
            )}
            {slip.otherDeductions > 0 && <SalaryRow label="Other Deductions" value={slip.otherDeductions} red />}
            <div className="flex justify-between items-center pt-3 mt-1 border-t-2 border-red-200">
              <span className="text-sm font-bold text-slate-700">Total Deductions</span>
              <span className="text-base font-bold text-red-500">−{formatCurrency(slip.totalDeductions)}</span>
            </div>
          </div>
        </div>

        {/* Net Summary */}
        <div className="bg-slate-50 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex gap-6 text-sm">
                <div>
                  <p className="text-slate-400 text-xs">Gross</p>
                  <p className="font-semibold text-slate-700">{formatCurrency(slip.grossSalary)}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Total Deductions</p>
                  <p className="font-semibold text-red-500">−{formatCurrency(slip.totalDeductions)}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Working Days</p>
                  <p className="font-semibold text-slate-700">{slip.workingDays || '—'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Paid Days</p>
                  <p className="font-semibold text-slate-700">{slip.paidDays || '—'}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 uppercase tracking-wide">Net Take Home</p>
              <p className="text-2xl font-bold text-primary-600">{formatCurrency(slip.netSalary)}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-1">
          <button onClick={handlePrint} className="btn-secondary gap-2 text-sm">
            <Download className="w-4 h-4" /> Print / Save PDF
          </button>
          {isHR && slip.status === 'DRAFT' && (
            <button className="btn-primary" onClick={() => { onMarkProcessed(slip.id); onClose() }}>
              ✓ Mark as Processed
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}

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
    queryFn: () => endpoint({ page, limit: 15, year, month }).then((r: any) => r.data),
  })

  const statusMut = useMutation({
    mutationFn: ({ id, status }: any) => payrollApi.updateStatus(id, status),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries({ queryKey: ['payroll'] }) },
  })

  const records = data?.data || []
  const totalGross = records.reduce((s: number, p: any) => s + (p.grossSalary || 0), 0)
  const totalDeductions = records.reduce((s: number, p: any) => s + (p.totalDeductions || 0), 0)
  const totalNet = records.reduce((s: number, p: any) => s + (p.netSalary || 0), 0)

  return (
    <div>
      <Header title="Payroll" subtitle={isHR ? 'Salary & payslip management' : 'Your salary details'} />
      <div className="p-6 space-y-5">

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <select className="input" value={month} onChange={e => setMonth(+e.target.value)}>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select className="input w-28" value={year} onChange={e => setYear(+e.target.value)}>
            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* HR Summary Cards */}
        {isHR && records.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4 text-center">
              <p className="text-xs text-slate-400 mb-1">Total Gross</p>
              <p className="text-xl font-bold text-slate-700">{formatCurrency(totalGross)}</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-xs text-slate-400 mb-1">Total Deductions</p>
              <p className="text-xl font-bold text-red-500">−{formatCurrency(totalDeductions)}</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-xs text-slate-400 mb-1">Total Net Payout</p>
              <p className="text-xl font-bold text-emerald-600">{formatCurrency(totalNet)}</p>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="card">
          <Table
            headers={isHR
              ? ['Employee', 'Period', 'Basic', 'Gross', 'PF', 'ESI', 'Prof Tax', 'Total Ded.', 'Net Salary', 'Status', '']
              : ['Period', 'Basic', 'Gross', 'PF', 'Prof Tax', 'Total Ded.', 'Net Salary', 'Status', '']}
            loading={isLoading}
          >
            {records.map((p: any) => (
              <tr key={p.id} className="hover:bg-slate-50/50 cursor-pointer" onClick={() => setShowSlip(p)}>
                {isHR && (
                  <td className="table-td">
                    <p className="font-semibold text-slate-800">{p.employee?.firstName} {p.employee?.lastName}</p>
                    <p className="text-xs text-slate-400">{p.employee?.employeeCode} · {p.employee?.department?.name}</p>
                  </td>
                )}
                <td className="table-td text-slate-500 whitespace-nowrap">{MONTHS[p.month - 1]} {p.year}</td>
                <td className="table-td">{formatCurrency(p.basicSalary)}</td>
                <td className="table-td font-medium text-slate-700">{formatCurrency(p.grossSalary)}</td>
                <td className="table-td text-red-400">{formatCurrency(p.pf)}</td>
                {isHR && <td className="table-td text-red-400">{formatCurrency(p.esi)}</td>}
                <td className="table-td text-red-400">{formatCurrency(p.professionalTax)}</td>
                <td className="table-td font-medium text-red-500">−{formatCurrency(p.totalDeductions)}</td>
                <td className="table-td font-bold text-emerald-600">{formatCurrency(p.netSalary)}</td>
                <td className="table-td"><Badge label={p.status} color={payrollStatusColor[p.status] || ''} /></td>
                <td className="table-td">
                  <button className="btn-ghost h-8 px-2 text-xs gap-1" onClick={e => { e.stopPropagation(); setShowSlip(p) }}>
                    <FileText className="w-3.5 h-3.5" /> View Slip
                  </button>
                </td>
              </tr>
            ))}
            {!isLoading && !records.length && (
              <tr><td colSpan={11}>
                <EmptyState icon={CreditCard} title="No payroll records" description={`No payroll processed for ${MONTHS[month - 1]} ${year}`} />
              </td></tr>
            )}
          </Table>
          <Pagination meta={data?.meta} onChange={setPage} />
        </div>
      </div>

      {showSlip && (
        <PayslipModal slip={showSlip} onClose={() => setShowSlip(null)} isHR={isHR}
          onMarkProcessed={(id: string) => statusMut.mutate({ id, status: 'PROCESSED' })} />
      )}
    </div>
  )
}
