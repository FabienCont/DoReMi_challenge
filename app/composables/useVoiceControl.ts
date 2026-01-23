import { ref } from 'vue'
import PitchWorker from '@/workers/pitch.worker?worker'

const frequency = shallowRef(0)
const note = shallowRef('')
const octave = shallowRef(0)
const noteIndex = shallowRef(-1) // 0 for Do (C), 1 for Re (D), etc.
const isListening = ref(false)
const error = ref<string | null>(null)
const volume = shallowRef(0)

export const useVoiceControl = () => {
  let audioContext: AudioContext | null = null
  let analyser: AnalyserNode | null = null
  let buffer: Float32Array | null = null
  let pitchWorker: Worker | null = null
  let isWorkerProcessing = false
  const BUFLEN = 2048

  const NOTES = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si']

  const start = async () => {
    const microphoneStream = await useMediaDevices().getMicrophoneUserMedia()

    if (isListening.value || !microphoneStream) return

    try {
      audioContext = new (window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)()
      const source = audioContext.createMediaStreamSource(microphoneStream)
      analyser = audioContext.createAnalyser()
      analyser.fftSize = 2048

      // Create filters to isolate voice frequencies
      const lowPassFilter = audioContext.createBiquadFilter()
      lowPassFilter.type = 'lowpass'
      lowPassFilter.frequency.value = 1200 // Cutoff high frequency noise

      const highPassFilter = audioContext.createBiquadFilter()
      highPassFilter.type = 'highpass'
      highPassFilter.frequency.value = 85 // Cutoff low frequency rumble

      // Connect chain: Source -> HighPass -> LowPass -> Analyser
      source.connect(highPassFilter)
      highPassFilter.connect(lowPassFilter)
      lowPassFilter.connect(analyser)

      buffer = new Float32Array(BUFLEN)

      startWorker()
      isListening.value = true
      loop()
    } catch {
      useToast().add({ title: 'Error initializing audio', color: 'error' })
    }
  }

  const stop = async () => {
    isListening.value = false
    const { microphoneStream } = useMediaDevices()
    if (microphoneStream) {
      microphoneStream.getTracks().forEach(track => track.stop())
    }
    if (audioContext) {
      audioContext.close()
    }
    stopWorker()
  }

  const startWorker = () => {
    pitchWorker = new PitchWorker()

    pitchWorker.onmessage = (e) => {
      isWorkerProcessing = false // Worker is done, ready for next
      const { frequency: ac, volume: vol } = e.data

      volume.value = vol

      if (ac > -1) {
        frequency.value = ac
        analyzePitch(ac)
      } else {
        frequency.value = 0
        note.value = ''
        noteIndex.value = -1
      }
    }

    buffer = new Float32Array(BUFLEN)
  }

  const stopWorker = () => {
    if (pitchWorker) {
      pitchWorker.terminate()
      pitchWorker = null
    }
  }

  const loop = () => {
    if (!isListening.value || !analyser || !buffer || !audioContext) return

    // Get raw time domain data (waveform)
    analyser.getFloatTimeDomainData(buffer as Float32Array<ArrayBuffer>)

    if (pitchWorker && !isWorkerProcessing) {
      isWorkerProcessing = true
      // We must slice (copy) the buffer because passing the original buffer
      // creates race conditions or requires transferring ownership (which empties the original)
      const bufferToSend = buffer.slice()
      pitchWorker.postMessage(
        { buffer: bufferToSend, sampleRate: audioContext.sampleRate },
        [bufferToSend.buffer] // Transferable for performance
      )
    }

    if (isListening.value) {
      requestAnimationFrame(loop)
    }
  }

  const analyzePitch = (f: number) => {
    // MIDI = 69 + 12 * log2(f / 440)
    const midiNum = 69 + 12 * Math.log2(f / 440)
    const roundedMidi = Math.round(midiNum)

    if (Number.isNaN(roundedMidi) || roundedMidi < 0) return

    const noteName = NOTES[roundedMidi % 12]
    octave.value = Math.floor(roundedMidi / 12) - 1

    note.value = `${noteName}${octave.value}`

    let idx = -1
    switch (noteName) {
      case 'Do': {
        idx = 0
        break
      }
      case 'Re': {
        idx = 1
        break
      }
      case 'Mi': {
        idx = 2
        break
      }
      case 'Fa': {
        idx = 3
        break
      }
      case 'Sol': {
        idx = 4
        break
      }
      case 'La': {
        idx = 5
        break
      }
      case 'Si': {
        idx = 6
        break
      }
    }
    noteIndex.value = idx
  }

  return {
    start,
    stop,
    frequency,
    note,
    noteIndex,
    octave,
    isListening,
    error,
    volume
  }
}
