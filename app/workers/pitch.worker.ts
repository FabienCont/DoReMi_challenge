self.onmessage = (e: MessageEvent) => {
  // Implements the ACF2+ algorithm
  const { buffer, sampleRate } = e.data
  const buf: Float32Array = buffer

  // --- Start of autoCorrelate Logic ---
  let SIZE = buf.length
  let rms = 0

  for (let i = 0; i < SIZE; i++) {
    const val = buf[i]
    rms += val! * val!
  }
  rms = Math.sqrt(rms / SIZE)

  // Normalize RMS to a readable volume range (0-100+) for UI/Logic compatibility
  const volumeValue = rms * 1000

  // Threshold check
  if (volumeValue < 10) {
    self.postMessage({ frequency: -1, volume: volumeValue })
    return
  }

  // Trimming
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

  const bufSlice = buf.slice(r1, r2)
  SIZE = bufSlice.length

  const c = new Array(SIZE).fill(0)
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE - i; j++) {
      c[i] = c[i] + bufSlice[j]! * bufSlice[j + i]!
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

  const resultFreq = sampleRate / T0
  // --- End of Logic ---

  self.postMessage({ frequency: resultFreq, volume: volumeValue })
}
