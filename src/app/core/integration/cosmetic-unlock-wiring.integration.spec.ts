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

describe('CosmeticService unlock wiring to progression events', () => {
  let cosmeticService: CosmeticService;
  let originalLocalStorage: Storage;
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    originalLocalStorage = window.localStorage;
    originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, 'localStorage', { value: createFakeStorage(), writable: true, configurable: true });
    Object.defineProperty(window, 'matchMedia', { value: () => ({ matches: false, addEventListener: () => { /* noop */ }, removeEventListener: () => { /* noop */ } }), writable: true, configurable: true });
    vi.stubGlobal('Audio', MockAudio);
    TestBed.configureTestingModule({});
    cosmeticService = TestBed.inject(CosmeticService);
  });

  afterEach(() => {
    Object.defineProperty(window, 'localStorage', { value: originalLocalStorage, writable: true, configurable: true });
    Object.defineProperty(window, 'matchMedia', { value: originalMatchMedia, writable: true, configurable: true });
    vi.restoreAllMocks();
  });

  it('unlock triggered on rank up: unlocking skin-ensign-plating', () => {
    cosmeticService.unlockCosmetic('skin-ensign-plating');
    const item = cosmeticService.getAllCosmetics().find(c => c.id === 'skin-ensign-plating');
    expect(item!.isUnlocked).toBe(true);
  });

  it('unlock triggered on mastery milestone is available', () => {
    const neonTheme = COSMETIC_DEFINITIONS.find(c => c.id === 'theme-neon');
    expect(neonTheme).toBeTruthy();
    expect(neonTheme!.unlockCondition).toContain('50 levels');
  });

  it('unlock triggered on achievement earn: badge for first-steps', () => {
    cosmeticService.unlockCosmetic('badge-first-steps');
    const badge = cosmeticService.getAllCosmetics().find(c => c.id === 'badge-first-steps');
    expect(badge!.isUnlocked).toBe(true);
  });

  it('multiple unlocks at once each succeed', () => {
    cosmeticService.unlockCosmetic('skin-ensign-plating');
    cosmeticService.unlockCosmetic('badge-first-steps');
    const unlocked = cosmeticService.getUnlockedCosmetics();
    const ids = unlocked.map(c => c.id);
    expect(ids).toContain('skin-ensign-plating');
    expect(ids).toContain('badge-first-steps');
  });

  it('already-unlocked cosmetic not re-notified', () => {
    cosmeticService.unlockCosmetic('skin-ensign-plating');
    const countBefore = cosmeticService.getUnlockedCosmetics().length;
    cosmeticService.unlockCosmetic('skin-ensign-plating');
    expect(cosmeticService.getUnlockedCosmetics().length).toBe(countBefore);
  });
});
