// import { useState, useRef, useCallback } from 'react'
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
// import {
//   FileText, CheckCircle, XCircle, Clock, Download, Eye,
//   Trash2, Upload, Search, AlertTriangle, RefreshCw,
//   ChevronDown, ChevronUp, History, ShieldCheck,
// } from 'lucide-react'
// import { documentsApi, api } from '../../services/api'
// import { useAuthStore, useIsHR } from '../../store/auth'
// import Header from '../../components/layout/Header'
// import { Modal, FormField, PageLoader } from '../../components/ui'
// import toast from 'react-hot-toast'

// const REQUIRED_DOCS = [
//   { type: 'AADHAAR',            label: 'Aadhaar Card',                 required: true },
//   { type: 'PAN_CARD',           label: 'PAN Card',                     required: true },
//   { type: 'MARKSHEET_10TH',     label: '10th Marks Card',              required: true },
//   { type: 'MARKSHEET_12TH',     label: '12th Marks Card',              required: true },
//   { type: 'DEGREE_CERTIFICATE', label: 'College Semester Mark Sheets', required: true },
//   { type: 'PAYSLIP',            label: 'Last 3 Months Payslips',       required: true },
//   { type: 'EXPERIENCE_LETTER',  label: 'Experience / Relieving Letter',required: false },
//   { type: 'RESUME',             label: 'Resume / CV',                  required: false },
//   { type: 'OFFER_LETTER',       label: 'Offer Letter',                 required: false },
//   { type: 'BANK_DETAILS',       label: 'Bank Details / Passbook',      required: false },
//   { type: 'OTHER',              label: 'Other Document',               required: false },
// ]
// const DOC_TYPE_MAP: Record<string,string> = Object.fromEntries(REQUIRED_DOCS.map(d => [d.type, d.label]))

// const StatusBadge = ({ status }: { status: string }) => {
//   const cfg: any = {
//     PENDING:  { cls: 'bg-amber-50 text-amber-700 border-amber-200',   Icon: Clock },
//     VERIFIED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: CheckCircle },
//     REJECTED: { cls: 'bg-red-50 text-red-600 border-red-200',        Icon: XCircle },
//   }
//   const { cls, Icon } = cfg[status] || cfg.PENDING
//   return (
//     <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold border ${cls}`}>
//       <Icon className="w-3 h-3" /> {status}
//     </span>
//   )
// }

// // ─── File Drop Zone ───────────────────────────────────────────────────────────
// function FileDropZone({ onFile, file }: { onFile: (f: File) => void; file: File | null }) {
//   const ref = useRef<HTMLInputElement>(null)
//   const [drag, setDrag] = useState(false)

//   const accept = (f: File) => {
//     if (f.type !== 'application/pdf') { toast.error('Only PDF files allowed'); return }
//     if (f.size > 10 * 1024 * 1024) { toast.error('Max file size is 10MB'); return }
//     onFile(f)
//   }

//   return (
//     <div
//       className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
//         ${drag ? 'border-primary-400 bg-primary-50' : file ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 hover:border-primary-300 hover:bg-slate-50'}`}
//       onDragOver={e => { e.preventDefault(); setDrag(true) }}
//       onDragLeave={() => setDrag(false)}
//       onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) accept(f) }}
//       onClick={() => ref.current?.click()}
//     >
//       <input ref={ref} type="file" accept=".pdf,application/pdf" className="hidden"
//         onChange={e => { const f = e.target.files?.[0]; if (f) accept(f); e.target.value = '' }} />
//       {file ? (
//         <div className="flex items-center justify-center gap-3">
//           <div className="p-2 bg-emerald-100 rounded-lg"><FileText className="w-6 h-6 text-emerald-600" /></div>
//           <div className="text-left">
//             <p className="text-sm font-semibold text-emerald-700 max-w-[220px] truncate">{file.name}</p>
//             <p className="text-xs text-emerald-500">{(file.size / 1024).toFixed(1)} KB · PDF</p>
//           </div>
//           <CheckCircle className="w-5 h-5 text-emerald-500" />
//         </div>
//       ) : (
//         <>
//           <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
//           <p className="text-sm font-medium text-slate-500">Drop PDF here or <span className="text-primary-600 underline">browse</span></p>
//           <p className="text-xs text-slate-400 mt-1">PDF only · Max 10MB</p>
//         </>
//       )}
//     </div>
//   )
// }

// // ─── Upload Modal ─────────────────────────────────────────────────────────────
// function UploadModal({ onClose, empId, isHR, employees, forType, isReupload }: any) {
//   const qc = useQueryClient()
//   const [file, setFile] = useState<File | null>(null)
//   const [docType, setDocType] = useState(forType || 'AADHAAR')
//   const [docName, setDocName] = useState(forType ? (DOC_TYPE_MAP[forType] || '') : '')
//   const [uploading, setUploading] = useState(false)
//   const [selEmpId, setSelEmpId] = useState(empId || '')
//   const [progress, setProgress] = useState(0)

//   const handleUpload = async () => {
//     if (!file) { toast.error('Please select a PDF file'); return }
//     if (!docName.trim()) { toast.error('Please enter a document name'); return }
//     if (!selEmpId) { toast.error('Please select an employee'); return }

//     const formData = new FormData()
//     formData.append('file', file)
//     formData.append('type', docType)
//     formData.append('name', docName.trim())

//     setUploading(true)
//     setProgress(0)
//     try {
//       await documentsApi.upload(selEmpId, formData)
//       toast.success(isReupload ? '✅ Document re-uploaded!' : '✅ Document uploaded!')
//       qc.invalidateQueries({ queryKey: ['documents'] })
//       onClose()
//     } catch (err: any) {
//       toast.error(err?.response?.data?.message || 'Upload failed. Please try again.')
//     } finally {
//       setUploading(false)
//     }
//   }

//   return (
//     <Modal open onClose={onClose} title={isReupload ? '🔄 Re-upload Document' : '📤 Upload Document'} width="max-w-lg">
//       <div className="space-y-4">
//         {isReupload && (
//           <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 flex gap-2">
//             <RefreshCw className="w-4 h-4 shrink-0 mt-0.5" />
//             Previous rejected document is kept for record. Upload corrected version below.
//           </div>
//         )}
//         <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700">
//           📄 <strong>PDF only</strong> · Max 10MB · HR will review and verify.
//         </div>

//         {isHR && (
//           <FormField label="Employee *">
//             <select className="input" value={selEmpId} onChange={e => setSelEmpId(e.target.value)}>
//               <option value="">Select employee</option>
//               {employees?.map((e: any) => (
//                 <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeCode})</option>
//               ))}
//             </select>
//           </FormField>
//         )}

