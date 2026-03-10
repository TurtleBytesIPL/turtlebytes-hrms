import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Users, Mail, Phone, ArrowLeft, Briefcase } from 'lucide-react'
import { employeesApi, departmentsApi } from '../../services/api'
import Header from '../../components/layout/Header'
import { PageLoader, EmptyState, Avatar } from '../../components/ui'

export default function DepartmentEmployeesPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: dept } = useQuery({
    queryKey: ['department', id],
    queryFn: () => departmentsApi.get(id!).then(r => r.data),
    enabled: !!id,
  })

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees', 'department', id],
    queryFn: () => employeesApi.byDepartment(id!).then(r => r.data),
    enabled: !!id,
  })

  if (isLoading) return (
    <>
      <Header
        title="Loading..."
        subtitle={<button onClick={() => navigate('/departments')} className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium mt-0.5"><ArrowLeft className="w-3 h-3" /> Back to Departments</button>}
      />
      <PageLoader />
    </>
  )

  const deptName = dept?.name ?? 'Department'

  return (
    <div>
      <Header
        title={`${deptName} Employees`}
        subtitle={
          <div className="flex items-center gap-3 mt-0.5">
            <button
              onClick={() => navigate('/departments')}
              className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              <ArrowLeft className="w-3 h-3" /> Back to Departments
            </button>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">{employees.length} {employees.length === 1 ? 'employee' : 'employees'}</span>
          </div>
        }
      />

      <div className="p-6">
        {/* Department badge */}
        {dept && (
          <div className="flex items-center gap-3 mb-6 p-4 bg-primary-50 rounded-xl border border-primary-100">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Users className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="font-bold text-primary-800">{dept.name}</p>
              <p className="text-xs text-primary-500 font-mono">{dept.code}{dept.description ? ` · ${dept.description}` : ''}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-2xl font-bold text-primary-700">{employees.length}</p>
              <p className="text-xs text-primary-500">employees</p>
            </div>
          </div>
        )}

        {/* Employee grid */}
        {employees.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No employees in this department"
            description="Employees assigned to this department will appear here."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employees.map((emp: any) => {
              const fullName = `${emp.firstName} ${emp.lastName}`.trim()
              return (
                <div
                  key={emp.id}
                  className="card p-5 hover:shadow-card-hover transition-shadow"
                >
                  {/* Top: avatar + name + title */}
                  <div className="flex items-start gap-3">
                    <Avatar name={fullName} photo={emp.profilePhoto} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-800 text-sm leading-tight truncate">{fullName}</p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{emp.employeeCode}</p>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-slate-100 mt-3 pt-3 space-y-2">
                    {/* Job title */}
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-xs text-slate-600 truncate">{emp.jobTitle || '—'}</span>
                    </div>

                    {/* Email */}
                    {emp.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-xs text-slate-600 truncate">{emp.email}</span>
                      </div>
                    )}

                    {/* Phone */}
                    {emp.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-xs text-slate-600">{emp.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
