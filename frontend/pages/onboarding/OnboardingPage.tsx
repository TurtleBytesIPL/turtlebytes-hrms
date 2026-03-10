import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, Circle, ChevronRight, AlertCircle, Rocket, UserMinus, Calendar } from 'lucide-react'
import { onboardingApi } from '../../services/api'
import { useIsHR } from '../../store/auth'
import Header from '../../components/layout/Header'
import { Avatar, Modal, FormField, PageLoader } from '../../components/ui'
import { formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
      <div className={`h-2 rounded-full transition-all ${value === 100 ? 'bg-emerald-500' : 'bg-primary-500'}`}
        style={{ width: `${value}%` }} />
    </div>
  )
}

function EmployeeCard({ emp, onClick, isSelected }: any) {
  return (
    <button
      onClick={() => onClick(emp)}
      className={`w-full text-left card p-4 transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-primary-500 bg-primary-50/30' : ''}`}>
      <div className="flex items-center gap-3 mb-3">
        <Avatar name={`${emp.firstName} ${emp.lastName}`} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 text-sm truncate">{emp.firstName} {emp.lastName}</p>
          <p className="text-xs text-slate-400 truncate">{emp.employeeCode} · {emp.department?.name}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
      </div>
      <ProgressBar value={emp.progress || 0} />
      <div className="flex justify-between mt-1.5">
        <span className="text-xs text-slate-400">{emp.completed || 0}/{emp.total || 0} tasks</span>
        <span className={`text-xs font-bold ${emp.progress === 100 ? 'text-emerald-600' : 'text-primary-600'}`}>
          {emp.progress || 0}%
        </span>
      </div>
    </button>
  )
}

