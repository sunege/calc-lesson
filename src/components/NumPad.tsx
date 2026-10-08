import { useRef, useState, type ReactNode } from 'react'
import { playTap } from '../audio/sound'
import styles from './NumPad.module.css'

interface Props {
  onDigit: (digit: number) => void
  onBackspace: () => void
  onClearAll: () => void
  onSubmit: () => void
  canSubmit: boolean
  disabled: boolean
}

const LONG_PRESS_MS = 500

interface KeyProps {
  label: ReactNode
  ariaLabel: string
  className?: string
  disabled?: boolean
  onPress: () => void
  onLongPress?: () => void
}

/**
 * pointerdown ですぐ反応するボタン。
 * キーボード操作(Tab で選んで Enter)でも押せるように、click は detail === 0 のときだけ使う。
 */
function Key({ label, ariaLabel, className, disabled, onPress, onLongPress }: KeyProps) {
  const [pressed, setPressed] = useState(false)
  const timer = useRef<number | null>(null)

  const release = () => {
    setPressed(false)
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = null
  }

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-disabled={disabled}
      data-pressed={pressed}
      className={`pop-button ${styles.key} ${className ?? ''}`}
      onPointerDown={(e) => {
        e.preventDefault()
        if (disabled) return
        setPressed(true)
        playTap()
        onPress()
        if (onLongPress) timer.current = window.setTimeout(onLongPress, LONG_PRESS_MS)
      }}
      onPointerUp={release}
      onPointerLeave={release}
      onPointerCancel={release}
      onClick={(e) => {
        if (e.detail === 0 && !disabled) onPress()
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {label}
    </button>
  )
}

export function NumPad({ onDigit, onBackspace, onClearAll, onSubmit, canSubmit, disabled }: Props) {
  const digitKey = (d: number) => (
    <Key key={d} label={d} ariaLabel={String(d)} disabled={disabled} onPress={() => onDigit(d)} />
  )
  return (
    <div className={styles.pad} data-disabled={disabled}>
      {[7, 8, 9, 4, 5, 6, 1, 2, 3].map(digitKey)}
      <Key
        label="けす"
        ariaLabel="けす"
        className={styles.erase}
        disabled={disabled}
        onPress={onBackspace}
        onLongPress={onClearAll}
      />
      {digitKey(0)}
      <Key
        label="こたえる"
        ariaLabel="こたえる"
        className={styles.submit}
        disabled={disabled || !canSubmit}
        onPress={onSubmit}
      />
    </div>
  )
}
