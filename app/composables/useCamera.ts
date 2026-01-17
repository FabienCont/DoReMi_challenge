export const useCamera = () => {
  const stream = ref<MediaStream | null>(null)
  const startCamera = async () => {
    try {
      const streamValue = await useMediaDevices().getCameraUserMedia()
      stream.value = streamValue
    } catch (err) {
      console.error('Failed to access camera:', err)
    }
  }

  const stopCamera = () => {
    console.log('Stopping camera')
    if (stream.value) {
      console.log('Stopping camera')
      stream.value.getTracks().forEach(track => track.stop())
      stream.value = null
    }
  }

  const cameraActivated = computed<boolean>(() => !!stream.value)
  onUnmounted(() => {
    stopCamera()
  })
  return {
    stream,
    cameraActivated,
    startCamera,
    stopCamera
  }
}
