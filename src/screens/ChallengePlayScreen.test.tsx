// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CHALLENGE_TIME_MS } from '../domain/challenge'
import { LOCK_MS } from '../hooks/usePlaySession'
import { ChallengePlayScreen } from './ChallengePlayScreen'

vi.mock('../effects/confetti', () => ({
  fireCorrect: vi.fn(),
  fireCombo: vi.fn(),
  fireClear: vi.fn(),
  fireBest: vi.fn(),
}))

const press = (key: string) => window.dispatchEvent(new KeyboardEvent('keydown', { key }))
const card = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-phase]')!

/** 画面の問題を読んで、こたえを返す */
function answerOf(c: HTMLElement): number {
  const [left] = card(c).textContent!.split('=')
  const m = /^(\d+)([+−×])(\d+)$/.exec(left)!
  const a = Number(m[1])
  const b = Number(m[3])
  return m[2] === '+' ? a + b : m[2] === '−' ? a - b : a * b
}

function answer(value: number) {
  act(() => {
    for (const ch of String(value)) press(ch)
    press('Enter')
  })
}

describe('ChallengePlayScreen', () => {
  beforeEach(() =>
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date', 'performance'] }),
  )
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('1ぷんで おわり、正解した数と まちがいの数を返す', () => {
    const onFinish = vi.fn()
    const { container } = render(<ChallengePlayScreen mode="add1" onFinish={onFinish} onQuit={() => {}} />)

    // 1秒ごとに 1問 正解する(正解のあとの 0.3秒は 時間に入れない)
    for (let i = 0; i < 5; i++) {
      act(() => vi.advanceTimersByTime(1000))
      answer(answerOf(container))
      expect(card(container).dataset.phase).toBe('correct')
      act(() => vi.advanceTimersByTime(LOCK_MS))
    }
    // 1回 まちがえる
    answer(answerOf(container) + 1)
    act(() => vi.advanceTimersByTime(LOCK_MS))

    // のこりは 60 - 5 = 55びょう。その直前では まだ おわらない
    act(() => vi.advanceTimersByTime(CHALLENGE_TIME_MS - 5000 - 200))
    expect(card(container).dataset.phase).toBe('playing')

    act(() => vi.advanceTimersByTime(400))
    expect(card(container).dataset.phase).toBe('timeup')
    expect(container.textContent).toContain('タイムアップ!')

    // 時間ぎれのあとは 入力できない
    answer(answerOf(container))
    expect(card(container).dataset.phase).toBe('timeup')

    act(() => vi.advanceTimersByTime(2000))
    expect(onFinish).toHaveBeenCalledWith({ correct: 5, mistakes: 1 })
  })

  it('のこり 10びょう を きると あせる演出が出る', () => {
    const { container } = render(<ChallengePlayScreen mode="kuku-master" onFinish={() => {}} onQuit={() => {}} />)
    const level = () => container.querySelector<HTMLElement>('[aria-label="のこり じかん"]')!.dataset.level

    expect(level()).toBe('normal')
    act(() => vi.advanceTimersByTime(41_000))
    expect(level()).toBe('warn')
    act(() => vi.advanceTimersByTime(10_000))
    expect(level()).toBe('danger')
    act(() => vi.advanceTimersByTime(5_000))
    expect(level()).toBe('panic')
    expect(container.textContent).toContain('あと 10びょう! いそげ!')
  })
})
