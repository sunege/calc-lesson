import { useEffect, useState } from 'react'
import { playCountdown, playStart } from '../audio/sound'
import { getModeInfo, type ModeId } from '../domain/modes'
import styles from './CountdownScreen.module.css'

const STEPS = ['3', '2', '1', 'スタート!'] as const
const STEP_MS = 750

interface Props {
  mode: ModeId
  /** チャレンジのときは、ルールを ひとこと 出す */
  challenge?: boolean
  onDone: () => void
}

export function CountdownScreen({ mode, challenge = false, onDone }: Props) {
  const info = getModeInfo(mode)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (step < STEPS.length - 1) playCountdown()
    else playStart()
    const t = window.setTimeout(
      () => (step < STEPS.length - 1 ? setStep(step + 1) : onDone()),
      step < STEPS.length - 1 ? STEP_MS : 450,
    )
    return () => window.clearTimeout(t)
  }, [step, onDone])

  return (
    <div className={`screen ${styles.root}`} data-theme={info.theme}>
      <div className={styles.mode}>
        {info.title} <small>{challenge ? '⏱️ チャレンジ' : info.subtitle}</small>
      </div>
      {challenge && <div className={styles.rule}>1ぷんで なんもん とけるかな?</div>}
      <div key={step} className={step === STEPS.length - 1 ? styles.go : styles.count}>
        {STEPS[step]}
      </div>
    </div>
  )
}