//         <FormField label="Document Type *">
//           <select className="input" value={docType} disabled={!!forType}
//             onChange={e => { setDocType(e.target.value); setDocName(DOC_TYPE_MAP[e.target.value] || '') }}>
//             {REQUIRED_DOCS.map(d => (
//               <option key={d.type} value={d.type}>{d.label} {d.required ? '(Required)' : '(Optional)'}</option>
//             ))}
//           </select>
//         </FormField>

//         <FormField label="Document Name *">
//           <input className="input" value={docName} onChange={e => setDocName(e.target.value)}
//             placeholder="e.g. Aadhaar Card – Front & Back" />
//         </FormField>

//         <FileDropZone onFile={setFile} file={file} />

//         {uploading && (
//           <div className="bg-slate-50 rounded-lg p-3">
//             <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
//               <span>Uploading...</span>
//             </div>
//             <div className="w-full bg-slate-200 rounded-full h-1.5">
//               <div className="bg-primary-500 h-1.5 rounded-full animate-pulse w-3/4" />
//             </div>
//           </div>
//         )}

//         <div className="flex justify-end gap-2 pt-1">
//           <button className="btn-secondary" onClick={onClose} disabled={uploading}>Cancel</button>
//           <button className="btn-primary gap-2" onClick={handleUpload}
//             disabled={uploading || !file || !docName.trim()}>
//             {uploading ? <><span className="animate-spin">⏳</span> Uploading...</> : <><Upload className="w-4 h-4" /> Upload</>}
//           </button>
//         </div>
//       </div>
//     </Modal>
//   )
// }

// // ─── Employee: Doc type row ───────────────────────────────────────────────────
// function DocTypeCard({ typeDef, docs, onUpload, onView }: any) {
//   const [expanded, setExpanded] = useState(false)
//   const latest = docs?.[0]
//   const hasVerified = docs?.some((d: any) => d.status === 'VERIFIED')
//   const needsReupload = latest?.status === 'REJECTED'
//   const isPending = latest?.status === 'PENDING'
//   const borderColor = hasVerified ? 'border-l-emerald-400' : needsReupload ? 'border-l-red-400' : isPending ? 'border-l-amber-400' : 'border-l-slate-200'

//   return (
//     <div className={`card border-l-4 ${borderColor}`}>
//       <div className="p-4">
//         <div className="flex items-start justify-between gap-3">
//           <div className="flex items-start gap-3 flex-1 min-w-0">
//             <div className={`p-2 rounded-xl shrink-0 ${hasVerified ? 'bg-emerald-50' : needsReupload ? 'bg-red-50' : isPending ? 'bg-amber-50' : 'bg-slate-50'}`}>
//               <FileText className={`w-5 h-5 ${hasVerified ? 'text-emerald-500' : needsReupload ? 'text-red-400' : isPending ? 'text-amber-500' : 'text-slate-400'}`} />
//             </div>
//             <div className="flex-1 min-w-0">
//               <div className="flex items-center gap-2 flex-wrap">
//                 <p className="font-semibold text-slate-800 text-sm">{typeDef.label}</p>
//                 {typeDef.required && <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">Required</span>}
//               </div>
//               {latest ? (
//                 <div className="mt-1 flex items-center gap-2 flex-wrap">
//                   <StatusBadge status={latest.status} />
//                   <span className="text-xs text-slate-400">{new Date(latest.createdAt).toLocaleDateString('en-IN')}</span>
//                 </div>
//               ) : <p className="text-xs text-slate-400 mt-1">Not uploaded yet</p>}
//             </div>
//           </div>
//           <div className="flex items-center gap-2 shrink-0">
//             {latest && (
//               <>
//                 <button onClick={() => onView(latest)} className="p-1.5 hover:bg-slate-100 rounded-lg" title="View">
//                   <Eye className="w-4 h-4 text-slate-400" />
//                 </button>
//                 <a href={latest.fileUrl} download={latest.name} target="_blank" rel="noreferrer"
//                   className="p-1.5 hover:bg-slate-100 rounded-lg" title="Download">
//                   <Download className="w-4 h-4 text-slate-400" />
//                 </a>
//               </>
//             )}
//             {!hasVerified && (
//               <button onClick={() => onUpload(typeDef.type, needsReupload)}
//                 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${needsReupload ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-primary-500 hover:bg-primary-600 text-white'}`}>
//                 {needsReupload ? <><RefreshCw className="w-3 h-3" /> Re-upload</> : <><Upload className="w-3 h-3" /> Upload</>}
//               </button>
//             )}
//             {hasVerified && <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold"><ShieldCheck className="w-4 h-4" /> Verified</span>}
//             {docs?.length > 1 && (
//               <button onClick={() => setExpanded(!expanded)} className="p-1.5 hover:bg-slate-100 rounded-lg">
//                 {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
//               </button>
//             )}
//           </div>
//         </div>
//         {needsReupload && latest?.remarks && (
//           <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
//             <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
//             <div>
//               <p className="text-xs font-semibold text-red-600">Rejection Reason:</p>
//               <p className="text-xs text-red-500 mt-0.5">{latest.remarks}</p>
//             </div>
//           </div>
//         )}
//       </div>
//       {expanded && docs?.length > 1 && (
//         <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/50">
//           <p className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5 mb-2">
//             <History className="w-3.5 h-3.5" /> Upload History
//           </p>
//           <div className="space-y-2">
//             {docs.slice(1).map((doc: any) => (
//               <div key={doc.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-slate-100 last:border-0">
//                 <div className="flex items-center gap-2">
//                   <StatusBadge status={doc.status} />
//                   <span className="text-xs text-slate-400">{new Date(doc.createdAt).toLocaleDateString('en-IN')}</span>
//                   {doc.remarks && <span className="text-xs text-red-400 italic truncate max-w-[120px]">{doc.remarks}</span>}
//                 </div>
//                 <div className="flex gap-1">
//                   <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="p-1 hover:bg-slate-200 rounded text-slate-400"><Eye className="w-3.5 h-3.5" /></a>
//                   <a href={doc.fileUrl} download target="_blank" rel="noreferrer" className="p-1 hover:bg-slate-200 rounded text-slate-400"><Download className="w-3.5 h-3.5" /></a>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// // ─── HR Doc Card ──────────────────────────────────────────────────────────────
// function HRDocCard({ doc, onVerify, onReject, onDelete, onView }: any) {
//   const token = localStorage.getItem('hrms_token')
//   const apiBase = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api/v1'
//   const filename = doc.fileUrl?.split('/').pop()
//   const downloadUrl = `${apiBase}/documents/download/${filename}?name=${encodeURIComponent(doc.name)}`

