import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import { prisma } from '../db/prisma.js'

interface JWTPayload {
  sub: string
  type: 'username' | 'email' | 'id_number'
  iat: number
  exp: number
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ detail: 'No token provided' })
    return
  }

  const token = authHeader.slice(7)
  try {
    const payload = jwt.verify(token, config.jwtSecret) as JWTPayload
    const { sub: identifier, type } = payload

    let user = null
    if (type === 'id_number') {
      user = await prisma.user.findUnique({ where: { idNumber: identifier } })
    } else if (type === 'email') {
      user = await prisma.user.findUnique({ where: { email: identifier } })
    } else {
      // username or fallback
      user = await prisma.user.findUnique({ where: { username: identifier } })
      if (!user) {
        user = await prisma.user.findUnique({ where: { email: identifier } })
      }
    }

    if (!user || !user.isActive) {
      res.status(401).json({ detail: 'User not found or inactive' })
      return
    }

    req.user = user
    next()
  } catch {
    res.status(401).json({ detail: 'Invalid or expired token' })
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    next()
    return
  }

  const token = authHeader.slice(7)
  try {
    const payload = jwt.verify(token, config.jwtSecret) as JWTPayload
    const { sub: identifier, type } = payload

    let userPromise
    if (type === 'id_number') {
      userPromise = prisma.user.findUnique({ where: { idNumber: identifier } })
    } else {
      userPromise = prisma.user.findFirst({
        where: { OR: [{ username: identifier }, { email: identifier }] },
      })
    }

    userPromise.then(user => {
      if (user?.isActive) req.user = user
      next()
    }).catch(() => next())
  } catch {
    next()
  }
}
