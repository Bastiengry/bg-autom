import type { AnyProgram, BlocksProgram, MachineId, ProgramMode } from '../types';
import { MACHINE_IDS, emptyProgram } from '../types';

export const STORAGE_KEY = 'bgautom.programs.v3';

export type ProgramsMap = Record<ProgramMode, Record<MachineId, AnyProgram>>;

export function blankMap(): ProgramsMap {
  const map = { grafcet: {}, ladder: {}, blocks: {} } as unknown as ProgramsMap;
  for (const m of MACHINE_IDS) {
    map.grafcet[m] = emptyProgram('grafcet');
    map.ladder[m] = emptyProgram('ladder');
    map.blocks[m] = emptyProgram('blocks');
  }
  return map;
}

function sanitizeBlocks(p: unknown): BlocksProgram {
  const prog = p as BlocksProgram;
  return {
    rules: (prog?.rules ?? []).map((r) => ({
      when: Array.isArray(r?.when) ? r.when : r?.when ? [r.when] : [],
      then: Array.isArray(r?.then) ? r.then : [],
    })),
  };
}

/**
 * Fusionne un contenu brut du stockage avec la carte de base.
 * JSON corrompu, structure inattendue ou machines manquantes : retombe
 * sur la base sans jamais lever (la persistance ne doit pas casser l'app).
 */
export function mergeStored(raw: string | null, base: ProgramsMap): ProgramsMap {
  if (!raw) return base;
  let parsed: Partial<ProgramsMap>;
  try {
    parsed = JSON.parse(raw) as Partial<ProgramsMap>;
  } catch {
    return base;
  }
  if (!parsed || typeof parsed !== 'object') return base;
  const blocks: Partial<Record<MachineId, BlocksProgram>> = {};
  for (const m of MACHINE_IDS) {
    if (parsed.blocks?.[m]) blocks[m] = sanitizeBlocks(parsed.blocks[m]);
  }
  return {
    grafcet: { ...base.grafcet, ...(parsed.grafcet ?? {}) },
    ladder: { ...base.ladder, ...(parsed.ladder ?? {}) },
    blocks: { ...base.blocks, ...blocks },
  };
}

export function serialize(map: ProgramsMap): string {
  return JSON.stringify(map);
}
