import { format, formatDistanceToNow } from 'date-fns'

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try { return format(new Date(dateStr), 'MMM d, yyyy') } catch { return dateStr }
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try { return format(new Date(dateStr), 'MMM d, yyyy h:mm a') } catch { return dateStr }
}

export function formatRelative(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try { return formatDistanceToNow(new Date(dateStr), { addSuffix: true }) } catch { return dateStr }
}
