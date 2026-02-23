import type { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(422).json({
      detail: err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; '),
      errors: err.errors,
    })
    return
  }

  if (err instanceof Error) {
    const status = (err as any).status ?? (err as any).statusCode ?? 500
    console.error(`[Error] ${err.message}`)
    res.status(status).json({ detail: status === 500 ? 'Internal server error' : err.message })
    return
  }

  console.error('[Unknown Error]', err)
  res.status(500).json({ detail: 'Internal server error' })
}

export function createHttpError(status: number, message: string): Error & { status: number } {
  const err = new Error(message) as Error & { status: number }
  err.status = status
  return err
}
