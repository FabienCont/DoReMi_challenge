export const useWakeLock = () => {
  const wakeLock = ref<WakeLockSentinel | null>(null)

  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLock.value = await navigator.wakeLock.request('screen')
      }
    } catch (err) {
      console.error(`Wake Lock error: ${err}`)
    }
  }

  const releaseWakeLock = async () => {
    if (wakeLock.value) {
      try {
        await wakeLock.value.release()
        wakeLock.value = null
      } catch (err) {
        console.error(`Wake Lock release error: ${err}`)
      }
    }
  }

  const handleVisibilityChange = async () => {
    if (wakeLock.value !== null && document.visibilityState === 'visible') {
      await requestWakeLock()
    }
  }
  return {
    requestWakeLock,
    releaseWakeLock,
    handleVisibilityChange
  }
}
