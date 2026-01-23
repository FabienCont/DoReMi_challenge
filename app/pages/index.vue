<script setup lang="ts">
import { ref } from 'vue'
import DoReMiGame from '~/components/DoReMiGame.vue'
import { useWakeLock } from '~/composables/useWakeLock'
import { DifficultyEnum } from '~/models/DifficultyEnum'
import { GraphismEnum } from '~/models/GraphismEnum'
import { OctaveEnum } from '~/models/OctaveEnum'

const { getMicrophoneUserMedia } = useMediaDevices()
const { start, isListening } = useVoiceControl()
const { stream, startCamera, stopCamera, cameraActivated } = useCamera()
const { isHighPerformanceDevice, detectPerformance } = useDetectPerformanceDevice()
const isVictory = ref(false)
const gameStarted = ref(false)
const octave = ref<OctaveEnum>(OctaveEnum.OCTAVE_3)
const graphism = ref<GraphismEnum>(GraphismEnum.LOW)
const difficulty = ref<DifficultyEnum>(DifficultyEnum.EASY)
const showFps = ref(false)
const oceanActive = ref(true)
const skyActive = ref(true)

const finishGame = () => {
  isVictory.value = true
  gameStarted.value = false
}

const resetGame = () => {
  isVictory.value = false
  gameStarted.value = false
}

const startGame = async () => {
  resetGame()
  await start()
  gameStarted.value = true
}

const activateCamera = () => {
  startCamera()
}

const deactivateCamera = () => {
  stopCamera()
}

const { requestWakeLock, releaseWakeLock, handleVisibilityChange } = useWakeLock()

onMounted(async () => {
  detectPerformance()
  if (isHighPerformanceDevice.value) {
    graphism.value = GraphismEnum.HIGH
  } else {
    graphism.value = GraphismEnum.LOW
  }
  await getMicrophoneUserMedia()
  document.addEventListener('visibilitychange', handleVisibilityChange)
  await requestWakeLock()
})

watch(() => graphism.value, (newValue) => {
  if (newValue === GraphismEnum.LOW) {
    oceanActive.value = false
  } else {
    oceanActive.value = true
  }
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  releaseWakeLock()
})
</script>

<template>
  <UContainer>
    <ClientOnly>
      <CameraStream
        v-if="stream"
        :stream="stream"
      />
    </ClientOnly>
    <div class="relative z-20 top-12 max-w-3xl mx-auto">
      <StartMenu
        v-if="!gameStarted && !isVictory"
        v-model:octave="octave"
        v-model:graphism="graphism"
        v-model:show-fps="showFps"
        v-model:difficulty="difficulty"
        v-model:ocean-active="oceanActive"
        v-model:sky-active="skyActive"
        :microphone-activated="isListening"
        :camera-activated="cameraActivated"
        @activate-microphone="start"
        @start-game="startGame"
        @activate-camera="activateCamera"
        @deactivate-camera="deactivateCamera"
      />
      <VictoryMenu
        v-if="!gameStarted && isVictory"
        @return-to-menu="resetGame"
        @start-game="startGame"
      />
    </div>
    <div class="absolute inset-0 w-full h-full">
      <ClientOnly>
        <DoReMiGame
          :is-victory="isVictory"
          :game-started="gameStarted"
          :camera-activated="cameraActivated"
          :starting-octave="octave"
          :walls-nb="7"
          :graphism="graphism"
          :show-fps="showFps"
          :is-high-performance-device="isHighPerformanceDevice"
          :difficulty="difficulty"
          :ocean-active="oceanActive"
          :sky-active="skyActive"
          @game-over="finishGame"
        />
      </ClientOnly>
    </div>
  </UContainer>
</template>
