import { useCallback, useState } from 'react'
import { unlockAudio } from './audio/sound'
import { isChallengeMode, type ChallengeModeId } from './domain/challenge'
import { parseKukuMode, type KukuOrder, type ModeId } from './domain/modes'
import { ChallengePlayScreen } from './screens/ChallengePlayScreen'
import { ChallengeResultScreen } from './screens/ChallengeResultScreen'
import { CountdownScreen } from './screens/CountdownScreen'
import { KukuSelectScreen, type KukuView } from './screens/KukuSelectScreen'
import { ModeMenuScreen } from './screens/ModeMenuScreen'
import { PlayScreen } from './screens/PlayScreen'
import { RecordsScreen } from './screens/RecordsScreen'
import { ResultScreen } from './screens/ResultScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { TitleScreen } from './screens/TitleScreen'
import { useData } from './storage/useData'

/** 1回のプレイの しゅるい */
export type Session = { kind: 'practice'; mode: ModeId } | { kind: 'challenge'; mode: ChallengeModeId }

type Screen =
  | { name: 'title' }
  | { name: 'kuku'; view?: KukuView }
  | { name: 'settings' }
  /** れんしゅう と チャレンジ を えらぶ */
  | { name: 'menu'; mode: ChallengeModeId }
  /** れんしゅう・チャレンジ の きろく を見る */
  | { name: 'records'; session: Session }
  | { name: 'countdown'; session: Session }
  | { name: 'play'; session: Session }
  | { name: 'result'; session: Session }

export default function App() {
  const { data, addRecord, addChallengeRecord } = useData()
  const [screen, setScreen] = useState<Screen>({ name: 'title' })
  const [kukuOrder, setKukuOrder] = useState<KukuOrder>('seq')
  // 「もういちど」で プレイ画面を作り直すための番号
  const [playId, setPlayId] = useState(0)

  /** 九九の段なら、えらんだ じゅんばん を おぼえておく(段選択に もどったときに使う) */
  const rememberKukuOrder = useCallback((mode: ModeId) => {
    const kuku = parseKukuMode(mode)
    if (kuku) setKukuOrder(kuku.order)
  }, [])

  const start = useCallback(
    (session: Session) => {
      // iOS では、タップの中で音を有効にしておく必要がある
      unlockAudio()
      rememberKukuOrder(session.mode)
      setScreen({ name: 'countdown', session })
    },
    [rememberKukuOrder],
  )

  /** きろく画面を ひらく */
  const showRecords = (session: Session) => {
    rememberKukuOrder(session.mode)
    setScreen({ name: 'records', session })
  }

  /** タイトルや九九の段から えらんだとき */
  const select = (mode: ModeId) => {
    if (isChallengeMode(mode)) setScreen({ name: 'menu', mode })
    else start({ kind: 'practice', mode })
  }

  /** 「やめる」のあと: えらんだ画面に もどる */
  const backToChooser = (mode: ModeId) => {
    if (parseKukuMode(mode)) setScreen({ name: 'kuku' })
    else if (isChallengeMode(mode)) setScreen({ name: 'menu', mode })
    else setScreen({ name: 'title' })
  }

  /** 結果画面の「ほかの もんだい」 */
  const backToOthers = (mode: ModeId) => setScreen(parseKukuMode(mode) ? { name: 'kuku' } : { name: 'title' })

  switch (screen.name) {
    case 'title':
      return (
        <TitleScreen
          onSelect={select}
          onKuku={() => setScreen({ name: 'kuku' })}
          onSettings={() => setScreen({ name: 'settings' })}
        />
      )
    case 'kuku':
      return (
        <KukuSelectScreen
          initialOrder={kukuOrder}
          initialView={screen.view}
          onStart={select}
          onRecords={(mode) => showRecords({ kind: 'practice', mode })}
          onBack={() => setScreen({ name: 'title' })}
        />
      )
    case 'settings':
      return <SettingsScreen onBack={() => setScreen({ name: 'title' })} />
    case 'menu': {
      const { mode } = screen
      return (
        <ModeMenuScreen
          mode={mode}
          onPractice={() => start({ kind: 'practice', mode })}
          onChallenge={() => start({ kind: 'challenge', mode })}
          onRecords={(kind) => showRecords({ kind, mode })}
          onBack={() => setScreen({ name: 'title' })}
        />
      )
    }
    case 'records': {
      const { session } = screen
      // 九九の段は、つづけて ほかの段の きろく も見られるように、きろく の きりかえ を したまま もどる
      const onBack = () =>
        parseKukuMode(session.mode) ? setScreen({ name: 'kuku', view: 'records' }) : backToChooser(session.mode)
      const common = { onPlay: () => start(session), onBack }
      return session.kind === 'challenge' ? (
        <RecordsScreen kind="challenge" mode={session.mode} records={data.challenges[session.mode] ?? []} {...common} />
      ) : (
        <RecordsScreen kind="practice" mode={session.mode} records={data.records[session.mode] ?? []} {...common} />
      )
    }
    case 'countdown': {
      const { session } = screen
      return (
        <CountdownScreen
          mode={session.mode}
          challenge={session.kind === 'challenge'}
          onDone={() => {
            setPlayId((n) => n + 1)
            setScreen({ name: 'play', session })
          }}
        />
      )
    }
    case 'play': {
      const { session } = screen
      const playedAt = () => new Date().toISOString()
      if (session.kind === 'challenge') {
        return (
          <ChallengePlayScreen
            key={playId}
            mode={session.mode}
            onQuit={() => backToChooser(session.mode)}
            onFinish={({ correct, mistakes }) => {
              addChallengeRecord(session.mode, { correct, mistakes, playedAt: playedAt() })
              setScreen({ name: 'result', session })
            }}
          />
        )
      }
      return (
        <PlayScreen
          key={playId}
          mode={session.mode}
          onQuit={() => backToChooser(session.mode)}
          onFinish={({ timeMs, mistakes }) => {
            addRecord(session.mode, { timeMs: Math.round(timeMs), mistakes, playedAt: playedAt() })
            setScreen({ name: 'result', session })
          }}
        />
      )
    }
    case 'result': {
      const { session } = screen
      if (session.kind === 'challenge') {
        return (
          <ChallengeResultScreen
            mode={session.mode}
            records={data.challenges[session.mode] ?? []}
            onRetry={() => start(session)}
            onBack={() => backToOthers(session.mode)}
          />
        )
      }
      return (
        <ResultScreen
          mode={session.mode}
          records={data.records[session.mode] ?? []}
          onRetry={() => start(session)}
          onBack={() => backToOthers(session.mode)}
        />
      )
    }
  }
}
