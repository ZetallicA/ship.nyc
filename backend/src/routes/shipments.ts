import { Router } from 'express'
import { prisma } from '../db/prisma.js'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/requireRole.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { createHttpError } from '../middleware/errorHandler.js'
import { generateTrackingNumber } from '../services/tracking.service.js'
import { logAudit } from '../services/audit.service.js'
import { sendDeliveryEmail } from '../services/email.service.js'
import { broadcastStatusUpdate } from '../services/websocket.service.js'
import { shipmentSchema, statusSchema } from '../utils/validators.js'
import { shipmentsToCSV } from '../utils/csvExport.js'

const router = Router()

const include = {
  sender: { select: { fullName: true, email: true } },
  destinationOffice: { select: { name: true } },
  nfcTag: { select: { tagId: true } },
}

const formatShipment = (s: any) => ({
  id: s.id,
  tracking_number: s.trackingNumber,
  destination_office_id: s.destinationOfficeId,
  destination_office_name: s.destinationOffice?.name ?? '',
  recipient_name: s.recipientName,
  package_type: s.packageType,
  urgency: s.urgency,
  notes: s.notes,
  status: s.status,
  created_date: s.createdAt,
  last_updated: s.lastUpdated,
  sender_id: s.senderId,
  sender_name: s.sender?.fullName ?? null,
  sender_email: s.sender?.email ?? null,
  nfc_scan_required: s.nfcScanRequired,
  nfc_tag_id: s.nfcTagId,
  assigned_route_id: s.assignedRouteId,
  route_stop_sequence: s.routeStopSequence,
})

// GET /api/shipments/my
router.get('/my', authenticate, asyncHandler(async (req, res) => {
  const user = req.user!
  if (!['Sender', 'Admin'].includes(user.role)) {
    throw createHttpError(403, 'This endpoint is for Senders and Admins only')
  }
  const shipments = await prisma.shipment.findMany({
    where: { senderId: user.id },
    include,
    orderBy: { createdAt: 'desc' },
  })
  res.json(shipments.map(formatShipment))
}))

// GET /api/shipments/export (admin CSV)
router.get('/export', authenticate, requireRole('Admin'), asyncHandler(async (req, res) => {
  const { status, office_id, start_date, end_date } = req.query as Record<string, string>
  const where: any = {}
  if (status) where.status = status
  if (office_id) where.destinationOfficeId = office_id
  if (start_date || end_date) {
    where.createdAt = {}
    if (start_date) where.createdAt.gte = new Date(start_date)
    if (end_date) where.createdAt.lte = new Date(end_date)
  }

  const shipments = await prisma.shipment.findMany({
    where,
    include: {
      sender: { select: { fullName: true, email: true } },
      destinationOffice: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const csv = shipmentsToCSV(shipments as any)
  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', `attachment; filename="shipments-${Date.now()}.csv"`)
  res.send(csv)
}))

// GET /api/shipments
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const user = req.user!
  const { status, office_id, search } = req.query as Record<string, string>
  const where: any = {}

  if (user.role === 'Sender') {
    where.senderId = user.id
  }

  if (status) where.status = status
  if (office_id) where.destinationOfficeId = office_id
  if (search) {
    where.OR = [
      { trackingNumber: { contains: search, mode: 'insensitive' } },
      { recipientName: { contains: search, mode: 'insensitive' } },
      { destinationOffice: { name: { contains: search, mode: 'insensitive' } } },
    ]
  }

  const shipments = await prisma.shipment.findMany({
    where,
    include,
    orderBy: { createdAt: 'desc' },
  })
  res.json(shipments.map(formatShipment))
}))

// POST /api/shipments
router.post('/', authenticate, asyncHandler(async (req, res) => {
  const body = shipmentSchema.parse(req.body)
  const office = await prisma.office.findUnique({ where: { id: body.destination_office_id } })
  if (!office) throw createHttpError(404, 'Office not found')

  const trackingNumber = await generateTrackingNumber()

  const shipment = await prisma.shipment.create({
    data: {
      trackingNumber,
      destinationOfficeId: body.destination_office_id,
      recipientName: body.recipient_name,
      packageType: body.package_type,
      urgency: body.urgency,
      notes: body.notes ?? null,
      senderId: req.user!.id,
    },
    include,
  })

  await prisma.shipmentEvent.create({
    data: {
      trackingNumber,
      eventType: 'Created',
      description: 'Shipment created',
      updatedById: req.user!.id,
    },
  })

  await logAudit('SHIPMENT_CREATED', req.user!.id, 'shipment', trackingNumber, null, req)
  res.status(201).json(formatShipment(shipment))
}))

// GET /api/shipments/:tracking
router.get('/:tracking', asyncHandler(async (req, res) => {
  const shipment = await prisma.shipment.findUnique({
    where: { trackingNumber: req.params.tracking },
    include,
  })
  if (!shipment) throw createHttpError(404, 'Shipment not found')
  res.json(formatShipment(shipment))
}))

// PUT /api/shipments/:tracking/status
router.put('/:tracking/status', authenticate, requireRole('Driver', 'Admin', 'Supervisor'), asyncHandler(async (req, res) => {
  const { status } = statusSchema.parse(req.body)
  const user = req.user!

  const shipment = await prisma.shipment.findUnique({
    where: { trackingNumber: req.params.tracking },
    include: { sender: { select: { fullName: true, email: true } } },
  })
  if (!shipment) throw createHttpError(404, 'Shipment not found')

  // NFC enforcement for drivers
  if (shipment.nfcScanRequired && shipment.nfcTagId && user.role === 'Driver') {
    const nfcTag = await prisma.nfcTag.findUnique({ where: { id: shipment.nfcTagId } })
    if (nfcTag) {
      const validScan = await prisma.nfcScan.findFirst({
        where: {
          tagId: nfcTag.tagId,
          driverId: user.id,
          expiresAt: { gt: new Date() },
        },
      })
      if (!validScan) {
        throw createHttpError(403, 'Please scan NFC tag at pickup location first.')
      }
    }
  }

  const now = new Date()
  const oldStatus = shipment.status

  await prisma.shipment.update({
    where: { trackingNumber: req.params.tracking },
    data: { status, lastUpdated: now },
  })

  await prisma.shipmentEvent.create({
    data: {
      trackingNumber: req.params.tracking,
      eventType: status,
      description: `Status updated to ${status} by ${user.fullName || user.username || 'Driver'}`,
      updatedById: user.id,
    },
  })

  await logAudit('STATUS_UPDATED', user.id, 'shipment', req.params.tracking, { status: { old: oldStatus, new: status } }, req)

  // Broadcast via WebSocket
  broadcastStatusUpdate(req.params.tracking, status, user.fullName || user.username || user.id)

  // Send delivery email
  if (status === 'Delivered' && shipment.sender.email) {
    sendDeliveryEmail(
      shipment.sender.email,
      shipment.sender.fullName,
      req.params.tracking,
      shipment.recipientName,
      now
    ).catch(() => {})
  }

  res.json({ message: 'Status updated successfully', status })
}))

export default router
