/**
 * 効果音は Web Audio API でその場で合成する(音声ファイルは使わない)。
 * iOS では、ユーザーのタップの中で unlockAudio() を呼ぶまで音が鳴らない。
 */

let ctx: AudioContext | null = null
let enabled = true

export function setSoundEnabled(value: boolean) {
  enabled = value
}

function getContext(): AudioContext | null {
  if (ctx) return ctx
  const Ctor =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  ctx = new Ctor()
  return ctx
}

/** タップなどのユーザー操作の中で呼ぶ */
export function unlockAudio() {
  const c = getContext()
  if (!c) return
  if (c.state === 'suspended') void c.resume()
  // iOS 向け: 無音を一度鳴らしておく
  const buffer = c.createBuffer(1, 1, 22050)
  const src = c.createBufferSource()
  src.buffer = buffer
  src.connect(c.destination)
  src.start(0)
}

interface ToneOptions {
  freq: number
  /** 鳴らしはじめるまでの秒数 */
  at?: number
  duration: number
  type?: OscillatorType
  volume?: number
  /** 終わりの周波数(指定するとなめらかに変化する) */
  slideTo?: number
}

function tone({ freq, at = 0, duration, type = 'sine', volume = 0.2, slideTo }: ToneOptions) {
  const c = getContext()
  if (!c || !enabled) return
  if (c.state === 'suspended') void c.resume()
  const t0 = c.currentTime + at
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + duration)
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
  osc.connect(gain).connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + duration + 0.02)
}

// 音の高さ(Hz)
const C5 = 523.25
const E5 = 659.25
const G5 = 783.99
const C6 = 1046.5
const E6 = 1318.51
const G6 = 1567.98
const C7 = 2093.0

/** テンキーを押したときの「ポッ」 */
export function playTap() {
  tone({ freq: 700, slideTo: 380, duration: 0.06, volume: 0.12 })
}

/** 正解の「ピロリン♪」 */
export function playCorrect() {
  tone({ freq: C6, duration: 0.09, type: 'triangle', volume: 0.22 })
  tone({ freq: E6, at: 0.06, duration: 0.09, type: 'triangle', volume: 0.22 })
  tone({ freq: G6, at: 0.12, duration: 0.18, type: 'triangle', volume: 0.22 })
}

/** れんぞく正解の節目 */
export function playCombo() {
  ;[C6, E6, G6, C7].forEach((freq, i) =>
    tone({ freq, at: 0.2 + i * 0.06, duration: 0.14, type: 'square', volume: 0.07 }),
  )
}

/** 不正解の「ブブー」(やさしめ) */
export function playWrong() {
  tone({ freq: 220, slideTo: 160, duration: 0.12, type: 'square', volume: 0.06 })
  tone({ freq: 200, slideTo: 140, at: 0.14, duration: 0.16, type: 'square', volume: 0.06 })
}

/** カウントダウンの「ピッ」 */
export function playCountdown() {
  tone({ freq: 880, duration: 0.12, type: 'sine', volume: 0.2 })
}

/** スタートの「ピーン」 */
export function playStart() {
  tone({ freq: 1760, duration: 0.35, type: 'sine', volume: 0.2 })
}

/** クリアのファンファーレ */
export function playClear() {
  const notes: [number, number, number][] = [
    [C5, 0, 0.12],
    [E5, 0.12, 0.12],
    [G5, 0.24, 0.12],
    [C6, 0.36, 0.5],
  ]
  for (const [freq, at, duration] of notes) {
    tone({ freq, at, duration, type: 'triangle', volume: 0.25 })
    tone({ freq: freq / 2, at, duration, type: 'square', volume: 0.05 })
  }
}

/** じこベスト更新 */
export function playBest() {
  const notes = [G5, C6, E6, G6, C7]
  notes.forEach((freq, i) =>
    tone({ freq, at: i * 0.08, duration: i === notes.length - 1 ? 0.6 : 0.12, type: 'triangle', volume: 0.22 }),
  )
}
