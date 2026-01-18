let cameraStream: MediaStream | null = null
let microphoneStream: MediaStream | null = null

export const useMediaDevices = () => {
  const getCameraUserMedia = async () => {
    if (cameraStream) return cameraStream
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    } catch {
      useToast().add({ title: 'Camera access denied or not available.', color: 'error' })
      cameraStream = null
    }
    return cameraStream
  }

  const getMicrophoneUserMedia = async () => {
    if (microphoneStream) return microphoneStream
    try {
      microphoneStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: {
        echoCancellation: true,
        noiseSuppression: true,
      } })
    } catch {
      useToast().add({ title: 'Microphone access denied or not available.', color: 'error' })
      microphoneStream = null
    }
    return microphoneStream
  }

  const init = async () => {
    await Promise.all([getCameraUserMedia(), getMicrophoneUserMedia()])
  }

  return {
    init,
    getCameraUserMedia,
    getMicrophoneUserMedia,
    cameraStream,
    microphoneStream
  }
}
