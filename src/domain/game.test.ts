import { describe, expect, it } from 'vitest'
import { createGame, gameReducer, isStreakMilestone, type GameAction, type GameState } from './game'
import type { Problem } from './problems'

const problems: Problem[] = [
  { a: 3, b: 4, op: '+', answer: 7 },
  { a: 9, b: 3, op: '+', answer: 12 },
]

const run = (state: GameState, ...actions: GameAction[]) => actions.reduce(gameReducer, state)
const digits = (s: string): GameAction[] => [...s].map((c) => ({ type: 'digit', digit: Number(c) }))

describe('入力', () => {
  it('数字は 2けた まで', () => {
    const s = run(createGame(problems), ...digits('123'))
    expect(s.input).toBe('12')
  })

  it('「0」のあとの数字は置きかえる', () => {
    const s = run(createGame(problems), ...digits('07'))
    expect(s.input).toBe('7')
  })

  it('けす で 1もじ、ながおし で ぜんぶ けせる', () => {
    let s = run(createGame(problems), ...digits('12'), { type: 'backspace' })
    expect(s.input).toBe('1')
    s = run(s, ...digits('5'), { type: 'clearInput' })
    expect(s.input).toBe('')
  })

  it('空のまま こたえる を押しても何も起きない', () => {
    const s0 = createGame(problems)
    expect(gameReducer(s0, { type: 'submit' })).toBe(s0)
  })
})

describe('判定と進行', () => {
  it('正解すると correct になり、advance で次の問題へ進む', () => {
    let s = run(createGame(problems), ...digits('7'), { type: 'submit' })
    expect(s.phase).toBe('correct')
    expect(s.streak).toBe(1)
    s = gameReducer(s, { type: 'advance' })
    expect(s.index).toBe(1)
    expect(s.input).toBe('')
    expect(s.phase).toBe('playing')
  })

  it('不正解では進まず、retry で同じ問題に答え直す', () => {
    let s = run(createGame(problems), ...digits('8'), { type: 'submit' })
    expect(s.phase).toBe('wrong')
    expect(s.mistakes).toBe(1)
    expect(s.streak).toBe(0)
    // wrong のあいだは advance しても進まない
    s = gameReducer(s, { type: 'advance' })
    expect(s.index).toBe(0)
    s = gameReducer(s, { type: 'retry' })
    expect(s.phase).toBe('playing')
    expect(s.index).toBe(0)
    expect(s.input).toBe('')
  })

  it('エフェクト中(correct / wrong)は入力を受けつけない', () => {
    const correct = run(createGame(problems), ...digits('7'), { type: 'submit' })
    expect(run(correct, ...digits('1'), { type: 'submit' })).toBe(correct)
    const wrong = run(createGame(problems), ...digits('1'), { type: 'submit' })
    expect(run(wrong, ...digits('7'), { type: 'submit' })).toBe(wrong)
  })

  it('不正解で れんぞく がリセットされる', () => {
    const s = run(createGame(problems), ...digits('7'), { type: 'submit' }, { type: 'advance' }, ...digits('1'), {
      type: 'submit',
    })
    expect(s.streak).toBe(0)
  })

  it('最後の問題に正解すると cleared になる', () => {
    const s = run(
      createGame(problems),
      ...digits('7'),
      { type: 'submit' },
      { type: 'advance' },
      ...digits('11'),
      { type: 'submit' },
      { type: 'retry' },
      ...digits('12'),
      { type: 'submit' },
    )
    expect(s.phase).toBe('cleared')
    expect(s.mistakes).toBe(1)
  })
})

describe('チャレンジ', () => {
  it('正解した数を数える', () => {
    const s = run(createGame(problems), ...digits('7'), { type: 'submit' }, { type: 'advance' })
    expect(s.correctCount).toBe(1)
  })

  it('時間ぎれになると、それ以上は入力できない', () => {
    let s = run(createGame(problems), ...digits('1'), { type: 'timeUp' })
    expect(s.phase).toBe('timeup')
    s = run(s, ...digits('7'), { type: 'submit' }, { type: 'advance' })
    expect(s.phase).toBe('timeup')
    expect(s.index).toBe(0)
    expect(s.correctCount).toBe(0)
  })
})

describe('isStreakMilestone', () => {
  it('3, 5, 10, 15 … が節目', () => {
    const hits = Array.from({ length: 21 }, (_, i) => i).filter(isStreakMilestone)
    expect(hits).toEqual([3, 5, 10, 15, 20])
  })
})
