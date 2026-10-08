import { useEffect, useRef } from 'react'
import { playBest } from '../audio/sound'
import { Mascot } from '../components/Mascot'
import { TIME_TICK_STEPS, timeLabelLines, timeTickLabel } from '../components/chartFormats'
import { RecordChart } from '../components/RecordChart'
import { getModeInfo, type ModeId } from '../domain/modes'
import { formatFaster, formatTime, starCount, summarize, type PlayRecord, type ResultSummary } from '../domain/stats'
import { fireBest, fireCorrect } from '../effects/confetti'
import { useMediaQuery } from '../hooks/useMediaQuery'
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
  if (prev > 0) lines.push(`まえより ${formatFaster(s.latest.timeMs + prev, s.latest.timeMs)} はやく なったよ!`)
  else if (!s.isNewBest) lines.push('おしい! つぎは もっと はやく なるよ!')
  return lines
}

export function ResultScreen({ mode, records, onRetry, onBack }: Props) {
  const info = getModeInfo(mode)
  const summary = summarize(records)
  const stars = starCount(summary.latest.mistakes)
  const fromFirst = summary.fasterThanFirstMs
  const celebrated = useRef(false)
  // スマホでは グラフ の ぼう を へらして、文字を 大きく する
  const narrow = useMediaQuery('(max-width: 600px)')

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

      {/* ボタンは画面の上におく(画面の下はスワイプの操作とぶつかりやすいため) */}
      <header className={styles.header}>
        <div className={styles.heading}>
          <Mascot mood="happy" size={narrow ? 64 : 88} className={styles.mascot} />
          <h1 className={styles.title}>
            クリア! <span className={styles.modeName}>{info.title}</span>
            <span className={styles.modeSub}>{info.subtitle}</span>
          </h1>
        </div>
        <div className={styles.buttons}>
          <button type="button" className={`pop-button ${styles.retry}`} onClick={onRetry}>
            もういちど
          </button>
          <button type="button" className={`pop-button ${styles.back}`} onClick={onBack}>
            ほかの もんだい
          </button>
        </div>
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
            <span className={styles.playCount}>{summary.playCount}かいめ の ちょうせん</span>
          </h2>
          <div className={styles.chart}>
            <RecordChart
              values={records.map((r) => r.timeMs)}
              better="lower"
              labelLines={timeLabelLines}
              tickLabel={timeTickLabel}
              tickSteps={TIME_TICK_STEPS}
              maxBars={narrow ? 5 : 10}
              ariaLabel="これまでの タイム の グラフ"
            />
          </div>
          {fromFirst !== null && fromFirst > 0 && (
            <p className={styles.fromFirst}>
              🎉 さいしょ より <strong>{formatFaster(records[0].timeMs, summary.latest.timeMs)}</strong> はやく
              なったよ!
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
