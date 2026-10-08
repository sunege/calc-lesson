import { bestCorrect, rankFor, type ChallengeModeId } from '../domain/challenge'
import { getModeInfo } from '../domain/modes'
import { generateProblems } from '../domain/problems'
import { bestTime, formatTime } from '../domain/stats'
import { useData } from '../storage/useData'
import styles from './ModeMenuScreen.module.css'

interface Props {
  mode: ChallengeModeId
  onPractice: () => void
  onChallenge: () => void
  onBack: () => void
}

/** たしざん などを えらんだあとに、れんしゅう か チャレンジ かを えらぶ */
export function ModeMenuScreen({ mode, onPractice, onChallenge, onBack }: Props) {
  const { data } = useData()
  const info = getModeInfo(mode)
  const practiceRecords = data.records[mode]
  const practiceBest = bestTime(practiceRecords)
  const challengeRecords = data.challenges[mode]
  const challengeBest = bestCorrect(challengeRecords)
  const problemCount = generateProblems(mode, () => 0).length

  return (
    <div className={`screen ${styles.root}`} data-theme={info.theme}>
      <header className={styles.header}>
        <button type="button" className={`pop-button ${styles.back}`} onClick={onBack}>
          ◀ もどる
        </button>
        <h1 className={styles.title}>
          {info.title} <small>{info.subtitle}</small>
        </h1>
      </header>

      <p className={styles.question}>どっちで あそぶ?</p>

      <div className={styles.choices}>
        <button type="button" className={`pop-button ${styles.choice}`} data-kind="practice" onClick={onPractice}>
          <span className={styles.icon}>📝</span>
          <span className={styles.name}>れんしゅう</span>
          <span className={styles.desc}>{problemCount}もん ぜんぶ とく タイムを はかろう</span>
          <span className={styles.record}>
            {practiceBest === null
              ? 'まだ きろく なし'
              : `👑 ${formatTime(practiceBest)}・${practiceRecords!.length}かい`}
          </span>
        </button>

        <button type="button" className={`pop-button ${styles.choice}`} data-kind="challenge" onClick={onChallenge}>
          <span className={styles.icon}>⏱️</span>
          <span className={styles.name}>チャレンジ</span>
          <span className={styles.desc}>1ぷんで なんもん とけるかな?</span>
          <span className={styles.record}>
            {challengeBest === null
              ? 'まだ きろく なし'
              : `👑 ${challengeBest}もん ${rankFor(mode, challengeBest).rank.icon}・${challengeRecords!.length}かい`}
          </span>
        </button>
      </div>
    </div>
  )
}
