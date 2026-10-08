import type { ModeId } from './modes'

/** チャレンジ(1ぷんで なんもん とけるか)ができるモード */
export type ChallengeModeId = 'add1' | 'sub1' | 'add2' | 'sub2' | 'kuku-master'

export const CHALLENGE_MODES: readonly ChallengeModeId[] = ['add1', 'sub1', 'add2', 'sub2', 'kuku-master']

export function isChallengeMode(mode: ModeId): mode is ChallengeModeId {
  return (CHALLENGE_MODES as readonly string[]).includes(mode)
}

/** 制限時間 */
export const CHALLENGE_TIME_MS = 60_000
/** 1回のチャレンジで用意しておく問題の数(1ぷんでは とききれない数) */
export const CHALLENGE_PROBLEM_COUNT = 300

export interface ChallengeRecord {
  /** 正解した問題の数 */
  correct: number
  /** まちがいの回数 */
  mistakes: number
  /** ISO 8601 日時 */
  playedAt: string
}

// ---------- ひょうか(はやさ の ランク) ----------

export interface Rank {
  id: 'kame' | 'usagi' | 'cheetah' | 'ninja' | 'shinkansen' | 'rocket'
  name: string
  icon: string
}

export const RANKS: readonly Rank[] = [
  { id: 'kame', name: 'かめ', icon: '🐢' },
  { id: 'usagi', name: 'うさぎ', icon: '🐇' },
  { id: 'cheetah', name: 'ちーたー', icon: '🐆' },
  { id: 'ninja', name: 'にんじゃ', icon: '🥷' },
  { id: 'shinkansen', name: 'しんかんせん', icon: '🚄' },
  { id: 'rocket', name: 'ろけっと', icon: '🚀' },
]

/**
 * 各ランクになるのに必要な正解数(RANKS と同じ順)。
 * くりあがり・くりさがり のある問題はむずかしいので、少ない数でランクが上がるようにする。
 */
const THRESHOLDS: Record<ChallengeModeId, readonly number[]> = {
  add1: [0, 10, 15, 20, 25, 30],
  sub1: [0, 10, 15, 20, 25, 30],
  add2: [0, 8, 12, 16, 20, 25],
  sub2: [0, 8, 12, 16, 20, 25],
  'kuku-master': [0, 10, 15, 20, 25, 30],
}

export function rankThresholds(mode: ChallengeModeId): readonly number[] {
  return THRESHOLDS[mode]
}

export interface RankResult {
  index: number
  rank: Rank
  /** つぎのランクと、あと何問でなれるか(いちばん上なら null) */
  next: { rank: Rank; need: number } | null
}

export function rankFor(mode: ChallengeModeId, correct: number): RankResult {
  const th = THRESHOLDS[mode]
  let index = 0
  for (let i = 0; i < th.length; i++) if (correct >= th[i]) index = i
  const next = index < RANKS.length - 1 ? { rank: RANKS[index + 1], need: th[index + 1] - correct } : null
  return { index, rank: RANKS[index], next }
}

// ---------- 記録の集計 ----------

export interface ChallengeSummary {
  latest: ChallengeRecord
  playCount: number
  isFirst: boolean
  /** 前の記録をすべて上回った(2回目以降のみ) */
  isNewBest: boolean
  bestCorrect: number
  /** 前回より何問多いか(負なら少ない) */
  moreThanPrevious: number | null
  /** 1回目より何問多いか */
  moreThanFirst: number | null
  /** 今回より前の最高ランク(はじめてなら null) */
  previousBestRankIndex: number | null
}

/** records は古い順。最後の要素を今回の記録として扱う */
export function summarizeChallenge(mode: ChallengeModeId, records: readonly ChallengeRecord[]): ChallengeSummary {
  if (records.length === 0) throw new Error('records must not be empty')
  const latest = records[records.length - 1]
  const previous = records.slice(0, -1)
  const isFirst = previous.length === 0
  const previousBest = isFirst ? -1 : Math.max(...previous.map((r) => r.correct))
  return {
    latest,
    playCount: records.length,
    isFirst,
    isNewBest: !isFirst && latest.correct > previousBest,
    bestCorrect: Math.max(latest.correct, previousBest),
    moreThanPrevious: isFirst ? null : latest.correct - previous[previous.length - 1].correct,
    moreThanFirst: isFirst ? null : latest.correct - records[0].correct,
    previousBestRankIndex: isFirst ? null : rankFor(mode, previousBest).index,
  }
}

export function bestCorrect(records: readonly ChallengeRecord[] | undefined): number | null {
  if (!records || records.length === 0) return null
  return Math.max(...records.map((r) => r.correct))
}
