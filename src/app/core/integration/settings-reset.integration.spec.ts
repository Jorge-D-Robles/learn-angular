import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { SettingsService } from '../settings';
import { StatePersistenceService } from '../persistence';

// --- Test helpers ---

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

function createFakeDocument() {
  return {
    location: { reload: vi.fn() },
    body: {
      classList: {
        remove: vi.fn(),
        add: vi.fn(),
        contains: vi.fn(),
      },
    },
  };
}

// --- Game state keys (matching nexus-station: prefix used by StatePersistenceService) ---

const GAME_KEYS = [
  'nexus-station:game-state',
  'nexus-station:mastery',
  'nexus-station:streak',
  'nexus-station:level-progression',
  'nexus-station:settings',
] as const;

const NON_PREFIXED_KEY = 'other-app:prefs';

function seedGameState(storage: Storage): void {
  storage.setItem('nexus-station:game-state', JSON.stringify({ xp: 1500, rank: 'Ensign' }));
  storage.setItem('nexus-station:mastery', JSON.stringify({ 'module-assembly': 3 }));
  storage.setItem('nexus-station:streak', JSON.stringify({ current: 5, lastDate: '2026-03-25' }));
  storage.setItem('nexus-station:level-progression', JSON.stringify({ 'ma-basic-01': { completed: true, bestScore: 100 } }));
  storage.setItem('nexus-station:settings', JSON.stringify({ theme: 'dark', soundEnabled: false }));
  storage.setItem(NON_PREFIXED_KEY, JSON.stringify({ darkMode: true }));
}

// --- Integration tests ---

describe('Settings reset integration', () => {
  let settingsService: SettingsService;
  let persistenceService: StatePersistenceService;
  let fakeStorage: Storage;
  let fakeDoc: ReturnType<typeof createFakeDocument>;
  let originalLocalStorage: Storage;

  beforeEach(() => {
    fakeStorage = createFakeStorage();
    fakeDoc = createFakeDocument();
    originalLocalStorage = window.localStorage;
    Object.defineProperty(window, 'localStorage', { value: fakeStorage, writable: true, configurable: true });

    seedGameState(fakeStorage);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        SettingsService,
        StatePersistenceService,
        { provide: DOCUMENT, useValue: fakeDoc },
      ],
    });

    settingsService = TestBed.inject(SettingsService);
    persistenceService = TestBed.inject(StatePersistenceService);
  });

  afterEach(() => {
    Object.defineProperty(window, 'localStorage', { value: originalLocalStorage, writable: true, configurable: true });
  });

  it('should clear all nexus-station localStorage keys when resetProgress is called', () => {
    // Verify keys are seeded
    expect(fakeStorage.length).toBe(6);

    settingsService.resetProgress();

    for (const key of GAME_KEYS) {
      expect(fakeStorage.getItem(key)).toBeNull();
    }
    expect(fakeStorage.getItem(NON_PREFIXED_KEY)).not.toBeNull();
    expect(fakeStorage.length).toBe(1);
  });

  it('should trigger page reload via document.location.reload', () => {
    settingsService.resetProgress();

    expect(fakeDoc.location.reload).toHaveBeenCalledTimes(1);
  });

  it('should call clearAll before reload', () => {
    const callOrder: string[] = [];

    vi.spyOn(persistenceService, 'clearAll').mockImplementation(() => {
      callOrder.push('clearAll');
    });
    fakeDoc.location.reload.mockImplementation(() => {
      callOrder.push('reload');
    });

    settingsService.resetProgress();

    expect(callOrder).toEqual(['clearAll', 'reload']);
  });

  it('should result in null loads for all game keys after clear (fresh state)', () => {
    settingsService.resetProgress();

    const gameKeyNames = ['game-state', 'mastery', 'streak', 'level-progression', 'settings'];
    for (const key of gameKeyNames) {
      expect(persistenceService.load(key)).toBeNull();
    }
  });
});
