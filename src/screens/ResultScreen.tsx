import { useEffect, useRef } from 'react'
import { playBest } from '../audio/sound'
import { Mascot } from '../components/Mascot'
import { TimeChart } from '../components/TimeChart'
import { getModeInfo, type ModeId } from '../domain/modes'
import { formatDiff, formatTime, starCount, summarize, type PlayRecord, type ResultSummary } from '../domain/stats'
import { fireBest, fireCorrect } from '../effects/confetti'
import styles from './ResultScreen.module.css'

interface Props {
  mode: ModeId
  /** このモードの記録(古い順、最後が今回) */
  records: readonly PlayRecord[]
  onRetry: () => void
  onBack: () => void
}

function messages(s: ResultSummary): string[] {
  if (s.isFirst) return ['はじめての きろく だよ!', 'つぎは もっと はやく なるかな?']
  const lines: string[] = []
  const prev = s.fasterThanPreviousMs ?? 0
  if (s.isNewBest) lines.push('👑 じこベスト こうしん!')
  if (prev > 0) lines.push(`まえより ${formatDiff(prev)} はやく なったよ!`)
  else if (!s.isNewBest) lines.push('おしい! つぎは もっと はやく なるよ!')
  return lines
}

export function ResultScreen({ mode, records, onRetry, onBack }: Props) {
  const info = getModeInfo(mode)
  const summary = summarize(records)
  const stars = starCount(summary.latest.mistakes)
  const fromFirst = summary.fasterThanFirstMs
  const celebrated = useRef(false)

  useEffect(() => {
    if (celebrated.current) return
    celebrated.current = true
    if (summary.isNewBest) {
      playBest()
      fireBest()
    } else {
      fireCorrect(2)
    }
  }, [summary.isNewBest])

  return (
    <div className={`screen ${styles.root}`} data-theme={info.theme}>
      {summary.isNewBest && (
        <div className={styles.crownDrop} aria-hidden="true">
          👑
        </div>
      )}

      <header className={styles.header}>
        <Mascot mood="happy" size={88} className={styles.mascot} />
        <h1 className={styles.title}>
          クリア! <span className={styles.modeName}>{info.title}</span>
          <span className={styles.modeSub}>{info.subtitle}</span>
        </h1>
      </header>

      <div className={styles.body}>
        <section className={styles.summary}>
          <div className={styles.stat}>
            <div className={styles.statLabel}>タイム</div>
            <div className={styles.time}>{formatTime(summary.latest.timeMs)}</div>
          </div>
          <div className={styles.statRow}>
            <div className={styles.stat}>
              <div className={styles.statLabel}>まちがい</div>
              <div className={styles.statValue}>{summary.latest.mistakes}かい</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statLabel}>ひょうか</div>
              <div className={styles.stars} aria-label={`ほし ${stars}こ`}>
                {[1, 2, 3].map((n) => (
                  <span
                    key={n}
                    className={n <= stars ? styles.starOn : styles.starOff}
                    style={{ animationDelay: `${0.2 + n * 0.15}s` }}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
          </div>
          {stars === 3 && <div className={styles.hanamaru}>💮 はなまる!</div>}
          <div className={styles.messages}>
            {messages(summary).map((m) => (
              <p key={m} className={m.startsWith('👑') ? styles.bestMessage : styles.message}>
                {m}
              </p>
            ))}
          </div>
        </section>

        <section className={styles.chartBox}>
          <h2 className={styles.chartTitle}>
            きみの きろく <span className={styles.chartHint}>(ぼうが みじかいほど はやい!)</span>
          </h2>
          <TimeChart records={records} />
          {fromFirst !== null && fromFirst > 0 && (
            <p className={styles.fromFirst}>
              🎉 さいしょ より <strong>{formatDiff(fromFirst)}</strong> はやく なったよ!
            </p>
          )}
          <p className={styles.playCount}>{summary.playCount}かいめ の ちょうせん</p>
        </section>
      </div>

      <footer className={styles.buttons}>
        <button type="button" className={`pop-button ${styles.retry}`} onClick={onRetry}>
          もういちど
        </button>
        <button type="button" className={`pop-button ${styles.back}`} onClick={onBack}>
          ほかの もんだい
        </button>
      </footer>
    </div>
  )
}
