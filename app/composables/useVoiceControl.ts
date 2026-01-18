import { ref } from 'vue'

const frequency = ref(0)
const note = ref('')
const octave = ref(0)
const noteIndex = ref(-1) // 0 for Do (C), 1 for Re (D), etc.
const isListening = ref(false)
const error = ref<string | null>(null)
const volume = ref(0)

export const useVoiceControl = () => {
  // Threshold to detect signal (scaled to approx match previous 0-255 range)
  const VOLUME_THRESHOLD = 15

  let audioContext: AudioContext | null = null
  let analyser: AnalyserNode | null = null
  let buffer: Float32Array | null = null
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
  }

  const autoCorrelate = (buf: Float32Array, sampleRate: number) => {
    // Implements the ACF2+ algorithm
    let SIZE = buf.length
    let rms = 0

    for (let i = 0; i < SIZE; i++) {
      const val = buf[i]
      rms += val! * val!
    }
    rms = Math.sqrt(rms / SIZE)

    // Normalize RMS to a readable volume range (0-100+) for UI/Logic compatibility
    volume.value = rms * 1000

    if (volume.value < VOLUME_THRESHOLD) // Not enough signal
      return -1
    const thres = 0.2
    let r1 = 0, r2 = SIZE - 1
    for (let i = 0; i < SIZE / 2; i++) {
      if (Math.abs(buf[i]!) < thres) {
        r1 = i
        break
      }
    }
    for (let i = 1; i < SIZE / 2; i++) {
      if (Math.abs(buf[SIZE - i]!) < thres) {
        r2 = SIZE - i
        break
      }
    }

    buf = buf.slice(r1, r2)
    SIZE = buf.length

    const c = new Array(SIZE).fill(0)
    for (let i = 0; i < SIZE; i++) {
      for (let j = 0; j < SIZE - i; j++) {
        c[i] = c[i] + buf[j]! * buf[j + i]!
      }
    }

    let d = 0
    while (c[d] > c[d + 1]) {
      d++
    }
    let maxval = -1, maxpos = -1
    for (let i = d; i < SIZE; i++) {
      if (c[i] > maxval) {
        maxval = c[i]
        maxpos = i
      }
    }
    let T0 = maxpos

    const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1]
    const a = (x1 + x3 - 2 * x2) / 2
    const b = (x3 - x1) / 2
    if (a) {
      T0 = T0 - b / (2 * a)
    }

    return sampleRate / T0
  }

  const loop = () => {
    if (!isListening.value || !analyser || !buffer || !audioContext) return

    // Get raw time domain data (waveform)
    analyser.getFloatTimeDomainData(buffer as Float32Array<ArrayBuffer>)

    const ac = autoCorrelate(buffer, audioContext.sampleRate)

    if (ac > -1) {
      frequency.value = ac
      analyzePitch(ac)
    } else {
      // If volume low or indeterminate pitch, reset
      frequency.value = 0
      note.value = ''
      noteIndex.value = -1
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
