import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { C } from '../theme';
import { usePrograms } from '../state/programs';
import { OUTPUT_IDS, VAR_LABELS, type ProgramMode, type VarId } from '../types';
import { exampleGrafcet } from '../programs/examples';
import {
  Card,
  Chip,
  ItemPicker,
  Pill,
  Screen,
  SectionTitle,
} from '../components/ui';
import { ConditionListEditor, inputPickerItems } from '../components/ConditionListEditor';

export function GrafcetEditor({ onSimulate }: { onSimulate: (mode: ProgramMode) => void }) {
  const { grafcet, setGrafcet, clear } = usePrograms();
  const [selected, setSelected] = useState(0);
  const [pickingLoop, setPickingLoop] = useState(false);

  const nodes = grafcet.nodes;
  const node = nodes[selected] ?? nodes[0];

  const patch = (i: number, actions: VarId[]) => {
    const next = nodes.map((n, j) => (j === i ? { ...n, actions } : n));
    setGrafcet({ ...grafcet, nodes: next });
  };

  const patchTransition = (i: number, transition: typeof node.transition) => {
    const next = nodes.map((n, j) => (j === i ? { ...n, transition } : n));
    setGrafcet({ ...grafcet, nodes: next });
  };

  const addStep = () => {
    setGrafcet({ ...grafcet, nodes: [...nodes, { actions: [], transition: [] }] });
    setSelected(nodes.length);
  };

  const removeStep = () => {
    if (nodes.length <= 1) return;
    const next = nodes.filter((_, i) => i !== selected);
    setGrafcet({ ...grafcet, nodes: next, loopTo: Math.min(grafcet.loopTo, next.length - 1) });
    setSelected(Math.max(0, selected - 1));
  };

  const toggleAction = (a: VarId) => {
    const cur = node.actions;
    patch(selected, cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a]);
  };

  const loopSteps = nodes.map((_, i) => ({
    id: String(i),
    label: `Étape X${i}`,
    detail: i === 0 ? 'Étape initiale (attente)' : `Étape ${i}`,
  }));

  return (
    <Screen
      title="Éditeur Grafcet"
      subtitle="Étapes (actions) et transitions (conditions). L'étape X0 est l'étape initiale : toutes les sorties y sont à 0. Après la dernière étape, le programme revient à l'étape choisie ci-dessous."
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chain}>
          {nodes.map((n, i) => (
            <React.Fragment key={i}>
              <Pressable onPress={() => setSelected(i)}>
                <View style={[styles.step, selected === i && styles.stepSelected]}>
                  <Text style={[styles.stepId, selected === i && styles.stepIdOn]}>X{i}</Text>
                  <Text style={styles.stepActs}>
                    {n.actions.length ? n.actions.map((a) => VAR_LABELS[a]).join(' ') : '—'}
                  </Text>
                </View>
              </Pressable>
              <View style={styles.arrow}>
                <View style={[styles.arrowLine, i === selected && styles.arrowLineActive]} />
                <Text style={styles.arrowHead}>▼</Text>
                <Text style={styles.arrowCond}>
                  {n.transition
                    .map((c) => `${c.negated ? '/' : ''}${VAR_LABELS[c.varId]}`)
                    .join(' • ') || '?'}
                </Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      </ScrollView>

      <Card>
        <SectionTitle>Étape X{selected} — actions (sorties actives)</SectionTitle>
        <View style={styles.chips}>
          {OUTPUT_IDS.map((a) => (
            <Chip
              key={a}
              label={VAR_LABELS[a]}
              selected={node.actions.includes(a)}
              onPress={() => toggleAction(a)}
            />
          ))}
        </View>
      </Card>

      <Card>
        <SectionTitle>Transition X{selected} → étape suivante</SectionTitle>
        <ConditionListEditor
          conditions={node.transition}
          onChange={(t) => patchTransition(selected, t)}
          items={inputPickerItems()}
          pickerTitle="Condition de la transition"
          emptyHint="Aucune condition : la transition ne sera jamais franchie. Ajoutez par ex. MARCHE."
        />
      </Card>

      <Card>
        <SectionTitle>Fin de séquence</SectionTitle>
        <Text style={styles.loopText}>Après la dernière étape, retour à :</Text>
        <Pill label={`Étape X${grafcet.loopTo}`} tone="accent" onPress={() => setPickingLoop(true)} />
      </Card>

      <View style={styles.rowBtns}>
        <Pill label="+ Étape" tone="accent" onPress={addStep} />
        <Pill label="Supprimer étape" tone="danger" onPress={removeStep} disabled={nodes.length <= 1} />
      </View>
      <View style={styles.rowBtns}>
        <Pill label="Charger un exemple (remplissage/vidange)" tone="accent" onPress={() => setGrafcet(exampleGrafcet())} />
        <Pill label="Tout effacer" onPress={() => clear('grafcet')} />
      </View>
      <Pill label="▶ Simuler ce programme" tone="ok" onPress={() => onSimulate('grafcet')} />

      <ItemPicker
        visible={pickingLoop}
        title="Étape de retour (fin de séquence)"
        items={loopSteps}
        onSelect={(id) => setGrafcet({ ...grafcet, loopTo: Number(id) })}
        onClose={() => setPickingLoop(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  chain: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 4, paddingVertical: 8 },
  step: {
    width: 84,
    borderWidth: 2,
    borderColor: C.border,
    borderRadius: 12,
    backgroundColor: C.card,
    alignItems: 'center',
    padding: 8,
    gap: 4,
    minHeight: 84,
    justifyContent: 'center',
  },
  stepSelected: { borderColor: C.accent, backgroundColor: C.cardAlt },
  stepId: { color: C.text, fontWeight: '800', fontSize: 15 },
  stepIdOn: { color: C.accent },
  stepActs: { color: C.dim, fontSize: 10, fontFamily: 'monospace', textAlign: 'center' },
  arrow: { alignItems: 'center', width: 92, gap: 2, paddingTop: 2 },
  arrowLine: { width: 2, height: 18, backgroundColor: C.border },
  arrowLineActive: { backgroundColor: C.accent },
  arrowHead: { color: C.dim },
  arrowCond: {
    color: C.warn,
    fontSize: 10,
    fontFamily: 'monospace',
    textAlign: 'center',
    flexWrap: 'wrap',
    maxWidth: 88,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  loopText: { color: C.dim, fontSize: 13 },
  rowBtns: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
});
