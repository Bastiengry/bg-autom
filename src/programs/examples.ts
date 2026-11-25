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
const stopBranch = (): { condition: Condition[]; goto: number } => ({
  condition: [v('bArret')],
  goto: 0,
});
const aruBranch = (): { condition: Condition[]; goto: number } => ({
  condition: [notV('bAru')],
  goto: 0,
});

function cuveGrafcet(): GrafcetProgram {
  const p = emptyGrafcet();
  p.nodes = [
    { actions: [], transition: [v('bMarche')], afterSeconds: null, alt: [], forks: [], waitsFor: [] },
    {
      actions: [
        { varId: 'vanneR', mode: 'level' },
        { varId: 'voyVert', mode: 'level' },
      ],
      transition: [v('sHaut')],
      afterSeconds: null,
      alt: [stopBranch(), aruBranch()],
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
      alt: [stopBranch(), aruBranch()],
      forks: [],
      waitsFor: [],
    },
  ];
  p.loopTo = 1;
  return p;
}

function feuxGrafcet(): GrafcetProgram {
  const p = emptyGrafcet();
  p.nodes = [
    { actions: [], transition: [v('bMarche')], afterSeconds: null, alt: [], forks: [], waitsFor: [] },
    {
      actions: [
        { varId: 'r1', mode: 'level' },
        { varId: 'v2', mode: 'level' },
      ],
      transition: [],
      afterSeconds: 5,
      alt: [stopBranch()],
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
      alt: [stopBranch()],
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
      alt: [stopBranch()],
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
      alt: [stopBranch()],
      forks: [],
      waitsFor: [],
    },
  ];
  p.loopTo = 1;
  return p;
}

function convoyeurGrafcet(): GrafcetProgram {
  const p = emptyGrafcet();
  p.nodes = [
    { actions: [], transition: [v('bMarche')], afterSeconds: null, alt: [], forks: [], waitsFor: [] },
    {
      actions: [{ varId: 'moteur', mode: 'level' }],
      transition: [v('dTri'), v('tTag')],
      afterSeconds: null,
      alt: [stopBranch()],
      forks: [],
      waitsFor: [],
    },
    {
      actions: [{ varId: 'poussoir', mode: 'level' }],
      transition: [],
      afterSeconds: 0.4,
      alt: [stopBranch()],
      forks: [],
      waitsFor: [],
    },
  ];
  p.loopTo = 1;
  return p;
}

function robotGrafcet(): GrafcetProgram {
  const p = emptyGrafcet();
  p.nodes = [
    { actions: [], transition: [v('bMarche')], afterSeconds: null, alt: [], forks: [], waitsFor: [] },
    {
      actions: [{ varId: 'avancer', mode: 'level' }],
      transition: [v('pMilieu')],
      afterSeconds: null,
      alt: [stopBranch()],
      forks: [],
      waitsFor: [],
    },
    {
      actions: [
        { varId: 'avancer', mode: 'level' },
        { varId: 'bombe', mode: 'level' },
      ],
      transition: [v('pDroite')],
      afterSeconds: null,
      alt: [stopBranch()],
      forks: [],
      waitsFor: [],
    },
    {
      actions: [{ varId: 'reculer', mode: 'level' }],
      transition: [v('pGauche')],
      afterSeconds: null,
      alt: [stopBranch()],
      forks: [],
      waitsFor: [],
    },
  ];
  p.loopTo = 1;
  return p;
}

function pniveauGrafcet(): GrafcetProgram {
  const p = emptyGrafcet();
  p.nodes = [
    { actions: [], transition: [v('dEntree')], afterSeconds: null, alt: [], forks: [], waitsFor: [] },
    {
      actions: [
        { varId: 'barriere', mode: 'level' },
        { varId: 'feux', mode: 'level' },
      ],
      transition: [v('dSortie')],
      afterSeconds: null,
      alt: [stopBranch()],
      forks: [],
      waitsFor: [],
    },
    { actions: [], transition: [], afterSeconds: 2, alt: [stopBranch()], forks: [], waitsFor: [] },
  ];
  p.loopTo = 0;
  return p;
}

