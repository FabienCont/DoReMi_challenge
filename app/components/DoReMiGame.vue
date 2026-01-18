<script setup lang="ts">
import { ref, computed, watch } from 'vue' // Added watch
import { BasicShadowMap, SRGBColorSpace, NoToneMapping, RepeatWrapping, MathUtils, Shape, Path, ExtrudeGeometry, Vector3 } from 'three'
import { Text3D, useTexture } from '@tresjs/cientos'
import { useVoiceControl } from '~/composables/useVoiceControl'
import type { Texture } from 'three'

const config = useRuntimeConfig()

const fontPath = computed(() => {
  return `${config.app.baseURL}fonts/font.json`
})

const props = defineProps<{
  isVictory: boolean
  gameStarted: boolean
  walls: number
  startingOctave: number
  cameraActivated: boolean
  graphism: number
  showFps?: boolean
}>()

watch(() => props.gameStarted, (newVal) => {
  if (newVal)
    startGame()
})

const emits = defineEmits<{
  (e: 'gameOver'): void
}>()

// Helper for framerate independent damping
const damp = (current: number, target: number, lambda: number, delta: number) => {
  return MathUtils.lerp(current, target, 1 - Math.exp(-lambda * delta))
}

const { note, frequency, volume } = useVoiceControl()

const { state: texture } = await useTexture(`${config.app.baseURL}textures/brick_diffuse.jpg`)
if (texture.value) {
  texture.value.wrapS = RepeatWrapping
  texture.value.wrapT = RepeatWrapping
}

const textureMap = new Map<string, Texture>()
const getRepeatedTexture = (w?: number, h?: number) => {
  if (!w || !h) return null

  const key = `${w.toFixed(1)}_${h.toFixed(1)}`
  if (textureMap.has(key)) return textureMap.get(key)

  if (!texture.value) return null

  // 1 unit = 1/5th of the texture. Adjust 5 to change density.
  const DENSITY = 15

  const t = texture.value.clone()
  t.wrapS = RepeatWrapping
  t.wrapT = RepeatWrapping
  t.repeat.set(w / DENSITY, h / DENSITY)

  textureMap.set(key, t)
  return t
}

const gl = {
  clearColor: undefined, // Transparent to show camera
  shadows: true,
  clearAlpha: 0,
  alpha: true,
  depth: true, // Ensure depth buffer is enabled
  logarithmicDepthBuffer: true, // Fix z-fighting for distant objects
  shadowMapType: BasicShadowMap,
  outputColorSpace: SRGBColorSpace,
  toneMapping: NoToneMapping
}

// Game Settings
const GAP_SIZE = 2.5
const WALL_THICKNESS = 1
const WALL_WIDTH = 10
const TOTAL_HEIGHT = 40

const NOTE_SCALE_FACTOR = 1 // Vertical distance per note
const BASE_HEIGHT = 0.9
const STARTING_NOTE_OFFSET = 3

// State
const gameReady = ref(false)
const ballZ = ref(0)
const ballY = ref(BASE_HEIGHT)
const score = ref(0)
const velocityZ = ref(0) // Forward velocity
// Constants for physics
const ACCELERATION_Z = -1000 // Forward acceleration (negative Z is forward)
const MAX_SPEED_Z = -50
const BOUNCE_FORCE = 150 // Backward force on collision
const FRICTION = 0.98 // Damping after collision

