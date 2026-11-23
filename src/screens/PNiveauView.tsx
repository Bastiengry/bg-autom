import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { C } from '../theme';
import { type PNiveauState, PN_CROSS_A, PN_CROSS_B } from '../system/machines';

export function PNiveauView({
  sys,
  outputs,
}: {
  sys: PNiveauState;
  outputs: Record<string, boolean>;
}) {
  const closed = sys.barPos >= 50;
  return (
    <View style={styles.wrap}>
      <View style={styles.rail}>
        <View style={[styles.crossing, { left: `${PN_CROSS_A}%`, width: `${PN_CROSS_B - PN_CROSS_A}%` }]}>
          <Text style={styles.zoneLabel}>{'\u2715'}</Text>
        </View>
        {sys.train !== null ? (
          <Text style={[styles.train, { left: `${Math.max(0, Math.min(sys.train - 8, 90))}%` }]}>{'\u{1F682}'}</Text>
        ) : null}
      </View>
      <View style={styles.road}>
        <View style={[styles.barrierStroke, { left: `${PN_CROSS_A}%` }]}>
          <View style={[styles.barrier, { height: `${Math.max(8, Math.min(sys.barPos, 100))}%`, backgroundColor: closed ? C.danger : C.warn }]} />
        </View>
        {outputs.feux ? <Text style={styles.feux}>{'\u{1F534}'}</Text> : <Text style={styles.feuxOff}>{'\u25CB'}</Text>}
        <Text style={styles.roadLabel}>route {'\u23CE'} voitures à l’arrêt quand la barrière est rouge</Text>
      </View>
      <View style={styles.row}>
        <View style={[styles.device, outputs.barriere ? styles.onOk : null]}>
          <Text style={[styles.deviceText, outputs.barriere ? styles.onText : null]}>BARRIÈRE</Text>
        </View>
        <View style={[styles.device, outputs.feux ? styles.onDanger : null]}>
          <Text style={[styles.deviceText, outputs.feux ? styles.onDangerText : null]}>FEUX</Text>
        </View>
        <View style={[styles.device, outputs.alarme ? styles.onDanger : null]}>
          <Text style={[styles.deviceText, outputs.alarme ? styles.onDangerText : null]}>ALARME</Text>
        </View>
      </View>
      <Text style={styles.legend}>Barrière réelle : {Math.round(sys.barPos)} % (fermée = 100)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10, paddingVertical: 8 },
  rail: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: '#0E1728',
    overflow: 'hidden',
  },
  crossing: {
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
  zoneLabel: { color: C.dim, fontSize: 12 },
  train: { position: 'absolute', bottom: 0, fontSize: 22 },
  road: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 56,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: '#101A2C',
    paddingHorizontal: 10,
  },
  barrierStroke: {
    position: 'absolute',
    left: '50%',
    marginLeft: -5,
    top: 6,
    bottom: 6,
    width: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  barrier: { width: '100%' },
  feux: { fontSize: 20, marginLeft: 18 },
  feuxOff: { fontSize: 20, color: C.dim, marginLeft: 18 },
  roadLabel: { color: C.dim, fontSize: 11, flex: 1, marginLeft: 18 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  device: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: '#101A2C',
  },
  onOk: { backgroundColor: 'rgba(59,130,246,0.25)', borderColor: C.accent },
  onText: { color: C.accent },
  onDanger: { backgroundColor: 'rgba(248,113,113,0.25)', borderColor: C.danger },
  deviceText: { color: C.dim, fontSize: 12, fontWeight: '800', fontFamily: 'monospace' },
  onDangerText: { color: C.danger },
  legend: { color: C.dim, fontSize: 11, textAlign: 'center' },
});