function ecluseGrafcet(): GrafcetProgram {
  // Cycle bisens : attente, pré-niveau, entrée, fermeture, niveau de sortie,
  // sortie, fermeture — chaîne montée symétrique (8…14) puis retour à l’attente 1.
  const p = emptyGrafcet();
  const loopMont = { condition: [v('dAm')], goto: 2 };
  p.nodes = [
    { actions: [], transition: [v('bMarche')], afterSeconds: null, alt: [], forks: [], waitsFor: [] },
    {
      actions: [],
      transition: [v('dAm')],
      afterSeconds: null,
      alt: [{ condition: [v('dAv')], goto: 8 }, stopBranch()],
      forks: [],
      waitsFor: [],
    },
    { actions: [{ varId: 'vRem', mode: 'level' }], transition: [v('nAm')], afterSeconds: null, alt: [stopBranch()], forks: [], waitsFor: [] },
    {
      actions: [
        { varId: 'mPmon', mode: 'level' },
        { varId: 'fVam', mode: 'level' },
      ],
      transition: [v('dSas')],
      afterSeconds: null,
      alt: [stopBranch()],
      forks: [],
      waitsFor: [],
    },
    { actions: [], transition: [v('pAmFerm')], afterSeconds: null, alt: [stopBranch()], forks: [], waitsFor: [] },
    { actions: [{ varId: 'vVid', mode: 'level' }], transition: [v('nAv')], afterSeconds: null, alt: [stopBranch()], forks: [], waitsFor: [] },
    {
      actions: [
        { varId: 'mPval', mode: 'level' },
        { varId: 'fVav', mode: 'level' },
      ],
      transition: [notV('dSas')],
      afterSeconds: null,
      alt: [stopBranch()],
      forks: [],
      waitsFor: [],
    },
    { actions: [], transition: [v('pAvFerm')], afterSeconds: null, alt: [stopBranch()], forks: [], waitsFor: [] },
    {
      actions: [],
      transition: [v('dAv')],
      afterSeconds: null,
      alt: [loopMont, stopBranch()],
      forks: [],
      waitsFor: [],
    },
    { actions: [{ varId: 'vVid', mode: 'level' }], transition: [v('nAv')], afterSeconds: null, alt: [stopBranch()], forks: [], waitsFor: [] },
    {
      actions: [
        { varId: 'mPval', mode: 'level' },
        { varId: 'fVav', mode: 'level' },
      ],
      transition: [v('dSas')],
      afterSeconds: null,
      alt: [stopBranch()],
      forks: [],
      waitsFor: [],
    },
    { actions: [], transition: [v('pAvFerm')], afterSeconds: null, alt: [stopBranch()], forks: [], waitsFor: [] },
    { actions: [{ varId: 'vRem', mode: 'level' }], transition: [v('nAm')], afterSeconds: null, alt: [stopBranch()], forks: [], waitsFor: [] },
    {
      actions: [
        { varId: 'mPmon', mode: 'level' },
        { varId: 'fVam', mode: 'level' },
      ],
      transition: [notV('dSas')],
      afterSeconds: null,
      alt: [stopBranch()],
      forks: [],
      waitsFor: [],
    },
    { actions: [], transition: [v('pAmFerm')], afterSeconds: null, alt: [stopBranch()], forks: [], waitsFor: [] },
  ];
  p.loopTo = 1;
  return p;
}

export function exampleGrafcet(machine: MachineId): GrafcetProgram {
  if (machine === 'cuve') return cuveGrafcet();
  if (machine === 'convoyeur') return convoyeurGrafcet();
  if (machine === 'robot') return robotGrafcet();
  if (machine === 'pniveau') return pniveauGrafcet();
  if (machine === 'ecluse') return ecluseGrafcet();
  return feuxGrafcet();
}

