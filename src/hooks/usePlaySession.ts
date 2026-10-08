import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { playCombo, playCorrect, playWrong } from '../audio/sound'
import type { MascotMood } from '../components/Mascot'
import type { Popup } from '../components/ProblemBoard'
import { createGame, gameReducer, isStreakMilestone, type GameAction, type GameState } from '../domain/game'
import type { Problem } from '../domain/problems'
import { fireCombo, fireCorrect } from '../effects/confetti'

/** 正解・不正解のあと、テンキーを止める時間(この時間はタイムに入れない) */
export const LOCK_MS = 300

const PRAISES = ['せいかい!', 'すごい!', 'やったね!', 'ばっちり!', 'いいね!', 'かんぺき!']

interface Options {
  /** パソコンのキーボードで答えられるようにするか(ダイアログを出しているあいだは false) */
  keyboardEnabled: boolean
  /** 最後の問題に正解したとき */
  onCleared?: (next: GameState) => void
}

/**
 * 1回のプレイの進行(入力・判定・正解/不正解の演出)をまとめたもの。
 * れんしゅう と チャレンジ の両方で使う。
 */
export function usePlaySession(createProblems: () => Problem[], { keyboardEnabled, onCleared }: Options) {
  const [state, setState] = useState(() => createGame(createProblems()))
  // 判定はこの ref の最新の状態で行う(すばやい連続入力でも、表示と判定がずれないようにする)
  const latest = useRef(state)
  const [popups, setPopups] = useState<Popup[]>([])
  const [mood, setMood] = useState<MascotMood>('normal')
  const popupId = useRef(0)
  const moodTimer = useRef<number | null>(null)
  const timers = useRef<number[]>([])

  useEffect(() => {
    const pending = timers.current
    return () => {
      pending.forEach((t) => window.clearTimeout(t))
      if (moodTimer.current !== null) window.clearTimeout(moodTimer.current)
    }
  }, [])

  /** 状態を進めて、変わる前と後を返す */
  const dispatch = (action: GameAction) => {
    const prev = latest.current
    const next = gameReducer(prev, action)
    if (next !== prev) {
      latest.current = next
      setState(next)
    }
    return { prev, next }
  }
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }
  const showPopup = (text: string, kind: Popup['kind']) => {
    const id = ++popupId.current
    setPopups((ps) => [...ps, { id, text, kind }])
  }
  const removePopup = (id: number) => setPopups((ps) => ps.filter((x) => x.id !== id))
  const showMood = (m: MascotMood, ms: number) => {
    setMood(m)
    if (moodTimer.current !== null) window.clearTimeout(moodTimer.current)
    moodTimer.current = window.setTimeout(() => setMood('normal'), ms)
  }
  const unlockAfter = (action: 'advance' | 'retry') => later(() => dispatch({ type: action }), LOCK_MS)

  /** 判定して、正解・不正解の演出を出す */
  const submit = () => {
    const { prev, next } = dispatch({ type: 'submit' })
    if (next === prev) return

    if (next.phase === 'correct') {
      playCorrect()
      fireCorrect(1 + Math.min(3, Math.floor(next.streak / 5)))
      showMood('happy', 900)
      if (isStreakMilestone(next.streak)) {
        playCombo()
        fireCombo()
        showPopup(`🔥 ${next.streak}れんぞく!`, 'combo')
      } else {
        showPopup(PRAISES[Math.floor(Math.random() * PRAISES.length)], 'praise')
      }
      unlockAfter('advance')
    } else if (next.phase === 'wrong') {
      playWrong()
      showMood('sad', 900)
      showPopup('おしい! もういちど!', 'wrong')
      unlockAfter('retry')
    } else if (next.phase === 'cleared') {
      setMood('happy')
      onCleared?.(next)
    }
  }

  // パソコンのキーボードでも答えられるようにする
  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (/^[0-9]$/.test(e.key)) dispatch({ type: 'digit', digit: Number(e.key) })
    else if (e.key === 'Backspace') dispatch({ type: 'backspace' })
    else if (e.key === 'Escape') dispatch({ type: 'clearInput' })
    else if (e.key === 'Enter') submit()
    else return
    e.preventDefault()
  })
  useEffect(() => {
    if (!keyboardEnabled) return
    const handler = (e: KeyboardEvent) => onKey(e)
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [keyboardEnabled])

  return { state, dispatch, submit, popups, removePopup, showPopup, mood, setMood, showMood, later }
}
