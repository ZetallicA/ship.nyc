import { Router } from 'express'
import { prisma } from '../db/prisma.js'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/requireRole.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { createHttpError } from '../middleware/errorHandler.js'
import { logAudit } from '../services/audit.service.js'
import { optimizeRoute } from '../services/route.service.js'
import { routeSchema } from '../utils/validators.js'

const router = Router()

const formatRoute = (r: any) => ({
  id: r.id,
  route_name: r.routeName,
  assigned_driver_id: r.assignedDriverId,
  assigned_driver_name: r.driver?.fullName || r.driver?.username || null,
  supervisor_id: r.supervisorId,
  supervisor_name: r.supervisorUser?.fullName || r.supervisorUser?.username || null,
  route_date: r.routeDate,
  status: r.status,
  optimized_waypoints: r.optimizedWaypoints,
  estimated_duration: r.estimatedDuration,
  actual_start_time: r.actualStartTime,
  actual_end_time: r.actualEndTime,
})

const includeUsers = {
  driver: { select: { fullName: true, username: true } },
  supervisorUser: { select: { fullName: true, username: true } },
}

// POST /api/routes/optimize
router.post('/optimize', authenticate, requireRole('Admin', 'Supervisor'), asyncHandler(async (req, res) => {
  const { shipment_tracking_numbers } = req.body as { shipment_tracking_numbers: string[] }
  if (!shipment_tracking_numbers?.length) throw createHttpError(400, 'No shipments provided')

  const shipments = await prisma.shipment.findMany({
    where: { trackingNumber: { in: shipment_tracking_numbers } },
    include: { destinationOffice: true },
  })

  const officeMap = new Map<string, { id: string; name: string; lat: number | null; lng: number | null }>()
  for (const s of shipments) {
    officeMap.set(s.destinationOfficeId, {
      id: s.destinationOfficeId,
      name: s.destinationOffice.name,
      lat: s.destinationOffice.lat,
      lng: s.destinationOffice.lng,
    })
  }

  const result = optimizeRoute([...officeMap.values()])
  res.json(result)
}))

// GET /api/routes
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const user = req.user!
  const { status, driver_id } = req.query as Record<string, string>
  const where: any = {}

  if (user.role === 'Driver') where.assignedDriverId = user.id
  if (status) where.status = status
  if (driver_id && ['Admin', 'Supervisor'].includes(user.role)) where.assignedDriverId = driver_id

  const routes = await prisma.route.findMany({
    where,
    include: includeUsers,
    orderBy: { routeDate: 'desc' },
  })
  res.json(routes.map(formatRoute))
}))

// POST /api/routes
router.post('/', authenticate, requireRole('Admin', 'Supervisor'), asyncHandler(async (req, res) => {
  const body = routeSchema.parse(req.body)

  const driver = await prisma.user.findUnique({ where: { id: body.driver_id } })
  if (!driver) throw createHttpError(404, 'Driver not found')
  if (driver.role !== 'Driver') throw createHttpError(400, 'User must be a Driver')

  const shipments = await prisma.shipment.findMany({
    where: { trackingNumber: { in: body.shipment_tracking_numbers } },
    include: { destinationOffice: true },
  })
  if (!shipments.length) throw createHttpError(400, 'No shipments found')

  const officeMap = new Map<string, { id: string; name: string; lat: number | null; lng: number | null }>()
  const officeShipments = new Map<string, string[]>()
  for (const s of shipments) {
    officeMap.set(s.destinationOfficeId, {
      id: s.destinationOfficeId,
      name: s.destinationOffice.name,
      lat: s.destinationOffice.lat,
      lng: s.destinationOffice.lng,
    })
    const existing = officeShipments.get(s.destinationOfficeId) ?? []
    existing.push(s.trackingNumber)
    officeShipments.set(s.destinationOfficeId, existing)
  }

  const optimized = optimizeRoute([...officeMap.values()])

  const route = await prisma.route.create({
    data: {
      routeName: body.route_name,
      assignedDriverId: body.driver_id,
      supervisorId: req.user!.id,
      routeDate: new Date(body.route_date),
      optimizedWaypoints: optimized.waypoints,
      estimatedDuration: optimized.estimated_duration,
    },
    include: includeUsers,
  })

  // Create stops
  let seq = 0
  for (const officeId of optimized.waypoints) {
    const trackingNums = officeShipments.get(officeId) ?? []
    await prisma.routeStop.create({
      data: {
        routeId: route.id,
        stopSequence: seq,
        officeId,
        shipmentTrackingNumbers: trackingNums,
      },
    })
    // Update shipments with route info
    await prisma.shipment.updateMany({
      where: { trackingNumber: { in: trackingNums } },
      data: { assignedRouteId: route.id, routeStopSequence: seq },
    })
    seq++
  }

  // Create route assignment record
  await prisma.routeAssignment.create({
    data: { routeId: route.id, driverId: body.driver_id, assignedById: req.user!.id },
  })

  await logAudit('ROUTE_CREATED', req.user!.id, 'route', route.id, null, req)
  res.status(201).json(formatRoute(route))
}))