function cuveLadder(): LadderProgram {
  return {
    timers: [
      { id: 't1', type: 'TP', presetMs: 2000, input: [{ type: 'edge', varId: 'sHaut', dir: 'rising' }] },
    ],
    counters: [],
    rungs: [
      {
        output: 'vanneR',
        coilType: 'coil',
        terms: [v('bMarche'), v('vanneR'), v('bAru'), notV('sHaut'), notV('bArret')],
        junctions: ['OR', 'AND', 'AND', 'AND'],
      },
      {
        output: 'pompeV',
        coilType: 'coil',
        terms: [v('sHaut'), v('pompeV'), v('bAru'), notV('sBas'), notV('bArret')],
        junctions: ['OR', 'AND', 'AND', 'AND'],
      },
      { output: 'voyVert', coilType: 'coil', terms: [v('vanneR')], junctions: [] },
      { output: 'voyRouge', coilType: 'coil', terms: [tq('t1'), notV('bAru')], junctions: ['OR'] },
    ],
  };
}

function feuxLadder(): LadderProgram {
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
        output: 'Mstop',
        coilType: 'set',
        terms: [{ type: 'edge', varId: 'bArret', dir: 'rising' }, v('Mstop')],
        junctions: ['OR'],
      },
      { output: 'Mstop', coilType: 'reset', terms: [v('bMarche')], junctions: [] },
      {
        output: 'M1',
        coilType: 'set',
        terms: [v('M4'), tq('t4'), v('bMarche'), notV('Mstop')],
        junctions: ['AND', 'OR', 'AND'],
      },
      { output: 'M1', coilType: 'reset', terms: [v('M1'), tq('t1')], junctions: ['AND'] },
      { output: 'M2', coilType: 'set', terms: [v('M1'), tq('t1'), notV('Mstop')], junctions: ['AND', 'AND'] },
      { output: 'M2', coilType: 'reset', terms: [v('M2'), tq('t2')], junctions: ['AND'] },
      { output: 'M3', coilType: 'set', terms: [v('M2'), tq('t2'), notV('Mstop')], junctions: ['AND', 'AND'] },
      { output: 'M3', coilType: 'reset', terms: [v('M3'), tq('t3')], junctions: ['AND'] },
      { output: 'M4', coilType: 'set', terms: [v('M3'), tq('t3'), notV('Mstop')], junctions: ['AND', 'AND'] },
      { output: 'M4', coilType: 'reset', terms: [v('M4'), tq('t4')], junctions: ['AND'] },
      { output: 'r1', coilType: 'coil', terms: [v('M1'), v('M2'), v('Mstop')], junctions: ['OR', 'OR'] },
      { output: 'v2', coilType: 'coil', terms: [v('M1'), notV('Mstop')], junctions: ['AND'] },
      { output: 'o2', coilType: 'coil', terms: [v('M2'), notV('Mstop')], junctions: ['AND'] },
      { output: 'r2', coilType: 'coil', terms: [v('M3'), v('M4'), v('Mstop')], junctions: ['OR', 'OR'] },
      { output: 'v1', coilType: 'coil', terms: [v('M3'), notV('Mstop')], junctions: ['AND'] },
      { output: 'o1', coilType: 'coil', terms: [v('M4'), notV('Mstop')], junctions: ['AND'] },
    ],
  };
}

function convoyeurLadder(): LadderProgram {
  return {
    timers: [],
    counters: [],
    rungs: [
      {
        output: 'moteur',
        coilType: 'coil',
        terms: [v('bMarche'), v('moteur'), notV('bArret'), notV('M1'), notV('M2')],
        junctions: ['OR', 'AND', 'AND', 'AND'],
      },
      {
        output: 'M1',
        coilType: 'set',
        terms: [v('moteur'), notV('bMvt')],
        junctions: ['AND'],
      },
      {
        output: 'M1',
        coilType: 'reset',
        terms: [v('bMvt'), { type: 'edge', varId: 'bMarche', dir: 'rising' }],
        junctions: ['OR'],
      },
      {
        output: 'M2',
        coilType: 'set',
        terms: [v('pRet'), notV('poussoir')],
        junctions: ['AND'],
      },
      {
        output: 'M2',
        coilType: 'reset',
        terms: [notV('pRet'), { type: 'edge', varId: 'bMarche', dir: 'rising' }],
        junctions: ['OR'],
      },
      {
        output: 'poussoir',
        coilType: 'coil',
        terms: [v('dTri'), v('tTag'), notV('bArret'), notV('M1'), notV('M2')],
        junctions: ['AND', 'AND', 'AND', 'AND'],
      },
      { output: 'voyVert', coilType: 'coil', terms: [v('moteur')], junctions: [] },
      { output: 'voyRouge', coilType: 'coil', terms: [v('M1'), v('M2')], junctions: ['OR'] },
    ],
  };
}

