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
console.log('Tous les tests moteur passent.');
