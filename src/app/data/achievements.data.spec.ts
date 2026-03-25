import {
  ACHIEVEMENT_DEFINITIONS,
  DISCOVERY_ACHIEVEMENTS,
  MASTERY_ACHIEVEMENTS,
  COMMITMENT_ACHIEVEMENTS,
  HIDDEN_ACHIEVEMENTS,
} from './achievements.data';
import type { AchievementDefinition, AchievementType } from './achievements.data';

// --- Compile-time type checks ---

const _type: AchievementType = 'discovery';

const _def: AchievementDefinition = {
  id: 'test',
  title: 'Test',
  description: 'A test achievement',
  type: 'mastery',
  isHidden: false,
  evaluationCriteria: 'Some criteria',
};

void [_type, _def];

// --- Structural integrity tests ---

describe('ACHIEVEMENT_DEFINITIONS', () => {
  it('should have at least 15 total definitions', () => {
    expect(ACHIEVEMENT_DEFINITIONS.length).toBeGreaterThanOrEqual(15);
  });

  it('should have exactly 16 definitions', () => {
    expect(ACHIEVEMENT_DEFINITIONS.length).toBe(16);
  });

  it('should have at least 5 discovery achievements', () => {
    const discovery = ACHIEVEMENT_DEFINITIONS.filter((a) => a.type === 'discovery');
    expect(discovery.length).toBeGreaterThanOrEqual(5);
  });

  it('should have at least 5 mastery achievements', () => {
    const mastery = ACHIEVEMENT_DEFINITIONS.filter((a) => a.type === 'mastery');
    expect(mastery.length).toBeGreaterThanOrEqual(5);
  });

  it('should have at least 5 commitment achievements', () => {
    const commitment = ACHIEVEMENT_DEFINITIONS.filter((a) => a.type === 'commitment');
    expect(commitment.length).toBeGreaterThanOrEqual(5);
  });

  it('should have at least 3 hidden achievements', () => {
    const hidden = ACHIEVEMENT_DEFINITIONS.filter((a) => a.isHidden);
    expect(hidden.length).toBeGreaterThanOrEqual(3);
  });

  it('should have unique IDs', () => {
    const ids = ACHIEVEMENT_DEFINITIONS.map((a) => a.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ACHIEVEMENT_DEFINITIONS.length);
  });

  it('should have non-empty required fields on every entry', () => {
    for (const def of ACHIEVEMENT_DEFINITIONS) {
      expect(def.id.length).toBeGreaterThan(0);
      expect(def.title.length).toBeGreaterThan(0);
      expect(def.description.length).toBeGreaterThan(0);
      expect(def.evaluationCriteria.length).toBeGreaterThan(0);
    }
  });

  it('should only use valid type values', () => {
    const validTypes: ReadonlySet<AchievementType> = new Set(['discovery', 'mastery', 'commitment']);
    for (const def of ACHIEVEMENT_DEFINITIONS) {
      expect(validTypes.has(def.type)).toBe(true);
    }
  });
});

// --- Convenience export tests ---

describe('DISCOVERY_ACHIEVEMENTS', () => {
  it('should have at least 5 entries', () => {
    expect(DISCOVERY_ACHIEVEMENTS.length).toBeGreaterThanOrEqual(5);
  });

  it('should all have type discovery', () => {
    for (const def of DISCOVERY_ACHIEVEMENTS) {
      expect(def.type).toBe('discovery');
    }
  });
});

describe('MASTERY_ACHIEVEMENTS', () => {
  it('should have at least 5 entries', () => {
    expect(MASTERY_ACHIEVEMENTS.length).toBeGreaterThanOrEqual(5);
  });

  it('should all have type mastery', () => {
    for (const def of MASTERY_ACHIEVEMENTS) {
      expect(def.type).toBe('mastery');
    }
  });
});

describe('COMMITMENT_ACHIEVEMENTS', () => {
  it('should have at least 5 entries', () => {
    expect(COMMITMENT_ACHIEVEMENTS.length).toBeGreaterThanOrEqual(5);
  });

  it('should all have type commitment', () => {
    for (const def of COMMITMENT_ACHIEVEMENTS) {
      expect(def.type).toBe('commitment');
    }
  });
});

describe('HIDDEN_ACHIEVEMENTS', () => {
  it('should have at least 3 entries', () => {
    expect(HIDDEN_ACHIEVEMENTS.length).toBeGreaterThanOrEqual(3);
  });

  it('should all have isHidden true', () => {
    for (const def of HIDDEN_ACHIEVEMENTS) {
      expect(def.isHidden).toBe(true);
    }
  });
});

// --- Specific content spot-checks ---

describe('achievement spot-checks', () => {
  it('should include first-steps with correct properties', () => {
    const firstSteps = ACHIEVEMENT_DEFINITIONS.find((a) => a.id === 'first-steps');
    expect(firstSteps).toBeDefined();
    expect(firstSteps!.title).toBe('First Steps');
    expect(firstSteps!.type).toBe('discovery');
    expect(firstSteps!.isHidden).toBe(false);
  });

  it('should include legend as a hidden achievement', () => {
    const legend = ACHIEVEMENT_DEFINITIONS.find((a) => a.id === 'legend');
    expect(legend).toBeDefined();
    expect(legend!.isHidden).toBe(true);
    expect(legend!.type).toBe('commitment');
  });

  it('should have non-empty evaluationCriteria on every entry', () => {
    for (const def of ACHIEVEMENT_DEFINITIONS) {
      expect(typeof def.evaluationCriteria).toBe('string');
      expect(def.evaluationCriteria.trim().length).toBeGreaterThan(0);
    }
  });
});
