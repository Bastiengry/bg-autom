import type {
  Condition,
  GrafcetProgram,
  BlocksProgram,
  LadderProgram,
  MachineId,
} from '../types';
import { emptyBlocks, emptyGrafcet } from '../types';

const v = (varId: string): Condition => ({ type: 'var', varId, negated: false });
const notV = (varId: string): Condition => ({ type: 'var', varId, negated: true });
const tq = (timerId: string): Condition => ({ type: 'timerContact', timerId });

export function exampleGrafcet(machine: MachineId): GrafcetProgram {
  const p = emptyGrafcet();
  if (machine === 'cuve') {
    p.nodes = [
      { actions: [], transition: [v('bMarche')], afterSeconds: null, alt: [], forks: [], waitsFor: [] },
      {
        actions: [
          { varId: 'vanneR', mode: 'level' },
          { varId: 'voyVert', mode: 'level' },
        ],
        transition: [v('sHaut')],
        afterSeconds: null,
        alt: [],
        forks: [],
        waitsFor: [],
      },
      {
        actions: [
          { varId: 'pompeV', mode: 'level' },
          { varId: 'voyRouge', mode: 'level' },
        ],
        transition: [v('sBas')],
        afterSeconds: null,
        alt: [],
        forks: [],
        waitsFor: [],
      },
    ];
    p.loopTo = 1;
  } else {
    p.nodes = [
      { actions: [], transition: [v('bMarche')], afterSeconds: null, alt: [], forks: [], waitsFor: [] },
      {
        actions: [
          { varId: 'r1', mode: 'level' },
          { varId: 'v2', mode: 'level' },
        ],
        transition: [],
        afterSeconds: 5,
        alt: [],
        forks: [],
        waitsFor: [],
      },
      {
        actions: [
          { varId: 'r1', mode: 'level' },
          { varId: 'o2', mode: 'level' },
        ],
        transition: [],
        afterSeconds: 2,
        alt: [],
        forks: [],
        waitsFor: [],
      },
      {
        actions: [
          { varId: 'r2', mode: 'level' },
          { varId: 'v1', mode: 'level' },
        ],
        transition: [],
        afterSeconds: 5,
        alt: [],
        forks: [],
        waitsFor: [],
      },
      {
        actions: [
          { varId: 'r2', mode: 'level' },
          { varId: 'o1', mode: 'level' },
        ],
        transition: [],
        afterSeconds: 2,
        alt: [],
        forks: [],
        waitsFor: [],
      },
    ];
    p.loopTo = 1;
  }
  return p;
}

export function exampleLadder(machine: MachineId): LadderProgram {
  if (machine === 'cuve') {
    return {
      timers: [
        { id: 't1', type: 'TP', presetMs: 2000, input: [{ type: 'edge', varId: 'sHaut', dir: 'rising' }] },
      ],
      counters: [],
      rungs: [
        {
          output: 'vanneR',
          coilType: 'coil',
          terms: [v('bMarche'), v('vanneR'), notV('sHaut')],
          junctions: ['OR', 'AND'],
        },
        {
          output: 'pompeV',
          coilType: 'coil',
          terms: [v('sHaut'), v('pompeV'), notV('sBas')],
          junctions: ['OR', 'AND'],
        },
        { output: 'voyVert', coilType: 'coil', terms: [v('vanneR')], junctions: [] },
        { output: 'voyRouge', coilType: 'coil', terms: [tq('t1')], junctions: [] },
      ],
    };
  }
  const phase = (n: number): Condition => v(`M${n}`);
  return {
    timers: [
      { id: 't1', type: 'TON', presetMs: 5000, input: [phase(1)] },
      { id: 't2', type: 'TON', presetMs: 2000, input: [phase(2)] },
      { id: 't3', type: 'TON', presetMs: 5000, input: [phase(3)] },
      { id: 't4', type: 'TON', presetMs: 2000, input: [phase(4)] },
    ],
    counters: [],
    rungs: [
      {
        output: 'M1',
        coilType: 'set',
        terms: [v('M4'), tq('t4'), v('bMarche')],
        junctions: ['AND', 'OR'],
      },
      { output: 'M1', coilType: 'reset', terms: [v('M1'), tq('t1')], junctions: ['AND'] },
      { output: 'M2', coilType: 'set', terms: [v('M1'), tq('t1')], junctions: ['AND'] },
      { output: 'M2', coilType: 'reset', terms: [v('M2'), tq('t2')], junctions: ['AND'] },
      { output: 'M3', coilType: 'set', terms: [v('M2'), tq('t2')], junctions: ['AND'] },
      { output: 'M3', coilType: 'reset', terms: [v('M3'), tq('t3')], junctions: ['AND'] },
      { output: 'M4', coilType: 'set', terms: [v('M3'), tq('t3')], junctions: ['AND'] },
      { output: 'M4', coilType: 'reset', terms: [v('M4'), tq('t4')], junctions: ['AND'] },
      { output: 'r1', coilType: 'coil', terms: [v('M1'), v('M2')], junctions: ['OR'] },
      { output: 'v2', coilType: 'coil', terms: [v('M1')], junctions: [] },
      { output: 'o2', coilType: 'coil', terms: [v('M2')], junctions: [] },
      { output: 'r2', coilType: 'coil', terms: [v('M3'), v('M4')], junctions: ['OR'] },
      { output: 'v1', coilType: 'coil', terms: [v('M3')], junctions: [] },
      { output: 'o1', coilType: 'coil', terms: [v('M4')], junctions: [] },
    ],
  };
}

export function exampleBlocks(machine: MachineId): BlocksProgram {
  const p = emptyBlocks();
  if (machine === 'cuve') {
    p.rules = [
      { when: notV('sHaut'), then: ['vanneR'] },
      { when: v('sHaut'), then: ['voyVert'] },
    ];
  } else {
    p.rules = [
      { when: notV('bMarche'), then: ['r1', 'r2'] },
      { when: v('bMarche'), then: ['r1', 'v2'] },
    ];
  }
  return p;
}
