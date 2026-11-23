import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { C } from '../theme';
import { usePrograms } from '../state/programs';
import {
  MODE_LABELS,
  type AnyProgram,
  type MachineId,
  type ProgramMode,
} from '../types';
import {
  initInterpState,
  runProgram,
  type InterpState,
} from '../engine/interpreters';
import {
  initSystem,
  machineInputs,
  MACHINES,
  numericOf,
  objectives,
  stepSystem,
  TICK_MS,
  type ConvoyeurState,
  type MachineState,
  type PNiveauState,
  type RobotState,
} from '../system/machines';
import { INCIDENTS } from '../system/incidents';
import { TankView } from '../components/TankView';
import { FeuxView } from './FeuxView';
import { ConveyorView } from './ConveyorView';
import { RobotView } from './RobotView';
import { PNiveauView } from './PNiveauView';
import { Card, Chip, Pill, SectionTitle } from '../components/ui';

const PRESS_TICKS = 6;
const CHRONO_MAX = 120;

function incidentOk(
  machine: MachineId,
  incident: string,
  outputs: Record<string, boolean>,
  vars: Record<string, boolean>,
): boolean {
  const on = (id: string) => !!outputs[id];
  const off = (id: string) => !outputs[id];
  if (machine === 'cuve') {
    if (incident === 'fHaut') return on('voyRouge') && !!vars.sHaut && !vars.sMoyen;
    return off('vanneR') && off('pompeV') && on('voyRouge');
  }
  if (machine === 'feux') return on('r1') && on('r2');
  if (machine === 'convoyeur') return off('moteur') && on('voyRouge');
  if (machine === 'robot') {
    if (incident === 'fBombe') return off('bombe') && off('avancer') && off('reculer') && on('voyRouge');
    return off('bombe') && on('voyRouge');
  }
  if (machine === 'pniveau') return on('alarme');
  return false;
}

const SPEEDS = [0.5, 1, 2, 5] as const;
type Speed = (typeof SPEEDS)[number];

type Sample = Record<string, boolean>;

interface Controls {
  mode: ProgramMode;
  machine: MachineId;
  onBack: () => void;
  onHome: () => void;
}

