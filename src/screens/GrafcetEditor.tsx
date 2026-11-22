import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { C } from '../theme';
import { usePrograms } from '../state/programs';
import { MACHINES } from '../system/machines';
import type {
  Condition,
  Condition as AnyCondition,
  GrafcetProgram,
  GrafcetAction,
  MachineId,
  ProgramMode,
} from '../types';
import { exampleGrafcet } from '../programs/examples';
import { Card, Chip, ItemPicker, Pill, Screen, SectionTitle } from '../components/ui';
import ConditionListEditor, { conditionLabel } from '../components/ConditionListEditor';

type VarId = string;

function varLabel(machine: MachineId): Record<string, string> {
  return Object.fromEntries(MACHINES[machine].vars.map((v) => [v.id, v.label]));
}

const MODE_ICONS: Record<GrafcetAction['mode'], string> = {
  level: '',
  set: 'S:',
  reset: 'R:',
};


export function GrafcetEditor({
  machine,
  onSimulate,
}: {
  machine: MachineId;
  onSimulate: (mode: ProgramMode, machine: MachineId) => void;
}) {
  const { get, set, clear } = usePrograms();
  const program = get('grafcet', machine) as GrafcetProgram;
  const nodes = program.nodes;
  const [selected, setSelected] = useState(0);
  const [pickingLoop, setPickingLoop] = useState(false);
  const [pickingAlt, setPickingAlt] = useState(false);
  const labels = varLabel(machine);
  const idx = Math.min(selected, nodes.length - 1);
  const node = nodes[idx];

  const patch = (i: number, p: Partial<GrafcetProgram['nodes'][number]>) => {
    const next = nodes.map((n, j) => (j === i ? { ...n, ...p } : n));
    set('grafcet', machine, { ...program, nodes: next });
  };

  const addStep = () => {
    set('grafcet', machine, {
      ...program,
      nodes: [...nodes, { actions: [], transition: [], afterSeconds: null, alt: [], forks: [], waitsFor: [] }],
    });
    setSelected(nodes.length);
  };

  const removeStep = () => {
    if (nodes.length <= 1) return;
    const next = nodes.filter((_, i) => i !== idx);
    set('grafcet', machine, { ...program, nodes: next, loopTo: Math.min(program.loopTo, next.length - 1) });
    setSelected(Math.max(0, idx - 1));
  };

  const cycleAction = (id: VarId) => {
    const cur = node.actions;
    const existing = cur.find((a) => a.varId === id);
    if (!existing) {
      patch(idx, { actions: [...cur, { varId: id, mode: 'level' }] });
      return;
    }
    if (existing.mode === 'level') patch(idx, { actions: cur.map((a) => (a.varId === id ? { ...a, mode: 'set' } : a)) });
    else if (existing.mode === 'set') patch(idx, { actions: cur.map((a) => (a.varId === id ? { ...a, mode: 'reset' } : a)) });
    else patch(idx, { actions: cur.filter((a) => a.varId !== id) });
  };

  const stepItems = nodes.map((_, i) => ({
    id: String(i),
    label: `Étape X${i}`,
    detail: i === 0 ? 'Étape initiale' : `Étape ${i}`,
  }));

  const changeTempo = (delta: number) => {
    const cur = node.afterSeconds ?? 0;
    const val = Math.max(1, Math.min(60, cur + delta));
    patch(idx, { afterSeconds: val });
  };

  return (
    <Screen
      title="Éditeur Grafcet"
      subtitle="Tape une étape pour l'éditer. X0 = étape initiale (tout à 0). Actions : valeur soulignée = directe (level), S: = mémorisée, R: = dé-mémorisée. Tempo = condition « après n s » dans l'étape."
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chain}>
          {nodes.map((n, i) => (
            <React.Fragment key={i}>
              <Pressable onPress={() => setSelected(i)}>
                <View style={[styles.step, idx === i && styles.stepSelected]}>
                  <Text style={[styles.stepId, idx === i && styles.stepIdOn]}>X{i}</Text>
                  <Text style={styles.stepActs}>
                    {n.actions.length
                      ? n.actions
                          .map((a) => `${a.mode === 'level' ? '' : a.mode === 'set' ? 'S ' : 'R '}${labels[a.varId] ?? a.varId}`)
                          .join(' ')
                      : '—'}
                  </Text>
                  {n.afterSeconds !== null ? <Text style={styles.stepT}>⏱ {n.afterSeconds}s</Text> : null}
                </View>
              </Pressable>
              <View style={styles.arrow}>
                <View style={[styles.arrowLine, i === idx && styles.arrowLineActive]} />
                <Text style={styles.arrowHead}>▼</Text>
                <Text style={styles.arrowCond}>
                  {n.afterSeconds !== null ? `après ${n.afterSeconds}s` : ''}
                  {(n.transition.length || n.alt.length) && n.afterSeconds !== null ? ' + ' : n.afterSeconds !== null ? '' : ''}
                  {n.transition.map((c) => conditionLabel(c as AnyCondition, machine)).join(' • ')}
                  {n.transition.length && n.alt.length ? ' ‖ ' : ''}
                  {n.alt.map((a) => `${conditionLabel((a.condition[0] ?? { type: 'var', varId: 'bMarche', negated: false }) as AnyCondition, machine)}→X${a.goto}`).join(' ‖ ')}
                  {!n.transition.length && !n.alt.length && n.afterSeconds === null ? '?' : ''}
                </Text>
                {n.forks.length ? <Text style={styles.arrowFork}>═══ fork═══X{n.forks.join(',X')}</Text> : null}
                {n.waitsFor.length ? <Text style={styles.arrowFork}>rendez-vous ◷ X{n.waitsFor.join(',X')}</Text> : null}
              </View>
            </React.Fragment>
          ))}
        </View>
      </ScrollView>

      <Card>
        <SectionTitle>Étape X{idx} — actions (tape = directe → S: mémorisée → R: reset → enlever)</SectionTitle>
        <View style={styles.chips}>
          {MACHINES[machine].vars
            .filter((v) => v.kind === 'output')
            .map((v) => {
              const a = node.actions.find((x) => x.varId === v.id);
              const mode = a?.mode;
              return (
                <Chip
                  key={v.id}
                  label={mode ? `${MODE_ICONS[mode]} ${v.label}` : v.label}
                  selected={!!a}
                  onPress={() => cycleAction(v.id)}
                />
              );
            })}
        </View>
      </Card>

      <Card>
        <SectionTitle>Transition X{idx} → suivante {node.afterSeconds !== null ? `(après ${node.afterSeconds}s)` : ''}</SectionTitle>
        <ConditionListEditor
          conditions={node.transition as AnyCondition[]}
          onChange={(t) => patch(idx, { transition: t as Condition[] })}
          machine={machine}
          pickerTitle="Condition de transition"
          emptyHint="Aucune condition."
        />
        <View style={styles.rowBtns}>
          <Chip label={node.afterSeconds !== null ? `⏱ Tempo : ${node.afterSeconds}s  (retirer)` : '⏱ Ajouter une tempo'} selected={node.afterSeconds !== null} onPress={() => patch(idx, { afterSeconds: node.afterSeconds === null ? 2 : null })} />
          {node.afterSeconds !== null ? (
            <View style={styles.rowBtns}>
              <Pill label="−1s" onPress={() => changeTempo(-1)} />
              <Pill label="+1s" onPress={() => changeTempo(1)} />
            </View>
          ) : null}
        </View>
      </Card>

      <Card>
        <SectionTitle>Divergence OU / sauts (depuis X{idx})</SectionTitle>
        {node.alt.length === 0 ? <Text style={styles.hint}>Aucune branche alternative : ajoute une condition et l’étape de destination.</Text> : null}
        {node.alt.map((a, ai) => (
          <View key={ai} style={styles.altRow}>
            <View style={{ flex: 1 }}>
              <ConditionListEditor
                conditions={a.condition as AnyCondition[]}
                onChange={(cs) => patch(idx, { alt: node.alt.map((x, j) => (j === ai ? { ...x, condition: cs as Condition[] } : x)) })}
                machine={machine}
                pickerTitle="Condition du OU"
                emptyHint="Condition de la branche…"
                hideLevelThresholds={!MACHINES[machine].numericLabel}
                timers={[]}
                counters={[]}
              />
            </View>
            <Pill label={`→ X${a.goto}`} tone="accent" onPress={() => setPickingAlt(true)} />
            <Pill
              label="✕"
              tone="danger"
              onPress={() => patch(idx, { alt: node.alt.filter((_, j) => j !== ai) })}
            />
            <ItemPicker
              visible={pickingAlt}
              title="Étape cible du saut"
              items={stepItems}
              onSelect={(id) => patch(idx, { alt: node.alt.map((x, j) => (j === ai ? { ...x, goto: Number(id) } : x)) })}
              onClose={() => setPickingAlt(false)}
            />
          </View>
        ))}
        <Chip
          label="+ Branche alternative / saut"
          selected={false}
          onPress={() =>
            patch(idx, {
              alt: [...node.alt, { condition: [], goto: Math.min(nodes.length - 1, idx + 2) }],
            })
          }
        />
      </Card>

      <Card>
        <SectionTitle>Divergence ET (parallélisme) depuis X{idx}</SectionTitle>
        <Text style={styles.hint}>fork : étapes activées en même temps que la suivante. rendez-vous : X attend ces étapes avant de franchir sa transition.</Text>
        <View style={styles.chips}>
          {nodes.map((_, i) => (
            <Chip
              key={`f${i}`}
              label={`fork X${i}`}
              selected={node.forks.includes(i)}
              onPress={() => patch(idx, { forks: node.forks.includes(i) ? node.forks.filter((x) => x !== i) : [...node.forks, i] })}
            />
          ))}
        </View>
        <View style={styles.chips}>
          {nodes.map((_, i) => (
            <Chip
              key={`w${i}`}
              label={`rendez-vous X${i}`}
              selected={node.waitsFor.includes(i)}
              onPress={() => patch(idx, { waitsFor: node.waitsFor.includes(i) ? node.waitsFor.filter((x) => x !== i) : [...node.waitsFor, i] })}
            />
          ))}
        </View>
      </Card>

      <Card>
        <SectionTitle>Fin de séquence</SectionTitle>
        <Text style={styles.hint}>Après la dernière étape, retour à :</Text>
        <Pill label={`Étape X${program.loopTo}`} tone="accent" onPress={() => setPickingLoop(true)} />
        <ItemPicker
          visible={pickingLoop}
          title="Étape de retour"
          items={stepItems}
          onSelect={(id) => set('grafcet', machine, { ...program, loopTo: Number(id) })}
          onClose={() => setPickingLoop(false)}
        />
      </Card>

      <View style={styles.rowBtns}>
        <Pill label="+ Étape" tone="accent" onPress={addStep} />
        <Pill label="Supprimer étape" tone="danger" onPress={removeStep} disabled={nodes.length <= 1} />
      </View>
      <View style={styles.rowBtns}>
        <Pill label="Charger un exemple" tone="accent" onPress={() => set('grafcet', machine, exampleGrafcet(machine))} />
        <Pill label="Tout effacer" onPress={() => clear('grafcet', machine)} />
      </View>
      <Pill label="▶ Simuler ce programme" tone="ok" onPress={() => onSimulate('grafcet', machine)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  chain: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 4, paddingVertical: 8 },
  step: {
    width: 88,
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
  stepActs: { color: C.dim, fontSize: 10, fontFamily: 'monospace', textAlign: 'center', flexWrap: 'wrap' },
  stepT: { color: C.warn, fontSize: 10 },
  arrow: { alignItems: 'center', width: 96, gap: 2, paddingTop: 2 },
  arrowLine: { width: 2, height: 18, backgroundColor: C.border },
  arrowLineActive: { backgroundColor: C.accent },
  arrowHead: { color: C.dim },
  arrowCond: { color: C.warn, fontSize: 10, fontFamily: 'monospace', textAlign: 'center', flexWrap: 'wrap', maxWidth: 92 },
  arrowFork: { color: C.ok, fontSize: 9, textAlign: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  loopText: { color: C.dim, fontSize: 13 },
  altRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hint: { color: '#8CA0BF', fontSize: 12, lineHeight: 17 },
  rowBtns: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', alignItems: 'center' },
});
