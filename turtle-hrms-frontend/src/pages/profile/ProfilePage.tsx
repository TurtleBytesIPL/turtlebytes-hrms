import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  User, MapPin, CreditCard, Edit2, Save, X,
  FileText, CheckCircle, Clock, XCircle, Briefcase, AlertCircle, Shield,
  Camera, Trash2, Download, ZoomIn,
} from 'lucide-react'
import { employeesApi, documentsApi } from '../../services/api'
import { useAuthStore, useIsHR } from '../../store/auth'
import Header from '../../components/layout/Header'
import { FormField, PageLoader, Modal } from '../../components/ui'
import { formatDate, getInitials, avatarColor } from '../../utils/helpers'
import toast from 'react-hot-toast'
import { cn } from '../../utils/helpers'

const DOC_TYPE_LABELS: Record<string, string> = {
  AADHAAR: 'Aadhaar Card', PAN_CARD: 'PAN Card', MARKSHEET_10TH: '10th Marksheet',
  MARKSHEET_12TH: '12th Marksheet', DEGREE_CERTIFICATE: 'Degree Certificate',
  PAYSLIP: 'Payslip', EXPERIENCE_LETTER: 'Experience Letter',
  RESUME: 'Resume', OFFER_LETTER: 'Offer Letter',
  BANK_DETAILS: 'Bank Details', OTHER: 'Other', PROFILE_PHOTO: 'Profile Photo',
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between items-start py-2.5 border-b border-slate-50 last:border-0 gap-3">
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide shrink-0">{label}</span>
      <span className="text-sm font-medium text-slate-700 text-right">
        {value || <span className="text-slate-300 italic text-xs">—</span>}
      </span>
    </div>
  )
}

