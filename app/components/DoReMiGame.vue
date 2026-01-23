<script setup lang="ts">
import { ref, computed, watch } from 'vue' // Added watch
import { BasicShadowMap, SRGBColorSpace, NoToneMapping, RepeatWrapping, MathUtils, Vector3 } from 'three'
import { Text3D, useTexture } from '@tresjs/cientos'
import { useVoiceControl } from '~/composables/useVoiceControl'
import { refThrottled } from '@vueuse/core'
import { DifficultySettings, type DifficultyEnum } from '~/models/DifficultyEnum'
import type { Texture } from 'three'
import type { GraphismEnum } from '~/models/GraphismEnum'
import type { OctaveEnum } from '~/models/OctaveEnum'
import type { Wall } from '~/models/wall'

const config = useRuntimeConfig()

const fontPath = computed(() => {
  return `${config.app.baseURL}fonts/font.json`
})

const props = defineProps<{
  isVictory: boolean
  gameStarted: boolean
  wallsNb: number
  startingOctave: OctaveEnum
  cameraActivated: boolean
  graphism: GraphismEnum
  isHighPerformanceDevice: boolean
  difficulty: DifficultyEnum
  oceanActive: boolean
  skyActive: boolean
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

const { frequency, note, volume } = useVoiceControl()

const { state: texture } = await useTexture(`${config.app.baseURL}textures/brick_diffuse.jpg`)
if (texture.value) {
  texture.value.wrapS = RepeatWrapping
  texture.value.wrapT = RepeatWrapping
}

const textureMap = new Map<string, Texture>()

const gl = {
  clearColor: undefined, // Transparent to show camera
  shadows: props.isHighPerformanceDevice,
  clearAlpha: 0,
  alpha: true,
  depth: true, // Ensure depth buffer is enabled
  logarithmicDepthBuffer: true, // Fix z-fighting for distant objects
  shadowMapType: props.isHighPerformanceDevice ? BasicShadowMap : 0,
  outputColorSpace: SRGBColorSpace,
  toneMapping: NoToneMapping,
  antialias: props.isHighPerformanceDevice
}

// Game Settings
const NOTE_SCALE_FACTOR = 1 // Vertical distance per note
const BASE_HEIGHT = 0.9
const STARTING_NOTE_OFFSET = 3

const BALL_RADIUS = 1
const UNITS_PER_OCTAVE = 7 * NOTE_SCALE_FACTOR
const UNITS_PER_SEMITONE = UNITS_PER_OCTAVE / 12

const WALL_THICKNESS = 1
const WALL_WIDTH = 10
const TOTAL_HEIGHT = 40

// State
let gameReady = false
let velocityZ = 0
const ballPosition = shallowRef(new Vector3(0, BASE_HEIGHT, 0))
const cameraPosition = shallowRef(new Vector3(20, 10, ballPosition.value.z + 40))
const cameraLookAt = shallowRef(new Vector3(0, 3, ballPosition.value.z))
const score = shallowRef(0)

const frequencyThrottled = refThrottled(frequency, 110)
const noteThrottled = refThrottled(note, 110)
const scoreThrottled = refThrottled(score, 110)

// Constants for physics
const ACCELERATION_Z = -1000 // Forward acceleration (negative Z is forward)
const MAX_SPEED_Z = -50
const BOUNCE_FORCE = 150 // Backward force on collision
const FRICTION = 0.98 // Damping after collision
const walls = ref<Wall[]>([])

const startGame = async () => {
  ballPosition.value.z = 0
  velocityZ = 0
  gameReady = true
  updatePositions()
}

watch(() => [props.difficulty, props.startingOctave], () => {
  regenerateWalls()
})

const regenerateWalls = () => {
  const gapSize = (BALL_RADIUS * 2) + (DifficultySettings[props.difficulty].acceptableErrorSemitones * 2 * UNITS_PER_SEMITONE)
  walls.value = generateWalls(props.wallsNb, props.startingOctave, BASE_HEIGHT, STARTING_NOTE_OFFSET, NOTE_SCALE_FACTOR, gapSize, WALL_WIDTH, WALL_THICKNESS, TOTAL_HEIGHT)
}

const onLoop = ({ delta }: { delta: number }) => {
  if (delta > 0.16) delta = 0.16 // Skip frames that are too long)
  if (!props.gameStarted || props.isVictory || !gameReady) return

  const previousZ = ballPosition.value.z

  // Physics: Forward Velocity
  // Apply "Gravity" towards forward direction (acceleration)
  if (velocityZ > MAX_SPEED_Z) {
    velocityZ += ACCELERATION_Z * delta
  }

  // Apply Friction (mostly useful when bouncing back)
  // Framerate independent damping:
  // If FRICTION is 1.0, this stays 1.0. If <1, it applies consistently over time.
  // We normalize to 60FPS: Math.pow(friction_per_frame, 60 * delta)
  velocityZ *= Math.pow(FRICTION, delta * 60)

  if (velocityZ < MAX_SPEED_Z) {
    velocityZ = MAX_SPEED_Z
  }

  // Update Position
  ballPosition.value.z += velocityZ * delta

  score.value = Math.abs(Math.round(ballPosition.value.z))

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
  ballPosition.value.y = damp(ballPosition.value.y, targetY, 8, delta)

  if (hasCollide(previousZ, ballPosition.value, walls.value)) {
    collision()
  }

  // Check Victory Condition
  // If we passed the last wall by a safe margin
  const lastWall = walls.value[walls.value.length - 1]
  if (lastWall && ballPosition.value.z < lastWall.z - 10) {
    emits('gameOver')
  }
  updatePositions()
}

const collision = () => {
  velocityZ = BOUNCE_FORCE
}

const updatePositions = () => {
  updateBallPosition()
  updateCameraPosition()
  updateCameraLookAt()
}
const updateBallPosition = () => {
  ballPosition.value = new Vector3(ballPosition.value.x, ballPosition.value.y, ballPosition.value.z)
  triggerRef(cameraPosition)
}
const updateCameraPosition = () => {
  cameraPosition.value = new Vector3(cameraPosition.value.x, cameraPosition.value.y, ballPosition.value.z + 40)
  triggerRef(cameraPosition)
}
const updateCameraLookAt = () => {
  cameraLookAt.value = new Vector3(cameraLookAt.value.x, cameraLookAt.value.y, ballPosition.value.z)
  triggerRef(cameraLookAt)
}

const init = () => {
  regenerateWalls()
  updateBallPosition()
  updateCameraPosition()
  updateCameraLookAt()
}

init()
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
        <FrequencyBar v-if="gameStarted && !isVictory" :frequency="frequencyThrottled" :note="noteThrottled"
          :score="scoreThrottled" />

        <!-- <DebugInfo v-if="gameStarted && !isVictory" :frequency="frequency" :note="note" :score="score" /> -->
        <FpsGraph v-if="showFps" />
        <TresCanvas v-bind="gl" window-size @loop="onLoop">
          <TresPerspectiveCamera :position="cameraPosition" :look-at="cameraLookAt" :far="2000" />
          <!-- <TresFog color="#000000" :near="10" :far="400" /> -->
          <Sky v-if="!cameraActivated && skyActive" />
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
          <template v-if="!cameraActivated && oceanActive">
            <Suspense>
              <Ocean :position="[0, 0.2, 0]" />
            </Suspense>
          </template>
          <TresAmbientLight v-if="!cameraActivated" :intensity="1.5" />
          <TresDirectionalLight :position="[10, 20, 10]" :intensity="1" :cast-shadow="!cameraActivated" />

          <!-- Player Ball -->
          <TresMesh :position="ballPosition">
            <TresSphereGeometry :args="[1, 32, 32]" />
            <TresMeshPhysicalMaterial :metalness="0.9" :roughness="0.5" color="#22aaff" />
            
          </TresMesh>

          <!-- Walls -->
          <TresGroup v-for="wall in walls" :key="wall.id" :position="[0, 0, wall.z]">
            <Suspense>
              <Text3D center need-updates :bevel-thickness="0.1" :size="2" :position="wall.textPosition"
                :text="`${wall.note}${wall.octave}`" :color="wall.color" :font="fontPath">
                <TresMeshStandardMaterial :roughness="0.2" :metalness="0.1" color="#FEEEEE" />
              </Text3D>
            </Suspense>

            <!-- Middle Glass Part with Hole -->
            <TresMesh :position="wall.middle.position" :geometry="wall.middle.geometry">
              <TresMeshPhysicalMaterial :transparent="true" :opacity="0.2" :roughness="0.2" :metalness="0.5"
                color="grey" />
            </TresMesh>

            <!-- Bottom Block -->
            <TresMesh :position="wall.bottom.position">
              <TresBoxGeometry :args="[wall.bottom.args[0], wall.bottom.args[1], wall.bottom.args[2]]" />
              <TresMeshStandardMaterial
                :map="getRepeatedTexture(textureMap, texture, wall.bottom.args[0], wall.bottom.args[1])" />
            </TresMesh>

            <!-- Top Block -->
            <TresMesh :position="wall.top.position">
              <TresBoxGeometry :args="[wall.top.args[0], wall.top.args[1], wall.top.args[2]]" />
              <TresMeshStandardMaterial
                :map="getRepeatedTexture(textureMap, texture, wall.top.args[0], wall.top.args[1])" />
            </TresMesh>
          </TresGroup>
        </TresCanvas>
      </div>
    </template>
  </Suspense>
</template>
