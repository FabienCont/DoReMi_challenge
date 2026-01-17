<script lang="ts" setup>
import type { SelectItem } from '@nuxt/ui'

const octave = defineModel<number>('octave')
const graphism = defineModel<number>('graphism')
const showFps = defineModel<boolean>('showFps')
const { cameraActivated, microphoneActivated } = defineProps<{ cameraActivated: boolean, microphoneActivated: boolean }>()

const emits = defineEmits<{
  (e: 'activateCamera' | 'deactivateCamera' | 'startGame' | 'activateMicrophone'): void
}>()

const startGame = () => {
  emits('startGame')
}

const activateCamera = () => {
  emits('activateCamera')
}

const deactivateCamera = () => {
  emits('deactivateCamera')
}

const activateMicrophone = () => {
  emits('activateMicrophone')
}

const items = ref<SelectItem[]>([
  {
    label: 'Octave 3',
    value: 3
  },
  {
    label: 'Octave 4',
    value: 4
  },
  {
    label: 'Octave 5',
    value: 5
  },
  {
    label: 'Octave 6',
    value: 6
  }
])

const graphisms = ref<SelectItem[]>([
  {
    label: 'Minimalist',
    value: 1
  },
  {
    label: 'High (not for small devices)',
    value: 2
  },
])
</script>

<template>
  <UCard variant="soft">
    <template #header>
      <h1 class="text-3xl font-bold mb-2 header-font text-center">
        Do Re Mi Challenge
      </h1>
    </template>

    <div class="flex flex-col gap-2">
      <p class="text-xl mb-4">
        Control the ball height by singing: Low (Do) -> High (Si)
      </p>

      <template v-if="!microphoneActivated">
        <p>You can not start the game without activating the microphone.</p>
        <div>
          <UButton label="Activate the microphone" @click="activateMicrophone" />
        </div>
      </template>

      <template v-if="microphoneActivated">
        <p> Choose your octave:</p>
        <USelect v-model="octave" class="w-64" :items="items" label="Octave" />
        <p> Choose graphism:</p>
        <USelect v-model="graphism" class="w-64" :items="graphisms" label="Graphism" />
        
        <USwitch v-model="showFps" label="Show FPS" />

        <div>
          <UButton v-if="!cameraActivated" variant="subtle" color="secondary" label="Activate the camera"
            @click="activateCamera" />
          <UButton v-else variant="subtle" color="secondary" label="Deactivate the camera" @click="deactivateCamera" />
        </div>
        <div class="mt-4">
          <UButton color="secondary" size="xl" @click="startGame">
            Start Game
          </UButton>
        </div>
      </template>
    </div>
  </UCard>
</template>

<style scoped>
.header-font {
  font-family: 'Blue Winter';
}
</style>
