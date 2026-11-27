import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { C } from '../theme';
import type { Condition, MachineId } from '../types';
import { Chip, ItemPicker } from './ui';
import { MACHINES } from '../system/machines';
import { conditionLabel, contactItems, frontItems } from '../system/conditions';

export { conditionLabel, contactItems } from '../system/conditions';

type AnyCondition = Condition;

export default function ConditionListEditor({
  conditions,
  onChange,
  machine,
  pickerTitle,
  emptyHint,
  timers = [],
  counters = [],
  hideLevelThresholds = false,
}: {
  conditions: AnyCondition[];
  onChange: (next: AnyCondition[]) => void;
  machine: MachineId;
  pickerTitle: string;
  emptyHint: string;
  timers?: string[];
  counters?: string[];
  hideLevelThresholds?: boolean;
}) {
  const [modal, setModal] = useState<null | 'contact' | 'front' | 'seuil' | 'tempo' | 'compteur'>(null);

  const add = (c: AnyCondition) => onChange([...conditions, c]);
  const addContact = (id: string) => {
    const varId = id.slice(4);
    if (conditions.some((c) => c.type === 'var' && c.varId === varId)) return;
    add({ type: 'var', varId, negated: false });
  };
  const addFront = (id: string) => {
    const varId = id.slice(5);
    if (conditions.some((c) => c.type === 'edge' && c.varId === varId)) return;
    add({ type: 'edge', varId, dir: 'rising' });
  };

  const patch = (i: number, p: Partial<AnyCondition>) => {
    const next = [...conditions] as AnyCondition[];
    next[i] = { ...next[i], ...p } as AnyCondition;
    onChange(next);
  };

  return (
    <View style={styles.wrap}>
      {conditions.length === 0 ? <Text style={styles.hint}>{emptyHint}</Text> : null}
      <View style={styles.rows}>
        {conditions.map((c, i) => (
          <View key={`${c.type}_${i}`} style={styles.row}>
            {rowContent(c, i, machine, patch, () => onChange(conditions.filter((_, j) => j !== i)))}
          </View>
        ))}
      </View>
      <View style={styles.addRow}>
        <Chip label="+ Contact" selected={false} onPress={() => setModal('contact')} />
        <Chip label="+ Front" selected={false} onPress={() => setModal('front')} />
        {MACHINES[machine].numericLabel && !hideLevelThresholds ? (
          <Chip label="+ Seuil niveau" selected={false} onPress={() => {
            add({ type: 'level', op: '>=', value: 50 });
          }} />
        ) : null}
        {timers.length > 0 ? (
          <Chip label="+ Fin de tempo" selected={false} onPress={() => setModal('tempo')} />
        ) : null}
        {counters.length > 0 ? (
          <Chip label="+ Compteur atteint" selected={false} onPress={() => setModal('compteur')} />
        ) : null}
      </View>

      <ItemPicker
        visible={modal === 'contact'}
        title="Contact / capteur / relais"
        items={contactItems(machine)}
        onSelect={addContact}
        onClose={() => setModal(null)}
      />
      <ItemPicker
        visible={modal === 'front'}
        title="Front (entrée seulement)"
        items={frontItems(machine)}
        onSelect={(id) => {
          addFront(id);
          setModal(null);
        }}
        onClose={() => setModal(null)}
      />
      <ItemPicker
        visible={modal === 'tempo'}
        title="Fin de tempo"
        items={timers.map((id) => ({ id: `timer:${id}`, label: `${id}.Q` }))}
        onSelect={(id) => {
          add({ type: 'timerContact', timerId: id.slice(6) });
          setModal(null);
        }}
        onClose={() => setModal(null)}
      />
      <ItemPicker
        visible={modal === 'compteur'}
        title="Seuil compteur"
        items={counters.map((id) => ({ id: `counter:${id}`, label: `${id}.Q` }))}
        onSelect={(id) => {
          add({ type: 'counterContact', counterId: id.slice(8) });
          setModal(null);
        }}
        onClose={() => setModal(null)}
      />
    </View>
  );
}

function rowContent(
  c: AnyCondition,
  i: number,
  machine: MachineId,
  patch: (i: number, p: Partial<AnyCondition>) => void,
  remove: () => void,
): React.ReactNode {
  const text = conditionLabel(c, machine);
  return (
    <>
      <Text style={styles.wire}>├─┤ </Text>
      <Text style={[styles.condText, fontWeightFor(c)]}>{text}</Text>
      <Text style={styles.wire}> ├─</Text>
      {c.type === 'var' ? (
        <Pressable style={styles.smallBtn} onPress={() => patch(i, { negated: !c.negated } as Partial<AnyCondition>)}>
          <Text style={styles.smallBtnText}>NON</Text>
        </Pressable>
      ) : null}
      {c.type === 'level' ? (
        <>
          <Pressable style={styles.smallBtn} onPress={() => patch(i, { op: c.op === '>=' ? '<=' : '>=' } as Partial<AnyCondition>)}>
            <Text style={styles.smallBtnText}>≥/≤</Text>
          </Pressable>
          <Pressable style={styles.smallBtn} onPress={() => patch(i, { value: Math.max(0, c.value - 5) } as Partial<AnyCondition>)}>
            <Text style={styles.smallBtnText}>−</Text>
          </Pressable>
          <Pressable style={styles.smallBtn} onPress={() => patch(i, { value: Math.min(100, c.value + 5) } as Partial<AnyCondition>)}>
            <Text style={styles.smallBtnText}>+</Text>
          </Pressable>
        </>
      ) : null}
      {c.type === 'edge' ? (
        <Pressable style={styles.smallBtn} onPress={() => patch(i, { dir: c.dir === 'rising' ? 'falling' : 'rising' } as Partial<AnyCondition>)}>
          <Text style={styles.smallBtnText}>↑/↓</Text>
        </Pressable>
      ) : null}
      <Pressable onPress={remove} hitSlop={8}>
        <Text style={styles.delete}>✕</Text>
      </Pressable>
    </>
  );
}

function fontWeightFor(c: AnyCondition) {
  return c.type === 'timerContact' ? styles.extra : null;
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  rows: { gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  addRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  wire: { color: C.dim, fontSize: 13, fontFamily: 'monospace' },
  condText: { color: C.accent, fontSize: 13, fontFamily: 'monospace', fontWeight: '700', flexShrink: 1 },
  wire2: { color: C.dim, fontSize: 13, fontFamily: 'monospace' },
  extra: { color: C.warn },
  smallBtn: {
    backgroundColor: C.cardAlt,
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  smallBtnText: { color: C.dim, fontSize: 11, fontWeight: '700' },
  hint: { color: C.dim, fontSize: 13, fontStyle: 'italic' },
  delete: { color: C.danger, fontSize: 13, fontWeight: '700', paddingHorizontal: 4 },
});
