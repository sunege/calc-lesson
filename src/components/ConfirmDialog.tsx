import type { ReactNode } from 'react'
import styles from './ConfirmDialog.module.css'

interface Props {
  message: ReactNode
  yesLabel?: string
  noLabel?: string
  onYes: () => void
  onNo: () => void
}

export function ConfirmDialog({ message, yesLabel = 'はい', noLabel = 'いいえ', onYes, onNo }: Props) {
  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true">
      <div className={styles.box}>
        <p className={styles.message}>{message}</p>
        <div className={styles.buttons}>
          <button type="button" className={`pop-button ${styles.no}`} onClick={onNo}>
            {noLabel}
          </button>
          <button type="button" className={`pop-button ${styles.yes}`} onClick={onYes}>
            {yesLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
