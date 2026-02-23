import { Router } from 'express'
import { prisma } from '../db/prisma.js'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/requireRole.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { createHttpError } from '../middleware/errorHandler.js'
import { logAudit } from '../services/audit.service.js'
import { sendNfcScanEmail } from '../services/email.service.js'
import { nfcTagSchema, nfcScanSchema } from '../utils/validators.js'

const router = Router()

const formatTag = (t: any) => ({
  id: t.id,
  tag_id: t.tagId,
  office_id: t.officeId,
  office_name: t.office?.name ?? null,
  location_name: t.locationName,
  coordinates: t.lat != null && t.lng != null ? { lat: t.lat, lng: t.lng } : null,
  is_active: t.isActive,
  created_date: t.createdAt,
})

// GET /api/nfc-tags
router.get('/nfc-tags', authenticate, asyncHandler(async (req, res) => {
  const { office_id } = req.query as Record<string, string>
  const user = req.user!
  const where: any = {}
  if (office_id) where.officeId = office_id
  if (user.role === 'Driver') where.isActive = true

  const tags = await prisma.nfcTag.findMany({
    where,
    include: { office: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })
  res.json(tags.map(formatTag))
}))

// POST /api/nfc-tags
router.post('/nfc-tags', authenticate, requireRole('Admin', 'Supervisor'), asyncHandler(async (req, res) => {
  const body = nfcTagSchema.parse(req.body)
  if (await prisma.nfcTag.findUnique({ where: { tagId: body.tag_id } })) {
    throw createHttpError(400, 'NFC tag ID already exists')
  }
  const office = await prisma.office.findUnique({ where: { id: body.office_id } })
  if (!office) throw createHttpError(404, 'Office not found')

  const tag = await prisma.nfcTag.create({
    data: {
      tagId: body.tag_id,
      officeId: body.office_id,
      locationName: body.location_name,
      lat: body.lat,
      lng: body.lng,
      isActive: body.is_active,
    },
    include: { office: { select: { name: true } } },
  })

  await logAudit('NFC_TAG_CREATED', req.user!.id, 'nfc_tag', body.tag_id, null, req)
  res.status(201).json(formatTag(tag))
}))

// GET /api/nfc-tags/:tag_id
router.get('/nfc-tags/:tag_id', authenticate, asyncHandler(async (req, res) => {
  const tag = await prisma.nfcTag.findUnique({
    where: { tagId: req.params.tag_id },
    include: { office: { select: { name: true } } },
  })
  if (!tag) throw createHttpError(404, 'NFC tag not found')
  res.json(formatTag(tag))
}))

// PUT /api/nfc-tags/:tag_id
router.put('/nfc-tags/:tag_id', authenticate, requireRole('Admin', 'Supervisor'), asyncHandler(async (req, res) => {
  const tag = await prisma.nfcTag.findUnique({ where: { tagId: req.params.tag_id } })
  if (!tag) throw createHttpError(404, 'NFC tag not found')

  const { location_name, is_active, lat, lng } = req.body
  const data: any = {}
  if (location_name !== undefined) data.locationName = location_name
  if (is_active !== undefined) data.isActive = is_active
  if (lat !== undefined) data.lat = lat
  if (lng !== undefined) data.lng = lng

  const updated = await prisma.nfcTag.update({
    where: { tagId: req.params.tag_id },
    data,
    include: { office: { select: { name: true } } },
  })
  await logAudit('NFC_TAG_UPDATED', req.user!.id, 'nfc_tag', req.params.tag_id, data, req)
  res.json(formatTag(updated))
}))

// DELETE /api/nfc-tags/:tag_id
router.delete('/nfc-tags/:tag_id', authenticate, requireRole('Admin', 'Supervisor'), asyncHandler(async (req, res) => {
  const tag = await prisma.nfcTag.findUnique({ where: { tagId: req.params.tag_id } })
  if (!tag) throw createHttpError(404, 'NFC tag not found')

  await prisma.nfcTag.delete({ where: { tagId: req.params.tag_id } })
  await logAudit('NFC_TAG_DELETED', req.user!.id, 'nfc_tag', req.params.tag_id, null, req)
  res.json({ message: 'NFC tag deleted successfully' })
}))

// POST /api/nfc/scan
router.post('/nfc/scan', authenticate, requireRole('Driver'), asyncHandler(async (req, res) => {
  const body = nfcScanSchema.parse(req.body)
  const user = req.user!

  const nfcTag = await prisma.nfcTag.findUnique({
    where: { tagId: body.tag_id },
    include: { office: { select: { name: true } } },
  })
  if (!nfcTag) throw createHttpError(404, 'NFC tag not found')
  if (!nfcTag.isActive) throw createHttpError(400, 'NFC tag is inactive')

  const now = new Date()
  const expiresAt = new Date(now.getTime() + 30 * 60 * 1000)

  const scan = await prisma.nfcScan.create({
    data: {
      tagId: body.tag_id,
      nfcTagRecordId: nfcTag.id,
      driverId: user.id,
      scanTimestamp: now,
      expiresAt,
      locationLat: body.coordinates?.lat ?? null,
      locationLng: body.coordinates?.lng ?? null,
    },
  })

  // Notify supervisors/admins
  const supervisors = await prisma.user.findMany({
    where: { role: { in: ['Admin', 'Supervisor'] }, isActive: true },
    include: { notificationPrefs: true },
  })
  for (const sup of supervisors) {
    if (sup.notificationPrefs?.notifyOnNfcScan && sup.email &&
        sup.notificationPrefs.notificationMethods.includes('email')) {
      sendNfcScanEmail(sup.email, user.fullName || 'Driver', nfcTag.locationName, nfcTag.office.name).catch(() => {})
    }
  }

  await logAudit('NFC_SCAN', user.id, 'nfc_tag', body.tag_id, { scan_timestamp: now.toISOString() }, req)

  res.json({
    id: scan.id,
    tag_id: scan.tagId,
    driver_id: scan.driverId,
    driver_name: user.fullName || user.username,
    scan_timestamp: scan.scanTimestamp,
    location_coordinates: body.coordinates ?? null,
    location_name: nfcTag.locationName,
    expires_at: scan.expiresAt,
  })
}))

export default router
