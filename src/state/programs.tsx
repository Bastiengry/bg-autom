import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  AnyProgram,
  BlocksProgram,
  GrafcetProgram,
  LadderProgram,
  MachineId,
  ProgramMode,
} from '../types';
import { emptyProgram } from '../types';
import { STORAGE_KEY, blankMap, mergeStored, serialize, type ProgramsMap } from './storage';

export type { ProgramsMap } from './storage';

interface ProgramsContextValue {
  loaded: boolean;
  get: (mode: ProgramMode, machine: MachineId) => AnyProgram;
  set: (mode: ProgramMode, machine: MachineId, p: AnyProgram) => void;
  clear: (mode: ProgramMode, machine: MachineId) => void;
}

const ProgramsContext = createContext<ProgramsContextValue | null>(null);

export function ProgramsProvider({ children }: { children: React.ReactNode }) {
  const [map, setMap] = useState<ProgramsMap>(() => blankMap());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        setMap((prev) => mergeStored(raw, prev));
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, serialize(map)).catch(() => undefined);
  }, [map, loaded]);

  const get = useCallback(
    (mode: ProgramMode, machine: MachineId) => map[mode][machine],
    [map],
  );

  const set = useCallback((mode: ProgramMode, machine: MachineId, p: AnyProgram) => {
    setMap((m) => ({ ...m, [mode]: { ...m[mode], [machine]: p } }));
  }, []);

  const clear = useCallback((mode: ProgramMode, machine: MachineId) => {
    setMap((m) => ({ ...m, [mode]: { ...m[mode], [machine]: emptyProgram(mode) } }));
  }, []);

  const value = useMemo(() => ({ loaded, get, set, clear }), [loaded, get, set, clear]);

  return <ProgramsContext.Provider value={value}>{children}</ProgramsContext.Provider>;
}

export function usePrograms(): ProgramsContextValue {
  const ctx = useContext(ProgramsContext);
  if (!ctx) throw new Error('usePrograms doit être utilisé dans ProgramsProvider');
  return ctx;
}

export function programOfMachine<T extends AnyProgram>(p: AnyProgram): T {
  return p as T;
}

export type { GrafcetProgram, LadderProgram, BlocksProgram };
