import { describe, expect, it } from 'vitest'
import { KUKU_DANS, kukuModeId } from './modes'
import { KUKU_MASTER_COUNT, generateProblems, problemKey, problemPool, shuffle, type Problem } from './problems'

const keys = (ps: Problem[]) => ps.map(problemKey)
const hasNoDuplicates = (ps: Problem[]) => new Set(keys(ps)).size === ps.length

/** 再現できる乱数(テスト用) */
function seededRng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1103515245 + 12345) % 2 ** 31
    return s / 2 ** 31
  }
}

describe('たしざん ① (add1)', () => {
  const ps = generateProblems('add1')

  it('55問で重複がない', () => {
    expect(ps).toHaveLength(55)
    expect(hasNoDuplicates(ps)).toBe(true)
  })

  it('すべて 1 ≤ a、0 ≤ b、a + b ≤ 10 で答えが正しい', () => {
    for (const p of ps) {
      expect(p.op).toBe('+')
      expect(p.a).toBeGreaterThanOrEqual(1)
      expect(p.b).toBeGreaterThanOrEqual(0)
      expect(p.a + p.b).toBeLessThanOrEqual(10)
      expect(p.answer).toBe(p.a + p.b)
    }
  })

  it('0 + x を含まず、x + 0 と入れかえた式の両方を含む', () => {
    const k = keys(ps)
    expect(k.some((s) => s.startsWith('0+'))).toBe(false)
    expect(k).toContain('10+0')
    expect(k).toContain('2+3')
    expect(k).toContain('3+2')
  })
})

describe('ひきざん ① (sub1)', () => {
  const ps = generateProblems('sub1')

  it('55問で重複がない', () => {
    expect(ps).toHaveLength(55)
    expect(hasNoDuplicates(ps)).toBe(true)
  })

  it('すべて 1 ≤ b ≤ a ≤ 10 で、答えが負にならない', () => {
    for (const p of ps) {
      expect(p.op).toBe('-')
      expect(p.b).toBeGreaterThanOrEqual(1)
      expect(p.b).toBeLessThanOrEqual(p.a)
      expect(p.a).toBeLessThanOrEqual(10)
      expect(p.answer).toBe(p.a - p.b)
      expect(p.answer).toBeGreaterThanOrEqual(0)
    }
  })

  it('0 を引く式を含まず、10 − 10 を含む', () => {
    const k = keys(ps)
    expect(k.some((s) => s.endsWith('-0'))).toBe(false)
    expect(k).toContain('10-10')
  })
})

describe('たしざん ② (add2)', () => {
  const ps = generateProblems('add2')

  it('36問で重複がない', () => {
    expect(ps).toHaveLength(36)
    expect(hasNoDuplicates(ps)).toBe(true)
  })

  it('すべて一桁どうしで和が 11 以上', () => {
    for (const p of ps) {
      expect(p.a).toBeGreaterThanOrEqual(1)
      expect(p.a).toBeLessThanOrEqual(9)
      expect(p.b).toBeGreaterThanOrEqual(1)
      expect(p.b).toBeLessThanOrEqual(9)
      expect(p.answer).toBe(p.a + p.b)
      expect(p.answer).toBeGreaterThanOrEqual(11)
    }
    expect(keys(ps)).toEqual(expect.arrayContaining(['2+9', '9+2']))
  })
})

describe('ひきざん ② (sub2)', () => {
  const ps = generateProblems('sub2')

  it('36問で重複がない', () => {
    expect(ps).toHaveLength(36)
    expect(hasNoDuplicates(ps)).toBe(true)
  })

  it('すべて 11〜18 から 2〜9 を引いて くりさがる', () => {
    for (const p of ps) {
      expect(p.a).toBeGreaterThanOrEqual(11)
      expect(p.a).toBeLessThanOrEqual(18)
      expect(p.b).toBeGreaterThanOrEqual(2)
      expect(p.b).toBeLessThanOrEqual(9)
      expect(p.a % 10).toBeLessThan(p.b)
      expect(p.answer).toBe(p.a - p.b)
      expect(p.answer).toBeGreaterThanOrEqual(2)
      expect(p.answer).toBeLessThanOrEqual(9)
    }
  })
})

describe('九九', () => {
  it.each(KUKU_DANS)('%iのだん じゅんばん は n×1〜n×9 の順', (dan) => {
    const ps = generateProblems(kukuModeId(dan, 'seq'))
    expect(ps.map((p) => p.b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    for (const p of ps) {
      expect(p.a).toBe(dan)
      expect(p.answer).toBe(dan * p.b)
    }
  })

  it.each(KUKU_DANS)('%iのだん ばらばら は同じ 9問を含む', (dan) => {
    const ps = generateProblems(kukuModeId(dan, 'rand'))
    expect(keys(ps).sort()).toEqual(keys(problemPool(kukuModeId(dan, 'seq'))).sort())
  })

  it('くく マスター は 2〜9のだん から重複なしで 20問', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const ps = generateProblems('kuku-master', seededRng(seed))
      expect(ps).toHaveLength(KUKU_MASTER_COUNT)
      expect(hasNoDuplicates(ps)).toBe(true)
      for (const p of ps) {
        expect(p.a).toBeGreaterThanOrEqual(2)
        expect(p.a).toBeLessThanOrEqual(9)
        expect(p.b).toBeGreaterThanOrEqual(1)
        expect(p.b).toBeLessThanOrEqual(9)
        expect(p.answer).toBe(p.a * p.b)
      }
    }
    expect(problemPool('kuku-master')).toHaveLength(72)
  })
})

describe('shuffle', () => {
  it('要素を失わず、元の配列を変えない', () => {
    const src = [1, 2, 3, 4, 5, 6, 7, 8]
    const out = shuffle(src, seededRng(42))
    expect(out.sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect(src).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('ランダムなモードは毎回同じ順番にならない', () => {
    const a = keys(generateProblems('add1', seededRng(1)))
    const b = keys(generateProblems('add1', seededRng(2)))
    expect(a).not.toEqual(b)
  })
})
