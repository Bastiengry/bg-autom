import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { C } from '../theme';
import { type EcluseState, ECL_AM_READY, ECL_AV_READY } from '../system/machines';

const AVAL_WATER = 18;
const AMONT_WATER = 80;

export function EcluseView({
  sys,
  outputs,
}: {
  sys: EcluseState;
  outputs: Record<string, boolean>;
}) {
  const sasWater = 8 + 0.72 * sys.lvl;
  // Porte aval : ferm\u00e9e, elle isole le sas jusqu\u2019au niveau amont ; ouverte, elle affleure l\u2019eau du sas.
  const doorAvH = sasWater + (1 - sys.pAv / 100) * (AMONT_WATER - sasWater);
  // Porte amont : ferm\u00e9e, elle descend jusqu\u2019au niveau aval ; ouverte, elle affleure l\u2019eau du sas.
  const doorAmH = AVAL_WATER + (1 - sys.pAm / 100) * (sasWater - AVAL_WATER);
  const boat = sys.boat;
  const sens = sys.sens === 'desc' ? '\u2193' : '\u2191';

  return (
    <View style={styles.wrap}>
      <View style={styles.canal}>
        <View style={[styles.side, styles.aval]}>
          <View style={[styles.water, { height: `${AVAL_WATER}%` }]} />
          {boat === 'aval' ? <Text style={styles.boat}>{'\u{1F6A4}'}</Text> : null}
        </View>
        <View style={styles.gateSlot}>
          <View style={[styles.door, { height: `${Math.max(4, doorAvH)}%` }, sys.pAv <= 5 ? styles.doorClosed : styles.doorOpen]} />
        </View>
        <View style={[styles.side, styles.sas]}>
          <View style={[styles.water, { height: `${sasWater}%` }, sys.lvl > ECL_AV_READY && sys.lvl < ECL_AM_READY ? styles.waterMid : null]} />
          {boat === 'sas' ? <Text style={[styles.boat, styles.boatSas]}>{`\u{1F6A4}${sens}`}</Text> : null}
          <Text style={styles.sasLabel}>SAS {Math.round(sys.lvl)} %
          </Text>
        </View>
        <View style={styles.gateSlot}>
          <View style={[styles.door, { height: `${Math.max(4, doorAmH)}%` }, sys.pAm <= 5 ? styles.doorClosed : styles.doorOpen]} />
        </View>
        <View style={[styles.side, styles.amont]}>
          <View style={[styles.water, { height: `${AMONT_WATER}%` }]} />
          {boat === 'amont' ? <Text style={styles.boat}>{'\u{1F6A4}'}</Text> : null}
        </View>
      </View>
      <View style={styles.row}>
        <Text style={styles.sideLabel}>AVAL (D-DET AV)</Text>
        <Text style={styles.sideLabel}>AMONT (D-DET AM)</Text>
      </View>
      <View style={styles.row}>
        <View style={[styles.device, outputs.mPmon ? styles.onOk : null]}>
          <Text style={[styles.deviceText, outputs.mPmon ? styles.onText : null]}>M-P-AM</Text>
        </View>
        <View style={[styles.device, outputs.mPval ? styles.onOk : null]}>
          <Text style={[styles.deviceText, outputs.mPval ? styles.onText : null]}>M-P-AV</Text>
        </View>
        <View style={[styles.device, outputs.vRem ? styles.onWater : null]}>
          <Text style={[styles.deviceText, outputs.vRem ? styles.onText : null]}>VANNE REMP</Text>
        </View>
        <View style={[styles.device, outputs.vVid ? styles.onWater : null]}>
          <Text style={[styles.deviceText, outputs.vVid ? styles.onText : null]}>VANNE VID</Text>
        </View>
      </View>
      <View style={styles.row}>
        <View style={[styles.device, outputs.fVam ? styles.onOk : null]}>
          <Text style={[styles.deviceText, outputs.fVam ? styles.onText : null]}>FEU V AM</Text>
        </View>
        <View style={[styles.device, outputs.fVav ? styles.onOk : null]}>
          <Text style={[styles.deviceText, outputs.fVav ? styles.onText : null]}>FEU V AV</Text>
        </View>
        <View style={[styles.device, outputs.alarme ? styles.onDanger : null]}>
          <Text style={[styles.deviceText, outputs.alarme ? styles.onDangerText : null]}>ALARME</Text>
        </View>
      </View>
      <Text style={styles.legend}>
        Bassin {Math.round(sys.lvl)} % (aval 0 / amont 100) \u2014 Portes : AM {Math.round(sys.pAm)} % / AV {Math.round(sys.pAv)} % \u2014 Transits : {sys.transits} \u2014 Dangers : {sys.danger}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8, paddingVertical: 8 },
  canal: {
    flexDirection: 'row',
    height: 120,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: '#0E1728',
    overflow: 'hidden',
  },
  side: { flex: 1.2, position: 'relative' },
  aval: { backgroundColor: '#0A1322', borderRightWidth: 1, borderRightColor: C.border },
  amont: { backgroundColor: '#0A1322', borderLeftWidth: 1, borderLeftColor: C.border },
  sas: { flex: 1.6, backgroundColor: '#101A2C' },
  water: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(37,99,235,0.55)' },
  waterMid: { backgroundColor: 'rgba(59,130,246,0.45)' },
  gateSlot: { width: 10, backgroundColor: '#080F1C' },
  door: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  doorClosed: { backgroundColor: C.warn },
  doorOpen: { backgroundColor: C.danger },
  boat: { position: 'absolute', bottom: 8, fontSize: 22, alignSelf: 'center' },
  boatSas: { bottom: 24 },
  sasLabel: { position: 'absolute', top: 4, alignSelf: 'center', color: C.dim, fontSize: 11 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  sideLabel: { color: C.dim, fontSize: 11, flex: 1, textAlign: 'center' },
  device: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: '#101A2C',
  },
  onOk: { backgroundColor: 'rgba(52,211,153,0.2)', borderColor: C.ok },
  onWater: { backgroundColor: 'rgba(59,130,246,0.25)', borderColor: C.waterLight },
  onDanger: { backgroundColor: 'rgba(248,113,113,0.25)', borderColor: C.danger },
  deviceText: { color: C.dim, fontSize: 11, fontWeight: '800', fontFamily: 'monospace' },
  onText: { color: C.text },
  onDangerText: { color: C.danger },
  legend: { color: C.dim, fontSize: 11, textAlign: 'center' },
});
