import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { C } from '../theme';
import { usePrograms } from '../state/programs';
import { MACHINES } from '../system/machines';
import type { BlocksProgram, BlockRule, MachineId, ProgramMode } from '../types';
import { exampleBlocks } from '../programs/examples';
import { Card, Chip, Pill, Screen, SectionTitle } from '../components/ui';
import ConditionListEditor, { conditionLabel, contactItems } from '../components/ConditionListEditor';

function DEFAULT_RULE(): BlockRule {
  return { when: [{ type: 'var', varId: 'bMarche', negated: false }], then: [] };
}

function Rule({
  rule,
  index,
  machine,
  onUpdate,
  onRemove,
}: {
  rule: BlockRule;
  index: number;
  machine: MachineId;
  onUpdate: (r: BlockRule) => void;
  onRemove: () => void;
}) {
  const actionVars = MACHINES[machine].vars.filter((v) => v.kind !== 'input');

  return (
    <Card>
      <View style={styles.ruleHeader}>
        <SectionTitle>{`Règle ${index + 1}`}</SectionTitle>
        <Pressable onPress={onRemove} hitSlop={8}>
          <Text style={styles.delete}>Supprimer</Text>
        </Pressable>
      </View>

      <Text style={styles.keyword}>SI</Text>
      <ConditionListEditor
        conditions={rule.when}
        machine={machine}
        pickerTitle="Condition d'entrée"
        emptyHint="Choisis une condition."
        hideLevelThresholds={!MACHINES[machine].numericLabel}
        onChange={(next) => onUpdate({ ...rule, when: next })}
      />

      <Text style={styles.keyword}>ALORS</Text>
      <View style={styles.actionsRow}>
        {actionVars.map((av) => (
          <Chip
            key={av.id}
            label={av.label}
            selected={rule.then.includes(av.id)}
            onPress={() =>
              onUpdate({
                ...rule,
                then: rule.then.includes(av.id)
                  ? rule.then.filter((x) => x !== av.id)
                  : [...rule.then, av.id],
              })
            }
          />
        ))}
      </View>
      {rule.then.length > 0 ? (
        <View style={styles.previewRow}>
          {rule.then.map((a) => (
            <Text key={a} style={styles.previewItem}>
              ({a} ← 1)
            </Text>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

export function BlocksEditor({
  machine,
  onSimulate,
}: {
  machine: MachineId;
  onSimulate: (mode: ProgramMode, machine: MachineId) => void;
}) {
  const { get, set, clear } = usePrograms();
  const program = get('blocks', machine) as BlocksProgram;

  const update = (i: number, rule: BlockRule) => {
    const rules = [...program.rules];
    rules[i] = rule;
    set('blocks', machine, { ...program, rules });
  };

  return (
    <Screen
      title={`Blocs — ${MACHINES[machine].name}`}
      subtitle="Règles SI / ALORS évaluées à chaque cycle. Sans mémoire : la sortie suit la condition tant qu'elle est vraie."
    >
      {program.rules.length === 0 ? (
        <Card>
          <Text style={styles.hint}>
            Aucune règle. Ajoute ta première règle SI / ALORS pour commander la machine.
          </Text>
        </Card>
      ) : null}

      {program.rules.map((r, i) => (
        <Rule
          key={i}
          rule={r}
          index={i}
          machine={machine}
          onUpdate={(nr) => update(i, nr)}
          onRemove={() => set('blocks', machine, { ...program, rules: program.rules.filter((_, j) => j !== i) })}
        />
      ))}

      <Pill
        label="+ Nouvelle règle"
        tone="accent"
        onPress={() => set('blocks', machine, { ...program, rules: [...program.rules, DEFAULT_RULE()] })}
      />

      <Card>
        <SectionTitle>Aperçu des contacts</SectionTitle>
        <Text style={styles.hint}>
          {contactItems(machine)
            .map((v) => v.label)
            .join('  •  ')}
        </Text>
        <Text style={styles.hint}>
          Exemple : {conditionLabel({ type: 'var', varId: 'bMarche', negated: false }, machine)} → allume les sorties choisies.
        </Text>
      </Card>

      <View style={styles.footerRow}>
        <Pill label="Exemple" onPress={() => set('blocks', machine, exampleBlocks(machine))} />
        <Pill label="Tout effacer" tone="danger" onPress={() => clear('blocks', machine)} />
        <Pill label="▶︎ Simuler" tone="ok" onPress={() => onSimulate('blocks', machine)} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  ruleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  delete: { color: C.danger, fontSize: 13, fontWeight: '700' },
  keyword: { color: C.warn, fontSize: 12, fontWeight: '800', fontFamily: 'monospace', marginTop: 6 },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  previewRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  previewItem: { color: C.text, fontSize: 12, fontFamily: 'monospace' },
  hint: { color: C.dim, fontSize: 13, lineHeight: 19 },
  footerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
});
