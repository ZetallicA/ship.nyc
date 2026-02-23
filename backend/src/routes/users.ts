import { Router } from 'express'
import { prisma } from '../db/prisma.js'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/requireRole.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { createHttpError } from '../middleware/errorHandler.js'
import { logAudit } from '../services/audit.service.js'
import { userUpdateSchema, notificationPrefsSchema } from '../utils/validators.js'

const router = Router()

const formatUser = (u: any) => ({
  id: u.id,
  username: u.username,
  email: u.email,
  full_name: u.fullName,
  role: u.role,
  is_active: u.isActive,
  id_number: u.idNumber,
})

// GET /api/users (admin)
router.get('/', authenticate, requireRole('Admin'), asyncHandler(async (_req, res) => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } })
  res.json(users.map(formatUser))
}))

// PUT /api/users/:id (admin)
router.put('/:id', authenticate, requireRole('Admin'), asyncHandler(async (req, res) => {
  const body = userUpdateSchema.parse(req.body)
  const existing = await prisma.user.findUnique({ where: { id: req.params.id } })
  if (!existing) throw createHttpError(404, 'User not found')

  // Check id_number uniqueness
  if (body.id_number != null && body.id_number !== '') {
    const conflict = await prisma.user.findFirst({
      where: { idNumber: body.id_number, NOT: { id: req.params.id } },
    })
    if (conflict) throw createHttpError(400, 'ID number already assigned to another user')
  }

  const data: any = {}
  if (body.username !== undefined) data.username = body.username
  if (body.email !== undefined) data.email = body.email
  if (body.full_name !== undefined) data.fullName = body.full_name
  if (body.role !== undefined) data.role = body.role
  if (body.is_active !== undefined) data.isActive = body.is_active
  if (body.id_number !== undefined) data.idNumber = body.id_number === '' ? null : body.id_number

  const user = await prisma.user.update({ where: { id: req.params.id }, data })
  await logAudit('USER_UPDATED', req.user!.id, 'user', req.params.id, data, req)
  res.json(formatUser(user))
}))

// DELETE /api/users/:id (admin)
router.delete('/:id', authenticate, requireRole('Admin'), asyncHandler(async (req, res) => {
  if (req.user!.id === req.params.id) throw createHttpError(400, 'Cannot delete your own account')
  const existing = await prisma.user.findUnique({ where: { id: req.params.id } })
  if (!existing) throw createHttpError(404, 'User not found')

  await prisma.user.delete({ where: { id: req.params.id } })
  await logAudit('USER_DELETED', req.user!.id, 'user', req.params.id, null, req)
  res.json({ message: 'User deleted successfully' })
}))

// GET /api/users/me/notification-preferences
router.get('/me/notification-preferences', authenticate, asyncHandler(async (req, res) => {
  const user = req.user!
  let prefs = await prisma.notificationPreference.findUnique({ where: { userId: user.id } })
  if (!prefs) {
    prefs = await prisma.notificationPreference.create({
      data: { userId: user.id },
    })
  }
  res.json({
    user_id: prefs.userId,
    notify_on_nfc_scan: prefs.notifyOnNfcScan,
    notify_on_delivery: prefs.notifyOnDelivery,
    notification_methods: prefs.notificationMethods,
    phone_number: prefs.phoneNumber,
  })
}))

// PUT /api/users/me/notification-preferences
router.put('/me/notification-preferences', authenticate, asyncHandler(async (req, res) => {
  const body = notificationPrefsSchema.parse(req.body)
  const user = req.user!

  const prefs = await prisma.notificationPreference.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      notifyOnNfcScan: body.notify_on_nfc_scan,
      notifyOnDelivery: body.notify_on_delivery,
      notificationMethods: body.notification_methods,
      phoneNumber: body.phone_number ?? null,
    },
    update: {
      notifyOnNfcScan: body.notify_on_nfc_scan,
      notifyOnDelivery: body.notify_on_delivery,
      notificationMethods: body.notification_methods,
      phoneNumber: body.phone_number ?? null,
    },
  })

  res.json({
    user_id: prefs.userId,
    notify_on_nfc_scan: prefs.notifyOnNfcScan,
    notify_on_delivery: prefs.notifyOnDelivery,
    notification_methods: prefs.notificationMethods,
    phone_number: prefs.phoneNumber,
  })
}))

export default router
