import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { User, MapPin, CreditCard, Building2, Phone, Mail, Calendar, Edit2, Save, X, FileText, CheckCircle, Clock, XCircle } from 'lucide-react'
import { employeesApi, documentsApi } from '../../services/api'
import { useAuthStore, useIsHR } from '../../store/auth'
import Header from '../../components/layout/Header'
import { Avatar, Badge, FormField, PageLoader, Modal } from '../../components/ui'
import { formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'

const DOC_TYPES: Record<string, string> = {
  RESUME: 'Resume', PAN_CARD: 'PAN Card', AADHAAR: 'Aadhaar Card',
  BANK_DETAILS: 'Bank Details', OFFER_LETTER: 'Offer Letter',
  APPOINTMENT_LETTER: 'Appointment Letter', EXPERIENCE_LETTER: 'Experience Letter',
  RELIEVING_LETTER: 'Relieving Letter', EDUCATION_CERTIFICATE: 'Education Certificate', OTHER: 'Other',
}

const DOC_STATUS_ICON: Record<string, any> = {
  VERIFIED: <CheckCircle className="w-4 h-4 text-emerald-500" />,
  PENDING:  <Clock className="w-4 h-4 text-amber-500" />,
  REJECTED: <XCircle className="w-4 h-4 text-red-500" />,
}

const DOC_STATUS_COLOR: Record<string, string> = {
  VERIFIED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  PENDING:  'bg-amber-50 text-amber-700 border-amber-100',
  REJECTED: 'bg-red-50 text-red-600 border-red-100',
}

// ─── Info Row ────────────────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="py-3 border-b border-slate-50 last:border-0">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm font-medium text-slate-700">{value || <span className="text-slate-300 italic">Not provided</span>}</p>
    </div>
  )
}

// ─── Section Card ────────────────────────────────────────────────────────────
function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
        <div className="p-1.5 bg-primary-50 rounded-lg"><Icon className="w-4 h-4 text-primary-600" /></div>
        <h3 className="font-bold text-slate-700">{title}</h3>
      </div>
      {children}
    </div>
  )
}