function robotLadder(): LadderProgram {
  return {
    timers: [],
    counters: [],
    rungs: [
      {
        output: 'avancer',
        coilType: 'coil',
        terms: [v('M3'), v('pGauche'), v('bMarche'), v('avancer'), notV('pDroite'), notV('bArret'), notV('M1')],
        junctions: ['AND', 'OR', 'OR', 'AND', 'AND', 'AND'],
      },
      { output: 'M3', coilType: 'set', terms: [v('bMarche')], junctions: [] },
      { output: 'M3', coilType: 'reset', terms: [v('bArret')], junctions: [] },
      {
        output: 'reculer',
        coilType: 'coil',
        terms: [v('pDroite'), v('reculer'), notV('pGauche'), notV('M1')],
        junctions: ['OR', 'AND', 'AND'],
      },
      {
        output: 'bombe',
        coilType: 'set',
        terms: [v('pMilieu'), v('avancer'), notV('bArret'), notV('M1'), notV('M2')],
        junctions: ['AND', 'AND', 'AND', 'AND'],
      },
      {
        output: 'bombe',
        coilType: 'reset',
        terms: [v('pDroite'), v('reculer'), v('bArret')],
        junctions: ['OR', 'OR'],
      },
      {
        output: 'M1',
        coilType: 'set',
        terms: [v('rp'), notV('bombe')],
        junctions: ['AND'],
      },
      {
        output: 'M1',
        coilType: 'reset',
        terms: [v('bombe'), { type: 'edge', varId: 'bMarche', dir: 'rising' }],
        junctions: ['OR'],
      },
      { output: 'M2', coilType: 'set', terms: [v('pGauche'), v('pDroite')], junctions: ['AND'] },
      { output: 'M2', coilType: 'reset', terms: [notV('pDroite')], junctions: [] },
      { output: 'voyVert', coilType: 'coil', terms: [v('pGauche')], junctions: [] },
      { output: 'voyRouge', coilType: 'coil', terms: [v('M1'), v('M2')], junctions: ['OR'] },
    ],
  };
}

function pniveauLadder(): LadderProgram {
  return {
    timers: [
      {
        id: 't1',
        type: 'TON',
        presetMs: 2000,
        input: [v('barriere'), notV('rB')],
      },
    ],
    counters: [],
    rungs: [
      { output: 'barriere', coilType: 'set', terms: [v('dEntree')], junctions: [] },
      { output: 'barriere', coilType: 'reset', terms: [v('dSortie')], junctions: [] },
      { output: 'feux', coilType: 'coil', terms: [v('barriere')], junctions: [] },
      { output: 'M1', coilType: 'set', terms: [v('dEntree'), v('dSortie')], junctions: ['AND'] },
      {
        output: 'M1',
        coilType: 'reset',
        terms: [notV('dEntree'), notV('dSortie')],
        junctions: ['AND'],
      },
      { output: 'alarme', coilType: 'coil', terms: [tq('t1'), v('M1')], junctions: ['OR'] },
    ],
  };
}

