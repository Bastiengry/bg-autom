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

export interface ConvoyeurPart {
  pos: number;
  type: 'A' | 'B';
}

export interface ConvoyeurState {
  kind: 'convoyeur';
  parts: ConvoyeurPart[];
  tSpawn: number;
  entered: number;
  moveActual: boolean;
  okA: number;
  okB: number;
  errs: number;
  misses: number;
}

export interface RobotState {
  kind: 'robot';
  x: number;
  painted: number;
  done: boolean;
  cycles: number;
  spills: number;
}

export interface PNiveauState {
  kind: 'pniveau';
  tSpawn: number;
  train: number | null;
  trains: number;
  barPos: number;
  danger: number;
  seenClosed: boolean;
}

export type MachineState = CuveState | FeuxState | ConvoyeurState | RobotState | PNiveauState;

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

export const BELT_SPEED = 2;
export const TRI_START = 55;
export const TRI_END = 75;
export const BELT_END = 100;
export const TRI_SPAWN_MS = 2600;
export const D_ENTEREE_END = 20;

export const ROBOT_SPEED = 2;
export const ROBOT_ZONE_A = 40;
export const ROBOT_ZONE_B = 86;
export const ROBOT_SPILL_LO = 38;
export const ROBOT_SPILL_HI = 90;
export const ROBOT_MID_LO = 38;
export const ROBOT_MID_HI = 42;
export const ROBOT_RIGHT = 90;
export const PAINT_RATE = 6;

export const PN_SPEED = 3;
export const PN_CROSS_A = 45;
export const PN_CROSS_B = 60;
export const PN_IN_A = 10;
export const PN_IN_B = 30;
export const PN_OUT = 75;
export const PN_SPAWN_MS = 12000;
export const BAR_RATE = 10;

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

function convoyeurStep(s: ConvoyeurState, o: Record<string, boolean>): ConvoyeurState {
  const parts = s.parts.map((p) => ({ ...p }));
  const moveActual = !!o.moteur;
  if (o.moteur) for (const p of parts) p.pos += BELT_SPEED;
  let okA = s.okA;
  let okB = s.okB;
  let errs = s.errs;
  let misses = s.misses;
  if (o.poussoir) {
    const idx = parts.findIndex((p) => p.pos >= TRI_START && p.pos <= TRI_END);
    if (idx >= 0) {
      const p = parts[idx];
      parts.splice(idx, 1);
      if (p.type === 'A') okA += 1;
      else errs += 1;
    }
  }
  const stayed = parts.filter((p) => {
    if (p.pos > BELT_END) {
      if (p.type === 'B') okB += 1;
      else misses += 1;
      return false;
    }
    return true;
  });
  let tSpawn = s.tSpawn + TICK_MS;
  let entered = s.entered;
  if (tSpawn >= TRI_SPAWN_MS) {
    tSpawn = 0;
    stayed.push({ pos: 0, type: entered % 2 === 0 ? 'A' : 'B' });
    entered += 1;
  }
  return { kind: 'convoyeur', parts: stayed, tSpawn, entered, moveActual, okA, okB, errs, misses };
}

function robotStep(s: RobotState, o: Record<string, boolean>): RobotState {
  let x = s.x;
  if (o.avancer && !o.reculer) x += ROBOT_SPEED;
  else if (o.reculer && !o.avancer) x -= ROBOT_SPEED;
  x = Math.max(0, Math.min(100, x));
  let painted = s.painted;
  let spills = s.spills;
  if (o.bombe && x >= ROBOT_ZONE_A && x <= ROBOT_ZONE_B) painted += PAINT_RATE;
  if (o.bombe && (x < ROBOT_SPILL_LO || x > ROBOT_SPILL_HI)) spills += 1;
  let done = s.done || painted >= 100;
  let cycles = s.cycles;
  if (x <= 2 && done) {
    cycles += 1;
    painted = 0;
    done = false;
  }
  return { kind: 'robot', x, painted: Math.min(painted, 100), done, cycles, spills };
}

function pniveauStep(s: PNiveauState, o: Record<string, boolean>): PNiveauState {
  const barPos = Math.max(0, Math.min(100, s.barPos + (o.barriere ? BAR_RATE : -BAR_RATE)));
  let tSpawn = s.tSpawn + TICK_MS;
  let train = s.train;
  let trains = s.trains;
  let danger = s.danger;
  let seenClosed = s.seenClosed;
  if (train === null && tSpawn >= PN_SPAWN_MS) {
    train = 0;
    tSpawn = 0;
  }
  if (train !== null) {
    train += PN_SPEED;
    if (train > 100) {
      trains += 1;
      train = null;
    } else if (train >= PN_CROSS_A && train <= PN_CROSS_B) {
      if (barPos < 80) danger += 1;
      else seenClosed = true;
    }
  }
  return { kind: 'pniveau', tSpawn, train, trains, barPos, danger, seenClosed };
}

