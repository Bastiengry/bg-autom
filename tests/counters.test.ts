// Tests unitaires fins du Ladder : compteurs CTU / CTD.
// Le comptage se fait sur front du declencheur (memoire interne __ctr_<id> via state.prev).
import assert from 'node:assert';
import { runProgram, initInterpState } from '../src/engine/interpreters';
import type { LadderProgram } from '../src/types';

const ctu = (): LadderProgram => ({
  rungs: [{ output: 'Y', coilType: 'coil', terms: [{ type: 'counterContact', counterId: 'C1' }], junctions: [] }],
  timers: [],
  counters: [
    {
      id: 'C1',
      type: 'CTU',
      preset: 3,
      trigger: [{ type: 'var', varId: 'X', negated: false }],
      resetCondition: [{ type: 'var', varId: 'R', negated: false }],
    },
  ],
});

const ctd = (): LadderProgram => ({
  rungs: [{ output: 'Y', coilType: 'coil', terms: [{ type: 'counterContact', counterId: 'C1' }], junctions: [] }],
  timers: [],
  counters: [
    {
      id: 'C1',
      type: 'CTD',
      preset: 2,
      trigger: [{ type: 'var', varId: 'X', negated: false }],
      resetCondition: [{ type: 'var', varId: 'R', negated: false }],
    },
  ],
});

const pulse = (p: LadderProgram, id: string, state: ReturnType<typeof initInterpState>) => {
  // front montant puis retombee : deux scans
  let st = runProgram('ladder', p, { [id]: true }, state, { level: 0 }).state;
  st = runProgram('ladder', p, { [id]: false }, st, { level: 0 }).state;
  return st;
};

describe('CTU (compteur d\u2019impulsions montantes)', () => {
  it('incremente d\u2019un seul pas par front montant (pas par etat haut)', () => {
    const p = ctu();
    let st = initInterpState();
    for (let i = 1; i <= 3; i++) {
      st = pulse(p, 'X', st);
      assert(st.ctr.C1.pv === i, `CTU : apres ${i} impulsions, pv attendu ${i}, obtenu ${st.ctr.C1.pv}`);
    }
    // X monte (4e front, pv=4) puis maintenu haut : aucun recomptage tant que ca reste haut
    st = runProgram('ladder', p, { X: true }, st, { level: 0 }).state;
    assert(st.ctr.C1.pv === 4, `CTU : 4e front → pv=4, obtenu ${st.ctr.C1.pv}`);
    for (let i = 0; i < 5; i++) st = runProgram('ladder', p, { X: true }, st, { level: 0 }).state;
    assert(st.ctr.C1.pv === 4, `CTU : X maintenu ne doit pas recompter, pv obtenu ${st.ctr.C1.pv}`);
  });

  it('Q passe vrai quand le preset est atteint', () => {
    const p = ctu();
    let st = initInterpState();
    for (let i = 0; i < 2; i++) st = pulse(p, 'X', st);
    let r = runProgram('ladder', p, { X: false }, st, { level: 0 });
    assert(r.outputs.Y === false, 'CTU : Q faux apres 2 impulsions sur un preset de 3');
    st = pulse(p, 'X', st);
    r = runProgram('ladder', p, { X: false }, st, { level: 0 });
    assert(r.outputs.Y === true, 'CTU : Q vrai une fois 3 impulsions comptees');
  });

  it('le reset ramene pv a zero et Q a faux, et bloque le comptage pendant qu\u2019il est actif', () => {
    const p = ctu();
    let st = initInterpState();
    for (let i = 0; i < 3; i++) st = pulse(p, 'X', st);
    assert(st.ctr.C1.pv === 3);
    let r = runProgram('ladder', p, { R: true }, st, { level: 0 });
    assert(r.state.ctr.C1.pv === 0, `CTU : reset \u2192 pv=0, obtenu ${r.state.ctr.C1.pv}`);
    assert(r.outputs.Y === false, 'CTU : reset \u2192 Q faux');
    // pendant R actif, les fronts X ne comptent pas
    r = runProgram('ladder', p, { X: true, R: true }, r.state, { level: 0 });
    assert(r.state.ctr.C1.pv === 0, 'CTU : pas de comptage pendant le reset');
  });
});

describe('CTD (compteur sur fronts descendants)', () => {
  it('compte sur le front descendant du declencheur', () => {
    const p = ctd();
    let st = initInterpState();
    // monter puis descendre X = 1 front descendant
    st = pulse(p, 'X', st);
    assert(st.ctr.C1.pv === 1, `CTD : apres 1 front descendant, pv=1, obtenu ${st.ctr.C1.pv}`);
    st = pulse(p, 'X', st);
    assert(st.ctr.C1.pv === 2, `CTD : apres 2 fronts descendants, pv=2, obtenu ${st.ctr.C1.pv}`);
  });

  it('Q vrai au preset, reset inclus', () => {
    const p = ctd();
    let st = initInterpState();
    for (let i = 0; i < 2; i++) st = pulse(p, 'X', st);
    let r = runProgram('ladder', p, { X: false }, st, { level: 0 });
    assert(r.outputs.Y === true, 'CTD : Q vrai au preset de 2');
    r = runProgram('ladder', p, { R: true }, r.state, { level: 0 });
    assert(r.state.ctr.C1.pv === 0, 'CTD : reset \u2192 pv=0');
    assert(r.outputs.Y === false, 'CTD : reset \u2192 Q faux');
  });
});
