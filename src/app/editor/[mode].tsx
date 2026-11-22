import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import type { MachineId, ProgramMode } from '../../types';
import { GrafcetEditor } from '../../screens/GrafcetEditor';
import { LadderEditor } from '../../screens/LadderEditor';
import { BlocksEditor } from '../../screens/BlocksEditor';

const MODES: ProgramMode[] = ['grafcet', 'ladder', 'blocks'];
const MACHINES_ID: MachineId[] = ['cuve', 'feux'];

export default function EditorRoute() {
  const params = useLocalSearchParams<{ mode: string; machine?: string }>();
  const mode = MODES.includes(params.mode as ProgramMode) ? (params.mode as ProgramMode) : 'grafcet';
  const machine = MACHINES_ID.includes(params.machine as MachineId)
    ? (params.machine as MachineId)
    : 'cuve';

  const onSimulate = (m: ProgramMode, mach: MachineId) => router.push(`/simulation/${m}?machine=${mach}`);

  return (
    <View style={styles.fill}>
      {mode === 'grafcet' ? <GrafcetEditor machine={machine} onSimulate={onSimulate} /> : null}
      {mode === 'ladder' ? <LadderEditor machine={machine} onSimulate={onSimulate} /> : null}
      {mode === 'blocks' ? <BlocksEditor machine={machine} onSimulate={onSimulate} /> : null}
      {!MODES.includes(params.mode as ProgramMode) ? <Text style={styles.err}>Langage inconnu</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#0B1220' },
  err: { color: '#F87171', padding: 12 },
});
