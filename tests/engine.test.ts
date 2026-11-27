import assert from 'node:assert';
import { runProgram, initInterpState } from '../src/engine/interpreters';
import { initSystem, stepSystem, machineInputs, numericOf } from '../src/system/machines';
import { exampleGrafcet, exampleLadder, exampleBlocks } from '../src/programs/examples';

const TICKS_PER_S = 10;
const tick = (machine, vars, sys, interp, mode, program, actual = {}) => {
  const inputs = { ...machineInputs(machine, sys, actual), ...vars };
  const ctx = { level: numericOf(machine, sys) };
  const res = runProgram(mode, program, inputs, interp, ctx);
  return { sys: stepSystem(machine, sys, res.outputs, inputs), interp: res.state, outputs: res.outputs };
};

function pulseEnter(vars, id) { vars[id] = true; }
function pulseLeave(vars, id) { vars[id] = false; }

function runCuveGrafcet() {
  const program = exampleGrafcet('cuve');
  const machine = 'cuve';
  let sys = initSystem(machine);
  let interp = initInterpState();
  const vars = {};
  const TOTAL = 40 * TICKS_PER_S;
  for (let i = 0; i < TOTAL; i++) {
    pulseEnter(vars, 'bMarche');
    if (i > 3) pulseLeave(vars, 'bMarche');
    ({ sys, interp } = tick(machine, vars, sys, interp, 'grafcet', program));
  }
  assert(sys.kind === 'cuve');
  assert(sys.cycles >= 2, `grafcet cuve: cycles attendus >= 2, obtenu ${sys.cycles}`);
  console.log(`\u2713 Grafcet cuve : ${sys.cycles} cycles complets`);
}

function runCuveLadder() {
  const program = exampleLadder('cuve');
  const machine = 'cuve';
  let sys = initSystem(machine);
  let interp = initInterpState();
  const vars = {};
  const TOTAL = 30 * TICKS_PER_S;
  for (let i = 0; i < TOTAL; i++) {
    if (i < 4) pulseEnter(vars, 'bMarche'); else pulseLeave(vars, 'bMarche');
    ({ sys, interp } = tick(machine, vars, sys, interp, 'ladder', program));
  }
  assert(sys.kind === 'cuve');
  assert(sys.cycles >= 1, `ladder cuve: cycles attendus >= 1, obtenu ${sys.cycles}`);
  assert(sys.level > 0 && sys.level < 100);
  console.log(`\u2713 Ladder cuve : ${sys.cycles} cycles, niveau ${Math.round(sys.level)} %`);
}

function runFeuxGrafcet() {
  const program = exampleGrafcet('feux');
  const machine = 'feux';
  let sys = initSystem(machine);
  let interp = initInterpState();
  const vars = {};
  const TOTAL = 30 * TICKS_PER_S;
  for (let i = 0; i < TOTAL; i++) {
    if (i < 4) pulseEnter(vars, 'bMarche'); else pulseLeave(vars, 'bMarche');
    ({ sys, interp } = tick(machine, vars, sys, interp, 'grafcet', program));
  }
  if (vars.bMarche) pulseEnter(vars, 'bMarche'); else pulseLeave(vars, 'bMarche');
  assert(sys.kind === 'feux');
  assert(sys.cycles >= 1, `grafcet feux: cycles attendus >= 1, obtenu ${sys.cycles}`);
  assert(sys.seenV, 'grafcet feux: un feu vert doit s\u2019allumer');
  console.log(`\u2713 Grafcet feux : ${sys.cycles} cycles, conflits ${sys.conflicts}`);
}

function runFeuxLadder() {
  const program = exampleLadder('feux');
  const machine = 'feux';
  let sys = initSystem(machine);
  let interp = initInterpState();
  const vars = {};
  const TOTAL = 30 * TICKS_PER_S;
  for (let i = 0; i < TOTAL; i++) {
    if (i < 4) pulseEnter(vars, 'bMarche'); else pulseLeave(vars, 'bMarche');
    ({ sys, interp } = tick(machine, vars, sys, interp, 'ladder', program));
  }
  if (vars.bMarche) pulseEnter(vars, 'bMarche'); else pulseLeave(vars, 'bMarche');
  assert(sys.kind === 'feux');
  assert(sys.cycles >= 1, `ladder feux: cycles attendus >= 1, obtenu ${sys.cycles}`);
  assert(sys.conflicts === 0, `ladder feux: aucun conflit attendu, obtenu ${sys.conflicts}`);
  console.log(`\u2713 Ladder feux : ${sys.cycles} cycles, 0 conflit`);
}

