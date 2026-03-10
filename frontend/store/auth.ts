import { create } from 'zustand'

interface User {
  id: string
  email: string
  role: 'SUPER_ADMIN' | 'HR_ADMIN' | 'MANAGER' | 'EMPLOYEE'
  employee?: {
    id: string
    name: string
    employeeCode: string
    jobTitle: string
    department: string
    profilePhoto?: string
  }
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: (() => {
    try { return JSON.parse(localStorage.getItem('hrms_user') || 'null') } catch { return null }
  })(),
  token: localStorage.getItem('hrms_token'),
  isAuthenticated: !!localStorage.getItem('hrms_token'),

  setAuth: (user, token) => {
    localStorage.setItem('hrms_token', token)
    localStorage.setItem('hrms_user', JSON.stringify(user))
    set({ user, token, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('hrms_token')
    localStorage.removeItem('hrms_user')
    set({ user: null, token: null, isAuthenticated: false })
  },
}))

export const useIsHR = () => {
  const role = useAuthStore((s) => s.user?.role)
  return role === 'SUPER_ADMIN' || role === 'HR_ADMIN'
}

export const useIsManager = () => {
  const role = useAuthStore((s) => s.user?.role)
  return role === 'SUPER_ADMIN' || role === 'HR_ADMIN' || role === 'MANAGER'
}
