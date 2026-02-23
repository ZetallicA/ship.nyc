import { Router } from 'express'
import { prisma } from '../db/prisma.js'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/requireRole.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { createHttpError } from '../middleware/errorHandler.js'
import { proofOfDeliverySchema } from '../utils/validators.js'

const router = Router()

// POST /api/shipments/:tracking/proof-of-delivery
router.post('/:tracking/proof-of-delivery', authenticate, requireRole('Driver', 'Admin'), asyncHandler(async (req, res) => {
  const body = proofOfDeliverySchema.parse(req.body)
  const user = req.user!

  const shipment = await prisma.shipment.findUnique({ where: { trackingNumber: req.params.tracking } })
  if (!shipment) throw createHttpError(404, 'Shipment not found')

  const existing = await prisma.proofOfDelivery.findUnique({ where: { trackingNumber: req.params.tracking } })
  if (existing) throw createHttpError(400, 'Proof of delivery already exists for this shipment')

  const pod = await prisma.proofOfDelivery.create({
    data: {
      trackingNumber: req.params.tracking,
      driverId: user.id,
      recipientName: body.recipient_name,
      deliverySignature: body.signature,
      deliveryPhoto: body.photo ?? null,
      notes: body.notes ?? null,
      deliveryLat: body.coordinates?.lat ?? null,
      deliveryLng: body.coordinates?.lng ?? null,
    },
  })

  res.status(201).json({
    id: pod.id,
    tracking_number: pod.trackingNumber,
    driver_id: pod.driverId,
    recipient_name: pod.recipientName,
    delivery_signature: pod.deliverySignature,
    delivery_photo: pod.deliveryPhoto,
    delivery_timestamp: pod.deliveryTimestamp,
    delivery_location: pod.deliveryLat != null ? { lat: pod.deliveryLat, lng: pod.deliveryLng } : null,
    notes: pod.notes,
  })
}))

// GET /api/shipments/:tracking/proof-of-delivery
router.get('/:tracking/proof-of-delivery', authenticate, asyncHandler(async (req, res) => {
  const pod = await prisma.proofOfDelivery.findUnique({
    where: { trackingNumber: req.params.tracking },
    include: { driver: { select: { fullName: true, username: true } } },
  })
  if (!pod) throw createHttpError(404, 'Proof of delivery not found')

  res.json({
    id: pod.id,
    tracking_number: pod.trackingNumber,
    driver_id: pod.driverId,
    driver_name: pod.driver.fullName || pod.driver.username,
    recipient_name: pod.recipientName,
    delivery_signature: pod.deliverySignature,
    delivery_photo: pod.deliveryPhoto,
    delivery_timestamp: pod.deliveryTimestamp,
    delivery_location: pod.deliveryLat != null ? { lat: pod.deliveryLat, lng: pod.deliveryLng } : null,
    notes: pod.notes,
  })
}))

export default router
