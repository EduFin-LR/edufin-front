let ctx: AudioContext | null = null

function getCtx() {
    if (!ctx) ctx = new AudioContext()
    return ctx
}

// ── Volume / mute persisted in localStorage ───────────────────────────────────
const VOL_KEY  = 'edufin_volume'
const MUTE_KEY = 'edufin_muted'

export function getVolume(): number {
    const v = parseFloat(localStorage.getItem(VOL_KEY) ?? '1')
    return isNaN(v) ? 1 : Math.min(1, Math.max(0, v))
}

export function setVolume(v: number) {
    localStorage.setItem(VOL_KEY, String(Math.min(1, Math.max(0, v))))
}

export function getMuted(): boolean {
    return localStorage.getItem(MUTE_KEY) === 'true'
}

export function setMuted(m: boolean) {
    localStorage.setItem(MUTE_KEY, String(m))
}

// ── Core ──────────────────────────────────────────────────────────────────────
function playTone(frequency: number, duration: number, type: OscillatorType, gain: number) {
    if (getMuted()) return
    const vol = getVolume()
    if (vol === 0) return

    const ac  = getCtx()
    const osc = ac.createOscillator()
    const g   = ac.createGain()
    osc.connect(g)
    g.connect(ac.destination)
    osc.type = type
    osc.frequency.setValueAtTime(frequency, ac.currentTime)
    g.gain.setValueAtTime(gain * vol, ac.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration)
    osc.start(ac.currentTime)
    osc.stop(ac.currentTime + duration)
}

// ── Sounds ────────────────────────────────────────────────────────────────────
export function playNav() {
    playTone(440, 0.06, 'sine', 0.08)
    setTimeout(() => playTone(520, 0.07, 'sine', 0.06), 40)
}

export function playHover() {
    playTone(600, 0.05, 'sine', 0.04)
}

export function playSelect() {
    playTone(880, 0.08, 'sine', 0.18)
    setTimeout(() => playTone(1100, 0.1, 'sine', 0.12), 60)
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
    playTone(523, 0.1, 'sine', 0.4)
    setTimeout(() => playTone(659, 0.1, 'sine', 0.4), 100)
    setTimeout(() => playTone(784, 0.1, 'sine', 0.4), 200)
    setTimeout(() => playTone(1047, 0.4, 'sine', 0.5), 300)
}
