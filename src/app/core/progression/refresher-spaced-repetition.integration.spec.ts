import { TestBed } from '@angular/core/testing';
import { MasteryService } from './mastery.service';
import { SpacedRepetitionService } from './spaced-repetition.service';
import { RefresherChallengeService } from './refresher-challenge.service';
import { LevelLoaderService } from '../levels/level-loader.service';

// --- Test helpers ---

const MS_PER_DAY = 86_400_000;

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

describe('RefresherChallengeService + SpacedRepetitionService integration', () => {
  let masteryService: MasteryService;
  let spacedRepetitionService: SpacedRepetitionService;
  let refresherService: RefresherChallengeService;
  let fakeStorage: Storage;
  let originalLocalStorage: Storage;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-07T12:00:00'));

    fakeStorage = createFakeStorage();
    originalLocalStorage = window.localStorage;

    Object.defineProperty(window, 'localStorage', {
      value: fakeStorage,
      writable: true,
      configurable: true,
    });

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [MasteryService, SpacedRepetitionService, RefresherChallengeService, LevelLoaderService],
    });

    // CRITICAL: Inject MasteryService FIRST and apply spy before other services
    masteryService = TestBed.inject(MasteryService);
    vi.spyOn(masteryService, 'getMastery').mockReturnValue(5);

    // Then inject SpacedRepetitionService (reads getMastery during construction)
    spacedRepetitionService = TestBed.inject(SpacedRepetitionService);

    // Finally inject RefresherChallengeService
    refresherService = TestBed.inject(RefresherChallengeService);
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
  });

  it('completeRefresher delegates to SpacedRepetitionService.recordPractice', () => {
    spacedRepetitionService.recordPractice('module-assembly');

    vi.advanceTimersByTime(MS_PER_DAY * 14);

    refresherService.completeRefresher('module-assembly');
    const expectedTime = Date.now();

    expect(spacedRepetitionService.lastPracticed().get('module-assembly')).toBe(expectedTime);
  });

  it('completeRefresher resets the degradation timer so effective mastery matches raw mastery', () => {
    spacedRepetitionService.recordPractice('module-assembly');

    vi.advanceTimersByTime(MS_PER_DAY * 14);

    // Verify degradation occurred
    const degraded = spacedRepetitionService.getEffectiveMastery('module-assembly');
    expect(degraded).toBeCloseTo(4.0);

    refresherService.completeRefresher('module-assembly');

    // Verify mastery is fully restored
    expect(spacedRepetitionService.getEffectiveMastery('module-assembly')).toBe(5);
  });

  it('after completeRefresher, topic no longer appears in getDegradingTopics', () => {
    spacedRepetitionService.recordPractice('module-assembly');

    vi.advanceTimersByTime(MS_PER_DAY * 14);

    // Verify topic is degrading
    const degrading = spacedRepetitionService.getDegradingTopics();
    expect(degrading.some((t) => t.topicId === 'module-assembly')).toBe(true);

    refresherService.completeRefresher('module-assembly');

    // Verify topic is no longer degrading
    const afterRefresh = spacedRepetitionService.getDegradingTopics();
    expect(afterRefresh.some((t) => t.topicId === 'module-assembly')).toBe(false);
  });

  it('after completeRefresher, topic no longer appears in getPendingRefreshers', () => {
    spacedRepetitionService.recordPractice('module-assembly');

    vi.advanceTimersByTime(MS_PER_DAY * 14);

    // Verify topic appears in pending refreshers
    const pending = refresherService.getPendingRefreshers();
    expect(pending.some((t) => t.topicId === 'module-assembly')).toBe(true);

    refresherService.completeRefresher('module-assembly');

    // Verify pending refreshers is empty
    expect(refresherService.getPendingRefreshers()).toEqual([]);
  });

  it('degradation resumes from zero after completeRefresher if time passes again', () => {
    spacedRepetitionService.recordPractice('module-assembly');

    vi.advanceTimersByTime(MS_PER_DAY * 14);

    refresherService.completeRefresher('module-assembly');

    // Verify effective mastery is fully restored
    expect(spacedRepetitionService.getEffectiveMastery('module-assembly')).toBe(5);

    // Advance another 10 days (3 days past new grace period)
    vi.advanceTimersByTime(MS_PER_DAY * 10);

    // Verify degradation has resumed
    expect(spacedRepetitionService.getEffectiveMastery('module-assembly')).toBeLessThan(5);

    // Verify topic re-appears in degrading topics
    const degrading = spacedRepetitionService.getDegradingTopics();
    expect(degrading.some((t) => t.topicId === 'module-assembly')).toBe(true);
  });

  it('completeRefresher returns false and does not reset timer for non-degrading topic', () => {
    spacedRepetitionService.recordPractice('module-assembly');

    const originalTimestamp = spacedRepetitionService.lastPracticed().get('module-assembly');

    const result = refresherService.completeRefresher('module-assembly');

    expect(result).toBe(false);
    expect(spacedRepetitionService.lastPracticed().get('module-assembly')).toBe(originalTimestamp);
  });
});
