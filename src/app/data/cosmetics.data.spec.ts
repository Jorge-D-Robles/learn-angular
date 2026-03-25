import {
  COSMETIC_DEFINITIONS,
  SKIN_COSMETICS,
  THEME_COSMETICS,
  BADGE_COSMETICS,
  DEFAULT_THEMES,
} from './cosmetics.data';
import type { CosmeticDefinition, CosmeticType } from './cosmetics.data';

// --- Compile-time type checks ---

const _type: CosmeticType = 'skin';

const _def: CosmeticDefinition = {
  id: 'test',
  name: 'Test',
  type: 'theme',
  description: 'A test cosmetic',
  unlockCondition: 'none',
};

void [_type, _def];

// --- Structural integrity tests ---

describe('COSMETIC_DEFINITIONS', () => {
  it('should have exactly 13 definitions', () => {
    expect(COSMETIC_DEFINITIONS.length).toBe(13);
  });

  it('should have at least 4 station skins', () => {
    const skins = COSMETIC_DEFINITIONS.filter((c) => c.type === 'skin');
    expect(skins.length).toBeGreaterThanOrEqual(4);
  });

  it('should have at least 5 UI themes', () => {
    const themes = COSMETIC_DEFINITIONS.filter((c) => c.type === 'theme');
    expect(themes.length).toBeGreaterThanOrEqual(5);
  });

  it('should have at least 4 achievement badges', () => {
    const badges = COSMETIC_DEFINITIONS.filter((c) => c.type === 'badge');
    expect(badges.length).toBeGreaterThanOrEqual(4);
  });

  it('should have unique IDs', () => {
    const ids = COSMETIC_DEFINITIONS.map((c) => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(COSMETIC_DEFINITIONS.length);
  });

  it('should have non-empty required fields on every entry', () => {
    for (const def of COSMETIC_DEFINITIONS) {
      expect(def.id.length).toBeGreaterThan(0);
      expect(def.name.length).toBeGreaterThan(0);
      expect(def.description.length).toBeGreaterThan(0);
      expect(def.unlockCondition.length).toBeGreaterThan(0);
    }
  });

  it('should only use valid type values', () => {
    const validTypes: ReadonlySet<CosmeticType> = new Set(['skin', 'theme', 'badge']);
    for (const def of COSMETIC_DEFINITIONS) {
      expect(validTypes.has(def.type)).toBe(true);
    }
  });

  it('should have all 3 cosmetic types represented', () => {
    const types = new Set(COSMETIC_DEFINITIONS.map((c) => c.type));
    expect(types.has('skin')).toBe(true);
    expect(types.has('theme')).toBe(true);
    expect(types.has('badge')).toBe(true);
  });

  it('should have previewImagePath as optional (string or undefined)', () => {
    for (const def of COSMETIC_DEFINITIONS) {
      if (def.previewImagePath !== undefined) {
        expect(typeof def.previewImagePath).toBe('string');
        expect(def.previewImagePath.length).toBeGreaterThan(0);
      }
    }
  });
});

// --- Unlock condition tests ---

describe('unlock conditions', () => {
  it('should have default themes with unlockCondition "none"', () => {
    const defaults = COSMETIC_DEFINITIONS.filter(
      (c) => c.type === 'theme' && c.unlockCondition === 'none',
    );
    expect(defaults.length).toBeGreaterThanOrEqual(3);
  });

  it('should have all non-default items with meaningful unlock conditions', () => {
    const nonDefaults = COSMETIC_DEFINITIONS.filter((c) => c.unlockCondition !== 'none');
    expect(nonDefaults.length).toBeGreaterThanOrEqual(10);
    for (const def of nonDefaults) {
      expect(def.unlockCondition.trim().length).toBeGreaterThan(0);
      expect(def.unlockCondition).not.toBe('none');
    }
  });

  it('should have skins unlocked at rank milestones', () => {
    const skins = COSMETIC_DEFINITIONS.filter((c) => c.type === 'skin');
    for (const skin of skins) {
      expect(skin.unlockCondition).toContain('rank');
    }
  });

  it('should have badges tied to achievements', () => {
    const badges = COSMETIC_DEFINITIONS.filter((c) => c.type === 'badge');
    for (const badge of badges) {
      expect(badge.unlockCondition).toContain('achievement');
    }
  });
});

// --- Convenience export tests ---

describe('SKIN_COSMETICS', () => {
  it('should have at least 4 entries', () => {
    expect(SKIN_COSMETICS.length).toBeGreaterThanOrEqual(4);
  });

  it('should all have type skin', () => {
    for (const def of SKIN_COSMETICS) {
      expect(def.type).toBe('skin');
    }
  });
});

describe('THEME_COSMETICS', () => {
  it('should have at least 5 entries', () => {
    expect(THEME_COSMETICS.length).toBeGreaterThanOrEqual(5);
  });

  it('should all have type theme', () => {
    for (const def of THEME_COSMETICS) {
      expect(def.type).toBe('theme');
    }
  });
});

describe('BADGE_COSMETICS', () => {
  it('should have at least 4 entries', () => {
    expect(BADGE_COSMETICS.length).toBeGreaterThanOrEqual(4);
  });

  it('should all have type badge', () => {
    for (const def of BADGE_COSMETICS) {
      expect(def.type).toBe('badge');
    }
  });
});

describe('DEFAULT_THEMES', () => {
  it('should have exactly 3 default themes', () => {
    expect(DEFAULT_THEMES.length).toBe(3);
  });

  it('should all have unlockCondition none', () => {
    for (const def of DEFAULT_THEMES) {
      expect(def.unlockCondition).toBe('none');
    }
  });
});

// --- Specific content spot-checks ---

describe('cosmetic spot-checks', () => {
  it('should include skin-ensign-plating with correct properties', () => {
    const skin = COSMETIC_DEFINITIONS.find((c) => c.id === 'skin-ensign-plating');
    expect(skin).toBeDefined();
    expect(skin!.name).toBe('Ensign Plating');
    expect(skin!.type).toBe('skin');
  });

  it('should include theme-dark as a default theme', () => {
    const theme = COSMETIC_DEFINITIONS.find((c) => c.id === 'theme-dark');
    expect(theme).toBeDefined();
    expect(theme!.unlockCondition).toBe('none');
    expect(theme!.type).toBe('theme');
  });

  it('should include theme-neon as an unlockable theme', () => {
    const theme = COSMETIC_DEFINITIONS.find((c) => c.id === 'theme-neon');
    expect(theme).toBeDefined();
    expect(theme!.unlockCondition).not.toBe('none');
    expect(theme!.type).toBe('theme');
  });

  it('should include badge-legend tied to an achievement', () => {
    const badge = COSMETIC_DEFINITIONS.find((c) => c.id === 'badge-legend');
    expect(badge).toBeDefined();
    expect(badge!.type).toBe('badge');
    expect(badge!.unlockCondition).toContain('achievement');
  });

  it('should include skin-admiral-chrome for Admiral rank', () => {
    const skin = COSMETIC_DEFINITIONS.find((c) => c.id === 'skin-admiral-chrome');
    expect(skin).toBeDefined();
    expect(skin!.unlockCondition).toContain('Admiral');
  });
});
