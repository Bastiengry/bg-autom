import assert from 'node:assert';
import { test } from '@jest/globals';
import { runProgram, initInterpState } from '../src/engine/interpreters';
import { initSystem, stepSystem, machineInputs, numericOf } from '../src/system/machines';
import type { MachineId, MachineState } from '../src/system/machines';
import { exampleGrafcet, exampleLadder, exampleBlocks } from '../src/programs/examples';

const TICKS_PER_S = 10;
type Mode = 'grafcet' | 'ladder' | 'blocks';
const MODES: Mode[] = ['grafcet', 'ladder', 'blocks'];

type Program = ReturnType<typeof exampleGrafcet>;
type Interp = ReturnType<typeof initInterpState>;

const programFor = (machine: MachineId, mode: Mode): Program =>
  mode === 'grafcet' ? exampleGrafcet(machine) : (mode === 'ladder' ? exampleLadder(machine) : exampleBlocks(machine)) as unknown as Program;

type Res = { sys: MachineState; interp: Interp; outputs: Record<string, boolean> };

const tick = (
  machine: MachineId,
  mode: Mode,
  program: Program,
  vars: Record<string, boolean>,
  sys: MachineState,
  interp: Interp,
): Res => {
  const inputs = { ...machineInputs(machine, sys, {}), ...vars };
  const ctx = { level: numericOf(machine, sys) };
  const r = runProgram(mode, program as never, inputs, interp, ctx);
  return {
    sys: stepSystem(machine, sys, r.outputs, inputs),
    interp: r.state,
    outputs: r.outputs as Record<string, boolean>,
  };
};

// Variables de commande par machine (bAru pilote le test ; les capteurs reels
// viennent de machineInputs et peuvent etre surcharges via vars).
function driveVars(machine: MachineId, aru: boolean): Record<string, boolean> {
  switch (machine) {
    case 'cuve':
      return { bMarche: true, bAru: aru };
    case 'feux':
      return { bMarche: true, bAru: aru };
    case 'convoyeur':
      return { bMarche: true, bAru: aru };
    case 'robot':
      return { bMarche: true, bAru: aru };
    case 'pniveau':
      return { dEntree: true, dSortie: false, bAru: aru };
    case 'ecluse':
      return { bMarche: true, dAm: true, dAv: false, dSas: false, bAru: aru };
  }
}

// Sorties sures attendues des que bAru passe a false (1 a 2 scans).
function safeAssert(machine: MachineId, mode: Mode, out: Record<string, boolean>) {
  const off = (id: string) =>
    assert(!out[id], `${machine}/${mode}: ${id} doit etre coupee apres AU, out ${JSON.stringify(out)}`);
  const on = (id: string) =>
    assert(!!out[id], `${machine}/${mode}: ${id} doit etre activee apres AU, out ${JSON.stringify(out)}`);
  switch (machine) {
    case 'cuve':
      off('vanneR');
      off('pompeV');
      if (mode !== 'grafcet') on('voyRouge');
      break;
    case 'feux':
      on('r1');
      on('r2');
      off('v1');
      off('v2');
      off('o1');
      off('o2');
      break;
    case 'convoyeur':
      off('moteur');
      off('poussoir');
      on('voyRouge');
      break;
    case 'robot':
      off('avancer');
      off('reculer');
      off('bombe');
      on('voyRouge');
      break;
    case 'pniveau':
      on('barriere');
      on('feux');
      if (mode !== 'grafcet') on('alarme');
      break;
    case 'ecluse':
      off('mPmon');
      off('mPval');
      off('vRem');
      off('vVid');
      if (mode === 'ladder' || mode === 'blocks') on('alarme');
      break;
  }
}

// Activite observable pendant la phase saine (preuve que le programme etait actif).
function activitySeen(out: Record<string, boolean>, seen: Record<string, boolean>) {
  for (const id of ['vanneR', 'v1', 'v2', 'o1', 'o2', 'moteur', 'avancer', 'reculer', 'barriere', 'vRem']) {
    if (out[id]) seen[id] = true;
  }
}

