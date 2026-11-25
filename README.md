# BG Autom — Labo d'automatisme (React Native / Expo)

Application mobile d'apprentissage de l'automatisme : l'utilisateur **programme l'automate**
et la machine exécute son programme en temps réel. 6 machines : remplissage de cuve,
feux de carrefour, **tri sur convoyeur**, **robot de peinture**, **passage à niveau**,
**🚤 écluse** (exercice guidé).

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

### 📦 Tri sur convoyeur

Des colis arrivent sur un tapis (`MOTEUR`). `D-ENTREE` = un colis est en tête, `D-TRI` = un colis est
dans la zone de tri, et le lecteur d’étiquette `FRAGILE` indique un colis de type A. Les colis
fragiles doivent être éjectés par le `POUSSOIR` en zone de tri, les colis normaux continuent
jusqu’à la sortie B. Retours actionneurs : `B-MVT` (tapis en mouvement) et `P-RET` (poussoir sorti).
La simulation compte les colis éjectés correctement / en erreur et les colis manqués.

**Mission** : éjecter les fragiles, laisser passer les colis normaux, 0 erreur et 0 manqué.

### 🎨 Robot de peinture

Un chariot robot se déplace sur un rail au-dessus de la pièce : capteurs `P-G` (origine) /
`P-M` (début de pièce) / `P-D` (fin de course), retour pistolet `R-PIST`. `BOMBE` peint la pièce
pendant la traversée (~40 → 86 % du rail) ; une éclaboussure hors pièce est comptée. La peinture
est aussi exposée comme valeur numérique (condition `level` ≥/≤ dans les éditeurs). Chaque pièce
finie, le chariot revient à `P-G` pour la suivante.

**Mission** : enchaîner les pièces sur MARCHE, 0 éclaboussure.

### 🚂 Passage à niveau

Un train arrive régulièrement. `D-1` (amont) annonce le train, `D-2` (aval) indique qu’il a dépassé
le passage. Fermer la `BARRIÈRE` (descente progressive ~1 s) et allumer les `FEUX` AVANT que le train
atteigne le passage, rouvrir après. Le retour `B-RET` confirme la position réelle. La simulation
compte les **passages** et les **dangers** (train sur le passage, barrière ouverte).

**Mission** : 2 trains franchis sans incident, barrière rouverte après chaque passage.

### 🚤 Écluse

Une écluse relie deux biefs d'eau de niveau différent : le bateau entre dans le **sas** par la porte
amont ou aval (détecteurs `D-DET AM` / `D-DET AV`, présence `D-SAS`). Les portes `MOTEUR P-AM` /
`MOTEUR P-AV` ne doivent **jamais s'ouvrir hors égalisation de niveau** (`N-AM` / `N-AV`, fins de
course `P-AM-Ouv/Ferm`, `P-AV-Ouv/Ferm`) : sinon la simulation compte une **manœuvre DANGEREUSE**.
Portes fermées, le sas est étanche : les vannes `VANNE REMP` / `VANNE VID` n'ont d'effet que dans
cette configuration. Les relais internes `R-DESC` / `R-MONT` mémorisent le côté d'entrée du bateau,
`M-REM` / `M-VID` / `M-OUV-AM` / `M-OUV-AV` pilotent les phases ; `FEU V AM` / `FEU V AV` signalent
les portes ouvertes, `ALARME` les défauts.

**Mission** : faire franchir les bateaux dans les **deux sens** (3 éclusages), sans aucune porte
commandée hors égalisation (0 danger), et tout remettre au repos (portes fermées) entre deux bateaux.

## Exercice guidé : l'écluse

L'intro de la machine déroule le cycle descendant **pas à pas** :

1. un bateau se présente à l'**amont** (`D-DET AM`) → ouvrir la `VANNE REMP` pour égaliser le sas
   avec le bief amont, jusqu'à `N-AM` ;
2. niveaux égalisés → ouvrir la porte amont (`MOTEUR P-AM`), feu `FEU V AM` ;
3. le bateau entre dans le sas (`D-SAS`) → refermer, et **mémoriser le côté d'entrée** (`R-DESC`) :
   c'est le cœur pédagogique du programme, qui détermine le sens du transit ;
