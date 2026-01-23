export const useDetectPerformanceDevice = () => {
  const isHighPerformanceDevice = ref(false)
  const detectPerformance = () => {
    if ('hardwareConcurrency' in navigator && navigator.hardwareConcurrency >= 4) {
      isHighPerformanceDevice.value = true
    }

    if ('deviceMemory' in navigator && typeof navigator.deviceMemory === 'number') {
      if (navigator.deviceMemory >= 4) {
        isHighPerformanceDevice.value = true
      } else {
        isHighPerformanceDevice.value = false
      }
    }
  }

  return {
    detectPerformance,
    isHighPerformanceDevice
  }
}
