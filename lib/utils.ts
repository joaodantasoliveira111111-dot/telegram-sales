import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Recife',
  }).format(new Date(date))
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function getPeriodRange(period: string): { since: string; until?: string } {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (period === 'today') return { since: todayStart.toISOString() }
  if (period === 'yesterday') {
    const y = new Date(todayStart)
    y.setDate(y.getDate() - 1)
    return { since: y.toISOString(), until: todayStart.toISOString() }
  }
  if (period === '7d') return { since: new Date(Date.now() - 7 * 86400000).toISOString() }
  return { since: new Date(Date.now() - 30 * 86400000).toISOString() }
}
