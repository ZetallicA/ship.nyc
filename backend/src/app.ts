import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { config } from './config.js'
import { registerRoutes } from './routes/index.js'
import { errorHandler } from './middleware/errorHandler.js'
import { apiLimiter } from './middleware/rateLimiter.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

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

  // Serve frontend in production (backend and frontend are bundled together)
  if (config.nodeEnv === 'production') {
    const publicDir = path.join(__dirname, '../public')
    const indexHtml = path.join(publicDir, 'index.html')
    const assetsDir = path.join(publicDir, 'assets')
    console.log('[Static] publicDir:', publicDir)
    console.log('[Static] assets exists:', fs.existsSync(assetsDir))
    if (fs.existsSync(assetsDir)) {
      console.log('[Static] assets contents:', fs.readdirSync(assetsDir))
    }
    app.use(express.static(publicDir, {
      setHeaders: (res, filePath) => {
        console.log('[Static serving]', filePath)
      },
    }))
    app.get('*', (req, res, next) => {
      console.log('[Catch-all]', req.originalUrl)
      res.sendFile(indexHtml, (err) => {
        if (err) {
          console.log('[Catch-all] sendFile error:', err.message)
          next(err)
        }
      })
    })
  }

  // Error handler (must be last)
  app.use(errorHandler)

  return app
}
