import type { Problem } from './problems'

/**
 * playing: こたえを入力できる
 * correct: 正解した直後(次の問題に切り替わるまでの短い間)
 * wrong:   不正解の直後(入力欄が空になるまでの短い間)
 * cleared: 最後の問題に正解した
 * timeup:  チャレンジで時間ぎれになった
 */
export type GamePhase = 'playing' | 'correct' | 'wrong' | 'cleared' | 'timeup'

export interface GameState {
  problems: Problem[]
  index: number
  input: string
  phase: GamePhase
  mistakes: number
  streak: number
  /** 正解した問題の数 */
  correctCount: number
}

export type GameAction =
  | { type: 'digit'; digit: number }
  | { type: 'backspace' }
  | { type: 'clearInput' }
  | { type: 'submit' }
  /** correct → 次の問題へ */
  | { type: 'advance' }
  /** wrong → 同じ問題に答え直す */
  | { type: 'retry' }
  /** チャレンジの時間ぎれ */
  | { type: 'timeUp' }

export const MAX_INPUT_DIGITS = 2

export function createGame(problems: Problem[]): GameState {
  if (problems.length === 0) throw new Error('problems must not be empty')
  return { problems, index: 0, input: '', phase: 'playing', mistakes: 0, streak: 0, correctCount: 0 }
}

export function currentProblem(state: GameState): Problem {
  return state.problems[state.index]
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'digit': {
      if (state.phase !== 'playing') return state
      // 「0」のあとに数字を押したら置きかえる(「07」のような入力にしない)
      const base = state.input === '0' ? '' : state.input
      if (base.length >= MAX_INPUT_DIGITS) return state
      return { ...state, input: base + String(action.digit) }
    }
    case 'backspace':
      if (state.phase !== 'playing' || state.input === '') return state
      return { ...state, input: state.input.slice(0, -1) }
    case 'clearInput':
      if (state.phase !== 'playing' || state.input === '') return state
      return { ...state, input: '' }
    case 'submit': {
      if (state.phase !== 'playing' || state.input === '') return state
      const correct = Number(state.input) === currentProblem(state).answer
      if (!correct) {
        return { ...state, phase: 'wrong', mistakes: state.mistakes + 1, streak: 0 }
      }
      const isLast = state.index === state.problems.length - 1
      return {
        ...state,
        phase: isLast ? 'cleared' : 'correct',
        streak: state.streak + 1,
        correctCount: state.correctCount + 1,
      }
    }
    case 'advance':
      if (state.phase !== 'correct') return state
      return { ...state, index: state.index + 1, input: '', phase: 'playing' }
    case 'retry':
      if (state.phase !== 'wrong') return state
      return { ...state, input: '', phase: 'playing' }
    case 'timeUp':
      if (state.phase === 'cleared' || state.phase === 'timeup') return state
      return { ...state, phase: 'timeup' }
  }
}

/** れんぞく正解の演出を出す節目(3, 5, 10, 15, 20, …) */
export function isStreakMilestone(streak: number): boolean {
  return streak === 3 || (streak >= 5 && streak % 5 === 0)
}
