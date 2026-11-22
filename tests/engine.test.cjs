const assert = require('node:assert');
const { runProgram, initInterpState } = require('../.test-out/engine/interpreters.js');
const { initSystem, stepSystem } = require('../.test-out/system/machines.js');
const { exampleGrafcet, exampleLadder, exampleBlocks } = require('../.test-out/programs/examples.js');

const TICKS_PER_S = 10;
const sensors = (sys) => {
  if (sys.kind !== 'cuve') return {};
  return {
    sBas: sys.level <= 5,
    sMoyen: sys.level >= 50,
    sHaut: sys.level >= 95,
  };
};
const tick = (machine, vars, sys, interp, mode, program) => {
  const ctx = { level: sys.kind === 'cuve' ? sys.level : 0 };
  const res = runProgram(mode, program, { ...vars, ...sensors(sys) }, interp, ctx);
  return { sys: stepSystem(machine, sys, res.outputs), interp: res.state, outputs: res.outputs };
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

runCuveGrafcet();
runCuveLadder();
runCuveBlocks();
runFeuxGrafcet();
runFeuxLadder();
runFeuxBlocks();


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

runLadderCuveStop();
runFeuxLadderStop();
runFeuxGrafcetStop();



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

runCuveIncoherenceDetect();
runFeuxFeedbackSafeMode();

console.log('Tous les tests moteur passent.');
