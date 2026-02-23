export const statusColors: Record<string, string> = {
  Pending: 'bg-gray-100 text-gray-800',
  PickedUp: 'bg-yellow-100 text-yellow-800',
  InTransit: 'bg-blue-100 text-blue-800',
  OutForDelivery: 'bg-purple-100 text-purple-800',
  Delivered: 'bg-green-100 text-green-800',
  Failed: 'bg-orange-100 text-orange-800',
  Returned: 'bg-red-100 text-red-800',
}

export const urgencyColors: Record<string, string> = {
  Standard: 'bg-gray-100 text-gray-700',
  Express: 'bg-orange-100 text-orange-800',
  Overnight: 'bg-red-100 text-red-800',
}

export function getStatusColor(status: string): string {
  return statusColors[status] ?? 'bg-gray-100 text-gray-800'
}

export function getUrgencyColor(urgency: string): string {
  return urgencyColors[urgency] ?? 'bg-gray-100 text-gray-700'
}
