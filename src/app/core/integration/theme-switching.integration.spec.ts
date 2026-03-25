import { TestBed } from '@angular/core/testing';
import { SettingsService, type Theme } from '../settings/settings.service';

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

const THEME_CLASSES = ['theme-dark', 'theme-station', 'theme-light'] as const;
const STORAGE_KEY = 'nexus-station:settings';

describe('Theme switching integration', () => {
  let service: SettingsService;
  let fakeStorage: Storage;
  let originalLocalStorage: Storage;
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    fakeStorage = createFakeStorage();
    originalLocalStorage = window.localStorage;
    originalMatchMedia = window.matchMedia;

    Object.defineProperty(window, 'localStorage', {
      value: fakeStorage,
      writable: true,
      configurable: true,
    });

    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn() }),
      writable: true,
      configurable: true,
    });

    document.body.classList.remove(...THEME_CLASSES);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    service = TestBed.inject(SettingsService);
    TestBed.flushEffects();
  });

  afterEach(() => {
    document.body.classList.remove(...THEME_CLASSES);

    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'matchMedia', {
      value: originalMatchMedia,
      writable: true,
      configurable: true,
    });
  });

  function themeClassesOnBody(): string[] {
    return Array.from(document.body.classList).filter((c) => c.startsWith('theme-'));
  }

  it('should apply theme-station class to body with default settings', () => {
    expect(document.body.classList.contains('theme-station')).toBe(true);
    expect(themeClassesOnBody()).toEqual(['theme-station']);
  });

  it('should apply theme-dark class and remove theme-station when switching to dark', () => {
    service.updateSetting('theme', 'dark');
    TestBed.flushEffects();

    expect(document.body.classList.contains('theme-dark')).toBe(true);
    expect(document.body.classList.contains('theme-station')).toBe(false);
    expect(themeClassesOnBody()).toEqual(['theme-dark']);
  });

  it('should apply theme-station class and remove theme-dark when switching to station', () => {
    service.updateSetting('theme', 'dark');
    TestBed.flushEffects();

    service.updateSetting('theme', 'station');
    TestBed.flushEffects();

    expect(document.body.classList.contains('theme-station')).toBe(true);
    expect(document.body.classList.contains('theme-dark')).toBe(false);
    expect(themeClassesOnBody()).toEqual(['theme-station']);
  });

  it('should apply theme-light class and remove previous theme when switching to light', () => {
    service.updateSetting('theme', 'light');
    TestBed.flushEffects();

    expect(document.body.classList.contains('theme-light')).toBe(true);
    expect(document.body.classList.contains('theme-station')).toBe(false);
    expect(themeClassesOnBody()).toEqual(['theme-light']);
  });

  it('should maintain exactly one theme class when cycling through all themes', () => {
    const themes: Theme[] = ['dark', 'light', 'station', 'dark', 'station', 'light'];

    for (const theme of themes) {
      service.updateSetting('theme', theme);
      TestBed.flushEffects();

      const classes = themeClassesOnBody();
      expect(classes).toEqual([`theme-${theme}`]);
    }
  });

  it('should persist theme and apply correct body class after simulated reload', () => {
    vi.useFakeTimers();

    // Set theme to light and let the debounced save fire
    service.updateSetting('theme', 'light');
    TestBed.flushEffects();
    vi.advanceTimersByTime(SettingsService.SAVE_DEBOUNCE_MS);

    // Verify it was persisted
    const saved = fakeStorage.getItem(STORAGE_KEY);
    expect(saved).not.toBeNull();
    expect(JSON.parse(saved!).theme).toBe('light');

    // Simulate reload: clean body classes and create fresh TestBed
    document.body.classList.remove(...THEME_CLASSES);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const reloadedService = TestBed.inject(SettingsService);
    TestBed.flushEffects();

    // Theme should be loaded from persistence
    expect(reloadedService.settings().theme).toBe('light');
    expect(document.body.classList.contains('theme-light')).toBe(true);
    expect(themeClassesOnBody()).toEqual(['theme-light']);

    vi.useRealTimers();
  });
});