//   return (
//     <div className="card p-4 space-y-3 hover:shadow-md transition-shadow">
//       <div className="flex items-start justify-between gap-2">
//         <div className="flex items-start gap-3 flex-1 min-w-0">
//           <div className={`p-2 rounded-xl shrink-0 ${doc.status === 'VERIFIED' ? 'bg-emerald-50' : doc.status === 'REJECTED' ? 'bg-red-50' : 'bg-amber-50'}`}>
//             <FileText className={`w-5 h-5 ${doc.status === 'VERIFIED' ? 'text-emerald-500' : doc.status === 'REJECTED' ? 'text-red-400' : 'text-amber-500'}`} />
//           </div>
//           <div className="min-w-0">
//             <p className="font-semibold text-sm text-slate-800 truncate">{doc.name}</p>
//             <p className="text-xs text-slate-400">{DOC_TYPE_MAP[doc.type] || doc.type}</p>
//             <p className="text-xs font-medium text-primary-600 mt-0.5">{doc.employee?.firstName} {doc.employee?.lastName} · {doc.employee?.employeeCode}</p>
//             <p className="text-xs text-slate-300">{doc.employee?.department?.name}</p>
//           </div>
//         </div>
//         <StatusBadge status={doc.status} />
//       </div>
//       {doc.status === 'REJECTED' && doc.remarks && (
//         <div className="bg-red-50 rounded-lg px-3 py-2 text-xs text-red-600 border border-red-100">
//           <span className="font-semibold">Reason:</span> {doc.remarks}
//         </div>
//       )}
//       <div className="text-xs text-slate-400">
//         Uploaded {new Date(doc.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
//       </div>
//       <div className="flex gap-2 pt-1 border-t border-slate-50">
//         <button onClick={() => onView(doc)}
//           className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50">
//           <Eye className="w-3.5 h-3.5" /> View
//         </button>
//         <a href={downloadUrl} download={`${doc.name}.pdf`}
//           className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50">
//           <Download className="w-3.5 h-3.5" /> Download
//         </a>
//         {doc.status === 'PENDING' && (
//           <>
//             <button onClick={() => onVerify(doc.id)}
//               className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold">
//               <CheckCircle className="w-3.5 h-3.5" /> Verify
//             </button>
//             <button onClick={() => onReject(doc)}
//               className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold">
//               <XCircle className="w-3.5 h-3.5" /> Reject
//             </button>
//           </>
//         )}
//         <button onClick={() => onDelete(doc.id)}
//           className="p-1.5 bg-slate-50 hover:bg-red-50 text-slate-300 hover:text-red-400 rounded-lg">
//           <Trash2 className="w-3.5 h-3.5" />
//         </button>
//       </div>
//     </div>
//   )
// }

// // ─── PDF Viewer ───────────────────────────────────────────────────────────────
// function ViewerModal({ doc, onClose }: any) {
//   const apiBase = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api/v1'
//   const filename = doc.fileUrl?.split('/').pop()
//   const downloadUrl = `${apiBase}/documents/download/${filename}?name=${encodeURIComponent(doc.name)}`

//   return (
//     <Modal open onClose={onClose} title={doc.name} width="max-w-4xl">
//       <div className="space-y-3">
//         <div className="flex items-center justify-between">
//           <StatusBadge status={doc.status} />
//           <a href={downloadUrl} download={`${doc.name}.pdf`} className="btn-secondary gap-2 text-sm">
//             <Download className="w-4 h-4" /> Download PDF
//           </a>
//         </div>
//         <div className="bg-slate-900 rounded-xl overflow-hidden" style={{ height: '70vh' }}>
//           <iframe src={`${doc.fileUrl}#toolbar=1`} className="w-full h-full" title={doc.name} />
//         </div>
//       </div>
//     </Modal>
//   )
// }

// // ─── Main Page ────────────────────────────────────────────────────────────────
// export default function DocumentsPage() {
//   const isHR = useIsHR()
//   const { user } = useAuthStore()
//   const qc = useQueryClient()
//   const empId = user?.employee?.id || ''

//   const [filterStatus, setFilterStatus] = useState('')
//   const [search, setSearch] = useState('')
//   const [showUpload, setShowUpload] = useState<{ type?: string; reupload?: boolean } | null>(null)
//   const [rejectModal, setRejectModal] = useState<any>(null)
//   const [rejectReason, setRejectReason] = useState('')
//   const [viewDoc, setViewDoc] = useState<any>(null)

//   const { data: hrDocs = [], isLoading: hrLoading } = useQuery({
//     queryKey: ['documents-hr', filterStatus],
//     queryFn: () => documentsApi.getAll({ status: filterStatus || undefined }).then(r => r.data),
//     enabled: isHR,
//   })

//   const { data: empDocsData, isLoading: empLoading } = useQuery({
//     queryKey: ['documents-emp', empId],
//     queryFn: () => documentsApi.getEmployee(empId).then(r => r.data),
//     enabled: !isHR && !!empId,
//   })

//   const { data: employees = [] } = useQuery({
//     queryKey: ['emp-list-docs'],
//     queryFn: () => api.get('/employees', { params: { limit: 300 } }).then(r => r.data.data),
//     enabled: isHR,
//   })

//   const verifyMut = useMutation({
//     mutationFn: (id: string) => documentsApi.verify(id, { status: 'VERIFIED' }),
//     onSuccess: () => { toast.success('✅ Document verified!'); qc.invalidateQueries({ queryKey: ['documents'] }) },
//   })

//   const rejectMut = useMutation({
//     mutationFn: ({ id, remarks }: any) => documentsApi.verify(id, { status: 'REJECTED', remarks }),
//     onSuccess: () => { toast.success('Document rejected'); qc.invalidateQueries({ queryKey: ['documents'] }); setRejectModal(null); setRejectReason('') },
//   })

//   const deleteMut = useMutation({
//     mutationFn: (id: string) => isHR ? documentsApi.hrDelete(id) : documentsApi.delete(id),
//     onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['documents'] }) },
//   })

//   const filtered = (hrDocs as any[]).filter((d: any) => {
//     if (!search) return true
//     return `${d.employee?.firstName} ${d.employee?.lastName} ${d.name} ${d.type}`.toLowerCase().includes(search.toLowerCase())
//   })

//   const allDocs = empDocsData?.docs || []
//   const byType = empDocsData?.byType || {}
//   const pending = (hrDocs as any[]).filter((d: any) => d.status === 'PENDING').length
//   const verified = (hrDocs as any[]).filter((d: any) => d.status === 'VERIFIED').length
//   const rejected = (hrDocs as any[]).filter((d: any) => d.status === 'REJECTED').length
//   const completedRequired = REQUIRED_DOCS.filter(t => t.required && byType[t.type]?.some((d: any) => d.status === 'VERIFIED')).length
//   const totalRequired = REQUIRED_DOCS.filter(t => t.required).length
//   const hasRejected = allDocs.some((d: any) => d.status === 'REJECTED')

