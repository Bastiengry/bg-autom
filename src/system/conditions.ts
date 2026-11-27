import type { Condition, MachineId } from '../types';
import { MACHINES } from './machines';

export interface ConditionItem {
  id: string;
  label: string;
  detail?: string;
}

export function conditionLabel(c: Condition, machine: MachineId): string {
  const vars = MACHINES[machine].vars;
  const varLabel = (id: string) => vars.find((v) => v.id === id)?.label ?? id;
  switch (c.type) {
    case 'var':
      return `${c.negated ? '/' : ''}${varLabel(c.varId)}`;
    case 'edge':
      return `front ${c.dir === 'rising' ? '\u2191' : '\u2193'} ${varLabel(c.varId)}`;
    case 'level':
      return `${c.op === '>=' ? 'Niveau \u2265' : 'Niveau \u2264'} ${c.value} %`;
    case 'timerContact':
      return `${c.timerId}.Q`;
    case 'counterContact':
      return `${c.counterId}.Q`;
    default:
      return '?';
  }
}

export function contactItems(machine: MachineId): ConditionItem[] {
  return MACHINES[machine].vars.map((v) => ({
    id: `var:${v.id}`,
    label: v.label,
    detail: v.detail,
  }));
}

export function frontItems(machine: MachineId): ConditionItem[] {
  return MACHINES[machine].vars
    .filter((v) => v.kind === 'input')
    .map((v) => ({ id: `var:${v.id}`, label: v.label, detail: v.detail }));
}
