import { TestBed } from '@angular/core/testing';
import { GameProgressionService } from './game-progression.service';
import { XpService } from './xp.service';
import { ALL_STORY_MISSIONS } from '../curriculum/curriculum.data';
import type { MinigameId } from '../minigame/minigame.types';

// --- Test helpers ---

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

/**
 * Completes missions 1..n in order, satisfying dependency chains.
 * Each call goes through the guard checks inside completeMission.
 */
function completeMissionsUpTo(service: GameProgressionService, n: number): void {
  for (let i = 1; i <= n; i++) {
    service.completeMission(i);
  }
}

describe('GameProgressionService', () => {
  let service: GameProgressionService;
  let xpService: XpService;
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

    xpService = TestBed.inject(XpService);
    service = TestBed.inject(GameProgressionService);
  });

  afterEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
  });

  // --- 1. Initialization ---

  describe('initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should have currentMission pointing to Ch 1 initially', () => {
      const mission = service.currentMission();
      expect(mission).not.toBeNull();
      expect(mission!.chapterId).toBe(1);
    });

    it('should have completedMissionCount of 0 initially', () => {
      expect(service.completedMissionCount()).toBe(0);
    });
  });

  // --- 2. Mission availability chain ---

  describe('mission availability', () => {
    it('isMissionAvailable(1) should return true', () => {
      expect(service.isMissionAvailable(1)).toBe(true);
    });

    it('isMissionAvailable(2) should return false initially', () => {
      expect(service.isMissionAvailable(2)).toBe(false);
    });

    it('isMissionAvailable(2) should return true after completing Ch 1', () => {
      service.completeMission(1);
      expect(service.isMissionAvailable(2)).toBe(true);
    });

    it('isMissionAvailable(1) should return true after completing Ch 1', () => {
      service.completeMission(1);
      expect(service.isMissionAvailable(1)).toBe(true);
    });

    it('isMissionAvailable(99) should return false for nonexistent chapter', () => {
      expect(service.isMissionAvailable(99)).toBe(false);
    });
  });

  // --- 3. Mission completion ---

  describe('mission completion', () => {
    it('completeMission(1) should add Ch 1 to completed set', () => {
      service.completeMission(1);
      expect(service.isMissionCompleted(1)).toBe(true);
      expect(service.completedMissionCount()).toBe(1);
    });

    it('completeMission(1) should award story XP', () => {
      const xpBefore = xpService.totalXp();
      service.completeMission(1);
      expect(xpService.totalXp()).toBe(xpBefore + 50);
    });

    it('completeMission(1) twice should not award duplicate XP', () => {
      service.completeMission(1);
      const xpAfterFirst = xpService.totalXp();
      service.completeMission(1);
      expect(xpService.totalXp()).toBe(xpAfterFirst);
    });

    it('completeMission(2) should throw if Ch 1 not completed', () => {
      expect(() => service.completeMission(2)).toThrow();
    });

    it('completeMission(99) should throw for nonexistent chapter', () => {
      expect(() => service.completeMission(99)).toThrow();
    });
  });

  // --- 4. Minigame unlocking ---

  describe('minigame unlocking', () => {
    it('isMinigameUnlocked("module-assembly") should return false initially', () => {
      expect(service.isMinigameUnlocked('module-assembly')).toBe(false);
    });

    it('isMinigameUnlocked("module-assembly") should return true after completing Ch 1', () => {
      service.completeMission(1);
      expect(service.isMinigameUnlocked('module-assembly')).toBe(true);
    });

    it('getUnlockedMinigames() should return empty array initially', () => {
      expect(service.getUnlockedMinigames()).toEqual([]);
    });

    it('getUnlockedMinigames() should return ["module-assembly"] after completing Ch 1', () => {
      service.completeMission(1);
      const unlocked = service.getUnlockedMinigames();
      expect(unlocked).toContain('module-assembly' as MinigameId);
      expect(unlocked.length).toBe(1);
    });
  });

  // --- 5. Campaign progress ---

  describe('campaign progress', () => {
    it('should return { completedMissions: 0, totalMissions: 34, currentPhase: 1 }', () => {
      const progress = service.getCampaignProgress();
      expect(progress.completedMissions).toBe(0);
      expect(progress.totalMissions).toBe(34);
      expect(progress.currentPhase).toBe(1);
    });

    it('should return completedMissions: 1 after completing Ch 1', () => {
      service.completeMission(1);
      const progress = service.getCampaignProgress();
      expect(progress.completedMissions).toBe(1);
      expect(progress.totalMissions).toBe(34);
      expect(progress.currentPhase).toBe(1);
    });

    it('currentMission should advance to Ch 2 after completing Ch 1', () => {
      service.completeMission(1);
      const mission = service.currentMission();
      expect(mission).not.toBeNull();
      expect(mission!.chapterId).toBe(2);
    });
  });

  // --- 6. Reset ---

  describe('reset', () => {
    it('resetProgress() should clear completed missions and persist empty state', () => {
      service.completeMission(1);
      expect(service.completedMissionCount()).toBe(1);

      service.resetProgress();

      expect(service.completedMissionCount()).toBe(0);
      expect(service.isMissionCompleted(1)).toBe(false);
      expect(fakeStorage.getItem('nexus-station:game-progression')).toBeNull();
    });
  });

  // --- 7. Persistence ---

  describe('persistence', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('should load completed missions from localStorage on init', () => {
      fakeStorage.setItem(
        'nexus-station:game-progression',
        JSON.stringify([1, 2, 3]),
      );

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const svc = TestBed.inject(GameProgressionService);

      expect(svc.isMissionCompleted(1)).toBe(true);
      expect(svc.isMissionCompleted(2)).toBe(true);
      expect(svc.isMissionCompleted(3)).toBe(true);
      expect(svc.completedMissionCount()).toBe(3);
    });

    it('should auto-save after debounce', () => {
      vi.useFakeTimers();
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});

      const svc = TestBed.inject(GameProgressionService);
      vi.clearAllTimers();

      svc.completeMission(1);
      TestBed.flushEffects();

      // Before debounce -- not saved yet
      const before = fakeStorage.getItem('nexus-station:game-progression');
      expect(before).toBeNull();

      vi.advanceTimersByTime(500);

      const after = fakeStorage.getItem('nexus-station:game-progression');
      expect(after).not.toBeNull();
      const parsed = JSON.parse(after!) as number[];
      expect(parsed).toContain(1);
    });

    it('should handle corrupted saved data gracefully', () => {
      fakeStorage.setItem(
        'nexus-station:game-progression',
        JSON.stringify([999, -1]),
      );
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const svc = TestBed.inject(GameProgressionService);

      expect(svc.completedMissionCount()).toBe(0);
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('should clear persisted state on resetProgress()', () => {
      fakeStorage.setItem(
        'nexus-station:game-progression',
        JSON.stringify([1]),
      );

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const svc = TestBed.inject(GameProgressionService);
      expect(svc.isMissionCompleted(1)).toBe(true);

      svc.resetProgress();

      expect(svc.completedMissionCount()).toBe(0);
      expect(fakeStorage.getItem('nexus-station:game-progression')).toBeNull();
    });
  });

  // --- 8. Edge cases ---

  describe('edge cases', () => {
    it('currentMission should return null when all 34 missions are completed', () => {
      completeMissionsUpTo(service, ALL_STORY_MISSIONS.length);
      expect(service.currentMission()).toBeNull();
    });

    it('getUnlockedMinigames should deduplicate', () => {
      // Ch 1, 2, 3 all unlock module-assembly
      completeMissionsUpTo(service, 3);
      const unlocked = service.getUnlockedMinigames();
      const moduleAssemblyCount = unlocked.filter(
        (id) => id === 'module-assembly',
      ).length;
      expect(moduleAssemblyCount).toBe(1);
    });
  });
});
