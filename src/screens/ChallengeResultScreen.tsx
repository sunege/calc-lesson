import { useEffect, useRef } from 'react'
import { playBest, playClear } from '../audio/sound'
import { COUNT_TICK_STEPS, countLabelLines, countTickLabel } from '../components/chartFormats'
import { Mascot } from '../components/Mascot'
import { RecordChart } from '../components/RecordChart'
import {
  RANKS,
  rankFor,
  rankThresholds,
  summarizeChallenge,
  type ChallengeModeId,
  type ChallengeRecord,
  type ChallengeSummary,
  type RankResult,
} from '../domain/challenge'
import { getModeInfo } from '../domain/modes'
import { fireBest, fireCombo, fireCorrect } from '../effects/confetti'
import { useMediaQuery } from '../hooks/useMediaQuery'
import base from './ResultScreen.module.css'
import styles from './ChallengeResultScreen.module.css'

interface Props {
  mode: ChallengeModeId
  /** このモードのチャレンジの記録(古い順、最後が今回) */
  records: readonly ChallengeRecord[]
  onRetry: () => void
  onBack: () => void
}

interface Message {
  text: string
  strong?: boolean
  /** つぎのランクの目標 */
  next?: boolean
}

function messages(s: ChallengeSummary, rank: RankResult): Message[] {
  const lines: Message[] = []
  if (s.isFirst) {
    lines.push({ text: 'はじめての チャレンジ! つぎは もっと とけるかな?' })
  } else {
    if (s.previousBestRankIndex !== null && rank.index > s.previousBestRankIndex) {
      const prev = RANKS[s.previousBestRankIndex]
      lines.push({ text: `🎉 ランクアップ! ${prev.icon} → ${rank.rank.icon}`, strong: true })
    }
    if (s.isNewBest) lines.push({ text: '👑 じこベスト こうしん!', strong: true })
    const diff = s.moreThanPrevious ?? 0
    if (diff > 0) lines.push({ text: `まえより ${diff}もん おおく とけたよ!` })
    else if (diff === 0) lines.push({ text: 'まえと おなじ かず! つぎは もう 1もん!' })
    else lines.push({ text: 'おしい! つぎは もっと とけるよ!' })
  }
  lines.push(
    rank.next
      ? { text: `あと ${rank.next.need}もん で ${rank.next.rank.icon} ${rank.next.rank.name}!`, next: true }
      : { text: 'さいこう ランク! すごすぎる!', next: true },
  )
  return lines
}

export function ChallengeResultScreen({ mode, records, onRetry, onBack }: Props) {
  const info = getModeInfo(mode)
  const summary = summarizeChallenge(mode, records)
  const rank = rankFor(mode, summary.latest.correct)
  const rankedUp = summary.previousBestRankIndex !== null && rank.index > summary.previousBestRankIndex
  const narrow = useMediaQuery('(max-width: 600px)')
  const celebrated = useRef(false)
  const thresholds = rankThresholds(mode)

  useEffect(() => {
    if (celebrated.current) return
    celebrated.current = true
    playClear()
    if (summary.isNewBest) {
      playBest()
      fireBest()
    } else {
      fireCorrect(2)
    }
    if (rankedUp) window.setTimeout(fireCombo, 700)
  }, [summary.isNewBest, rankedUp])

  return (
    <div className={`screen ${base.root}`} data-theme={info.theme}>
      {summary.isNewBest && (
        <div className={base.crownDrop} aria-hidden="true">
          👑
        </div>
      )}

      {/* ボタンは画面の上におく(画面の下はスワイプの操作とぶつかりやすいため) */}
      <header className={base.header}>
        <div className={base.heading}>
          <Mascot mood="happy" size={narrow ? 64 : 88} className={base.mascot} />
          <h1 className={base.title}>
            けっか! <span className={base.modeName}>{info.title}</span>
            <span className={base.modeSub}>チャレンジ</span>
          </h1>
        </div>
        <div className={base.buttons}>
          <button type="button" className={`pop-button ${base.retry}`} onClick={onRetry}>
            もういちど
          </button>
          <button type="button" className={`pop-button ${base.back}`} onClick={onBack}>
            ほかの もんだい
          </button>
        </div>
      </header>

      <div className={base.body}>
        <section className={`${base.summary} ${styles.summary}`}>
          <div className={styles.rankReveal} data-rank={rank.rank.id}>
            <span className={styles.rankIcon} aria-hidden="true">
              {rank.rank.icon}
            </span>
            <div>
              <div className={base.statLabel}>ひょうか</div>
              <div className={styles.rankName}>{rank.rank.name}</div>
            </div>
          </div>
          <div>
            <div className={base.statLabel}>1ぷんで といた かず</div>
            <div className={base.time}>{summary.latest.correct}もん</div>
          </div>
          <div>
            <div className={base.statLabel}>まちがい</div>
            <div className={base.statValue}>{summary.latest.mistakes}かい</div>
          </div>
          <div className={`${base.messages} ${styles.messages}`}>
            {messages(summary, rank).map((m) => (
              <p
                key={m.text}
                className={
                  m.strong ? base.bestMessage : m.next ? `${base.message} ${styles.nextMessage}` : base.message
                }
              >
                {m.text}
              </p>
            ))}
          </div>
        </section>

        {/* ランクの だんだん。つぎのランクまで あと何問かを見せる */}
        <section className={styles.ladder} aria-label="ランク">
          {RANKS.map((r, i) => (
            <div
              key={r.id}
              className={styles.step}
              data-state={i < rank.index ? 'passed' : i === rank.index ? 'current' : 'locked'}
            >
              <span className={styles.stepIcon}>{r.icon}</span>
              <span className={styles.stepName}>{r.name}</span>
              <span className={styles.stepNeed}>{thresholds[i]}もん〜</span>
            </div>
          ))}
        </section>

        <section className={base.chartBox}>
          <h2 className={base.chartTitle}>
            きみの きろく <span className={base.chartHint}>(ぼうが たかいほど すごい!)</span>
            <span className={base.playCount}>{summary.playCount}かいめ の チャレンジ</span>
          </h2>
          <div className={base.chart}>
            <RecordChart
              values={records.map((r) => r.correct)}
              better="higher"
              labelLines={countLabelLines}
              tickLabel={countTickLabel}
              tickSteps={COUNT_TICK_STEPS}
              maxBars={narrow ? 5 : 10}
              guides={RANKS.slice(1).map((r, i) => ({ value: thresholds[i + 1], label: r.icon }))}
              ariaLabel="これまでの といた かず の グラフ"
            />
          </div>
          {summary.moreThanFirst !== null && summary.moreThanFirst > 0 && (
            <p className={base.fromFirst}>
              🎉 さいしょ より <strong>{summary.moreThanFirst}もん</strong> おおく とけるように なったよ!
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
