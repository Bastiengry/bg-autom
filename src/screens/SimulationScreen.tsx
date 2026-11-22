import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { C } from '../theme';
import { usePrograms } from '../state/programs';
import {
  MODE_LABELS,
  VAR_LABELS,
  type ProgramMode,
  type Vars,
  type GrafcetProgram,
  type LadderProgram,
  type BlocksProgram,
} from '../types';
import {
  initInterpState,
  runProgram,
  type InterpState,
} from '../engine/interpreters';
import { initSystem, stepSystem, TICK_MS, type SysState } from '../system/model';
import { TankView } from '../components/TankView';
import { Pill, Card, SectionTitle } from '../components/ui';

const PRESS_TICKS = 6;

interface Frame {
  sys: SysState;
  outputs: Vars;
  press: { bMarche: number; bArret: number };
  interp: InterpState;
}

function initFrame(): Frame {
  return {
    sys: initSystem(),
    outputs: {
      bMarche: false,
      bArret: false,
      sBas: true,
      sMoyen: false,
      sHaut: false,
      vanneR: false,
      pompeV: false,
      voyVert: false,
      voyRouge: false,
    },
    press: { bMarche: 0, bArret: 0 },
    interp: initInterpState(),
  };
}

function Lamp({ on, color, label }: { on: boolean; color: string; label: string }) {
  return (
    <View style={styles.lampWrap}>
      <View style={[styles.lamp, { backgroundColor: on ? color : '#1E2A44', borderColor: on ? color : C.border }]}>
        <View style={[styles.lampGlow, on ? { backgroundColor: color } : null]} />
      </View>
      <Text style={[styles.lampLabel, on && { color: C.text }]}>{label}</Text>
    </View>
  );
}

