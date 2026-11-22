import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ProgramsProvider } from '../state/programs';
import { C } from '../theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ProgramsProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: C.bg },
          }}
        />
      </ProgramsProvider>
    </SafeAreaProvider>
  );
}