4. portes fermées, sas étanche → ouvrir la `VANNE VID` jusqu'à `N-AV` ;
5. niveau bas → ouvrir la porte aval (`MOTEUR P-AV`), feu `FEU V AV` ;
6. bateau sorti → refermer et revenir au repos ; le bateau suivant arrive de l'**autre côté** :
   le cycle est le **miroir** (vidanger d'abord, `R-MONT`, sortie amont) et les deux sens se
   **alternent** automatiquement.

Pièges par la physique : toute porte commandée hors égalisation incrémente **DANGER** ; les vannes
sont sans effet si une porte n'est pas fermée (étanchéité). Le mode **Blocs** (sans mémoire) ne
permet que la descente — la montée exige relais (Ladder) ou étapes (Grafcet) : l'exemple Blocs le
documente comme limite volontaire.

Côté incidents : `N-AM collé` (capteur devant être physiquement impossible en même temps que
`N-AV` : détecter l'incohérence, couper moteurs et vannes, `ALARME` ; démontrable dans les 3
langages) et `porte aval bloquée` (commande sans retour `P-AV-Ouv` : TON 2 s → `ALARME`,
démonstration Ladder).

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

## Exercice : arrêt d'urgence à contact NF (cuve)

L'entrée `bAru` du remplissage de cuve est câblée en **contact normalement fermé (NF)** :
`bAru = true` circuit sain, `bAru = false` bouton AU enfoncé **ou** câble coupé. Logique inversée
à manipuler directivement dans les trois langages :

1. **Détecter l'ouverture** : tout programme doit couper VANNE R et POMPE V dès `bAru = false`,
   même au milieu d'un cycle. En Grafcet, branche alternative `NON bAru` vers l'étape initiale.
2. **Couper en sécurité** : en Ladder, contact `bAru` (positif) en série dans chaque rung + bobine
   VOY. R sur `NON bAru`. Un incident dédié (coupure de câble AU) simule l'appui **sans** action
   sur le bouton : un câble NF coupé se comporte exactement comme un appui, c'est toute la
   robustesse de cette logique.
3. **Verrouillage** : après un AU, il ne faut pas repartir tout seul au seul retour de `bAru`.
   Les exemples exigent une nouvelle impulsion MARCHE (l'interface simule l'acquit) ; les missions
   associées valident coupure et redémarrage verrouillé.

## Simulation

- Horloge automate : tick de 100 ms, vitesse **0,5× / 1× / 2× / 5×**
- **Pas-à-pas** : pause puis « ▶︎ 1 cycle » pour avancer d'un seul cycle automate
- **Arrêt d'urgence** : coupe immédiatement toutes les sorties ; cuve : AU à contact NF (`bAru`) avec boutons « AU » et « Réarmer AU » (verrouillage jusqu'à l'acquit MARCHE)
- **Missions** : objectifs de validation (cycles complets, feux sans conflit…) cochés en temps réel
- **Chronogramme** : historique des 120 derniers cycles (entrées / sorties, 100 ms par case)
- Boutons poussoirs à impulsion, et visualisation dédiée par machine (cuve animée, lampes feux, tapis + colis, chariot de peinture, barrière de passage à niveau, écluse 5 bassins)

### 🛡️ Incidents (pannes & attaques)

Chaque machine propose des scénarios de « cyber-OT / sécurité fonctionnelle » : forçage de capteur (BH collé à 1, capteur P-D collé, capteur N-AM collé (incohérence N-AM/N-AV écluse), capteur D-1 brouillé), actionneurs bloqués
(vanne neutralisée, moteur tapis bloqué, poussoir forcé sorti, bombe forcée ouverte, barrière bloquée, porte d'écluse bloquée
haute), coupure du câble de l'AU à contact NF (indistinguable d'un appui), sortie piratée (feu vert) ou feu mort. Le mode Blocs ne dispose pas de temporisation :
les missions incidents sont pensées pour Grafcet/Ladder (tempo TON, relais M mémoire). Mission de chaque incident : **détecter** l'anomalie (incohérence capteur,
comparaison commande / retour lampe L1-L2) et **réagir en état sûr** (voyant d'alarme, tout
rouge, arrêt process). La mission est validée en temps réel. La partie réseau (Modbus, pare-feux,
IEC 62443) ferait l'objet d'une application séparée.

Les programmes sont **sauvegardés automatiquement** (AsyncStorage) par langage et par machine
(clé `bgautom.programs.v3`).

## Architecture

```
src/
  app/            # Expo Router : accueil, /editor/[mode]?machine=, /simulation/[mode]?machine=
  components/     # ui, ConditionListEditor, TankView, FeuxView
  engine/         # interpreters.ts : moteurs Grafcet / Ladder / Blocs
  programs/       # examples.ts : programmes exemples par machine
  screens/        # GrafcetEditor, LadderEditor, BlocksEditor, SimulationScreen
  state/          # programs.tsx : persistance AsyncStorage (contexte React)
  system/         # machines.ts : physique des 6 machines, registres de variables, objectifs
  types.ts        # types partagés (Condition union, programmes, machines)
tests/            # tests moteur (npm test)
```

## Développement

```bash
npm install
npm start          # Expo dev server
npx tsc --noEmit   # typecheck
npx expo lint      # lint
npm test           # tests moteur (6 machines × Grafcet/Ladder/Blocs + incidents)
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