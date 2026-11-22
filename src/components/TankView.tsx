import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { C } from '../theme';
import { LEVEL_HIGH, LEVEL_LOW, LEVEL_MID } from '../system/model';

function SensorMark({ level, id }: { level: number; id: 'sBas' | 'sMoyen' | 'sHaut' }) {
  const names = { sBas: 'BS', sMoyen: 'BM', sHaut: 'BH' };
  const thresholds = { sBas: LEVEL_LOW, sMoyen: LEVEL_MID, sHaut: LEVEL_HIGH };
  const color = level >= thresholds[id] ? C.ok : C.dim;
  const pos = id === 'sBas' ? LEVEL_LOW : id === 'sMoyen' ? LEVEL_MID : LEVEL_HIGH;
  return (
    <View style={[styles.sensor, { bottom: `${pos}%` }]} pointerEvents="none">
      <View style={[styles.sensorDot, { backgroundColor: color }]} />
      <Text style={[styles.sensorLabel, { color }]}>{names[id]}</Text>
    </View>
  );
}

export function TankView({
  level,
  vars,
}: {
  level: number;
  vars: { sBas: boolean; sMoyen: boolean; sHaut: boolean; vanneR: boolean; pompeV: boolean; voyVert: boolean; voyRouge: boolean };
}) {
  return (
    <View style={styles.row}>
      <View style={styles.ioCol}>
        <View style={[styles.device, vars.vanneR ? styles.deviceOn : null]}>
          <Text style={[styles.deviceText, vars.vanneR ? styles.deviceTextOn : null]}>{'▼'}</Text>
          <Text style={[styles.deviceText, vars.vanneR ? styles.deviceTextOn : null]}>VANNE</Text>
        </View>
      </View>
      <View style={styles.tank}>
        <View style={[styles.water, { height: `${Math.max(level, 1.5)}%` }]}>
          <View style={styles.wave} />
        </View>
        <SensorMark level={level} id="sBas" />
        <SensorMark level={level} id="sMoyen" />
        <SensorMark level={level} id="sHaut" />
      </View>
      <View style={styles.ioCol}>
        <View style={[styles.device, vars.pompeV ? styles.deviceDanger : null]}>
          <Text style={[styles.deviceText, vars.pompeV ? styles.deviceTextDanger : null]}>{'▲'}</Text>
          <Text style={[styles.deviceText, vars.pompeV ? styles.deviceTextDanger : null]}>POMPE</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'stretch', gap: 14, paddingVertical: 8 },
  ioCol: { justifyContent: 'center', gap: 12 },
  tank: {
    flex: 1,
    height: 260,
    backgroundColor: '#0E1728',
    borderColor: C.border,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: 10,
    overflow: 'hidden',
    alignSelf: 'center',
    width: '62%',
  },
  water: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: C.water,
    borderTopColor: C.waterLight,
    borderTopWidth: 2,
  },
  wave: { flex: 1, opacity: 0.25, backgroundColor: C.waterLight },
  sensor: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 6,
  },
  sensorDot: { width: 10, height: 10, borderRadius: 5 },
  sensorLabel: { fontSize: 11, fontWeight: '800', fontFamily: 'monospace' },
  device: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
  },
  deviceOn: { backgroundColor: 'rgba(59,130,246,0.25)', borderColor: C.waterLight },
  deviceDanger: { backgroundColor: 'rgba(248,113,113,0.2)', borderColor: C.danger },
  deviceTextOn: { color: C.waterLight, fontWeight: '800' },
  deviceTextDanger: { color: C.danger, fontWeight: '800' },
  deviceText: { color: C.dim, fontSize: 11, fontFamily: 'monospace' },
});