function ecluseLadder(): LadderProgram {
  const relais = (id: string): Condition => v(id);
  return {
    timers: [
      { id: 't1', type: 'TON', presetMs: 2000, input: [relais('mPmon'), notV('pAmOuv')] },
      { id: 't2', type: 'TON', presetMs: 2000, input: [relais('mPval'), notV('pAvOuv')] },
    ],
    counters: [],
    rungs: [
      { output: 'Rdesc', coilType: 'reset', terms: [{ type: 'edge', varId: 'dSas', dir: 'falling' }], junctions: [] },
      { output: 'Rmon', coilType: 'reset', terms: [{ type: 'edge', varId: 'dSas', dir: 'falling' }], junctions: [] },
      // Memoire du cote d’entree du bateau (un Rdesc, un Rmon), reset au repos.
      { output: 'Rdesc', coilType: 'set', terms: [{ type: 'edge', varId: 'dAm', dir: 'rising' }], junctions: [] },
      { output: 'Rmon', coilType: 'set', terms: [{ type: 'edge', varId: 'dAv', dir: 'rising' }], junctions: [] },
      {
        output: 'Rdesc',
        coilType: 'reset',
        terms: [v('pAmFerm'), v('pAvFerm'), notV('dAm'), notV('dAv'), notV('dSas')],
        junctions: ['AND', 'AND', 'AND', 'AND'],
      },
      {
        output: 'Rmon',
        coilType: 'reset',
        terms: [v('pAmFerm'), v('pAvFerm'), notV('dAm'), notV('dAv'), notV('dSas')],
        junctions: ['AND', 'AND', 'AND', 'AND'],
      },
      // Phases vannes (approche ou sortie dans le bon sens, jusqu’au niveau visé).
      { output: 'Mrem', coilType: 'reset', terms: [v('nAm')], junctions: [] },
      { output: 'Mrem', coilType: 'set', terms: [v('dAm'), notV('nAm'), notV('alarme')], junctions: ['AND', 'AND'] },
      { output: 'Mrem', coilType: 'set', terms: [v('dSas'), v('Rmon'), notV('nAm'), notV('alarme')], junctions: ['AND', 'AND', 'AND'] },
      { output: 'Mvid', coilType: 'reset', terms: [v('nAv')], junctions: [] },
      { output: 'Mvid', coilType: 'set', terms: [v('dSas'), v('Rdesc'), notV('nAv'), notV('alarme')], junctions: ['AND', 'AND', 'AND'] },
      // Ouvertures de portes (entree ET sortie), reset par front ou au repos complet.
      { output: 'MouvAm', coilType: 'reset', terms: [{ type: 'edge', varId: 'dAm', dir: 'falling' }], junctions: [] },
      { output: 'MouvAm', coilType: 'reset', terms: [notV('dAm'), notV('dSas')], junctions: ['AND'] },
      { output: 'MouvAm', coilType: 'reset', terms: [notV('nAm')], junctions: [] },
      { output: 'MouvAm', coilType: 'set', terms: [v('dAm'), v('nAm'), notV('alarme')], junctions: ['AND', 'AND'] },
      { output: 'MouvAm', coilType: 'set', terms: [v('dSas'), v('Rmon'), v('nAm'), notV('alarme')], junctions: ['AND', 'AND', 'AND'] },
      { output: 'MouvAv', coilType: 'reset', terms: [{ type: 'edge', varId: 'dAv', dir: 'falling' }], junctions: [] },
      { output: 'MouvAv', coilType: 'reset', terms: [notV('dAv'), notV('dSas')], junctions: ['AND'] },
      { output: 'MouvAv', coilType: 'reset', terms: [notV('nAv')], junctions: [] },
      { output: 'MouvAv', coilType: 'set', terms: [v('dAv'), v('nAv'), notV('alarme')], junctions: ['AND', 'AND'] },
      { output: 'MouvAv', coilType: 'set', terms: [v('dSas'), v('Rdesc'), v('nAv'), notV('alarme')], junctions: ['AND', 'AND', 'AND'] },
      // Sorties.
      { output: 'mPmon', coilType: 'coil', terms: [v('MouvAm'), notV('bArret')], junctions: ['AND'] },
      { output: 'mPval', coilType: 'coil', terms: [v('MouvAv'), notV('bArret')], junctions: ['AND'] },
      { output: 'vRem', coilType: 'coil', terms: [v('Mrem'), notV('bArret')], junctions: ['AND'] },
      { output: 'vVid', coilType: 'coil', terms: [v('Mvid'), notV('bArret')], junctions: ['AND'] },
      { output: 'fVam', coilType: 'coil', terms: [v('mPmon')], junctions: [] },
      { output: 'fVav', coilType: 'coil', terms: [v('mPval')], junctions: [] },
      // Defauts : incoherence N-AM/N-AV ; porte commandee mais jamais ouverte (TON 2 s).
      { output: 'alarme', coilType: 'set', terms: [tq('t1'), tq('t2'), v('nAm'), v('nAv')], junctions: ['OR', 'OR', 'AND'] },
      { output: 'alarme', coilType: 'reset', terms: [v('bArret')], junctions: [] },
    ],
  };
}

