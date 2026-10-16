import { RANKS, rankThresholds, type ChallengeModeId } from '../domain/challenge'
import styles from './RankLadder.module.css'

interface Props {
  mode: ChallengeModeId
  /** 強調する ランク の番号(RANKS の順) */
  currentIndex: number
}

/** ランクの だんだん。6つのランクを よこに ならべ、今のランクを強調、まだのランクは灰色にする */
export function RankLadder({ mode, currentIndex }: Props) {
  const thresholds = rankThresholds(mode)
  return (
    <section className={styles.ladder} aria-label="ランク">
      {RANKS.map((r, i) => (
        <div
          key={r.id}
          className={styles.step}
          data-state={i < currentIndex ? 'passed' : i === currentIndex ? 'current' : 'locked'}
        >
          <span className={styles.stepIcon}>{r.icon}</span>
          <span className={styles.stepName}>{r.name}</span>
          <span className={styles.stepNeed}>{thresholds[i]}もん〜</span>
        </div>
      ))}
    </section>
  )
}
