import { TestBed } from '@angular/core/testing';
import {
  DifficultyTier,
  type MinigameId,
  type MinigameResult,
  LevelCompletionService,
} from '../minigame';
import { LevelProgressionService, type LevelDefinition } from '../levels';
import {
  XpService,
  MasteryService,
} from '../progression';
import { GameStateService } from '../state';
import {
  XpNotificationService,
  RankUpNotificationService,
} from '../notifications';
import { SoundEffect, SOUND_PATHS } from '../audio';
import { SettingsService } from '../settings/settings.service';

// --- MockAudio ---

const createdMocks: MockAudio[] = [];

class MockAudio {
  src: string;
  preload = '';
  volume = 1;
  playSpy = vi.fn().mockResolvedValue(undefined);

  constructor(src = '') {
    this.src = src;
    createdMocks.push(this);
  }

  cloneNode(_deep: boolean): MockAudio {
    const clone = new MockAudio(this.src);
    clone.preload = this.preload;
    clone.volume = this.volume;
    clone.playSpy = vi.fn().mockResolvedValue(undefined);
    return clone;
  }

  play(): Promise<void> {
    return this.playSpy();
  }
}

// --- Fake storage ---

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

// --- Test data ---

const TEST_GAME_ID: MinigameId = 'module-assembly';

const testLevels: LevelDefinition<unknown>[] = [
  { levelId: 'ma-basic-01', gameId: TEST_GAME_ID, tier: DifficultyTier.Basic, order: 1, title: 'L1', conceptIntroduced: 'c1', description: 'd1', data: {} },
  { levelId: 'ma-basic-02', gameId: TEST_GAME_ID, tier: DifficultyTier.Basic, order: 2, title: 'L2', conceptIntroduced: 'c2', description: 'd2', data: {} },
];

function makeResult(overrides: Partial<MinigameResult> = {}): MinigameResult {
  return {
    gameId: TEST_GAME_ID,
    levelId: 'ma-basic-01',
    score: 100,
    perfect: false,
    timeElapsed: 30,
    xpEarned: 0,
    starRating: 1,
    ...overrides,
  };
}

// --- Integration tests ---

