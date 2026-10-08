// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LOCK_MS, PlayScreen } from './PlayScreen'

vi.mock('../effects/confetti', () => ({
  fireCorrect: vi.fn(),
  fireCombo: vi.fn(),
  fireClear: vi.fn(),
  fireBest: vi.fn(),
}))

const press = (key: string) => window.dispatchEvent(new KeyboardEvent('keydown', { key }))
const phase = (container: HTMLElement) => container.querySelector<HTMLElement>('[data-phase]')?.dataset.phase
const cardText = (container: HTMLElement) => container.querySelector('[data-phase]')?.textContent

/** 数字と「こたえる」を、画面が更新される前に一気に入力する */
function burst(answer: number) {
  act(() => {
    for (const c of String(answer)) press(c)
    press('Enter')
  })
}

describe('PlayScreen', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('すばやく入力しても、全問正解で最後まで進む', () => {
    const onFinish = vi.fn()
    const { container } = render(<PlayScreen mode="kuku-2-seq" onFinish={onFinish} onQuit={() => {}} />)

    for (let b = 1; b <= 9; b++) {
      expect(cardText(container)).toBe(`2×${b}=`)
      burst(2 * b)
      act(() => vi.advanceTimersByTime(LOCK_MS))
    }
    expect(phase(container)).toBe('cleared')
    act(() => vi.advanceTimersByTime(2000))
    expect(onFinish).toHaveBeenCalledWith(expect.objectContaining({ mistakes: 0 }))
  })

  it('まちがえたら同じ問題のまま、少しあとで答え直せる', () => {
    const { container } = render(<PlayScreen mode="kuku-2-seq" onFinish={() => {}} onQuit={() => {}} />)

    burst(5)
    expect(phase(container)).toBe('wrong')
    // エフェクト中の入力は受けつけない
    burst(2)
    expect(phase(container)).toBe('wrong')

    act(() => vi.advanceTimersByTime(LOCK_MS))
    expect(phase(container)).toBe('playing')
    expect(cardText(container)).toBe('2×1=')

    burst(2)
    expect(phase(container)).toBe('correct')
  })
})
