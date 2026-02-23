import rateLimit from 'express-rate-limit'

export const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { detail: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const pinLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { detail: 'Too many PIN attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { detail: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
})
