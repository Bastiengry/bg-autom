import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { C } from '../theme';

const LAMP_ON = {
  R: '#EF4444',
  O: '#F59E0B',
  V: '#22C55E',
} as const;

function Lamp({ color, on, label }: { color: 'R' | 'O' | 'V'; on: boolean; label: string }) {
  return (
    <View style={[styles.lamp, on ? { backgroundColor: LAMP_ON[color], borderColor: LAMP_ON[color] } : null]}>
      <Text style={[styles.lampText, on ? styles.lampTextOn : null]}>{label}</Text>
    </View>
  );
}

export function FeuxView({
  vars,
}: {
  vars: Record<string, boolean>;
}) {
  const road = (n: 1 | 2) => (
    <View style={styles.road}>
      <Text style={styles.roadTitle}>{`Voie ${n}`}</Text>
      <Lamp color="R" on={!!vars[`r${n}`]} label="R" />
      <Lamp color="O" on={!!vars[`o${n}`]} label="O" />
      <Lamp color="V" on={!!vars[`v${n}`]} label="V" />
    </View>
  );
  return (
    <View style={styles.row}>
      {road(1)}
      <View style={styles.cross}>
        <Text style={styles.crossX}>✕</Text>
      </View>
      {road(2)}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18, paddingVertical: 12 },
  road: {
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: '#0E1728',
  },
  roadTitle: { color: C.dim, fontSize: 12, fontWeight: '800', fontFamily: 'monospace' },
  lamp: {
    width: 72,
    height: 44,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: C.border,
    backgroundColor: '#101A2C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lampText: { color: C.dim, fontSize: 16, fontWeight: '800', fontFamily: 'monospace' },
  lampTextOn: { color: '#0B1220' },
  cross: { alignItems: 'center', justifyContent: 'center' },
  crossX: { color: C.dim, fontSize: 30, fontWeight: '900' },
});
