import { TestBed } from '@angular/core/testing';
import { DifficultyTier } from '../minigame/minigame.types';
import {
  XpService,
  STORY_MISSION_XP,
  getNextRankThreshold,
  getCurrentRankThreshold,
} from './xp.service';
import { StreakService } from './streak.service';

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

describe('getNextRankThreshold', () => {
  it('should return Ensign threshold for 0 XP', () => {
    const result = getNextRankThreshold(0);
    expect(result).toEqual({ rank: 'Ensign', xpRequired: 500 });
  });

  it('should return Ensign threshold for 499 XP', () => {
    const result = getNextRankThreshold(499);
    expect(result).toEqual({ rank: 'Ensign', xpRequired: 500 });
  });

  it('should return Lieutenant threshold for 500 XP', () => {
    const result = getNextRankThreshold(500);
    expect(result).toEqual({ rank: 'Lieutenant', xpRequired: 1_500 });
  });

  it('should return Lieutenant threshold for 1499 XP', () => {
    const result = getNextRankThreshold(1_499);
    expect(result).toEqual({ rank: 'Lieutenant', xpRequired: 1_500 });
  });

  it('should return Fleet Admiral threshold for 15000 XP', () => {
    const result = getNextRankThreshold(15_000);
    expect(result).toEqual({ rank: 'Fleet Admiral', xpRequired: 25_000 });
  });

  it('should return null for 25000 XP (max rank)', () => {
    expect(getNextRankThreshold(25_000)).toBeNull();
  });

  it('should return null for XP above 25000', () => {
    expect(getNextRankThreshold(30_000)).toBeNull();
  });
});

describe('getCurrentRankThreshold', () => {
  it('should return Cadet threshold for 0 XP', () => {
    const result = getCurrentRankThreshold(0);
    expect(result).toEqual({ rank: 'Cadet', xpRequired: 0 });
  });

  it('should return Ensign threshold for exactly 500 XP', () => {
    const result = getCurrentRankThreshold(500);
    expect(result).toEqual({ rank: 'Ensign', xpRequired: 500 });
  });

  it('should return Cadet threshold for 499 XP', () => {
    const result = getCurrentRankThreshold(499);
    expect(result).toEqual({ rank: 'Cadet', xpRequired: 0 });
  });

  it('should return Fleet Admiral threshold for 25000 XP', () => {
    const result = getCurrentRankThreshold(25_000);
    expect(result).toEqual({ rank: 'Fleet Admiral', xpRequired: 25_000 });
  });
});

