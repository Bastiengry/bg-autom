import type { MachineId, VarDef } from '../types';

export const TICK_MS = 100;

export interface CuveState {
  kind: 'cuve';
  level: number;
  phase: 'idle' | 'top' | 'draining';
  cycles: number;
}

export interface FeuxState {
  kind: 'feux';
  tMs: number;
  phase: 'none' | 'A' | 'B' | 'C' | 'D';
  cycles: number;
  conflicts: number;
  seenV: boolean;
}

export type MachineState = CuveState | FeuxState;

export interface MachineDef {
  id: MachineId;
  name: string;
  icon: string;
  intro: string;
  vars: VarDef[];
  numericLabel: string | null;
  describe(state: MachineState): string;
}

export const C_RATE = 1;

function cuveStep(s: CuveState, o: Record<string, boolean>): CuveState {
  let level = s.level + (o.vanneR ? C_RATE : 0) - (o.pompeV ? C_RATE : 0);
  level = Math.max(0, Math.min(100, level));
  let phase = s.phase;
  let cycles = s.cycles;
  if (level >= 95) phase = 'top';
  if (phase === 'top' && level <= 5) {
    cycles += 1;
    phase = 'idle';
  }
  return { kind: 'cuve', level, phase, cycles };
}

function feuxRoad(o: Record<string, boolean>, n: number): 'R' | 'V' | 'O' | null {
  if (o[`v${n}`]) return 'V';
  if (o[`o${n}`]) return 'O';
  if (o[`r${n}`]) return 'R';
  return null;
}

function feuxStep(s: FeuxState, o: Record<string, boolean>): FeuxState {
  const tMs = s.tMs + TICK_MS;
  let phase = s.phase;
  let cycles = s.cycles;
  let conflicts = s.conflicts;
  let seenV = s.seenV;
  const r1 = feuxRoad(o, 1);
  const r2 = feuxRoad(o, 2);
  if ((r1 === 'V' || r1 === 'O') && (r2 === 'V' || r2 === 'O')) conflicts += 1;
  if (r1 === 'V' || r2 === 'V') seenV = true;
  const cur =
    r1 === 'R' && r2 === 'V' ? 'A'
    : r1 === 'R' && r2 === 'O' ? 'B'
    : r1 === 'V' && r2 === 'R' ? 'C'
    : r1 === 'O' && r2 === 'R' ? 'D'
    : null;
  if (cur) {
    if (phase === 'none') phase = cur;
    else if (phase === 'A' && cur === 'B') phase = 'B';
    else if (phase === 'B' && cur === 'C') phase = 'C';
    else if (phase === 'C' && cur === 'D') phase = 'D';
    else if (phase === 'D' && cur === 'A') {
      cycles += 1;
      phase = 'A';
    } else phase = cur;
  }
  return { kind: 'feux', tMs, phase, cycles, conflicts, seenV };
}

