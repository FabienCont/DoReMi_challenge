import type { ExtrudeGeometry, Vector3 } from 'three'

export type Wall
  = {
    id: number
    z: number
    color: string
    note: string | undefined
    octave: number
    range: { min: number, max: number }
    bottom: {
      position: Vector3
      args: number[]
    }
    top: {
      position: Vector3
      args: number[]
    }
    middle: {
      // Extrusion starts at Z=0 and goes +depth.
      // Wall center Z is local 0. So we shift back by half thickness
      position: Vector3
      geometry: ExtrudeGeometry
    }
    textPosition: Vector3
  }
