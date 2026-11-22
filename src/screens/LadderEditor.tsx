import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { C } from '../theme';
import { usePrograms } from '../state/programs';
import { MACHINES } from '../system/machines';
import type { Condition, Condition as AnyCondition, LadderCounter, LadderProgram, LadderRung, LadderTimer, MachineId, ProgramMode } from '../types';
import { exampleLadder } from '../programs/examples';
import { Card, Chip, ItemPicker, Pill, Screen, SectionTitle } from '../components/ui';
import ConditionListEditor, { conditionLabel, contactItems } from '../components/ConditionListEditor';

const NEXT_TIMER_ID = (timers: LadderTimer[]) => `t${timers.length + 1}`;
const NEXT_COUNTER_ID = (counters: LadderCounter[]) => `c${counters.length + 1}`;

const COIL_LABELS: Record<LadderRung['coilType'], string> = {
  coil: '( )',
  set: '(S)',
  reset: '(R)',
};

function RungCard({
  rung,
  index,
  machine,
  timers,
  counters,
  onUpdate,
  onRemove,
}: {
  rung: LadderRung;
  index: number;
  machine: MachineId;
  timers: string[];
  counters: string[];
  onUpdate: (r: LadderRung) => void;
  onRemove: () => void;
}) {
  const [picking, setPicking] = useState<null | 'term' | 'output'>(null);

  const addTerm = (id: string) => {
    const varId = id.slice(4);
    if (rung.terms.some((t) => t.type === 'var' && t.varId === varId)) return;
    onUpdate({
      ...rung,
      terms: [...rung.terms, { type: 'var', varId, negated: false }],
      junctions: [...rung.junctions, 'AND'],
    });
  };

  const patch = (p: Partial<LadderRung>) => onUpdate({ ...rung, ...p });

  const toggleNegate = (i: number) => {
    const terms = [...rung.terms] as AnyCondition[];
    const t = terms[i] as Extract<AnyCondition, { type: 'var' }>;
    terms[i] = { ...t, negated: !t.negated };
    patch({ terms: terms as Condition[] });
  };

  const removeTerm = (i: number) => {
    const terms = rung.terms.filter((_, j) => j !== i);
    const junctions = rung.junctions.filter((_, j) => j !== i - 1);
    patch({ terms, junctions });
  };

  const flipJunction = (i: number) => {
    const junctions = [...rung.junctions];
    junctions[i] = junctions[i] === 'AND' ? 'OR' : 'AND';
    patch({ junctions });
  };

  const cycleCoil = () => {
    const order: LadderRung['coilType'][] = ['coil', 'set', 'reset'];
    const next = order[(order.indexOf(rung.coilType) + 1) % order.length];
    patch({ coilType: next });
  };

  return (
    <Card>
      <View style={styles.rungHeader}>
        <SectionTitle>Rang {index + 1}</SectionTitle>
        <View style={styles.rowGap}>
          <Pressable onPress={cycleCoil} style={styles.smallBtn}>
            <Text style={styles.smallBtnText}>{COIL_LABELS[rung.coilType]}</Text>
          </Pressable>
          <Pressable onPress={() => setPicking('output')} style={styles.smallBtn}>
            <Text style={styles.smallBtnText}>bobine</Text>
          </Pressable>
          <Pressable onPress={onRemove} hitSlop={8}>
            <Text style={styles.delete}>✕</Text>
          </Pressable>
        </View>
      </View>

      <Text style={[styles.wire, { marginBottom: 2 }]}>
        ├─{rung.terms.map((t) => `┤${conditionLabel(t as AnyCondition, machine)}├`).join(rung.junctions[0] === 'OR' ? '──┬──' : '──')}──( {COIL_LABELS[rung.coilType]} {rung.output} )
      </Text>

      <View style={styles.terms}>
        {rung.terms.map((t, i) => (
          <React.Fragment key={`${t.type}_${i}`}>
            {i > 0 ? (
              <Pressable onPress={() => flipJunction(i - 1)} hitSlop={6} style={styles.junction}>
                <Text style={styles.junctionText}>
                  {rung.junctions[i - 1] === 'AND' ? '─ ET ─' : '─ OU ─'}
                </Text>
              </Pressable>
            ) : null}
            <View style={styles.termRow}>
              <Text style={styles.wire}>├─</Text>
              <Text style={[styles.contact, t.type !== 'var' && styles.contactBit]}>
                {conditionLabel(t as AnyCondition, machine)}
              </Text>
              <Text style={styles.wire}>─┤</Text>
              {t.type === 'var' ? (
                <Pressable onPress={() => toggleNegate(i)} style={styles.smallBtn} hitSlop={8}>
                  <Text style={styles.smallBtnText}>NON</Text>
                </Pressable>
              ) : null}
              <Pressable onPress={() => removeTerm(i)} hitSlop={8}>
                <Text style={styles.delete}>✕</Text>
              </Pressable>
            </View>
          </React.Fragment>
        ))}
      </View>

      <View style={styles.rowGap}>
        <Chip label="+ Contact" selected={false} onPress={() => setPicking('term')} />
        {timers.length > 0 ? (
          <ItemPicker
            visible={false}
            title=""
            items={[]}
            onSelect={() => undefined}
            onClose={() => undefined}
          />
        ) : null}
      </View>

      <ItemPicker
        visible={picking === 'term'}
        title="Contact (E/S, relais interne, tempo, compteur)"
        items={[
          ...contactItems(machine),
          ...timers.map((id) => ({ id: `timer:${id}`, label: `${id}.Q`, detail: 'Contact fin de tempo' })),
          ...counters.map((id) => ({ id: `counter:${id}`, label: `${id}.Q`, detail: 'Contact seuil atteint' })),
        ]}
        onSelect={(id) => {
          if (id.startsWith('timer:')) {
            const timerId = id.slice(6);
            if (!rung.terms.some((t) => t.type === 'timerContact' && t.timerId === timerId)) {
              patch({
                terms: [...rung.terms, { type: 'timerContact', timerId }],
                junctions: [...rung.junctions, 'AND'],
              });
            }
          } else if (id.startsWith('counter:')) {
            const counterId = id.slice(8);
            if (!rung.terms.some((t) => t.type === 'counterContact' && t.counterId === counterId)) {
              patch({
                terms: [...rung.terms, { type: 'counterContact', counterId }],
                junctions: [...rung.junctions, 'AND'],
              });
            }
          } else {
            addTerm(id);
          }
          setPicking(null);
        }}
        onClose={() => setPicking(null)}
      />
      <ItemPicker
        visible={picking === 'output'}
        title="Bobine pilotée par ce rang"
        items={MACHINES[machine].vars.map((v) => ({ id: `var:${v.id}`, label: v.label, detail: v.detail }))}
        onSelect={(id) => {
          patch({ output: id.slice(4) });
          setPicking(null);
        }}
        onClose={() => setPicking(null)}
      />
    </Card>
  );
}

