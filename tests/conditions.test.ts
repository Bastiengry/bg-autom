// Tests unitaires des helpers purs de l'editeur de conditions (src/system/conditions.ts).
// Ces fonctions etaient dupliquees dans ConditionListEditor.tsx : le bug v0.3.5 (menu
// « + Front » avec liste vide, ids prefixes compares aux ids bruts) aurait ete attrape ici.
import {
  conditionLabel,
  contactItems,
  frontItems,
} from '../src/system/conditions';
import { MACHINES } from '../src/system/machines';
import { MACHINE_IDS } from '../src/types';

describe('conditionLabel', () => {
  it('rend le libelle de la variable, avec / si negation', () => {
    expect(conditionLabel({ type: 'var', varId: 'bMarche', negated: false }, 'cuve')).toBe('MARCHE');
    expect(conditionLabel({ type: 'var', varId: 'bMarche', negated: true }, 'cuve')).toBe('/MARCHE');
  });

  it('rend un front avec la fleche du sens', () => {
    expect(conditionLabel({ type: 'edge', varId: 'bMarche', dir: 'rising' }, 'cuve')).toBe('front \u2191 MARCHE');
    expect(conditionLabel({ type: 'edge', varId: 'bMarche', dir: 'falling' }, 'cuve')).toBe('front \u2193 MARCHE');
  });

  it('rend un seuil de niveau avec l\u2019operateur', () => {
    expect(conditionLabel({ type: 'level', op: '>=', value: 50 }, 'cuve')).toBe('Niveau \u2265 50 %');
    expect(conditionLabel({ type: 'level', op: '<=', value: 5 }, 'cuve')).toBe('Niveau \u2264 5 %');
  });

  it('rend les contacts tempo et compteur', () => {
    expect(conditionLabel({ type: 'timerContact', timerId: 'T1' }, 'cuve')).toBe('T1.Q');
    expect(conditionLabel({ type: 'counterContact', counterId: 'C1' }, 'cuve')).toBe('C1.Q');
  });

  it('retombe sur l\u2019id brut si la variable est inconnue', () => {
    expect(conditionLabel({ type: 'var', varId: 'inconnu', negated: false }, 'cuve')).toBe('inconnu');
  });
});

describe('contactItems', () => {
  it('liste toutes les variables avec l\u2019id prefixe var:', () => {
    const items = contactItems('cuve');
    expect(items.length).toBe(MACHINES.cuve.vars.length);
    for (const it of items) {
      expect(it.id.startsWith('var:')).toBe(true);
      const v = MACHINES.cuve.vars.find((d) => d.id === it.id.slice(4));
      expect(v).toBeDefined();
      expect(it.label).toBe(v!.label);
    }
  });
});

describe('frontItems (le bug v0.3.5)', () => {
  it('chaque item correspond a une variable existante de kind input — c\u2019est ici qu\u2019etait le bug des ids prefixes', () => {
    for (const m of MACHINE_IDS) {
      const items = frontItems(m);
      expect(items.length).toBeGreaterThan(0);
      for (const it of items) {
        const raw = it.id.slice(4); // enleve le prefixe "var:"
        const v = MACHINES[m].vars.find((d) => d.id === raw);
        expect(v).toBeDefined();
        expect(v!.kind).toBe('input');
      }
    }
  });

  it('ne contient aucune sortie ni relais interne', () => {
    for (const m of MACHINE_IDS) {
      for (const it of frontItems(m)) {
        const v = MACHINES[m].vars.find((d) => d.id === it.id.slice(4));
        expect(v!.kind).not.toBe('output');
        expect(v!.kind).not.toBe('internal');
      }
    }
  });

  it('frontItems est un sous-ensemble de contactItems (meme format d\u2019id)', () => {
    for (const m of MACHINE_IDS) {
      const contacts = new Set(contactItems(m).map((i) => i.id));
      for (const it of frontItems(m)) expect(contacts.has(it.id)).toBe(true);
    }
  });

  it('la machine ecluse expose ses detection d\u2019attente en entrees frontables', () => {
    const ids = frontItems('ecluse').map((i) => i.id);
    expect(ids).toContain('var:dSas');
    expect(ids).toContain('var:dAm');
    expect(ids).toContain('var:dAv');
  });
});