export const MACHINES: Record<MachineId, MachineDef> = {
  cuve: {
    id: 'cuve',
    name: 'Remplissage de cuve',
    icon: '💧',
    intro:
      'La cuve se remplit par la VANNE R et se vide par la POMPE V. Capteurs : BS (≤5 %), BM (≥50 %), BH (≥95 %). Boutons poussoirs MARCHE / ARRÊT à impulsion : mémorise la demande dans ton programme !',
    vars: [
      { id: 'bMarche', label: 'MARCHE', kind: 'input', detail: 'Bouton poussoir « Marche »' },
      { id: 'bArret', label: 'ARRÊT', kind: 'input', detail: 'Bouton poussoir « Arrêt »' },
      { id: 'sBas', label: 'BS', kind: 'input', detail: 'Capteur niveau bas (≤ 5 %)' },
      { id: 'sMoyen', label: 'BM', kind: 'input', detail: 'Capteur niveau moyen (≥ 50 %)' },
      { id: 'sHaut', label: 'BH', kind: 'input', detail: 'Capteur niveau haut (≥ 95 %)' },
      { id: 'vanneR', label: 'VANNE R', kind: 'output', detail: 'Vanne de remplissage' },
      { id: 'pompeV', label: 'POMPE V', kind: 'output', detail: 'Pompe de vidange' },
      { id: 'voyVert', label: 'VOY. V', kind: 'output', detail: 'Voyant vert' },
      { id: 'voyRouge', label: 'VOY. R', kind: 'output', detail: 'Voyant rouge' },
      { id: 'M1', label: 'M1', kind: 'internal', detail: 'Relais interne 1 (mémoire)' },
      { id: 'M2', label: 'M2', kind: 'internal', detail: 'Relais interne 2 (mémoire)' },
      { id: 'M3', label: 'M3', kind: 'internal', detail: 'Relais interne 3 (mémoire)' },
    ],
    numericLabel: 'Niveau',
    describe: (s) =>
      s.kind === 'cuve'
        ? `Cuve : ${Math.round(s.level)} % — Cycles complets : ${s.cycles}`
        : '',
  },
  feux: {
    id: 'feux',
    name: 'Feux de carrefour',
    icon: '🚦',
    intro:
      'Deux voies croisées. Voie 1 : R1 / O1 / V1. Voie 2 : R2 / O2 / V2. Commande les deux feux avec les temporisations (TON) pour enchaîner vert, orange, rouge en sécurité.',
    vars: [
      { id: 'bMarche', label: 'MARCHE', kind: 'input', detail: 'Bouton poussoir « Marche »' },
      { id: 'bArret', label: 'ARRÊT', kind: 'input', detail: 'Bouton poussoir « Arrêt »' },
      { id: 'r1', label: 'R1', kind: 'output', detail: 'Feu rouge voie 1' },
      { id: 'o1', label: 'O1', kind: 'output', detail: 'Feu orange voie 1' },
      { id: 'v1', label: 'V1', kind: 'output', detail: 'Feu vert voie 1' },
      { id: 'r2', label: 'R2', kind: 'output', detail: 'Feu rouge voie 2' },
      { id: 'o2', label: 'O2', kind: 'output', detail: 'Feu orange voie 2' },
      { id: 'v2', label: 'V2', kind: 'output', detail: 'Feu vert voie 2' },
      { id: 'M1', label: 'M1', kind: 'internal', detail: 'Phase 1 (R1 + V2)' },
      { id: 'M2', label: 'M2', kind: 'internal', detail: 'Phase 2 (R1 + O2)' },
      { id: 'M3', label: 'M3', kind: 'internal', detail: 'Phase 3 (V1 + R2)' },
      { id: 'M4', label: 'M4', kind: 'internal', detail: 'Phase 4 (O1 + R2)' },
      { id: 'Mstop', label: 'MSTOP', kind: 'internal', detail: 'Relais arr\u00eat (tout rouge)' },
    ],
    numericLabel: null,
    describe: (s) =>
      s.kind === 'feux'
        ? `Cycles complets : ${s.cycles} — Conflits : ${s.conflicts}`
        : '',
  },
};

export function initSystem(machine: MachineId): MachineState {
  if (machine === 'cuve') return { kind: 'cuve', level: 0, phase: 'idle', cycles: 0 };
  return { kind: 'feux', tMs: 0, phase: 'none', cycles: 0, conflicts: 0, seenV: false };
}

export function stepSystem(
  machine: MachineId,
  s: MachineState,
  outputs: Record<string, boolean>,
): MachineState {
  if (machine === 'cuve') return cuveStep(s as CuveState, outputs);
  return feuxStep(s as FeuxState, outputs);
}

export function varsOf(machine: MachineId): VarDef[] {
  return MACHINES[machine].vars;
}

export function objectives(machine: MachineId, s: MachineState): { label: string; done: boolean }[] {
  if (machine === 'cuve' && s.kind === 'cuve') {
    return [
      { label: 'Monter jusqu’au capteur haut (BH)', done: s.phase === 'top' || s.cycles > 0 },
      { label: 'Vider jusqu’au capteur bas (BS) : 1 cycle complet', done: s.cycles >= 1 },
      { label: 'Enchaîner 3 cycles complets', done: s.cycles >= 3 },
    ];
  }
  if (machine === 'feux' && s.kind === 'feux') {
    return [
      { label: 'Allumer un feu vert (voie 1 ou 2)', done: s.seenV },
      { label: 'Enchaîner V → O → R sur chaque voie (1 cycle complet)', done: s.cycles >= 1 },
      { label: 'Enchaîner 3 cycles complets', done: s.cycles >= 3 },
      { label: 'Jamais de feu vert des deux voies simultanément', done: s.conflicts === 0 },
    ];
  }
  return [];
}
