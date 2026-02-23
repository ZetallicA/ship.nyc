import { WebSocketServer, WebSocket } from 'ws'
import type { Server } from 'http'

let wss: WebSocketServer | null = null

export function initWebSocket(server: Server) {
  wss = new WebSocketServer({ server, path: '/ws' })

  wss.on('connection', (ws) => {
    ws.on('error', (err) => console.error('[WS] Error:', err))
    ws.on('message', () => {
      // Clients can send ping to keep connection alive
      ws.send(JSON.stringify({ type: 'pong' }))
    })
  })

  console.log('[WS] WebSocket server initialized on /ws')
}

export function broadcast(event: string, data: unknown) {
  if (!wss) return
  const message = JSON.stringify({ type: event, data, timestamp: new Date().toISOString() })
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message)
    }
  })
}

export function broadcastStatusUpdate(trackingNumber: string, status: string, updatedBy: string) {
  broadcast('shipment_status_updated', { tracking_number: trackingNumber, status, updated_by: updatedBy })
}