// GET /api/routes/:id
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const route = await prisma.route.findUnique({
    where: { id: req.params.id },
    include: includeUsers,
  })
  if (!route) throw createHttpError(404, 'Route not found')
  if (req.user!.role === 'Driver' && route.assignedDriverId !== req.user!.id) {
    throw createHttpError(403, 'Access denied')
  }
  res.json(formatRoute(route))
}))

// GET /api/routes/:id/stops
router.get('/:id/stops', authenticate, asyncHandler(async (req, res) => {
  const route = await prisma.route.findUnique({ where: { id: req.params.id } })
  if (!route) throw createHttpError(404, 'Route not found')
  if (req.user!.role === 'Driver' && route.assignedDriverId !== req.user!.id) {
    throw createHttpError(403, 'Access denied')
  }
  const stops = await prisma.routeStop.findMany({
    where: { routeId: req.params.id },
    include: { office: { select: { name: true } } },
    orderBy: { stopSequence: 'asc' },
  })
  res.json(stops.map(s => ({
    id: s.id,
    route_id: s.routeId,
    stop_sequence: s.stopSequence,
    office_id: s.officeId,
    office_name: s.office.name,
    nfc_tag_id: s.nfcTagId,
    shipment_tracking_numbers: s.shipmentTrackingNumbers,
    estimated_arrival: s.estimatedArrival,
    actual_arrival: s.actualArrival,
    stop_status: s.stopStatus,
  })))
}))

// PUT /api/routes/:id
router.put('/:id', authenticate, requireRole('Admin', 'Supervisor'), asyncHandler(async (req, res) => {
  const route = await prisma.route.findUnique({ where: { id: req.params.id } })
  if (!route) throw createHttpError(404, 'Route not found')

  const data: any = {}
  if (req.body.route_name) data.routeName = req.body.route_name
  if (req.body.status) data.status = req.body.status

  const updated = await prisma.route.update({
    where: { id: req.params.id },
    data,
    include: includeUsers,
  })
  await logAudit('ROUTE_UPDATED', req.user!.id, 'route', req.params.id, data, req)
  res.json(formatRoute(updated))
}))

// DELETE /api/routes/:id (cancels)
router.delete('/:id', authenticate, requireRole('Admin', 'Supervisor'), asyncHandler(async (req, res) => {
  const route = await prisma.route.findUnique({ where: { id: req.params.id } })
  if (!route) throw createHttpError(404, 'Route not found')

  await prisma.route.update({ where: { id: req.params.id }, data: { status: 'Cancelled' } })
  await prisma.shipment.updateMany({
    where: { assignedRouteId: req.params.id },
    data: { assignedRouteId: null, routeStopSequence: null },
  })
  await logAudit('ROUTE_CANCELLED', req.user!.id, 'route', req.params.id, null, req)
  res.json({ message: 'Route cancelled successfully' })
}))

// POST /api/routes/:id/start
router.post('/:id/start', authenticate, requireRole('Driver'), asyncHandler(async (req, res) => {
  const route = await prisma.route.findUnique({ where: { id: req.params.id } })
  if (!route) throw createHttpError(404, 'Route not found')
  if (route.assignedDriverId !== req.user!.id) throw createHttpError(403, 'Route not assigned to you')
  if (route.status !== 'Planned') throw createHttpError(400, 'Route is not in Planned status')

  await prisma.route.update({
    where: { id: req.params.id },
    data: { status: 'InProgress', actualStartTime: new Date() },
  })
  await logAudit('ROUTE_STARTED', req.user!.id, 'route', req.params.id, null, req)
  res.json({ message: 'Route started successfully' })
}))

// POST /api/routes/:id/complete-stop
router.post('/:id/complete-stop', authenticate, requireRole('Driver'), asyncHandler(async (req, res) => {
  const { stop_sequence } = req.body as { stop_sequence: number }
  const route = await prisma.route.findUnique({ where: { id: req.params.id } })
  if (!route) throw createHttpError(404, 'Route not found')
  if (route.assignedDriverId !== req.user!.id) throw createHttpError(403, 'Route not assigned to you')

  const stop = await prisma.routeStop.findFirst({
    where: { routeId: req.params.id, stopSequence: stop_sequence },
  })
  if (!stop) throw createHttpError(404, 'Stop not found')

  await prisma.routeStop.update({
    where: { id: stop.id },
    data: { stopStatus: 'Completed', actualArrival: new Date() },
  })
  await logAudit('ROUTE_STOP_COMPLETED', req.user!.id, 'route_stop', stop.id, null, req)
  res.json({ message: 'Stop completed successfully' })
}))

// POST /api/routes/:id/complete
router.post('/:id/complete', authenticate, requireRole('Driver'), asyncHandler(async (req, res) => {
  const route = await prisma.route.findUnique({ where: { id: req.params.id } })
  if (!route) throw createHttpError(404, 'Route not found')
  if (route.assignedDriverId !== req.user!.id) throw createHttpError(403, 'Route not assigned to you')

  await prisma.route.update({
    where: { id: req.params.id },
    data: { status: 'Completed', actualEndTime: new Date() },
  })
  await logAudit('ROUTE_COMPLETED', req.user!.id, 'route', req.params.id, null, req)
  res.json({ message: 'Route completed successfully' })
}))

export default router
