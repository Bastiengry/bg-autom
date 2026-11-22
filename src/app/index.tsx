import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Card, Chip, Pill, Screen, SectionTitle } from '../components/ui';
import { C } from '../theme';
import { MACHINES } from '../system/machines';
import type { MachineId, ProgramMode } from '../types';

const EDITORS: { mode: ProgramMode; title: string; desc: string }[] = [
  {
    mode: 'grafcet',
    title: 'Grafcet',
    desc: 'Le langage séquentiel de référence : étapes, transitions, actions, divergences ET/OU. Idéal pour dérouler un cycle complet.',
  },
  {
    mode: 'ladder',
    title: 'Ladder (LD)',
    desc: 'Le langage industriel des contacts et bobines, avec temporisations (TON/TOF/TP), compteurs et bobines Set/Reset.',
  },
  {
    mode: 'blocks',
    title: 'Blocs simples',
    desc: 'Des règles SI / ALORS directes, sans mémoire. Parfait pour un premier contact avec la logique de commande.',
  },
];

export default function Home() {
  const [machine, setMachine] = useState<MachineId>('cuve');
  const def = MACHINES[machine];

  return (
    <Screen
      title="BG Autom"
      subtitle="Labo d'automatisme sur mobile : choisis une machine, programme l'automate, la machine suit tes ordres."
    >
      <Card>
        <SectionTitle>1. Choisis la machine</SectionTitle>
        <View style={styles.row}>
          {(Object.keys(MACHINES) as MachineId[]).map((m) => (
            <Chip
              key={m}
              label={`${MACHINES[m].icon} ${MACHINES[m].name}`}
              selected={machine === m}
              onPress={() => setMachine(m)}
            />
          ))}
        </View>
        <Text style={styles.p}>{def.intro}</Text>
      </Card>

      {machine ? (
        <Card style={styles.mission}>
          <SectionTitle>{`🎯 À ${MACHINES[machine].name}`}</SectionTitle>
          {machine === 'cuve' ? (
            <Text style={styles.list}>
              {'• À chaque appui MARCHE : remplir jusqu\u0027à BH, vider jusqu\u0027à BS, recommencer.\n• Les boutons sont à impulsion : mémorise la demande (étape Grafcet, auto-maintien Ladder…).\n• Compte les cycles complets dans la simulation !'}
            </Text>
          ) : (
            <Text style={styles.list}>
              {'• MARCHE lance le cycle : vert voie 2 + rouge voie 1, puis orange, puis l\u0027inverse.\n• Utilise les temporisations (TON) pour les durées de chaque phase.\n• Mission parfaite : 3 cycles complets, zéro conflit (jamais vert/vert ni vert/orange face à face).'}
            </Text>
          )}
        </Card>
      ) : null}

      <SectionTitle>2. Choisis ton langage</SectionTitle>
      {EDITORS.map((e) => (
        <Card key={e.mode} style={styles.editorCard}>
          <Text style={styles.editorTitle}>{e.title}</Text>
          <Text style={styles.p}>{e.desc}</Text>
          <View style={styles.row}>
            <Pill
              label="✏️ Programmer"
              tone="accent"
              onPress={() => router.push(`/editor/${e.mode}?machine=${machine}`)}
            />
            <Pill label="Simuler" onPress={() => router.push(`/simulation/${e.mode}?machine=${machine}`)} />
          </View>
        </Card>
      ))}

      <Card>
        <SectionTitle>Vocabulaire automate</SectionTitle>
        <Text style={styles.list}>
          {'• Entrée : information envoyée à l\u0027automate (bouton, capteur).\n• Sortie : ordre envoyé au procédé (vanne, pompe, feu).\n• Relais interne : variable mémoire de l\u0027automate, invisible sur la machine.\n• Cycle : un balayage complet du programme par l\u0027automate (ici 100 ms).'}
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  mission: { gap: 8 },
  p: { color: C.dim, fontSize: 13, lineHeight: 19, marginTop: 8 },
  list: { color: C.text, fontSize: 13, lineHeight: 21, fontFamily: 'monospace' },
  editorCard: { gap: 8 },
  editorTitle: { color: C.text, fontSize: 17, fontWeight: '800' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
});
