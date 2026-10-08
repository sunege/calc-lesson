import { describe, expect, it } from 'vitest'
import { RANKS, isChallengeMode, rankFor, rankThresholds, summarizeChallenge, type ChallengeRecord } from './challenge'

const rec = (correct: number, mistakes = 0): ChallengeRecord => ({
  correct,
  mistakes,
  playedAt: '2026-10-08T00:00:00.000Z',
})

describe('ランク', () => {
  it('ランクは かめ → ろけっと の 6だんかい', () => {
    expect(RANKS.map((r) => r.name)).toEqual(['かめ', 'うさぎ', 'ちーたー', 'にんじゃ', 'しんかんせん', 'ろけっと'])
  })

  it('正解数に応じてランクが決まる', () => {
    expect(rankFor('add1', 0).rank.name).toBe('かめ')
    expect(rankFor('add1', 9).rank.name).toBe('かめ')
    expect(rankFor('add1', 10).rank.name).toBe('うさぎ')
    expect(rankFor('add1', 29).rank.name).toBe('しんかんせん')
    expect(rankFor('add1', 30).rank.name).toBe('ろけっと')
    expect(rankFor('add1', 99).rank.name).toBe('ろけっと')
  })

  it('むずかしいモードは少ない数でランクが上がる', () => {
    expect(rankFor('add2', 8).rank.name).toBe('うさぎ')
    expect(rankFor('sub2', 25).rank.name).toBe('ろけっと')
  })

  it('つぎのランクまで あと何問か', () => {
    expect(rankFor('add1', 12).next).toEqual({ rank: RANKS[2], need: 3 })
    expect(rankFor('add1', 30).next).toBeNull()
  })

  it('しきい値は ふえていく順', () => {
    for (const mode of ['add1', 'sub1', 'add2', 'sub2', 'kuku-master'] as const) {
      const th = rankThresholds(mode)
      expect(th).toHaveLength(RANKS.length)
      for (let i = 1; i < th.length; i++) expect(th[i]).toBeGreaterThan(th[i - 1])
    }
  })

  it('チャレンジできるモード', () => {
    expect(isChallengeMode('add1')).toBe(true)
    expect(isChallengeMode('kuku-master')).toBe(true)
    expect(isChallengeMode('kuku-3-seq')).toBe(false)
  })
})

describe('summarizeChallenge', () => {
  it('はじめての記録', () => {
    const s = summarizeChallenge('add1', [rec(12)])
    expect(s.isFirst).toBe(true)
    expect(s.isNewBest).toBe(false)
    expect(s.moreThanPrevious).toBeNull()
    expect(s.previousBestRankIndex).toBeNull()
  })

  it('じこベスト更新と、前回・初回との差、前の最高ランク', () => {
    const s = summarizeChallenge('add1', [rec(8), rec(14), rec(11), rec(16)])
    expect(s.isNewBest).toBe(true)
    expect(s.bestCorrect).toBe(16)
    expect(s.moreThanPrevious).toBe(5)
    expect(s.moreThanFirst).toBe(8)
    expect(s.previousBestRankIndex).toBe(1)
  })

  it('同じ数はベスト更新にしない', () => {
    expect(summarizeChallenge('add1', [rec(10), rec(10)]).isNewBest).toBe(false)
  })
})
