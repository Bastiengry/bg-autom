import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { C } from '../theme';
import { type ConvoyeurState, TRI_START, TRI_END } from '../system/machines';

function Device({ on, onColor, label }: { on: boolean; onColor: string; label: string }) {
  return (
    <View style={[styles.device, on ? { backgroundColor: onColor, borderColor: onColor } : null]}>
      <Text style={[styles.deviceText, on ? styles.deviceTextDark : null]}>
        {label}
      </Text>
    </View>
  );
}

export function ConveyorView({
  sys,
  outputs,
}: {
  sys: ConvoyeurState;
  outputs: Record<string, boolean>;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.beltArea}>
        <View style={styles.track}>
          <View style={[styles.triZone, { left: `${TRI_START}%`, width: `${TRI_END - TRI_START}%` }]}>
            <Text style={styles.zoneLabel}>tri</Text>
          </View>
          <View style={[styles.chuteMark, { left: '98%' }]}>
            <Text style={styles.zoneLabel}>B</Text>
          </View>
          {sys.parts.map((p, i) => (
            <View
              key={i}
              style={[
                styles.box,
                p.type === 'A' ? styles.boxA : styles.boxB,
                { left: `${Math.max(0, Math.min(p.pos - 2, 96))}%` },
              ]}
            />
          ))}
          {outputs.poussoir ? <View style={[styles.pusher, { left: `${TRI_START}%`, width: `${TRI_END - TRI_START}%` }]} /> : null}
        </View>
        <View style={styles.beltBar} />
      </View>
      <View style={styles.row}>
        <Device on={!!outputs.moteur} onColor="rgba(52,211,153,0.55)" label="MOTEUR" />
        <Device on={!!outputs.poussoir} onColor="rgba(239,68,68,0.7)" label="POUSSOIR" />
        <Device on={!!outputs.voyVert} onColor="rgba(52,211,153,0.55)" label="VOY. V" />
        <Device on={!!outputs.voyRouge} onColor="rgba(239,68,68,0.7)" label="VOY. R" />
      </View>
      <Text style={styles.legend}>
        {'\u2B1C'} colis normal — {'\u{1F7E7}'} fragile (type A) : à éjecter en zone de tri
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10, paddingVertical: 8 },
  beltArea: { gap: 2 },
  track: {
    flexDirection: 'row',
    height: 64,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: '#0E1728',
    overflow: 'hidden',
  },
  triZone: {
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
  chuteMark: { position: 'absolute', top: 0, bottom: 0, alignItems: 'center' },
  zoneLabel: { color: C.dim, fontSize: 10, marginTop: 2, fontFamily: 'monospace' },
  box: {
    position: 'absolute',
    bottom: 8,
    width: 18,
    height: 20,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: C.border,
  },
  boxA: { backgroundColor: '#F59E0B' },
  boxB: { backgroundColor: '#60A5FA' },
  pusher: {
    position: 'absolute',
    top: 0,
    height: 30,
    backgroundColor: 'rgba(239,68,68,0.85)',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  beltBar: { height: 6, borderRadius: 3, backgroundColor: '#1B2740' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  device: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: '#101A2C',
  },
  deviceText: { color: C.dim, fontSize: 12, fontWeight: '800', fontFamily: 'monospace' },
  deviceTextDark: { color: '#0B1220' },
  legend: { color: C.dim, fontSize: 11, textAlign: 'center' },
});
