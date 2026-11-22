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
};
