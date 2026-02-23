import { Router } from 'express'
import { prisma } from '../db/prisma.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

// GET /api/events/:tracking_number
router.get('/:tracking_number', asyncHandler(async (req, res) => {
  const events = await prisma.shipmentEvent.findMany({
    where: { trackingNumber: req.params.tracking_number },
    include: { updatedBy: { select: { fullName: true, username: true } } },
    orderBy: { timestamp: 'asc' },
  })

  res.json(events.map(e => ({
    id: e.id,
    tracking_number: e.trackingNumber,
    event_type: e.eventType,
    description: e.description,
    timestamp: e.timestamp,
    updated_by: e.updatedBy?.fullName || e.updatedBy?.username || null,
  })))
}))

export default router