describe('Level completion pipeline with audio integration', () => {
  let levelCompletion: LevelCompletionService;
  let levelProgression: LevelProgressionService;
  let xpService: XpService;
  let gameState: GameStateService;
  let masteryService: MasteryService;
  let xpNotification: XpNotificationService;
  let rankUpNotification: RankUpNotificationService;
  let settingsService: SettingsService;
  let originalLocalStorage: Storage;
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-07T12:00:00'));

    createdMocks.length = 0;

    originalLocalStorage = window.localStorage;
    originalMatchMedia = window.matchMedia;

    const fakeStorage = createFakeStorage();
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

    vi.stubGlobal('Audio', MockAudio);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});

    levelCompletion = TestBed.inject(LevelCompletionService);
    levelProgression = TestBed.inject(LevelProgressionService);
    xpService = TestBed.inject(XpService);
    gameState = TestBed.inject(GameStateService);
    masteryService = TestBed.inject(MasteryService);
    xpNotification = TestBed.inject(XpNotificationService);
    rankUpNotification = TestBed.inject(RankUpNotificationService);
    settingsService = TestBed.inject(SettingsService);

    levelProgression.registerLevels(testLevels);

    // Flush initial effects so RankUpNotificationService captures the starting rank
    TestBed.flushEffects();
  });

  afterEach(() => {
    vi.runAllTimers();
    vi.useRealTimers();
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
    vi.unstubAllGlobals();
  });

  it('completing a level triggers score calculation, XP award, mastery update, and levelUp audio', () => {
    const showSpy = vi.spyOn(xpNotification, 'show');

    const summary = levelCompletion.completeLevel(
      makeResult({ levelId: 'ma-basic-01', score: 100, perfect: false }),
    );

    // Level progress recorded
    const progress = levelProgression.getLevel('ma-basic-01');
    expect(progress).not.toBeNull();
    expect(progress!.completed).toBe(true);
    expect(progress!.bestScore).toBe(100);

    // XP: Basic tier non-perfect = 15, no streak, no diminishing returns (first play)
    expect(summary.xpEarned).toBe(15);
    expect(xpService.totalXp()).toBe(15);

    // Mastery: at least one level completed = 1 star
    expect(masteryService.getMastery('module-assembly')).toBe(1);

    // XP notification was called with correct amount
    expect(showSpy).toHaveBeenCalledTimes(1);
    expect(showSpy.mock.calls[0][0]).toBe(15);

    // levelUp sound was played via AudioService (MockAudio clone with levelUp.mp3 src)
    const playedMocks = createdMocks.filter((m) => m.playSpy.mock.calls.length > 0);
    const levelUpMocks = playedMocks.filter((m) => m.src === SOUND_PATHS[SoundEffect.levelUp]);
    expect(levelUpMocks.length).toBeGreaterThanOrEqual(1);
  });

  it('completing a level that causes rank-up triggers rank-up notification and rankUp sound', () => {
    const showSpy = vi.spyOn(xpNotification, 'show');

    // Seed XP to just below Ensign (500)
    gameState.addXp(490);

    // Basic perfect = 30 XP -> total 520 -> Ensign
    const summary = levelCompletion.completeLevel(
      makeResult({ levelId: 'ma-basic-01', score: 100, perfect: true }),
    );

    // Flush effects to trigger RankUpNotificationService reactive effect
    TestBed.flushEffects();

    // Rank-up occurred
    expect(summary.rankUpOccurred).toBe(true);
    expect(xpService.currentRank()).toBe('Ensign');

    // RankUpNotificationService detected the rank change
    const rankUpEvent = rankUpNotification.rankUp();
    expect(rankUpEvent).not.toBeNull();
    expect(rankUpEvent!.newRank).toBe('Ensign');

    // XP notification was called
    expect(showSpy).toHaveBeenCalledTimes(1);

    // Both levelUp and rankUp sounds were played
    const playedMocks = createdMocks.filter((m) => m.playSpy.mock.calls.length > 0);
    const levelUpPlayed = playedMocks.some((m) => m.src === SOUND_PATHS[SoundEffect.levelUp]);
    const rankUpPlayed = playedMocks.some((m) => m.src === SOUND_PATHS[SoundEffect.rankUp]);
    expect(levelUpPlayed).toBe(true);
    expect(rankUpPlayed).toBe(true);
  });

  it('completing a level with sound disabled triggers no audio but all other effects still fire', () => {
    const showSpy = vi.spyOn(xpNotification, 'show');

    // Disable sound
    settingsService.updateSetting('soundEnabled', false);

    // Seed XP to just below Ensign (500)
    gameState.addXp(490);

    // Basic perfect = 30 XP -> total 520 -> Ensign (triggers rank-up)
    const summary = levelCompletion.completeLevel(
      makeResult({ levelId: 'ma-basic-01', score: 100, perfect: true }),
    );

    // Flush effects to trigger RankUpNotificationService reactive effect
    TestBed.flushEffects();

    // XP is correct
    expect(summary.xpEarned).toBe(30);
    expect(xpService.totalXp()).toBe(520);

    // Mastery is correct
    expect(masteryService.getMastery('module-assembly')).toBe(1);

    // Rank-up occurred
    expect(summary.rankUpOccurred).toBe(true);

    // RankUpNotificationService still fires (notification, not audio)
    const rankUpEvent = rankUpNotification.rankUp();
    expect(rankUpEvent).not.toBeNull();

    // XP notification was still called
    expect(showSpy).toHaveBeenCalledTimes(1);

    // No audio played (AudioService.play() early-returns when sound disabled)
    const playedMocks = createdMocks.filter((m) => m.playSpy.mock.calls.length > 0);
    expect(playedMocks).toHaveLength(0);
  });
});
