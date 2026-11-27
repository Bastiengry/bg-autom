// Tests unitaires fins du Grafcet : divergence ET (forks / waitsFor), divergence OU (alt),
// boucle loopTo (reset de stepMs) et piege documente de la transition vide.
import assert from 'node:assert';
import { runProgram, initInterpState, type InterpState } from '../src/engine/interpreters';
import type { GrafcetProgram } from '../src/types';

const run = (p: GrafcetProgram, vars: Record<string, boolean>, state: InterpState = initInterpState()) =>
  runProgram('grafcet', p, vars, state, { level: 0 });

const v = (varId: string) => ({ type: 'var' as const, varId, negated: false });
const lvl = (varId: string) => ({ varId, mode: 'level' as const });

describe('divergence ET : forks + waitsFor', () => {
  //      +-->1 (B) --+
  //   0 (A)           (3) D --> retour 0
  //      +-->2 (C) --+    (2 attend que 1 soit encore actif)
  const p: GrafcetProgram = {
    nodes: [
      { actions: [lvl('A')], transition: [v('bMarche')], afterSeconds: null, alt: [], forks: [2], waitsFor: [] },
      { actions: [lvl('B')], transition: [v('X')], afterSeconds: null, alt: [], forks: [], waitsFor: [] },
      { actions: [lvl('C')], transition: [v('X')], afterSeconds: null, alt: [], forks: [], waitsFor: [1] },
      { actions: [lvl('D')], transition: [v('bArret')], afterSeconds: null, alt: [], forks: [], waitsFor: [] },
    ],
    loopTo: 0,
  };

  it('le fork active les deux branches en parallele', () => {
    const r = run(p, { bMarche: true });
    assert(r.state.active.length === 2 && r.state.active.includes(1) && r.state.active.includes(2),
      `fork : branches 1 et 2 attendues, obtenu [${r.state.active}]`);
    assert(r.outputs.B === true && r.outputs.C === true, `B et C attends, obtenu ${JSON.stringify(r.outputs)}`);
    assert(!r.outputs.A, 'l\u2019action de niveau de l\u2019etape 0 s\u2019eteint des le scan de transition');
  });

  it('les deux branches avancent ensemble quand X monte (1 \u2192 2, 2 \u2192 3)', () => {
    let st = run(p, { bMarche: true }).state;
    const r = run(p, { X: true }, st);
    assert(r.state.active.includes(3), `branche 2 doit rejoindre 3, obtenu [${r.state.active}]`);
    assert(r.outputs.D === true, 'D action de l\u2019etape 3');
  });

  it('waitsFor bloque une branche seule : 2 ne peut pas franchir sans 1 actif', () => {
    const st: InterpState = { active: [2], mem: {}, tmr: {}, ctr: {}, stepMs: 0, prev: {} };
    const r = run(p, { X: true }, st);
    assert(JSON.stringify(r.state.active) === '[2]', `l\u2019etape 2 seule doit rester bloquee, obtenu [${r.state.active}]`);
    assert(r.outputs.C === true, 'l\u2019action de niveau de l\u2019etape 2 reste vraie tant qu\u2019elle est active');
  });
});

describe('divergence OU : alt', () => {
  const p: GrafcetProgram = {
    nodes: [
      { actions: [lvl('A')], transition: [v('X')], afterSeconds: null, alt: [{ condition: [v('bArret')], goto: 2 }], forks: [], waitsFor: [] },
      { actions: [lvl('B')], transition: [v('bMarche')], afterSeconds: null, alt: [], forks: [], waitsFor: [] },
      { actions: [lvl('C')], transition: [v('bArret')], afterSeconds: null, alt: [], forks: [], waitsFor: [] },
    ],
    loopTo: 0,
  };

  it('la branche alt part quand la transition principale est fausse', () => {
    const r = run(p, { X: false, bArret: true });
    assert(r.state.active.includes(2), `alt : etape 2 attendue, obtenu [${r.state.active}]`);
    assert(r.outputs.C === true && r.outputs.A !== true, 'C vrai, A libere');
  });

  it('la transition principale est prioritaire sur alt quand les deux sont vraies', () => {
    const r = run(p, { X: true, bArret: true });
    assert(r.state.active.includes(1) && !r.state.active.includes(2),
      `priorite principale : etape 1 attendue, obtenu [${r.state.active}]`);
    assert(r.outputs.B === true, 'B vrai (suite de la sequence principale)');
  });
});

describe('loopTo : retour de sequence et reset de stepMs', () => {
  const p: GrafcetProgram = {
    nodes: [{ actions: [lvl('A')], transition: [v('X')], afterSeconds: null, alt: [], forks: [], waitsFor: [] }],
    loopTo: 0,
  };

  it('une etape qui reste active accumulate stepMs', () => {
    let st = run(p, { X: false }).state;
    assert(st.stepMs === 100, `etape maintenue : stepMs=100 attends, obtenu ${st.stepMs}`);
  });

  it('la transition vers loopTo remet stepMs a zero (nouvelle visite de l\u2019etape)', () => {
    const st = initInterpState();
    let s = run(p, { X: false }, st).state; // s'installe, stepMs=100
    const r = run(p, { X: true }, s); // franchit et reboucle sur loopTo=0
    s = r.state;
    assert(JSON.stringify(s.active) === '[0]', `rebouclage sur 0, obtenu [${s.active}]`);
    assert(s.stepMs === 0, `stepMs remis a zero au rebouclage, obtenu ${s.stepMs}`);
    assert(r.outputs.A === true, 'l\u2019action de niveau est a nouveau vraie');
  });
});

describe('piege documente : transition vide', () => {
  it('un noeud avec transition [] franchit immediatement (every sur liste vide = vrai)', () => {
    const p: GrafcetProgram = {
      nodes: [{ actions: [lvl('A')], transition: [], afterSeconds: null, alt: [], forks: [], waitsFor: [] }],
      loopTo: 0,
    };
    const st = initInterpState();
    const s = run(p, {}, st).state;
    // des le premier scan : la transition vide est vraie, l'etape est franchie et re-entree
    // (stepMs=0). Aucune etape n'est donc un puits sans tempo : elle boucle sur elle-meme.
    assert(JSON.stringify(s.active) === '[0]', `active attends [0], obtenu [${s.active}]`);
    assert(s.stepMs === 0, `transition vide : re-entree immediate, stepMs=0 attends, obtenu ${s.stepMs}`);
  });
});