function runCuveBlocks() {
  const program = exampleBlocks('cuve');
  const machine = 'cuve';
  let sys = initSystem(machine);
  let interp = initInterpState();
  const vars = {};
  const TOTAL = 15 * TICKS_PER_S;
  for (let i = 0; i < TOTAL; i++) {
    ({ sys, interp } = tick(machine, vars, sys, interp, 'blocks', program));
  }
  if (vars.bMarche) pulseEnter(vars, 'bMarche'); else pulseLeave(vars, 'bMarche');
  assert(sys.kind === 'cuve');
  assert(sys.level === 95, `blocks cuve: la cuve doit rester a 95 % (BH), obtenu ${sys.level}`);
  console.log(`\u2713 Blocks cuve : la vanne s\u2019arr\u00eate exactement \u00e0 BH = ${sys.level} %`);
}

function runFeuxBlocks() {
  const program = exampleBlocks('feux');
  const machine = 'feux';
  let sys = initSystem(machine);
  let interp = initInterpState();
  const vars = {};
  for (let i = 0; i < 3 * TICKS_PER_S; i++) {
    if (i < 4) pulseEnter(vars, 'bMarche'); else pulseLeave(vars, 'bMarche');
    ({ sys, interp } = tick(machine, vars, sys, interp, 'blocks', program));
  }
  if (vars.bMarche) pulseEnter(vars, 'bMarche'); else pulseLeave(vars, 'bMarche');
  assert(sys.kind === 'feux');
  assert(sys.conflicts === 0, `blocks feux: 0 conflit attendu, obtenu ${sys.conflicts}`);
  assert(sys.seenV, 'blocks feux: un feu vert doit s\u2019allumer');
  console.log(`\u2713 Blocks feux : phase ${sys.phase}, 0 conflit`);
}

test('runCuveGrafcet', () => runCuveGrafcet());
test('runCuveLadder', () => runCuveLadder());
test('runCuveBlocks', () => runCuveBlocks());
test('runFeuxGrafcet', () => runFeuxGrafcet());
test('runFeuxLadder', () => runFeuxLadder());
test('runFeuxBlocks', () => runFeuxBlocks());


function runLadderCuveStop() {
  const program = exampleLadder('cuve');
  const machine = 'cuve';
  let sys = initSystem(machine);
  let interp = initInterpState();
  let arret = false;
  let arretAt = -1;
  let vanneStopped = false;
  for (let i = 0; i < 300; i++) {
    const vars = { bMarche: i < 4 || arret, bArret: arret };
    if (i === 60) arret = true;
    if (i === 66) { arret = false; arretAt = i; }
    if (i === 70) { vars.bMarche = true; if (i === 70) vars.bArret = false; }
    if (i > 72) vars.bMarche = false;
    const r = runProgram('ladder', program, vars, interp, { level: sys.level });
    interp = r.state;
    sys = stepSystem(machine, sys, r.outputs);
    if (i > 62 && i <= 66) {
      assert(!r.outputs.vanneR, `ladder cuve stop: vanne doit couper pendant ARR\u00eat (cycle ${i})`);
      vanneStopped = true;
    }
  }
  assert(vanneStopped, 'ladder cuve stop: la vanne aurait d\u00eatre coup\u00e9e pendant ARR\u00eat');
  assert(sys.kind === 'cuve');
  console.log(`\u2713 Ladder cuve : ARR\u00eat coupe la vanne (niveau fig\u00e9 \u00e0 ${Math.round(sys.level)} %, cycles ${sys.cycles})`);
}

function runFeuxLadderStop() {
  const program = exampleLadder('feux');
  const machine = 'feux';
  let sys = initSystem(machine);
  let interp = initInterpState();
  let arret = false;
  let arretAt = -1;
  let allRed = false;
  for (let i = 0; i < 300; i++) {
    const vars = { bMarche: i < 4 || i >= arretAt + 30, bArret: arret };
    if (i === 60) { arret = true; arretAt = i; }
    if (i === 66) arret = false;
    const r = runProgram('ladder', program, vars, interp, { level: 0 });
    interp = r.state;
    sys = stepSystem(machine, sys, r.outputs);
    if (i > 80 && i < 85) {
      assert(r.outputs.r1 && r.outputs.r2, `ladder feux stop: r1 et r2 rouges attendus (cycle ${i}), out ${JSON.stringify(r.outputs)}`);
      assert(!r.outputs.v1 && !r.outputs.v2 && !r.outputs.o1 && !r.outputs.o2, 'ladder feux stop: vert/orange doivent \u00eatre off pendant ARR\u00eat');
      allRed = true;
    }
  }
  assert(allRed, 'ladder feux stop: la phase tout rouge n\u2019a pas \u00e9t\u00e9 observ\u00e9e');
  console.log(`\u2713 Ladder feux : ARR\u00eat \u2192 tout rouge, puis reprise au rappui MARCHE (cycles ${sys.cycles})`);
}

