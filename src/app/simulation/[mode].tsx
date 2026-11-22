import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import type { MachineId, ProgramMode } from '../../types';
import { SimulationScreen } from '../../screens/SimulationScreen';

const MODES: ProgramMode[] = ['grafcet', 'ladder', 'blocks'];
const MACHINES_ID: MachineId[] = ['cuve', 'feux'];

export default function SimulationRoute() {
  const params = useLocalSearchParams<{ mode: string; machine?: string }>();
  const mode = MODES.includes(params.mode as ProgramMode) ? (params.mode as ProgramMode) : 'grafcet';
  const machine = MACHINES_ID.includes(params.machine as MachineId)
    ? (params.machine as MachineId)
    : 'cuve';

  return (
    <SimulationScreen
      mode={mode}
      machine={machine}
      onBack={() => router.back()}
      onHome={() => router.replace('/')}
    />
  );
}