function runAru(machine: MachineId, mode: Mode) {
  const program = programFor(machine, mode);
  let sys = initSystem(machine);
  let interp = initInterpState();
  const seen: Record<string, boolean> = {};
  // Phase saine : AU ferme (bAru = true), la sequence demarre.
  for (let i = 0; i < 20; i++) {
    const r = tick(machine, mode, program, driveVars(machine, true), sys, interp);
    sys = r.sys;
    interp = r.interp;
    activitySeen(r.outputs, seen);
  }
  const expectedActivity: Record<MachineId, string[]> = {
    cuve: ['vanneR'],
    feux: ['v1', 'v2', 'o1', 'o2'],
    convoyeur: ['moteur'],
    robot: ['avancer', 'reculer'],
    pniveau: ['barriere'],
    ecluse: ['vRem'],
  };
  assert(
    expectedActivity[machine].some((k) => seen[k]),
    `aru ${machine}/${mode}: aucune activite observee avant AU, seen ${JSON.stringify(seen)}`,
  );
  // Coupure AU (bAru = false) : etat sur en 1 a 2 scans.
  let safe = false;
  let last: Res | null = null;
  for (let i = 0; i < 3 && !safe; i++) {
    const r = tick(machine, mode, program, driveVars(machine, false), sys, interp);
    sys = r.sys;
    interp = r.interp;
    last = r;
    try {
      safeAssert(machine, mode, r.outputs);
      safe = true;
    } catch {
      // l'etat sur peut prendre un scan de plus (memoire a retomber)
    }
  }
  assert(last, 'aru: aucun cycle apres coupure AU');
  safeAssert(machine, mode, last.outputs);
  assert(safe, `aru ${machine}/${mode}: etat sur jamais atteint apres AU`);
}

for (const machine of ['cuve', 'feux', 'convoyeur', 'robot', 'pniveau', 'ecluse'] as MachineId[]) {
  for (const mode of MODES) {
    test(`AU NF ${machine} (${mode})`, () => runAru(machine, mode));
  }
}

// Arret ARRÊT de categorie 1 (cuve, Grafcet) : front montant de bArret pendant
// le remplissage -> la vanne TERMINE de remplir jusqu'a sHaut, la pompe de
// vidange ne demarre jamais, puis attente ; un nouveau MARCHE relance le cycle.
test('categorie 1 cuve (grafcet)', () => {
  const program = exampleGrafcet('cuve');
  const machine: MachineId = 'cuve';
  let sys = initSystem(machine);
  let interp = initInterpState();
  let pompeSeenBeforeRestart = false;
  let vanneAfterStop = 0;
  let finished = false;
  let resumed = false;
  for (let i = 0; i < 40 * TICKS_PER_S; i++) {
    // Impulsion ARRÊT (front montant) pendant le remplissage, cycles 20-22 :
    // l'operateur relache aussi MARCHE (arret demande).
    const arret = i >= 20 && i < 23;
    const marche = i < 20 || i >= 260; // rappui MARCHE plus tard
    const vars = { bMarche: marche, bArret: arret, bAru: true };
    const r = tick(machine, 'grafcet', program, vars, sys, interp);
    sys = r.sys;
    interp = r.interp;
    if (i >= 20 && i < 260) {
      // Pendant l'arret demande : fin de phase autorisee, pas de nouvelle phase.
      if (r.outputs.pompeV) pompeSeenBeforeRestart = true;
      if (r.outputs.vanneR) vanneAfterStop++;
      if (sys.kind === 'cuve' && sys.level >= 95 && !r.outputs.vanneR) finished = true;
    } else if (i >= 260 && (r.outputs.vanneR || r.outputs.pompeV)) {
      resumed = true;
    }
  }
  assert(vanneAfterStop > 0, 'categorie 1: la vanne doit continuer de remplir apres le front ARRÊt');
  assert(finished, 'categorie 1: la cuve doit atteindre sHaut (fin de phase) pendant l\u2019arret');
  assert(!pompeSeenBeforeRestart, 'categorie 1: la pompe de vidange ne doit pas demarrer pendant l\u2019arret');
  assert(resumed, 'categorie 1: un nouveau MARCHE doit relancer le cycle');
});

// Repos feux : sans MARCHE, les deux voies sont au rouge (etat sur).
test('feux repos tout rouge (grafcet)', () => {
  const program = exampleGrafcet('feux');
  const machine: MachineId = 'feux';
  let sys = initSystem(machine);
  let interp = initInterpState();
  for (let i = 0; i < 10; i++) {
    const r = tick(machine, 'grafcet', program, { bMarche: false, bAru: true }, sys, interp);
    sys = r.sys;
    interp = r.interp;
    assert(r.outputs.r1 && r.outputs.r2, `feux repos: les deux voies au rouge attendues, out ${JSON.stringify(r.outputs)}`);
    assert(!r.outputs.v1 && !r.outputs.v2 && !r.outputs.o1 && !r.outputs.o2, 'feux repos: vert/orange doivent etre off');
  }
});
