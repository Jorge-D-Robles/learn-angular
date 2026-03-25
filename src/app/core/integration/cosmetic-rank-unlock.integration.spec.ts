import { TestBed } from '@angular/core/testing';
import { CosmeticService } from '../progression/cosmetic.service';
import { COSMETIC_DEFINITIONS } from '../../data/cosmetics.data';

class MockAudio {
  src = ''; preload = ''; volume = 1;
  cloneNode(): MockAudio { return new MockAudio(); }
  play(): Promise<void> { return Promise.resolve(); }
}

function createFakeStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => { store.delete(key); },
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() { return store.size; },
  } as Storage;
}

describe('CosmeticService unlock evaluation on rank milestone', () => {
  let cosmeticService: CosmeticService;
  let originalLocalStorage: Storage;
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    originalLocalStorage = window.localStorage;
    originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, 'localStorage', { value: createFakeStorage(), writable: true, configurable: true });
    Object.defineProperty(window, 'matchMedia', { value: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }), writable: true, configurable: true });
    vi.stubGlobal('Audio', MockAudio);
    TestBed.configureTestingModule({});
    cosmeticService = TestBed.inject(CosmeticService);
  });

  afterEach(() => {
    Object.defineProperty(window, 'localStorage', { value: originalLocalStorage, writable: true, configurable: true });
    Object.defineProperty(window, 'matchMedia', { value: originalMatchMedia, writable: true, configurable: true });
    vi.restoreAllMocks();
  });

  it('Ensign-tier cosmetic is locked at start', () => {
    const ensignSkin = cosmeticService.getAllCosmetics().find(c => c.id === 'skin-ensign-plating');
    expect(ensignSkin).toBeTruthy();
    expect(ensignSkin!.isUnlocked).toBe(false);
  });

  it('unlocking skin-ensign-plating after explicit unlock call', () => {
    cosmeticService.unlockCosmetic('skin-ensign-plating');
    const ensignSkin = cosmeticService.getAllCosmetics().find(c => c.id === 'skin-ensign-plating');
    expect(ensignSkin!.isUnlocked).toBe(true);
  });

  it('Commander-tier cosmetic is locked initially', () => {
    const cmdSkin = cosmeticService.getAllCosmetics().find(c => c.id === 'skin-commander-hull');
    expect(cmdSkin!.isUnlocked).toBe(false);
  });

  it('already-unlocked cosmetic is not re-unlocked', () => {
    cosmeticService.unlockCosmetic('skin-ensign-plating');
    const before = cosmeticService.getUnlockedCosmetics().length;
    cosmeticService.unlockCosmetic('skin-ensign-plating');
    expect(cosmeticService.getUnlockedCosmetics().length).toBe(before);
  });

  it('skin definitions match expected rank-based unlock conditions', () => {
    const skins = COSMETIC_DEFINITIONS.filter(c => c.type === 'skin');
    expect(skins.length).toBeGreaterThanOrEqual(4);
    expect(skins[0].unlockCondition).toContain('Ensign');
    expect(skins[1].unlockCondition).toContain('Commander');
  });
});
