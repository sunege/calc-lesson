import { useRef, useState, type ReactNode } from 'react'
import styles from './HoldButton.module.css'

interface Props {
  children: ReactNode
  holdMs?: number
  onHold: () => void
  className?: string
}

/** 長押しし続けたときだけ反応するボタン(子どもの誤操作を防ぐ) */
export function HoldButton({ children, holdMs = 3000, onHold, className }: Props) {
  const [holding, setHolding] = useState(false)
  const timer = useRef<number | null>(null)

  const cancel = () => {
    setHolding(false)
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = null
  }

  return (
    <button
      type="button"
      className={`${styles.button} ${className ?? ''}`}
      data-holding={holding}
      style={{ ['--hold-ms' as string]: `${holdMs}ms` }}
      onPointerDown={(e) => {
        e.preventDefault()
        setHolding(true)
        timer.current = window.setTimeout(() => {
          cancel()
          onHold()
        }, holdMs)
      }}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onContextMenu={(e) => e.preventDefault()}
    >
      <span className={styles.fill} aria-hidden="true" />
      <span className={styles.label}>{children}</span>
    </button>
  )
}
