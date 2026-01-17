export const useUserMediaPermissions = () => {
  const getCameraPermission = async (): Promise<boolean> => {
    try {
      const status = await navigator.permissions.query({ name: 'camera' as PermissionName })
      return status.state === 'granted'
    } catch (err) {
      console.error('Error checking camera permission:', err)
      return false
    }
  }

  const getMicrophonePermission = async (): Promise<boolean> => {
    try {
      const status = await navigator.permissions.query({ name: 'microphone' as PermissionName })
      return status.state === 'granted'
    } catch (err) {
      console.error('Error checking microphone permission:', err)
      return false
    }
  }

  const initializePermissions = async () => {
    await Promise.all([getCameraPermission(), getMicrophonePermission()])
  }

  return {
    getCameraPermission,
    getMicrophonePermission,
    initializePermissions
  }
}
