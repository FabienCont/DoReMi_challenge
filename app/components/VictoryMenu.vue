<script lang="ts" setup>
const emit = defineEmits<{
  (e: 'startGame' | 'returnToMenu'): void
}>()
</script>

<template>
  <UCard variant="soft">
    <template #header>
      <h1 class="text-3xl font-bold mb-2 blue-font text-center">
        You Win! 🎵
      </h1>
    </template>

    <div class="flex flex-col gap-2">
      <p class="text-xl mb-4">
        Congratulations! You've mastered the scale.
      </p>
      <div class="flex gap-4 mt-4">
        <UButton
          color="secondary"
          variant="solid"
          @click="emit('startGame')"
        >
          Play Again
        </UButton>
        <UButton
          color="secondary"
          @click=" emit('returnToMenu')"
        >
          Return to Menu
        </UButton>
      </div>
    </div>
  </UCard>
</template>

<style scoped>
.blue-font {
    font-family: 'Blue Winter';
}
</style>
