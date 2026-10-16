// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DataProvider } from '../storage/DataContext'
import { KukuSelectScreen, type KukuView } from './KukuSelectScreen'

function setup(initialView?: KukuView) {
  const onStart = vi.fn()
  const onRecords = vi.fn()
  render(
    <DataProvider>
      <KukuSelectScreen initialView={initialView} onStart={onStart} onRecords={onRecords} onBack={() => {}} />
    </DataProvider>,
  )
  const dan = (n: number) =>
    screen.getAllByRole('button').find((b) => b.querySelector('span')?.textContent === String(n))!
  return { onStart, onRecords, dan }
}

describe('KukuSelectScreen', () => {
  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  it('ふだんは 段ボタンで すぐ はじまる', () => {
    const { onStart, onRecords, dan } = setup()
    fireEvent.click(dan(3))
    expect(onStart).toHaveBeenCalledWith('kuku-3-seq')
    expect(onRecords).not.toHaveBeenCalled()
  })

  it('「きろく」に きりかえると、段ボタンで その段の きろく を見る', () => {
    const { onStart, onRecords, dan } = setup()
    const toggle = screen.getByRole('button', { name: '📊 きろく' })
    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('heading').textContent).toBe('どの だん の きろく を みる?')

    fireEvent.click(screen.getByRole('radio', { name: '🔀 ばらばら' }))
    fireEvent.click(dan(7))
    expect(onRecords).toHaveBeenCalledWith('kuku-7-rand')
    expect(onStart).not.toHaveBeenCalled()

    // もういちど おすと もとに もどる
    fireEvent.click(toggle)
    fireEvent.click(dan(7))
    expect(onStart).toHaveBeenCalledWith('kuku-7-rand')
  })

  it('きろく画面から もどったときは、きろく の きりかえ を したまま', () => {
    const { onRecords, dan } = setup('records')
    fireEvent.click(dan(2))
    expect(onRecords).toHaveBeenCalledWith('kuku-2-seq')
  })
})
