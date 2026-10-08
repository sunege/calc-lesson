export type MascotMood = 'normal' | 'happy' | 'sad'

interface Props {
  mood?: MascotMood
  size?: number
  className?: string
}

/** マスコットの ねこ。表情は ふつう・よろこぶ・こまる の 3つ */
export function Mascot({ mood = 'normal', size = 96, className }: Props) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={mood === 'happy' ? 'よろこぶ ねこ' : mood === 'sad' ? 'こまった ねこ' : 'ねこ'}
    >
      {/* みみ */}
      <path d="M18 40 L22 8 L44 26 Z" fill="#ffb347" stroke="#3b2f2a" strokeWidth="3" strokeLinejoin="round" />
      <path d="M82 40 L78 8 L56 26 Z" fill="#ffb347" stroke="#3b2f2a" strokeWidth="3" strokeLinejoin="round" />
      <path d="M24 32 L26 16 L37 25 Z" fill="#ff8fa3" />
      <path d="M76 32 L74 16 L63 25 Z" fill="#ff8fa3" />
      {/* かお */}
      <ellipse cx="50" cy="56" rx="40" ry="36" fill="#ffc46b" stroke="#3b2f2a" strokeWidth="3" />
      {/* ほっぺ */}
      <ellipse cx="25" cy="66" rx="7" ry="4.5" fill="#ff8fa3" opacity="0.8" />
      <ellipse cx="75" cy="66" rx="7" ry="4.5" fill="#ff8fa3" opacity="0.8" />
      {/* め */}
      {mood === 'happy' && (
        <g fill="none" stroke="#3b2f2a" strokeWidth="4" strokeLinecap="round">
          <path d="M28 54 Q35 44 42 54" />
          <path d="M58 54 Q65 44 72 54" />
        </g>
      )}
      {mood === 'normal' && (
        <g fill="#3b2f2a">
          <ellipse cx="35" cy="52" rx="5" ry="6.5" />
          <ellipse cx="65" cy="52" rx="5" ry="6.5" />
          <circle cx="36.5" cy="49.5" r="1.8" fill="#fff" />
          <circle cx="66.5" cy="49.5" r="1.8" fill="#fff" />
        </g>
      )}
      {mood === 'sad' && (
        <g>
          <g fill="none" stroke="#3b2f2a" strokeWidth="3" strokeLinecap="round">
            <path d="M27 42 L41 46" />
            <path d="M73 42 L59 46" />
          </g>
          <ellipse cx="35" cy="55" rx="4.5" ry="5" fill="#3b2f2a" />
          <ellipse cx="65" cy="55" rx="4.5" ry="5" fill="#3b2f2a" />
          <path d="M84 30 Q88 38 84 42 Q80 38 84 30 Z" fill="#7cc8ff" stroke="#3b2f2a" strokeWidth="1.5" />
        </g>
      )}
      {/* はな */}
      <path d="M46 62 L54 62 L50 66 Z" fill="#ff6f8a" stroke="#3b2f2a" strokeWidth="1.5" strokeLinejoin="round" />
      {/* くち */}
      {mood === 'happy' && (
        <path d="M38 70 Q50 86 62 70 Z" fill="#ff6f8a" stroke="#3b2f2a" strokeWidth="3" strokeLinejoin="round" />
      )}
      {mood === 'normal' && (
        <path d="M42 70 Q46 74 50 70 Q54 74 58 70" fill="none" stroke="#3b2f2a" strokeWidth="3" strokeLinecap="round" />
      )}
      {mood === 'sad' && (
        <path d="M42 76 Q50 69 58 76" fill="none" stroke="#3b2f2a" strokeWidth="3" strokeLinecap="round" />
      )}
      {/* ひげ */}
      <g stroke="#3b2f2a" strokeWidth="2" strokeLinecap="round">
        <path d="M6 58 L20 61" />
        <path d="M6 68 L20 66" />
        <path d="M94 58 L80 61" />
        <path d="M94 68 L80 66" />
      </g>
    </svg>
  )
}