export function LadderEditor({
  machine,
  onSimulate,
}: {
  machine: MachineId;
  onSimulate: (mode: ProgramMode, machine: MachineId) => void;
}) {
  const { get, set, clear } = usePrograms();
  const program = get('ladder', machine) as LadderProgram;
  const [addingTimer, setAddingTimer] = useState(false);
  const [addingCounter, setAddingCounter] = useState(false);

  const timerIds = program.timers.map((t) => t.id);
  const counterIds = program.counters.map((c) => c.id);

  const patchProgram = (p: Partial<LadderProgram>) => set('ladder', machine, { ...program, ...p });

  const addTimer = (type: LadderTimer['type']) => {
    patchProgram({
      timers: [
        ...program.timers,
        { id: NEXT_TIMER_ID(program.timers), type, presetMs: 2000, input: [] },
      ],
    });
    setAddingTimer(false);
  };

  const addCounter = (type: LadderCounter['type']) => {
    patchProgram({
      counters: [
        ...program.counters,
        { id: NEXT_COUNTER_ID(program.counters), type, preset: 3, trigger: [], resetCondition: [] },
      ],
    });
    setAddingCounter(false);
  };

  return (
    <Screen
      title="Éditeur Ladder (LD)"
      subtitle="Rangs : contacts ET/OU → bobine ( ). Bobine : tape ( ) → (S) mémorisation → (R) reset. Relais internes M1… pour mémoriser des phases. Tempo : entrée → contact tN.Q."
    >
      {program.timers.length > 0 ? (
        <Card>
          <SectionTitle>⏱ Temporisations</SectionTitle>
          {program.timers.map((t, i) => (
            <View key={t.id} style={styles.blockBox}>
              <View style={styles.rungHeader}>
                <Pressable
                  style={[styles.smallBtn, { minWidth: 72, alignItems: 'center' }]}
                  onPress={() => {
                    const order: LadderTimer['type'][] = ['TON', 'TOF', 'TP'];
                    patchProgram({
                      timers: program.timers.map((x, j) =>
                        j === i ? { ...x, type: order[(order.indexOf(x.type) + 1) % order.length] } : x,
                      ),
                    });
                  }}
                >
                  <Text style={styles.smallBtnText}>{t.type}</Text>
                </Pressable>
                <Text style={styles.blockId}>{t.id}</Text>
                <View style={styles.rowGap}>
                  <Pill
                    label="−1s"
                    onPress={() => patchProgram({ timers: program.timers.map((x, j) => (j === i ? { ...x, presetMs: Math.max(500, x.presetMs - 1000) } : x)) })}
                  />
                  <Pill
                    label="+1s"
                    onPress={() => patchProgram({ timers: program.timers.map((x, j) => (j === i ? { ...x, presetMs: Math.min(60000, x.presetMs + 1000) } : x)) })}
                  />
                  <Pressable onPress={() => patchProgram({ timers: program.timers.filter((_, j) => j !== i) })}>
                    <Text style={styles.delete}>✕</Text>
                  </Pressable>
                </View>
              </View>
              <Text style={styles.blockId}>{(t.presetMs / 1000).toFixed(1)} s</Text>
              <Text style={styles.hint}>Entrée</Text>
              <ConditionListEditor
                conditions={t.input as AnyCondition[]}
                onChange={(cs) => patchProgram({ timers: program.timers.map((x, j) => (j === i ? { ...x, input: cs as Condition[] } : x)) })}
                machine={machine}
                pickerTitle="Entrée de la tempo"
                emptyHint="Quand cette entrée est vraie, la tempo se lance."
                hideLevelThresholds={!MACHINES[machine].numericLabel}
                timers={[]}
                counters={[]}
              />
            </View>
          ))}
        </Card>
      ) : null}

      {program.counters.length > 0 ? (
        <Card>
          <SectionTitle>#️⃣ Compteurs</SectionTitle>
          {program.counters.map((c, i) => (
            <View key={c.id} style={styles.blockBox}>
              <View style={styles.rungHeader}>
                <Pressable
                  style={[styles.smallBtn, { minWidth: 72, alignItems: 'center' }]}
                  onPress={() =>
                    patchProgram({
                      counters: program.counters.map((x, j) => (j === i ? { ...x, type: x.type === 'CTU' ? 'CTD' : 'CTU' } : x)),
                    })
                  }
                >
                  <Text style={styles.smallBtnText}>{c.type}</Text>
                </Pressable>
                <Text style={styles.blockId}>{c.id}</Text>
                <View style={styles.rowGap}>
                  <Pill label="−1" onPress={() => patchProgram({ counters: program.counters.map((x, j) => (j === i ? { ...x, preset: Math.max(1, x.preset - 1) } : x)) })} />
                  <Pill label="+1" onPress={() => patchProgram({ counters: program.counters.map((x, j) => (j === i ? { ...x, preset: Math.min(9999, x.preset + 1) } : x)) })} />
                  <Pressable onPress={() => patchProgram({ counters: program.counters.filter((_, j) => j !== i) })}>
                    <Text style={styles.delete}>✕</Text>
                  </Pressable>
                </View>
              </View>
              <Text style={styles.blockId}>seuil : {c.preset}</Text>
              <Text style={styles.hint}>Impulsion (front montant {c.type === 'CTU' ? '↑' : '↓'})</Text>
              <ConditionListEditor
                conditions={c.trigger as AnyCondition[]}
                onChange={(cs) => patchProgram({ counters: program.counters.map((x, j) => (j === i ? { ...x, trigger: cs as Condition[] } : x)) })}
                machine={machine}
                pickerTitle="Entrée du compteur"
                emptyHint="À chaque front, le compteur s'incrémente."
                hideLevelThresholds={!MACHINES[machine].numericLabel}
              />
              <Text style={styles.hint}>Remise à zéro</Text>
              <ConditionListEditor
                conditions={c.resetCondition as AnyCondition[]}
                onChange={(cs) => patchProgram({ counters: program.counters.map((x, j) => (j === i ? { ...x, resetCondition: cs as Condition[] } : x)) })}
                machine={machine}
                pickerTitle="Reset du compteur"
                emptyHint="Quand vraie → PV = 0."
                hideLevelThresholds={!MACHINES[machine].numericLabel}
                timers={timerIds}
                counters={counterIds}
              />
            </View>
          ))}
        </Card>
      ) : null}

      {program.rungs.map((r, i) => (
        <RungCard
          key={i}
          rung={r}
          index={i}
          machine={machine}
          timers={timerIds}
          counters={counterIds}
          onUpdate={(nr) => patchProgram({ rungs: program.rungs.map((x, j) => (j === i ? nr : x)) })}
          onRemove={() => patchProgram({ rungs: program.rungs.filter((_, j) => j !== i) })}
        />
      ))}

      <Card>
        <SectionTitle>Bloc fonctionnel</SectionTitle>
        <View style={styles.rowBtns}>
          <Chip label="+ Tempo" selected={false} onPress={() => setAddingTimer(true)} />
          <Chip label="+ Compteur" selected={false} onPress={() => setAddingCounter(true)} />
        </View>
      </Card>

      <ItemPicker
        visible={addingTimer}
        title="Type de temporisation"
        items={[
          { id: 'TON', label: 'TON', detail: 'Retard à l’enclenchement' },
          { id: 'TOF', label: 'TOF', detail: 'Retard au déclenchement' },
          { id: 'TP', label: 'TP', detail: 'Impulsion temporisée' },
        ]}
        onSelect={(id) => addTimer(id as LadderTimer['type'])}
        onClose={() => setAddingTimer(false)}
      />
      <ItemPicker
        visible={addingCounter}
        title="Type de compteur"
        items={[
          { id: 'CTU', label: 'CTU', detail: 'Comptage croissant' },
          { id: 'CTD', label: 'CTD', detail: 'Comptage décroissant (front ↓)' },
        ]}
        onSelect={(id) => addCounter(id as LadderCounter['type'])}
        onClose={() => setAddingCounter(false)}
      />

      <Card>
        <SectionTitle>Nouveau rang</SectionTitle>
        <RungCard
          rung={{ output: MACHINES[machine].vars.find((v) => v.kind === 'output')?.id ?? 'vanneR', coilType: 'coil', terms: [], junctions: [] }}
          index={-1}
          machine={machine}
          timers={timerIds}
          counters={counterIds}
          onUpdate={(nr) => {
            if (nr.output) patchProgram({ rungs: [...program.rungs, { ...nr, terms: [] }] });
          }}
          onRemove={() => undefined}
        />
      </Card>

      <View style={styles.rowBtns}>
        <Pill label="Charger un exemple" tone="accent" onPress={() => set('ladder', machine, exampleLadder(machine))} />
        <Pill label="Tout effacer" onPress={() => clear('ladder', machine)} />
      </View>
      <Pill label="▶ Simuler ce programme" tone="ok" onPress={() => onSimulate('ladder', machine)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  rungHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowGap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  terms: { gap: 2, marginBottom: 6 },
  termRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  wire: { color: C.dim, fontSize: 12, fontFamily: 'monospace', flexShrink: 1 },
  contact: {
    color: C.accent,
    fontWeight: '700',
    fontFamily: 'monospace',
    fontSize: 14,
    minWidth: 76,
    textAlign: 'center',
  },
  contactBit: { color: C.accent },
  junction: { paddingLeft: 12, paddingVertical: 2 },
  junctionText: { color: C.warn, fontSize: 12, fontFamily: 'monospace', fontWeight: '700' },
  smallBtn: {
    backgroundColor: C.cardAlt,
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: 'center',
  },
  smallBtnText: { color: C.text, fontSize: 12, fontWeight: '800', fontFamily: 'monospace' },
  delete: { color: C.danger, fontSize: 13, fontWeight: '700', paddingHorizontal: 6 },
  blockBox: { marginTop: 8, padding: 8, borderColor: C.border, borderWidth: 1, borderRadius: 10, gap: 6 },
  blockId: { color: C.text, fontSize: 13, fontFamily: 'monospace', fontWeight: '700' },
  hint: { color: C.dim, fontSize: 12, fontStyle: 'italic' },
  rowBtns: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
});
