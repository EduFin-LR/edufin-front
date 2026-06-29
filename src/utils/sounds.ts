let ctx: AudioContext | null = null

function getCtx() {
    if (!ctx) ctx = new AudioContext()
    return ctx
}

function playTone(frequency: number, duration: number, type: OscillatorType, gain: number) {
    const ac  = getCtx()
    const osc = ac.createOscillator()
    const vol = ac.createGain()
    osc.connect(vol)
    vol.connect(ac.destination)
    osc.type      = type
    osc.frequency.setValueAtTime(frequency, ac.currentTime)
    vol.gain.setValueAtTime(gain, ac.currentTime)
    vol.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration)
    osc.start(ac.currentTime)
    osc.stop(ac.currentTime + duration)
}

export function playCorrect() {
    playTone(523, 0.12, 'sine', 0.4)
    setTimeout(() => playTone(659, 0.12, 'sine', 0.4), 100)
    setTimeout(() => playTone(784, 0.22, 'sine', 0.4), 200)
}

export function playWrong() {
    playTone(300, 0.15, 'square', 0.25)
    setTimeout(() => playTone(220, 0.3, 'square', 0.2), 130)
}

export function playComplete() {
    // fanfarria ascendente
    playTone(523, 0.1, 'sine', 0.4)
    setTimeout(() => playTone(659, 0.1, 'sine', 0.4), 100)
    setTimeout(() => playTone(784, 0.1, 'sine', 0.4), 200)
    setTimeout(() => playTone(1047, 0.4, 'sine', 0.5), 300)
}