function runFeuxGrafcetStop() {
  const program = exampleGrafcet('feux');
  const machine = 'feux';
  let sys = initSystem(machine);
  let interp = initInterpState();
  for (let i = 0; i < 60; i++) {
    const vars = { bMarche: i < 4, bArret: i >= 20 && i < 26 };
    const r = runProgram('grafcet', program, vars, interp, { level: 0 });
    interp = r.state;
    sys = stepSystem(machine, sys, r.outputs);
    if (i === 24) {
      assert(interp.active.length === 1 && interp.active[0] === 0,
        `grafcet feux stop: retour \u00e0 l'\u00e9tape initiale attendu, actif ${JSON.stringify(interp.active)}`);
      assert(!r.outputs.v1 && !r.outputs.v2 && !r.outputs.r1 && !r.outputs.r2,
        'grafcet feux stop: toutes les sorties doivent \u00eatre coup\u00e9es \u00e0 l\u2019\u00e9tape initiale');
    }
  }
  console.log('\u2713 Grafcet feux : ARR\u00eat \u2192 retour \u00e0 la premi\u00e8re \u00e9tape (tout \u00e9teint), MARCHE relance');
}

test('runLadderCuveStop', () => runLadderCuveStop());
test('runFeuxLadderStop', () => runFeuxLadderStop());
test('runFeuxGrafcetStop', () => runFeuxGrafcetStop());



function runCuveIncoherenceDetect() {
  const v = (x) => ({ type: 'var', varId: x, negated: false });
  const notV = (x) => ({ type: 'var', varId: x, negated: true });
  const program = { rules: [{ when: [v('sHaut'), notV('sMoyen')], then: ['voyRouge'] }] };
  const machine = 'cuve';
  let sys = initSystem(machine);
  let interp = initInterpState();
  const vars = { sHaut: true, sMoyen: false, bMarche: false, sBas: false };
  const before = runProgram('blocks', program, vars, interp, { level: 20 });
  initSystem;
  assert(before.outputs.voyRouge === true, 'cuve incident: BH sans BM doit allumer VOY. R');
  const sane = { sHaut: true, sMoyen: true, bMarche: false, sBas: false };
  const after = runProgram('blocks', program, sane, interp, { level: 95 });
  assert(!after.outputs.voyRouge, 'cuve incident: BH avec BM = coh\u00e9rent, pas d\u2019alarme');
  console.log('\u2713 Incident cuve : BH forc\u00e9 sans BM \u2192 incoh\u00e9rence d\u00e9tectable (VOY. R)');
}

function runFeuxFeedbackSafeMode() {
  const v = (x) => ({ type: 'var', varId: x, negated: false });
  const notV = (x) => ({ type: 'var', varId: x, negated: true });
  const program = {
    timers: [],
    counters: [],
    rungs: [
      { output: 'r1', coilType: 'coil', terms: [v('l1'), notV('v1'), notV('o1')], junctions: ['AND', 'AND'] },
      { output: 'r2', coilType: 'coil', terms: [v('l1')], junctions: [] },
    ],
  };
  let interp = initInterpState();
  const tampered = { bMarche: false, bArret: false, l1: true, l2: false, v1: false, o1: false };
  const r = runProgram('ladder', program, tampered, interp, { level: 0 });
  assert(r.outputs.r1 && r.outputs.r2, 'feux incident: for\u00e7age V1 d\u00e9tect\u00e9 via L1 \u2192 tout rouge');
  const normal = { bMarche: false, bArret: false, l1: false, l2: false, v1: false, o1: false };
  const r2 = runProgram('ladder', program, normal, interp, { level: 0 });
  assert(!r2.outputs.r1 && !r2.outputs.r2, 'feux incident: pas de fausse alerte au repos');
  console.log('\u2713 Incident feux : for\u00e7age de sortie d\u00e9tect\u00e9 via retour lampe \u2192 mode s\u00fbr (R1+R2)');
}

test('runCuveIncoherenceDetect', () => runCuveIncoherenceDetect());
test('runFeuxFeedbackSafeMode', () => runFeuxFeedbackSafeMode());


function runConvoyeurGrafcet() {
  const program = exampleGrafcet('convoyeur');
  const machine = 'convoyeur';
  let sys = initSystem(machine);
  let interp = initInterpState();
  for (let i = 0; i < 40 * TICKS_PER_S; i++) {
    const press = i < 4 || (i > 200 && i < 210);
    ({ sys, interp } = tick(machine, { bMarche: press }, sys, interp, 'grafcet', program));
  }
  if (sys.kind !== 'convoyeur') return;
  assert(sys.okA >= 1, `grafcet convoyeur: au moins un fragile \u00e9ject\u00e9, okA ${sys.okA}`);
  assert(sys.okB >= 1, `grafcet convoyeur: au moins un normal en sortie B, okB ${sys.okB}`);
  assert(sys.misses === 0 && sys.errs === 0, `grafcet convoyeur: 0 manqu\u00e9/erreur, obtenu ${sys.misses}/${sys.errs}`);
  console.log(`\u2713 Grafcet convoyeur : fragiles \u00e9ject\u00e9s ${sys.okA}, normaux ${sys.okB}, 0 erreur`);
}

