import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatDate = (date: string | Date) =>
  format(new Date(date), 'dd MMM yyyy')

export const formatDateTime = (date: string | Date) =>
  format(new Date(date), 'dd MMM yyyy, hh:mm a')

export const formatTime = (date: string | Date) =>
  format(new Date(date), 'hh:mm a')

export const timeAgo = (date: string | Date) =>
  formatDistanceToNow(new Date(date), { addSuffix: true })

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)

export const getInitials = (name: string) =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

export const avatarColor = (name: string) => {
  const colors = [
    'bg-violet-100 text-violet-700',
    'bg-blue-100 text-blue-700',
    'bg-emerald-100 text-emerald-700',
    'bg-orange-100 text-orange-700',
    'bg-pink-100 text-pink-700',
    'bg-cyan-100 text-cyan-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

export const leaveStatusColor: Record<string, string> = {
  PENDING:   'bg-amber-100 text-amber-700',
  APPROVED:  'bg-emerald-100 text-emerald-700',
  REJECTED:  'bg-red-100 text-red-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
}

export const employeeStatusColor: Record<string, string> = {
  ACTIVE:     'bg-emerald-100 text-emerald-700',
  INACTIVE:   'bg-slate-100 text-slate-500',
  ON_LEAVE:   'bg-amber-100 text-amber-700',
  TERMINATED: 'bg-red-100 text-red-700',
  RESIGNED:   'bg-orange-100 text-orange-700',
}

export const payrollStatusColor: Record<string, string> = {
  DRAFT:     'bg-slate-100 text-slate-500',
  PROCESSED: 'bg-blue-100 text-blue-700',
  APPROVED:  'bg-violet-100 text-violet-700',
  PAID:      'bg-emerald-100 text-emerald-700',
}

export const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]
