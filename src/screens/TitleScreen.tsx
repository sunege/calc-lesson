import { Mascot } from '../components/Mascot'
import { FIRST_GRADE_MODES, KUKU_DANS, KUKU_ORDERS, getModeInfo, kukuModeId, type ModeId } from '../domain/modes'
import { bestTime, formatTime } from '../domain/stats'
import { useData } from '../storage/useData'
import styles from './TitleScreen.module.css'

interface Props {
  onStart: (mode: ModeId) => void
  onKuku: () => void
  onSettings: () => void
}

function ModeCard({
  mode,
  title,
  subtitle,
  theme,
  onClick,
  icon,
}: {
  mode?: ModeId
  title: string
  subtitle: string
  theme: string
  icon: string
  onClick: () => void
}) {
  const { data } = useData()
  const records = mode ? data.records[mode] : undefined
  const best = bestTime(records)
  return (
    <button type="button" className={`pop-button ${styles.card}`} data-theme={theme} onClick={onClick}>
      <span className={styles.icon}>{icon}</span>
      <span className={styles.cardTitle}>{title}</span>
      <span className={styles.cardSub}>{subtitle}</span>
      {mode && (
        <span className={styles.cardRecord}>
          {best === null ? 'まだ きろく なし' : `👑 ${formatTime(best)}・${records!.length}かい`}
        </span>
      )}
    </button>
  )
}

const ICONS: Partial<Record<ModeId, string>> = { add1: '🍎', sub1: '🍊', add2: '🚀', sub2: '🐬' }

export function TitleScreen({ onStart, onKuku, onSettings }: Props) {
  const { data } = useData()
  const kukuPlays = KUKU_DANS.flatMap((d) =>
    KUKU_ORDERS.map((o) => data.records[kukuModeId(d, o)]?.length ?? 0),
  ).reduce((a, b) => a + b, 0)
  const master = getModeInfo('kuku-master')

  return (
    <div className={`screen ${styles.root}`}>
      <header className={styles.header}>
        <Mascot size={96} className={styles.mascot} />
        <h1 className={styles.logo}>
          けいさん <span>ちゃれんじ</span>
        </h1>
        <button type="button" className={`pop-button ${styles.settings}`} aria-label="せってい" onClick={onSettings}>
          ⚙️
        </button>
      </header>

      <section className={styles.group}>
        <h2 className={styles.groupTitle}>
          <span className={styles.badge}>1ねんせい</span> たしざん・ひきざん
        </h2>
        <div className={styles.grid}>
          {FIRST_GRADE_MODES.map((id) => {
            const info = getModeInfo(id)
            return (
              <ModeCard
                key={id}
                mode={id}
                title={info.title}
                subtitle={info.subtitle}
                theme={info.theme}
                icon={ICONS[id] ?? '⭐'}
                onClick={() => onStart(id)}
              />
            )
          })}
        </div>
      </section>

      <section className={styles.group}>
        <h2 className={styles.groupTitle}>
          <span className={styles.badge}>2ねんせい</span> くく
        </h2>
        <div className={styles.grid}>
          <button type="button" className={`pop-button ${styles.card}`} data-theme="kuku" onClick={onKuku}>
            <span className={styles.icon}>🐸</span>
            <span className={styles.cardTitle}>くくの だん</span>
            <span className={styles.cardSub}>2の だん 〜 9の だん</span>
            <span className={styles.cardRecord}>
              {kukuPlays > 0 ? `ぜんぶで ${kukuPlays}かい` : 'まだ きろく なし'}
            </span>
          </button>
          <ModeCard
            mode="kuku-master"
            title={master.title}
            subtitle={master.subtitle}
            theme={master.theme}
            icon="🏆"
            onClick={() => onStart('kuku-master')}
          />
        </div>
      </section>
    </div>
  )
}
