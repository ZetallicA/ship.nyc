import type { Shipment, User, Office } from '@prisma/client'

type ShipmentWithRelations = Shipment & {
  sender: Pick<User, 'fullName' | 'email'>
  destinationOffice: Pick<Office, 'name'>
}

export function shipmentsToCSV(shipments: ShipmentWithRelations[]): string {
  const headers = [
    'Tracking Number',
    'Status',
    'Recipient',
    'Destination Office',
    'Package Type',
    'Urgency',
    'Sender',
    'Sender Email',
    'Created Date',
    'Last Updated',
    'Notes',
  ]

  const escape = (val: unknown): string => {
    const s = val == null ? '' : String(val)
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }

  const rows = shipments.map(s => [
    escape(s.trackingNumber),
    escape(s.status),
    escape(s.recipientName),
    escape(s.destinationOffice.name),
    escape(s.packageType),
    escape(s.urgency),
    escape(s.sender.fullName),
    escape(s.sender.email ?? ''),
    escape(s.createdAt.toISOString()),
    escape(s.lastUpdated?.toISOString() ?? ''),
    escape(s.notes ?? ''),
  ])

  return [headers.map(escape).join(','), ...rows.map(r => r.join(','))].join('\n')
}