function runConvoyeurLadder() {
  const program = exampleLadder('convoyeur');
  const machine = 'convoyeur';
  let sys = initSystem(machine);
  let interp = initInterpState();
  let interped = null;
  for (let i = 0; i < 40 * TICKS_PER_S; i++) {
    const press = i < 4 || (i > 200 && i < 210);
    const r = tick(machine, { bMarche: press }, sys, interp, 'ladder', program, interped ? interped : {});
    interped = r.outputs;
    sys = r.sys;
    interp = r.interp;
  }
  assert(sys.kind === 'convoyeur');
  assert(sys.okA >= 1 && sys.okB >= 1, `ladder convoyeur: okA ${sys.okA} okB ${sys.okB}`);
  assert(sys.misses === 0 && sys.errs === 0, `ladder convoyeur: 0 manqu\u00e9/erreur, obtenu ${sys.misses}/${sys.errs}`);
  console.log(`\u2713 Ladder convoyeur : fragiles \u00e9ject\u00e9s ${sys.okA}, normaux ${sys.okB}, 0 erreur`);
}

function runConvoyeurBlocks() {
  const program = exampleBlocks('convoyeur');
  const machine = 'convoyeur';
  let sys = initSystem(machine);
  let interp = initInterpState();
  for (let i = 0; i < 30 * TICKS_PER_S; i++) {
    ({ sys, interp } = tick(machine, {}, sys, interp, 'blocks', program));
  }
  if (sys.kind !== 'convoyeur') return;
  assert(sys.okA >= 1 && sys.okB >= 1, `blocks convoyeur: okA ${sys.okA} okB ${sys.okB}`);
  assert(sys.misses === 0 && sys.errs === 0, `blocks convoyeur: 0 manqu\u00e9/erreur, obtenu ${sys.misses}/${sys.errs}`);
  console.log(`\u2713 Blocks convoyeur : fragiles ${sys.okA}, normaux ${sys.okB}, 0 erreur (sans m\u00e9moire)`);
}

function runRobotGrafcet() {
  const program = exampleGrafcet('robot');
  const machine = 'robot';
  let sys = initSystem(machine);
  let interp = initInterpState();
  for (let i = 0; i < 45 * TICKS_PER_S; i++) {
    const press = i < 4;
    ({ sys, interp } = tick(machine, { bMarche: press }, sys, interp, 'grafcet', program));
  }
  if (sys.kind !== 'robot') return;
  assert(sys.cycles >= 2, `grafcet robot: 2 pi\u00e8ces peintes attendues, obtenu ${sys.cycles}`);
  assert(sys.spills === 0, `grafcet robot: 0 \u00e9claboussure attendue, obtenu ${sys.spills}`);
  console.log(`\u2713 Grafcet robot : ${sys.cycles} pi\u00e8ces peintes, 0 \u00e9claboussure`);
}

function runRobotLadder() {
  const program = exampleLadder('robot');
  const machine = 'robot';
  let sys = initSystem(machine);
  let interp = initInterpState();
  let prevOut = {};
  for (let i = 0; i < 45 * TICKS_PER_S; i++) {
    const press = i < 4;
    const r = tick(machine, { bMarche: press }, sys, interp, 'ladder', program, prevOut);
    prevOut = r.outputs;
    sys = r.sys;
    interp = r.interp;
  }
  assert(sys.kind === 'robot');
  assert(sys.cycles >= 2, `ladder robot: 2 pi\u00e8ces peintes attendues, obtenu ${sys.cycles}`);
  assert(sys.spills === 0, `ladder robot: 0 \u00e9claboussure attendue, obtenu ${sys.spills}`);
  console.log(`\u2713 Ladder robot : ${sys.cycles} pi\u00e8ce(s) peinte(s), 0 \u00e9claboussure`);
}

function runPniveauGrafcet() {
  const program = exampleGrafcet('pniveau');
  const machine = 'pniveau';
  let sys = initSystem(machine);
  let interp = initInterpState();
  for (let i = 0; i < 40 * TICKS_PER_S; i++) {
    ({ sys, interp } = tick(machine, {}, sys, interp, 'grafcet', program));
  }
  assert(sys.kind === 'pniveau');
  assert(sys.trains >= 2, `grafcet pniveau: 2 trains attendus, obtenu ${sys.trains}`);
  assert(sys.seenClosed, 'grafcet pniveau: la barri\u00e8re doit \u00eatre ferm\u00e9e au passage');
  assert(sys.danger === 0, `grafcet pniveau: 0 danger attendu, obtenu ${sys.danger}`);
  console.log(`\u2713 Grafcet passage \u00e0 niveau : ${sys.trains} trains, barri\u00e8re ferm\u00e9e, 0 danger`);
}

