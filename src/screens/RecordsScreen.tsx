import { Mascot } from '../components/Mascot'
import {
  COUNT_TICK_STEPS,
  TIME_TICK_STEPS,
  countLabelLines,
  countTickLabel,
  timeLabelLines,
  timeTickLabel,
} from '../components/chartFormats'
import { RankLadder } from '../components/RankLadder'
import { RecordChart } from '../components/RecordChart'
import {
  RANKS,
  bestCorrect,
  rankFor,
  rankThresholds,
  type ChallengeModeId,
  type ChallengeRecord,
} from '../domain/challenge'
import { getModeInfo, parseKukuMode, type ModeId } from '../domain/modes'
import { bestTime, formatFaster, formatTime, type PlayRecord } from '../domain/stats'
import { useMediaQuery } from '../hooks/useMediaQuery'
import base from './ResultScreen.module.css'
import styles from './RecordsScreen.module.css'

type Props = {
  onPlay: () => void
  onBack: () => void
} & (
  | { kind: 'practice'; mode: ModeId; records: readonly PlayRecord[] }
  | { kind: 'challenge'; mode: ChallengeModeId; records: readonly ChallengeRecord[] }
)

/** グラフの 最後の ぼう の下の ことば(結果画面の「こんかい」の かわり) */
const LATEST_LABEL = 'このまえ'

/** れんしゅう・チャレンジ の きろくを いつでも 見られる画面。結果画面と おなじ グラフを出す */
export function RecordsScreen(props: Props) {
  const { kind, mode, onPlay, onBack } = props
  const info = getModeInfo(mode)
  const kindName = kind === 'practice' ? 'れんしゅう' : 'チャレンジ'
  const narrow = useMediaQuery('(max-width: 600px)')

  return (
    <div className={`screen ${base.root}`} data-theme={info.theme}>
      {/* ボタンは画面の上におく(画面の下はスワイプの操作とぶつかりやすいため) */}
      <header className={styles.header}>
        <button type="button" className={`pop-button ${styles.back}`} onClick={onBack}>
          ◀ もどる
        </button>
        <h1 className={styles.title}>
          <span>📊 きろく</span>
          <span className={styles.modeName}>
            {/* 九九の段は れんしゅう だけなので、かわりに じゅんばん・ばらばら を出す */}
            {info.title} <small>{parseKukuMode(mode) ? info.subtitle : kindName}</small>
          </span>
        </h1>
        <button type="button" className={`pop-button ${styles.play}`} onClick={onPlay}>
          {kindName} する
        </button>
      </header>

      {props.records.length === 0 ? (
        <section className={`${base.summary} ${styles.empty}`}>
          <Mascot size={narrow ? 72 : 96} />
          <div>
            <p className={styles.emptyTitle}>まだ きろく が ないよ</p>
            <p className={base.message}>「{kindName} する」を おして やってみよう!</p>
          </div>
        </section>
      ) : props.kind === 'practice' ? (
        <PracticeRecords records={props.records} narrow={narrow} />
      ) : (
        <ChallengeRecords mode={props.mode} records={props.records} narrow={narrow} />
      )}
    </div>
  )
}

interface PracticeProps {
  records: readonly PlayRecord[]
  narrow: boolean
}

function PracticeRecords({ records, narrow }: PracticeProps) {
  const best = bestTime(records)!
  const latest = records[records.length - 1]
  const first = records[0]

  return (
    <div className={base.body}>
      <section className={base.summary}>
        <div>
          <div className={base.statLabel}>👑 じこベスト</div>
          <div className={base.time}>{formatTime(best)}</div>
        </div>
        <div className={base.statRow}>
          <div>
            <div className={base.statLabel}>このまえ</div>
            <div className={base.statValue}>{formatTime(latest.timeMs)}</div>
          </div>
          <div>
            <div className={base.statLabel}>れんしゅう した かず</div>
            <div className={base.statValue}>{records.length}かい</div>
          </div>
        </div>
      </section>

      <section className={base.chartBox}>
        <h2 className={base.chartTitle}>
          きみの きろく <span className={base.chartHint}>(ぼうが みじかいほど はやい!)</span>
        </h2>
        <div className={base.chart}>
          <RecordChart
            values={records.map((r) => r.timeMs)}
            better="lower"
            labelLines={timeLabelLines}
            tickLabel={timeTickLabel}
            tickSteps={TIME_TICK_STEPS}
            maxBars={narrow ? 5 : 10}
            latestLabel={LATEST_LABEL}
            ariaLabel="これまでの タイム の グラフ"
          />
        </div>
        {first.timeMs > best && (
          <p className={base.fromFirst}>
            🎉 さいしょ より <strong>{formatFaster(first.timeMs, best)}</strong> はやく なったよ!
          </p>
        )}
      </section>
    </div>
  )
}

interface ChallengeProps {
  mode: ChallengeModeId
  records: readonly ChallengeRecord[]
  narrow: boolean
}

function ChallengeRecords({ mode, records, narrow }: ChallengeProps) {
  const best = bestCorrect(records)!
  const rank = rankFor(mode, best)
  const latest = records[records.length - 1]
  const moreThanFirst = best - records[0].correct
  const thresholds = rankThresholds(mode)

  return (
    <div className={base.body}>
      <section className={base.summary}>
        <div className={styles.rank}>
          <span className={styles.rankIcon} aria-hidden="true">
            {rank.rank.icon}
          </span>
          <div>
            <div className={base.statLabel}>いちばん いい ひょうか</div>
            <div className={styles.rankName}>{rank.rank.name}</div>
          </div>
        </div>
        <div>
          <div className={base.statLabel}>👑 じこベスト</div>
          <div className={base.time}>{best}もん</div>
        </div>
        <div className={base.statRow}>
          <div>
            <div className={base.statLabel}>このまえ</div>
            <div className={base.statValue}>{latest.correct}もん</div>
          </div>
          <div>
            <div className={base.statLabel}>チャレンジ した かず</div>
            <div className={base.statValue}>{records.length}かい</div>
          </div>
        </div>
        <p className={`${base.message} ${styles.next}`}>
          {rank.next
            ? `あと ${rank.next.need}もん で ${rank.next.rank.icon} ${rank.next.rank.name}!`
            : 'さいこう ランク! すごすぎる!'}
        </p>
      </section>

      <RankLadder mode={mode} currentIndex={rank.index} />

      <section className={base.chartBox}>
        <h2 className={base.chartTitle}>
          きみの きろく <span className={base.chartHint}>(ぼうが たかいほど すごい!)</span>
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
            latestLabel={LATEST_LABEL}
            ariaLabel="これまでの といた かず の グラフ"
          />
        </div>
        {moreThanFirst > 0 && (
          <p className={base.fromFirst}>
            🎉 さいしょ より <strong>{moreThanFirst}もん</strong> おおく とけるように なったよ!
          </p>
        )}
      </section>
    </div>
  )
}
