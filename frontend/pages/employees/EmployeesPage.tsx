import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Search, Upload, Download, MoreVertical, FileSpreadsheet,
  CheckCircle, XCircle, AlertCircle, KeyRound, Eye, X, User
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { employeesApi, departmentsApi } from '../../services/api'
import { useIsHR } from '../../store/auth'
import Header from '../../components/layout/Header'
import { Avatar, Badge, Modal, FormField, PageLoader, Pagination, Table } from '../../components/ui'
import { employeeStatusColor, formatDate } from '../../utils/helpers'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

// ─── Credentials Modal ────────────────────────────────────────────────────────
function CredentialsModal({ credentials, onClose }: { credentials: any[]; onClose: () => void }) {
  const copyAll = () => {
    const text = credentials.map(c =>
      `${c.name}\nEmail: ${c.email}\nPassword: ${c.password}\nEmp Code: ${c.employeeCode}`
    ).join('\n\n---\n\n')
    navigator.clipboard.writeText(text)
    toast.success('All credentials copied!')
  }
  return (
    <Modal open onClose={onClose} title="✅ Employees Created – Login Credentials" width="max-w-2xl">
      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          Share these credentials with employees. Passwords will NOT be shown again.
        </div>
        {credentials.map((c, i) => (
          <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <p className="font-semibold text-slate-700 mb-2">{c.name}</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-lg p-2.5 border border-slate-100">
                <p className="text-xs text-slate-400 mb-0.5">Emp Code</p>
                <p className="text-sm font-bold text-slate-700">{c.employeeCode}</p>
              </div>
              <div className="bg-white rounded-lg p-2.5 border border-slate-100">
                <p className="text-xs text-slate-400 mb-0.5">Email</p>
                <p className="text-xs font-medium text-slate-700 break-all">{c.email}</p>
              </div>
              <div className="bg-white rounded-lg p-2.5 border border-emerald-100 bg-emerald-50">
                <p className="text-xs text-slate-400 mb-0.5">Password</p>
                <p className="text-sm font-bold text-emerald-700">{c.password}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between pt-4 mt-2 border-t border-slate-100">
        <button onClick={copyAll} className="btn-secondary gap-2">
          <KeyRound className="w-4 h-4" /> Copy All Credentials
        </button>
        <button onClick={onClose} className="btn-primary">Done</button>
      </div>
    </Modal>
  )
}

// ─── Excel Import Modal ───────────────────────────────────────────────────────
function ImportModal({ onClose, departments }: { onClose: () => void; departments: any[] }) {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<any[]>([])
  const [departmentId, setDepartmentId] = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<any>(null)

  const parseExcel = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const data = new Uint8Array(e.target!.result as ArrayBuffer)
      const wb = XLSX.read(data, { type: 'array', cellDates: true })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const raw = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, dateNF: 'yyyy-mm-dd' }) as any[][]

      // Find header row (contains "Emp ID" or "Emp Name")
      let headerRowIdx = -1
      for (let i = 0; i < raw.length; i++) {
        const r = raw[i]
        if (r.some(v => String(v || '').toLowerCase().includes('emp id') || String(v || '').toLowerCase().includes('emp name'))) {
          headerRowIdx = i
          break
        }
      }
      if (headerRowIdx < 0) { toast.error('Could not find header row in Excel'); return }

      const dataRows = raw.slice(headerRowIdx + 2).filter(r => r[2] && r[3]) // empId + name columns
      const parsed = dataRows.map((r: any) => ({
        empId: r[2],
        name: r[3],
        email: r[13],
        phone: r[12],
        joiningDate: r[6],
        dateOfBirth: r[7],
        bloodGroup: r[9],
        designation: r[10],
        emergencyContact: r[14],
        maritalStatus: r[15],
      }))
      setPreview(parsed)
    }
    reader.readAsArrayBuffer(file)
  }

  const handleImport = async () => {
    if (!departmentId) { toast.error('Please select a department'); return }
    if (!preview.length) { toast.error('No data to import'); return }
    setImporting(true)
    try {
      const res = await employeesApi.bulkImport(preview, departmentId)
      setResult(res.data)
      qc.invalidateQueries({ queryKey: ['employees'] })
    } catch (e) {
      toast.error('Import failed')
    } finally {
      setImporting(false)
    }
  }

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      [],
      [],
      [null, null, null, 'Employees Basic Details'],
      [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 'Marital Status'],
      [null, 'Sl.NO', 'Emp ID', 'Emp Name', 'KYC Status', null, 'DOJ', 'DOB', 'Age', 'Blood Group', 'Designation', null, 'Contact Number', 'Email ID', 'Emergency Contact', 'Marital Status'],
      [null, null, null, null, 'Aadhar ID', 'PAN', null, null, null, null, null, null, null, null, null, null],
      [null, 1, 'TB260001', 'John Doe', null, null, '2026-01-01', '1995-05-10', null, 'O+', 'Data Processor', null, '9876543210', 'john.doe@turtlebytes.in', '9876543211', 'Single'],
    ])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
    XLSX.writeFile(wb, 'employee_import_template.xlsx')
  }

  if (result) {
    return (
      <Modal open onClose={onClose} title="Import Results" width="max-w-lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">{result.success?.length || 0}</p>
              <p className="text-sm text-emerald-600 font-medium">✅ Imported</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-red-500">{result.failed?.length || 0}</p>
              <p className="text-sm text-red-500 font-medium">❌ Failed</p>
            </div>
          </div>

          {result.failed?.length > 0 && (
            <div className="bg-red-50 rounded-xl p-3 space-y-1">
              <p className="text-xs font-bold text-red-600 mb-2">Failed entries:</p>
              {result.failed.map((f: any, i: number) => (
                <p key={i} className="text-xs text-red-500">{f.name} — {f.reason}</p>
              ))}
            </div>
          )}

          {result.success?.length > 0 && (
            <div className="max-h-48 overflow-y-auto space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Credentials to share:</p>
              {result.success.map((s: any, i: number) => (
                <div key={i} className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs">
                  <p className="font-semibold">{s.name} — <span className="text-primary-600">{s.employeeCode}</span></p>
                  <p className="text-slate-500">{s.email} / <span className="text-emerald-600 font-medium">{s.password}</span></p>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-secondary" onClick={() => {
              const text = result.success?.map((s: any) =>
                `${s.name}\nEmail: ${s.email}\nPassword: ${s.password}\nCode: ${s.employeeCode}`
              ).join('\n\n---\n\n')
              navigator.clipboard.writeText(text)
              toast.success('Credentials copied!')
            }}>Copy Credentials</button>
            <button className="btn-primary" onClick={onClose}>Done</button>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal open onClose={onClose} title="📥 Import Employees from Excel" width="max-w-3xl">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm text-blue-700 flex-1 mr-3">
            Upload the <strong>basic_details.xlsx</strong> file. The system will parse Emp ID, Name, DOJ, Designation, Email, Phone, Blood Group, and Marital Status automatically.
          </div>
          <button onClick={downloadTemplate} className="btn-secondary gap-2 shrink-0">
            <Download className="w-4 h-4" /> Template
          </button>
        </div>

        <FormField label="Default Department (for imported employees) *">
          <select className="input" value={departmentId} onChange={e => setDepartmentId(e.target.value)}>
            <option value="">Select department</option>
            {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </FormField>

        <div
          className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-primary-300 hover:bg-primary-50/30 transition-all"
          onClick={() => fileRef.current?.click()}
        >
          <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 font-medium">Click to upload Excel file</p>
          <p className="text-sm text-slate-400 mt-1">Supports .xlsx format (basic_details.xlsx)</p>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
            onChange={e => e.target.files?.[0] && parseExcel(e.target.files[0])} />
        </div>

        {preview.length > 0 && (
          <div>
            <p className="text-sm font-bold text-slate-600 mb-2">
              Preview — {preview.length} employees found:
            </p>
            <div className="max-h-56 overflow-y-auto border border-slate-100 rounded-xl">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    {['Emp ID', 'Name', 'Designation', 'Email', 'Phone', 'DOJ', 'Blood Group'].map(h => (
                      <th key={h} className="px-3 py-2 text-left font-semibold text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((r, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="px-3 py-2 font-medium text-slate-700">{r.empId}</td>
                      <td className="px-3 py-2">{r.name}</td>
                      <td className="px-3 py-2 text-slate-500">{r.designation || '—'}</td>
                      <td className="px-3 py-2 text-slate-500 max-w-[140px] truncate">{r.email || '—'}</td>
                      <td className="px-3 py-2 text-slate-500">{r.phone || '—'}</td>
                      <td className="px-3 py-2 text-slate-500">{r.joiningDate || '—'}</td>
                      <td className="px-3 py-2 text-slate-500">{r.bloodGroup || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary gap-2" disabled={!preview.length || !departmentId || importing}
            onClick={handleImport}>
            <Upload className="w-4 h-4" />
            {importing ? 'Importing...' : `Import ${preview.length} Employees`}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function EmployeesPage() {
  const isHR = useIsHR()
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showCredentials, setShowCredentials] = useState(false)
  const [newCredentials, setNewCredentials] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [viewEmployee, setViewEmployee] = useState<any>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['employees', page, search, deptFilter],
    queryFn: () => employeesApi.list({
      page, limit: 15, search: search || undefined,
      departmentId: deptFilter || undefined
    }).then(r => r.data),
  })

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.list().then(r => r.data),
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const createMut = useMutation({
    mutationFn: (d: any) => selected ? employeesApi.update(selected.id, d) : employeesApi.create(d),
    onSuccess: (res) => {
      toast.success(selected ? 'Employee updated!' : 'Employee created!')
      qc.invalidateQueries({ queryKey: ['employees'] })
      setShowModal(false)
      reset()
      if (!selected && res.data?.credentials) {
        setNewCredentials([{ name: `${res.data.employee?.firstName} ${res.data.employee?.lastName}`, ...res.data.credentials }])
        setShowCredentials(true)
      }
      setSelected(null)
    },
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => employeesApi.delete(id),
    onSuccess: () => { toast.success('Employee terminated'); qc.invalidateQueries({ queryKey: ['employees'] }) },
  })

  const openEdit = (emp: any) => {
    setSelected(emp)
    setShowModal(true)
    reset({
      firstName: emp.firstName, lastName: emp.lastName, email: emp.email,
      phone: emp.phone, jobTitle: emp.jobTitle, departmentId: emp.departmentId,
      bloodGroup: emp.bloodGroup, maritalStatus: emp.maritalStatus,
      panNumber: emp.panNumber, aadhaarNumber: emp.aadhaarNumber,
      bankName: emp.bankName, accountNumber: emp.accountNumber, ifscCode: emp.ifscCode,
      emergencyPhone: emp.emergencyPhone, address: emp.address,
      joiningDate: emp.joiningDate?.split('T')[0],
    })
  }

  const openCreate = () => { setSelected(null); reset(); setShowModal(true) }

  return (
    <div>
      <Header title="Employees" subtitle={`${data?.meta?.total || 0} total employees`} />

      <div className="p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input className="input pl-9" placeholder="Search employees..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>
          <select className="input max-w-44" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
            <option value="">All Departments</option>
            {(departments as any[]).map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          {isHR && (
            <div className="ml-auto flex gap-2">
              <button className="btn-secondary gap-2" onClick={() => setShowImport(true)}>
                <FileSpreadsheet className="w-4 h-4" /> Import Excel
              </button>
              <button className="btn-primary gap-2" onClick={openCreate}>
                <Plus className="w-4 h-4" /> Add Employee
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <Table headers={['Employee', 'Department', 'Designation', 'Status', 'Joined', 'Actions']} loading={isLoading}>
            {data?.data?.map((emp: any) => (
              <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="table-td">
                  <div className="flex items-center gap-3">
                    <Avatar name={`${emp.firstName} ${emp.lastName}`} photo={emp.profilePhoto} />
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{emp.firstName} {emp.lastName}</p>
                      <p className="text-xs text-slate-400">{emp.employeeCode} · {emp.email}</p>
                    </div>
                  </div>
                </td>
                <td className="table-td text-slate-500 text-sm">{emp.department?.name}</td>
                <td className="table-td text-sm">{emp.jobTitle}</td>
                <td className="table-td">
                  <Badge label={emp.status} color={employeeStatusColor[emp.status] || ''} />
                </td>
                <td className="table-td text-slate-400 text-sm">{formatDate(emp.joiningDate)}</td>
                <td className="table-td">
                  <div className="flex gap-1">
                    <button className="p-1.5 hover:bg-slate-100 rounded-lg" title="View" onClick={() => setViewEmployee(emp)}>
                      <Eye className="w-4 h-4 text-slate-400" />
                    </button>
                    {isHR && (
                      <>
                        <button className="p-1.5 hover:bg-slate-100 rounded-lg" title="Edit" onClick={() => openEdit(emp)}>
                          <MoreVertical className="w-4 h-4 text-slate-400" />
                        </button>
                        <button className="p-1.5 hover:bg-red-50 rounded-lg" title="Terminate"
                          onClick={() => { if (confirm(`Terminate ${emp.firstName}?`)) deleteMut.mutate(emp.id) }}>
                          <X className="w-4 h-4 text-slate-300 hover:text-red-400" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </Table>
          {data?.meta && (
            <div className="px-4 py-3 border-t border-slate-100">
              <Pagination meta={data.meta} page={page} setPage={setPage} />
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Employee Modal */}
      <Modal open={showModal} onClose={() => { setShowModal(false); setSelected(null) }}
        title={selected ? `Edit — ${selected.firstName} ${selected.lastName}` : 'Add New Employee'}
        width="max-w-3xl">
        <form onSubmit={handleSubmit((d) => createMut.mutate(d))}>
          <div className="grid grid-cols-2 gap-4">
            <p className="col-span-2 text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-2">Personal Info</p>
            <FormField label="First Name *">
              <input className="input" {...register('firstName', { required: true })} />
            </FormField>
            <FormField label="Last Name *">
              <input className="input" {...register('lastName', { required: true })} />
            </FormField>
            <FormField label="Email *">
              <input className="input" type="email" {...register('email', { required: true })} />
            </FormField>
            <FormField label="Phone">
              <input className="input" {...register('phone')} />
            </FormField>
            <FormField label="Date of Birth">
              <input className="input" type="date" {...register('dateOfBirth')} />
            </FormField>
            <FormField label="Gender">
              <select className="input" {...register('gender')}>
                <option value="">Select</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </FormField>
            <FormField label="Blood Group">
              <input className="input" placeholder="e.g. O+" {...register('bloodGroup')} />
            </FormField>
            <FormField label="Marital Status">
              <select className="input" {...register('maritalStatus')}>
                <option value="">Select</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
              </select>
            </FormField>

            <p className="col-span-2 text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-2 pt-2">Employment Info</p>
            <FormField label="Job Title / Designation *">
              <input className="input" {...register('jobTitle', { required: true })} />
            </FormField>
            <FormField label="Department *">
              <select className="input" {...register('departmentId', { required: true })}>
                <option value="">Select department</option>
                {(departments as any[]).map((d: any) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Employment Type">
              <select className="input" {...register('employmentType')}>
                {['FULL_TIME','PART_TIME','CONTRACT','INTERN'].map(t =>
                  <option key={t} value={t}>{t.replace('_', ' ')}</option>
                )}
              </select>
            </FormField>
            <FormField label="Joining Date *">
              <input className="input" type="date" {...register('joiningDate', { required: true })} />
            </FormField>

            <p className="col-span-2 text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-2 pt-2">Identification</p>
            <FormField label="PAN Number">
              <input className="input" placeholder="ABCDE1234F" {...register('panNumber')} />
            </FormField>
            <FormField label="Aadhaar Number">
              <input className="input" placeholder="XXXX XXXX XXXX" {...register('aadhaarNumber')} />
            </FormField>
            <FormField label="PF Number">
              <input className="input" {...register('pfNumber')} />
            </FormField>
            <FormField label="Emergency Contact">
              <input className="input" type="tel" {...register('emergencyPhone')} />
            </FormField>

            <p className="col-span-2 text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-2 pt-2">Bank Details</p>
            <FormField label="Bank Name">
              <input className="input" {...register('bankName')} />
            </FormField>
            <FormField label="Account Number">
              <input className="input" {...register('accountNumber')} />
            </FormField>
            <FormField label="IFSC Code">
              <input className="input" {...register('ifscCode')} />
            </FormField>

            {!selected && (
              <>
                <p className="col-span-2 text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-2 pt-2">Login Setup</p>
                <FormField label="Password" className="col-span-2">
                  <input className="input" type="password" placeholder="Auto-generated if blank"
                    {...register('password')} />
                </FormField>
              </>
            )}

            <div className="col-span-2 flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={createMut.isPending}>
                {createMut.isPending ? 'Saving...' : selected ? 'Update Employee' : 'Create & Get Credentials'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Import Modal */}
      {showImport && (
        <ImportModal onClose={() => setShowImport(false)} departments={departments as any[]} />
      )}

      {/* Credentials Modal */}
      {showCredentials && (
        <CredentialsModal credentials={newCredentials} onClose={() => setShowCredentials(false)} />
      )}

      {/* View Employee Modal */}
      {viewEmployee && (
        <Modal open onClose={() => setViewEmployee(null)}
          title={`${viewEmployee.firstName} ${viewEmployee.lastName}`} width="max-w-2xl">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              ['Employee Code', viewEmployee.employeeCode],
              ['Email', viewEmployee.email],
              ['Phone', viewEmployee.phone],
              ['Department', viewEmployee.department?.name],
              ['Designation', viewEmployee.jobTitle],
              ['Joining Date', formatDate(viewEmployee.joiningDate)],
              ['Blood Group', viewEmployee.bloodGroup],
              ['Marital Status', viewEmployee.maritalStatus],
              ['PAN', viewEmployee.panNumber],
              ['Aadhaar', viewEmployee.aadhaarNumber],
              ['Bank', viewEmployee.bankName],
              ['Account No.', viewEmployee.accountNumber],
              ['IFSC', viewEmployee.ifscCode],
              ['Emergency Phone', viewEmployee.emergencyPhone],
            ].map(([label, val]) => (
              <div key={label as string} className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-0.5">{label}</p>
                <p className="font-medium text-slate-700">{val || '—'}</p>
              </div>
            ))}
            <div className="col-span-2 flex justify-end pt-2">
              {isHR && (
                <button className="btn-secondary" onClick={() => { setViewEmployee(null); openEdit(viewEmployee) }}>
                  Edit Employee
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
