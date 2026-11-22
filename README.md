# BG Autom — Labo d'automatisme (React Native / Expo)

Application mobile d'apprentissage de l'automatisme : l'utilisateur **programme l'automate**
et la machine (remplissage de cuve, feux de carrefour) exécute son programme en temps réel.

## Les machines

### 💧 Remplissage de cuve

| Élément | Sens | Détail |
|---|---|---|
| `VANNE R` | Sortie | Vanne de remplissage (+1 % / cycle, 100 ms) |
| `POMPE V` | Sortie | Pompe de vidange (−1 % / cycle) |
| `BS` | Entrée | Capteur niveau bas (≤ 5 %) |
| `BM` | Entrée | Capteur niveau moyen (≥ 50 %) |
| `BH` | Entrée | Capteur niveau haut (≥ 95 %) |
| `MARCHE` / `ARRÊT` | Entrées | Boutons poussoirs (impulsion automatique ~600 ms) |
| `M1`–`M3` | Relais internes | Mémoires de l'automate |
| `VOY. V` / `VOY. R` | Sorties | Voyants |

**Mission** : à chaque appui sur MARCHE, remplir jusqu'à BH, vider jusqu'à BS, puis recommencer
(cycles complets comptés à l'écran). Les boutons étant poussoirs, la demande doit être
**mémorisée** dans le programme — c'est le cœur pédagogique.

### 🚦 Feux de carrefour

Deux voies croisées. Voie 1 : `R1 / O1 / V1`, voie 2 : `R2 / O2 / V2`, plus `MARCHE` / `ARRÊT`
et les relais internes `M1`–`M4` (une phase chacun).

**Mission** : enchaîner vert → orange → rouge sur chaque voie en sécurité : aucun feu vert
(ou orange) sur les deux voies simultanément. La simulation compte les **cycles complets**
et affiche un compteur de **conflits**.

## Trois langages de programmation

1. **Blocs simples** (débutant) : règles `SI condition ALORS sorties`, réévaluées à chaque cycle, sans mémoire.
2. **Grafcet** (EN 60848) : étapes (actions niveau / Set / Reset), transitions multi-conditions, tempo d'étape,
   **divergence OU / sauts** (avec condition de branchement), **divergence ET** (fourches `forks` / `waitsFor`),
   retour de séquence configurable (`loopTo`).
3. **Ladder (LD)** : contacts (÷/NON), junctions ET/OU, bobines `( ) / (S) / (R)`,
   **temporisations** TON (retard à l'enclenchement), TOF (retard au relâchement), TP (impulsion),
   **compteurs** CTU / CTD avec seuil et reset.

Les programmes exemples (une paire par machine) sont des solutions complètes prêtes à simuler,
et réagissent au bouton **ARRÊT** : en Grafcet, chaque étape a une branche alternative vers
l'étape initiale (tout s'arrête, MARCHE relance) ; en Ladder cuve, l'ARRÊT coupe vanne et pompe ;
en Ladder feux, un relais `MSTOP` passe les deux voies au rouge jusqu'au rappui MARCHE.

## Simulation

- Horloge automate : tick de 100 ms, vitesse **0,5× / 1× / 2× / 5×**
- **Pas-à-pas** : pause puis « ▶︎ 1 cycle » pour avancer d'un seul cycle automate
- **Arrêt d'urgence** : coupe immédiatement toutes les sorties
- **Missions** : objectifs de validation (cycles complets, feux sans conflit…) cochés en temps réel
- **Chronogramme** : historique des 120 derniers cycles (entrées / sorties, 100 ms par case)
- Boutons poussoirs à impulsion, et visualisation dédiée par machine (cuve animée / lampes feux)

### 🛡️ Incidents (pannes & attaques)

Chaque machine propose des scénarios de « cyber-OT / sécurité fonctionnelle » : forçage d'un
capteur (BH collé à 1), actionneur bloqué (vanne neutralisée), forçage d'une sortie (feu vert
piraté) ou feu mort. Mission de chaque incident : **détecter** l'anomalie (incohérence capteur,
comparaison commande / retour lampe L1-L2) et **réagir en état sûr** (voyant d'alarme, tout
rouge, arrêt process). La mission est validée en temps réel. La partie réseau (Modbus, pare-feux,
IEC 62443) ferait l'objet d'une application séparée.

Les programmes sont **sauvegardés automatiquement** (AsyncStorage) par langage et par machine
(clé `bgautom.programs.v2`).

## Architecture

```
src/
  app/            # Expo Router : accueil, /editor/[mode]?machine=, /simulation/[mode]?machine=
  components/     # ui, ConditionListEditor, TankView, FeuxView
  engine/         # interpreters.ts : moteurs Grafcet / Ladder / Blocs
  programs/       # examples.ts : programmes exemples par machine
  screens/        # GrafcetEditor, LadderEditor, BlocksEditor, SimulationScreen
  state/          # programs.tsx : persistance AsyncStorage (contexte React)
  system/         # machines.ts : physique cuve + feux, registres de variables, objectifs
  types.ts        # types partagés (Condition union, programmes, machines)
tests/            # tests moteur (npm test)
```

## Développement

```bash
npm install
npm start          # Expo dev server
npx tsc --noEmit   # typecheck
npx expo lint      # lint
npm test           # tests moteur (cuve/feux × Grafcet/Ladder/Blocs)
```

### APK Android

- Build local : `npx expo prebuild --platform android && cd android && ./gradlew assembleRelease`
- Build cloud : `eas build --profile preview` (profil `preview` = APK ; `production` = AAB)

L'APK signé le plus récent est committé dans `apk/` (voir les [Releases GitHub](https://github.com/Bastiengry/bg-autom/releases)).

## Limites connues

- Le mode Blocs est sans mémoire (choix pédagogique documenté dans l'UI).
- Pas de build iOS dans ce dépôt ; interface en français uniquement.
EOF
npx tsc --noEmit 2>&1 | head -5; npx expo lint 2>&1 | tail -4; npm test 2>&1 | grep -E "✓|passent"