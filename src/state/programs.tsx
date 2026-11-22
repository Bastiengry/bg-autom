import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type {
  BlocksProgram,
  GrafcetProgram,
  LadderProgram,
  ProgramMode,
} from '../types';
import { emptyBlocks, emptyGrafcet, emptyLadder } from '../types';

interface ProgramsContextValue {
  grafcet: GrafcetProgram;
  ladder: LadderProgram;
  blocks: BlocksProgram;
  get: (mode: ProgramMode) => GrafcetProgram | LadderProgram | BlocksProgram;
  setGrafcet: (p: GrafcetProgram) => void;
  setLadder: (p: LadderProgram) => void;
  setBlocks: (p: BlocksProgram) => void;
  clear: (mode: ProgramMode) => void;
}

const ProgramsContext = createContext<ProgramsContextValue | null>(null);

export function ProgramsProvider({ children }: { children: React.ReactNode }) {
  const [grafcet, setGrafcet] = useState<GrafcetProgram>(() => emptyGrafcet());
  const [ladder, setLadder] = useState<LadderProgram>(() => emptyLadder());
  const [blocks, setBlocks] = useState<BlocksProgram>(() => emptyBlocks());

  const get = useCallback(
    (mode: ProgramMode) => {
      if (mode === 'grafcet') return grafcet;
      if (mode === 'ladder') return ladder;
      return blocks;
    },
    [grafcet, ladder, blocks],
  );

  const clear = useCallback((mode: ProgramMode) => {
    if (mode === 'grafcet') setGrafcet(emptyGrafcet());
    else if (mode === 'ladder') setLadder(emptyLadder());
    else setBlocks(emptyBlocks());
  }, []);

  const value = useMemo(
    () => ({ grafcet, ladder, blocks, get, setGrafcet, setLadder, setBlocks, clear }),
    [grafcet, ladder, blocks, get, clear],
  );

  return <ProgramsContext.Provider value={value}>{children}</ProgramsContext.Provider>;
}

export function usePrograms(): ProgramsContextValue {
  const ctx = useContext(ProgramsContext);
  if (!ctx) throw new Error('usePrograms doit être utilisé dans ProgramsProvider');
  return ctx;
}
