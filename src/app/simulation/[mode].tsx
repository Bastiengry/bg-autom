import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import type { ProgramMode } from '../../types';
import { SimulationScreen } from '../../screens/SimulationScreen';

const MODES: ProgramMode[] = ['grafcet', 'ladder', 'blocks'];

export default function SimulationRoute() {
  const params = useLocalSearchParams<{ mode: string }>();
  const mode = MODES.includes(params.mode as ProgramMode)
    ? (params.mode as ProgramMode)
    : 'grafcet';

  return (
    <SimulationScreen
      mode={mode}
      onBack={() => router.back()}
      onHome={() => router.replace('/')}
    />
  );
}