export function SimulationScreen({ mode, machine, onBack, onHome }: Controls) {
  const { get } = usePrograms();
  const program: AnyProgram = get(mode, machine);
  const def = MACHINES[machine];

  const sysRef = useRef<MachineState>(initSystem(machine));
  const interpRef = useRef<InterpState>(initInterpState());
  const pressRef = useRef<{ bMarche: number; bArret: number }>({ bMarche: 0, bArret: 0 });
  const chronoRef = useRef<Sample[]>([]);
  const tickCountRef = useRef(0);
  const faultStartRef = useRef<number | null>(null);
  const seenRef = useRef<Record<string, boolean>>({});
  const lastActualRef = useRef<Record<string, boolean>>({});
  const aruLatchedRef = useRef(false);

  const [speed, setSpeed] = useState<Speed>(1);
  const [paused, setPaused] = useState(false);
  const [incident, setIncident] = useState<string | null>(null);
  const [seen, setSeen] = useState<Record<string, boolean>>({});
  const [eStop, setEStop] = useState(false);
  const [showChrono, setShowChrono] = useState(false);
  const [chrono, setChrono] = useState<Sample[]>([]);
  const [view, setView] = useState<{ sys: MachineState; outputs: Record<string, boolean>; vars: Record<string, boolean> }>(
    () => ({ sys: initSystem(machine), outputs: {}, vars: {} }),
  );

  const inputVars = useCallback(() => {
    const vars: Record<string, boolean> = {};
    for (const v of def.vars) if (v.kind === 'input') vars[v.id] = false;
    Object.assign(vars, machineInputs(machine, sysRef.current, lastActualRef.current));
    if (machine === 'cuve') vars.bAru = incident === 'fCable' ? false : !aruLatchedRef.current;
    if (pressRef.current.bMarche > 0) vars.bMarche = true;
    if (pressRef.current.bArret > 0) vars.bArret = true;
    return vars;
  }, [def.vars, machine, incident]);

  const tick = useCallback(
    () => {
      if (eStop) return;
      tickCountRef.current += 1;
      const vars = inputVars();
      if (incident === 'fHaut') vars.sHaut = true;
      if (incident === 'fCapteur' && machine === 'robot') vars.pDroite = true;
      if (incident === 'fCable' && machine === 'cuve') vars.bAru = false;
      if (incident === 'fCapteur' && machine === 'pniveau') vars.dEntree = true;
      const run = runProgram(mode, program, vars, interpRef.current, {
        level: numericOf(machine, sysRef.current),
      });
      let outputs = run.outputs;
      if (incident === 'fVanne') outputs = { ...outputs, vanneR: false };
      if (incident === 'fV1') outputs = { ...outputs, v1: true };
      if (incident === 'fR2Dead') outputs = { ...outputs, r2: false };
      if (incident === 'fMoteur') outputs = { ...outputs, moteur: false };
      if (incident === 'fPous') outputs = { ...outputs, poussoir: true };
      if (incident === 'fBombe') outputs = { ...outputs, bombe: true };
      if (incident === 'fBarriere') outputs = { ...outputs, barriere: false };
      lastActualRef.current = outputs;
      interpRef.current = run.state;
      const nextSys = stepSystem(machine, sysRef.current, outputs, vars);
      sysRef.current = nextSys;

      if (incident && faultStartRef.current === null) faultStartRef.current = tickCountRef.current;
      if (!incident) faultStartRef.current = null;
      const sinceMs =
        faultStartRef.current === null
          ? Infinity
          : (tickCountRef.current - faultStartRef.current) * TICK_MS;
      if (incident && sinceMs >= 500 && !seenRef.current[incident]) {
        const ok = incidentOk(machine, incident, outputs, vars);
        if (ok) {
          seenRef.current[incident] = true;
          setSeen({ ...seenRef.current });
        }
      }

      if (pressRef.current.bMarche > 0) pressRef.current.bMarche -= 1;
      if (pressRef.current.bArret > 0) pressRef.current.bArret -= 1;

      const sample: Sample = { ...vars, ...outputs };
      const buf = chronoRef.current;
      buf.push(sample);
      if (buf.length > CHRONO_MAX) buf.shift();
      if (showChrono) setChrono([...buf]);

      setView({ sys: nextSys, outputs, vars });
    },
    [eStop, incident, inputVars, machine, mode, program, showChrono],
  );

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => tick(), TICK_MS / speed);
    return () => clearInterval(id);
  }, [paused, speed, tick]);

  const press = (id: 'bMarche' | 'bArret') => {
    pressRef.current[id] = PRESS_TICKS;
    if (paused && !eStop) tick();
  };

  const reset = () => {
    sysRef.current = initSystem(machine);
    interpRef.current = initInterpState();
    pressRef.current = { bMarche: 0, bArret: 0 };
    aruLatchedRef.current = false;
    chronoRef.current = [];
    lastActualRef.current = {};
    tickCountRef.current = 0;
    faultStartRef.current = null;
    seenRef.current = {};
    setSeen({});
    setChrono([]);
    setEStop(false);
    setView({ sys: sysRef.current, outputs: {}, vars: {} });
  };

  const stopAll = () => {
    setPaused(true);
    setEStop(true);
    sysRef.current = stepSystem(machine, sysRef.current, {});
    setView({ sys: sysRef.current, outputs: {}, vars: {} });
  };

  const mission = objectives(machine, view.sys);
  const chronVars = def.vars.filter((v) => v.kind !== 'internal');

  return (
    <View style={styles.fill}>
      <View style={styles.header}>
        <Pill label="← Éditeur" onPress={onBack} />
        <Text style={styles.headerTitle} numberOfLines={1}>
          {MODE_LABELS[mode]} — {def.icon} {def.name}
        </Text>
        <Pill label="🏠" onPress={onHome} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          {machine === 'cuve' ? (
            <TankView
              level={view.sys.kind === 'cuve' ? view.sys.level : 0}
              vars={view.outputs}
            />
          ) : null}
          {machine === 'feux' ? <FeuxView vars={view.outputs} /> : null}
          {machine === 'convoyeur' ? (
            <ConveyorView sys={view.sys as ConvoyeurState} outputs={view.outputs} />
          ) : null}
          {machine === 'robot' ? (
            <RobotView sys={view.sys as RobotState} outputs={view.outputs} />
          ) : null}
          {machine === 'pniveau' ? (
            <PNiveauView sys={view.sys as PNiveauState} outputs={view.outputs} />
          ) : null}
          <Text style={styles.describe}>{def.describe(view.sys)}</Text>
        </Card>

        <Card>
          <SectionTitle>Boutons poussoirs</SectionTitle>
          <View style={styles.row}>
            <Pressable style={[styles.btn, styles.btnOk]} onPress={() => press('bMarche')}>
              <Text style={styles.btnText}>MARCHE</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.btnDanger]} onPress={() => press('bArret')}>
              <Text style={styles.btnText}>ARRÊT</Text>
            </Pressable>
          </View>
          {machine === 'cuve' ? (
            <>
              <View style={styles.row}>
                <Pressable
                  style={[styles.btn, styles.btnDanger]}
                  onPress={() => { aruLatchedRef.current = true; if (paused && !eStop) tick(); }}
                >
                  <Text style={styles.btnText}>🛑 AU (NF)</Text>
                </Pressable>
                <Pressable
                  style={[styles.btn, styles.btnOk]}
                  onPress={() => { aruLatchedRef.current = false; if (paused && !eStop) tick(); }}
                >
                  <Text style={styles.btnText}>Réarmer AU</Text>
                </Pressable>
              </View>
              <Text style={styles.hint}>
                AU à contact NF : bAru = true circuit sain, false appui AU ou câble coupé.
              </Text>
            </>
          ) : null}
          <Text style={styles.hint}>
            Impulsion de {PRESS_TICKS * TICK_MS} ms : mémorise la demande dans ton programme.
          </Text>
        </Card>

        <Card>
          <SectionTitle>Commandes</SectionTitle>
          <View style={styles.row}>
            {SPEEDS.map((s) => (
              <Chip key={s} label={`${s}×`} selected={!paused && speed === s} onPress={() => { setSpeed(s); setPaused(false); }} />
            ))}
            <Chip label="Pause" selected={paused} onPress={() => setPaused(true)} />
          </View>
          <View style={styles.row}>
            <Pill label="▶︎ 1 cycle" tone={paused ? 'ok' : 'neutral'} disabled={!paused} onPress={() => tick()} />
            <Pill label="Reinitialiser" onPress={reset} />
            <Pill label="■ Arrêt d’urgence" tone="danger" disabled={eStop} onPress={stopAll} />
          </View>
          {eStop ? <Text style={styles.eStop}>ARRÊT D’URGENCE ACTIF — Reinitialise pour redémarrer</Text> : null}
          {!paused && !eStop ? <Text style={styles.hint}>Simulation en cours ({speed}×, tick {TICK_MS} ms)</Text> : null}
          {paused && !eStop ? <Text style={styles.hint}>En pause : avance cycle par cycle avec « ▶︎ 1 cycle »</Text> : null}
        </Card>

        <Card>
          <SectionTitle>🛡️ Incidents (pannes &amp; attaques)</SectionTitle>
          <View style={styles.row}>
            <Chip label="Aucun" selected={incident === null} onPress={() => setIncident(null)} />
            {INCIDENTS[machine].map((f) => (
              <Chip key={f.id} label={f.label} selected={incident === f.id} onPress={() => setIncident(incident === f.id ? null : f.id)} />
            ))}
          </View>
          {incident ? (
            <>
              <Text style={styles.hint}>
                {INCIDENTS[machine].find((f) => f.id === incident)?.detail}
              </Text>
              <Text style={styles.missionH}>
                {seen[incident] ? '✓ ' : '○ '}
                {INCIDENTS[machine].find((f) => f.id === incident)?.mission}
              </Text>
              <Text style={styles.hint}>
                Indice : {INCIDENTS[machine].find((f) => f.id === incident)?.hint}
              </Text>
            </>
          ) : (
            <Text style={styles.hint}>
              Simule une panne ou un forçage malveillant, puis programme la détection (incohérences commande/retour, impossibilités physiques, tempo TON) et la réaction en état sûr.
            </Text>
          )}
        </Card>

        <Card>
          <SectionTitle>🎯 Missions</SectionTitle>
          {mission.map((m) => (
            <Text key={m.label} style={[styles.mission, m.done ? styles.missionOk : null]}>
              {m.done ? '✓' : '○'} {m.label}
            </Text>
          ))}
        </Card>

        <Card>
          <SectionTitle>Sorties</SectionTitle>
          <View style={styles.ioWrap}>
            {def.vars
              .filter((v) => v.kind !== 'input')
              .map((v) => {
                const on = !!view.outputs[v.id];
                return (
                  <View key={v.id} style={[styles.ioCell, on ? styles.ioOn : null]}>
                    <Text style={[styles.ioText, on ? styles.ioTextOn : null]}>{v.label}</Text>
                  </View>
                );
              })}
          </View>
        </Card>

        <Card>
          <SectionTitle>Entrées</SectionTitle>
          <View style={styles.ioWrap}>
            {def.vars
              .filter((v) => v.kind === 'input')
              .map((v) => {
                const on = !!view.vars[v.id];
                return (
                  <View key={v.id} style={[styles.ioCell, on ? styles.ioOn : null]}>
                    <Text style={[styles.ioText, on ? styles.ioTextOn : null]}>{v.label}</Text>
                  </View>
                );
              })}
          </View>
        </Card>

        <Card>
          <View style={styles.chronoHeader}>
            <SectionTitle>Chronogramme</SectionTitle>
            <Chip label={showChrono ? "Masquer" : "Afficher"} selected={showChrono} onPress={() => { setShowChrono((s) => !s); setChrono([...chronoRef.current]); }} />
          </View>
          {showChrono ? (
            <>
              {chronVars.map((v) => (
                <View key={v.id} style={styles.chronoRow}>
                  <Text style={styles.chronoLabel} numberOfLines={1}>
                    {v.label}
                  </Text>
                  <View style={styles.chronoTrack}>
                    {chrono.map((s, i) => (
                      <View
                        key={i}
                        style={[
                          styles.chronoCell,
                          { backgroundColor: s[v.id] ? C.ok : '#1B2740' },
                        ]}
                      />
                    ))}
                  </View>
                </View>
              ))}
              <Text style={styles.hint}>{chrono.length} derniers cycles automate (100 ms / case)</Text>
            </>
          ) : (
            <Text style={styles.hint}>
              Affiche l’historique des 120 derniers cycles (entrées et sorties) sous forme de chronogramme.
            </Text>
          )}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 48,
    paddingBottom: 10,
    backgroundColor: C.bg,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerTitle: { flex: 1, color: C.text, fontSize: 15, fontWeight: '800' },
  content: { padding: 16, paddingBottom: 48, gap: 12 },
  describe: { color: C.text, fontSize: 13, textAlign: 'center', fontFamily: 'monospace' },
  hint: { color: C.dim, fontSize: 12, lineHeight: 17, marginTop: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  btn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  btnOk: { backgroundColor: 'rgba(52,211,153,0.25)', borderWidth: 2, borderColor: C.ok },
  btnDanger: { backgroundColor: 'rgba(248,113,113,0.2)', borderWidth: 2, borderColor: C.danger },
  btnText: { color: C.text, fontWeight: '900', fontSize: 14 },
  eStop: { color: C.danger, fontWeight: '800', marginTop: 8, fontSize: 13 },
  mission: { color: C.text, fontSize: 13, lineHeight: 21, fontFamily: 'monospace' },
  missionOk: { color: C.ok },
  missionH: { color: C.warn, fontSize: 13, lineHeight: 21, fontFamily: 'monospace', fontWeight: '700' },
  ioWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  ioCell: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.cardAlt,
  },
  ioOn: { backgroundColor: 'rgba(52,211,153,0.25)', borderColor: C.ok },
  ioText: { color: C.dim, fontSize: 12, fontFamily: 'monospace' },
  ioTextOn: { color: C.ok, fontWeight: '800' },
  chronoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chronoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  chronoLabel: { width: 72, color: C.dim, fontSize: 11, fontFamily: 'monospace' },
  chronoTrack: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 4,
    overflow: 'hidden',
    height: 16,
  },
  chronoCell: { width: 5, height: '100%', marginRight: 1 },
});
