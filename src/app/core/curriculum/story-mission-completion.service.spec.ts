import { TestBed } from '@angular/core/testing';
import { StoryMissionCompletionService } from './story-mission-completion.service';
import { CurriculumService } from './curriculum.service';
import { MasteryService } from '../progression/mastery.service';
import { XpService } from '../progression/xp.service';
import type { ChapterId } from './curriculum.types';

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
 * Completes missions 1..n in order via the facade service,
 * satisfying dependency chains.
 */
function completeMissionsUpTo(
  service: StoryMissionCompletionService,
  n: number,
): void {
  for (let i = 1; i <= n; i++) {
    service.completeMission(i as ChapterId);
  }
}

describe('StoryMissionCompletionService', () => {
  let service: StoryMissionCompletionService;
  let mastery: MasteryService;
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

    service = TestBed.inject(StoryMissionCompletionService);
    mastery = TestBed.inject(MasteryService);
    xpService = TestBed.inject(XpService);
  });

  afterEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // --- Test 1: Awards XP via GameProgressionService ---

  it('should award XP by delegating to GameProgressionService.completeMission', () => {
    const xpBefore = xpService.totalXp();
    service.completeMission(1 as ChapterId);
    const xpAfter = xpService.totalXp();
    expect(xpAfter - xpBefore).toBeGreaterThanOrEqual(50);
  });

  // --- Test 2: Updates mastery to 1 star ---

  it('should update mastery to 1 star for the unlocked minigame', () => {
    expect(mastery.getMastery('module-assembly')).toBe(0);
    service.completeMission(1 as ChapterId);
    expect(mastery.getMastery('module-assembly')).toBeGreaterThanOrEqual(1);
  });

  // --- Test 3: Returns summary with unlockedMinigame ---

  it('should return summary with unlockedMinigame and masteryAwarded', () => {
    const summary = service.completeMission(1 as ChapterId);
    expect(summary.unlockedMinigame).toBe('module-assembly');
    expect(summary.masteryAwarded).toBe(true);
    expect(summary.alreadyCompleted).toBe(false);
  });

  // --- Test 4: Skips mastery for non-unlocking missions ---

  it('should skip mastery for missions that do not unlock a minigame', () => {
    // Complete chapters 1-8 first to satisfy prerequisites for Ch 9
    completeMissionsUpTo(service, 8);

    const summary = service.completeMission(9 as ChapterId);
    expect(summary.masteryAwarded).toBe(false);
    expect(summary.unlockedMinigame).toBeNull();
  });

  // --- Test 5: Idempotent -- second completion is no-op ---

  it('should return alreadyCompleted=true on second completion without re-awarding mastery', () => {
    const first = service.completeMission(1 as ChapterId);
    expect(first.alreadyCompleted).toBe(false);

    const xpBefore = xpService.totalXp();
    const second = service.completeMission(1 as ChapterId);
    const xpAfter = xpService.totalXp();

    expect(second.alreadyCompleted).toBe(true);
    expect(xpAfter).toBe(xpBefore); // No additional XP
  });

  // --- Test 6: Returns alreadyCompleted=false on first completion ---

  it('should return alreadyCompleted=false on first completion', () => {
    const summary = service.completeMission(1 as ChapterId);
    expect(summary.alreadyCompleted).toBe(false);
  });

  // --- Test 7: Throws for invalid chapterId ---

  it('should throw for invalid chapterId', () => {
    expect(() => service.completeMission(99 as ChapterId)).toThrow();
  });

  // --- Test 8: Throws for unmet prerequisites ---

  it('should throw for unmet prerequisites', () => {
    expect(() => service.completeMission(2 as ChapterId)).toThrow();
  });

  // --- Test 9: "New levels" chapter returns correct minigameId and masteryAwarded ---

  it('should return correct minigameId and masteryAwarded for "new levels" chapter', () => {
    // Ch 1 is prerequisite for Ch 2; both unlock 'module-assembly'
    service.completeMission(1 as ChapterId);

    const summary = service.completeMission(2 as ChapterId);
    expect(summary.unlockedMinigame).toBe('module-assembly');
    expect(summary.masteryAwarded).toBe(true);
  });

  // --- Test 10: Another non-unlocking chapter returns null ---

  it('should return null unlockedMinigame for non-unlocking chapter 10', () => {
    completeMissionsUpTo(service, 9);

    const summary = service.completeMission(10 as ChapterId);
    expect(summary.unlockedMinigame).toBeNull();
    expect(summary.masteryAwarded).toBe(false);
  });

  // --- Test 11: CurriculumService is used for unlock resolution ---

  it('should use CurriculumService.getMinigameForChapter for unlock resolution', () => {
    const curriculum = TestBed.inject(CurriculumService);
    const spy = vi.spyOn(curriculum, 'getMinigameForChapter');

    service.completeMission(1 as ChapterId);

    expect(spy).toHaveBeenCalledWith(1);
  });
});
