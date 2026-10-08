import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { setSoundEnabled } from '../audio/sound'
import type { ChallengeModeId, ChallengeRecord } from '../domain/challenge'
import type { ModeId } from '../domain/modes'
import type { PlayRecord } from '../domain/stats'
import * as store from './records'
import { DataContext } from './useData'

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState(store.loadData)
  const [storageAvailable] = useState(() => store.isStorageAvailable())

  useEffect(() => {
    store.saveData(data)
    setSoundEnabled(data.settings.sound)
  }, [data])

  const addRecord = useCallback((mode: ModeId, record: PlayRecord) => {
    setData((d) => store.addRecord(d, mode, record))
  }, [])
  const addChallengeRecord = useCallback((mode: ChallengeModeId, record: ChallengeRecord) => {
    setData((d) => store.addChallengeRecord(d, mode, record))
  }, [])
  const clearRecords = useCallback((target?: { mode: ModeId; kind: store.RecordKind }) => {
    setData((d) => store.clearRecords(d, target))
  }, [])
  const setSound = useCallback((sound: boolean) => {
    setData((d) => store.setSound(d, sound))
  }, [])

  const value = useMemo(
    () => ({ data, storageAvailable, addRecord, addChallengeRecord, clearRecords, setSound }),
    [data, storageAvailable, addRecord, addChallengeRecord, clearRecords, setSound],
  )
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}
