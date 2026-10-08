import { useState } from 'react'
import { KUKU_DANS, KUKU_ORDERS, KUKU_ORDER_LABEL, kukuModeId, type KukuOrder, type ModeId } from '../domain/modes'
import { bestTime, formatTime } from '../domain/stats'
import { useData } from '../storage/useData'
import styles from './KukuSelectScreen.module.css'

interface Props {
  initialOrder?: KukuOrder
  onStart: (mode: ModeId) => void
  onBack: () => void
}

export function KukuSelectScreen({ initialOrder = 'seq', onStart, onBack }: Props) {
  const { data } = useData()
  const [order, setOrder] = useState<KukuOrder>(initialOrder)

  return (
    <div className={`screen ${styles.root}`} data-theme="kuku">
      <header className={styles.header}>
        <button type="button" className={`pop-button ${styles.back}`} onClick={onBack}>
          ◀ もどる
        </button>
        <h1 className={styles.title}>くくの だん を えらんでね</h1>
      </header>

      <div className={styles.orders} role="radiogroup" aria-label="でる じゅんばん">
        {KUKU_ORDERS.map((o) => (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={order === o}
            className={`pop-button ${styles.order}`}
            data-selected={order === o}
            onClick={() => setOrder(o)}
          >
            {o === 'seq' ? '➡️' : '🔀'} {KUKU_ORDER_LABEL[o]}
          </button>
        ))}
      </div>

      <div className={styles.grid}>
        {KUKU_DANS.map((dan) => {
          const mode = kukuModeId(dan, order)
          const best = bestTime(data.records[mode])
          return (
            <button key={dan} type="button" className={`pop-button ${styles.dan}`} onClick={() => onStart(mode)}>
              <span className={styles.danNum}>{dan}</span>
              <span className={styles.danLabel}>の だん</span>
              <span className={styles.danBest}>{best === null ? '—' : `👑 ${formatTime(best)}`}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
