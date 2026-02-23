import type { Express } from 'express'
import authRouter from './auth.js'
import officesRouter from './offices.js'
import shipmentsRouter from './shipments.js'
import eventsRouter from './events.js'
import usersRouter from './users.js'
import nfcRouter from './nfc.js'
import deliveryRoutesRouter from './deliveryRoutes.js'
import statsRouter from './stats.js'
import proofOfDeliveryRouter from './proofOfDelivery.js'

export function registerRoutes(app: Express) {
  app.use('/api/auth', authRouter)
  app.use('/api/offices', officesRouter)
  app.use('/api/shipments', shipmentsRouter)
  app.use('/api/events', eventsRouter)
  app.use('/api/users', usersRouter)
  app.use('/api', nfcRouter)          // mounts /api/nfc-tags and /api/nfc/scan
  app.use('/api/routes', deliveryRoutesRouter)
  app.use('/api/stats', statsRouter)
  app.use('/api/shipments', proofOfDeliveryRouter)  // /api/shipments/:tracking/proof-of-delivery

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'healthy' })
  })
}
