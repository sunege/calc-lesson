import confetti from 'canvas-confetti'

const COLORS = ['#ff5a5f', '#ffb400', '#3ec300', '#00a6ed', '#8f5cff', '#ff7ac6']

const base: confetti.Options = {
  colors: COLORS,
  disableForReducedMotion: true,
  zIndex: 50,
  ticks: 120,
}

/** 正解: 画面の下の両はしから紙ふぶき。level が上がるほど派手にする */
export function fireCorrect(level = 1) {
  const particleCount = 18 + level * 14
  const spread = 50 + level * 10
  void confetti({ ...base, particleCount, spread, angle: 60, startVelocity: 45, origin: { x: 0, y: 0.95 } })
  void confetti({ ...base, particleCount, spread, angle: 120, startVelocity: 45, origin: { x: 1, y: 0.95 } })
}

/** れんぞく正解の節目: 上から星をふらせる */
export function fireCombo() {
  void confetti({
    ...base,
    particleCount: 60,
    spread: 160,
    startVelocity: 30,
    gravity: 0.8,
    shapes: ['star'],
    scalar: 1.4,
    origin: { x: 0.5, y: 0 },
  })
}

/** クリア: 花火のように何回も打ち上げる */
export function fireClear(durationMs = 2200) {
  const end = Date.now() + durationMs
  const frame = () => {
    void confetti({ ...base, particleCount: 6, angle: 60, spread: 70, origin: { x: 0, y: 0.8 } })
    void confetti({ ...base, particleCount: 6, angle: 120, spread: 70, origin: { x: 1, y: 0.8 } })
    if (Date.now() < end) requestAnimationFrame(frame)
  }
  frame()
  ;[0.25, 0.5, 0.75].forEach((x, i) =>
    setTimeout(
      () =>
        void confetti({
          ...base,
          particleCount: 90,
          spread: 360,
          startVelocity: 35,
          ticks: 160,
          origin: { x, y: 0.35 },
        }),
      i * 350,
    ),
  )
}

/** じこベスト更新: 金色の紙ふぶきを追加 */
export function fireBest() {
  void confetti({
    ...base,
    colors: ['#ffd700', '#ffec80', '#ffb400'],
    particleCount: 160,
    spread: 120,
    startVelocity: 55,
    shapes: ['star', 'circle'],
    scalar: 1.2,
    origin: { x: 0.5, y: 0.6 },
  })
}
