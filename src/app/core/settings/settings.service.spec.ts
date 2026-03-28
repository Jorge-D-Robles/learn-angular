import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { SettingsService, UserSettings } from './settings.service';
import { StatePersistenceService } from '../persistence/state-persistence.service';

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

describe('SettingsService', () => {
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

    // Default: prefers-reduced-motion not set
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn() }),
      writable: true,
      configurable: true,
    });

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    service = TestBed.inject(SettingsService);
  });

  afterEach(() => {
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

  // --- Initialization: defaults ---

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should default soundEnabled to true', () => {
    expect(service.settings().soundEnabled).toBe(true);
  });

  it('should default animationSpeed to normal', () => {
    expect(service.settings().animationSpeed).toBe('normal');
  });

  it('should default theme to station', () => {
    expect(service.settings().theme).toBe('station');
  });

  it('should default reducedMotion to false when prefers-reduced-motion is not set', () => {
    expect(service.settings().reducedMotion).toBe(false);
  });

  it('should default reducedMotion to true when prefers-reduced-motion is set', () => {
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn() }),
      writable: true,
      configurable: true,
    });

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const svc = TestBed.inject(SettingsService);

    expect(svc.settings().reducedMotion).toBe(true);
  });

  // --- updateSetting ---

  it('should update soundEnabled when updateSetting is called', () => {
    service.updateSetting('soundEnabled', false);
    expect(service.settings().soundEnabled).toBe(false);
  });

  it('should update animationSpeed', () => {
    service.updateSetting('animationSpeed', 'fast');
    expect(service.settings().animationSpeed).toBe('fast');
  });

  it('should update theme', () => {
    service.updateSetting('theme', 'dark');
    expect(service.settings().theme).toBe('dark');
  });

  it('should update reducedMotion', () => {
    service.updateSetting('reducedMotion', true);
    expect(service.settings().reducedMotion).toBe(true);
  });

  it('should not modify other settings when updating one', () => {
    service.updateSetting('soundEnabled', false);
    expect(service.settings().animationSpeed).toBe('normal');
    expect(service.settings().theme).toBe('station');
    expect(service.settings().reducedMotion).toBe(false);
  });

  // --- resetSettings ---

  it('should restore all settings to defaults', () => {
    service.updateSetting('soundEnabled', false);
    service.updateSetting('animationSpeed', 'off');
    service.updateSetting('theme', 'dark');
    service.updateSetting('reducedMotion', true);

    service.resetSettings();

    expect(service.settings().soundEnabled).toBe(true);
    expect(service.settings().animationSpeed).toBe('normal');
    expect(service.settings().theme).toBe('station');
    // reducedMotion default depends on matchMedia (mocked to false)
    expect(service.settings().reducedMotion).toBe(false);
  });

  it('should read prefers-reduced-motion on reset', () => {
    // Change reducedMotion to false explicitly
    service.updateSetting('reducedMotion', false);

    // Now mock matchMedia to return true
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn() }),
      writable: true,
      configurable: true,
    });

    service.resetSettings();

    expect(service.settings().reducedMotion).toBe(true);
  });

  // --- Persistence: auto-save ---

  describe('persistence', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    function seedSettings(settings: Partial<UserSettings>): void {
      const full: UserSettings = {
        soundEnabled: true,
        animationSpeed: 'normal',
        theme: 'station',
        reducedMotion: false,
        ...settings,
      };
      fakeStorage.setItem('nexus-station:settings', JSON.stringify(full));
    }

    it('should auto-save settings after debounce delay', () => {
      vi.useFakeTimers();
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const svc = TestBed.inject(SettingsService);
      vi.clearAllTimers();

      svc.updateSetting('soundEnabled', false);
      TestBed.flushEffects();

      // Debounce pending -- not saved yet
      const before = fakeStorage.getItem('nexus-station:settings');
      expect(before).toBeNull();

      vi.advanceTimersByTime(500);

      const after = fakeStorage.getItem('nexus-station:settings');
      expect(after).not.toBeNull();
      const parsed = JSON.parse(after!);
      expect(parsed.soundEnabled).toBe(false);
    });

    it('should debounce rapid changes into a single save', () => {
      vi.useFakeTimers();
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const persistence = TestBed.inject(StatePersistenceService);
      const saveSpy = vi.spyOn(persistence, 'save');
      const svc = TestBed.inject(SettingsService);
      vi.clearAllTimers();
      saveSpy.mockClear();

      svc.updateSetting('soundEnabled', false);
      TestBed.flushEffects();
      svc.updateSetting('animationSpeed', 'fast');
      TestBed.flushEffects();
      svc.updateSetting('theme', 'dark');
      TestBed.flushEffects();

      vi.advanceTimersByTime(500);

      expect(saveSpy).toHaveBeenCalledTimes(1);
    });

    // --- Persistence: load on init ---

    it('should load saved settings from localStorage on initialization', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      seedSettings({ soundEnabled: false, animationSpeed: 'fast', theme: 'dark', reducedMotion: true });
      const svc = TestBed.inject(SettingsService);

      expect(svc.settings().soundEnabled).toBe(false);
      expect(svc.settings().animationSpeed).toBe('fast');
      expect(svc.settings().theme).toBe('dark');
      expect(svc.settings().reducedMotion).toBe(true);
    });

    it('should use defaults for missing fields in saved data', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      fakeStorage.setItem('nexus-station:settings', JSON.stringify({ soundEnabled: false }));
      const svc = TestBed.inject(SettingsService);

      expect(svc.settings().soundEnabled).toBe(false);
      expect(svc.settings().animationSpeed).toBe('normal');
      expect(svc.settings().theme).toBe('station');
      expect(svc.settings().reducedMotion).toBe(false);
    });

    it('should use defaults when saved data is corrupted', () => {
      fakeStorage.setItem('nexus-station:settings', '{invalid json');
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const svc = TestBed.inject(SettingsService);

      expect(svc.settings().soundEnabled).toBe(true);
      expect(svc.settings().animationSpeed).toBe('normal');
      expect(svc.settings().theme).toBe('station');
      expect(svc.settings().reducedMotion).toBe(false);
      warnSpy.mockRestore();
    });
  });

  // --- resetProgress ---

  describe('resetProgress', () => {
    it('should call StatePersistenceService.clearAll()', () => {
      const fakeDoc = { location: { reload: vi.fn() } };
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [{ provide: DOCUMENT, useValue: fakeDoc }],
      });
      const svc = TestBed.inject(SettingsService);
      const persistence = TestBed.inject(StatePersistenceService);
      const spy = vi.spyOn(persistence, 'clearAll');

      svc.resetProgress();

      expect(spy).toHaveBeenCalled();
    });

    it('should call location.reload()', () => {
      const fakeDoc = { location: { reload: vi.fn() } };
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [{ provide: DOCUMENT, useValue: fakeDoc }],
      });
      const svc = TestBed.inject(SettingsService);

      svc.resetProgress();

      expect(fakeDoc.location.reload).toHaveBeenCalled();
    });
  });

  // --- Theme body class ---

  describe('theme body class', () => {
    afterEach(() => {
      document.body.classList.remove('theme-dark', 'theme-station', 'theme-light');
    });

    it('should apply theme-station class to body on construction with default settings', () => {
      TestBed.flushEffects();
      expect(document.body.classList.contains('theme-station')).toBe(true);
    });

    it('should apply theme-dark class when theme changes to dark', () => {
      service.updateSetting('theme', 'dark');
      TestBed.flushEffects();
      expect(document.body.classList.contains('theme-dark')).toBe(true);
      expect(document.body.classList.contains('theme-station')).toBe(false);
    });

    it('should apply theme-light class when theme changes to light', () => {
      service.updateSetting('theme', 'light');
      TestBed.flushEffects();
      expect(document.body.classList.contains('theme-light')).toBe(true);
    });

    it('should have exactly one theme class at a time after multiple changes', () => {
      service.updateSetting('theme', 'dark');
      TestBed.flushEffects();
      service.updateSetting('theme', 'light');
      TestBed.flushEffects();
      service.updateSetting('theme', 'station');
      TestBed.flushEffects();

      const themeClasses = Array.from(document.body.classList).filter(c => c.startsWith('theme-'));
      expect(themeClasses).toEqual(['theme-station']);
    });

    it('should load theme from persistence and apply correct body class', () => {
      fakeStorage.setItem('nexus-station:settings', JSON.stringify({
        soundEnabled: true,
        animationSpeed: 'normal',
        theme: 'light',
        reducedMotion: false,
      }));

      // Clean previous theme classes
      document.body.classList.remove('theme-dark', 'theme-station', 'theme-light');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const svc = TestBed.inject(SettingsService);
      TestBed.flushEffects();

      expect(svc.settings().theme).toBe('light');
      expect(document.body.classList.contains('theme-light')).toBe(true);
    });

    it('should accept light as a valid theme value from persistence', () => {
      fakeStorage.setItem('nexus-station:settings', JSON.stringify({
        soundEnabled: true,
        animationSpeed: 'normal',
        theme: 'light',
        reducedMotion: false,
      }));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const svc = TestBed.inject(SettingsService);

      expect(svc.settings().theme).toBe('light');
    });

    it('should fall back to station when an invalid theme is persisted', () => {
      fakeStorage.setItem('nexus-station:settings', JSON.stringify({
        soundEnabled: true,
        animationSpeed: 'normal',
        theme: 'invalid',
        reducedMotion: false,
      }));

      // Clean previous theme classes
      document.body.classList.remove('theme-dark', 'theme-station', 'theme-light');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const svc = TestBed.inject(SettingsService);
      TestBed.flushEffects();

      expect(svc.settings().theme).toBe('station');
      expect(document.body.classList.contains('theme-station')).toBe(true);
    });
  });

  // --- Read-only enforcement ---

  it('should expose settings as read-only signal', () => {
    expect(() => (service.settings as unknown as { set: (v: object) => void }).set({})).toThrow();
  });
});
