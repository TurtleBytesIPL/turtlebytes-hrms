import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { teamsApi, employeesApi } from '../../services/api'
import { useAuthStore } from '../../store/auth'
import toast from 'react-hot-toast'

const HR_ROLES = ['SUPER_ADMIN', 'HR_ADMIN']
const useIsHR = () => { const { user } = useAuthStore(); return HR_ROLES.includes(user?.role as string) }
const useIsTeamLead = () => { const { user } = useAuthStore(); return (user?.role as string) === 'TEAM_LEAD' }

function Avatar({ emp, size = 8 }: any) {
  const colors = ['bg-blue-500','bg-green-500','bg-purple-500','bg-orange-500','bg-pink-500']
  const color = colors[(emp.firstName?.charCodeAt(0) || 0) % colors.length]
  const initials = `${emp.firstName?.[0] || ''}${emp.lastName?.[0] || ''}`.toUpperCase()
  if (emp.profilePhoto) return <img src={emp.profilePhoto} className={`w-${size} h-${size} rounded-full object-cover`} />
  return <div className={`w-${size} h-${size} rounded-full ${color} flex items-center justify-center text-white text-xs font-bold`}>{initials}</div>
}

function AssignModal({ team, onClose }: any) {
  const qc = useQueryClient()
  const { data: empData } = useQuery({ queryKey: ['employees-all'], queryFn: () => employeesApi.list({ limit: 200 }).then(r => r.data) })
  const employees = empData?.data || []
  const currentIds = (team.members || []).map((m: any) => m.id)
  const [selected, setSelected] = useState<string[]>(currentIds)

  const assignMut = useMutation({
    mutationFn: () => teamsApi.assignMembers(team.id, selected),
    onSuccess: () => { toast.success('Team members updated'); qc.invalidateQueries({ queryKey: ['teams'] }); onClose() },
  })

  const toggle = (id: string) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Assign Members — {team.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <div className="p-4 max-h-96 overflow-y-auto space-y-1">
          {employees.map((emp: any) => (
            <label key={emp.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input type="checkbox" checked={selected.includes(emp.id)} onChange={() => toggle(emp.id)} className="w-4 h-4 accent-blue-600" />
              <Avatar emp={emp} size={8} />
              <div>
                <p className="text-sm font-medium text-gray-900">{emp.firstName} {emp.lastName}</p>
                <p className="text-xs text-gray-500">{emp.jobTitle} · {emp.department?.name}</p>
              </div>
            </label>
          ))}
        </div>
        <div className="p-4 border-t flex gap-2 justify-end">
          <button onClick={onClose} className="btn-secondary px-4 py-2 text-sm">Cancel</button>
          <button onClick={() => assignMut.mutate()} disabled={assignMut.isPending} className="btn-primary px-4 py-2 text-sm">
            {assignMut.isPending ? 'Saving...' : `Save (${selected.length} selected)`}
          </button>
        </div>
      </div>
    </div>
  )
}

function CreateModal({ onClose }: any) {
  const qc = useQueryClient()
  const { data: empData } = useQuery({ queryKey: ['employees-all'], queryFn: () => employeesApi.list({ limit: 200 }).then(r => r.data) })
  const employees = (empData?.data || []).filter((e: any) => e.user?.role === 'TEAM_LEAD' || e.jobTitle?.toLowerCase().includes('lead'))
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [leadId, setLeadId] = useState('')

  const createMut = useMutation({
    mutationFn: () => teamsApi.create({ name, description: desc, leadId: leadId || undefined }),
    onSuccess: () => { toast.success('Team created'); qc.invalidateQueries({ queryKey: ['teams'] }); onClose() },
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Create New Team</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">Team Name *</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Team Alpha" />
          </div>
          <div>
            <label className="label">Description</label>
            <input className="input" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Team description" />
          </div>
          <div>
            <label className="label">Team Lead</label>
            <select className="input" value={leadId} onChange={e => setLeadId(e.target.value)}>
              <option value="">Select Team Lead</option>
              {empData?.data?.map((e: any) => (
                <option key={e.id} value={e.id}>{e.firstName} {e.lastName} — {e.jobTitle}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="p-4 border-t flex gap-2 justify-end">
          <button onClick={onClose} className="btn-secondary px-4 py-2 text-sm">Cancel</button>
          <button onClick={() => createMut.mutate()} disabled={!name || createMut.isPending} className="btn-primary px-4 py-2 text-sm">
            {createMut.isPending ? 'Creating...' : 'Create Team'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TeamsPage() {
  const isHR = useIsHR()
  const isTeamLead = useIsTeamLead()
  const { user } = useAuthStore()
  const [assignTeam, setAssignTeam] = useState<any>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: () => isTeamLead ? teamsApi.myTeam().then(r => [r.data]) : teamsApi.list().then(r => r.data),
  })

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
          <p className="text-sm text-gray-500 mt-1">{isTeamLead ? 'Your team' : `${teams.length} teams total`}</p>
        </div>
        {isHR && <button onClick={() => setShowCreate(true)} className="btn-primary px-4 py-2 text-sm">+ New Team</button>}
      </div>

      <div className="grid gap-4">
        {teams.map((team: any) => (
          <div key={team.id} className="card p-0 overflow-hidden">
            <div
              className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setExpanded(expanded === team.id ? null : team.id)}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                  {team.name?.slice(0,2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{team.name}</h3>
                  <p className="text-sm text-gray-500">{team.description || 'No description'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {team.lead && (
                  <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                    <Avatar emp={team.lead} size={6} />
                    <span>Lead: {team.lead.firstName} {team.lead.lastName}</span>
                  </div>
                )}
                <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                  {team._count?.members || team.members?.length || 0} members
                </span>
                <svg className={`w-5 h-5 text-gray-400 transition-transform ${expanded === team.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>

            {expanded === team.id && (
              <div className="border-t bg-gray-50 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-700">Team Members ({team.members?.length || 0})</h4>
                  {(isHR || (isTeamLead && team.leadId === user?.employee?.id)) && (
                    <button onClick={() => setAssignTeam(team)} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                      Manage Members
                    </button>
                  )}
                </div>
                {(team.members?.length || 0) === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No members assigned yet</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {team.members?.map((m: any) => (
                      <div key={m.id} className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm">
                        <Avatar emp={m} size={9} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{m.firstName} {m.lastName}</p>
                          <p className="text-xs text-gray-500 truncate">{m.jobTitle}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {teams.length === 0 && (
          <div className="card p-12 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">No teams yet</h3>
            <p className="text-sm text-gray-500 mb-4">Create your first team to get started</p>
            {isHR && <button onClick={() => setShowCreate(true)} className="btn-primary px-4 py-2 text-sm">Create Team</button>}
          </div>
        )}
      </div>

      {assignTeam && <AssignModal team={assignTeam} onClose={() => setAssignTeam(null)} />}
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
