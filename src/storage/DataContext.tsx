import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { setSoundEnabled } from '../audio/sound'
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
  const clearRecords = useCallback((mode?: ModeId) => {
    setData((d) => store.clearRecords(d, mode))
  }, [])
  const setSound = useCallback((sound: boolean) => {
    setData((d) => store.setSound(d, sound))
  }, [])

  const value = useMemo(
    () => ({ data, storageAvailable, addRecord, clearRecords, setSound }),
    [data, storageAvailable, addRecord, clearRecords, setSound],
  )
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}