describe('XpService', () => {
  let service: XpService;
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
    service = TestBed.inject(XpService);
  });

  afterEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
  });

  describe('calculateLevelXp', () => {
    it('should return 15 for Basic tier, not perfect', () => {
      expect(service.calculateLevelXp(DifficultyTier.Basic, false)).toBe(15);
    });

    it('should return 30 for Basic tier, perfect', () => {
      expect(service.calculateLevelXp(DifficultyTier.Basic, true)).toBe(30);
    });

    it('should return 20 for Intermediate tier, not perfect', () => {
      expect(service.calculateLevelXp(DifficultyTier.Intermediate, false)).toBe(
        20,
      );
    });

    it('should return 40 for Intermediate tier, perfect', () => {
      expect(service.calculateLevelXp(DifficultyTier.Intermediate, true)).toBe(
        40,
      );
    });

    it('should return 30 for Advanced tier, not perfect', () => {
      expect(service.calculateLevelXp(DifficultyTier.Advanced, false)).toBe(30);
    });

    it('should return 60 for Advanced tier, perfect', () => {
      expect(service.calculateLevelXp(DifficultyTier.Advanced, true)).toBe(60);
    });

    it('should return 150 for Boss tier, not perfect', () => {
      expect(service.calculateLevelXp(DifficultyTier.Boss, false)).toBe(150);
    });

    it('should return 300 for Boss tier, perfect', () => {
      expect(service.calculateLevelXp(DifficultyTier.Boss, true)).toBe(300);
    });
  });

  describe('calculateStoryXp', () => {
    it('should return 50', () => {
      expect(service.calculateStoryXp()).toBe(50);
      expect(STORY_MISSION_XP).toBe(50);
    });
  });

  describe('addXp', () => {
    it('should delegate to GameStateService (totalXp increases)', () => {
      service.addXp(100);
      expect(service.totalXp()).toBe(100);
    });

    it('should ignore 0 (totalXp unchanged)', () => {
      service.addXp(0);
      expect(service.totalXp()).toBe(0);
    });

    it('should ignore negative (totalXp unchanged)', () => {
      service.addXp(-10);
      expect(service.totalXp()).toBe(0);
    });
  });

  describe('totalXp signal', () => {
    it('should start at 0', () => {
      expect(service.totalXp()).toBe(0);
    });

    it('should reflect XP added via addXp', () => {
      service.addXp(250);
      expect(service.totalXp()).toBe(250);
      service.addXp(250);
      expect(service.totalXp()).toBe(500);
    });
  });

  describe('currentRank signal', () => {
    it('should start at Cadet (wiring check)', () => {
      expect(service.currentRank()).toBe('Cadet');
    });

    it('should update to Ensign after 500 XP (wiring check)', () => {
      service.addXp(500);
      expect(service.currentRank()).toBe('Ensign');
    });
  });

  describe('xpToNextRank signal', () => {
    it('should return 500 at 0 XP (next: Ensign at 500)', () => {
      expect(service.xpToNextRank()).toBe(500);
    });

    it('should return 1 at 499 XP', () => {
      service.addXp(499);
      expect(service.xpToNextRank()).toBe(1);
    });

    it('should return 1000 at 500 XP (next: Lieutenant at 1500)', () => {
      service.addXp(500);
      expect(service.xpToNextRank()).toBe(1_000);
    });

    it('should return 0 at 25000 XP (Fleet Admiral, max rank)', () => {
      service.addXp(25_000);
      expect(service.xpToNextRank()).toBe(0);
    });

    it('should return 0 above 25000 XP', () => {
      service.addXp(30_000);
      expect(service.xpToNextRank()).toBe(0);
    });
  });

  describe('rankProgress signal', () => {
    it('should return 0 at 0 XP (0% toward Ensign)', () => {
      expect(service.rankProgress()).toBe(0);
    });

    it('should return 50 at 250 XP (50% from Cadet 0 to Ensign 500)', () => {
      service.addXp(250);
      expect(service.rankProgress()).toBe(50);
    });

    it('should return 100 at 25000 XP (Fleet Admiral, max)', () => {
      service.addXp(25_000);
      expect(service.rankProgress()).toBe(100);
    });

    it('should return 100 above 25000 XP', () => {
      service.addXp(30_000);
      expect(service.rankProgress()).toBe(100);
    });

    it('should return 0 at exactly 500 XP (0% from Ensign 500 to Lieutenant 1500)', () => {
      service.addXp(500);
      expect(service.rankProgress()).toBe(0);
    });

    it('should return 50 at 1000 XP (50% from Ensign 500 to Lieutenant 1500)', () => {
      service.addXp(1_000);
      expect(service.rankProgress()).toBe(50);
    });
  });

  describe('applyStreakBonus', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    function buildStreak(days: number): void {
      const streakService = TestBed.inject(StreakService);
      for (let i = 0; i < days; i++) {
        vi.setSystemTime(
          new Date(`2026-03-${String(1 + i).padStart(2, '0')}T12:00:00`),
        );
        streakService.recordDailyPlay();
      }
    }

    it('should return baseXp with 0 bonus when no streak (0 active days)', () => {
      const result = service.applyStreakBonus(20);
      expect(result).toEqual({
        baseXp: 20,
        streakBonus: 0,
        totalXp: 20,
        streakMultiplier: 1.0,
      });
    });

    it('should apply 10% bonus for 1-day streak', () => {
      buildStreak(1);
      const result = service.applyStreakBonus(20);
      expect(result).toEqual({
        baseXp: 20,
        streakBonus: 2,
        totalXp: 22,
        streakMultiplier: 1.1,
      });
    });

    it('should apply 30% bonus for 3-day streak', () => {
      buildStreak(3);
      const result = service.applyStreakBonus(20);
      expect(result).toEqual({
        baseXp: 20,
        streakBonus: 6,
        totalXp: 26,
        streakMultiplier: 1.3,
      });
    });

    it('should cap at 50% bonus for 5+ day streak', () => {
      buildStreak(5);
      const result = service.applyStreakBonus(20);
      expect(result).toEqual({
        baseXp: 20,
        streakBonus: 10,
        totalXp: 30,
        streakMultiplier: 1.5,
      });
    });

    it('should still cap at 50% for 7-day streak', () => {
      buildStreak(7);
      const result = service.applyStreakBonus(20);
      expect(result).toEqual({
        baseXp: 20,
        streakBonus: 10,
        totalXp: 30,
        streakMultiplier: 1.5,
      });
    });

    it('should round total XP when streak produces fractional value', () => {
      buildStreak(1); // 1.1x
      const result = service.applyStreakBonus(15);
      // 15 * 1.1 = 16.5 -> Math.round = 17, bonus = 17 - 15 = 2
      expect(result).toEqual({
        baseXp: 15,
        streakBonus: 2,
        totalXp: 17,
        streakMultiplier: 1.1,
      });
    });

    it('should return 0 bonus when baseXp is 0', () => {
      buildStreak(3); // 1.3x
      const result = service.applyStreakBonus(0);
      expect(result).toEqual({
        baseXp: 0,
        streakBonus: 0,
        totalXp: 0,
        streakMultiplier: 1.3,
      });
    });
  });
});
