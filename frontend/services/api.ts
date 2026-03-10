import axios from 'axios'
import toast from 'react-hot-toast'

export const api = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config: any) => {
  const token = localStorage.getItem('hrms_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res: any) => res,
  (err: any) => {
    const message = err.response?.data?.message || 'Something went wrong'
    if (err.response?.status === 401) {
      localStorage.removeItem('hrms_token')
      localStorage.removeItem('hrms_user')
      window.location.href = '/login'
    } else if (err.response?.status !== 404) {
      toast.error(Array.isArray(message) ? message[0] : message)
    }
    return Promise.reject(err)
  },
)

export const authApi = {
  login: (data: any) => api.post('/auth/login', data),
  profile: () => api.get('/auth/profile'),
  changePassword: (data: any) => api.patch('/auth/change-password', data),
}

export const dashboardApi = {
  get: () => api.get('/dashboard'),
  admin: () => api.get('/dashboard/admin'),
  employee: () => api.get('/dashboard/employee'),
}

export const employeesApi = {
  list: (params?: any) => api.get('/employees', { params }),
  directory: () => api.get('/employees/directory'),
  orgChart: () => api.get('/employees/org-chart'),
  get: (id: string) => api.get(`/employees/${id}`),
  create: (data: any) => api.post('/employees', data),
  update: (id: string, data: any) => api.patch(`/employees/${id}`, data),
  delete: (id: string) => api.delete(`/employees/${id}`),
  bulkImport: (rows: any[], departmentId: string) => api.post('/employees/bulk-import', { rows, departmentId }),
}

export const departmentsApi = {
  list: () => api.get('/departments'),
  get: (id: string) => api.get(`/departments/${id}`),
  create: (data: any) => api.post('/departments', data),
  update: (id: string, data: any) => api.patch(`/departments/${id}`, data),
  delete: (id: string) => api.delete(`/departments/${id}`),
}

export const leavesApi = {
  list: (params?: any) => api.get('/leaves', { params }),
  get: (id: string) => api.get(`/leaves/${id}`),
  apply: (data: any) => api.post('/leaves', data),
  approve: (id: string, data: any) => api.patch(`/leaves/${id}/approve`, data),
  cancel: (id: string) => api.patch(`/leaves/${id}/cancel`),
  myBalances: (year?: number) => api.get('/leaves/balances', { params: { year } }),
  balances: (empId: string, year?: number) => api.get(`/leaves/balances/${empId}`, { params: { year } }),
}

export const attendanceApi = {
  checkIn: (data?: any) => api.post('/attendance/check-in', data || {}),
  checkOut: (data?: any) => api.post('/attendance/check-out', data || {}),
  today: () => api.get('/attendance/today'),
  summary: (params?: any) => api.get('/attendance/summary', { params }),
  list: (params?: any) => api.get('/attendance', { params }),
  report: (params: any) => api.get('/attendance/report', { params }),
  reportCsvUrl: (params: any) => {
    const token = localStorage.getItem('hrms_token')
    const base = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api/v1'
    const clean: any = {}
    Object.keys(params).forEach(k => { if (params[k] != null) clean[k] = params[k] })
    const q = new URLSearchParams(clean).toString()
    return `${base}/attendance/report/csv?${q}&token=${token}`
  },
  reportEmployee: (empId: string, params: any) => api.get(`/attendance/report/employee/${empId}`, { params }),
  downloadCsv: async (params: any, filename?: string) => {
    const token = localStorage.getItem('hrms_token')
    const base = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api/v1'
    const clean: any = {}
    Object.keys(params).forEach(k => { if (params[k] != null) clean[k] = params[k] })
    const q = new URLSearchParams(clean).toString()
    const res = await fetch(`${base}/attendance/report/csv?${q}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      if (res.status === 401) throw new Error('Session expired. Please log in again.')
      const body = await res.json().catch(() => null)
      throw new Error(body?.message || `Download failed (${res.status})`)
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename || 'attendance-report.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  },
  downloadEmployeeCsv: async (empId: string, params: any, filename?: string) => {
    const token = localStorage.getItem('hrms_token')
    const base = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api/v1'
    const clean: any = {}
    Object.keys(params).forEach(k => { if (params[k] != null) clean[k] = params[k] })
    const q = new URLSearchParams(clean).toString()
    const res = await fetch(`${base}/attendance/report/employee/${empId}/csv?${q}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      if (res.status === 401) throw new Error('Session expired. Please log in again.')
      const body = await res.json().catch(() => null)
      throw new Error(body?.message || `Download failed (${res.status})`)
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename || 'employee-attendance.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  },
}

export const payrollApi = {
  list: (params?: any) => api.get('/payroll', { params }),
  myPayslips: (params?: any) => api.get('/payroll/my-payslips', { params }),
  generate: (data: any) => api.post('/payroll/generate', data),
  get: (id: string) => api.get(`/payroll/${id}`),
  updateStatus: (id: string, status: string) => api.patch(`/payroll/${id}/status`, { status }),
  structures: () => api.get('/payroll/salary-structures'),
}

export const performanceApi = {
  list: (params?: any) => api.get('/performance', { params }),
  get: (id: string) => api.get(`/performance/${id}`),
  create: (data: any) => api.post('/performance', data),
  update: (id: string, data: any) => api.patch(`/performance/${id}`, data),
}

export const assetsApi = {
  list: (params?: any) => api.get('/assets', { params }),
  myAssets: () => api.get('/assets/my-assets'),
  get: (id: string) => api.get(`/assets/${id}`),
  create: (data: any) => api.post('/assets', data),
  update: (id: string, data: any) => api.patch(`/assets/${id}`, data),
  assign: (id: string, employeeId: string) => api.patch(`/assets/${id}/assign`, { employeeId }),
  unassign: (id: string) => api.patch(`/assets/${id}/unassign`),
  delete: (id: string) => api.delete(`/assets/${id}`),
}

export const announcementsApi = {
  list: () => api.get('/announcements'),
  create: (data: any) => api.post('/announcements', data),
  update: (id: string, data: any) => api.patch(`/announcements/${id}`, data),
  delete: (id: string) => api.delete(`/announcements/${id}`),
}

export const holidaysApi = {
  list: (year?: number) => api.get('/holidays', { params: { year } }),
  upcoming: () => api.get('/holidays/upcoming'),
  create: (data: any) => api.post('/holidays', data),
  delete: (id: string) => api.delete(`/holidays/${id}`),
}

export const recruitmentApi = {
  getJobs: (all?: boolean) => api.get('/recruitment/jobs', { params: { all } }),
  createJob: (data: any) => api.post('/recruitment/jobs', data),
  updateJob: (id: string, data: any) => api.patch(`/recruitment/jobs/${id}`, data),
  getCandidates: (params?: any) => api.get('/recruitment/candidates', { params }),
  getCandidate: (id: string) => api.get(`/recruitment/candidates/${id}`),
  createCandidate: (data: any) => api.post('/recruitment/candidates', data),
  updateCandidate: (id: string, data: any) => api.patch(`/recruitment/candidates/${id}`, data),
  deleteCandidate: (id: string) => api.delete(`/recruitment/candidates/${id}`),
  addCall: (id: string, data: any) => api.post(`/recruitment/candidates/${id}/calls`, data),
  scheduleInterview: (id: string, data: any) => api.post(`/recruitment/candidates/${id}/interviews`, data),
  updateInterview: (id: string, data: any) => api.patch(`/recruitment/interviews/${id}`, data),
  createOffer: (id: string, data: any) => api.post(`/recruitment/candidates/${id}/offer`, data),
  acceptOffer: (id: string) => api.patch(`/recruitment/candidates/${id}/offer/accept`),
  rejectOffer: (id: string, reason?: string) => api.patch(`/recruitment/candidates/${id}/offer/reject`, { reason }),
  markJoined: (id: string) => api.patch(`/recruitment/candidates/${id}/joined`),
  getStats: () => api.get('/recruitment/stats'),
}

export const documentsApi = {
  list: (params?: any) => api.get('/documents', { params }),
  getAll: (params?: any) => api.get('/documents', { params }),
  getStats: () => api.get('/documents/stats'),
  getDeptStats: () => api.get('/documents/dept-stats'),
  getEmployee: (empId: string) => api.get(`/documents/employee/${empId}`),
  upload: (empId: string, formData: FormData) => api.post(`/documents/employee/${empId}`, formData, {
    headers: { 'Content-Type': undefined },
  }),
  verify: (id: string, data: any) => api.patch(`/documents/${id}/verify`, data),
  delete: (id: string) => api.delete(`/documents/${id}`),
  hrDelete: (id: string) => api.delete(`/documents/${id}/force`),
  downloadUrl: (fileUrl: string, name: string) => {
    const filename = fileUrl.split('/').pop()
    return `${(import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api/v1'}/documents/download/${filename}?name=${encodeURIComponent(name)}`
  },
}

export const onboardingApi = {
  getAll: () => api.get('/onboarding'),
  getAllOffboarding: () => api.get('/onboarding/offboarding'),
  getEmployee: (id: string) => api.get(`/onboarding/${id}`),
  getEmployeeOffboarding: (id: string) => api.get(`/onboarding/${id}/offboarding`),
  importExcel: (rows: any[]) => api.post('/onboarding/import-excel', { rows }),
  completeTask: (taskId: string) => api.patch(`/onboarding/tasks/${taskId}/complete`),
  uncompleteTask: (taskId: string) => api.patch(`/onboarding/tasks/${taskId}/uncomplete`),
  completeOffboardingTask: (taskId: string) => api.patch(`/onboarding/offboarding/tasks/${taskId}/complete`),
  initOffboarding: (empId: string) => api.post(`/onboarding/${empId}/offboarding/init`),
  initiateOffboarding: (empId: string, data: any) => api.post(`/onboarding/${empId}/offboarding/init`, data),
}