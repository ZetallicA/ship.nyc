import { Router } from 'express'
import { prisma } from '../db/prisma.js'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/requireRole.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { createHttpError } from '../middleware/errorHandler.js'
import { logAudit } from '../services/audit.service.js'
import { officeSchema } from '../utils/validators.js'

const router = Router()

const formatOffice = (o: { id: string; name: string; address: string; lat: number | null; lng: number | null; createdAt: Date }) => ({
  id: o.id,
  name: o.name,
  address: o.address,
  coordinates: o.lat != null && o.lng != null ? { lat: o.lat, lng: o.lng } : null,
  created_date: o.createdAt,
})

// GET /api/offices — public (used in send wizard)
router.get('/', asyncHandler(async (_req, res) => {
  const offices = await prisma.office.findMany({ orderBy: { createdAt: 'desc' } })
  res.json(offices.map(formatOffice))
}))

// POST /api/offices
router.post('/', authenticate, requireRole('Admin'), asyncHandler(async (req, res) => {
  const body = officeSchema.parse(req.body)
  const office = await prisma.office.create({
    data: { name: body.name, address: body.address, lat: body.lat, lng: body.lng },
  })
  await logAudit('OFFICE_CREATED', req.user!.id, 'office', office.id, { name: body.name }, req)
  res.status(201).json(formatOffice(office))
}))

// PUT /api/offices/:id
router.put('/:id', authenticate, requireRole('Admin'), asyncHandler(async (req, res) => {
  const body = officeSchema.parse(req.body)
  const existing = await prisma.office.findUnique({ where: { id: req.params.id } })
  if (!existing) throw createHttpError(404, 'Office not found')

  const office = await prisma.office.update({
    where: { id: req.params.id },
    data: { name: body.name, address: body.address, lat: body.lat, lng: body.lng },
  })
  await logAudit('OFFICE_UPDATED', req.user!.id, 'office', office.id, { name: body.name }, req)
  res.json(formatOffice(office))
}))

// DELETE /api/offices/:id
router.delete('/:id', authenticate, requireRole('Admin'), asyncHandler(async (req, res) => {
  const existing = await prisma.office.findUnique({ where: { id: req.params.id } })
  if (!existing) throw createHttpError(404, 'Office not found')

  await prisma.office.delete({ where: { id: req.params.id } })
  await logAudit('OFFICE_DELETED', req.user!.id, 'office', req.params.id, null, req)
  res.json({ message: 'Office deleted successfully' })
}))

export default router
