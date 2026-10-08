export interface PlayRecord {
  /** クリアタイム(ミリ秒) */
  timeMs: number
  /** まちがいの回数 */
  mistakes: number
  /** ISO 8601 日時 */
  playedAt: string
}

export interface ResultSummary {
  latest: PlayRecord
  /** 何回目のプレイか(1 から) */
  playCount: number
  isFirst: boolean
  /** 前の記録をすべて上回った(2 回目以降のみ) */
  isNewBest: boolean
  bestTimeMs: number
  /** 前回との差。正なら速くなった */
  fasterThanPreviousMs: number | null
  /** 1 回目との差。正なら速くなった */
  fasterThanFirstMs: number | null
}

/** records は古い順。最後の要素を今回の記録として扱う */
export function summarize(records: readonly PlayRecord[]): ResultSummary {
  if (records.length === 0) throw new Error('records must not be empty')
  const latest = records[records.length - 1]
  const previous = records.slice(0, -1)
  const isFirst = previous.length === 0
  const previousBest = isFirst ? Infinity : Math.min(...previous.map((r) => r.timeMs))
  return {
    latest,
    playCount: records.length,
    isFirst,
    isNewBest: !isFirst && latest.timeMs < previousBest,
    bestTimeMs: Math.min(latest.timeMs, previousBest),
    fasterThanPreviousMs: isFirst ? null : previous[previous.length - 1].timeMs - latest.timeMs,
    fasterThanFirstMs: isFirst ? null : records[0].timeMs - latest.timeMs,
  }
}

export function bestTime(records: readonly PlayRecord[] | undefined): number | null {
  if (!records || records.length === 0) return null
  return Math.min(...records.map((r) => r.timeMs))
}

/** まちがいの回数から ほし の数(1〜3)を決める */
export function starCount(mistakes: number): 1 | 2 | 3 {
  if (mistakes === 0) return 3
  if (mistakes <= 3) return 2
  return 1
}

/** 0.1 秒単位に切り捨てた秒数 */
function toTenths(ms: number): number {
  return Math.floor(Math.max(0, ms) / 100)
}

/** 「23.4びょう」「1ぷん 5.0びょう」の形にする */
export function formatTime(ms: number): string {
  const tenths = toTenths(ms)
  const minutes = Math.floor(tenths / 600)
  const seconds = ((tenths % 600) / 10).toFixed(1)
  return minutes > 0 ? `${minutes}ぷん ${seconds}びょう` : `${seconds}びょう`
}

/** 問題画面のストップウォッチ表示用(「0:42」の形) */
export function formatClock(ms: number): string {
  const totalSeconds = Math.floor(Math.max(0, ms) / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

/** 差分の表示用(「2.3びょう」) */
export function formatDiff(ms: number): string {
  return formatTime(Math.abs(ms))
}
