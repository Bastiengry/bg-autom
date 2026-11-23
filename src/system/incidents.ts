import type { MachineId } from '../types';

export interface Incident {
  id: string;
  label: string;
  detail: string;
  hint: string;
  mission: string;
}

export const INCIDENTS: Record<MachineId, Incident[]> = {
  cuve: [
    {
      id: 'fHaut',
      label: 'Forçage capteur BH',
      detail: 'Le capteur haut est forcé à 1 en permanence (panne ou attaque sur le capteur).',
      hint: 'Incohérence détectable : BH actif sans BM (contact « BH » ET contact « NON BM »).',
      mission: 'Rends l’incohérence visible : VOY. R allumé tant que BH est actif sans BM.',
    },
    {
      id: 'fVanne',
      label: 'Vanne R bloquée',
      detail: 'La vanne R reste fermée quoi que commande l’automate (actionneur neutralisé).',
      hint: 'Surveille le remplissage : tempo TON sur « VANNE R commandée » doit voir le niveau monter.',
      mission: 'Arrêt en état sûr dans les 5 s : VANNE R et POMPE V coupées, VOY. R allumé.',
    },
  ],
  feux: [
    {
      id: 'fV1',
      label: 'Forçage feu V1',
      detail: 'Le feu vert de la voie 1 est forcé allumé (sortie piratée, commande contournée).',
      hint: 'Compare commande et retour lampe : L1 actif alors que V1 et O1 ne sont pas commandés.',
      mission: 'Mode dégradé sûr dans les 5 s : R1 ET R2 commandés (les deux voies bloquées).',
    },
    {
      id: 'fR2Dead',
      label: 'Feu R2 mort',
      detail: 'Le feu rouge de la voie 2 ne s’allume jamais, même quand l’automate le commande.',
      hint: 'Compare commande et retour lampe : R2 commandé mais L2 inactif.',
      mission: 'Mode dégradé sûr dans les 5 s : R1 ET R2 commandés (les deux voies bloquées).',
    },
  ],
  convoyeur: [
    {
      id: 'fMoteur',
      label: 'Moteur tapis bloqué',
      detail: 'Le moteur est commandé par l’automate mais le tapis ne tourne plus (accouplement désolidarisé ou attaque sur la sortie).',
      hint: 'Compare commande et retour : MOTEUR commandé ET B-MVT inactif. Mémorise le défaut dans un relais M.',
      mission: 'Arrêt sûr : MOTEUR coupé et VOY. R allumé (défaut mémorisé).',
    },
    {
      id: 'fPous',
      label: 'Poussoir forcé sorti',
      detail: 'Le poussoir est forcé sorti en permanence : il éjecterait n’importe quel colis (sortie piratée).',
      hint: 'Compare commande et retour : P-RET actif alors que POUSSOIR n’est pas commandé.',
      mission: 'Arrêt sûr : MOTEUR coupé et VOY. R allumé (défaut mémorisé).',
    },
  ],
  robot: [
    {
      id: 'fBombe',
      label: 'Bombe forcée ouverte',
      detail: 'La bombe vaporise en permanence, même sans commande (fuite ou piratage de la sortie).',
      hint: 'Compare commande et retour : R-PIST actif alors que BOMBE n’est pas commandée.',
      mission: 'Arrêt sûr : BOMBE coupée, chariot à l’arrêt, VOY. R allumé.',
    },
    {
      id: 'fCapteur',
      label: 'Capteur P-D forcé',
      detail: 'Le capteur de fin de course droite est collé à 1 en permanence (panne ou mensonge sur le réseau de capteurs).',
      hint: 'Impossibilité physique : P-D et P-G actifs en même temps (le chariot est à l’origine). Détection : « P-G » ET « P-D ».',
      mission: 'Arrêt sûr : BOMBE coupée et VOY. R allumé.',
    },
  ],
  pniveau: [
    {
      id: 'fBarriere',
      label: 'Barrière bloquée haute',
      detail: 'La barrière ne descend plus, même commandée (verrou mécanique ou sortie neutralisée). Un train arrive !',
      hint: 'BARRIÈRE commandée depuis plus de 2 s (tempo TON) et B-RET toujours inactif.',
      mission: 'Signale le défaut : ALARME allumée.',
    },
    {
      id: 'fCapteur',
      label: 'Brouillage capteur D-1',
      detail: 'Le capteur amont envoie de fausses détections de train (brouillage ou message falsifié).',
      hint: 'Impossibilité physique : D-1 amont et D-2 aval actifs en même temps.',
      mission: 'Signale le défaut : ALARME allumée.',
    },
  ],
};
