import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { C } from '../theme';
import { VAR_LABELS, VAR_DEFS, type Condition, type VarId } from '../types';
import { Chip, ItemPicker, type PickerItem } from './ui';

export function inputPickerItems(): PickerItem[] {
  return VAR_DEFS.filter((v) => v.kind === 'input').map((v) => ({
    id: v.id,
    label: v.label,
    detail: v.detail,
  }));
}

export function ioPickerItems(): PickerItem[] {
  return VAR_DEFS.map((v) => ({ id: v.id, label: v.label, detail: v.detail }));
}

export function ConditionListEditor({
  conditions,
  onChange,
  items,
  pickerTitle,
  emptyHint,
}: {
  conditions: Condition[];
  onChange: (next: Condition[]) => void;
  items: PickerItem[];
  pickerTitle: string;
  emptyHint: string;
}) {
  const [picking, setPicking] = useState(false);

  const addCondition = (id: string) => {
    const varId = id as VarId;
    if (conditions.some((c) => c.varId === varId)) return;
    onChange([...conditions, { varId, negated: false }]);
  };

  const toggleNegate = (i: number) => {
    const next = [...conditions];
    next[i] = { ...next[i], negated: !next[i].negated };
    onChange(next);
  };

  const remove = (i: number) => onChange(conditions.filter((_, j) => j !== i));

  return (
    <View style={styles.wrap}>
      {conditions.length === 0 ? <Text style={styles.hint}>{emptyHint}</Text> : null}
      <View style={styles.rows}>
        {conditions.map((c, i) => (
          <View key={c.varId} style={styles.row}>
            <Text style={styles.link}>├──┤</Text>
            {c.negated ? <Text style={styles.neg}>/</Text> : null}
            <Text style={styles.condLabel}>{VAR_LABELS[c.varId]}</Text>
            <Text style={styles.link}>├──</Text>
            <Pressable onPress={() => toggleNegate(i)} style={styles.smallBtn} hitSlop={8}>
              <Text style={styles.smallBtnText}>NON</Text>
            </Pressable>
            <Pressable onPress={() => remove(i)} style={[styles.smallBtn, styles.delBtn]} hitSlop={8}>
              <Text style={[styles.smallBtnText, { color: C.danger }]}>✕</Text>
            </Pressable>
          </View>
        ))}
      </View>
      <Chip label="+ Ajouter une condition" selected={false} onPress={() => setPicking(true)} />
      <ItemPicker
        visible={picking}
        title={pickerTitle}
        items={items}
        onSelect={addCondition}
        onClose={() => setPicking(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  rows: { gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  link: { color: C.dim, fontSize: 13, fontFamily: 'monospace' },
  neg: { color: C.warn, fontWeight: '900', fontSize: 15 },
  condLabel: {
    color: C.accent,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'monospace',
    minWidth: 70,
  },
  smallBtn: {
    backgroundColor: C.cardAlt,
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  smallBtnText: { color: C.dim, fontSize: 11, fontWeight: '700' },
  delBtn: { marginLeft: 'auto' },
  hint: { color: C.dim, fontSize: 13, fontStyle: 'italic' },
});