function runPniveauLadder() {
  const program = exampleLadder('pniveau');
  const machine = 'pniveau';
  let sys = initSystem(machine);
  let interp = initInterpState();
  let interped = null;
  let falseAlarm = false;
  for (let i = 0; i < 40 * TICKS_PER_S; i++) {
    const r = tick(machine, {}, sys, interp, 'ladder', program, interped ? interped : {});
    interped = r.outputs;
    sys = r.sys;
    interp = r.interp;
    if (!sys.seenClosed && r.outputs.alarme) falseAlarm = true;
  }
  assert(sys.kind === 'pniveau');
  assert(sys.trains >= 2 && sys.seenClosed && sys.danger === 0, `ladder pniveau: trains ${sys.trains} danger ${sys.danger}`);
  assert(!falseAlarm, 'ladder pniveau: fausse alarme d\u00e9tect\u00e9e');
  console.log(`\u2713 Ladder passage \u00e0 niveau : ${sys.trains} trains, 0 danger, pas de fausse alarme`);
}

test('runConvoyeurGrafcet', () => runConvoyeurGrafcet());
test('runConvoyeurLadder', () => runConvoyeurLadder());
test('runConvoyeurBlocks', () => runConvoyeurBlocks());
test('runRobotGrafcet', () => runRobotGrafcet());
test('runRobotLadder', () => runRobotLadder());
test('runPniveauGrafcet', () => runPniveauGrafcet());
test('runPniveauLadder', () => runPniveauLadder());


function runConvoyeurIncoherenceMoteur() {
  const program = exampleLadder('convoyeur');
  let interp = initInterpState();
  let interped = null;
  const vars = { bMarche: true, bArret: false, dEntree: true, dTri: false, tTag: false, bMvt: false, pRet: false };
  let moteurOn = false;
  for (let i = 0; i < 20; i++) {
    const r = runProgram('ladder', program, { ...vars, ...(interped ? {} : {}) }, interp, { level: 0 });
    interped = r.outputs;
    interp = r.state;
    if (r.outputs.moteur) moteurOn = true;
    if (i > 5) {
      assert(!r.outputs.moteur, `convoyeur incident: moteur doit couper (cycle ${i})`);
      assert(r.outputs.voyRouge, `convoyeur incident: VOY. R attendu (cycle ${i})`);
    }
  }
  assert(moteurOn, 'convoyeur incident: le moteur a bien \u00e9t\u00e9 command\u00e9 avant d\u00e9tection');
  console.log('\u2713 Incident convoyeur : MOTEUR command\u00e9 sans B-MVT \u2192 d\u00e9faut m\u00e9moris\u00e9, moteur coup\u00e9');
}

function runPniveauBarriereBloqueeAlarme() {
  const program = exampleLadder('pniveau');
  let interp = initInterpState();
  const vars = { bMarche: false, bArret: false, dEntree: true, dSortie: false, rB: false };
  let alarm = false;
  for (let i = 0; i < 40; i++) {
    const r = runProgram('ladder', program, vars, interp, { level: 0 });
    interp = r.state;
    if (i > 3 && i < 15) assert(!r.outputs.alarme, `pniveau: pas de fausse alarme en dessous de 2 s (cycle ${i})`);
    if (r.outputs.alarme) { alarm = true; break; }
  }
  assert(alarm, 'pniveau incident: ALARME attendue quand la barri\u00e8re command\u00e9e ne descends pas');
  console.log('\u2713 Incident passage \u00e0 niveau : BARRI\u00c8RE command\u00e9e sans B-RET (TON 2 s) \u2192 ALARME');
}

test('runConvoyeurIncoherenceMoteur', () => runConvoyeurIncoherenceMoteur());
test('runPniveauBarriereBloqueeAlarme', () => runPniveauBarriereBloqueeAlarme());


