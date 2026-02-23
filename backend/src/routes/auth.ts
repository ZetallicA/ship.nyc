import { Router } from 'express'
import { prisma } from '../db/prisma.js'
import { hashPassword, verifyPassword, hashPin, verifyPin, createToken } from '../services/auth.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { createHttpError } from '../middleware/errorHandler.js'
import { authenticate } from '../middleware/auth.js'
import { loginLimiter, pinLimiter } from '../middleware/rateLimiter.js'
import {
  registerSchema, loginSchema, loginPinSchema,
  pinSchema, passwordSchema,
} from '../utils/validators.js'

const router = Router()

// POST /api/auth/register
router.post('/register', asyncHandler(async (req, res) => {
  const body = registerSchema.parse(req.body)

  if (await prisma.user.findUnique({ where: { username: body.username } })) {
    throw createHttpError(400, 'Username already taken')
  }
  if (body.email && await prisma.user.findUnique({ where: { email: body.email } })) {
    throw createHttpError(400, 'Email already registered')
  }

  const user = await prisma.user.create({
    data: {
      username: body.username,
      passwordHash: await hashPassword(body.password),
      fullName: body.full_name,
      role: body.role,
      email: body.email ?? null,
    },
  })

  res.status(201).json({
    id: user.id,
    username: user.username,
    email: user.email,
    full_name: user.fullName,
    role: user.role,
    is_active: user.isActive,
    id_number: user.idNumber,
  })
}))

// POST /api/auth/login
router.post('/login', loginLimiter, asyncHandler(async (req, res) => {
  const body = loginSchema.parse(req.body)

  const user = await prisma.user.findFirst({
    where: { OR: [{ username: body.username }, { email: body.username }] },
  })

  if (!user || !user.isActive || !(await verifyPassword(body.password, user.passwordHash))) {
    throw createHttpError(401, 'Incorrect username or password')
  }

  const identifier = user.username ?? user.email!
  const type = user.username ? 'username' : 'email'
  const token = createToken(identifier, type)

  res.json({ access_token: token, token_type: 'bearer' })
}))

// POST /api/auth/login-pin
router.post('/login-pin', pinLimiter, asyncHandler(async (req, res) => {
  const body = loginPinSchema.parse(req.body)

  const user = await prisma.user.findUnique({ where: { idNumber: body.id_number.trim() } })

  if (!user || !user.isActive) {
    throw createHttpError(401, 'Incorrect ID number or PIN')
  }
  if (!user.pinHash) {
    throw createHttpError(400, 'PIN not set for this user. Please use username/password login or set a PIN first.')
  }
  if (!(await verifyPin(body.pin.trim(), user.pinHash))) {
    throw createHttpError(401, 'Incorrect ID number or PIN')
  }

  const token = createToken(user.idNumber!, 'id_number')
  res.json({ access_token: token, token_type: 'bearer' })
}))

// GET /api/auth/me
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const u = req.user!
  res.json({
    id: u.id,
    username: u.username,
    email: u.email,
    full_name: u.fullName,
    role: u.role,
    is_active: u.isActive,
    id_number: u.idNumber,
  })
}))

// PUT /api/auth/pin
router.put('/pin', authenticate, asyncHandler(async (req, res) => {
  const body = pinSchema.parse(req.body)
  const user = req.user!

  if (!user.idNumber) {
    throw createHttpError(400, 'You must have an ID number before setting a PIN. Please contact an administrator.')
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { pinHash: await hashPin(body.pin.trim()) },
  })

  res.json({ message: 'PIN updated successfully' })
}))

// PUT /api/auth/password
router.put('/password', authenticate, asyncHandler(async (req, res) => {
  const body = passwordSchema.parse(req.body)
  const user = req.user!

  if (!(await verifyPassword(body.current_password, user.passwordHash))) {
    throw createHttpError(401, 'Current password is incorrect')
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(body.new_password) },
  })

  res.json({ message: 'Password updated successfully' })
}))

export default router
