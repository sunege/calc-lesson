import { describe, expect, it } from 'vitest'
import {
  bestTime,
  formatClock,
  formatFaster,
  formatTime,
  minuteUnit,
  starCount,
  summarize,
  type PlayRecord,
} from './stats'

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
  it('formatTime は 1 秒単位に四捨五入して「ふん」「びょう」で表す', () => {
    expect(formatTime(5432)).toBe('5びょう')
    expect(formatTime(45000)).toBe('45びょう')
    expect(formatTime(59600)).toBe('1ぷん')
    expect(formatTime(134500)).toBe('2ふん15びょう')
    expect(formatTime(134400)).toBe('2ふん14びょう')
    expect(formatTime(120000)).toBe('2ふん')
  })

  it('formatFaster は表示中のタイムどうしの差にする', () => {
    expect(formatFaster(30000, 25000)).toBe('5びょう')
    expect(formatFaster(10400, 9600)).toBe('すこし')
    expect(formatFaster(134500, 60000)).toBe('1ぷん15びょう')
  })

  it('minuteUnit は教科書の読み方にあわせて「ぷん」と「ふん」を使い分ける', () => {
    const units = Array.from({ length: 21 }, (_, i) => i + 1).map((m) => `${m}${minuteUnit(m)}`)
    expect(units).toEqual([
      '1ぷん',
      '2ふん',
      '3ぷん',
      '4ふん',
      '5ふん',
      '6ぷん',
      '7ふん',
      '8ぷん',
      '9ふん',
      '10ぷん',
      '11ぷん',
      '12ふん',
      '13ぷん',
      '14ふん',
      '15ふん',
      '16ぷん',
      '17ふん',
      '18ぷん',
      '19ふん',
      '20ぷん',
      '21ぷん',
    ])
    expect(formatTime(3 * 60000 + 5000)).toBe('3ぷん5びょう')
    expect(formatTime(10 * 60000)).toBe('10ぷん')
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
