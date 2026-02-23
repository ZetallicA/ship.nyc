import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import path from 'path'
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

  // CORS — scoped to /api only so static file requests are never affected
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
  app.use('/api', cors(corsOptions))

  // Body parsing
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true }))

  // Logging — :real-ip resolves X-Forwarded-For set by CapRover nginx
  morgan.token('real-ip', (req) => {
    const forwarded = req.headers['x-forwarded-for']
    return (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0]?.trim()) ?? req.socket.remoteAddress ?? '-'
  })
  app.use(morgan(config.nodeEnv === 'production' ? ':real-ip - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"' : 'dev'))

  // Rate limiting on all API routes
  app.use('/api', apiLimiter)

  // Routes
  registerRoutes(app)

  // Serve frontend in production (backend and frontend are bundled together)
  if (config.nodeEnv === 'production') {
    const publicDir = path.join(__dirname, '../public')
    const indexHtml = path.join(publicDir, 'index.html')
    app.use(express.static(publicDir))
    app.get('*', (req, res, next) => {
      res.sendFile(indexHtml, (err) => {
        if (err) next(err)
      })
    })
  }

  // Error handler (must be last)
  app.use(errorHandler)

  return app
}
