import type {
  BlocksProgram,
  Condition,
  GrafcetProgram,
  LadderProgram,
  ProgramMode,
  VarId,
  Vars,
} from '../types';
import { OUTPUT_IDS } from '../types';

export interface InterpState {
  node: number;
}

export function initInterpState(): InterpState {
  return { node: 0 };
}

function truth(c: Condition, vars: Vars): boolean {
  const v = vars[c.varId];
  return c.negated ? !v : v;
}

function freshOutputs(): Vars {
  const o = {} as Vars;
  for (const id of OUTPUT_IDS) o[id as VarId] = false;
  return o;
}

export interface EvalResult {
  outputs: Vars;
  state: InterpState;
}

function runGrafcet(
  program: GrafcetProgram,
  vars: Vars,
  state: InterpState,
): EvalResult {
  const outputs = freshOutputs();
  const nodes = program.nodes;
  if (nodes.length === 0) return { outputs, state };
  let node = state.node;
  if (node < 0 || node >= nodes.length) node = 0;
  const transition = nodes[node].transition;
  const fires = transition.every((c) => truth(c, vars));
  if (fires) {
    node = node + 1;
    if (node >= nodes.length) node = Math.min(program.loopTo, nodes.length - 1);
  }
  for (const a of nodes[node].actions) outputs[a] = true;
  return { outputs, state: { node } };
}

function runLadder(program: LadderProgram, vars: Vars): EvalResult {
  const outputs = freshOutputs();
  for (const rung of program.rungs) {
    if (rung.terms.length === 0) {
      outputs[rung.output] = false;
      continue;
    }
    let acc = truth(rung.terms[0], vars);
    for (let i = 1; i < rung.terms.length; i++) {
      const v = truth(rung.terms[i], vars);
      acc = rung.junctions[i - 1] === 'AND' ? acc && v : acc || v;
    }
    outputs[rung.output] = acc;
  }
  return { outputs, state: { node: 0 } };
}

function runBlocks(program: BlocksProgram, vars: Vars): EvalResult {
  const outputs = freshOutputs();
  for (const rule of program.rules) {
    if (truth(rule.when, vars)) {
      for (const a of rule.then) outputs[a] = true;
    }
  }
  return { outputs, state: { node: 0 } };
}

export function runProgram(
  mode: ProgramMode,
  program: GrafcetProgram | LadderProgram | BlocksProgram,
  vars: Vars,
  state: InterpState,
): EvalResult {
  switch (mode) {
    case 'grafcet':
      return runGrafcet(program as GrafcetProgram, vars, state);
    case 'ladder':
      return runLadder(program as LadderProgram, vars);
    case 'blocks':
      return runBlocks(program as BlocksProgram, vars);
  }
}
