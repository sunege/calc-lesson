import { KUKU_DANS, parseKukuMode, type ModeId } from './modes'

export type Operator = '+' | '-' | '×'

export interface Problem {
  a: number
  b: number
  op: Operator
  answer: number
}

/** 0 以上 1 未満を返す乱数。テストで差し替えられるように引数で受け取る */
export type Rng = () => number

export const KUKU_MASTER_COUNT = 20

const add = (a: number, b: number): Problem => ({ a, b, op: '+', answer: a + b })
const sub = (a: number, b: number): Problem => ({ a, b, op: '-', answer: a - b })
const mul = (a: number, b: number): Problem => ({ a, b, op: '×', answer: a * b })

const range = (from: number, to: number): number[] => Array.from({ length: to - from + 1 }, (_, i) => from + i)

export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** たしざん ①: 1 ≤ a、0 ≤ b、a + b ≤ 10(0 + x は出さない) */
function add1Pool(): Problem[] {
  return range(1, 10).flatMap((a) => range(0, 10 - a).map((b) => add(a, b)))
}

/** ひきざん ①: 1 ≤ b ≤ a ≤ 10(0 を引く式・答えが負の式は出さない) */
function sub1Pool(): Problem[] {
  return range(1, 10).flatMap((a) => range(1, a).map((b) => sub(a, b)))
}

/** たしざん ②: 一桁どうしで和が 11 以上 */
function add2Pool(): Problem[] {
  return range(1, 9).flatMap((a) =>
    range(1, 9)
      .filter((b) => a + b >= 11)
      .map((b) => add(a, b)),
  )
}

/** ひきざん ②: 11〜18 から 2〜9 を引き、くりさがりがあるもの */
function sub2Pool(): Problem[] {
  return range(11, 18).flatMap((a) =>
    range(2, 9)
      .filter((b) => a % 10 < b)
      .map((b) => sub(a, b)),
  )
}

function kukuDanPool(dan: number): Problem[] {
  return range(1, 9).map((b) => mul(dan, b))
}

/** モードで出しうる問題をすべて、決まった順番で返す */
export function problemPool(mode: ModeId): Problem[] {
  switch (mode) {
    case 'add1':
      return add1Pool()
    case 'sub1':
      return sub1Pool()
    case 'add2':
      return add2Pool()
    case 'sub2':
      return sub2Pool()
    case 'kuku-master':
      return KUKU_DANS.flatMap(kukuDanPool)
  }
  const kuku = parseKukuMode(mode)
  if (!kuku) throw new Error(`unknown mode: ${mode}`)
  return kukuDanPool(kuku.dan)
}

/** 1 回のプレイで出す問題を、出す順に並べて返す */
export function generateProblems(mode: ModeId, rng: Rng = Math.random): Problem[] {
  const pool = problemPool(mode)
  if (mode === 'kuku-master') return shuffle(pool, rng).slice(0, KUKU_MASTER_COUNT)
  if (parseKukuMode(mode)?.order === 'seq') return pool
  return shuffle(pool, rng)
}

/**
 * チャレンジ用に、問題を count 問ならべる。
 * 全問を重複なくシャッフルして出し、出しおえたら また シャッフルして つづける。
 * つなぎ目で同じ問題が2回つづかないようにする。
 */
export function generateEndlessProblems(mode: ModeId, count: number, rng: Rng = Math.random): Problem[] {
  const pool = problemPool(mode)
  const out: Problem[] = []
  while (out.length < count) {
    const cycle = shuffle(pool, rng)
    const last = out[out.length - 1]
    if (last && cycle.length > 1 && problemKey(cycle[0]) === problemKey(last)) {
      ;[cycle[0], cycle[1]] = [cycle[1], cycle[0]]
    }
    out.push(...cycle)
  }
  return out.slice(0, count)
}

export function problemKey(p: Problem): string {
  return `${p.a}${p.op}${p.b}`
}
