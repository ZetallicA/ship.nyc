// Haversine-based TSP fallback (no external deps)

interface OfficePoint {
  id: string
  name: string
  lat?: number | null
  lng?: number | null
}

function haversineKm(a: OfficePoint, b: OfficePoint): number {
  if (!a.lat || !a.lng || !b.lat || !b.lng) return 0
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLon = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

function nearestNeighborTSP(offices: OfficePoint[]): OfficePoint[] {
  if (offices.length <= 1) return offices
  const unvisited = [...offices]
  const route: OfficePoint[] = []
  let current = unvisited.shift()!
  route.push(current)

  while (unvisited.length > 0) {
    let nearest = unvisited[0]!
    let minDist = haversineKm(current, nearest)
    for (const o of unvisited.slice(1)) {
      const d = haversineKm(current, o)
      if (d < minDist) {
        minDist = d
        nearest = o
      }
    }
    route.push(nearest)
    unvisited.splice(unvisited.indexOf(nearest), 1)
    current = nearest
  }
  return route
}

export function optimizeRoute(offices: OfficePoint[]): {
  waypoints: string[]
  estimated_duration: number
  distance: number
} {
  if (offices.length === 0) return { waypoints: [], estimated_duration: 0, distance: 0 }
  if (offices.length === 1) return { waypoints: [offices[0]!.id], estimated_duration: 15, distance: 0 }

  const sorted = nearestNeighborTSP(offices)

  let totalKm = 0
  for (let i = 0; i < sorted.length - 1; i++) {
    totalKm += haversineKm(sorted[i]!, sorted[i + 1]!)
  }

  const avgSpeedKmH = 30
  const stopTimeMin = 10
  const travelMin = (totalKm / avgSpeedKmH) * 60
  const estimatedDuration = Math.round(travelMin + sorted.length * stopTimeMin)

  return {
    waypoints: sorted.map(o => o.id),
    estimated_duration: estimatedDuration,
    distance: Math.round(totalKm * 10) / 10,
  }
}