function runCuveAruLadder() {
  const program = exampleLadder('cuve');
  const machine = 'cuve';
  let sys = initSystem(machine);
  let interp = initInterpState();
  let reacqAt = -1;
  let marAt = -1;
  let windowSeen = false;
  let lockedSeen = false;
  for (let i = 0; i < 200; i++) {
    const vars = { bMarche: i < 4 || i >= marAt && i < marAt + 4, bArret: false, bAru: !(i >= 60 && i < 80) };
    if (i === 80) reacqAt = i;
    if (reacqAt >= 0 && marAt < 0 && i === reacqAt + 40) marAt = i;
    const r = runProgram('ladder', program, vars, interp, { level: sys.level });
    interp = r.state;
    sys = stepSystem(machine, sys, r.outputs, vars);
    if (i > 61 && i < 80) {
      assert(!r.outputs.vanneR && !r.outputs.pompeV, `ladder cuve AU: sorties coupees pendant AU (cycle ${i}), out ${JSON.stringify(r.outputs)}`);
      windowSeen = true;
    }
    if (i >= 82 && i < reacqAt + 40 - 1) {
      assert(!r.outputs.vanneR, `ladder cuve AU: vanne doit rester coupee apres reacquit sans MARCHE (cycle ${i})`);
    }
    if (i > marAt + 3 && marAt > 0 && r.outputs.vanneR) lockedSeen = true;
  }
  assert(windowSeen, 'ladder cuve AU: fenêtre AU non observeée');
  assert(sys.kind === 'cuve' && sys.aruStopped, 'ladder cuve AU: sys.aruStopped attendu');
  assert(sys.restartSeen, 'ladder cuve AU: sys.restartSeen attendu après acquit MARCHE');
  assert(lockedSeen, 'ladder cuve AU: redémarrage attendu après impulsion MARCHE');
  console.log(`\u2713 Ladder cuve AU NF : coupure au milieu d\u2019un cycle, verrouillage jusqu\u2019à l\u2019acquit MARCHE (niveau ${Math.round(sys.level)} %)`);
}

function runCuveAruGrafcet() {
  const program = exampleGrafcet('cuve');
  const machine = 'cuve';
  let sys = initSystem(machine);
  let interp = initInterpState();
  let runningSeen = false;
  for (let i = 0; i < 60; i++) {
    const vars = { bMarche: i < 6, bArret: false, bAru: !(i >= 20 && i < 26) };
    const r = runProgram('grafcet', program, vars, interp, { level: sys.level });
    interp = r.state;
    sys = stepSystem(machine, sys, r.outputs, vars);
    if (i === 19) {
      assert(interp.active.length === 1 && interp.active[0] !== 0,
        `grafcet cuve AU: une étape active attendue avant l\u2019AU, actif ${JSON.stringify(interp.active)}`);
      runningSeen = true;
    }
    if (i === 21) {
      assert(interp.active.length === 1 && interp.active[0] === 0,
        `grafcet cuve AU: retour à l\u2019étape initiale attendu, actif ${JSON.stringify(interp.active)}`);
      assert(!r.outputs.vanneR && !r.outputs.pompeV, 'grafcet cuve AU: sorties coupées à l\u2019étape initiale');
    }
  }
  assert(runningSeen, 'grafcet cuve AU: le Grafcet tournait avant l\u2019AU');
  assert(sys.kind === 'cuve' && sys.aruSeen, 'grafcet cuve AU: sys.aruSeen attendu');
  console.log('\u2713 Grafcet cuve AU NF : branche alt \u2192 retour à l\u2019étape 0, sorties coupées, MARCHE relance');
}

function runCuveBlocksAru() {
  const program = exampleBlocks('cuve');
  const machine = 'cuve';
  let sys = initSystem(machine);
  let interp = initInterpState();
  let runningSeen = false;
  for (let i = 0; i < 60; i++) {
    const vars = { bMarche: false, bArret: false, bAru: !(i >= 30 && i < 45) };
    const r = runProgram('blocks', program, vars, interp, { level: sys.level });
    interp = r.state;
    sys = stepSystem(machine, sys, r.outputs, vars);
    if (i === 5) {
      assert(r.outputs.vanneR, `blocks cuve AU: vanne attendue avant AU, out ${JSON.stringify(r.outputs)}`);
      runningSeen = true;
    }
    if (i > 31 && i < 38) {
      assert(!r.outputs.vanneR, `blocks cuve AU: vanne doit couper pendant AU (cycle ${i})`);
      assert(r.outputs.voyRouge, `blocks cuve AU: VOY. R attendu pendant AU (cycle ${i})`);
    }
    if (i > 45 && i < 51) {
      assert(r.outputs.vanneR && !r.outputs.voyRouge, `blocks cuve AU: vanne remise dès bAru = true, out ${JSON.stringify(r.outputs)}`);
    }
  }
  assert(runningSeen, 'blocks cuve AU: le programme tournait avant l\u2019AU');
  assert(sys.kind === 'cuve' && sys.aruStopped, 'blocks cuve AU: sys.aruStopped attendu');
  console.log('\u2713 Blocs cuve AU NF : bAru = false coupe VANNE R et allume VOY. R, remise en circuit sans mémoire');
}

test('runCuveAruLadder', () => runCuveAruLadder());
test('runCuveAruGrafcet', () => runCuveAruGrafcet());
test('runCuveBlocksAru', () => runCuveBlocksAru());


