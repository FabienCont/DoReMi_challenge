<script setup lang="ts">
import { ref } from 'vue'
import DoReMiGame from '~/components/DoReMiGame.vue'

const { getMicrophoneUserMedia } = useMediaDevices()
const { start, isListening } = useVoiceControl()
const { stream, startCamera, stopCamera, cameraActivated } = useCamera()
const isVictory = ref(false)
const gameStarted = ref(false)
const octave = ref(3)
const graphism = ref(1)
const showFps = ref(false)

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

onMounted(async () => {
  await getMicrophoneUserMedia()
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
        :microphone-activated="isListening"
        :camera-activated="cameraActivated"
        @activate-microphone="start"
        @start-game="startGame"
        @activate-camera="activateCamera"
        @deactivate-camera="deactivateCamera"
        v-model:showFps="showFps"
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
          :walls="7"
          :graphism="graphism"
          :show-fps="showFps"
          @game-over="finishGame"
        />
      </ClientOnly>
    </div>
  </UContainer>
</template>