//   return (
//     <div>
//       <Header title="Documents"
//         subtitle={isHR ? `${(hrDocs as any[]).length} total · ${pending} pending review` : `${completedRequired}/${totalRequired} required verified`} />

//       <div className="p-6 space-y-5">

//         {/* ── EMPLOYEE VIEW ─────────────────────────────────────────────── */}
//         {!isHR && (
//           <>
//             <div className="card p-5">
//               <div className="flex items-center justify-between mb-3">
//                 <div>
//                   <p className="font-bold text-slate-700">Document Completion</p>
//                   <p className="text-sm text-slate-400 mt-0.5">Upload all required docs for HR verification</p>
//                 </div>
//                 <div className="text-right">
//                   <p className="text-2xl font-bold text-primary-600">{completedRequired}/{totalRequired}</p>
//                   <p className="text-xs text-slate-400">Required verified</p>
//                 </div>
//               </div>
//               <div className="w-full bg-slate-100 rounded-full h-2.5">
//                 <div className={`h-2.5 rounded-full transition-all ${completedRequired === totalRequired ? 'bg-emerald-500' : 'bg-primary-500'}`}
//                   style={{ width: `${Math.round((completedRequired / totalRequired) * 100)}%` }} />
//               </div>
//               <div className="flex gap-4 mt-3 text-xs text-slate-400">
//                 <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> {allDocs.filter((d: any) => d.status === 'VERIFIED').length} Verified</span>
//                 <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-amber-500" /> {allDocs.filter((d: any) => d.status === 'PENDING').length} Pending</span>
//                 <span className="flex items-center gap-1"><XCircle className="w-3.5 h-3.5 text-red-400" /> {allDocs.filter((d: any) => d.status === 'REJECTED').length} Rejected</span>
//               </div>
//             </div>
//             {hasRejected && (
//               <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3">
//                 <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
//                 <div>
//                   <p className="text-sm font-semibold text-red-700">Some documents were rejected</p>
//                   <p className="text-xs text-red-500 mt-0.5">Re-upload the corrected versions. HR's reason is shown on each.</p>
//                 </div>
//               </div>
//             )}
//             <div className="flex justify-end">
//               <button className="btn-primary gap-2" onClick={() => setShowUpload({})}>
//                 <Upload className="w-4 h-4" /> Upload Document
//               </button>
//             </div>
//             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Required Documents</p>
//             <div className="space-y-3">
//               {REQUIRED_DOCS.filter(t => t.required).map(t => (
//                 <DocTypeCard key={t.type} typeDef={t} docs={byType[t.type] || []}
//                   onUpload={(type: string, reupload: boolean) => setShowUpload({ type, reupload })}
//                   onView={setViewDoc} />
//               ))}
//             </div>
//             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Optional Documents</p>
//             <div className="space-y-3">
//               {REQUIRED_DOCS.filter(t => !t.required).map(t => (
//                 <DocTypeCard key={t.type} typeDef={t} docs={byType[t.type] || []}
//                   onUpload={(type: string, reupload: boolean) => setShowUpload({ type, reupload })}
//                   onView={setViewDoc} />
//               ))}
//             </div>
//           </>
//         )}

//         {/* ── HR VIEW ───────────────────────────────────────────────────── */}
//         {isHR && (
//           <>
//             <div className="grid grid-cols-4 gap-3">
//               {[
//                 { label: 'Total', value: (hrDocs as any[]).length, color: 'text-slate-700', bg: 'bg-white' },
//                 { label: 'Pending Review', value: pending, color: 'text-amber-600', bg: 'bg-amber-50' },
//                 { label: 'Verified', value: verified, color: 'text-emerald-600', bg: 'bg-emerald-50' },
//                 { label: 'Rejected', value: rejected, color: 'text-red-500', bg: 'bg-red-50' },
//               ].map(s => (
//                 <div key={s.label} className={`card p-4 text-center ${s.bg}`}>
//                   <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
//                   <p className="text-xs text-slate-400 mt-1">{s.label}</p>
//                 </div>
//               ))}
//             </div>
//             <div className="flex items-center gap-3 flex-wrap">
//               <div className="relative flex-1 max-w-xs">
//                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
//                 <input className="input pl-9" placeholder="Search employee or document..." value={search} onChange={e => setSearch(e.target.value)} />
//               </div>
//               <select className="input max-w-44" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
//                 <option value="">All Status</option>
//                 <option value="PENDING">Pending</option>
//                 <option value="VERIFIED">Verified</option>
//                 <option value="REJECTED">Rejected</option>
//               </select>
//               <button className="btn-primary ml-auto gap-2" onClick={() => setShowUpload({})}>
//                 <Upload className="w-4 h-4" /> Upload for Employee
//               </button>
//             </div>
//             {pending > 0 && !filterStatus && (
//               <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
//                 <Clock className="w-5 h-5 text-amber-500 shrink-0" />
//                 <p className="text-sm text-amber-700"><strong>{pending}</strong> document{pending > 1 ? 's' : ''} pending review.</p>
//                 <button onClick={() => setFilterStatus('PENDING')} className="ml-auto text-xs text-amber-700 underline font-medium">View pending</button>
//               </div>
//             )}
//             {hrLoading ? <PageLoader /> : (
//               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
//                 {filtered.map((doc: any) => (
//                   <HRDocCard key={doc.id} doc={doc}
//                     onVerify={(id: string) => verifyMut.mutate(id)}
//                     onReject={(doc: any) => { setRejectModal(doc); setRejectReason('') }}
//                     onDelete={(id: string) => { if (confirm('Delete this document?')) deleteMut.mutate(id) }}
//                     onView={setViewDoc} />
//                 ))}
//                 {!filtered.length && (
//                   <div className="col-span-3 card p-16 text-center">
//                     <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
//                     <p className="text-slate-400 font-medium">No documents found</p>
//                   </div>
//                 )}
//               </div>
//             )}
//           </>
//         )}
//       </div>

//       {showUpload !== null && (
//         <UploadModal onClose={() => setShowUpload(null)} empId={empId} isHR={isHR}
//           employees={employees} forType={showUpload.type} isReupload={showUpload.reupload} />
//       )}