const getRandomColor = () => {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
}

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
const generateWalls = (count: number) => {
  const list = []
  for (let i = 0; i < count; i++) {
    // Calculate dimensions
    // Start from 3 note higher
    const gapCenterY = BASE_HEIGHT + ((i + STARTING_NOTE_OFFSET) * NOTE_SCALE_FACTOR)
    const gapMin = gapCenterY - (GAP_SIZE / 2)
    const gapMax = gapCenterY + (GAP_SIZE / 2)

    const bottomHeight = Math.max(0.1, gapMin) // Ensure valid geometry
    const topHeight = Math.max(0.1, TOTAL_HEIGHT - gapMax)

    // Middle Part Dimensions
    // Height covers the gap. Width is same as wall.
    // Radius slightly smaller than half the gap allows the ball to pass visually but looks like a tight fit
    // Or make it exactly the gap size. Let's make it equal to gap size for smooth visual.
    const holeRadius = (GAP_SIZE / 2)
    // We make the glass block slightly taller than the gap so it overlaps nicely or sits flush
    const glassHeight = GAP_SIZE

    list.push({
      id: i,
      z: -((i + 1) * 30), // Every 30 units
      color: getRandomColor(),
      note: ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si'][i % 7],
      octave: props.startingOctave + Math.floor(i / 7),
      range: { min: gapMin, max: gapMax },
      bottom: {
        position: new Vector3(0, bottomHeight / 2, 0),
        args: [WALL_WIDTH, bottomHeight, WALL_THICKNESS]
      },
      top: {
        position: new Vector3(0, gapMax + (topHeight / 2), 0),
        args: [WALL_WIDTH, topHeight, WALL_THICKNESS]
      },
      middle: {
        // Extrusion starts at Z=0 and goes +depth.
        // Wall center Z is local 0. So we shift back by half thickness
        position: new Vector3(0, gapCenterY, -WALL_THICKNESS / 2),
        geometry: createWallWithHoleGeometry(WALL_WIDTH, glassHeight, WALL_THICKNESS, holeRadius + 0.1) // Check +0.1 for visual clearance
      },
      textPosition: new Vector3(0, gapMax + 2, 1)
    })
  }
  return list
}
const walls = ref(generateWalls(props.walls))

const startGame = async () => {
  ballZ.value = 0
  velocityZ.value = 0
  walls.value = generateWalls(props.walls)
  gameReady.value = true
  if (props.showFps) {
    console.log('Activating FPS Graph')
  }
}

const onLoop = ({ delta }: { delta: number }) => {
  if (!props.gameStarted || props.isVictory || !gameReady.value) return

  const previousZ = ballZ.value

  // Physics: Forward Velocity
  // Apply "Gravity" towards forward direction (acceleration)
  if (velocityZ.value > MAX_SPEED_Z) {
    velocityZ.value += ACCELERATION_Z * delta
  }

  // Apply Friction (mostly useful when bouncing back)
  // Framerate independent damping:
  // If FRICTION is 1.0, this stays 1.0. If <1, it applies consistently over time.
  // We normalize to 60FPS: Math.pow(friction_per_frame, 60 * delta)
  velocityZ.value *= Math.pow(FRICTION, delta * 60)

  // Update Position
  ballZ.value += velocityZ.value * delta

  score.value = Math.abs(Math.round(ballZ.value))

  if (velocityZ.value < MAX_SPEED_Z) {
    velocityZ.value = MAX_SPEED_Z
  }

  // Handle Height
  let targetY = BASE_HEIGHT

  if (frequency.value > 30 && volume.value > 25) { // Filter noise and low volume
    // C3 (Midi 48) is ~130.8Hz
    const cFreq = 130.81 * Math.pow(2, props.startingOctave - 3)
    // Set min height frequency based on STARTING_NOTE_OFFSET notes (diatonic approx) below root
    // We use 7 as denominator to match the diatonic scaling of the game
    const minFreq = cFreq * Math.pow(2, -STARTING_NOTE_OFFSET / 7)

    // Logarithmic mapping: 1 octave = 7 notes (diatonic) * NOTE_SCALE_FACTOR
    const octaves = Math.log2(frequency.value / minFreq)

    if (octaves > 0) {
      targetY = BASE_HEIGHT + (octaves * 7 * NOTE_SCALE_FACTOR)
    }
  }

  // Smooth lerp
  ballY.value = damp(ballY.value, targetY, 6, delta)

  // Collision Detection
  const ballRadius = 1
  const collisionZoneHalfWidth = 0.5 + ballRadius

  // Determine movement segment for sweep test
  // Assuming linear movement from previousZ to ballZ.value
  const zStart = Math.min(previousZ, ballZ.value)
  const zEnd = Math.max(previousZ, ballZ.value)

  for (const wall of walls.value) {
    const wallMin = wall.z - collisionZoneHalfWidth
    const wallMax = wall.z + collisionZoneHalfWidth

    // Check for overlap of [zStart, zEnd] with [wallMin, wallMax]
    // No overlap if: zEnd < wallMin OR zStart > wallMax
    if (zEnd < wallMin || zStart > wallMax) continue

    const ballBottom = ballY.value - ballRadius
    const ballTop = ballY.value + ballRadius

    if (ballBottom < wall.range.min) {
      // Hit bottom block
      collision()
    } else if (ballTop > wall.range.max) {
      // Hit top block
      collision()
    }
  }

  // Check Victory Condition
  // If we passed the last wall by a safe margin
  const lastWall = walls.value[walls.value.length - 1]
  if (lastWall && ballZ.value < lastWall.z - 10) {
    emits('gameOver')
  }
}

