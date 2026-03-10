// // Departments Page
// import { useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
// import { Plus, Building2 } from 'lucide-react'
// import { departmentsApi } from '../../services/api'
// import { useIsHR } from '../../store/auth'
// import Header from '../../components/layout/Header'
// import { Modal, FormField, PageLoader, EmptyState } from '../../components/ui'
// import { useForm } from 'react-hook-form'
// import toast from 'react-hot-toast'

// export function DepartmentsPage() {
//   const isHR = useIsHR()
//   const qc = useQueryClient()

//   const navigate = useNavigate()
//   const [showModal, setShowModal] = useState(false)
//   const { register, handleSubmit, reset } = useForm()

//   const { data = [], isLoading } = useQuery({
//     queryKey: ['departments'],
//     queryFn: () => departmentsApi.list().then(r => r.data),
//   })

//   const createMut = useMutation({
//     mutationFn: (d: any) => departmentsApi.create(d),
//     onSuccess: () => { toast.success('Department created!'); qc.invalidateQueries({ queryKey: ['departments'] }); setShowModal(false); reset() },
//   })

//   if (isLoading) return <><Header title="Departments" /><PageLoader /></>

//   return (
//     <div>
//       <Header title="Departments" subtitle={`${data.length} departments`} />
//       <div className="p-6 space-y-4">
//         {isHR && (
//           <div className="flex justify-end">
//             <button className="btn-primary" onClick={() => setShowModal(true)}>
//               <Plus className="w-4 h-4" /> Add Department
//             </button>
//           </div>
//         )}

//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//           {data.map((dept: any) => (
//             <div
//               key={dept.id}
//               onClick={() => navigate(`/employees?departmentId=${dept.id}`)}
//               className="card p-5 hover:shadow-card-hover transition-shadow cursor-pointer"
//             >
//               <div className="flex items-start justify-between">
//                 <div className="p-2.5 bg-primary-50 rounded-xl">
//                   <Building2 className="w-5 h-5 text-primary-600" />
//                 </div>
//                 <span className="text-xs font-mono font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">{dept.code}</span>
//               </div>
//               <h3 className="font-bold text-slate-800 mt-3">{dept.name}</h3>
//               {dept.description && <p className="text-xs text-slate-400 mt-1">{dept.description}</p>}
//               <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
//                 <p className="text-sm text-slate-500">
//                   <span className="font-bold text-slate-800">{dept._count?.employees}</span> employees
//                 </p>
//                 {dept.head && (
//                   <p className="text-xs text-slate-400">
//                     Head: <span className="font-medium text-slate-600">{dept.head.firstName} {dept.head.lastName}</span>
//                   </p>
//                 )}
//               </div>
//             </div>
//           ))}
//           {!data.length && <EmptyState icon={Building2} title="No departments" />}
//         </div>
//       </div>

//       <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Department">
//         <form onSubmit={handleSubmit(d => createMut.mutate(d))} className="space-y-4">
//           <FormField label="Department Name">
//             <input className="input" {...register('name', { required: true })} />
//           </FormField>
//           <FormField label="Code">
//             <input className="input uppercase" {...register('code', { required: true })} placeholder="e.g. ENG" />
//           </FormField>
//           <FormField label="Description">
//             <textarea className="input resize-none h-20" {...register('description')} />
//           </FormField>
//           <div className="flex justify-end gap-2">
//             <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
//             <button type="submit" className="btn-primary" disabled={createMut.isPending}>Create</button>
//           </div>
//         </form>
//       </Modal>
//     </div>
//   )
// }

// Departments Page
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Building2 } from 'lucide-react'
import { departmentsApi } from '../../services/api'
import { useIsHR } from '../../store/auth'
import Header from '../../components/layout/Header'
import { Modal, FormField, PageLoader, EmptyState } from '../../components/ui'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

export function DepartmentsPage() {
  const isHR = useIsHR()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const { register, handleSubmit, reset } = useForm()

  const { data = [], isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.list().then(r => r.data),
  })

  const createMut = useMutation({
    mutationFn: (d: any) => departmentsApi.create(d),
    onSuccess: () => { toast.success('Department created!'); qc.invalidateQueries({ queryKey: ['departments'] }); setShowModal(false); reset() },
  })

  if (isLoading) return <><Header title="Departments" /><PageLoader /></>

  return (
    <div>
      <Header title="Departments" subtitle={`${data.length} departments`} />
      <div className="p-6 space-y-4">
        {isHR && (
          <div className="flex justify-end">
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4" /> Add Department
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((dept: any) => (
            <div key={dept.id} className="card p-5 hover:shadow-card-hover transition-shadow cursor-pointer" onClick={() => navigate(`/departments/${dept.id}`)}>
              <div className="flex items-start justify-between">
                <div className="p-2.5 bg-primary-50 rounded-xl">
                  <Building2 className="w-5 h-5 text-primary-600" />
                </div>
                <span className="text-xs font-mono font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">{dept.code}</span>
              </div>
              <h3 className="font-bold text-slate-800 mt-3">{dept.name}</h3>
              {dept.description && <p className="text-xs text-slate-400 mt-1">{dept.description}</p>}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                <p className="text-sm text-slate-500">
                  <span className="font-bold text-slate-800">{dept._count?.employees}</span> employees
                </p>
                {dept.head && (
                  <p className="text-xs text-slate-400">
                    Head: <span className="font-medium text-slate-600">{dept.head.firstName} {dept.head.lastName}</span>
                  </p>
                )}
              </div>
            </div>
          ))}
          {!data.length && <EmptyState icon={Building2} title="No departments" />}
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Department">
        <form onSubmit={handleSubmit(d => createMut.mutate(d))} className="space-y-4">
          <FormField label="Department Name">
            <input className="input" {...register('name', { required: true })} />
          </FormField>
          <FormField label="Code">
            <input className="input uppercase" {...register('code', { required: true })} placeholder="e.g. ENG" />
          </FormField>
          <FormField label="Description">
            <textarea className="input resize-none h-20" {...register('description')} />
          </FormField>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={createMut.isPending}>Create</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
