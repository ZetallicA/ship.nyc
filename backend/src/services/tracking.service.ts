import { prisma } from '../db/prisma.js'

export async function generateTrackingNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `PKG-${year}-`

  return await prisma.$transaction(async (tx) => {
    const last = await tx.shipment.findFirst({
      where: { trackingNumber: { startsWith: prefix } },
      orderBy: { createdAt: 'desc' },
      select: { trackingNumber: true },
    })

    let next = 1
    if (last) {
      const parts = last.trackingNumber.split('-')
      const num = parseInt(parts[parts.length - 1] ?? '0', 10)
      if (!isNaN(num)) next = num + 1
    }

    return `${prefix}${String(next).padStart(5, '0')}`
  })
}
