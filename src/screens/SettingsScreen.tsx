import { useState } from 'react'
import { playCorrect, unlockAudio } from '../audio/sound'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { HoldButton } from '../components/HoldButton'
import { CHALLENGE_MODES, bestCorrect } from '../domain/challenge'
import { ALL_MODES, getModeInfo, type ModeId } from '../domain/modes'
import { bestTime, formatTime } from '../domain/stats'
import type { RecordKind } from '../storage/records'
import { useData } from '../storage/useData'
import styles from './SettingsScreen.module.css'

interface Props {
  onBack: () => void
}

type DeleteTarget = { mode: ModeId; kind: RecordKind; label: string } | 'all'

interface Row {
  mode: ModeId
  kind: RecordKind
  label: string
  count: number
  best: string
}

export function SettingsScreen({ onBack }: Props) {
  const { data, storageAvailable, setSound, clearRecords } = useData()
  const [target, setTarget] = useState<DeleteTarget | null>(null)
  const practiceRows: Row[] = ALL_MODES.flatMap((m) => {
    const records = data.records[m.id] ?? []
    if (records.length === 0) return []
    const label = `${m.title}(${m.subtitle})`
    return [{ mode: m.id, kind: 'practice', label, count: records.length, best: formatTime(bestTime(records) ?? 0) }]
  })
  const challengeRows: Row[] = CHALLENGE_MODES.flatMap((mode) => {
    const records = data.challenges[mode] ?? []
    if (records.length === 0) return []
    const label = `${getModeInfo(mode).title}(チャレンジ)`
    return [{ mode, kind: 'challenge', label, count: records.length, best: `${bestCorrect(records) ?? 0}もん` }]
  })
  const played = [...practiceRows, ...challengeRows]

  return (
    <div className={`screen ${styles.root}`}>
      <header className={styles.header}>
        <button type="button" className={`pop-button ${styles.back}`} onClick={onBack}>
          ◀ もどる
        </button>
        <h1 className={styles.title}>⚙️ せってい</h1>
      </header>

      <section className={styles.panel}>
        <div className={styles.row}>
          <span className={styles.label}>🔊 おと</span>
          <div className={styles.toggle} role="radiogroup" aria-label="おと">
            {[true, false].map((on) => (
              <button
                key={String(on)}
                type="button"
                role="radio"
                aria-checked={data.settings.sound === on}
                data-selected={data.settings.sound === on}
                className={`pop-button ${styles.toggleButton}`}
                onClick={() => {
                  setSound(on)
                  if (on) {
                    unlockAudio()
                    playCorrect()
                  }
                }}
              >
                {on ? 'あり' : 'なし'}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.panel}>
        <h2 className={styles.sectionTitle}>記録の管理(保護者の方へ)</h2>
        {!storageAvailable && (
          <p className={styles.warning}>
            このブラウザでは記録を保存できません(プライベートブラウズなど)。アプリを閉じると記録は消えます。
          </p>
        )}
        <p className={styles.note}>
          記録はこの端末のブラウザにだけ保存されます。削除ボタンは 3 秒間長押しすると確認画面が出ます。
        </p>
        {played.length === 0 ? (
          <p className={styles.note}>まだ記録はありません。</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>モード</th>
                <th>回数</th>
                <th>ベスト</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {played.map((row) => (
                <tr key={`${row.kind}:${row.mode}`}>
                  <td>{row.label}</td>
                  <td>{row.count}</td>
                  <td>{row.best}</td>
                  <td>
                    <HoldButton onHold={() => setTarget({ mode: row.mode, kind: row.kind, label: row.label })}>
                      長押しで削除
                    </HoldButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {played.length > 0 && (
          <div className={styles.deleteAll}>
            <HoldButton onHold={() => setTarget('all')}>すべての記録を長押しで削除</HoldButton>
          </div>
        )}
      </section>

      {target && (
        <ConfirmDialog
          message={target === 'all' ? 'すべての記録を削除しますか?' : `「${target.label}」の記録を削除しますか?`}
          yesLabel="削除する"
          noLabel="やめる"
          onYes={() => {
            clearRecords(target === 'all' ? undefined : { mode: target.mode, kind: target.kind })
            setTarget(null)
          }}
          onNo={() => setTarget(null)}
        />
      )}
    </div>
  )
}
