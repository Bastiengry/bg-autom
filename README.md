# BG Autom — Labo d'automatisme (React Native / Expo)

Application mobile d'apprentissage de l'automatisme : l'utilisateur **programme l'automate**
et la simulation de **remplissage de cuve** exécute son programme en temps réel.

## Le système : remplissage de cuve

| Élément | Sens | Détail |
|---|---|---|
| `VANNE R` | Sortie | Vanne de remplissage (+1 % / cycle, 100 ms) |
| `POMPE V` | Sortie | Pompe de vidange (−1 % / cycle) |
| `BS` | Entrée | Capteur niveau bas (≤ 5 %) |
| `BM` | Entrée | Capteur niveau moyen (≥ 50 %) |
| `BH` | Entrée | Capteur niveau haut (≥ 95 %) |
| `MARCHE` / `ARRÊT` | Entrées | Boutons poussoirs (impulsion automatique ~600 ms) |

**Mission** : à chaque appui sur MARCHE, remplir jusqu'à BH, vider jusqu'à BS, puis recommencer
(cycles complets comptés à l'écran). Les boutons étant poussoirs, la demande doit être
**mémorisée** dans le programme — c'est le cœur pédagogique.

## Trois langages de programmation

1. **Blocs simples** (débutant) : règles `SI condition ALORS sorties`, réévaluées à chaque cycle, sans mémoire.
2. **Grafcet** (EN 60848) : étapes (actions) chaînées par des transitions (conditions), retour de séquence configurable.
3. **Ladder (LD)** : contacts (÷/ET/OU) et bobines, avec auto-maintien via un contact sur lui-même.

Chaque éditeur dispose d'un **exemple de départ** prêt à simuler (cycle complet pour Grafcet/Ladder).

## Architecture

```
src/
  app/                    Routes Expo Router (accueil, éditeurs, simulation)
  components/             UI partagée : TankView, éditeur de conditions, widgets
  engine/interpreters.ts  Exécution d'un programme pendant un cycle automate
  state/programs.tsx      État partagé des 3 programmes (contexte React)
  system/model.ts         Physique de la cuve (niveau, capteurs, cycles) à 100 ms
  programs/examples.ts    Programmes d'exemple (solutions)
  types.ts                Vocabulaire E/S et types de programmes
```

Le simulateur fait tourner l'automate à 10 Hz : chaque cycle lit les entrées, évalue le
programme (Grafcet / Ladder / Blocs), applique les sorties au procédé.

## Commandes

```bash
npm install
npx expo start          # ouvrir avec Expo Go
npm run test:types      # tsc --noEmit
npx expo lint
```

## Pistes d'évolution

- Sauvegarde des programmes (AsyncStorage), profil multi-missions
- Grafcet avec divergences en OU / ET (séquences alternatives et parallèles)
- Timers (TON/TOF), compteurs, nouvelles machines (feux de carrefour, perceuse…)