export function exampleLadder(machine: MachineId): LadderProgram {
  if (machine === 'cuve') return cuveLadder();
  if (machine === 'convoyeur') return convoyeurLadder();
  if (machine === 'robot') return robotLadder();
  if (machine === 'pniveau') return pniveauLadder();
  if (machine === 'ecluse') return ecluseLadder();
  return feuxLadder();
}

function cuveBlocks(): BlocksProgram {
  const p = emptyBlocks();
  p.rules = [
    { when: [notV('sHaut'), notV('bArret'), v('bAru')], then: ['vanneR'] },
    { when: [v('sHaut')], then: ['voyVert'] },
    { when: [notV('bAru')], then: ['voyRouge'] },
    { when: [v('bArret')], then: ['voyRouge'] },
  ];
  return p;
}

function feuxBlocks(): BlocksProgram {
  const p = emptyBlocks();
  p.rules = [
    { when: [notV('bMarche')], then: ['r1', 'r2'] },
    { when: [v('bArret')], then: ['r1', 'r2'] },
    { when: [v('bMarche'), notV('bArret')], then: ['r1', 'v2'] },
  ];
  return p;
}

function convoyeurBlocks(): BlocksProgram {
  const p = emptyBlocks();
  p.rules = [
    { when: [notV('bArret')], then: ['moteur'] },
    { when: [v('dTri'), v('tTag'), notV('bArret')], then: ['poussoir'] },
    { when: [v('dTri'), notV('tTag')], then: ['voyVert'] },
    { when: [v('bArret')], then: ['voyRouge'] },
  ];
  return p;
}

function robotBlocks(): BlocksProgram {
  const p = emptyBlocks();
  p.rules = [
    { when: [notV('pDroite'), notV('bArret')], then: ['avancer'] },
    { when: [v('pDroite'), notV('bArret')], then: ['reculer'] },
    { when: [v('pMilieu'), notV('bArret')], then: ['bombe'] },
    { when: [v('pGauche')], then: ['voyVert'] },
    { when: [v('bArret')], then: ['voyRouge'] },
  ];
  return p;
}

function pniveauBlocks(): BlocksProgram {
  const p = emptyBlocks();
  p.rules = [
    { when: [v('dEntree')], then: ['barriere', 'feux'] },
    { when: [v('dSortie')], then: ['voyVert'] },
  ];
  return p;
}

function ecluseBlocks(): BlocksProgram {
  // Sans mémoire : seul le transit descendant (approche amont) est traité.
  // La montée exigerait de memoriser le côté d’entrée (Grafcet et Ladder le font).
  const p = emptyBlocks();
  p.rules = [
    { when: [v('dAm'), notV('nAm'), notV('bArret')], then: ['vRem'] },
    { when: [v('dAm'), v('nAm'), notV('bArret')], then: ['mPmon', 'fVam'] },
    { when: [v('dSas'), notV('dAm'), notV('nAv'), notV('bArret')], then: ['vVid'] },
    { when: [v('dSas'), v('nAv')], then: ['mPval', 'fVav'] },
    { when: [v('nAm'), v('nAv')], then: ['alarme'] },
    { when: [v('bArret')], then: ['alarme'] },
  ];
  return p;
}

export function exampleBlocks(machine: MachineId): BlocksProgram {
  if (machine === 'cuve') return cuveBlocks();
  if (machine === 'convoyeur') return convoyeurBlocks();
  if (machine === 'robot') return robotBlocks();
  if (machine === 'pniveau') return pniveauBlocks();
  if (machine === 'ecluse') return ecluseBlocks();
  return feuxBlocks();
}