const collision = () => {
  // Apply backward force (positive Z is backward)
  // If we are moving fast forward (negative velocity), this reverses it
  velocityZ.value = BOUNCE_FORCE
}

const cameraPosition = computed<[number, number, number]>(() => [20, 10, ballZ.value + 40])
const cameraLookAt = computed<[number, number, number]>(() => [0, 3, ballZ.value])
</script>

<template>
  <Suspense>
    <template #fallback>
      <div class="fixed inset-0 flex items-center justify-center text-white z-50">
        Loading...
      </div>
    </template>
    <template #default>
      <div>
        <FrequencyBar
          v-if="gameStarted && !isVictory"
          :frequency="frequency"
          :note="note"
          :score="score"
        />

        <!-- <DebugInfo v-if="gameStarted && !isVictory" :frequency="frequency" :note="note" :score="score" /> -->
        <FpsGraph v-if="showFps" />
        <TresCanvas
          v-bind="gl"
          window-size
          @loop="onLoop"
        >
          <TresPerspectiveCamera
            :position="cameraPosition"
            :look-at="cameraLookAt"
            :far="2000"
          />
          <!-- <TresFog color="#000000" :near="10" :far="400" /> -->
          <Sky v-if="!cameraActivated" />
          <template v-if="graphism !== 2">
            <TresMesh :position="[0, -0.8, -50]">
              <TresBoxGeometry :args="[14, 1, 2000]" />
              <TresMeshStandardMaterial
                :roughness="0.8"
                :metalness="0.7"
                color="grey"
              />
            </TresMesh>
          </template>
          <template v-if="graphism === 2">
            <Suspense>
              <Ocean v-if="!cameraActivated" />
            </Suspense>
          </template>
          <TresAmbientLight
            v-if="!cameraActivated"
            :intensity="1.5"
          />
          <TresDirectionalLight
            :position="[10, 20, 10]"
            :intensity="1"
            :cast-shadow="!cameraActivated"
          />

          <!-- Player Ball -->
          <TresMesh :position="[0, ballY, ballZ]">
            <TresSphereGeometry :args="[1, 32, 32]" />
            <TresMeshPhysicalMaterial
              :thickness="0.2"
              :roughness="0.1"
              :metalness="0.2"
              :transmission="1.0"
            />
            <!-- <TresMeshStandardMaterial color="#4444e4" /> -->
          </TresMesh>

          <!-- Walls -->
          <TresGroup
            v-for="wall in walls"
            :key="wall.id"
            :position="[0, 0, wall.z]"
          >
            <Suspense>
              <Text3D
                center
                need-updates
                :bevel-thickness="0.1"
                :size="2"
                :position="wall.textPosition"
                :text="`${wall.note}${wall.octave}`"
                :color="wall.color"
                :font="fontPath"
              >
                <TresMeshStandardMaterial
                  :roughness="0.2"
                  :metalness="0.1"
                  color="#FEEEEE"
                />
              </Text3D>
            </Suspense>

            <!-- Middle Glass Part with Hole -->
            <TresMesh
              :position="wall.middle.position"
              :geometry="wall.middle.geometry"
            >
              <MeshGlassMaterial />
            </TresMesh>

            <!-- Bottom Block -->
            <TresMesh :position="wall.bottom.position">
              <TresBoxGeometry :args="[wall.bottom.args[0], wall.bottom.args[1], wall.bottom.args[2]]" />
              <TresMeshStandardMaterial :map="getRepeatedTexture(wall.bottom.args[0], wall.bottom.args[1])" />
            </TresMesh>

            <!-- Top Block -->
            <TresMesh :position="wall.top.position">
              <TresBoxGeometry :args="[wall.top.args[0], wall.top.args[1], wall.top.args[2]]" />
              <TresMeshStandardMaterial :map="getRepeatedTexture(wall.top.args[0], wall.top.args[1])" />
            </TresMesh>
          </TresGroup>
        </TresCanvas>
      </div>
    </template>
  </Suspense>
</template>
