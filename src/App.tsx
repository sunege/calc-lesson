import { useCallback, useState } from 'react'
import { unlockAudio } from './audio/sound'
import { parseKukuMode, type KukuOrder, type ModeId } from './domain/modes'
import { CountdownScreen } from './screens/CountdownScreen'
import { KukuSelectScreen } from './screens/KukuSelectScreen'
import { PlayScreen } from './screens/PlayScreen'
import { ResultScreen } from './screens/ResultScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { TitleScreen } from './screens/TitleScreen'
import { useData } from './storage/useData'

type Screen =
  | { name: 'title' }
  | { name: 'kuku' }
  | { name: 'settings' }
  | { name: 'countdown'; mode: ModeId }
  | { name: 'play'; mode: ModeId }
  | { name: 'result'; mode: ModeId }

export default function App() {
  const { data, addRecord } = useData()
  const [screen, setScreen] = useState<Screen>({ name: 'title' })
  const [kukuOrder, setKukuOrder] = useState<KukuOrder>('seq')
  // 「もういちど」で PlayScreen を作り直すための番号
  const [playId, setPlayId] = useState(0)

  const start = useCallback((mode: ModeId) => {
    // iOS では、タップの中で音を有効にしておく必要がある
    unlockAudio()
    const kuku = parseKukuMode(mode)
    if (kuku) setKukuOrder(kuku.order)
    setScreen({ name: 'countdown', mode })
  }, [])

  /** 九九の段から来たときは段選択に、それ以外はタイトルに戻る */
  const backFrom = (mode: ModeId) => setScreen(parseKukuMode(mode) ? { name: 'kuku' } : { name: 'title' })

  switch (screen.name) {
    case 'title':
      return (
        <TitleScreen
          onStart={start}
          onKuku={() => setScreen({ name: 'kuku' })}
          onSettings={() => setScreen({ name: 'settings' })}
        />
      )
    case 'kuku':
      return <KukuSelectScreen initialOrder={kukuOrder} onStart={start} onBack={() => setScreen({ name: 'title' })} />
    case 'settings':
      return <SettingsScreen onBack={() => setScreen({ name: 'title' })} />
    case 'countdown':
      return (
        <CountdownScreen
          mode={screen.mode}
          onDone={() => {
            setPlayId((n) => n + 1)
            setScreen({ name: 'play', mode: screen.mode })
          }}
        />
      )
    case 'play':
      return (
        <PlayScreen
          key={playId}
          mode={screen.mode}
          onQuit={() => backFrom(screen.mode)}
          onFinish={({ timeMs, mistakes }) => {
            addRecord(screen.mode, { timeMs: Math.round(timeMs), mistakes, playedAt: new Date().toISOString() })
            setScreen({ name: 'result', mode: screen.mode })
          }}
        />
      )
    case 'result':
      return (
        <ResultScreen
          mode={screen.mode}
          records={data.records[screen.mode] ?? []}
          onRetry={() => start(screen.mode)}
          onBack={() => backFrom(screen.mode)}
        />
      )
  }
}