function tickEcluse(sys, interp, mode, program, vars, forceOut) {
  const inputs = { ...machineInputs('ecluse', sys, {}), ...vars };
  const res = runProgram(mode, program, inputs, interp, { level: numericOf('ecluse', sys) });
  const outputs = forceOut ? { ...res.outputs, ...forceOut } : res.outputs;
  return { sys: stepSystem('ecluse', sys, outputs, inputs), interp: res.state, outputs };
}

function runEcluseGrafcet() {
  const program = exampleGrafcet('ecluse');
  let sys = initSystem('ecluse');
  let interp = initInterpState();
  const vars = {};
  for (let i = 0; i < 1000; i++) {
    vars.bMarche = i < 6;
    ({ sys, interp } = tick('ecluse', vars, sys, interp, 'grafcet', program));
  }
  assert(sys.kind === 'ecluse');
  assert(sys.transits >= 3, `grafcet ecluse: 3 transits attendus, obtenu ${sys.transits}`);
  assert(sys.danger === 0, `grafcet ecluse: 0 fausse man\u0153uvre attendue, obtenu ${sys.danger}`);
  console.log(`\u2713 Grafcet écluse : ${sys.transits} transits (descente + montée alternés), 0 danger`);
}

function runEcluseLadder() {
  const program = exampleLadder('ecluse');
  let sys = initSystem('ecluse');
  let interp = initInterpState();
  const vars = {};
  for (let i = 0; i < 1000; i++) {
    vars.bMarche = i < 6;
    ({ sys, interp } = tick('ecluse', vars, sys, interp, 'ladder', program));
  }
  assert(sys.kind === 'ecluse');
  assert(sys.transits >= 3, `ladder ecluse: 3 transits attendus, obtenu ${sys.transits}`);
  assert(sys.danger === 0, `ladder ecluse: 0 fausse man\u0153uvre attendue, obtenu ${sys.danger}`);
  console.log(`\u2713 Ladder écluse : ${sys.transits} transits via relais R-DESC / R-MONT, 0 danger`);
}

function runEcluseBlocks() {
  const program = exampleBlocks('ecluse');
  let sys = initSystem('ecluse');
  let interp = initInterpState();
  const vars = { bArret: false };
  for (let i = 0; i < 300; i++) {
    ({ sys, interp } = tick('ecluse', vars, sys, interp, 'blocks', program));
  }
  assert(sys.kind === 'ecluse');
  assert(sys.transits === 1, `blocks ecluse: 1 seul transit attendu, obtenu ${sys.transits}`);
  assert(sys.danger === 0, `blocks ecluse: 0 danger attendu`);
  console.log('\u2713 Blocs écluse : descente complète uniquement (pas de mémoire), bateau suivant en attente, 0 danger');
}

function runEcluseIncidentNiveau() {
  const program = exampleBlocks('ecluse');
  let sys = initSystem('ecluse');
  let interp = initInterpState();
  let alarme = false;
  for (let i = 0; i < 10; i++) {
    const r = tick('ecluse', { nAm: true, bArret: false }, sys, interp, 'blocks', program);
    sys = r.sys;
    interp = r.interp;
    if (i > 2) {
      assert(r.outputs.alarme, `ecluse incident N-AM: alarme attendue (cycle ${i}), out ${JSON.stringify(r.outputs)}`);
      assert(!r.outputs.mPmon && !r.outputs.mPval, 'ecluse incident N-AM: moteurs de portes coupés attendus');
      alarme = true;
    }
  }
  assert(alarme, 'ecluse incident N-AM: alarme jamais observée');
  console.log('\u2713 Incident écluse : N-AM collé (incohérence N-AM/N-AV) \u2192 portes coupées + ALARME');
}

function runEcluseIncidentPorteBloquee() {
  const program = exampleLadder('ecluse');
  let sys = initSystem('ecluse');
  let interp = initInterpState();
  const vars = { bMarche: false, bArret: false };
  let commanded = false;
  let bloque = false;
  let ticksCmd = 0;
  for (let i = 0; i < 600 && !commanded; i++) {
    const r = tickEcluse(sys, interp, 'ladder', program, vars, null);
    sys = r.sys;
    interp = r.interp;
    if (r.outputs.mPval) commanded = true;
  }
  assert(commanded, 'ecluse incident porte: M-P-AV jamais commandé (le programme ne tourne pas)');
  // Puis la porte aval est bloque : le moteur réel ne bouge plus (mPval forcé à false),
  // mais le programme continue de la commander. La vraie porte n'atteint jamais P-AV-Ouv,
  // le TON t2 (2 s) s'accumule et l'ALARME doit se lever.
  for (let i = 0; i < 60 && !bloque; i++) {
    const r2 = tickEcluse(sys, interp, 'ladder', program, vars, { mPval: false });
    sys = r2.sys;
    interp = r2.interp;
    ticksCmd++;
    if (r2.outputs.alarme) bloque = true;
  }
  assert(bloque, `ecluse incident porte: alarme jamais déclenchée (${ticksCmd} ticks de porte bloquée)`);
  assert(sys.kind === 'ecluse');
  console.log('\u2713 Incident écluse : porte aval bloquée commandée (TON 2 s) \u2192 ALARME');
}

