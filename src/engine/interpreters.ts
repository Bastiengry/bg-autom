import type {
  BlocksProgram,
  Condition,
  GrafcetProgram,
  LadderProgram,
  ProgramMode,
  AnyProgram,
} from '../types';
import { TICK_MS } from '../system/machines';

export interface InterpState {
  active: number[];
  mem: Record<string, boolean>;
  tmr: Record<string, { et: number; q: boolean }>;
  ctr: Record<string, { pv: number; q: boolean }>;
  stepMs: number;
  prev: Record<string, boolean>;
}

export function initInterpState(): InterpState {
  return { active: [], mem: {}, tmr: {}, ctr: {}, stepMs: 0, prev: {} };
}

export interface EvalContext {
  level: number;
}

export interface EvalResult {
  outputs: Record<string, boolean>;
  state: InterpState;
}

function varsSnapshot(
  inputs: Record<string, boolean>,
  prevMem: Record<string, boolean>,
): Record<string, boolean> {
  return { ...prevMem, ...inputs };
}

function truth(c: Condition, vars: Record<string, boolean>, state: InterpState, ctx: EvalContext): boolean {
  const prev = (id: string): boolean => {
    const v = vars[id];
    const was = state.prev[id] ?? !!v;
    return was;
  };
  switch (c.type) {
    case 'edge': {
      const now = !!vars[c.varId];
      const before = prev(c.varId);
      return c.dir === 'rising' ? now && !before : !now && before;
    }
    case 'level':
      return c.op === '>=' ? ctx.level >= c.value : ctx.level <= c.value;
    case 'timerContact':
      return !!state.tmr[c.timerId]?.q;
    case 'counterContact':
      return !!state.ctr[c.counterId]?.q;
    case 'var':
    default: {
      const v = c as { type?: string; varId?: string; negated?: boolean };
      const val = !!vars[v.varId ?? ''];
      return v.negated ? !val : val;
    }
  }
}

function evalAll(conds: Condition[], vars: Record<string, boolean>, state: InterpState, ctx: EvalContext): boolean {
  return conds.every((c) => truth(c, vars, state, ctx));
}

function advanceTimers(program: LadderProgram, vars: Record<string, boolean>, state: InterpState, ctx: EvalContext) {
  for (const t of program.timers) {
    const input = evalAll(t.input, vars, state, ctx);
    const prev = state.tmr[t.id] ?? { et: 0, q: false };
    let et = prev.et;
    let q = false;
    if (t.type === 'TON') {
      et = input ? Math.min(et + TICK_MS, t.presetMs) : 0;
      q = et >= t.presetMs;
    } else if (t.type === 'TOF') {
      et = input ? 0 : Math.min(et + TICK_MS, t.presetMs);
      q = input || et < t.presetMs;
    } else {
      if (prev.q) {
        et = Math.min(et + TICK_MS, t.presetMs);
        q = et < t.presetMs;
      } else if (input) {
        et = 0;
        q = true;
      } else {
        et = 0;
        q = false;
      }
    }
    state.tmr[t.id] = { et, q };
  }
}

function advanceCounters(program: LadderProgram, vars: Record<string, boolean>, state: InterpState, ctx: EvalContext) {
  for (const c of program.counters) {
    const trig = evalAll(c.trigger, vars, state, ctx);
    const rst = evalAll(c.resetCondition, vars, state, ctx);
    const prev = state.ctr[c.id] ?? { pv: 0, q: false };
    const rising = c.type === 'CTU' ? trig && !state.prev['__ctr_' + c.id] : !trig && state.prev['__ctr_' + c.id];
    state.prev['__ctr_' + c.id] = trig;
    let pv = prev.pv;
    if (rst) pv = 0;
    else if (rising) pv = Math.min(pv + 1, 9999);
    state.ctr[c.id] = { pv, q: pv >= c.preset };
  }
}

