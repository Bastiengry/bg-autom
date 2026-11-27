// Tests unitaires de la persistance des programmes (src/state/storage.ts).
// Le module est pur : pas d'AsyncStorage reel, on teste merge/serialize sur des chaines.
import {
  STORAGE_KEY,
  blankMap,
  mergeStored,
  serialize,
  type ProgramsMap,
} from '../src/state/storage';

describe('persistance des programmes', () => {
  it('la cle de stockage est stable (les programmes sauvegardes doivent survivre aux mises a jour)', () => {
    expect(STORAGE_KEY).toBe('bgautom.programs.v3');
  });

  it('blankMap couvre les 3 modes x 6 machines avec des programmes vides valides', () => {
    const m = blankMap();
    for (const mode of ['grafcet', 'ladder', 'blocks'] as const) {
      for (const machine of ['cuve', 'feux', 'convoyeur', 'robot', 'pniveau', 'ecluse'] as const) {
        expect(m[mode][machine]).toBeDefined();
      }
    }
  });

  it('roundtrip : serialize puis mergeStored restitue la meme carte', () => {
    const base = blankMap();
    base.blocks.cuve = { rules: [{ when: [{ type: 'var', varId: 'bMarche', negated: false }], then: ['voyVert'] }] };
    const raw = serialize(base);
    expect(mergeStored(raw, blankMap())).toEqual(base);
  });

  it('JSON corrompu : retombe sur la base sans lever', () => {
    const base = blankMap();
    expect(mergeStored('{{{pas du json', base)).toEqual(base);
  });

  it('contenu null (premiere utilisation) : carte de base', () => {
    expect(mergeStored(null, blankMap())).toEqual(blankMap());
  });

  it('machines manquantes dans le stockage : completees par la base', () => {
    const base = blankMap();
    const partiel = JSON.stringify({ grafcet: { cuve: { nodes: [], loopTo: 0 } } });
    const merged = mergeStored(partiel, base);
    expect(merged.grafcet.cuve).toEqual({ nodes: [], loopTo: 0 });
    expect(merged.grafcet.feux).toEqual(base.grafcet.feux);
    expect(merged.ladder.cuve).toEqual(base.ladder.cuve);
    expect(merged.blocks.cuve).toEqual(base.blocks.cuve);
  });

  it('sanitizeBlocks : when non-tableau enveloppe, then vide par defaut', () => {
    const brut = JSON.stringify({
      blocks: { cuve: { rules: [{ when: { type: 'var', varId: 'X', negated: false } }, { when: [], then: 'pas un tableau' }] } },
    });
    const merged = mergeStored(brut, blankMap());
    const rules = (merged.blocks.cuve as { rules: { when: unknown[]; then: unknown[] }[] }).rules;
    expect(rules[0].when).toEqual([{ type: 'var', varId: 'X', negated: false }]);
    expect(rules[1].then).toEqual([]);
  });

  it('merge ne mute pas la carte de base', () => {
    const base = blankMap();
    const avant = JSON.stringify(base);
    mergeStored(JSON.stringify({ grafcet: { feux: { nodes: [], loopTo: 0 } } }), base);
    expect(JSON.stringify(base)).toBe(avant);
  });

  it('un ProgramsMap serialise reste chargeable tel quel (compatibilite v3)', () => {
    const map: ProgramsMap = blankMap();
    map.ladder.ecluse = { rungs: [], timers: [], counters: [] };
    expect(mergeStored(serialize(map), blankMap())).toEqual(map);
  });
});
