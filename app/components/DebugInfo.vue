<script lang="ts" setup>
defineProps<{
  frequency: number
  note: string
  score?: number
}>()
</script>

<template>
  <div class="top-20 left-12 absolute z-30">
    <div class="bg-black/30 p-2 rounded backdrop-blur">
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
      <div class="w-64 h-4 bg-gray-700/50 rounded mt-2 overflow-hidden border border-white/20">
        <div
          class="h-full bg-green-500 transition-all duration-100 ease-out"
          :style="{ width: `${Math.min((frequency / 1000) * 100, 100)}%` }"
        />
      </div>
    </div>
  </div>
</template>
