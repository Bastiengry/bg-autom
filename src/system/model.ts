import type { Vars } from '../types';

export const TICK_MS = 100;
export const FILL_RATE = 1;
export const DRAIN_RATE = 1;
export const LEVEL_HIGH = 95;
export const LEVEL_MID = 50;
export const LEVEL_LOW = 5;

export interface SysState {
  level: number;
  phase: 'idle' | 'top' | 'draining';
  cycles: number;
}

export function initSystem(): SysState {
  return { level: 0, phase: 'idle', cycles: 0 };
}

export function readSensors(level: number): Pick<Vars, 'sBas' | 'sMoyen' | 'sHaut'> {
  return {
    sBas: level <= LEVEL_LOW,
    sMoyen: level >= LEVEL_MID,
    sHaut: level >= LEVEL_HIGH,
  };
}

export function stepSystem(
  sys: SysState,
  outputs: { vanneR: boolean; pompeV: boolean },
): SysState {
  let level = sys.level + (outputs.vanneR ? FILL_RATE : 0) - (outputs.pompeV ? DRAIN_RATE : 0);
  level = Math.max(0, Math.min(100, level));
  let phase = sys.phase;
  let cycles = sys.cycles;
  if (level >= LEVEL_HIGH) phase = 'top';
  if (phase === 'top' && level <= LEVEL_LOW) {
    cycles += 1;
    phase = 'idle';
  }
  return { level, phase, cycles };
}
