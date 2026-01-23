import type { Vector3 } from 'three'
import type { Wall } from '@/models/wall'

export const hasCollide = (previousZ: number, ballPosition: Vector3, walls: Wall[]): boolean => {
  // Collision Detection
  const ballRadius = 1
  const collisionZoneHalfWidth = 0.25 + ballRadius

  // Determine movement segment for sweep test
  // Assuming linear movement from previousZ to ballPosition.z
  const zStart = Math.min(previousZ, ballPosition.z)
  const zEnd = Math.max(previousZ, ballPosition.z)
  for (const wall of walls) {
    const wallMin = wall.z - collisionZoneHalfWidth
    const wallMax = wall.z + collisionZoneHalfWidth

    // Check for overlap of [zStart, zEnd] with [wallMin, wallMax]
    // No overlap if: zEnd < wallMin OR zStart > wallMax
    if (zEnd < wallMin || zStart > wallMax) continue

    const ballBottom = ballPosition.y - ballRadius
    const ballTop = ballPosition.y + ballRadius
    if (ballBottom < wall.range.min) {
      // Hit bottom block
      return true
    } else if (ballTop > wall.range.max) {
      // Hit top block
      return true
    }
  }
  return false
}
