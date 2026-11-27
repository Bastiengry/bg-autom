// Tests unitaires fins du Ladder : temporisations TON / TOF / TP.
// Un appel a runProgram = un scan de 100 ms (TICK_MS).
import assert from 'node:assert';
import { runProgram, initInterpState } from '../src/engine/interpreters';
import type { LadderProgram } from '../src/types';

const run = (p: LadderProgram, vars: Record<string, boolean>, state = initInterpState()) =>
  runProgram('ladder', p, vars, state, { level: 0 });

const timerOf = (type: 'TON' | 'TOF'): LadderProgram => ({
  rungs: [{ output: 'Y', coilType: 'coil', terms: [{ type: 'timerContact', timerId: 'T1' }], junctions: [] }],
  timers: [{ id: 'T1', type, presetMs: 500, input: [{ type: 'var', varId: 'X', negated: false }] }],
  counters: [],
});

const ton = (): LadderProgram => timerOf('TON');
const tof = (): LadderProgram => timerOf('TOF');

describe('TON (retard a l\u2019enclenchement)', () => {
  it('Q reste faux pendant l\u2019accumulation puis passe vrai exactement au preset', () => {
    const p = ton();
    let st = initInterpState();
    let y = false;
    for (let i = 1; i <= 4; i++) {
      const r = run(p, { X: true }, st);
      st = r.state;
      y = !!r.outputs.Y;
      assert(!y, `TON : Q doit rester faux au scan ${i}/4, et=${st.tmr.T1?.et}`);
    }
    const r5 = run(p, { X: true }, st);
    assert(r5.outputs.Y === true, `TON : Q doit passer vrai au 5e scan (500 ms), et=${r5.state.tmr.T1?.et}`);
  });

  it('retombe immediatement a zero quand l\u2019entree retombe', () => {
    const p = ton();
    let st = initInterpState();
    for (let i = 0; i < 5; i++) st = run(p, { X: true }, st).state;
    const r = run(p, { X: false }, st);
    assert(r.outputs.Y === false, 'TON : entree fausse \u2192 Q faux au scan suivant');
    assert(r.state.tmr.T1.et === 0, `TON : entree fausse \u2192 et remis a 0, obtenu ${r.state.tmr.T1.et}`);
  });

  it('l\u2019accumulation repart de zero apres une chute (pas de memoire partielle)', () => {
    const p = ton();
    let st = initInterpState();
    for (let i = 0; i < 3; i++) st = run(p, { X: true }, st).state; // et = 300
    st = run(p, { X: false }, st).state; // reset
    let scans = 0;
    while (scans < 5) {
      const r = run(p, { X: true }, st);
      st = r.state;
      scans++;
      if (r.outputs.Y) break;
    }
    assert(scans === 5, `TON : apres reset il faut 5 scans pleins, obtenu ${scans}`);
  });
});

describe('TOF (retard au relachement)', () => {
  it('Q suit l\u2019entree immediatement a l\u2019enclenchement', () => {
    const p = tof();
    const r = run(p, { X: true });
    assert(r.outputs.Y === true, 'TOF : entree vraie \u2192 Q vrai des le premier scan');
  });

  it('Q reste vrai presetMs apres la chute, puis retombe', () => {
    const p = tof();
    let st = initInterpState();
    st = run(p, { X: true }, st).state;
    for (let i = 1; i <= 4; i++) {
      const r = run(p, { X: false }, st);
      st = r.state;
      assert(r.outputs.Y === true, `TOF : Q doit rester vrai au scan ${i}/4 apres la chute, et=${st.tmr.T1?.et}`);
    }
    const r5 = run(p, { X: false }, st);
    assert(r5.outputs.Y === false, 'TOF : Q doit retomber au 5e scan apres la chute (500 ms ecoules)');
  });
});

describe('TP (impulsion)', () => {
  const tp = (): LadderProgram => ({
    rungs: [{ output: 'Y', coilType: 'coil', terms: [{ type: 'timerContact', timerId: 'T1' }], junctions: [] }],
    timers: [{ id: 'T1', type: 'TP', presetMs: 500, input: [{ type: 'var', varId: 'X', negated: false }] }],
    counters: [],
  });

  it('genere une impulsion duree presetMs sur front montant', () => {
    const p = tp();
    let st = initInterpState();
    const trail: boolean[] = [];
    for (let i = 0; i < 7; i++) {
      const r = run(p, { X: true }, st);
      st = r.state;
      trail.push(!!r.outputs.Y);
    }
    // premiere impulsion : 500 ms vraies (scans 1 a 5), faux au scan 6
    assert(
      JSON.stringify(trail.slice(0, 6)) === JSON.stringify([true, true, true, true, true, false]),
      `TP : impulsion attendue [T,T,T,T,T,F] sur 6 scans, obtenu ${trail.slice(0, 6).join()}`,
    );
  });

  it('se re-arme tant que l\u2019entree reste vraie (semence actuelle du moteur)', () => {
    const p = tp();
    let st = initInterpState();
    for (let i = 0; i < 6; i++) st = run(p, { X: true }, st).state; // impulsion finie au scan 6
    const r7 = run(p, { X: true }, st);
    assert(r7.outputs.Y === true, 'TP : le moteur actuel re-arme l\u2019impulsion si l\u2019entree reste vraie');
  });

  it('une entree courte donne bien une impulsion complete (plus longue que l\u2019entree)', () => {
    const p = tp();
    let st = initInterpState();
    st = run(p, { X: true }, st).state; // 1 scan d\u2019entree
    for (let i = 0; i < 4; i++) {
      const r = run(p, { X: false }, st);
      st = r.state;
      assert(r.outputs.Y === true, `TP : l\u2019impulsion doit survivre a la chute de l\u2019entree (scan ${i + 1}/4)`);
    }
    const r5 = run(p, { X: false }, st);
    assert(r5.outputs.Y === false, 'TP : l\u2019impulsion retombe apres presetMs');
  });
});
