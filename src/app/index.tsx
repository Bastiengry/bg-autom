import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Card, Pill, Screen, SectionTitle } from '../components/ui';
import { C } from '../theme';

const EDITORS = [
  {
    mode: 'grafcet',
    title: 'Grafcet',
    desc: 'Le langage séquentiel de référence en automatisme : étapes, transitions, actions. Idéal pour le cycle complet remplir → vider.',
  },
  {
    mode: 'ladder',
    title: 'Ladder (LD)',
    desc: 'Le langage industriel des contacts et bobines. Structurez vos conditions en ET / OU avec auto-maintien.',
  },
  {
    mode: 'blocks',
    title: 'Blocs simples',
    desc: 'Des règles SI / ALORS directes, sans mémoire. Parfait pour un premier contact avec la logique de commande.',
  },
] as const;

export default function Home() {
  return (
    <Screen
      title="BG Autom"
      subtitle="Labo d'automatisme sur mobile. Programmez l'automate, la cuve suit vos ordres."
    >
      <Card style={styles.mission}>
        <SectionTitle>⚙️ Mission : remplissage de cuve</SectionTitle>
        <Text style={styles.p}>
          La cuve se remplit par la <Text style={styles.hl}>VANNE R</Text> et se vide par la{' '}
          <Text style={styles.hl}>POMPE V</Text>. Trois capteurs surveillent le niveau :
        </Text>
        <Text style={styles.list}>
          • BS — niveau bas (cuve vide, ≤ 5 %)
          {'\n'}• BM — niveau moyen (≥ 50 %)
          {'\n'}• BH — niveau haut (cuve pleine, ≥ 95 %)
        </Text>
        <Text style={styles.p}>
          Deux boutons poussoirs commandent le système :{' '}
          <Text style={styles.okText}>MARCHE</Text> et <Text style={styles.dangerText}>ARRÊT</Text>.
        </Text>
        <Text style={styles.goal}>
          🎯 Objectif : à chaque appui sur MARCHE, remplir la cuve jusqu’à BH, la vider jusqu’à BS,
          puis recommencer. Comptez les cycles complets dans la simulation !
        </Text>
        <Text style={styles.p}>
          Les boutons poussoirs se relâchent automatiquement après une impulsion :{' '}
          <Text style={styles.hl}>mémorisez la demande</Text> dans votre programme (étape Grafcet,
          auto-maintien Ladder…).
        </Text>
      </Card>

      <SectionTitle>Choisissez votre langage de programmation</SectionTitle>
      {EDITORS.map((e) => (
        <Card key={e.mode} style={styles.editorCard}>
          <Text style={styles.editorTitle}>{e.title}</Text>
          <Text style={styles.p}>{e.desc}</Text>
          <View style={styles.row}>
            <Pill
              label="✏️ Programmer"
              tone="accent"
              onPress={() => router.push(`/editor/${e.mode}`)}
            />
            <Pill label="Simuler" onPress={() => router.push(`/simulation/${e.mode}`)} />
          </View>
        </Card>
      ))}

      <Card>
        <SectionTitle>Vocabulaire automate</SectionTitle>
        <Text style={styles.list}>
          • Entrées : information envoyée à l’automate (boutons, capteurs).
          {'\n'}• Sorties : ordres envoyés au procédé (vanne, pompe, voyants).
          {'\n'}• Cycle : un balayage complet du programme par l’automate.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  mission: { gap: 8 },
  p: { color: C.dim, fontSize: 13, lineHeight: 19 },
  list: { color: C.text, fontSize: 13, lineHeight: 21, fontFamily: 'monospace' },
  hl: { color: C.accent, fontWeight: '700', fontFamily: 'monospace' },
  okText: { color: C.ok, fontWeight: '700' },
  dangerText: { color: C.danger, fontWeight: '700' },
  goal: { color: C.text, fontSize: 13, lineHeight: 19 },
  editorCard: { gap: 8 },
  editorTitle: { color: C.text, fontSize: 17, fontWeight: '800' },
  row: { flexDirection: 'row', gap: 10, marginTop: 4 },
});