export function SimulationScreen({
  mode,
  onBack,
  onHome,
}: {
  mode: ProgramMode;
  onBack: () => void;
  onHome: () => void;
}) {
  const { get } = usePrograms();
  const [frame, setFrame] = useState<Frame>(() => initFrame());
  const [running, setRunning] = useState(true);
  const runningRef = useRef(running);

  useEffect(() => {
    runningRef.current = running;
  }, [running]);

  useEffect(() => {
    const id = setInterval(() => {
      if (!runningRef.current) return;
      setFrame((f) => {
        const sensors = {
          sBas: f.sys.level <= 5,
          sMoyen: f.sys.level >= 50,
          sHaut: f.sys.level >= 95,
        };
        const full: Vars = {
          bMarche: f.press.bMarche > 0,
          bArret: f.press.bArret > 0,
          ...sensors,
          vanneR: f.outputs.vanneR,
          pompeV: f.outputs.pompeV,
          voyVert: f.outputs.voyVert,
          voyRouge: f.outputs.voyRouge,
        };
        const program = get(mode);
        const r = runProgram(mode, program, full, f.interp);
        const sys = stepSystem(f.sys, {
          vanneR: r.outputs.vanneR,
          pompeV: r.outputs.pompeV,
        });
        return {
          sys,
          outputs: r.outputs,
          press: {
            bMarche: Math.max(0, f.press.bMarche - 1),
            bArret: Math.max(0, f.press.bArret - 1),
          },
          interp: r.state,
        };
      });
    }, TICK_MS);
    return () => clearInterval(id);
  }, [get, mode]);

  const press = (which: 'bMarche' | 'bArret') =>
    setFrame((f) => ({ ...f, press: { ...f.press, [which]: PRESS_TICKS } }));

  const reset = () => setFrame(initFrame());

  const { sys, outputs } = frame;
  const phaseText =
    outputs.vanneR && !outputs.pompeV
      ? 'Remplissage…'
      : outputs.pompeV
        ? 'Vidange…'
        : 'Attend (sorties à 0)';

  return (
    <View style={styles.fill}>
      <View style={styles.header}>
        <Pill label="◀ Éditeur" onPress={onBack} />
        <Text style={styles.modeTitle}>{MODE_LABELS[mode]}</Text>
        <Pill label="Accueil" onPress={onHome} />
      </View>

      <Card>
        <View style={styles.statusRow}>
          <View style={styles.statusLeft}>
            <Text style={styles.levelText}>Cuve : {Math.round(sys.level)}%</Text>
            <Text style={styles.phaseText}>{phaseText}</Text>
          </View>
          <View style={styles.counters}>
            <Text style={styles.counterLabel}>Cycles complets</Text>
            <Text style={styles.counterValue}>{sys.cycles}</Text>
          </View>
        </View>
        <TankView
          level={sys.level}
          vars={{
            sBas: sys.level <= 5,
            sMoyen: sys.level >= 50,
            sHaut: sys.level >= 95,
            vanneR: outputs.vanneR,
            pompeV: outputs.pompeV,
            voyVert: outputs.voyVert,
            voyRouge: outputs.voyRouge,
          }}
        />
        <View style={styles.lamps}>
          <Lamp on={outputs.vanneR} color={C.waterLight} label="VANNE R" />
          <Lamp on={outputs.pompeV} color={C.danger} label="POMPE V" />
          <Lamp on={outputs.voyVert} color={C.ok} label="VOY. VERT" />
          <Lamp on={outputs.voyRouge} color="#F00" label="VOY. ROUGE" />
          <Lamp on={frame.press.bMarche > 0} color={C.ok} label="MARCHE" />
          <Lamp on={frame.press.bArret > 0} color={C.danger} label="ARRÊT" />
        </View>
      </Card>

      {mode === 'grafcet' ? (
        <Card>
          <SectionTitle>Étape active</SectionTitle>
          <Text style={styles.stepLive}>
            X{Math.min(frame.interp.node, ((get(mode) as GrafcetProgram).nodes.length || 1) - 1)}
          </Text>
        </Card>
      ) : null}

      {mode === 'ladder' ? (
        <Card>
          <SectionTitle>Bobines actives</SectionTitle>
          <Text style={styles.coilLive}>
            {(() => {
              const rungs = (get(mode) as LadderProgram).rungs;
              const on = rungs.filter((r) => outputs[r.output]).map((r) => VAR_LABELS[r.output]);
              return on.length ? on.join(' • ') : '—';
            })()}
          </Text>
        </Card>
      ) : null}

      {mode === 'blocks' ? (
        <Card>
          <Text style={styles.hint}>
            {(get(mode) as BlocksProgram).rules.length} règle(s) chargée(s). Rappel : les blocs
            simples n’ont pas de mémoire — l’auto-maintien n’existe pas dans ce mode.
          </Text>
        </Card>
      ) : null}

      <View style={styles.controls}>
        <Pressable style={[styles.bigBtn, styles.btnOk]} onPress={() => press('bMarche')}>
          <Text style={styles.bigBtnText}>MARCHE</Text>
        </Pressable>
        <Pressable style={[styles.bigBtn, styles.btnDanger]} onPress={() => press('bArret')}>
          <Text style={styles.bigBtnText}>ARRÊT</Text>
        </Pressable>
        <Pressable style={[styles.bigBtn, styles.btnNeutral]} onPress={reset}>
          <Text style={styles.bigBtnText}>RESET</Text>
        </Pressable>
      </View>
      <View style={styles.rowBtns}>
        <Pill
          label={running ? '⏸ Pause simulation' : '▶ Reprendre'}
          tone="accent"
          onPress={() => setRunning((r) => !r)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: C.bg, padding: 16, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  modeTitle: { color: C.text, fontSize: 16, fontWeight: '800' },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusLeft: { gap: 2 },
  levelText: { color: C.text, fontSize: 18, fontWeight: '800' },
  phaseText: { color: C.dim, fontSize: 13 },
  counters: { alignItems: 'center' },
  counterLabel: { color: C.dim, fontSize: 11, textTransform: 'uppercase' },
  counterValue: { color: C.warn, fontSize: 26, fontWeight: '900' },
  lamps: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  lampWrap: { alignItems: 'center', gap: 4 },
  lamp: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lampGlow: { width: 14, height: 14, borderRadius: 7 },
  lampLabel: { color: C.dim, fontSize: 10, fontFamily: 'monospace' },
  controls: { flexDirection: 'row', gap: 10, marginTop: 4 },
  bigBtn: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  btnOk: { backgroundColor: 'rgba(52,211,153,0.18)', borderColor: C.ok },
  btnDanger: { backgroundColor: 'rgba(248,113,113,0.15)', borderColor: C.danger },
  btnNeutral: { backgroundColor: C.cardAlt, borderColor: C.border },
  bigBtnText: { color: C.text, fontWeight: '800', fontSize: 15 },
  stepLive: { color: C.accent, fontSize: 24, fontWeight: '900', fontFamily: 'monospace' },
  coilLive: { color: C.ok, fontSize: 16, fontFamily: 'monospace', fontWeight: '700' },
  hint: { color: C.dim, fontSize: 13, lineHeight: 18 },
  rowBtns: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
});