export const MACHINES: Record<MachineId, MachineDef> = {
  cuve: {
    id: 'cuve',
    name: 'Remplissage de cuve',
    icon: '\u{1F4A7}',
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
    icon: '\u{1F6A6}',
    intro:
      'Deux voies croisées. Voie 1 : R1 / O1 / V1. Voie 2 : R2 / O2 / V2. Commande les deux feux avec les temporisations (TON) pour enchaîner vert, orange, rouge en sécurité.',
    vars: [
      { id: 'bMarche', label: 'MARCHE', kind: 'input', detail: 'Bouton poussoir « Marche »' },
      { id: 'bArret', label: 'ARRÊT', kind: 'input', detail: 'Bouton poussoir « Arrêt »' },
      { id: 'l1', label: 'L1 (retour)', kind: 'input', detail: 'Retour lampes voie 1 : true si une lampe de la voie 1 est réellement allumée' },
      { id: 'l2', label: 'L2 (retour)', kind: 'input', detail: 'Retour lampes voie 2 : true si une lampe de la voie 2 est réellement allumée' },
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
      { id: 'Mstop', label: 'MSTOP', kind: 'internal', detail: 'Relais arrêt (tout rouge)' },
    ],
    numericLabel: null,
    describe: (s) =>
      s.kind === 'feux'
        ? `Cycles complets : ${s.cycles} — Conflits : ${s.conflicts}`
        : '',
  },
  convoyeur: {
    id: 'convoyeur',
    name: 'Tri sur convoyeur',
    icon: '\u{1F4E6}',
    intro:
      'Un tapis amène des colis au point de tri. La zone de tri est détectée par D-TRI, et le lecteur d’étiquette FRAGILE dit si le colis est de type A (fragile). Les colis fragiles sont éjectés par le POUSSOIR, les colis normaux continuent jusqu’à la sortie B. Les retours B-MVT (tapis en mouvement) et P-RET (poussoir sorti) confirment les actionneurs réels.',
    vars: [
      { id: 'bMarche', label: 'MARCHE', kind: 'input', detail: 'Bouton poussoir « Marche »' },
      { id: 'bArret', label: 'ARRÊT', kind: 'input', detail: 'Bouton poussoir « Arrêt »' },
      { id: 'dEntree', label: 'D-ENTREE', kind: 'input', detail: 'Capteur arrivée : un colis est en tête de tapis' },
      { id: 'dTri', label: 'D-TRI', kind: 'input', detail: 'Capteur point de tri : un colis est dans la zone du poussoir' },
      { id: 'tTag', label: 'FRAGILE', kind: 'input', detail: 'Lecteur d’étiquette : le colis en zone de tri est fragile (type A)' },
      { id: 'bMvt', label: 'B-MVT (retour)', kind: 'input', detail: 'Retour mouvement : true si le tapis tourne réellement' },
      { id: 'pRet', label: 'P-RET (retour)', kind: 'input', detail: 'Retour poussoir : true si le poussoir est réellement sorti' },
      { id: 'moteur', label: 'MOTEUR', kind: 'output', detail: 'Entraîne le tapis' },
      { id: 'poussoir', label: 'POUSSOIR', kind: 'output', detail: 'Éjecte le colis fragile en zone de tri' },
      { id: 'voyVert', label: 'VOY. V', kind: 'output', detail: 'Voyant vert (tapis en marche)' },
      { id: 'voyRouge', label: 'VOY. R', kind: 'output', detail: 'Voyant rouge (défaut / arrêt)' },
      { id: 'M1', label: 'M1', kind: 'internal', detail: 'Relais interne 1 (mémoire)' },
      { id: 'M2', label: 'M2', kind: 'internal', detail: 'Relais interne 2 (mémoire)' },
      { id: 'M3', label: 'M3', kind: 'internal', detail: 'Relais interne 3 (mémoire)' },
    ],
    numericLabel: null,
    describe: (s) =>
      s.kind === 'convoyeur'
        ? `Fragiles éjectés : ${s.okA} — Normals en sortie B : ${s.okB} — Erreurs : ${s.errs} — Manqués : ${s.misses}`
        : '',
  },
  robot: {
    id: 'robot',
    name: 'Robot de peinture',
    icon: '\u{1F3A8}',
    intro:
      'Un chariot robot se déplace sur un rail au-dessus de la pièce. Capteurs : P-G (origine), P-M (début de pièce), P-D (fin de course). Sorties : AVANCER, RECULER et BOMBE (pistolet de peinture). La pièce est peinte quand la BOMBE pulvérise pendant toute la traversée. R-PIST est le retour pistolet : true si la bombe pulvérise réellement. Reviens à P-G pour lancer la pièce suivante.',
    vars: [
      { id: 'bMarche', label: 'MARCHE', kind: 'input', detail: 'Bouton poussoir « Marche »' },
      { id: 'bArret', label: 'ARRÊT', kind: 'input', detail: 'Bouton poussoir « Arrêt »' },
      { id: 'pGauche', label: 'P-G', kind: 'input', detail: 'Capteur chariot à l’origine' },
      { id: 'pMilieu', label: 'P-M', kind: 'input', detail: 'Capteur début de pièce' },
      { id: 'pDroite', label: 'P-D', kind: 'input', detail: 'Capteur fin de course droite' },
      { id: 'rp', label: 'R-PIST (retour)', kind: 'input', detail: 'Retour pistolet : true si la bombe pulvérise réellement' },
      { id: 'avancer', label: 'AVANCER', kind: 'output', detail: 'Chariot vers la droite' },
      { id: 'reculer', label: 'RECULER', kind: 'output', detail: 'Chariot vers la gauche (origine)' },
      { id: 'bombe', label: 'BOMBE', kind: 'output', detail: 'Pistolet de peinture' },
      { id: 'voyVert', label: 'VOY. V', kind: 'output', detail: 'Voyant vert (chariot à l’origine, pièce prête)' },
      { id: 'voyRouge', label: 'VOY. R', kind: 'output', detail: 'Voyant rouge (défaut)' },
      { id: 'M1', label: 'M1', kind: 'internal', detail: 'Relais interne 1 (mémoire)' },
      { id: 'M2', label: 'M2', kind: 'internal', detail: 'Relais interne 2 (mémoire)' },
      { id: 'M3', label: 'M3', kind: 'internal', detail: 'Relais interne 3 (mémoire)' },
    ],
    numericLabel: 'Peinture',
    describe: (s) =>
      s.kind === 'robot'
        ? `Chariot : ${Math.round(s.x)} % — Pièce peinte : ${Math.min(Math.round(s.painted), 100)} % — Pièces finies : ${s.cycles} — Éclaboussures : ${s.spills}`
        : '',
  },
  pniveau: {
    id: 'pniveau',
    name: 'Passage à niveau',
    icon: '\u{1F682}',
    intro:
      'Un train arrive régulièrement. D-1 (amont) annonce le train, D-2 (aval) indique qu’il a franchi le passage. Ferme la BARRIÈRE et allume les FEUX au passage, puis rouvre. B-RET est le retour barrière : true quand la barrière est réellement descendue. Le passage ne doit JAMAIS être traversé par un train barrière ouverte.',
    vars: [
      { id: 'bMarche', label: 'MARCHE', kind: 'input', detail: 'Bouton poussoir « Marche » (mise en service)' },
      { id: 'bArret', label: 'ARRÊT', kind: 'input', detail: 'Bouton poussoir « Arrêt »' },
      { id: 'dEntree', label: 'D-1 AMONT', kind: 'input', detail: 'Capteur amont : train détecté, il approche du passage' },
      { id: 'dSortie', label: 'D-2 AVAL', kind: 'input', detail: 'Capteur aval : le train a dépassé le passage' },
      { id: 'rB', label: 'B-RET (retour)', kind: 'input', detail: 'Retour barrière : true si la barrière est réellement descendue' },
      { id: 'barriere', label: 'BARRIÈRE', kind: 'output', detail: 'Ferme la barrière (true = descendre)' },
      { id: 'feux', label: 'FEUX', kind: 'output', detail: 'Feux rouges clignotants du passage' },
      { id: 'alarme', label: 'ALARME', kind: 'output', detail: 'Gyrophare de défaut (barrière bloquée, capteur brouillé…)' },
      { id: 'M1', label: 'M1', kind: 'internal', detail: 'Relais interne 1 (mémoire)' },
      { id: 'M2', label: 'M2', kind: 'internal', detail: 'Relais interne 2 (mémoire)' },
      { id: 'M3', label: 'M3', kind: 'internal', detail: 'Relais interne 3 (mémoire)' },
    ],
    numericLabel: null,
    describe: (s) =>
      s.kind === 'pniveau'
        ? `Train : ${s.train === null ? 'aucun' : `en approche (${Math.round(s.train)} %)`} — Barrière : ${Math.round(s.barPos)} % — Passages : ${s.trains} — Dangers : ${s.danger}`
        : '',
  },
};

