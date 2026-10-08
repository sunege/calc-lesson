import { useState } from 'react'
import { playTick, playTimeUp } from '../audio/sound'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Mascot } from '../components/Mascot'
import { NumPad } from '../components/NumPad'
import { ProblemBoard } from '../components/ProblemBoard'
import { CHALLENGE_PROBLEM_COUNT, CHALLENGE_TIME_MS, type ChallengeModeId } from '../domain/challenge'
import type { GameState } from '../domain/game'
import { getModeInfo } from '../domain/modes'
import { generateEndlessProblems } from '../domain/problems'
import { formatClock } from '../domain/stats'
import { useCountdown } from '../hooks/useCountdown'
import { usePlaySession } from '../hooks/usePlaySession'
import layout from './PlayScreen.module.css'
import styles from './ChallengePlayScreen.module.css'

/** 時間ぎれから結果画面に進むまでの時間 */
const TIMEUP_DELAY_MS = 1800

/** のこり時間による あせりの段階 */
type Level = 'normal' | 'warn' | 'danger' | 'panic'

function levelOf(secondsLeft: number): Level {
  if (secondsLeft <= 5) return 'panic'
  if (secondsLeft <= 10) return 'danger'
  if (secondsLeft <= 20) return 'warn'
  return 'normal'
}

interface Props {
  mode: ChallengeModeId
  onFinish: (result: { correct: number; mistakes: number }) => void
  onQuit: () => void
}

/** チャレンジ: 1ぷんで なんもん とけるか */
export function ChallengePlayScreen({ mode, onFinish, onQuit }: Props) {
  const info = getModeInfo(mode)
  const [confirmQuit, setConfirmQuit] = useState(false)

  const finish = (next: GameState) => {
    playTimeUp()
    session.later(() => onFinish({ correct: next.correctCount, mistakes: next.mistakes }), TIMEUP_DELAY_MS)
  }

  const session = usePlaySession(() => generateEndlessProblems(mode, CHALLENGE_PROBLEM_COUNT), {
    keyboardEnabled: !confirmQuit,
    // 用意した問題を ぜんぶ といてしまったら、そこで おわりにする
    onCleared: finish,
  })
  const { state, dispatch } = session
  const over = state.phase === 'timeup' || state.phase === 'cleared'

  const { remainingMs } = useCountdown(CHALLENGE_TIME_MS, state.phase === 'playing', {
    onExpire: () => {
      const { prev, next } = dispatch({ type: 'timeUp' })
      if (next !== prev) finish(next)
    },
    onSecond: (sec) => {
      if (sec === 30) session.showPopup('あと 30びょう!', 'combo')
      if (sec === 10) session.showPopup('あと 10びょう! いそげ!', 'wrong')
      if (sec > 0 && sec <= 10) playTick(sec <= 3)
    },
  })

  const secondsLeft = Math.ceil(remainingMs / 1000)
  const level = over ? 'normal' : levelOf(secondsLeft)
  const fraction = remainingMs / CHALLENGE_TIME_MS

  return (
    <div className={`screen ${layout.root}`} data-theme={info.theme}>
      {/* 画面のふちを赤く点めつさせる */}
      <div className={styles.vignette} data-level={level} aria-hidden="true" />

      <header className={layout.header}>
        <button type="button" className={`pop-button ${layout.quit}`} onClick={() => setConfirmQuit(true)}>
          やめる
        </button>
        <div className={layout.title}>
          {info.title} <span className={styles.badge}>チャレンジ</span>
        </div>
        <div className={`${layout.clock} ${styles.clock}`} data-level={level} aria-label="のこり じかん">
          ⏳ <span key={level === 'normal' ? 0 : secondsLeft}>{formatClock(remainingMs + 999)}</span>
        </div>
        <div className={layout.count}>
          ✅ <span className={layout.countNow}>{state.correctCount}</span> もん
        </div>
      </header>

      <div className={`${layout.track} ${styles.timeTrack}`} data-level={level} aria-hidden="true">
        <div className={`${layout.trackFill} ${styles.timeFill}`} style={{ width: `${fraction * 100}%` }} />
        <div className={layout.trackRunner} style={{ left: `${fraction * 100}%` }}>
          <Mascot
            mood={level === 'panic' || level === 'danger' ? 'sad' : session.mood}
            size={56}
            className={`${layout.runnerMascot} ${level === 'panic' ? styles.shiver : ''}`}
          />
        </div>
        <div className={layout.goal}>⏰</div>
      </div>

      <main className={layout.main}>
        <ProblemBoard
          state={state}
          popups={session.popups}
          onPopupDone={session.removePopup}
          backdrop={
            level === 'panic' && secondsLeft > 0 ? (
              <span key={secondsLeft} className={styles.bigCount}>
                {secondsLeft}
              </span>
            ) : null
          }
        />
        <section className={layout.padArea}>
          <NumPad
            disabled={state.phase !== 'playing'}
            canSubmit={state.input !== ''}
            onDigit={(digit) => dispatch({ type: 'digit', digit })}
            onBackspace={() => dispatch({ type: 'backspace' })}
            onClearAll={() => dispatch({ type: 'clearInput' })}
            onSubmit={session.submit}
          />
        </section>
      </main>

      {over && (
        <div className={layout.clearOverlay}>
          <div className={styles.timeUpText}>タイムアップ!</div>
          <div className={styles.timeUpCount}>
            <strong>{state.correctCount}</strong>もん せいかい!
          </div>
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
