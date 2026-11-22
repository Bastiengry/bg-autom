import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import type { ProgramMode } from '../../types';
import { GrafcetEditor } from '../../screens/GrafcetEditor';
import { LadderEditor } from '../../screens/LadderEditor';
import { BlocksEditor } from '../../screens/BlocksEditor';

const MODES: ProgramMode[] = ['grafcet', 'ladder', 'blocks'];

export default function EditorRoute() {
  const params = useLocalSearchParams<{ mode: string }>();
  const known = MODES.includes(params.mode as ProgramMode);
  const mode = known ? (params.mode as ProgramMode) : 'grafcet';

  const onSimulate = (m: ProgramMode) => router.push(`/simulation/${m}`);

  return (
    <View style={styles.fill}>
      {mode === 'grafcet' ? <GrafcetEditor onSimulate={onSimulate} /> : null}
      {mode === 'ladder' ? <LadderEditor onSimulate={onSimulate} /> : null}
      {mode === 'blocks' ? <BlocksEditor onSimulate={onSimulate} /> : null}
      {!known ? <Text style={styles.err}>Langage inconnu</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#0B1220' },
  err: { color: '#F87171', padding: 12 },
});