export function initSystem(machine: MachineId): MachineState {
  if (machine === 'cuve') return { kind: 'cuve', level: 0, phase: 'idle', cycles: 0 };
  if (machine === 'feux') return { kind: 'feux', tMs: 0, phase: 'none', cycles: 0, conflicts: 0, seenV: false };
  if (machine === 'convoyeur') return { kind: 'convoyeur', parts: [], tSpawn: TRI_SPAWN_MS - 2000, entered: 0, moveActual: false, okA: 0, okB: 0, errs: 0, misses: 0 };
  if (machine === 'robot') return { kind: 'robot', x: 0, painted: 0, done: false, cycles: 0, spills: 0 };
  return { kind: 'pniveau', tSpawn: PN_SPAWN_MS - 3000, train: null, trains: 0, barPos: 0, danger: 0, seenClosed: false };
}

export function stepSystem(
  machine: MachineId,
  s: MachineState,
  outputs: Record<string, boolean>,
): MachineState {
  if (machine === 'cuve') return cuveStep(s as CuveState, outputs);
  if (machine === 'feux') return feuxStep(s as FeuxState, outputs);
  if (machine === 'convoyeur') return convoyeurStep(s as ConvoyeurState, outputs);
  if (machine === 'robot') return robotStep(s as RobotState, outputs);
  return pniveauStep(s as PNiveauState, outputs);
}