function SectionCard({ title, icon: Icon, children, action }: {
  title: string; icon: any; children: React.ReactNode; action?: React.ReactNode
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary-50 rounded-lg">
            <Icon className="w-4 h-4 text-primary-600" />
          </div>
          <h3 className="font-bold text-slate-700 text-sm">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

// ─── LinkedIn-style Avatar ────────────────────────────────────────────────────
function ProfileAvatar({ emp, isOwnProfile, onUpload, onView, onDelete }: {
  emp: any; isOwnProfile: boolean
  onUpload: () => void; onView: () => void; onDelete: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const fullName = `${emp.firstName} ${emp.lastName}`

  return (
    <div className="relative shrink-0"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg cursor-pointer relative"
        onClick={emp.profilePhoto ? onView : (isOwnProfile ? onUpload : undefined)}
      >
        {emp.profilePhoto ? (
          <img src={emp.profilePhoto} alt={fullName} className="w-full h-full object-cover" />
        ) : (
          <div className={cn('w-full h-full flex items-center justify-center text-xl font-bold text-white', avatarColor(fullName))}>
            {getInitials(fullName)}
          </div>
        )}
        {emp.profilePhoto && (
          <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity rounded-full ${hovered ? 'opacity-100' : 'opacity-0'}`}>
            <ZoomIn className="w-6 h-6 text-white" />
          </div>
        )}
      </div>
      {isOwnProfile && (
        <button
          onClick={onUpload}
          className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary-600 hover:bg-primary-700 rounded-full flex items-center justify-center border-2 border-white shadow transition-all"
          title="Change photo"
        >
          <Camera className="w-3.5 h-3.5 text-white" />
        </button>
      )}
    </div>
  )
}

// ─── Photo Viewer Modal ────────────────────────────────────────────────────────
function PhotoViewerModal({ emp, isOwnProfile, onClose, onChangePhoto, onDelete }: {
  emp: any; isOwnProfile: boolean; onClose: () => void
  onChangePhoto: () => void; onDelete: () => void
}) {
  const fullName = `${emp.firstName} ${emp.lastName}`
  return (
    <Modal open onClose={onClose} title="Profile Photo" width="max-w-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="w-56 h-56 rounded-full overflow-hidden border-4 border-slate-100 shadow-xl">
          <img src={emp.profilePhoto} alt={fullName} className="w-full h-full object-cover" />
        </div>
        <p className="font-bold text-slate-800 text-lg">{fullName}</p>
        <p className="text-sm text-slate-400 -mt-2">{emp.jobTitle}</p>
        <div className="flex gap-2 w-full pt-2 border-t border-slate-100">
          <a
            href={emp.profilePhoto} download={`${fullName}-photo`}
            target="_blank" rel="noreferrer"
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <Download className="w-4 h-4" /> Download
          </a>
          {isOwnProfile && (
            <>
              <button
                onClick={() => { onClose(); onChangePhoto() }}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary-50 border border-primary-100 rounded-xl text-sm font-medium text-primary-700 hover:bg-primary-100"
              >
                <Camera className="w-4 h-4" /> Change
              </button>
              <button
                onClick={() => { if (confirm('Remove your profile photo?')) { onDelete(); onClose() } }}
                className="flex items-center justify-center px-3 py-2 bg-red-50 border border-red-100 rounded-xl text-sm font-medium text-red-600 hover:bg-red-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}

// ─── Photo Upload Modal ────────────────────────────────────────────────────────
function PhotoUploadModal({ emp, onClose }: { emp: any; onClose: () => void }) {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleFile = (f: File) => {
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(f.type)) {
      toast.error('Only JPG or PNG allowed'); return
    }
    if (f.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return }
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const handleUpload = async () => {
    if (!file) return
    const fd = new FormData()
    fd.append('photo', file)
    setUploading(true)
    try {
      await employeesApi.uploadPhoto(emp.id, fd)
      toast.success('✅ Profile photo updated!')
      qc.invalidateQueries({ queryKey: ['profile', emp.id] })
      qc.invalidateQueries({ queryKey: ['auth-profile'] })
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const fullName = `${emp.firstName} ${emp.lastName}`
  const currentSrc = preview || emp.profilePhoto

  return (
    <Modal open onClose={onClose} title="Update Profile Photo" width="max-w-sm">
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-40 h-40 rounded-full overflow-hidden border-4 border-dashed border-primary-200 cursor-pointer relative group bg-slate-50 flex items-center justify-center"
          onClick={() => fileRef.current?.click()}
        >
          {currentSrc ? (
            <>
              <img src={currentSrc} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity">
                <Camera className="w-7 h-7 text-white" />
                <span className="text-white text-xs mt-1 font-medium">Change</span>
              </div>
            </>
          ) : (
            <>
              <div className={cn('absolute inset-0 flex items-center justify-center text-4xl font-bold text-white', avatarColor(fullName))}>
                {getInitials(fullName)}
              </div>
              <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center gap-1">
                <Camera className="w-7 h-7 text-white" />
                <span className="text-white text-xs font-medium">Add Photo</span>
              </div>
            </>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        <p className="text-xs text-slate-400 text-center">Click the circle to choose · JPG or PNG · Max 5MB</p>
        <div className="flex gap-2 w-full">
          <button className="flex-1 btn-secondary" onClick={onClose} disabled={uploading}>Cancel</button>
          <button className="flex-1 btn-primary gap-2" onClick={handleUpload} disabled={uploading || !file}>
            {uploading ? <><span className="animate-spin inline-block">⏳</span> Saving...</> : <><Save className="w-4 h-4" /> Save Photo</>}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user } = useAuthStore()
  const isHR = useIsHR()
  const qc = useQueryClient()

  const empId: string = (user as any)?.employee?.id ?? (user as any)?.employeeId ?? ''

  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState<any>({})
  const [showPhotoUpload, setShowPhotoUpload] = useState(false)
  const [showPhotoViewer, setShowPhotoViewer] = useState(false)

  const { data: authProfile } = useQuery({
    queryKey: ['auth-profile'],
    queryFn: () => import('../../services/api').then(m => m.authApi.profile().then((r: any) => r.data)),
    enabled: !empId,
    staleTime: 60_000,
  })
  const resolvedEmpId: string = empId || authProfile?.employee?.id || ''

  const { data: emp, isLoading, error } = useQuery({
    queryKey: ['profile', resolvedEmpId],
    queryFn: () => employeesApi.get(resolvedEmpId).then(r => r.data),
    enabled: !!resolvedEmpId,
    retry: 2,
    staleTime: 30_000,
  })

  const { data: docsPayload } = useQuery({
    queryKey: ['profile-docs', resolvedEmpId],
    queryFn: () => documentsApi.getEmployee(resolvedEmpId).then(r => r.data),
    enabled: !!resolvedEmpId,
  })
  const docs: any[] = Array.isArray(docsPayload)
    ? docsPayload : (docsPayload?.docs ?? docsPayload?.data ?? [])

  const updateMut = useMutation({
    mutationFn: (data: any) => employeesApi.update(resolvedEmpId, data),
    onSuccess: () => {
      toast.success('Profile updated!')
      qc.invalidateQueries({ queryKey: ['profile', resolvedEmpId] })
      setEditMode(false)
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message
      toast.error(Array.isArray(msg) ? msg[0] : (msg || 'Update failed'))
    },
  })

  const deletePhotoMut = useMutation({
    mutationFn: () => employeesApi.deletePhoto(resolvedEmpId),
    onSuccess: () => {
      toast.success('Photo removed')
      qc.invalidateQueries({ queryKey: ['profile', resolvedEmpId] })
      qc.invalidateQueries({ queryKey: ['auth-profile'] })
    },
  })

  const startEdit = () => {
    setEditData({
      phone: emp?.phone || '', address: emp?.address || '',
      city: emp?.city || '', state: emp?.state || '', pincode: emp?.pincode || '',
      emergencyContact: emp?.emergencyContact || '', emergencyPhone: emp?.emergencyPhone || '',
      panNumber: emp?.panNumber || '', bankName: emp?.bankName || '',
      accountNumber: emp?.accountNumber || '', ifscCode: emp?.ifscCode || '',
    })
    setEditMode(true)
  }

  if (!resolvedEmpId) {
    return (
      <div>
        <Header title="My Profile" subtitle="Account information" />
        <div className="p-6">
          <div className="card p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-primary-400" />
            </div>
            <h2 className="text-lg font-bold text-slate-700">{user?.email}</h2>
            <p className="text-sm text-slate-400 mt-1 mb-4">
              Role: <span className="font-semibold text-primary-600">{user?.role?.replace('_', ' ')}</span>
            </p>
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-700 max-w-sm mx-auto">
              No employee profile is linked to this admin account.
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) return <><Header title="My Profile" /><PageLoader /></>

  if (error || !emp) {
    return (
      <div>
        <Header title="My Profile" />
        <div className="p-6">
          <div className="card p-12 text-center">
            <AlertCircle className="w-12 h-12 text-red-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-600">Failed to load profile</p>
            <p className="text-sm text-slate-400 mt-1">
              {(error as any)?.response?.data?.message || 'Please refresh or contact HR.'}
            </p>
            <button className="btn-primary mt-4"
              onClick={() => qc.invalidateQueries({ queryKey: ['profile', resolvedEmpId] })}>
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  const isOwnProfile = resolvedEmpId === empId || !isHR

  return (
    <div>
      <Header title="My Profile" subtitle={`${emp.firstName} ${emp.lastName} · ${emp.employeeCode}`} />
      <div className="p-6 space-y-4">

        {/* ── Header card ────────────────────────────────────────────────── */}
        <div className="card p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <ProfileAvatar
                emp={emp} isOwnProfile={isOwnProfile}
                onView={() => setShowPhotoViewer(true)}
                onUpload={() => setShowPhotoUpload(true)}
                onDelete={() => deletePhotoMut.mutate()}
              />
              <div>
                <h2 className="text-xl font-bold text-slate-800">{emp.firstName} {emp.lastName}</h2>
                <p className="text-slate-500 text-sm mt-0.5">{emp.jobTitle}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full font-medium border border-primary-100">{emp.employeeCode}</span>
                  {emp.department?.name && (
                    <span className="text-xs bg-slate-50 text-slate-600 px-2.5 py-1 rounded-full font-medium border border-slate-100">{emp.department.name}</span>
                  )}
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${emp.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>{emp.status}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {!editMode
                ? <button onClick={startEdit} className="btn-secondary gap-2"><Edit2 className="w-4 h-4" /> Edit Profile</button>
                : <>
                  <button onClick={() => setEditMode(false)} className="btn-secondary gap-2"><X className="w-4 h-4" /> Cancel</button>
                  <button onClick={() => updateMut.mutate(editData)} disabled={updateMut.isPending} className="btn-primary gap-2">
                    <Save className="w-4 h-4" />{updateMut.isPending ? 'Saving…' : 'Save Changes'}
                  </button>
                </>
              }
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-slate-100">
            <div className="text-center">
              <p className="text-xs text-slate-400">Department</p>
              <p className="text-sm font-semibold text-slate-700 mt-0.5">{emp.department?.name || '—'}</p>
            </div>
            <div className="text-center border-x border-slate-100">
              <p className="text-xs text-slate-400">Joining Date</p>
              <p className="text-sm font-semibold text-slate-700 mt-0.5">{formatDate(emp.joiningDate)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400">Employment Type</p>
              <p className="text-sm font-semibold text-slate-700 mt-0.5">{emp.employmentType?.replace(/_/g, ' ') || '—'}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SectionCard title="Personal Information" icon={User}>
            {editMode ? (
              <div className="space-y-3">
                <FormField label="Phone"><input className="input" value={editData.phone} onChange={e => setEditData((d: any) => ({ ...d, phone: e.target.value }))} /></FormField>
                <FormField label="Emergency Contact Name"><input className="input" value={editData.emergencyContact} onChange={e => setEditData((d: any) => ({ ...d, emergencyContact: e.target.value }))} /></FormField>
                <FormField label="Emergency Contact Phone"><input className="input" value={editData.emergencyPhone} onChange={e => setEditData((d: any) => ({ ...d, emergencyPhone: e.target.value }))} /></FormField>
              </div>
            ) : (
              <>
                <InfoRow label="Full Name" value={`${emp.firstName} ${emp.lastName}`} />
                <InfoRow label="Email" value={emp.email} />
                <InfoRow label="Phone" value={emp.phone} />
                <InfoRow label="Date of Birth" value={emp.dateOfBirth ? formatDate(emp.dateOfBirth) : null} />
                <InfoRow label="Gender" value={emp.gender} />
                <InfoRow label="Blood Group" value={emp.bloodGroup} />
                <InfoRow label="Marital Status" value={emp.maritalStatus} />
                <InfoRow label="Emergency Contact" value={emp.emergencyContact} />
                <InfoRow label="Emergency Phone" value={emp.emergencyPhone} />
              </>
            )}
          </SectionCard>

          <SectionCard title="Employment Details" icon={Briefcase}>
            <InfoRow label="Employee Code" value={emp.employeeCode} />
            <InfoRow label="Designation" value={emp.jobTitle} />
            <InfoRow label="Department" value={emp.department?.name} />
            <InfoRow label="Employment Type" value={emp.employmentType?.replace(/_/g, ' ')} />
            <InfoRow label="Joining Date" value={formatDate(emp.joiningDate)} />
            <InfoRow label="Manager" value={emp.manager ? `${emp.manager.firstName} ${emp.manager.lastName}` : null} />
          </SectionCard>

          <SectionCard title="Address" icon={MapPin}>
            {editMode ? (
              <div className="space-y-3">
                <FormField label="Address"><input className="input" value={editData.address} onChange={e => setEditData((d: any) => ({ ...d, address: e.target.value }))} /></FormField>
                <div className="grid grid-cols-2 gap-2">
                  <FormField label="City"><input className="input" value={editData.city} onChange={e => setEditData((d: any) => ({ ...d, city: e.target.value }))} /></FormField>
                  <FormField label="State"><input className="input" value={editData.state} onChange={e => setEditData((d: any) => ({ ...d, state: e.target.value }))} /></FormField>
                </div>
                <FormField label="Pincode"><input className="input" value={editData.pincode} onChange={e => setEditData((d: any) => ({ ...d, pincode: e.target.value }))} /></FormField>
              </div>
            ) : (
              <>
                <InfoRow label="Address" value={emp.address} />
                <InfoRow label="City" value={emp.city} />
                <InfoRow label="State" value={emp.state} />
                <InfoRow label="Pincode" value={emp.pincode} />
                <InfoRow label="Country" value={emp.country || 'India'} />
              </>
            )}
          </SectionCard>

          <SectionCard title="Identification & Bank Details" icon={CreditCard}>
            {editMode ? (
              <div className="space-y-3">
                <FormField label="PAN Number"><input className="input" value={editData.panNumber} onChange={e => setEditData((d: any) => ({ ...d, panNumber: e.target.value }))} /></FormField>
                <FormField label="Bank Name"><input className="input" value={editData.bankName} onChange={e => setEditData((d: any) => ({ ...d, bankName: e.target.value }))} /></FormField>
                <FormField label="Account Number"><input className="input" value={editData.accountNumber} onChange={e => setEditData((d: any) => ({ ...d, accountNumber: e.target.value }))} /></FormField>
                <FormField label="IFSC Code"><input className="input" value={editData.ifscCode} onChange={e => setEditData((d: any) => ({ ...d, ifscCode: e.target.value }))} /></FormField>
              </div>
            ) : (
              <>
                <InfoRow label="PAN Number" value={emp.panNumber} />
                <InfoRow label="Aadhaar" value={emp.aadhaarNumber} />
                <InfoRow label="PF Number" value={emp.pfNumber} />
                <InfoRow label="Bank" value={emp.bankName} />
                <InfoRow label="Account No." value={emp.accountNumber} />
                <InfoRow label="IFSC Code" value={emp.ifscCode} />
              </>
            )}
          </SectionCard>

          <SectionCard title="My Documents" icon={FileText}
            action={<span className="text-xs font-medium bg-primary-50 text-primary-600 px-2.5 py-1 rounded-full">{docs.filter((d: any) => d.type !== 'PROFILE_PHOTO').length} uploaded</span>}
          >
            <div className="space-y-2">
              {docs.filter((d: any) => d.type !== 'PROFILE_PHOTO').length === 0 ? (
                <div className="text-center py-6">
                  <FileText className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No documents uploaded yet</p>
                  <a href="/documents" className="text-xs text-primary-600 underline mt-1 inline-block">Upload documents →</a>
                </div>
              ) : docs.filter((d: any) => d.type !== 'PROFILE_PHOTO').map((doc: any) => (
                <div key={doc.id} className={`flex items-center gap-3 p-3 rounded-xl border text-xs ${doc.status === 'VERIFIED' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : doc.status === 'REJECTED' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-amber-50 border-amber-100 text-amber-800'}`}>
                  <FileText className="w-4 h-4 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{doc.name || DOC_TYPE_LABELS[doc.type] || doc.type}</p>
                    <p className="opacity-60 mt-0.5">{DOC_TYPE_LABELS[doc.type] || doc.type}</p>
                  </div>
                  {doc.status === 'VERIFIED' && <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />}
                  {doc.status === 'PENDING' && <Clock className="w-4 h-4 shrink-0 text-amber-500" />}
                  {doc.status === 'REJECTED' && <XCircle className="w-4 h-4 shrink-0 text-red-400" />}
                  {doc.fileUrl && <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="underline font-medium opacity-70 hover:opacity-100 shrink-0">View</a>}
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 text-center mt-3 pt-3 border-t border-slate-50">
              <a href="/documents" className="text-primary-600 underline font-medium">Documents page</a>{' '}— upload or manage files
            </p>
          </SectionCard>
        </div>
      </div>

      {showPhotoViewer && emp.profilePhoto && (
        <PhotoViewerModal emp={emp} isOwnProfile={isOwnProfile}
          onClose={() => setShowPhotoViewer(false)}
          onChangePhoto={() => setShowPhotoUpload(true)}
          onDelete={() => deletePhotoMut.mutate()}
        />
      )}

      {showPhotoUpload && (
        <PhotoUploadModal emp={emp} onClose={() => setShowPhotoUpload(false)} />
      )}
    </div>
  )
}
