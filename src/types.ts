export type MachineId = 'cuve' | 'feux' | 'convoyeur' | 'robot' | 'pniveau';

export const MACHINE_IDS: MachineId[] = ['cuve', 'feux', 'convoyeur', 'robot', 'pniveau'];
export type ProgramMode = 'grafcet' | 'ladder' | 'blocks';

export type Condition =
  | { type: 'var'; varId: string; negated: boolean }
  | { type: 'edge'; varId: string; dir: 'rising' | 'falling' }
  | { type: 'level'; op: '>=' | '<='; value: number }
  | { type: 'timerContact'; timerId: string }
  | { type: 'counterContact'; counterId: string };

export type VarKind = 'input' | 'output' | 'internal';

export interface VarDef {
  id: string;
  label: string;
  kind: VarKind;
  detail: string;
  color?: string;
}

export interface GrafcetAction {
  varId: string;
  mode: 'level' | 'set' | 'reset';
}

export interface GrafcetNode {
  actions: GrafcetAction[];
  transition: Condition[];
  afterSeconds: number | null;
  alt: { condition: Condition[]; goto: number }[];
  forks: number[];
  waitsFor: number[];
}

export interface GrafcetProgram {
  nodes: GrafcetNode[];
  loopTo: number;
}

export interface LadderTimer {
  id: string;
  type: 'TON' | 'TOF' | 'TP';
  presetMs: number;
  input: Condition[];
}

export interface LadderCounter {
  id: string;
  type: 'CTU' | 'CTD';
  preset: number;
  trigger: Condition[];
  resetCondition: Condition[];
}

export interface LadderRung {
  output: string;
  coilType: 'coil' | 'set' | 'reset';
  terms: Condition[];
  junctions: ('AND' | 'OR')[];
}

export interface LadderProgram {
  rungs: LadderRung[];
  timers: LadderTimer[];
  counters: LadderCounter[];
}

export interface BlockRule {
  when: Condition[];
  then: string[];
}

export interface BlocksProgram {
  rules: BlockRule[];
}

export type AnyProgram = GrafcetProgram | LadderProgram | BlocksProgram;

export const MODE_LABELS: Record<ProgramMode, string> = {
  grafcet: 'Grafcet',
  ladder: 'Ladder (LD)',
  blocks: 'Blocs simples',
};

export interface EmptyNodeDefaults {
  emptyGrafcet(): GrafcetProgram;
  emptyLadder(): LadderProgram;
  emptyBlocks(): BlocksProgram;
}

export function emptyGrafcet(): GrafcetProgram {
  return {
    nodes: [
      { actions: [], transition: [], afterSeconds: null, alt: [], forks: [], waitsFor: [] },
    ],
    loopTo: 0,
  };
}

export function emptyLadder(): LadderProgram {
  return { rungs: [], timers: [], counters: [] };
}

export function emptyBlocks(): BlocksProgram {
  return { rules: [] };
}

export function emptyProgram(mode: ProgramMode): AnyProgram {
  if (mode === 'grafcet') return emptyGrafcet();
  if (mode === 'ladder') return emptyLadder();
  return emptyBlocks();
}
