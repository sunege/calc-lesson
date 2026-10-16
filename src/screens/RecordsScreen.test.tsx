// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RecordsScreen } from './RecordsScreen'

const at = '2026-10-16T00:00:00.000Z'
const noop = () => {}

describe('RecordsScreen', () => {
  // jsdom には matchMedia がないので、ひろい画面として あつかう
  beforeEach(() => {
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: noop, removeEventListener: noop }))
  })
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('きろく が ないときは、そのことを つたえて「○○ する」で はじめられる', () => {
    const onPlay = vi.fn()
    render(<RecordsScreen kind="practice" mode="add1" records={[]} onPlay={onPlay} onBack={noop} />)

    expect(screen.getByText('まだ きろく が ないよ')).toBeTruthy()
    expect(screen.queryByRole('img', { name: 'これまでの タイム の グラフ' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'れんしゅう する' }))
    expect(onPlay).toHaveBeenCalledOnce()
  })

  it('れんしゅう: じこベスト・このまえ・かいすう と グラフを出す', () => {
    const records = [
      { timeMs: 95_000, mistakes: 2, playedAt: at },
      { timeMs: 80_000, mistakes: 0, playedAt: at },
      { timeMs: 88_000, mistakes: 1, playedAt: at },
    ]
    const { container } = render(
      <RecordsScreen kind="practice" mode="add1" records={records} onPlay={noop} onBack={noop} />,
    )

    const text = container.textContent ?? ''
    expect(text).toContain('👑 じこベスト1ぷん20びょう')
    expect(text).toContain('このまえ1ぷん28びょう')
    expect(text).toContain('3かい')
    expect(text).toContain('さいしょ より 15びょう はやく なったよ!')
    expect(screen.getByRole('img', { name: 'これまでの タイム の グラフ' })).toBeTruthy()
    // 結果画面の「こんかい」ではなく「このまえ」
    expect(container.querySelector('svg')?.textContent).toContain('このまえ')
    expect(container.querySelector('svg')?.textContent).not.toContain('こんかい')
  })

  it('チャレンジ: いちばん いい ランク と、つぎのランクまでの かず を出す', () => {
    const records = [
      { correct: 12, mistakes: 1, playedAt: at },
      { correct: 21, mistakes: 0, playedAt: at },
      { correct: 18, mistakes: 3, playedAt: at },
    ]
    const { container } = render(
      <RecordsScreen kind="challenge" mode="add1" records={records} onPlay={noop} onBack={noop} />,
    )

    const text = container.textContent ?? ''
    expect(text).toContain('にんじゃ')
    expect(text).toContain('👑 じこベスト21もん')
    expect(text).toContain('このまえ18もん')
    expect(text).toContain('あと 4もん で 🚄 しんかんせん!')
    expect(text).toContain('さいしょ より 9もん おおく とけるように なったよ!')
    expect(container.querySelector('[data-state="current"]')?.textContent).toContain('にんじゃ')
  })

  it('九九の段は、見出しに じゅんばん・ばらばら を出す', () => {
    render(<RecordsScreen kind="practice" mode="kuku-4-rand" records={[]} onPlay={noop} onBack={noop} />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('📊 きろく4の だん ばらばら')
  })

  it('「もどる」で もどれる', () => {
    const onBack = vi.fn()
    render(<RecordsScreen kind="challenge" mode="sub2" records={[]} onPlay={noop} onBack={onBack} />)
    fireEvent.click(screen.getByRole('button', { name: '◀ もどる' }))
    expect(onBack).toHaveBeenCalledOnce()
  })
})
