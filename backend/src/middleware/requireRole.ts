import type { Request, Response, NextFunction } from 'express'
import type { UserRole } from '@prisma/client'

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ detail: 'Authentication required' })
      return
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ detail: `Access denied. Required role: ${roles.join(' or ')}` })
      return
    }
    next()
  }
}
