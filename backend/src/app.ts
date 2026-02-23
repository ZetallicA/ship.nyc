import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { config } from './config.js'
import { registerRoutes } from './routes/index.js'
import { errorHandler } from './middleware/errorHandler.js'
import { apiLimiter } from './middleware/rateLimiter.js'

export function createApp() {
  const app = express()

  // Trust proxy (for rate limiting behind nginx/CapRover)
  app.set('trust proxy', 1)

  // Security headers
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))

  // CORS
  const corsOptions: cors.CorsOptions = config.corsAllowAll
    ? { origin: true, credentials: true }
    : {
        origin: (origin, callback) => {
          if (!origin || config.corsOrigins.includes(origin)) {
            callback(null, true)
          } else {
            callback(new Error(`CORS: origin ${origin} not allowed`))
          }
        },
        credentials: true,
      }
  app.use(cors(corsOptions))

  // Body parsing
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true }))

  // Logging
  app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'))

  // Rate limiting on all API routes
  app.use('/api', apiLimiter)

  // Routes
  registerRoutes(app)

  // Error handler (must be last)
  app.use(errorHandler)

  return app
}
