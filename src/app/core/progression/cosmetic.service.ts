import { inject, Injectable, signal } from '@angular/core';
import { StatePersistenceService } from '../persistence/state-persistence.service';
import {
  COSMETIC_DEFINITIONS,
  type CosmeticDefinition,
  type CosmeticType,
} from '../../data/cosmetics.data';

const COSMETICS_KEY = 'cosmetics';

/** A cosmetic item with runtime unlock/equip state. */
export interface CosmeticItem {
  readonly id: string;
  readonly name: string;
  readonly type: CosmeticType;
  readonly unlockCondition: string;
  readonly isUnlocked: boolean;
}

/** Serialized state for persistence. */
interface CosmeticSnapshot {
  readonly unlockedIds: string[];
  readonly equipped: Partial<Record<CosmeticType, string>>;
}

/** IDs of cosmetics that are unlocked by default (unlockCondition === 'none'). */
const DEFAULT_UNLOCKED_IDS: ReadonlySet<string> = new Set(
  COSMETIC_DEFINITIONS.filter((c) => c.unlockCondition === 'none').map((c) => c.id),
);

/** Valid cosmetic IDs for validation on load. */
const VALID_COSMETIC_IDS: ReadonlySet<string> = new Set(
  COSMETIC_DEFINITIONS.map((c) => c.id),
);

@Injectable({ providedIn: 'root' })
export class CosmeticService {
  private readonly _persistence = inject(StatePersistenceService);
  private readonly _unlockedIds = signal<ReadonlySet<string>>(new Set());
  private readonly _equipped = signal<Partial<Record<CosmeticType, string>>>({});

  constructor() {
    this._loadState();
  }

  /** Returns all cosmetic items that are currently unlocked. */
  getUnlockedCosmetics(): CosmeticItem[] {
    return this.getAllCosmetics().filter((c) => c.isUnlocked);
  }

  /** Returns all cosmetic items with their unlock state. */
  getAllCosmetics(): CosmeticItem[] {
    const unlocked = this._unlockedIds();
    return COSMETIC_DEFINITIONS.map((def) => this._toItem(def, unlocked));
  }

  /** Unlocks a cosmetic by its id. No-op if already unlocked or id is unknown. */
  unlockCosmetic(id: string): void {
    if (!VALID_COSMETIC_IDS.has(id)) {
      return;
    }
    this._unlockedIds.update((set) => {
      if (set.has(id)) {
        return set;
      }
      const next = new Set(set);
      next.add(id);
      return next;
    });
    this._saveState();
  }

  /**
   * Equips a cosmetic for its type slot.
   * Returns false if the cosmetic is locked or unknown.
   */
  equipCosmetic(id: string): boolean {
    if (!this._isUnlocked(id)) {
      return false;
    }
    const def = COSMETIC_DEFINITIONS.find((c) => c.id === id);
    if (!def) {
      return false;
    }
    this._equipped.update((map) => ({ ...map, [def.type]: id }));
    this._saveState();
    return true;
  }

  /** Returns the currently equipped cosmetic for the given type, or null. */
  getEquipped(type: CosmeticType): CosmeticItem | null {
    const id = this._equipped()[type];
    if (!id) {
      return null;
    }
    const def = COSMETIC_DEFINITIONS.find((c) => c.id === id);
    if (!def) {
      return null;
    }
    return this._toItem(def, this._unlockedIds());
  }

  /** Removes the equipped cosmetic for the given type. */
  unequipCosmetic(type: CosmeticType): void {
    this._equipped.update((map) => {
      const next = { ...map };
      delete next[type];
      return next;
    });
    this._saveState();
  }

  /** Clears all unlocked and equipped state. */
  resetCosmetics(): void {
    this._unlockedIds.set(new Set());
    this._equipped.set({});
    this._persistence.clear(COSMETICS_KEY);
  }

  // --- Private helpers ---

  private _isUnlocked(id: string): boolean {
    return DEFAULT_UNLOCKED_IDS.has(id) || this._unlockedIds().has(id);
  }

  private _toItem(
    def: CosmeticDefinition,
    unlocked: ReadonlySet<string>,
  ): CosmeticItem {
    return {
      id: def.id,
      name: def.name,
      type: def.type,
      unlockCondition: def.unlockCondition,
      isUnlocked: DEFAULT_UNLOCKED_IDS.has(def.id) || unlocked.has(def.id),
    };
  }

  private _saveState(): void {
    const snapshot: CosmeticSnapshot = {
      unlockedIds: [...this._unlockedIds()],
      equipped: this._equipped(),
    };
    this._persistence.save(COSMETICS_KEY, snapshot);
  }

  private _loadState(): void {
    const saved = this._persistence.load<CosmeticSnapshot>(COSMETICS_KEY);
    if (saved === null || typeof saved !== 'object' || Array.isArray(saved)) {
      return;
    }

    // Validate unlocked IDs
    if (Array.isArray(saved.unlockedIds)) {
      const validated = new Set<string>();
      for (const id of saved.unlockedIds) {
        if (typeof id === 'string' && VALID_COSMETIC_IDS.has(id)) {
          validated.add(id);
        }
      }
      this._unlockedIds.set(validated);
    }

    // Validate equipped
    if (saved.equipped && typeof saved.equipped === 'object') {
      const validated: Partial<Record<CosmeticType, string>> = {};
      for (const [type, id] of Object.entries(saved.equipped)) {
        if (
          typeof id === 'string' &&
          VALID_COSMETIC_IDS.has(id) &&
          ['skin', 'theme', 'badge'].includes(type)
        ) {
          validated[type as CosmeticType] = id;
        }
      }
      this._equipped.set(validated);
    }
  }
}
