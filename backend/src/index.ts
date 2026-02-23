import 'dotenv/config'
import http from 'http'
import { createApp } from './app.js'
import { config } from './config.js'
import { prisma } from './db/prisma.js'
import { initWebSocket } from './services/websocket.service.js'

async function main() {
  // Verify DB connection
  await prisma.$connect()
  console.log('[DB] Connected to PostgreSQL')

  const app = createApp()
  const server = http.createServer(app)

  // WebSocket
  initWebSocket(server)

  server.listen(config.port, '0.0.0.0', () => {
    console.log(`[Server] OATH Logistics API running on port ${config.port}`)
    console.log(`[Server] Environment: ${config.nodeEnv}`)
    console.log(`[Server] Email: ${config.emailEnabled ? 'enabled (Resend)' : 'disabled'}`)
  })

  // Graceful shutdown
  const shutdown = async () => {
    console.log('[Server] Shutting down...')
    await prisma.$disconnect()
    server.close(() => process.exit(0))
  }
  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
}

main().catch((err) => {
  console.error('[Server] Fatal error:', err)
  process.exit(1)
})
