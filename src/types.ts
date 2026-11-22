export type VarId =
  | 'bMarche'
  | 'bArret'
  | 'sBas'
  | 'sMoyen'
  | 'sHaut'
  | 'vanneR'
  | 'pompeV'
  | 'voyVert'
  | 'voyRouge';

export type Vars = Record<VarId, boolean>;

export interface VarDef {
  id: VarId;
  label: string;
  kind: 'input' | 'output';
  detail: string;
}

export const VAR_DEFS: VarDef[] = [
  { id: 'bMarche', label: 'MARCHE', kind: 'input', detail: 'Bouton poussoir « Marche »' },
  { id: 'bArret', label: 'ARRÊT', kind: 'input', detail: 'Bouton poussoir « Arrêt »' },
  { id: 'sBas', label: 'BS', kind: 'input', detail: 'Capteur niveau bas (≤ 5 %)' },
  { id: 'sMoyen', label: 'BM', kind: 'input', detail: 'Capteur niveau moyen (≥ 50 %)' },
  { id: 'sHaut', label: 'BH', kind: 'input', detail: 'Capteur niveau haut (≥ 95 %)' },
  { id: 'vanneR', label: 'VANNE R', kind: 'output', detail: 'Vanne de remplissage' },
  { id: 'pompeV', label: 'POMPE V', kind: 'output', detail: 'Pompe de vidange' },
  { id: 'voyVert', label: 'VOY. V', kind: 'output', detail: 'Voyant vert' },
  { id: 'voyRouge', label: 'VOY. R', kind: 'output', detail: 'Voyant rouge' },
];

export const VAR_LABELS: Record<VarId, string> = Object.fromEntries(
  VAR_DEFS.map((v) => [v.id, v.label]),
) as Record<VarId, string>;

export const INPUT_IDS = VAR_DEFS.filter((v) => v.kind === 'input').map((v) => v.id);
export const OUTPUT_IDS = VAR_DEFS.filter((v) => v.kind === 'output').map((v) => v.id);

export interface Condition {
  varId: VarId;
  negated: boolean;
}

export type ProgramMode = 'grafcet' | 'ladder' | 'blocks';

export const MODE_LABELS: Record<ProgramMode, string> = {
  grafcet: 'Grafcet',
  ladder: 'Ladder (LD)',
  blocks: 'Blocs simples',
};

export interface GrafcetNode {
  actions: VarId[];
  transition: Condition[];
}

export interface GrafcetProgram {
  nodes: GrafcetNode[];
  loopTo: number;
}

export interface LadderRung {
  output: VarId;
  terms: Condition[];
  junctions: ('AND' | 'OR')[];
}

export interface LadderProgram {
  rungs: LadderRung[];
}

export interface BlockRule {
  when: Condition;
  then: VarId[];
}

export interface BlocksProgram {
  rules: BlockRule[];
}

export type AnyProgram = GrafcetProgram | LadderProgram | BlocksProgram;

export function emptyGrafcet(): GrafcetProgram {
  return { nodes: [{ actions: [], transition: [] }], loopTo: 0 };
}

export function emptyLadder(): LadderProgram {
  return { rungs: [] };
}

export function emptyBlocks(): BlocksProgram {
  return { rules: [] };
}
