import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { C } from '../theme';
import { usePrograms } from '../state/programs';
import {
  OUTPUT_IDS,
  VAR_LABELS,
  type BlockRule,
  type ProgramMode,
  type VarId,
} from '../types';
import { exampleBlocks } from '../programs/examples';
import { Card, Chip, Pill, Screen, SectionTitle } from '../components/ui';
import { ConditionListEditor, inputPickerItems } from '../components/ConditionListEditor';

function Rule({
  rule,
  index,
  onUpdate,
  onRemove,
}: {
  rule: BlockRule;
  index: number;
  onUpdate: (r: BlockRule) => void;
  onRemove: () => void;
}) {
  const toggleAction = (a: VarId) => {
    const then = rule.then.includes(a)
      ? rule.then.filter((x) => x !== a)
      : [...rule.then, a];
    onUpdate({ ...rule, then });
  };

  return (
    <Card>
      <View style={styles.ruleHeader}>
        <SectionTitle>Si / Alors {index + 1}</SectionTitle>
        <Pressable onPress={onRemove} hitSlop={8}>
          <Text style={styles.delete}>Supprimer</Text>
        </Pressable>
      </View>

      <Text style={styles.keyword}>SI</Text>
      <ConditionListEditor
        conditions={[rule.when]}
        onChange={(next) => onUpdate({ ...rule, when: next[0] ?? { varId: 'sHaut', negated: false } })}
        items={inputPickerItems()}
        pickerTitle="Condition du Si"
        emptyHint="Choisissez une condition."
      />

      <Text style={styles.keyword}>ALORS</Text>
      <View style={styles.chips}>
        {OUTPUT_IDS.map((a) => (
          <Chip
            key={a}
            label={VAR_LABELS[a]}
            selected={rule.then.includes(a)}
            onPress={() => toggleAction(a)}
          />
        ))}
      </View>
      <Text style={styles.note}>
        Les règles sont évaluées de haut en bas : une règle plus bas peut annuler une règle plus haut.
      </Text>
    </Card>
  );
}

export function BlocksEditor({ onSimulate }: { onSimulate: (mode: ProgramMode) => void }) {
  const { blocks, setBlocks, clear } = usePrograms();

  return (
    <Screen
      title="Éditeur Blocs simples"
      subtitle="Des règles SI condition ALORS sorties, réévaluées à chaque cycle. Mode le plus simple : il n'y a aucune mémoire — pour un cycle complet (remplir puis vider), utilisez plutôt Grafcet ou Ladder."
    >
      {blocks.rules.length === 0 ? (
        <Card>
          <Text style={styles.empty}>
            Ajoutez une première règle, ou chargez l’exemple « remplir puis s’arrêter ».
          </Text>
        </Card>
      ) : null}

      {blocks.rules.map((r, i) => (
        <Rule
          key={i}
          rule={r}
          index={i}
          onUpdate={(nr) => {
            const rules = [...blocks.rules];
            rules[i] = nr;
            setBlocks({ rules });
          }}
          onRemove={() => setBlocks({ rules: blocks.rules.filter((_, j) => j !== i) })}
        />
      ))}

      <Pill
        label="+ Nouvelle règle"
        tone="accent"
        onPress={() =>
          setBlocks({
            rules: [...blocks.rules, { when: { varId: 'sHaut', negated: false }, then: [] }],
          })
        }
      />

      <View style={styles.rowBtns}>
        <Pill label="Charger un exemple (remplir puis stop)" tone="accent" onPress={() => setBlocks(exampleBlocks())} />
        <Pill label="Tout effacer" onPress={() => clear('blocks')} />
      </View>
      <Pill label="▶ Simuler ce programme" tone="ok" onPress={() => onSimulate('blocks')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  ruleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  keyword: { color: C.warn, fontWeight: '800', fontSize: 13, fontFamily: 'monospace', marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  note: { color: C.dim, fontSize: 12, lineHeight: 17 },
  delete: { color: C.danger, fontSize: 13, fontWeight: '700' },
  empty: { color: C.dim, fontSize: 13, fontStyle: 'italic' },
  rowBtns: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
});
