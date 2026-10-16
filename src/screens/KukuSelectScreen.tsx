import { useState } from 'react'
import { KUKU_DANS, KUKU_ORDERS, KUKU_ORDER_LABEL, kukuModeId, type KukuOrder, type ModeId } from '../domain/modes'
import { bestTime, formatTime } from '../domain/stats'
import { useData } from '../storage/useData'
import styles from './KukuSelectScreen.module.css'

/** 段ボタンを おしたときに、もんだいを はじめるか、きろく を見るか */
export type KukuView = 'play' | 'records'

interface Props {
  initialOrder?: KukuOrder
  initialView?: KukuView
  onStart: (mode: ModeId) => void
  onRecords: (mode: ModeId) => void
  onBack: () => void
}

export function KukuSelectScreen({ initialOrder = 'seq', initialView = 'play', onStart, onRecords, onBack }: Props) {
  const { data } = useData()
  const [order, setOrder] = useState<KukuOrder>(initialOrder)
  const [view, setView] = useState<KukuView>(initialView)
  const records = view === 'records'

  return (
    <div className={`screen ${styles.root}`} data-theme="kuku">
      <header className={styles.header}>
        <button type="button" className={`pop-button ${styles.back}`} onClick={onBack}>
          ◀ もどる
        </button>
        <h1 className={styles.title}>{records ? 'どの だん の きろく を みる?' : 'くくの だん を えらんでね'}</h1>
        {/* 段ボタンは おすと すぐ はじまるので、きろく は きりかえ にする */}
        <button
          type="button"
          aria-pressed={records}
          className={`pop-button ${styles.recordsToggle}`}
          data-selected={records}
          onClick={() => setView(records ? 'play' : 'records')}
        >
          📊 きろく
        </button>
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

      <div className={styles.grid} data-view={view}>
        {KUKU_DANS.map((dan) => {
          const mode = kukuModeId(dan, order)
          const best = bestTime(data.records[mode])
          return (
            <button
              key={dan}
              type="button"
              className={`pop-button ${styles.dan}`}
              onClick={() => (records ? onRecords(mode) : onStart(mode))}
            >
              <span className={styles.danNum}>{dan}</span>
              <span className={styles.danLabel}>の だん</span>
              {records ? (
                <span className={styles.danRecords}>📊 みる</span>
              ) : (
                <span className={styles.danBest}>{best === null ? '—' : `👑 ${formatTime(best)}`}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
