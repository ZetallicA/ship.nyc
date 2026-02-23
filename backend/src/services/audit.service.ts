import { prisma } from '../db/prisma.js'
import type { Request } from 'express'

export async function logAudit(
  action: string,
  userId: string,
  entityType: string,
  entityId: string,
  changes?: Record<string, unknown> | null,
  req?: Request
) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        userId,
        entityType,
        entityId,
        changes: changes ? JSON.parse(JSON.stringify(changes)) : undefined,
        ipAddress: req?.ip ?? null,
        userAgent: req?.headers['user-agent'] ?? null,
      },
    })
  } catch (err) {
    console.error('[AuditLog] Failed to log audit event:', err)
    // Don't throw — audit failure must never break the request
  }
}
