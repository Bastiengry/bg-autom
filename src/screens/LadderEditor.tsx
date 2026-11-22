import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { C } from '../theme';
import { usePrograms } from '../state/programs';
import { OUTPUT_IDS, VAR_LABELS, type LadderRung, type ProgramMode, type VarId } from '../types';
import { exampleLadder } from '../programs/examples';
import { Card, Chip, ItemPicker, Pill, Screen, SectionTitle } from '../components/ui';
import { ioPickerItems } from '../components/ConditionListEditor';

function Rung({
  rung,
  index,
  onUpdate,
  onRemove,
}: {
  rung: LadderRung;
  index: number;
  onUpdate: (r: LadderRung) => void;
  onRemove: () => void;
}) {
  const [picking, setPicking] = useState(false);

  const addTerm = (id: string) => {
    const varId = id as VarId;
    if (rung.terms.some((t) => t.varId === varId)) return;
    onUpdate({
      ...rung,
      terms: [...rung.terms, { varId, negated: false }],
      junctions: [...rung.junctions, 'AND'],
    });
  };

  const toggleNegate = (i: number) => {
    const terms = [...rung.terms];
    terms[i] = { ...terms[i], negated: !terms[i].negated };
    onUpdate({ ...rung, terms });
  };

  const removeTerm = (i: number) => {
    const terms = rung.terms.filter((_, j) => j !== i);
    const junctions = rung.junctions.filter((_, j) => j !== i - 1);
    onUpdate({ ...rung, terms, junctions });
  };

  const flipJunction = (i: number) => {
    const junctions = [...rung.junctions];
    junctions[i] = junctions[i] === 'AND' ? 'OR' : 'AND';
    onUpdate({ ...rung, junctions });
  };

  return (
    <Card>
      <View style={styles.rungHeader}>
        <SectionTitle>Rang {index + 1}</SectionTitle>
        <Pressable onPress={onRemove} hitSlop={8}>
          <Text style={styles.delete}>Supprimer</Text>
        </Pressable>
      </View>

      <View style={styles.terms}>
        {rung.terms.map((t, i) => (
          <React.Fragment key={`${t.varId}`}>
            {i > 0 ? (
              <Pressable onPress={() => flipJunction(i - 1)} hitSlop={6} style={styles.junction}>
                <Text style={styles.junctionText}>
                  {rung.junctions[i - 1] === 'AND' ? '─ ET ─' : '─ OU ─'}
                </Text>
              </Pressable>
            ) : null}
            <View style={styles.termRow}>
              <Text style={styles.wire}>├─</Text>
              <Text style={[styles.contact, t.negated && styles.contactNeg]}>
                {t.negated ? '/' : ' '}
                {VAR_LABELS[t.varId]}
              </Text>
              <Text style={styles.wire}>─┤</Text>
              <Pressable onPress={() => toggleNegate(i)} style={styles.smallBtn} hitSlop={8}>
                <Text style={styles.smallBtnText}>NON</Text>
              </Pressable>
              <Pressable onPress={() => removeTerm(i)} hitSlop={8}>
                <Text style={styles.deleteSmall}>✕</Text>
              </Pressable>
            </View>
          </React.Fragment>
        ))}
        <Text style={styles.coil}>
          ══( {VAR_LABELS[rung.output]} )══
        </Text>
      </View>

      <Chip label="+ Ajouter un contact" selected={false} onPress={() => setPicking(true)} />

      <ItemPicker
        visible={picking}
        title="Choisir un contact (entrée ou sortie pour auto-maintien)"
        items={ioPickerItems()}
        onSelect={addTerm}
        onClose={() => setPicking(false)}
      />
    </Card>
  );
}

export function LadderEditor({ onSimulate }: { onSimulate: (mode: ProgramMode) => void }) {
  const { ladder, setLadder, clear } = usePrograms();
  const [pickingCoil, setPickingCoil] = useState(false);

  const addRung = (output: VarId) => {
    setLadder({
      rungs: [
        ...ladder.rungs,
        { output, terms: [], junctions: [] },
      ],
    });
  };

  return (
    <Screen
      title="Éditeur Ladder (LD)"
      subtitle="Chaque rang energise sa bobine ( ) quand l'enchaînement de contacts est vrai. Entre deux contacts, basculez ET / OU. Utilisez un contact de la même bobine en OU pour l'auto-maintien."
    >
      {ladder.rungs.length === 0 ? (
        <Card>
          <Text style={styles.empty}>
            Ajoutez un premier rang, ou chargez l’exemple remplissage/vidange ci-dessous.
          </Text>
        </Card>
      ) : null}

      {ladder.rungs.map((r, i) => (
        <Rung
          key={i}
          rung={r}
          index={i}
          onUpdate={(nr) => {
            const rungs = [...ladder.rungs];
            rungs[i] = nr;
            setLadder({ rungs });
          }}
          onRemove={() => setLadder({ rungs: ladder.rungs.filter((_, j) => j !== i) })}
        />
      ))}

      <Pill label="+ Nouveau rang" tone="accent" onPress={() => setPickingCoil(true)} />
      <ItemPicker
        visible={pickingCoil}
        title="Bobine pilotée par ce rang"
        items={OUTPUT_IDS.map((id) => ({
          id,
          label: VAR_LABELS[id],
          detail: id === 'vanneR' ? 'Vanne de remplissage' : id === 'pompeV' ? 'Pompe de vidange' : 'Voyant',
        }))}
        onSelect={(id) => addRung(id as VarId)}
        onClose={() => setPickingCoil(false)}
      />

      <View style={styles.rowBtns}>
        <Pill label="Charger un exemple (remplissage/vidange)" tone="accent" onPress={() => setLadder(exampleLadder())} />
        <Pill label="Tout effacer" onPress={() => clear('ladder')} />
      </View>
      <Pill label="▶ Simuler ce programme" tone="ok" onPress={() => onSimulate('ladder')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  rungHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  terms: { gap: 2 },
  termRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  wire: { color: C.dim, fontSize: 14, fontFamily: 'monospace' },
  contact: {
    color: C.accent,
    fontWeight: '700',
    fontFamily: 'monospace',
    fontSize: 14,
    minWidth: 76,
    textAlign: 'center',
  },
  contactNeg: { color: C.warn },
  junction: { paddingLeft: 12, paddingVertical: 2 },
  junctionText: { color: C.warn, fontSize: 12, fontFamily: 'monospace', fontWeight: '700' },
  coil: {
    color: C.ok,
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 12,
  },
  smallBtn: {
    backgroundColor: C.cardAlt,
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  smallBtnText: { color: C.dim, fontSize: 11, fontWeight: '700' },
  delete: { color: C.danger, fontSize: 13, fontWeight: '700' },
  deleteSmall: { color: C.danger, fontSize: 13, fontWeight: '700', paddingHorizontal: 6 },
  empty: { color: C.dim, fontSize: 13, fontStyle: 'italic' },
  rowBtns: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
});