export default function ProfilePage() {
  const { user } = useAuthStore()
  const isHR = useIsHR()
  const qc = useQueryClient()

  // If HR views their own profile use their employee id
  // If employee views their profile use their employee id
  const empId = user?.employee?.id || ''

  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState<any>({})
  const [showDocUpload, setShowDocUpload] = useState(false)
  const [docForm, setDocForm] = useState({ type: 'AADHAAR', name: '', fileUrl: '' })

  const { data: employee, isLoading } = useQuery({
    queryKey: ['my-profile', empId],
    queryFn: () => employeesApi.get(empId).then(r => r.data),
    enabled: !!empId,
  })

  const { data: docs = [] } = useQuery({
    queryKey: ['my-documents', empId],
    queryFn: () => documentsApi.getEmployee(empId).then(r => r.data),
    enabled: !!empId,
  })

  const updateMut = useMutation({
    mutationFn: (data: any) => employeesApi.update(empId, data),
    onSuccess: () => {
      toast.success('Profile updated!')
      qc.invalidateQueries({ queryKey: ['my-profile', empId] })
      setEditMode(false)
    },
  })

  const uploadDocMut = useMutation({
    mutationFn: (data: any) => documentsApi.upload(empId, data),
    onSuccess: () => {
      toast.success('Document uploaded!')
      qc.invalidateQueries({ queryKey: ['my-documents', empId] })
      setShowDocUpload(false)
      setDocForm({ type: 'AADHAAR', name: '', fileUrl: '' })
    },
  })

  const startEdit = () => {
    setEditData({
      address: employee?.address || '',
      city: employee?.city || '',
      state: employee?.state || '',
      pincode: employee?.pincode || '',
      panNumber: employee?.panNumber || '',
      bankName: employee?.bankName || '',
      accountNumber: employee?.accountNumber || '',
      ifscCode: employee?.ifscCode || '',
    })
    setEditMode(true)
  }

  if (!empId) {
    return (
      <div className="p-6">
        <div className="card p-12 text-center">
          <User className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400">No employee profile linked to your account.</p>
          <p className="text-sm text-slate-300 mt-1">Contact HR to set up your profile.</p>
        </div>
      </div>
    )
  }

  if (isLoading) return <PageLoader />

  const emp = employee

  return (
    <div>
      <Header
        title="My Profile"
        subtitle={emp ? `${emp.firstName} ${emp.lastName} · ${emp.employeeCode}` : 'Profile'}
      />

      <div className="p-6 space-y-4">

        {/* Profile Header */}
        <div className="card p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Avatar name={`${emp?.firstName} ${emp?.lastName}`} photo={emp?.profilePhoto} size="lg" />
              <div>
                <h2 className="text-xl font-bold text-slate-800">{emp?.firstName} {emp?.lastName}</h2>
                <p className="text-slate-500">{emp?.jobTitle}</p>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className="text-xs bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full font-medium border border-primary-100">
                    {emp?.employeeCode}
                  </span>
                  <span className="text-xs bg-slate-50 text-slate-600 px-2.5 py-1 rounded-full font-medium border border-slate-100">
                    {emp?.department?.name}
                  </span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                    emp?.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-100'
                  }`}>
                    {emp?.status}
                  </span>
                </div>
              </div>
            </div>
            {/* Only HR can edit — employees view only */}
            {isHR && !editMode && (
              <button onClick={startEdit} className="btn-secondary gap-2">
                <Edit2 className="w-4 h-4" /> Edit Profile
              </button>
            )}
            {isHR && editMode && (
              <div className="flex gap-2">
                <button onClick={() => setEditMode(false)} className="btn-secondary gap-2">
                  <X className="w-4 h-4" /> Cancel
                </button>
                <button onClick={() => updateMut.mutate(editData)} disabled={updateMut.isPending} className="btn-primary gap-2">
                  <Save className="w-4 h-4" /> {updateMut.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>

          {/* Read-only notice for employees */}
          {!isHR && (
            <div className="mt-4 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              <span>🔒</span>
              <span>Your profile is view-only. Contact HR to update any details.</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Personal Info */}
          <Section title="Personal Information" icon={User}>
            {editMode ? (
              <div className="space-y-3">
                <FormField label="Current Address">
                  <input className="input" value={editData.address} onChange={e => setEditData((d: any) => ({ ...d, address: e.target.value }))} />
                </FormField>
                <FormField label="City">
                  <input className="input" value={editData.city} onChange={e => setEditData((d: any) => ({ ...d, city: e.target.value }))} />
                </FormField>
                <FormField label="State">
                  <input className="input" value={editData.state} onChange={e => setEditData((d: any) => ({ ...d, state: e.target.value }))} />
                </FormField>
                <FormField label="Pincode">
                  <input className="input" value={editData.pincode} onChange={e => setEditData((d: any) => ({ ...d, pincode: e.target.value }))} />
                </FormField>
              </div>
            ) : (
              <>
                <InfoRow label="First Name" value={emp?.firstName} />
                <InfoRow label="Last Name" value={emp?.lastName} />
                <InfoRow label="Email" value={emp?.email} />
                <InfoRow label="Phone" value={emp?.phone} />
                <InfoRow label="Date of Birth" value={emp?.dateOfBirth ? formatDate(emp.dateOfBirth) : null} />
                <InfoRow label="Gender" value={emp?.gender} />
                <InfoRow label="Joining Date" value={formatDate(emp?.joiningDate)} />
              </>
            )}
          </Section>

          {/* Address */}
          <Section title="Address" icon={MapPin}>
            {editMode ? (
              <p className="text-xs text-slate-400">Edit address fields on the left panel.</p>
            ) : (
              <>
                <InfoRow label="Current Address" value={[emp?.address, emp?.city, emp?.state, emp?.pincode].filter(Boolean).join(', ')} />
                <InfoRow label="Country" value={emp?.country || 'India'} />
                <InfoRow label="Emergency Contact" value={emp?.emergencyContact} />
              </>
            )}
          </Section>

          {/* Identification */}
          <Section title="Identification Details" icon={CreditCard}>
            {editMode ? (
              <FormField label="PAN Number">
                <input className="input" value={editData.panNumber} onChange={e => setEditData((d: any) => ({ ...d, panNumber: e.target.value }))} />
              </FormField>
            ) : (
              <>
                <InfoRow label="PAN Number" value={emp?.panNumber} />
                <InfoRow label="Aadhaar" value={emp?.aadhaarNumber} />
                <InfoRow label="PF Number" value={emp?.pfNumber} />
              </>
            )}
          </Section>

          {/* Bank Details */}
          <Section title="Bank Details" icon={Building2}>
            {editMode ? (
              <div className="space-y-3">
                <FormField label="Bank Name">
                  <input className="input" value={editData.bankName} onChange={e => setEditData((d: any) => ({ ...d, bankName: e.target.value }))} />
                </FormField>
                <FormField label="Account Number">
                  <input className="input" value={editData.accountNumber} onChange={e => setEditData((d: any) => ({ ...d, accountNumber: e.target.value }))} />
                </FormField>
                <FormField label="IFSC Code">
                  <input className="input" value={editData.ifscCode} onChange={e => setEditData((d: any) => ({ ...d, ifscCode: e.target.value }))} />
                </FormField>
              </div>
            ) : (
              <>
                <InfoRow label="Bank Name" value={emp?.bankName} />
                <InfoRow label="Account Number" value={emp?.accountNumber} />
                <InfoRow label="IFSC Code" value={emp?.ifscCode} />
              </>
            )}
          </Section>

          {/* Employment Info */}
          <Section title="Employment Details" icon={Building2}>
            <InfoRow label="Employee Code" value={emp?.employeeCode} />
            <InfoRow label="Department" value={emp?.department?.name} />
            <InfoRow label="Job Title" value={emp?.jobTitle} />
            <InfoRow label="Employment Type" value={emp?.employmentType?.replace('_', ' ')} />
            <InfoRow label="Manager" value={emp?.manager ? `${emp.manager.firstName} ${emp.manager.lastName}` : null} />
          </Section>

          {/* Documents */}
          <Section title="My Documents" icon={FileText}>
            <div className="space-y-2 mb-3">
              {(docs as any[]).length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No documents uploaded yet</p>
              ) : (docs as any[]).map((doc: any) => (
                <div key={doc.id} className={`flex items-center gap-3 p-3 rounded-xl border ${DOC_STATUS_COLOR[doc.status] || 'border-slate-100'}`}>
                  <FileText className="w-4 h-4 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{doc.name}</p>
                    <p className="text-xs opacity-70">{DOC_TYPES[doc.type] || doc.type}</p>
                  </div>
                  {DOC_STATUS_ICON[doc.status]}
                  <a href={doc.fileUrl} target="_blank" rel="noreferrer"
                    className="text-xs underline opacity-70 hover:opacity-100">View</a>
                  {/* Allow re-upload only if rejected */}
                  {doc.status === 'REJECTED' && (
                    <span className="text-xs text-red-500 font-medium">Re-upload needed</span>
                  )}
                </div>
              ))}
            </div>
            <button onClick={() => setShowDocUpload(true)} className="btn-secondary w-full text-sm gap-2">
              <FileText className="w-4 h-4" /> Upload Document
            </button>
          </Section>
        </div>
      </div>

      {/* Document Upload Modal */}
      <Modal open={showDocUpload} onClose={() => setShowDocUpload(false)} title="Upload Document" width="max-w-md">
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
            📄 Upload PDF files only. HR will verify your documents.
          </div>
          <FormField label="Document Type *">
            <select className="input" value={docForm.type} onChange={e => setDocForm(f => ({ ...f, type: e.target.value }))}>
              {Object.entries(DOC_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </FormField>
          <FormField label="Document Name *">
            <input className="input" placeholder="e.g. Aadhaar Card Front" value={docForm.name}
              onChange={e => setDocForm(f => ({ ...f, name: e.target.value }))} />
          </FormField>
          <FormField label="File URL (Google Drive / Cloud link) *">
            <input className="input" placeholder="https://drive.google.com/..." value={docForm.fileUrl}
              onChange={e => setDocForm(f => ({ ...f, fileUrl: e.target.value }))} />
          </FormField>
          <p className="text-xs text-slate-400">
            💡 Upload your PDF to Google Drive and paste the shareable link here.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-secondary" onClick={() => setShowDocUpload(false)}>Cancel</button>
            <button className="btn-primary" disabled={uploadDocMut.isPending || !docForm.name || !docForm.fileUrl}
              onClick={() => uploadDocMut.mutate(docForm)}>
              {uploadDocMut.isPending ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
