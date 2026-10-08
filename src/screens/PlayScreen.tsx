import { useState } from 'react'
import { playClear } from '../audio/sound'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Mascot } from '../components/Mascot'
import { NumPad } from '../components/NumPad'
import { ProblemBoard } from '../components/ProblemBoard'
import { getModeInfo, type ModeId } from '../domain/modes'
import { generateProblems } from '../domain/problems'
import { formatClock } from '../domain/stats'
import { fireClear } from '../effects/confetti'
import { usePlaySession } from '../hooks/usePlaySession'
import { useStopwatch } from '../hooks/useStopwatch'
import styles from './PlayScreen.module.css'

export { LOCK_MS } from '../hooks/usePlaySession'

/** クリアしてから結果画面に進むまでの時間 */
const CLEAR_DELAY_MS = 1600

interface Props {
  mode: ModeId
  onFinish: (result: { timeMs: number; mistakes: number }) => void
  onQuit: () => void
}

/** れんしゅう: 全問をといて、クリアタイムを はかる */
export function PlayScreen({ mode, onFinish, onQuit }: Props) {
  const info = getModeInfo(mode)
  const [confirmQuit, setConfirmQuit] = useState(false)
  const session = usePlaySession(() => generateProblems(mode), {
    keyboardEnabled: !confirmQuit,
    onCleared: (next) => {
      const timeMs = elapsed()
      playClear()
      fireClear()
      session.later(() => onFinish({ timeMs, mistakes: next.mistakes }), CLEAR_DELAY_MS)
    },
  })
  const { state, dispatch } = session
  const { elapsed, display } = useStopwatch(state.phase === 'playing')

  const total = state.problems.length
  const progress = state.correctCount / total

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
          <Mascot mood={session.mood} size={56} className={styles.runnerMascot} />
        </div>
        <div className={styles.goal}>🏁</div>
      </div>

      <main className={styles.main}>
        <ProblemBoard state={state} popups={session.popups} onPopupDone={session.removePopup} />
        <section className={styles.padArea}>
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
