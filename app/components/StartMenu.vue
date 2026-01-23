<script lang="ts" setup>
import type { SelectItem } from '@nuxt/ui'
import { DifficultyEnum } from '~/models/DifficultyEnum'
import { GraphismEnum } from '~/models/GraphismEnum'
import { OctaveEnum } from '~/models/OctaveEnum'

const octave = defineModel<number>('octave')
const graphism = defineModel<number>('graphism')
const difficulty = defineModel<number>('difficulty')
const showFps = defineModel<boolean>('showFps')
const oceanActive = defineModel<boolean>('oceanActive')
const skyActive = defineModel<boolean>('skyActive')
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
    value: OctaveEnum.OCTAVE_3
  },
  {
    label: 'Octave 4',
    value: OctaveEnum.OCTAVE_4
  },
  {
    label: 'Octave 5',
    value: OctaveEnum.OCTAVE_5
  },
  {
    label: 'Octave 6',
    value: OctaveEnum.OCTAVE_6
  }
])

const difficulties = ref<SelectItem[]>([
  {
    label: 'Very Easy',
    value: DifficultyEnum.VERY_EASY
  },
  {
    label: 'Easy',
    value: DifficultyEnum.EASY
  },
  {
    label: 'Medium',
    value: DifficultyEnum.MEDIUM
  },
  {
    label: 'Hard',
    value: DifficultyEnum.HARD
  }
])

const graphisms = ref<SelectItem[]>([
  {
    label: 'Minimalist',
    value: GraphismEnum.LOW
  },
  {
    label: 'High (not for small devices)',
    value: GraphismEnum.HIGH
  }
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
          <UButton
            label="Activate the microphone"
            @click="activateMicrophone"
          />
        </div>
      </template>

      <template v-if="microphoneActivated">
        <p> Choose your octave:</p>
        <USelect
          v-model="octave"
          class="w-64"
          :items="items"
          label="Octave"
        />
        <p> Choose difficulty:</p>
        <USelect
          v-model="difficulty"
          class="w-64"
          :items="difficulties"
          label="Difficulty"
        />
        <p> Choose graphism:</p>
        <USelect
          v-model="graphism"
          class="w-64"
          :items="graphisms"
          label="Graphism"
        />

        <USwitch
          v-model="showFps"
          label="Show FPS"
        />
        <USwitch
          v-model="oceanActive"
          label="Activate Ocean shader"
        />
        <USwitch
          v-model="skyActive"
          label="Activate Sky shader"
        />
        <div>
          <UButton
            v-if="!cameraActivated"
            variant="subtle"
            color="secondary"
            label="Activate the camera"
            @click="activateCamera"
          />
          <UButton
            v-else
            variant="subtle"
            color="secondary"
            label="Deactivate the camera"
            @click="deactivateCamera"
          />
        </div>
        <div class="mt-4">
          <UButton
            color="secondary"
            size="xl"
            @click="startGame"
          >
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