function runGrafcet(
  program: GrafcetProgram,
  vars: Record<string, boolean>,
  state: InterpState,
  ctx: EvalContext,
): EvalResult {
  const nodes = program.nodes;
  if (nodes.length === 0) return { outputs: { ...state.mem }, state };
  // Instantane de ce scan (entrees + mem des Set/Reset) : sert a l'evaluation
  // ET devient l'historique du scan suivant (conditions `front`).
  const vars2 = varsSnapshot(vars, state.mem);
  const out: Record<string, boolean> = {};
  const active = state.active;
  const valid = active.filter((i) => i >= 0 && i < nodes.length);
  const starting = valid.length === 0 ? [0] : valid;

  const state2: InterpState = { ...state, active: starting };

  const nextSet = new Set<number>();
  const deactivating: number[] = [];
  for (const i of starting) {
    const node = nodes[i];
    const mainTrue =
      evalAll(node.transition, vars2, state2, ctx) &&
      (node.afterSeconds === null || state.stepMs >= node.afterSeconds * 1000) &&
      node.waitsFor.every((w) => starting.includes(w));
    let firedAlt: { goto: number } | null = null;
    if (!mainTrue) {
      for (const a of node.alt) {
        if (evalAll(a.condition, vars2, state2, ctx)) {
          firedAlt = a;
          break;
        }
      }
    }
    const target = mainTrue ? 'next' : firedAlt ? 'alt' : null;
    if (target) {
      deactivating.push(i);
      if (target === 'next') {
        const n = i + 1 >= nodes.length ? Math.min(program.loopTo, nodes.length - 1) : i + 1;
        nextSet.add(n);
        for (const f of nodes[i].forks) nextSet.add(f);
      } else if (firedAlt) {
        if (firedAlt.goto >= 0 && firedAlt.goto < nodes.length) nextSet.add(firedAlt.goto);
      }
    } else {
      nextSet.add(i);
    }
  }

  const newActive = [...nextSet];

  const mem3 = { ...state.mem };
  for (const i of newActive) {
    for (const a of nodes[i].actions) {
      if (a.mode === 'set') mem3[a.varId] = true;
    }
  }
  for (const d of deactivating) {
    for (const a of nodes[d].actions) {
      if (a.mode === 'reset') mem3[a.varId] = false;
    }
  }

  for (const i of newActive) {
    for (const a of nodes[i].actions) {
      if (a.mode === 'level') out[a.varId] = true;
      else if (a.mode === 'set') mem3[a.varId] = true;
    }
  }
  const outputsAll = { ...mem3, ...out };

  const stillActive = starting.filter((i) => nextSet.has(i));
  const nextStepMs =
    newActive.length === stillActive.length && newActive.every((i) => stillActive.includes(i))
      ? state.stepMs + TICK_MS
      : 0;

  return { outputs: outputsAll, state: { ...state, active: newActive, mem: mem3, stepMs: nextStepMs, prev: vars2 } };
}

function runLadder(
  program: LadderProgram,
  vars: Record<string, boolean>,
  state: InterpState,
  ctx: EvalContext,
): EvalResult {
  const prevScan = state.prev;
  const snapshot = varsSnapshot(vars, state.mem);
  const st2: InterpState = { ...state, prev: prevScan };
  advanceTimers(program, snapshot, st2, ctx);
  advanceCounters(program, snapshot, st2, ctx);
  const current = { ...snapshot };
  const targets = new Set<{ id: string; type: 'coil' | 'set' | 'reset'; val: boolean }>();
  for (const rung of program.rungs) {
    if (rung.terms.length === 0) {
      targets.add({ id: rung.output, type: rung.coilType, val: false });
      continue;
    }
    let acc = truth(rung.terms[0], current, st2, ctx);
    for (let i = 1; i < rung.terms.length; i++) {
      const v = truth(rung.terms[i], current, st2, ctx);
      acc = rung.junctions[i - 1] === 'AND' ? acc && v : acc || v;
    }
    targets.add({ id: rung.output, type: rung.coilType, val: acc });
  }
  const out: Record<string, boolean> = { ...snapshot };
  const writes = [...targets];
  for (const w of writes) {
    if (w.type === 'coil') out[w.id] = w.val;
  }
  for (const w of writes) {
    if (w.type === 'set' && w.val) out[w.id] = true;
    if (w.type === 'reset' && w.val) out[w.id] = false;
  }
  const mem: Record<string, boolean> = {};
  for (const k of Object.keys(out)) mem[k] = out[k];
  const nextPrev = { ...snapshot };
  for (const c of program.counters) {
    nextPrev['__ctr_' + c.id] = !!prevScan['__ctr_' + c.id];
  }
  return { outputs: out, state: { ...st2, prev: nextPrev, mem } };
}

function runBlocks(program: BlocksProgram, vars: Record<string, boolean>, state: InterpState, ctx: EvalContext): EvalResult {
  const out: Record<string, boolean> = {};
  for (const rule of program.rules) {
    if (evalAll(rule.when, vars, state, ctx)) {
      for (const a of rule.then) out[a] = true;
    }
  }
  return { outputs: out, state: { ...state, prev: { ...vars } } };
}

export function runProgram(
  mode: ProgramMode,
  program: AnyProgram,
  vars: Record<string, boolean>,
  state: InterpState,
  ctx: EvalContext,
): EvalResult {
  switch (mode) {
    case 'grafcet':
      return runGrafcet(program as GrafcetProgram, vars, state, ctx);
    case 'ladder':
      return runLadder(program as LadderProgram, vars, state, ctx);
    case 'blocks':
      return runBlocks(program as BlocksProgram, vars, state, ctx);
  }
}
