// ---------------------------------------------------------------------------
// Cosmetic items content definitions (pure data -- no executable conditions)
// ---------------------------------------------------------------------------

export type CosmeticType = 'skin' | 'theme' | 'badge';

export interface CosmeticDefinition {
  readonly id: string;
  readonly name: string;
  readonly type: CosmeticType;
  readonly description: string;
  readonly unlockCondition: string;
  readonly previewImagePath?: string;
}

// ---------------------------------------------------------------------------
// All 13 cosmetic definitions
// ---------------------------------------------------------------------------

export const COSMETIC_DEFINITIONS: readonly CosmeticDefinition[] = [
  // =========================================================================
  // STATION SKINS (4) — unlocked at rank milestones
  // =========================================================================
  {
    id: 'skin-ensign-plating',
    name: 'Ensign Plating',
    type: 'skin',
    description: 'Standard-issue hull plating awarded to new Ensigns',
    unlockCondition: 'Reach rank: Ensign',
  },
  {
    id: 'skin-commander-hull',
    name: 'Commander Hull',
    type: 'skin',
    description: 'Reinforced hull with command-grade markings',
    unlockCondition: 'Reach rank: Commander',
  },
  {
    id: 'skin-captain-armor',
    name: "Captain's Armor",
    type: 'skin',
    description: 'Heavy armored plating reserved for station captains',
    unlockCondition: 'Reach rank: Captain',
  },
  {
    id: 'skin-admiral-chrome',
    name: 'Admiral Chrome',
    type: 'skin',
    description: 'Polished chrome finish signifying Admiral status',
    unlockCondition: 'Reach rank: Admiral',
  },

  // =========================================================================
  // UI THEMES (5) — 3 defaults + 2 unlockable
  // =========================================================================
  {
    id: 'theme-dark',
    name: 'Deep Space',
    type: 'theme',
    description: 'Dark theme inspired by the void between stars',
    unlockCondition: 'none',
  },
  {
    id: 'theme-station',
    name: 'Station Standard',
    type: 'theme',
    description: 'Default Nexus Station interface colors',
    unlockCondition: 'none',
  },
  {
    id: 'theme-light',
    name: 'Daylight',
    type: 'theme',
    description: 'Bright theme for well-lit environments',
    unlockCondition: 'none',
  },
  {
    id: 'theme-neon',
    name: 'Neon Pulse',
    type: 'theme',
    description: 'Vibrant neon accents for the cyberpunk at heart',
    unlockCondition: 'Complete 50 levels total',
  },
  {
    id: 'theme-gold',
    name: 'Golden Command',
    type: 'theme',
    description: 'Luxurious gold-trimmed interface for station commanders',
    unlockCondition: 'Reach rank: Station Commander',
  },

  // =========================================================================
  // ACHIEVEMENT BADGES (4) — tied to achievement IDs
  // =========================================================================
  {
    id: 'badge-first-steps',
    name: 'Pioneer',
    type: 'badge',
    description: 'Awarded for taking your first steps aboard Nexus Station',
    unlockCondition: 'Earn achievement: first-steps',
  },
  {
    id: 'badge-perfectionist',
    name: 'Precision',
    type: 'badge',
    description: 'Awarded for achieving a perfect score',
    unlockCondition: 'Earn achievement: perfectionist',
  },
  {
    id: 'badge-dedicated',
    name: 'Dedicated',
    type: 'badge',
    description: 'Awarded for maintaining a 7-day practice streak',
    unlockCondition: 'Earn achievement: dedicated',
  },
  {
    id: 'badge-legend',
    name: 'Legend',
    type: 'badge',
    description: 'The highest honor — awarded to Fleet Admirals',
    unlockCondition: 'Earn achievement: legend',
  },
];

// ---------------------------------------------------------------------------
// Convenience filtered views
// ---------------------------------------------------------------------------

export const SKIN_COSMETICS: readonly CosmeticDefinition[] =
  COSMETIC_DEFINITIONS.filter((c) => c.type === 'skin');

export const THEME_COSMETICS: readonly CosmeticDefinition[] =
  COSMETIC_DEFINITIONS.filter((c) => c.type === 'theme');

export const BADGE_COSMETICS: readonly CosmeticDefinition[] =
  COSMETIC_DEFINITIONS.filter((c) => c.type === 'badge');

export const DEFAULT_THEMES: readonly CosmeticDefinition[] =
  COSMETIC_DEFINITIONS.filter((c) => c.type === 'theme' && c.unlockCondition === 'none');
