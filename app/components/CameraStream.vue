<template>
  <div class="fixed inset-0 w-full h-full -z-10">
    <video
      ref="videoRef"
      autoplay
      playsinline
      muted
      class="w-full h-full object-cover"
    />
  </div>
</template>

<script setup lang="ts">
const videoRef = useTemplateRef<HTMLVideoElement>('videoRef')
const { stream } = defineProps<{ stream: MediaStream | null }>()

const displayStream = () => {
  if (stream && videoRef.value) {
    videoRef.value.srcObject = stream
  }
}

const hideStream = () => {
  if (videoRef.value) {
    videoRef.value.srcObject = null
  }
}

onMounted(() => {
  displayStream()
})

onUnmounted(() => {
  hideStream()
})
</script>