export function numericOf(machine: MachineId, s: MachineState): number {
  if (machine === 'cuve' && s.kind === 'cuve') return s.level;
  if (machine === 'robot' && s.kind === 'robot') return s.painted;
  return 0;
}

export function machineInputs(
  machine: MachineId,
  s: MachineState,
  actual: Record<string, boolean>,
): Record<string, boolean> {
  const vars: Record<string, boolean> = {};
  if (machine === 'cuve' && s.kind === 'cuve') {
    vars.sBas = s.level <= 5;
    vars.sMoyen = s.level >= 50;
    vars.sHaut = s.level >= 95;
  } else if (machine === 'feux') {
    vars.l1 = !!(actual.o1 || actual.v1 || actual.r1);
    vars.l2 = !!(actual.o2 || actual.v2 || actual.r2);
  } else if (machine === 'convoyeur' && s.kind === 'convoyeur') {
    vars.dEntree = s.parts.some((p) => p.pos <= D_ENTEREE_END);
    const inZone = s.parts.filter((p) => p.pos >= TRI_START && p.pos <= TRI_END);
    let front: ConvoyeurPart | null = null;
    for (const p of inZone) if (!front || p.pos > front.pos) front = p;
    vars.dTri = !!front;
    vars.tTag = front?.type === 'A';
    vars.bMvt = s.moveActual;
    vars.pRet = !!actual.poussoir;
  } else if (machine === 'robot' && s.kind === 'robot') {
    vars.pGauche = s.x <= 2;
    vars.pMilieu = s.x >= ROBOT_MID_LO && s.x <= ROBOT_MID_HI;
    vars.pDroite = s.x >= ROBOT_RIGHT;
    vars.rp = !!actual.bombe;
  } else if (machine === 'pniveau' && s.kind === 'pniveau') {
    vars.dEntree = s.train !== null && s.train >= PN_IN_A && s.train <= PN_IN_B;
    vars.dSortie = s.train !== null && s.train >= PN_OUT;
    vars.rB = s.barPos >= 95;
  }
  return vars;
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
  if (machine === 'convoyeur' && s.kind === 'convoyeur') {
    return [
      { label: 'Éjecter un colis fragile au point de tri (POUSSOIR)', done: s.okA >= 1 },
      { label: 'Laisser passer un colis normal jusqu’à la sortie B', done: s.okB >= 1 },
      { label: '3 colis triés sans erreur ni manqué', done: s.okA + s.okB >= 3 && s.misses === 0 && s.errs === 0 },
      { label: 'Aucun colis fragile oublié', done: s.okA >= 1 && s.misses === 0 },
    ];
  }
  if (machine === 'robot' && s.kind === 'robot') {
    return [
      { label: 'Amener le chariot sur la pièce (AVANCER)', done: s.x > 50 || s.cycles >= 1 },
      { label: 'Peindre une pièce complète (BOMBE sur la pièce)', done: s.cycles >= 1 },
      { label: 'Terminer 3 pièces', done: s.cycles >= 3 },
      { label: 'Aucune éclaboussure hors pièce', done: s.cycles >= 1 && s.spills === 0 },
    ];
  }
  if (machine === 'pniveau' && s.kind === 'pniveau') {
    return [
      { label: 'Fermer la barrière au passage d’un train (D-1)', done: s.seenClosed },
      { label: '2 trains franchis sans incident (barrière fermée)', done: s.trains >= 2 && s.danger === 0 },
      { label: 'Rouvrir la barrière après le passage', done: s.seenClosed && s.trains >= 1 && s.train === null && s.barPos <= 5 },
      { label: 'Aucun franchissement dangereux', done: s.trains >= 1 && s.danger === 0 },
    ];
  }
  return [];
}
