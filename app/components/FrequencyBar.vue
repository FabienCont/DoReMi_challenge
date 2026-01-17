<script lang="ts" setup>
defineProps<{
  frequency: number
  note: string
  score?: number
}>()
</script>

<template>
  <div class="bottom-20 left-12 absolute z-30">
    <div class="w-6 h-64 rounded-4xl mt-2 overflow-hidden border-3 border-white/10 flex flex-col justify-end">
      <div
        class="w-full relative overflow-hidden transition-all duration-200 ease-out"
        :style="{ height: `${Math.min((frequency / 800) * 100, 100)}%` }"
      >
        <div class="absolute bottom-0 w-full h-64 bg-gradient-to-t via-green-500 to-orange-500" />
      </div>
    </div>
    <div class="bg-gray/10 p-2 rounded">
      <div class="text-xl font-bold">
        Note: {{ note || '-' }}
      </div>
      <div class="text-sm">
        Frequency: {{ Math.round(frequency) }} Hz
      </div>
      <div
        v-if="score !== undefined"
        class="text-sm"
      >
        Distance: {{ score }} m
      </div>
    </div>
  </div>
</template>

<style scoped></style>
