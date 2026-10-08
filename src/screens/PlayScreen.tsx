import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { playClear, playCombo, playCorrect, playWrong } from '../audio/sound'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Mascot, type MascotMood } from '../components/Mascot'
import { NumPad } from '../components/NumPad'
import { createGame, currentProblem, gameReducer, isStreakMilestone, type GameAction } from '../domain/game'
import { getModeInfo, type ModeId } from '../domain/modes'
import { generateProblems, type Operator } from '../domain/problems'
import { formatClock } from '../domain/stats'
import { fireClear, fireCombo, fireCorrect } from '../effects/confetti'
import { useStopwatch } from '../hooks/useStopwatch'
import styles from './PlayScreen.module.css'

/** 正解・不正解のあと、テンキーを止める時間(この時間はタイムに入れない) */
export const LOCK_MS = 300
/** クリアしてから結果画面に進むまでの時間 */
const CLEAR_DELAY_MS = 1600

const PRAISES = ['せいかい!', 'すごい!', 'やったね!', 'ばっちり!', 'いいね!', 'かんぺき!']

const OP_LABEL: Record<Operator, string> = { '+': '+', '-': '−', '×': '×' }
const OP_CLASS: Record<Operator, string> = { '+': styles.plus, '-': styles.minus, '×': styles.times }

interface Popup {
  id: number
  text: string
  kind: 'praise' | 'combo' | 'wrong'
}

interface Props {
  mode: ModeId
  onFinish: (result: { timeMs: number; mistakes: number }) => void
  onQuit: () => void
}

export function PlayScreen({ mode, onFinish, onQuit }: Props) {
  const info = getModeInfo(mode)
  const [state, setState] = useState(() => createGame(generateProblems(mode)))
  // 判定はこの ref の最新の状態で行う(すばやい連続入力でも、表示と判定がずれないようにする)
  const latest = useRef(state)
  const [confirmQuit, setConfirmQuit] = useState(false)
  const [popups, setPopups] = useState<Popup[]>([])
  const [mood, setMood] = useState<MascotMood>('normal')
  const { elapsed, display } = useStopwatch(state.phase === 'playing')
  const popupId = useRef(0)
  const moodTimer = useRef<number | null>(null)
  const timers = useRef<number[]>([])

  const problem = currentProblem(state)
  const total = state.problems.length
  const solved = state.index + (state.phase === 'correct' || state.phase === 'cleared' ? 1 : 0)

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
  const showMood = (m: MascotMood, ms: number) => {
    setMood(m)
    if (moodTimer.current !== null) window.clearTimeout(moodTimer.current)
    moodTimer.current = window.setTimeout(() => setMood('normal'), ms)
  }
  const unlockAfter = (action: 'advance' | 'retry') => later(() => dispatch({ type: action }), LOCK_MS)

  /** 判定して、正解・不正解・クリアの演出を出す */
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
      const timeMs = elapsed()
      playClear()
      fireClear()
      setMood('happy')
      later(() => onFinish({ timeMs, mistakes: next.mistakes }), CLEAR_DELAY_MS)
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
    if (confirmQuit) return
    const handler = (e: KeyboardEvent) => onKey(e)
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [confirmQuit])

  const progress = solved / total

  return (
    <div className={`screen ${styles.root}`} data-theme={info.theme}>
      <header className={styles.header}>
        <button type="button" className={`pop-button ${styles.quit}`} onClick={() => setConfirmQuit(true)}>
          やめる
        </button>
        <div className={styles.title}>{info.title}</div>
        <div className={styles.clock} aria-label="タイム">
          ⏱ {formatClock(display)}
        </div>
        <div className={styles.count}>
          <span className={styles.countNow}>{Math.min(state.index + 1, total)}</span> / {total} もん
        </div>
      </header>

      <div className={styles.track} aria-hidden="true">
        <div className={styles.trackFill} style={{ width: `${progress * 100}%` }} />
        <div className={styles.trackRunner} style={{ left: `${progress * 100}%` }}>
          <Mascot mood={mood} size={56} className={styles.runnerMascot} />
        </div>
        <div className={styles.goal}>🏁</div>
      </div>

      <main className={styles.main}>
        <section className={styles.problemArea}>
          <div className={styles.popups} aria-live="polite">
            {popups.map((p) => (
              <div
                key={p.id}
                className={`${styles.popup} ${styles[p.kind]}`}
                onAnimationEnd={() => setPopups((ps) => ps.filter((x) => x.id !== p.id))}
              >
                {p.text}
              </div>
            ))}
          </div>

          <div
            key={state.index}
            className={styles.card}
            data-phase={state.phase}
            aria-label={`${problem.a} ${OP_LABEL[problem.op]} ${problem.b} は?`}
          >
            <span className={styles.num}>{problem.a}</span>
            <span className={`${styles.op} ${OP_CLASS[problem.op]}`}>{OP_LABEL[problem.op]}</span>
            <span className={styles.num}>{problem.b}</span>
            <span className={styles.op}>=</span>
            <span className={styles.answer} data-digits={Math.max(1, state.input.length)}>
              {state.input}
              {state.phase === 'playing' && <span className={styles.caret} />}
              {state.phase === 'wrong' && <span className={styles.cross}>✕</span>}
            </span>
          </div>
        </section>

        <section className={styles.padArea}>
          <NumPad
            disabled={state.phase !== 'playing'}
            canSubmit={state.input !== ''}
            onDigit={(digit) => dispatch({ type: 'digit', digit })}
            onBackspace={() => dispatch({ type: 'backspace' })}
            onClearAll={() => dispatch({ type: 'clearInput' })}
            onSubmit={submit}
          />
        </section>
      </main>

      {state.phase === 'cleared' && (
        <div className={styles.clearOverlay}>
          <Mascot mood="happy" size={160} />
          <div className={styles.clearText}>クリア!</div>
        </div>
      )}

      {confirmQuit && (
        <ConfirmDialog
          message={
            <>
              やめても いい?
              <br />
              <small>きろくは のこらないよ</small>
            </>
          }
          yesLabel="やめる"
          noLabel="つづける"
          onYes={onQuit}
          onNo={() => setConfirmQuit(false)}
        />
      )}
    </div>
  )
}
