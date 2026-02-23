import { Router } from 'express'
import { prisma } from '../db/prisma.js'
import { authenticate } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

router.get('/', authenticate, asyncHandler(async (req, res) => {
  const user = req.user!
  const { office_id } = req.query as Record<string, string>

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const where: any = {}
  if (user.role === 'Sender') where.senderId = user.id
  if (office_id) where.destinationOfficeId = office_id

  const [total, inTransit, deliveredToday, pendingPickup] = await Promise.all([
    prisma.shipment.count({ where }),
    prisma.shipment.count({ where: { ...where, status: 'InTransit' } }),
    prisma.shipment.count({ where: { ...where, status: 'Delivered', lastUpdated: { gte: today } } }),
    prisma.shipment.count({ where: { ...where, status: 'Created' } }),
  ])

  res.json({
    total_shipments: total,
    in_transit: inTransit,
    delivered_today: deliveredToday,
    pending_pickup: pendingPickup,
  })
}))

export default router
