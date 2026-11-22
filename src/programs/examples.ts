import type { BlocksProgram, GrafcetProgram, LadderProgram } from '../types';
import { emptyBlocks, emptyGrafcet } from '../types';

export function exampleGrafcet(): GrafcetProgram {
  const p = emptyGrafcet();
  p.nodes = [
    { actions: [], transition: [{ varId: 'bMarche', negated: false }] },
    { actions: ['vanneR', 'voyVert'], transition: [{ varId: 'sHaut', negated: false }] },
    { actions: ['pompeV', 'voyRouge'], transition: [{ varId: 'sBas', negated: false }] },
  ];
  p.loopTo = 1;
  return p;
}

export function exampleLadder(): LadderProgram {
  return {
    rungs: [
      {
        output: 'vanneR',
        terms: [
          { varId: 'bMarche', negated: false },
          { varId: 'vanneR', negated: false },
          { varId: 'sHaut', negated: true },
        ],
        junctions: ['OR', 'AND'],
      },
      {
        output: 'pompeV',
        terms: [
          { varId: 'sHaut', negated: false },
          { varId: 'pompeV', negated: false },
          { varId: 'sBas', negated: true },
        ],
        junctions: ['OR', 'AND'],
      },
      {
        output: 'voyVert',
        terms: [{ varId: 'vanneR', negated: false }],
        junctions: [],
      },
    ],
  };
}

export function exampleBlocks(): BlocksProgram {
  const p = emptyBlocks();
  p.rules = [
    { when: { varId: 'sHaut', negated: true }, then: ['vanneR'] },
    { when: { varId: 'sHaut', negated: false }, then: ['voyVert'] },
  ];
  return p;
}
