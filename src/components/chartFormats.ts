import { formatTime, minuteUnit, timeParts } from '../domain/stats'

// RecordChart に わたす、タイム と もんだい数 の 表示のしかた

/** タイム(ミリ秒)の目もりの間隔の候補 */
export const TIME_TICK_STEPS = [1, 2, 5, 10, 15, 20, 30, 60, 120, 300, 600].map((s) => s * 1000)

/** タイムを「2ふん」「15びょう」のように 1行ずつに分ける */
export function timeLabelLines(ms: number): [number, string][] {
  const { minutes, seconds } = timeParts(ms)
  if (minutes === 0) return [[seconds, 'びょう']]
  if (seconds === 0) return [[minutes, minuteUnit(minutes)]]
  return [
    [minutes, minuteUnit(minutes)],
    [seconds, 'びょう'],
  ]
}

export const timeTickLabel = formatTime

/** もんだい数の目もりの間隔の候補 */
export const COUNT_TICK_STEPS = [1, 2, 5, 10, 15, 20, 25, 50, 100]

export const countLabelLines = (n: number): [number, string][] => [[n, 'もん']]

export const countTickLabel = (n: number) => `${n}もん`