//       <Modal open={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject Document" width="max-w-md">
//         {rejectModal && (
//           <div className="space-y-4">
//             <div className="bg-red-50 border border-red-100 rounded-xl p-4">
//               <p className="font-semibold text-red-700">{rejectModal.name}</p>
//               <p className="text-xs text-red-500 mt-0.5">{DOC_TYPE_MAP[rejectModal.type]} · {rejectModal.employee?.firstName} {rejectModal.employee?.lastName}</p>
//             </div>
//             <FormField label="Rejection Reason * (Employee will see this)">
//               <textarea className="input min-h-[90px] resize-none" value={rejectReason}
//                 placeholder="Explain clearly so employee knows what to fix..."
//                 onChange={e => setRejectReason(e.target.value)} />
//             </FormField>
//             <div className="flex justify-end gap-2">
//               <button className="btn-secondary" onClick={() => setRejectModal(null)}>Cancel</button>
//               <button className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
//                 disabled={!rejectReason.trim() || rejectMut.isPending}
//                 onClick={() => rejectMut.mutate({ id: rejectModal.id, remarks: rejectReason })}>
//                 <XCircle className="w-4 h-4" /> {rejectMut.isPending ? 'Rejecting...' : 'Reject Document'}
//               </button>
//             </div>
//           </div>
//         )}
//       </Modal>

//       {viewDoc && <ViewerModal doc={viewDoc} onClose={() => setViewDoc(null)} />}
//     </div>
//   )
// }
import { useState, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  FileText, CheckCircle, XCircle, Clock, Download, Eye,
  Trash2, Upload, Search, AlertTriangle, RefreshCw,
  ChevronDown, ChevronUp, History, ShieldCheck, Camera, User,
} from 'lucide-react'
import { documentsApi, api } from '../../services/api'
import { useAuthStore, useIsHR } from '../../store/auth'
import Header from '../../components/layout/Header'
import { Modal, FormField, PageLoader } from '../../components/ui'
import toast from 'react-hot-toast'

const REQUIRED_DOCS = [
  { type: 'AADHAAR', label: 'Aadhaar Card', required: true },
  { type: 'PAN_CARD', label: 'PAN Card', required: true },
  { type: 'MARKSHEET_10TH', label: '10th Marks Card', required: true },
  { type: 'MARKSHEET_12TH', label: '12th Marks Card', required: true },
  { type: 'DEGREE_CERTIFICATE', label: 'College Semester Mark Sheets', required: true },
  { type: 'PAYSLIP', label: 'Last 3 Months Payslips', required: true },
  { type: 'EXPERIENCE_LETTER', label: 'Experience / Relieving Letter', required: false },
  { type: 'RESUME', label: 'Resume / CV', required: false },
  { type: 'OFFER_LETTER', label: 'Offer Letter', required: false },
  { type: 'BANK_DETAILS', label: 'Bank Details / Passbook', required: false },
  { type: 'OTHER', label: 'Other Document', required: false },
]
const DOC_TYPE_MAP: Record<string, string> = Object.fromEntries(REQUIRED_DOCS.map(d => [d.type, d.label]))

const StatusBadge = ({ status }: { status: string }) => {
  const cfg: any = {
    PENDING: { cls: 'bg-amber-50 text-amber-700 border-amber-200', Icon: Clock },
    VERIFIED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: CheckCircle },
    REJECTED: { cls: 'bg-red-50 text-red-600 border-red-200', Icon: XCircle },
  }
  const { cls, Icon } = cfg[status] || cfg.PENDING
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold border ${cls}`}>
      <Icon className="w-3 h-3" /> {status}
    </span>
  )
}

// ─── File Drop Zone ───────────────────────────────────────────────────────────
function FileDropZone({ onFile, file }: { onFile: (f: File) => void; file: File | null }) {
  const ref = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)

  const accept = (f: File) => {
    if (f.type !== 'application/pdf') { toast.error('Only PDF files allowed'); return }
    if (f.size > 10 * 1024 * 1024) { toast.error('Max file size is 10MB'); return }
    onFile(f)
  }

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
        ${drag ? 'border-primary-400 bg-primary-50' : file ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 hover:border-primary-300 hover:bg-slate-50'}`}
      onDragOver={e => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) accept(f) }}
      onClick={() => ref.current?.click()}
    >
      <input ref={ref} type="file" accept=".pdf,application/pdf" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) accept(f); e.target.value = '' }} />
      {file ? (
        <div className="flex items-center justify-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg"><FileText className="w-6 h-6 text-emerald-600" /></div>
          <div className="text-left">
            <p className="text-sm font-semibold text-emerald-700 max-w-[220px] truncate">{file.name}</p>
            <p className="text-xs text-emerald-500">{(file.size / 1024).toFixed(1)} KB · PDF</p>
          </div>
          <CheckCircle className="w-5 h-5 text-emerald-500" />
        </div>
      ) : (
        <>
          <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-500">Drop PDF here or <span className="text-primary-600 underline">browse</span></p>
          <p className="text-xs text-slate-400 mt-1">PDF only · Max 10MB</p>
        </>
      )}
    </div>
  )
}


