import { ExtrudeGeometry, Path, Shape, Vector3 } from 'three'
import type { Wall } from '@/models/wall'

// Helper: Custom Geometry for wall with hole
const createWallWithHoleGeometry = (width: number, height: number, depth: number, holeRadius: number) => {
  const shape = new Shape()

  // Draw the main rectangle centered at 0,0
  const w2 = width / 2
  const h2 = height / 2
  shape.moveTo(-w2, -h2)
  shape.lineTo(w2, -h2)
  shape.lineTo(w2, h2)
  shape.lineTo(-w2, h2)
  shape.lineTo(-w2, -h2)

  // Create the hole
  const hole = new Path()
  hole.absarc(0, 0, holeRadius, 0, Math.PI * 2, false)
  shape.holes.push(hole)

  // Extrude params
  const extrudeSettings = {
    depth: depth,
    bevelEnabled: true,
    bevelThickness: 0.1,
    bevelSize: 0.1,
    bevelSegments: 2,
    curveSegments: 32 // Smoother circle
  }

  return new ExtrudeGeometry(shape, extrudeSettings)
}

// Obstacles
// Generate a sequence of walls
export const generateWalls = (count: number, startingOctave: number, baseHeight: number, statingNoteOffset: number, noteScaleFactor: number, gapSize: number, wallWidth: number, wallThickness: number, totalHeight: number): Wall[] => {
  const list = []
  for (let i = 0; i < count; i++) {
    // Calculate dimensions
    // Start from 3 note higher
    const gapCenterY = baseHeight + ((i + statingNoteOffset) * noteScaleFactor)
    const gapMin = gapCenterY - (gapSize / 2)
    const gapMax = gapCenterY + (gapSize / 2)

    const bottomHeight = Math.max(0.1, gapMin) // Ensure valid geometry
    const topHeight = Math.max(0.1, totalHeight - gapMax)

    // Middle Part Dimensions
    // Height covers the gap. Width is same as wall.
    // Radius slightly smaller than half the gap allows the ball to pass visually but looks like a tight fit
    // Or make it exactly the gap size. Let's make it equal to gap size for smooth visual.
    const holeRadius = (gapSize / 2)
    // We make the glass block slightly taller than the gap so it overlaps nicely or sits flush
    const glassHeight = gapSize

    list.push({
      id: i,
      z: -((i + 1) * 30), // Every 30 units
      color: getRandomColor(),
      note: ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si'][i % 7],
      octave: startingOctave + Math.floor(i / 7),
      range: { min: gapMin, max: gapMax },
      bottom: {
        position: new Vector3(0, bottomHeight / 2, 0),
        args: [wallWidth, bottomHeight, wallThickness]
      },
      top: {
        position: new Vector3(0, gapMax + (topHeight / 2), 0),
        args: [wallWidth, topHeight, wallThickness]
      },
      middle: {
        // Extrusion starts at Z=0 and goes +depth.
        // Wall center Z is local 0. So we shift back by half thickness
        position: new Vector3(0, gapCenterY, -wallThickness / 2),
        geometry: createWallWithHoleGeometry(wallWidth, glassHeight, wallThickness, holeRadius + 0.1) // Check +0.1 for visual clearance
      },
      textPosition: new Vector3(0, gapMax + 2, 1)
    })
  }
  return list
}
