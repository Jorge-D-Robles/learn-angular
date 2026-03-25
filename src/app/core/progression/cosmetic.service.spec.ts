import { TestBed } from '@angular/core/testing';
import { CosmeticService, type CosmeticItem } from './cosmetic.service';
import { StatePersistenceService } from '../persistence/state-persistence.service';
import type { CosmeticType } from '../../data/cosmetics.data';

function createFakeStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  } as Storage;
}

describe('CosmeticService', () => {
  let service: CosmeticService;
  let persistence: StatePersistenceService;
  let fakeStorage: Storage;
  let originalLocalStorage: Storage;

  beforeEach(() => {
    fakeStorage = createFakeStorage();
    originalLocalStorage = window.localStorage;
    Object.defineProperty(window, 'localStorage', {
      value: fakeStorage,
      writable: true,
      configurable: true,
    });

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    service = TestBed.inject(CosmeticService);
    persistence = TestBed.inject(StatePersistenceService);
  });

  afterEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
  });

  // --- Creation ---

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // --- CosmeticItem interface ---

  it('should export CosmeticItem interface (compile-time check)', () => {
    const item: CosmeticItem = {
      id: 'test',
      name: 'Test',
      type: 'skin',
      unlockCondition: 'none',
      isUnlocked: false,
    };
    expect(item).toBeTruthy();
  });

  // --- getUnlockedCosmetics ---

  describe('getUnlockedCosmetics', () => {
    it('should return default themes as unlocked initially', () => {
      const unlocked = service.getUnlockedCosmetics();
      const themes = unlocked.filter((c) => c.type === 'theme');
      expect(themes.length).toBeGreaterThanOrEqual(3);
      for (const t of themes) {
        expect(t.isUnlocked).toBe(true);
      }
    });

    it('should not return rank-locked skins as unlocked initially', () => {
      const unlocked = service.getUnlockedCosmetics();
      const skins = unlocked.filter((c) => c.type === 'skin');
      expect(skins.length).toBe(0);
    });

    it('should include manually unlocked cosmetics', () => {
      service.unlockCosmetic('skin-ensign-plating');
      const unlocked = service.getUnlockedCosmetics();
      const skin = unlocked.find((c) => c.id === 'skin-ensign-plating');
      expect(skin).toBeDefined();
      expect(skin!.isUnlocked).toBe(true);
    });
  });

  // --- getAllCosmetics ---

  describe('getAllCosmetics', () => {
    it('should return all cosmetic items', () => {
      const all = service.getAllCosmetics();
      expect(all.length).toBe(13);
    });

    it('should mark default themes as unlocked', () => {
      const all = service.getAllCosmetics();
      const darkTheme = all.find((c) => c.id === 'theme-dark');
      expect(darkTheme).toBeDefined();
      expect(darkTheme!.isUnlocked).toBe(true);
    });

    it('should mark locked items as not unlocked', () => {
      const all = service.getAllCosmetics();
      const skin = all.find((c) => c.id === 'skin-admiral-chrome');
      expect(skin).toBeDefined();
      expect(skin!.isUnlocked).toBe(false);
    });
  });

  // --- unlockCosmetic ---

  describe('unlockCosmetic', () => {
    it('should unlock a cosmetic by id', () => {
      service.unlockCosmetic('skin-ensign-plating');
      const all = service.getAllCosmetics();
      const skin = all.find((c) => c.id === 'skin-ensign-plating');
      expect(skin!.isUnlocked).toBe(true);
    });

    it('should be idempotent (unlocking twice does not error)', () => {
      service.unlockCosmetic('skin-ensign-plating');
      service.unlockCosmetic('skin-ensign-plating');
      const unlocked = service.getUnlockedCosmetics();
      const skins = unlocked.filter((c) => c.id === 'skin-ensign-plating');
      expect(skins.length).toBe(1);
    });

    it('should ignore unknown cosmetic ids', () => {
      expect(() => service.unlockCosmetic('unknown-id')).not.toThrow();
    });
  });

  // --- equipCosmetic / getEquipped ---

  describe('equipCosmetic', () => {
    it('should equip an unlocked cosmetic', () => {
      service.unlockCosmetic('skin-ensign-plating');
      service.equipCosmetic('skin-ensign-plating');
      const equipped = service.getEquipped('skin');
      expect(equipped).toBeDefined();
      expect(equipped!.id).toBe('skin-ensign-plating');
    });

    it('should not equip a locked cosmetic', () => {
      const result = service.equipCosmetic('skin-ensign-plating');
      expect(result).toBe(false);
      const equipped = service.getEquipped('skin');
      expect(equipped).toBeNull();
    });

    it('should return true when equipping an unlocked cosmetic', () => {
      service.unlockCosmetic('skin-ensign-plating');
      const result = service.equipCosmetic('skin-ensign-plating');
      expect(result).toBe(true);
    });

    it('should replace the previously equipped cosmetic of the same type', () => {
      service.unlockCosmetic('skin-ensign-plating');
      service.unlockCosmetic('skin-commander-hull');
      service.equipCosmetic('skin-ensign-plating');
      service.equipCosmetic('skin-commander-hull');
      const equipped = service.getEquipped('skin');
      expect(equipped!.id).toBe('skin-commander-hull');
    });

    it('should allow equipping default themes', () => {
      service.equipCosmetic('theme-dark');
      const equipped = service.getEquipped('theme');
      expect(equipped!.id).toBe('theme-dark');
    });
  });

  // --- getEquipped ---

  describe('getEquipped', () => {
    it('should return null when nothing equipped for a type', () => {
      expect(service.getEquipped('skin')).toBeNull();
      expect(service.getEquipped('badge')).toBeNull();
    });

    it('should return the equipped item for a type', () => {
      service.equipCosmetic('theme-station');
      const equipped = service.getEquipped('theme');
      expect(equipped).not.toBeNull();
      expect(equipped!.id).toBe('theme-station');
    });

    it('should isolate equipped items by type', () => {
      service.unlockCosmetic('skin-ensign-plating');
      service.equipCosmetic('skin-ensign-plating');
      service.equipCosmetic('theme-dark');
      expect(service.getEquipped('skin')!.id).toBe('skin-ensign-plating');
      expect(service.getEquipped('theme')!.id).toBe('theme-dark');
    });
  });

  // --- unequipCosmetic ---

  describe('unequipCosmetic', () => {
    it('should unequip a cosmetic type', () => {
      service.equipCosmetic('theme-dark');
      service.unequipCosmetic('theme');
      expect(service.getEquipped('theme')).toBeNull();
    });

    it('should be safe to unequip when nothing is equipped', () => {
      expect(() => service.unequipCosmetic('skin')).not.toThrow();
    });
  });

  // --- Persistence ---

  describe('persistence', () => {
    it('should persist unlocked cosmetics', () => {
      service.unlockCosmetic('skin-ensign-plating');
      service.unlockCosmetic('badge-first-steps');

      // Verify through a fresh service via TestBed (storage persists)
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const freshService = TestBed.inject(CosmeticService);
      const unlocked = freshService.getUnlockedCosmetics();
      const ids = unlocked.map((c) => c.id);
      expect(ids).toContain('skin-ensign-plating');
      expect(ids).toContain('badge-first-steps');
    });

    it('should persist equipped cosmetics', () => {
      service.unlockCosmetic('skin-ensign-plating');
      service.equipCosmetic('skin-ensign-plating');
      service.equipCosmetic('theme-dark');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const freshService = TestBed.inject(CosmeticService);
      expect(freshService.getEquipped('skin')?.id).toBe('skin-ensign-plating');
      expect(freshService.getEquipped('theme')?.id).toBe('theme-dark');
    });
  });

  // --- resetCosmetics ---

  describe('resetCosmetics', () => {
    it('should clear all unlocked and equipped cosmetics', () => {
      service.unlockCosmetic('skin-ensign-plating');
      service.equipCosmetic('theme-dark');
      service.resetCosmetics();

      const unlocked = service.getUnlockedCosmetics();
      const skins = unlocked.filter((c) => c.type === 'skin');
      expect(skins.length).toBe(0);
      expect(service.getEquipped('skin')).toBeNull();
      expect(service.getEquipped('theme')).toBeNull();
    });
  });
});