// ─── Photo Drop Zone ──────────────────────────────────────────────────────────
function PhotoDropZone({ onFile, file, preview }: { onFile: (f: File) => void; file: File | null; preview?: string }) {
  const ref = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)

  const accept = (f: File) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowed.includes(f.type)) { toast.error('Only JPG or PNG images allowed'); return }
    if (f.size > 5 * 1024 * 1024) { toast.error('Max photo size is 5MB'); return }
    onFile(f)
  }

  const imgSrc = file ? URL.createObjectURL(file) : preview

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
        ${drag ? 'border-primary-400 bg-primary-50' : file ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 hover:border-primary-300 hover:bg-slate-50'}`}
      onDragOver={e => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) accept(f) }}
      onClick={() => ref.current?.click()}
    >
      <input ref={ref} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) accept(f); e.target.value = '' }} />
      {imgSrc ? (
        <div className="flex flex-col items-center gap-3">
          <img src={imgSrc} alt="Preview" className="w-24 h-24 rounded-full object-cover border-4 border-emerald-200 shadow" />
          <div>
            <p className="text-sm font-semibold text-emerald-700">{file?.name || 'Current photo'}</p>
            <p className="text-xs text-emerald-500 mt-0.5">Click to change</p>
          </div>
        </div>
      ) : (
        <>
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <User className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-sm font-medium text-slate-500">Drop photo here or <span className="text-primary-600 underline">browse</span></p>
          <p className="text-xs text-slate-400 mt-1">JPG or PNG · Max 5MB</p>
        </>
      )}
    </div>
  )
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────
function UploadModal({ onClose, empId, isHR, employees, forType, isReupload }: any) {
  const qc = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const [docType, setDocType] = useState(forType || 'AADHAAR')
  const [docName, setDocName] = useState(forType ? (DOC_TYPE_MAP[forType] || '') : '')
  const [uploading, setUploading] = useState(false)
  const [selEmpId, setSelEmpId] = useState(empId || '')
  const [progress, setProgress] = useState(0)

  const handleUpload = async () => {
    if (!file) { toast.error('Please select a PDF file'); return }
    if (!docName.trim()) { toast.error('Please enter a document name'); return }
    if (!selEmpId) { toast.error('Please select an employee'); return }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', docType)
    formData.append('name', docName.trim())

    setUploading(true)
    setProgress(0)
    try {
      await documentsApi.upload(selEmpId, formData)
      toast.success(isReupload ? '✅ Document re-uploaded!' : '✅ Document uploaded!')
      qc.invalidateQueries({ queryKey: ['documents'] })
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={isReupload ? '🔄 Re-upload Document' : '📤 Upload Document'} width="max-w-lg">
      <div className="space-y-4">
        {isReupload && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 flex gap-2">
            <RefreshCw className="w-4 h-4 shrink-0 mt-0.5" />
            Previous rejected document is kept for record. Upload corrected version below.
          </div>
        )}
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700">
          📄 <strong>PDF only</strong> · Max 10MB · HR will review and verify.
        </div>

        {isHR && (
          <FormField label="Employee *">
            <select className="input" value={selEmpId} onChange={e => setSelEmpId(e.target.value)}>
              <option value="">Select employee</option>
              {employees?.map((e: any) => (
                <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeCode})</option>
              ))}
            </select>
          </FormField>
        )}

        <FormField label="Document Type *">
          <select className="input" value={docType} disabled={!!forType}
            onChange={e => { setDocType(e.target.value); setDocName(DOC_TYPE_MAP[e.target.value] || '') }}>
            {REQUIRED_DOCS.map(d => (
              <option key={d.type} value={d.type}>{d.label} {d.required ? '(Required)' : '(Optional)'}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Document Name *">
          <input className="input" value={docName} onChange={e => setDocName(e.target.value)}
            placeholder="e.g. Aadhaar Card – Front & Back" />
        </FormField>

        <FileDropZone onFile={setFile} file={file} />

        {uploading && (
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Uploading...</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5">
              <div className="bg-primary-500 h-1.5 rounded-full animate-pulse w-3/4" />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button className="btn-secondary" onClick={onClose} disabled={uploading}>Cancel</button>
          <button className="btn-primary gap-2" onClick={handleUpload}
            disabled={uploading || !file || !docName.trim()}>
            {uploading ? <><span className="animate-spin">⏳</span> Uploading...</> : <><Upload className="w-4 h-4" /> Upload</>}
          </button>
        </div>
      </div>
    </Modal>
  )
}


// ─── Photo Upload Modal ───────────────────────────────────────────────────────
function PhotoUploadModal({ onClose, empId, currentPhoto }: { onClose: () => void; empId: string; currentPhoto?: string }) {
  const qc = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async () => {
    if (!file) { toast.error('Please select a photo'); return }
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'PROFILE_PHOTO')
    formData.append('name', 'Profile Photo')
    setUploading(true)
    try {
      await documentsApi.upload(empId, formData)
      toast.success('✅ Profile photo uploaded!')
      qc.invalidateQueries({ queryKey: ['documents'] })
      qc.invalidateQueries({ queryKey: ['auth-profile'] })
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="📷 Upload Profile Photo" width="max-w-md">
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700">
          📸 <strong>JPG or PNG only</strong> · Max 5MB · Your photo will appear across the system.
        </div>
        <PhotoDropZone onFile={setFile} file={file} preview={currentPhoto} />
        <div className="flex justify-end gap-2 pt-1">
          <button className="btn-secondary" onClick={onClose} disabled={uploading}>Cancel</button>
          <button className="btn-primary gap-2" onClick={handleUpload} disabled={uploading || !file}>
            {uploading
              ? <><span className="animate-spin">⏳</span> Uploading...</>
              : <><Camera className="w-4 h-4" /> Upload Photo</>}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Employee: Doc type row ───────────────────────────────────────────────────
function DocTypeCard({ typeDef, docs, onUpload, onView }: any) {
  const [expanded, setExpanded] = useState(false)
  const latest = docs?.[0]
  const hasVerified = docs?.some((d: any) => d.status === 'VERIFIED')
  const needsReupload = latest?.status === 'REJECTED'
  const isPending = latest?.status === 'PENDING'
  const borderColor = hasVerified ? 'border-l-emerald-400' : needsReupload ? 'border-l-red-400' : isPending ? 'border-l-amber-400' : 'border-l-slate-200'

  return (
    <div className={`card border-l-4 ${borderColor}`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`p-2 rounded-xl shrink-0 ${hasVerified ? 'bg-emerald-50' : needsReupload ? 'bg-red-50' : isPending ? 'bg-amber-50' : 'bg-slate-50'}`}>
              <FileText className={`w-5 h-5 ${hasVerified ? 'text-emerald-500' : needsReupload ? 'text-red-400' : isPending ? 'text-amber-500' : 'text-slate-400'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-slate-800 text-sm">{typeDef.label}</p>
                {typeDef.required && <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">Required</span>}
              </div>
              {latest ? (
                <div className="mt-1 flex items-center gap-2 flex-wrap">
                  <StatusBadge status={latest.status} />
                  <span className="text-xs text-slate-400">{new Date(latest.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
              ) : <p className="text-xs text-slate-400 mt-1">Not uploaded yet</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {latest && (
              <>
                <button onClick={() => onView(latest)} className="p-1.5 hover:bg-slate-100 rounded-lg" title="View">
                  <Eye className="w-4 h-4 text-slate-400" />
                </button>
                <a href={latest.fileUrl} download={latest.name} target="_blank" rel="noreferrer"
                  className="p-1.5 hover:bg-slate-100 rounded-lg" title="Download">
                  <Download className="w-4 h-4 text-slate-400" />
                </a>
              </>
            )}
            {!hasVerified && (
              <button onClick={() => onUpload(typeDef.type, needsReupload)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${needsReupload ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-primary-500 hover:bg-primary-600 text-white'}`}>
                {needsReupload ? <><RefreshCw className="w-3 h-3" /> Re-upload</> : <><Upload className="w-3 h-3" /> Upload</>}
              </button>
            )}
            {hasVerified && <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold"><ShieldCheck className="w-4 h-4" /> Verified</span>}
            {docs?.length > 1 && (
              <button onClick={() => setExpanded(!expanded)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
            )}
          </div>
        </div>
        {needsReupload && latest?.remarks && (
          <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-red-600">Rejection Reason:</p>
              <p className="text-xs text-red-500 mt-0.5">{latest.remarks}</p>
            </div>
          </div>
        )}
      </div>
      {expanded && docs?.length > 1 && (
        <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/50">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5 mb-2">
            <History className="w-3.5 h-3.5" /> Upload History
          </p>
          <div className="space-y-2">
            {docs.slice(1).map((doc: any) => (
              <div key={doc.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-2">
                  <StatusBadge status={doc.status} />
                  <span className="text-xs text-slate-400">{new Date(doc.createdAt).toLocaleDateString('en-IN')}</span>
                  {doc.remarks && <span className="text-xs text-red-400 italic truncate max-w-[120px]">{doc.remarks}</span>}
                </div>
                <div className="flex gap-1">
                  <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="p-1 hover:bg-slate-200 rounded text-slate-400"><Eye className="w-3.5 h-3.5" /></a>
                  <a href={doc.fileUrl} download target="_blank" rel="noreferrer" className="p-1 hover:bg-slate-200 rounded text-slate-400"><Download className="w-3.5 h-3.5" /></a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── HR Doc Card ──────────────────────────────────────────────────────────────
function HRDocCard({ doc, onVerify, onReject, onDelete, onView }: any) {
  const token = localStorage.getItem('hrms_token')
  const apiBase = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api/v1'
  const filename = doc.fileUrl?.split('/').pop()
  const downloadUrl = `${apiBase}/documents/download/${filename}?name=${encodeURIComponent(doc.name)}`

  return (
    <div className="card p-4 space-y-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`p-2 rounded-xl shrink-0 ${doc.status === 'VERIFIED' ? 'bg-emerald-50' : doc.status === 'REJECTED' ? 'bg-red-50' : 'bg-amber-50'}`}>
            <FileText className={`w-5 h-5 ${doc.status === 'VERIFIED' ? 'text-emerald-500' : doc.status === 'REJECTED' ? 'text-red-400' : 'text-amber-500'}`} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-slate-800 truncate">{doc.name}</p>
            <p className="text-xs text-slate-400">{DOC_TYPE_MAP[doc.type] || doc.type}</p>
            <p className="text-xs font-medium text-primary-600 mt-0.5">{doc.employee?.firstName} {doc.employee?.lastName} · {doc.employee?.employeeCode}</p>
            <p className="text-xs text-slate-300">{doc.employee?.department?.name}</p>
          </div>
        </div>
        <StatusBadge status={doc.status} />
      </div>
      {doc.status === 'REJECTED' && doc.remarks && (
        <div className="bg-red-50 rounded-lg px-3 py-2 text-xs text-red-600 border border-red-100">
          <span className="font-semibold">Reason:</span> {doc.remarks}
        </div>
      )}
      <div className="text-xs text-slate-400">
        Uploaded {new Date(doc.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
      </div>
      <div className="flex gap-2 pt-1 border-t border-slate-50">
        <button onClick={() => onView(doc)}
          className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50">
          <Eye className="w-3.5 h-3.5" /> View
        </button>
        <a href={downloadUrl} download={`${doc.name}.pdf`}
          className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50">
          <Download className="w-3.5 h-3.5" /> Download
        </a>
        {doc.status === 'PENDING' && (
          <>
            <button onClick={() => onVerify(doc.id)}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold">
              <CheckCircle className="w-3.5 h-3.5" /> Verify
            </button>
            <button onClick={() => onReject(doc)}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold">
              <XCircle className="w-3.5 h-3.5" /> Reject
            </button>
          </>
        )}
        <button onClick={() => onDelete(doc.id)}
          className="p-1.5 bg-slate-50 hover:bg-red-50 text-slate-300 hover:text-red-400 rounded-lg">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── PDF Viewer ───────────────────────────────────────────────────────────────
function ViewerModal({ doc, onClose }: any) {
  const apiBase = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api/v1'
  const filename = doc.fileUrl?.split('/').pop()
  const downloadUrl = `${apiBase}/documents/download/${filename}?name=${encodeURIComponent(doc.name)}`

  return (
    <Modal open onClose={onClose} title={doc.name} width="max-w-4xl">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <StatusBadge status={doc.status} />
          <a href={downloadUrl} download={`${doc.name}.pdf`} className="btn-secondary gap-2 text-sm">
            <Download className="w-4 h-4" /> Download PDF
          </a>
        </div>
        <div className="bg-slate-900 rounded-xl overflow-hidden" style={{ height: '70vh' }}>
          <iframe src={`${doc.fileUrl}#toolbar=1`} className="w-full h-full" title={doc.name} />
        </div>
      </div>
    </Modal>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DocumentsPage() {
  const isHR = useIsHR()
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const empId = user?.employee?.id || ''
  const currentPhoto = user?.employee?.profilePhoto || ''

  const [filterStatus, setFilterStatus] = useState('')
  const [search, setSearch] = useState('')
  const [showUpload, setShowUpload] = useState<{ type?: string; reupload?: boolean } | null>(null)
  const [showPhotoUpload, setShowPhotoUpload] = useState(false)
  const [rejectModal, setRejectModal] = useState<any>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [viewDoc, setViewDoc] = useState<any>(null)

  const { data: hrDocs = [], isLoading: hrLoading } = useQuery({
    queryKey: ['documents-hr', filterStatus],
    queryFn: () => documentsApi.getAll({ status: filterStatus || undefined }).then(r => r.data),
    enabled: isHR,
  })

  const { data: empDocsData, isLoading: empLoading } = useQuery({
    queryKey: ['documents-emp', empId],
    queryFn: () => documentsApi.getEmployee(empId).then(r => r.data),
    enabled: !isHR && !!empId,
  })

  const { data: employees = [] } = useQuery({
    queryKey: ['emp-list-docs'],
    queryFn: () => api.get('/employees', { params: { limit: 300 } }).then(r => r.data.data),
    enabled: isHR,
  })

  const verifyMut = useMutation({
    mutationFn: (id: string) => documentsApi.verify(id, { status: 'VERIFIED' }),
    onSuccess: () => { toast.success('✅ Document verified!'); qc.invalidateQueries({ queryKey: ['documents'] }) },
  })

  const rejectMut = useMutation({
    mutationFn: ({ id, remarks }: any) => documentsApi.verify(id, { status: 'REJECTED', remarks }),
    onSuccess: () => { toast.success('Document rejected'); qc.invalidateQueries({ queryKey: ['documents'] }); setRejectModal(null); setRejectReason('') },
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => isHR ? documentsApi.hrDelete(id) : documentsApi.delete(id),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['documents'] }) },
  })

  const filtered = (hrDocs as any[]).filter((d: any) => {
    if (!search) return true
    return `${d.employee?.firstName} ${d.employee?.lastName} ${d.name} ${d.type}`.toLowerCase().includes(search.toLowerCase())
  })

  const allDocs = empDocsData?.docs || []
  const byType = empDocsData?.byType || {}
  const pending = (hrDocs as any[]).filter((d: any) => d.status === 'PENDING').length
  const verified = (hrDocs as any[]).filter((d: any) => d.status === 'VERIFIED').length
  const rejected = (hrDocs as any[]).filter((d: any) => d.status === 'REJECTED').length
  const completedRequired = REQUIRED_DOCS.filter(t => t.required && byType[t.type]?.some((d: any) => d.status === 'VERIFIED')).length
  const totalRequired = REQUIRED_DOCS.filter(t => t.required).length
  const hasRejected = allDocs.some((d: any) => d.status === 'REJECTED')

  return (
    <div>
      <Header title="Documents"
        subtitle={isHR ? `${(hrDocs as any[]).length} total · ${pending} pending review` : `${completedRequired}/${totalRequired} required verified`} />

      <div className="p-6 space-y-5">

        {/* ── EMPLOYEE VIEW ─────────────────────────────────────────────── */}
        {!isHR && (
          <>
            {/* ── PHOTO UPLOAD SECTION ──────────────────────────────────────── */}
            <div className="card p-5 border-2 border-dashed border-slate-200 hover:border-primary-200 transition-colors">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  {currentPhoto ? (
                    <img src={currentPhoto} alt="Profile" className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center border-2 border-slate-200">
                      <User className="w-7 h-7 text-slate-300" />
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center border-2 border-white">
                    <Camera className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-700">Profile Photo</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {currentPhoto ? 'Photo uploaded · Click to update' : 'No photo uploaded yet · Required for ID card'}
                  </p>
                </div>
                <button
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${currentPhoto ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={() => setShowPhotoUpload(true)}
                >
                  <Camera className="w-4 h-4" />
                  {currentPhoto ? 'Change Photo' : 'Upload Photo'}
                </button>
              </div>
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-bold text-slate-700">Document Completion</p>
                  <p className="text-sm text-slate-400 mt-0.5">Upload all required docs for HR verification</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary-600">{completedRequired}/{totalRequired}</p>
                  <p className="text-xs text-slate-400">Required verified</p>
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div className={`h-2.5 rounded-full transition-all ${completedRequired === totalRequired ? 'bg-emerald-500' : 'bg-primary-500'}`}
                  style={{ width: `${Math.round((completedRequired / totalRequired) * 100)}%` }} />
              </div>
              <div className="flex gap-4 mt-3 text-xs text-slate-400">
                <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> {allDocs.filter((d: any) => d.status === 'VERIFIED').length} Verified</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-amber-500" /> {allDocs.filter((d: any) => d.status === 'PENDING').length} Pending</span>
                <span className="flex items-center gap-1"><XCircle className="w-3.5 h-3.5 text-red-400" /> {allDocs.filter((d: any) => d.status === 'REJECTED').length} Rejected</span>
              </div>
            </div>
            {hasRejected && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-700">Some documents were rejected</p>
                  <p className="text-xs text-red-500 mt-0.5">Re-upload the corrected versions. HR's reason is shown on each.</p>
                </div>
              </div>
            )}
            <div className="flex justify-end">
              <button className="btn-primary gap-2" onClick={() => setShowUpload({})}>
                <Upload className="w-4 h-4" /> Upload Document
              </button>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Required Documents</p>
            <div className="space-y-3">
              {REQUIRED_DOCS.filter(t => t.required).map(t => (
                <DocTypeCard key={t.type} typeDef={t} docs={byType[t.type] || []}
                  onUpload={(type: string, reupload: boolean) => setShowUpload({ type, reupload })}
                  onView={setViewDoc} />
              ))}
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Optional Documents</p>
            <div className="space-y-3">
              {REQUIRED_DOCS.filter(t => !t.required).map(t => (
                <DocTypeCard key={t.type} typeDef={t} docs={byType[t.type] || []}
                  onUpload={(type: string, reupload: boolean) => setShowUpload({ type, reupload })}
                  onView={setViewDoc} />
              ))}
            </div>
          </>
        )}

        {/* ── HR VIEW ───────────────────────────────────────────────────── */}
        {isHR && (
          <>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Total', value: (hrDocs as any[]).length, color: 'text-slate-700', bg: 'bg-white' },
                { label: 'Pending Review', value: pending, color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'Verified', value: verified, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Rejected', value: rejected, color: 'text-red-500', bg: 'bg-red-50' },
              ].map(s => (
                <div key={s.label} className={`card p-4 text-center ${s.bg}`}>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-slate-400 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input className="input pl-9" placeholder="Search employee or document..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select className="input max-w-44" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="VERIFIED">Verified</option>
                <option value="REJECTED">Rejected</option>
              </select>
              <button className="btn-primary ml-auto gap-2" onClick={() => setShowUpload({})}>
                <Upload className="w-4 h-4" /> Upload for Employee
              </button>
            </div>
            {pending > 0 && !filterStatus && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-500 shrink-0" />
                <p className="text-sm text-amber-700"><strong>{pending}</strong> document{pending > 1 ? 's' : ''} pending review.</p>
                <button onClick={() => setFilterStatus('PENDING')} className="ml-auto text-xs text-amber-700 underline font-medium">View pending</button>
              </div>
            )}
            {hrLoading ? <PageLoader /> : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((doc: any) => (
                  <HRDocCard key={doc.id} doc={doc}
                    onVerify={(id: string) => verifyMut.mutate(id)}
                    onReject={(doc: any) => { setRejectModal(doc); setRejectReason('') }}
                    onDelete={(id: string) => { if (confirm('Delete this document?')) deleteMut.mutate(id) }}
                    onView={setViewDoc} />
                ))}
                {!filtered.length && (
                  <div className="col-span-3 card p-16 text-center">
                    <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400 font-medium">No documents found</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {showPhotoUpload && (
        <PhotoUploadModal onClose={() => setShowPhotoUpload(false)} empId={empId} currentPhoto={currentPhoto} />
      )}

      {showUpload !== null && (
        <UploadModal onClose={() => setShowUpload(null)} empId={empId} isHR={isHR}
          employees={employees} forType={showUpload.type} isReupload={showUpload.reupload} />
      )}

      <Modal open={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject Document" width="max-w-md">
        {rejectModal && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
              <p className="font-semibold text-red-700">{rejectModal.name}</p>
              <p className="text-xs text-red-500 mt-0.5">{DOC_TYPE_MAP[rejectModal.type]} · {rejectModal.employee?.firstName} {rejectModal.employee?.lastName}</p>
            </div>
            <FormField label="Rejection Reason * (Employee will see this)">
              <textarea className="input min-h-[90px] resize-none" value={rejectReason}
                placeholder="Explain clearly so employee knows what to fix..."
                onChange={e => setRejectReason(e.target.value)} />
            </FormField>
            <div className="flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setRejectModal(null)}>Cancel</button>
              <button className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
                disabled={!rejectReason.trim() || rejectMut.isPending}
                onClick={() => rejectMut.mutate({ id: rejectModal.id, remarks: rejectReason })}>
                <XCircle className="w-4 h-4" /> {rejectMut.isPending ? 'Rejecting...' : 'Reject Document'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {viewDoc && <ViewerModal doc={viewDoc} onClose={() => setViewDoc(null)} />}
    </div>
  )
}