function runGrafcetFrontMontant() {
  const program = {
    nodes: [
      { transition: [{ type: 'edge', varId: 'X', dir: 'rising' }], alt: [], actions: [], forks: [], waitsFor: [], afterSeconds: null },
      { transition: [{ type: 'var', varId: 'X', negated: true }], alt: [], actions: [{ varId: 'Y', mode: 'level' }], forks: [], waitsFor: [], afterSeconds: null },
    ],
    loopTo: 0,
  };
  let interp = initInterpState();
  const yTrail = [];
  for (let i = 0; i < 8; i++) {
    const vars = { X: i >= 3 && i <= 5 };
    const r = runProgram('grafcet', program, vars, interp, {});
    interp = r.state;
    yTrail.push(!!r.outputs.Y);
  }
  assert(!yTrail[0] && !yTrail[1] && !yTrail[2], 'grafcet front montant: etape 1 avant le front est indesirable');
  assert(yTrail[3] && yTrail[4] && yTrail[5], 'grafcet front montant: etape 1 active pendant X haut');
  assert(!yTrail[6] && !yTrail[7] && interp.active[0] === 0, 'grafcet front montant: retour etape 0 quand X retombe');
  console.log('\u2713 Grafcet front montant : la transition ne passe qu\u2019une fois (front \u2191), pas\u00e0-pas exact');
}

function runGrafcetFrontDescendantTrace() {
  // front descendant : X haut (ticks 0-2) puis chute au tick 3
  const program = {
    nodes: [
      { transition: [{ type: 'edge', varId: 'X', dir: 'falling' }], alt: [], actions: [], forks: [], waitsFor: [], afterSeconds: null },
      { transition: [{ type: 'edge', varId: 'X', dir: 'rising' }], alt: [], actions: [{ varId: 'Y', mode: 'level' }], forks: [], waitsFor: [], afterSeconds: null },
    ],
    loopTo: 0,
  };
  let interp = initInterpState();
  const yTrail = [];
  for (let i = 0; i < 7; i++) {
    const vars = { X: i < 3 || i === 6 };
    const r = runProgram('grafcet', program, vars, interp, {});
    interp = r.state;
    yTrail.push(!!r.outputs.Y);
  }
  assert(!yTrail[0] && !yTrail[1] && !yTrail[2], 'front \u2193 : rien tant que X reste haut');
  assert(yTrail[3] && yTrail[4] && yTrail[5], 'front \u2193 : Y s\u2019allume exactement au tick de chute de X, jusqu\u2019au front \u2191');
  assert(!yTrail[6], 'front \u2193 : retour \u00e0 l\u2019\u00e9tape 0 au front \u2191 de X');
  console.log('\u2713 Grafcet front descendant : impulsion exacte \u00e0 la chute de X (avant : jamais vraie)');
}

function runBlocsFrontMontant() {
  const program = { rules: [{ when: [{ type: 'edge', varId: 'X', dir: 'rising' }], then: ['Y'] }] };
  let interp = initInterpState();
  const yTrail = [];
  for (let i = 0; i < 8; i++) {
    const r = runProgram('blocks', program, { X: i % 4 === 2 }, interp, {});
    interp = r.state;
    yTrail.push(!!r.outputs.Y);
  }
  // X vrai seulement a i = 2 et 6 : front montant a ces deux ticks uniquement
  const attendu = [false, false, true, false, false, false, true, false];
  assert(JSON.stringify(yTrail) === JSON.stringify(attendu), `blocs front montant: attendu ${attendu.join()}, obtenu ${yTrail.join()}`);
  console.log('\u2713 Blocs front montant : Y ne s\u2019allume qu\u2019au front \u2191 (avant : jamais)');
}

test('runEcluseGrafcet', () => runEcluseGrafcet());
test('runEcluseLadder', () => runEcluseLadder());
test('runEcluseBlocks', () => runEcluseBlocks());
test('runEcluseIncidentNiveau', () => runEcluseIncidentNiveau());
test('runEcluseIncidentPorteBloquee', () => runEcluseIncidentPorteBloquee());
test('runGrafcetFrontMontant', () => runGrafcetFrontMontant());
test('runGrafcetFrontDescendantTrace', () => runGrafcetFrontDescendantTrace());
test('runBlocsFrontMontant', () => runBlocsFrontMontant());


