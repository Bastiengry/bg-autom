import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { C } from '../theme';
import {
  type RobotState,
  ROBOT_ZONE_A,
  ROBOT_ZONE_B,
  ROBOT_MID_LO,
  ROBOT_RIGHT,
} from '../system/machines';

function SensorMark({ pos, label }: { pos: number; label: string }) {
  return (
    <View style={[styles.sensor, { left: `${pos}%` }]} pointerEvents="none">
      <Text style={styles.sensorLabel}>{label}</Text>
    </View>
  );
}

export function RobotView({
  sys,
  outputs,
}: {
  sys: RobotState;
  outputs: Record<string, boolean>;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.railArea}>
        <View style={styles.rail}>
          <View style={[styles.pieceZone, { left: `${ROBOT_ZONE_A}%`, width: `${ROBOT_ZONE_B - ROBOT_ZONE_A}%` }]}>
            <Text style={styles.zoneLabel}>pièce</Text>
          </View>
          <SensorMark pos={ROBOT_MID_LO} label="P-M" />
          <SensorMark pos={ROBOT_RIGHT - 6} label="P-D" />
          <SensorMark pos={0} label="P-G" />
          <View
            style={[
              styles.cart,
              { left: `${Math.max(0, Math.min(sys.x - 6, 90))}%` },
            ]}
          >
            <Text style={styles.cartText}>{'\u{1F916}'}</Text>
          </View>
          {outputs.bombe ? (
            <View
              style={[
                styles.spray,
                { left: `${Math.max(0, Math.min(sys.x - 4, 92))}%` },
              ]}
            />
          ) : null}
        </View>
        <View style={styles.railBar} />
      </View>
      <View style={[styles.progress, { marginHorizontal: 24 }]}>
        <View style={[styles.progressFill, { width: `${Math.min(sys.painted, 100)}%` }]} />
      </View>
      <View style={styles.row}>
        <View style={[styles.device, outputs.avancer ? styles.onOk : null]}>
          <Text style={[styles.deviceText, outputs.avancer ? styles.onText : null]}>{'\u2192'} AVANCER</Text>
        </View>
        <View style={[styles.device, outputs.reculer ? styles.onOk : null]}>
          <Text style={[styles.deviceText, outputs.reculer ? styles.onText : null]}>{'\u2190'} RECULER</Text>
        </View>
        <View style={[styles.device, outputs.bombe ? styles.onDanger : null]}>
          <Text style={[styles.deviceText, outputs.bombe ? styles.onDangerText : null]}>BOMBE</Text>
        </View>
        <View style={[styles.device, outputs.voyRouge ? styles.onDanger : null]}>
          <Text style={[styles.deviceText, outputs.voyRouge ? styles.onDangerText : null]}>VOY. R</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10, paddingVertical: 8 },
  railArea: { gap: 2 },
  rail: {
    height: 92,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: '#0E1728',
    overflow: 'hidden',
  },
  railBar: { height: 6, borderRadius: 3, backgroundColor: '#1B2740' },
  pieceZone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(59,130,246,0.15)',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderLeftColor: C.accent,
    borderRightColor: C.accent,
    alignItems: 'center',
  },
  zoneLabel: { color: C.dim, fontSize: 10, marginTop: 2, fontFamily: 'monospace' },
  sensor: { position: 'absolute', top: 2, alignItems: 'center' },
  sensorLabel: { color: C.dim, fontSize: 10, fontWeight: '800', fontFamily: 'monospace' },
  cart: {
    position: 'absolute',
    bottom: 0,
    width: 26,
    height: 34,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  cartText: { fontSize: 22 },
  spray: {
    position: 'absolute',
    bottom: 0,
    width: 10,
    height: 40,
    backgroundColor: 'rgba(251,191,36,0.55)',
    borderRadius: 4,
  },
  progress: {
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: '#0E1728',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: C.accent },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  device: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: '#101A2C',
  },
  onOk: { backgroundColor: 'rgba(52,211,153,0.25)', borderColor: C.ok },
  onText: { color: C.ok },
  onDanger: { backgroundColor: 'rgba(248,113,113,0.25)', borderColor: C.danger },
  deviceText: { color: C.dim, fontSize: 12, fontWeight: '800', fontFamily: 'monospace' },
  onDangerText: { color: C.danger },
});
