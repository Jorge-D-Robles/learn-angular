import { TestBed } from '@angular/core/testing';
import { RankUpNotificationService } from './rank-up-notification.service';
import { GameStateService } from '../state';

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

describe('RankUpNotificationService', () => {
  let service: RankUpNotificationService;
  let gameState: GameStateService;
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
    gameState = TestBed.inject(GameStateService);
    service = TestBed.inject(RankUpNotificationService);
    TestBed.flushEffects();
  });

  afterEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should not show rank-up on creation', () => {
    expect(service.showRankUp()).toBe(false);
    expect(service.rankUp()).toBeNull();
  });

  it('should trigger rank-up event when rank changes', () => {
    gameState.addXp(500);
    TestBed.flushEffects();

    expect(service.showRankUp()).toBe(true);
    expect(service.rankUp()).toEqual({
      previousRank: 'Cadet',
      newRank: 'Ensign',
    });
  });

  it('should clear rank-up state when dismiss() is called', () => {
    gameState.addXp(500);
    TestBed.flushEffects();

    service.dismiss();

    expect(service.showRankUp()).toBe(false);
    expect(service.rankUp()).toBeNull();
  });

  it('should not trigger when XP increases without crossing rank threshold', () => {
    gameState.addXp(100);
    TestBed.flushEffects();

    expect(service.showRankUp()).toBe(false);
  });

  it('should handle consecutive rank-ups after dismiss', () => {
    gameState.addXp(500);
    TestBed.flushEffects();
    service.dismiss();

    gameState.addXp(1000);
    TestBed.flushEffects();

    expect(service.rankUp()).toEqual({
      previousRank: 'Ensign',
      newRank: 'Lieutenant',
    });
  });

  it('should capture correct ranks on multi-rank skip', () => {
    gameState.addXp(3500);
    TestBed.flushEffects();

    expect(service.rankUp()).toEqual({
      previousRank: 'Cadet',
      newRank: 'Commander',
    });
  });

  it('should keep showRankUp derived from rankUp across transitions', () => {
    // Initially false
    expect(service.showRankUp()).toBe(service.rankUp() !== null);

    // After rank-up
    gameState.addXp(500);
    TestBed.flushEffects();
    expect(service.showRankUp()).toBe(service.rankUp() !== null);
    expect(service.showRankUp()).toBe(true);

    // After dismiss
    service.dismiss();
    expect(service.showRankUp()).toBe(service.rankUp() !== null);
    expect(service.showRankUp()).toBe(false);
  });

  it('should not trigger rank-up when already at max rank', () => {
    gameState.addXp(25_000);
    TestBed.flushEffects();
    service.dismiss();

    gameState.addXp(5000);
    TestBed.flushEffects();

    expect(service.showRankUp()).toBe(false);
  });
});