export default function OnboardingPage() {
  const isHR = useIsHR()
  const qc = useQueryClient()
  const [tab, setTab] = useState<'onboarding' | 'offboarding'>('onboarding')
  const [selected, setSelected] = useState<any>(null)
  const [showOffboardInit, setShowOffboardInit] = useState<any>(null)
  const [relievingDate, setRelievingDate] = useState('')

  const { data: onboardingList = [], isLoading: loadOn } = useQuery({
    queryKey: ['onboarding-all'],
    queryFn: () => onboardingApi.getAll().then(r => r.data),
    enabled: isHR,
  })

  const { data: offboardingList = [], isLoading: loadOff } = useQuery({
    queryKey: ['offboarding-all'],
    queryFn: () => onboardingApi.getAllOffboarding().then(r => r.data),
    enabled: isHR,
  })

  const { data: empOnboarding } = useQuery({
    queryKey: ['onboarding-emp', selected?.id],
    queryFn: () => onboardingApi.getEmployee(selected.id).then(r => r.data),
    enabled: !!selected && tab === 'onboarding',
  })

  const { data: empOffboarding } = useQuery({
    queryKey: ['offboarding-emp', selected?.id],
    queryFn: () => onboardingApi.getEmployeeOffboarding(selected.id).then(r => r.data),
    enabled: !!selected && tab === 'offboarding',
  })

  const completeOnMut = useMutation({
    mutationFn: (taskId: string) => onboardingApi.completeTask(taskId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['onboarding-emp', selected?.id] })
      qc.invalidateQueries({ queryKey: ['onboarding-all'] })
    },
  })

  const uncompleteOnMut = useMutation({
    mutationFn: (taskId: string) => onboardingApi.uncompleteTask(taskId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['onboarding-emp', selected?.id] }),
  })

  const completeOffMut = useMutation({
    mutationFn: (taskId: string) => onboardingApi.completeOffboardingTask(taskId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['offboarding-emp', selected?.id] })
      qc.invalidateQueries({ queryKey: ['offboarding-all'] })
    },
  })

  const initOffMut = useMutation({
    mutationFn: ({ empId, date }: any) => onboardingApi.initOffboarding(empId, date),
    onSuccess: () => {
      toast.success('Offboarding initiated!')
      qc.invalidateQueries({ queryKey: ['offboarding-all'] })
      qc.invalidateQueries({ queryKey: ['onboarding-all'] })
      setShowOffboardInit(null)
      setTab('offboarding')
    },
  })

  const handleToggle = (task: any) => {
    if (tab === 'onboarding') {
      task.isCompleted ? uncompleteOnMut.mutate(task.id) : completeOnMut.mutate(task.id)
    } else {
      if (!task.isCompleted) completeOffMut.mutate(task.id)
    }
  }

  const list = tab === 'onboarding' ? onboardingList : offboardingList
  const loading = tab === 'onboarding' ? loadOn : loadOff
  const empData = tab === 'onboarding' ? empOnboarding : empOffboarding

  return (
    <div>
      <Header title="Onboarding & Offboarding" subtitle="Employee lifecycle management" />

      <div className="p-6 space-y-4">
        {/* Tabs */}
        <div className="flex gap-2">
          {[
            { key: 'onboarding', label: '🚀 Onboarding', count: (onboardingList as any[]).length },
            { key: 'offboarding', label: '🚪 Offboarding', count: (offboardingList as any[]).length },
          ].map(t => (
            <button key={t.key}
              onClick={() => { setTab(t.key as any); setSelected(null) }}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all
                ${tab === t.key ? 'bg-primary-600 text-white shadow' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {t.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${tab === t.key ? 'bg-white/20' : 'bg-slate-100'}`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Employee List */}
          <div className="space-y-3 lg:overflow-y-auto lg:max-h-[calc(100vh-260px)]">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
              {tab === 'onboarding' ? 'Active Employees' : 'Resigned Employees'}
            </p>

            {loading ? <PageLoader /> : (list as any[]).length === 0 ? (
              <div className="card p-8 text-center">
                <AlertCircle className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">
                  {tab === 'offboarding' ? 'No offboarding in progress' : 'No employees'}
                </p>
              </div>
            ) : (list as any[]).map((emp: any) => (
              <EmployeeCard key={emp.id} emp={emp} onClick={setSelected} isSelected={selected?.id === emp.id} />
            ))}
          </div>

          {/* Task Panel */}
          <div className="lg:col-span-2">
            {!selected ? (
              <div className="card p-12 text-center h-full flex flex-col items-center justify-center min-h-80">
                <Rocket className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 font-medium">Select an employee</p>
                <p className="text-sm text-slate-300 mt-1">to view and manage their {tab} tasks</p>
              </div>
            ) : (
              <div className="card p-6 space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={`${selected.firstName} ${selected.lastName}`} size="md" />
                    <div>
                      <p className="font-bold text-slate-800">{selected.firstName} {selected.lastName}</p>
                      <p className="text-sm text-slate-400">{selected.jobTitle} · {selected.department?.name}</p>
                    </div>
                  </div>
                  {tab === 'onboarding' && isHR && (
                    <button
                      onClick={() => setShowOffboardInit(selected)}
                      className="text-xs px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 rounded-xl hover:bg-red-100 font-semibold">
                      Initiate Offboarding
                    </button>
                  )}
                </div>

                {/* Progress bar */}
                {empData && (
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-bold text-slate-600 capitalize">{tab} Progress</span>
                      <span className={`text-sm font-bold ${empData.progress === 100 ? 'text-emerald-600' : 'text-primary-600'}`}>
                        {empData.progress}%
                      </span>
                    </div>
                    <ProgressBar value={empData.progress} />
                    <p className="text-xs text-slate-400 mt-2">{empData.completed} of {empData.total} steps completed</p>
                  </div>
                )}

                {/* Checklist */}
                {empData && (
                  <div className="space-y-2">
                    {empData.tasks.map((task: any) => (
                      <div
                        key={task.id}
                        onClick={() => isHR && handleToggle(task)}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all
                          ${isHR ? 'cursor-pointer' : ''}
                          ${task.isCompleted
                            ? 'bg-emerald-50 border-emerald-200'
                            : 'bg-white border-slate-100 hover:border-slate-200'
                          }`}>
                        {task.isCompleted
                          ? <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                          : <Circle className="w-5 h-5 text-slate-300 shrink-0 mt-0.5" />
                        }
                        <div className="flex-1">
                          <p className={`text-sm font-semibold ${task.isCompleted ? 'text-emerald-700 line-through' : 'text-slate-700'}`}>
                            {task.task}
                          </p>
                          {task.description && (
                            <p className="text-xs text-slate-400 mt-0.5">{task.description}</p>
                          )}
                          {task.completedAt && (
                            <p className="text-xs text-emerald-500 mt-0.5">
                              Done on {new Date(task.completedAt).toLocaleDateString('en-IN')}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-slate-300 shrink-0">Step {task.order}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Init Offboarding Modal */}
      <Modal open={!!showOffboardInit} onClose={() => setShowOffboardInit(null)} title="Initiate Offboarding" width="max-w-md">
        {showOffboardInit && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
              <p className="text-sm font-semibold text-red-700">
                {showOffboardInit.firstName} {showOffboardInit.lastName}
              </p>
              <p className="text-xs text-red-500 mt-0.5">
                This will change employee status to Resigned and start offboarding process.
              </p>
            </div>
            <FormField label="Last Working Day / Relieving Date">
              <input type="date" className="input" value={relievingDate}
                onChange={e => setRelievingDate(e.target.value)} />
            </FormField>
            <div className="flex justify-end gap-2 pt-2">
              <button className="btn-secondary" onClick={() => setShowOffboardInit(null)}>Cancel</button>
              <button
                className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-xl text-sm font-semibold"
                disabled={initOffMut.isPending}
                onClick={() => initOffMut.mutate({ empId: showOffboardInit.id, date: relievingDate || undefined })}>
                {initOffMut.isPending ? 'Processing...' : 'Initiate Offboarding'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
