import { describe, expect, it } from 'vitest'
import { bestTime, formatClock, formatTime, starCount, summarize, type PlayRecord } from './stats'

const rec = (timeMs: number, mistakes = 0): PlayRecord => ({
  timeMs,
  mistakes,
  playedAt: '2026-10-08T00:00:00.000Z',
})

describe('summarize', () => {
  it('はじめての記録', () => {
    const s = summarize([rec(30000)])
    expect(s.isFirst).toBe(true)
    expect(s.isNewBest).toBe(false)
    expect(s.fasterThanPreviousMs).toBeNull()
    expect(s.playCount).toBe(1)
  })

  it('じこベスト更新と、前回・初回との差', () => {
    const s = summarize([rec(40000), rec(30000), rec(25000)])
    expect(s.isNewBest).toBe(true)
    expect(s.bestTimeMs).toBe(25000)
    expect(s.fasterThanPreviousMs).toBe(5000)
    expect(s.fasterThanFirstMs).toBe(15000)
  })

  it('前回より遅いときはベスト更新にならない', () => {
    const s = summarize([rec(20000), rec(25000)])
    expect(s.isNewBest).toBe(false)
    expect(s.bestTimeMs).toBe(20000)
    expect(s.fasterThanPreviousMs).toBe(-5000)
  })

  it('ベストと同じタイムは更新にしない', () => {
    expect(summarize([rec(20000), rec(20000)]).isNewBest).toBe(false)
  })
})

describe('表示用の関数', () => {
  it('formatTime', () => {
    expect(formatTime(5432)).toBe('5.4びょう')
    expect(formatTime(45000)).toBe('45.0びょう')
    expect(formatTime(83456)).toBe('1ぷん 23.4びょう')
    expect(formatTime(120000)).toBe('2ぷん 0.0びょう')
  })

  it('formatClock', () => {
    expect(formatClock(0)).toBe('0:00')
    expect(formatClock(42900)).toBe('0:42')
    expect(formatClock(83000)).toBe('1:23')
  })

  it('starCount', () => {
    expect(starCount(0)).toBe(3)
    expect(starCount(1)).toBe(2)
    expect(starCount(3)).toBe(2)
    expect(starCount(4)).toBe(1)
  })

  it('bestTime', () => {
    expect(bestTime(undefined)).toBeNull()
    expect(bestTime([rec(3000), rec(2000), rec(2500)])).toBe(2000)
  })
})
