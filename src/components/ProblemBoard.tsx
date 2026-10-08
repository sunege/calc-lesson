import type { ReactNode } from 'react'
import type { GameState } from '../domain/game'
import { currentProblem } from '../domain/game'
import type { Operator } from '../domain/problems'
import styles from './ProblemBoard.module.css'

export interface Popup {
  id: number
  text: string
  kind: 'praise' | 'combo' | 'wrong'
}

const OP_LABEL: Record<Operator, string> = { '+': '+', '-': '−', '×': '×' }
const OP_CLASS: Record<Operator, string> = { '+': styles.plus, '-': styles.minus, '×': styles.times }

interface Props {
  state: GameState
  popups: readonly Popup[]
  onPopupDone: (id: number) => void
  /** もんだいの うしろに出す かざり */
  backdrop?: ReactNode
}

/** もんだいカードと、その上に出す ほめことば */
export function ProblemBoard({ state, popups, onPopupDone, backdrop }: Props) {
  const problem = currentProblem(state)
  return (
    <section className={styles.problemArea}>
      {backdrop && (
        <div className={styles.backdrop} aria-hidden="true">
          {backdrop}
        </div>
      )}

      <div className={styles.popups} aria-live="polite">
        {popups.map((p) => (
          <div key={p.id} className={`${styles.popup} ${styles[p.kind]}`} onAnimationEnd={() => onPopupDone(p.id)}>
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
  )
}
