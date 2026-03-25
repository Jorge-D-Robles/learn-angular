import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import {
  LucideIconConfig,
  LucideIconProvider,
  LUCIDE_ICONS,
} from 'lucide-angular';
import { vi } from 'vitest';
import { createComponent, getMockProvider } from '../../../testing/test-utils';
import { DashboardPage } from '../../pages/dashboard/dashboard';
import { SpacedRepetitionService } from '../../core/progression/spaced-repetition.service';
import { MasteryService } from '../../core/progression/mastery.service';
import { XpService } from '../../core/progression/xp.service';
import { GameProgressionService } from '../../core/progression/game-progression.service';
import { DailyChallengeService, type DailyChallenge } from '../../core/progression/daily-challenge.service';
import { StreakService } from '../../core/progression/streak.service';
import { APP_ICONS } from '../../shared/icons';
import type { MinigameId } from '../../core/minigame/minigame.types';
import type { Rank } from '../../core/state/rank.constants';
import type { StoryMission } from '../../core/curriculum/curriculum.types';

// --- Constants ---

const MS_PER_DAY = 86_400_000;
const BASE_DATE = new Date('2026-03-07T12:00:00');

// --- Fake localStorage ---

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

// --- Icon providers (required for DashboardPage rendering) ---

const ICON_PROVIDERS = [
  {
    provide: LUCIDE_ICONS,
    multi: true,
    useValue: new LucideIconProvider(APP_ICONS),
  },
  {
    provide: LucideIconConfig,
    useValue: Object.assign(new LucideIconConfig(), {
      size: 24,
      color: 'currentColor',
    }),
  },
];

// --- Satellite service mock data ---

const TEST_MISSION: StoryMission = {
  chapterId: 1,
  title: 'Station Boot Sequence',
  angularTopic: 'Components',
  narrative: 'The station core is offline.',
  unlocksMinigame: 'module-assembly',
  deps: [],
  phase: 1,
};

const TEST_CHALLENGE: DailyChallenge = {
  date: '2026-03-17',
  gameId: 'module-assembly',
  levelId: 'daily-module-assembly-2026-03-17',
  bonusXp: 50,
  completed: false,
};

/** Satellite mock providers for DashboardPage that are NOT part of the integration. */
function getSatelliteMockProviders() {
  return [
    getMockProvider(XpService, {
      totalXp: signal(750),
      currentRank: signal('Ensign' as Rank),
    }),
    getMockProvider(GameProgressionService, {
      currentMission: signal(TEST_MISSION),
      completedMissions: signal(new Set()),
      completedMissionCount: signal(0),
      getUnlockedMinigames: () => ['module-assembly' as MinigameId],
    }),
    getMockProvider(DailyChallengeService, {
      todaysChallenge: signal(TEST_CHALLENGE),
    }),
    getMockProvider(StreakService, {
      activeStreakDays: signal(3),
      streakMultiplier: signal(1.3),
    }),
    getMockProvider(Router, {
      navigate: vi.fn(),
    }),
  ];
}

/**
 * Seeds fakeStorage with spaced-repetition state for module-assembly
 * at the given timestamp, then advances the clock to create degradation.
 */
function seedDegradingState(fakeStorage: Storage, practiceTimestamp: number): void {
  fakeStorage.setItem(
    'nexus-station:spaced-repetition',
    JSON.stringify({ 'module-assembly': practiceTimestamp }),
  );
}

/**
 * Seeds fakeStorage with mastery state so MasteryService loads 5 stars
 * for module-assembly on construction.
 */
function seedMasteryState(fakeStorage: Storage): void {
  fakeStorage.setItem(
    'nexus-station:mastery',
    JSON.stringify({ 'module-assembly': 5 }),
  );
}

// --- Test suite ---

describe('SpacedRepetition -> DashboardPage -> DegradationAlert integration', () => {
  let fakeStorage: Storage;
  let originalLocalStorage: Storage;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(BASE_DATE);

    fakeStorage = createFakeStorage();
    originalLocalStorage = window.localStorage;
    Object.defineProperty(window, 'localStorage', {
      value: fakeStorage,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
  });

  describe('service-level degradation detection', () => {
    let spacedRepetition: SpacedRepetitionService;
    let getMasterySpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});

      const masteryService = TestBed.inject(MasteryService);
      getMasterySpy = vi.spyOn(masteryService, 'getMastery');
      getMasterySpy.mockReturnValue(0);

      spacedRepetition = TestBed.inject(SpacedRepetitionService);
    });

    it('topic with no practice for >7 days triggers getDegradingTopics in SpacedRepetitionService', () => {
      getMasterySpy.mockReturnValue(5);
      spacedRepetition.recordPractice('module-assembly');

      // Advance 10 days (3 days past the 7-day grace period)
      vi.advanceTimersByTime(MS_PER_DAY * 10);

      const degrading = spacedRepetition.getDegradingTopics();
      expect(degrading.length).toBe(1);
      expect(degrading[0].topicId).toBe('module-assembly');
      expect(degrading[0].daysSinceLastPractice).toBeCloseTo(10);
      // degradation = (10 - 7) / 7 ~= 0.4286
      expect(degrading[0].degradation).toBeCloseTo((10 - 7) / 7);
    });

    it('practicing a decayed topic resets its decay timer', () => {
      getMasterySpy.mockReturnValue(5);
      spacedRepetition.recordPractice('module-assembly');

      // Advance 10 days (degrading)
      vi.advanceTimersByTime(MS_PER_DAY * 10);

      // Verify degradation exists
      expect(spacedRepetition.getDegradingTopics().length).toBe(1);

      // Practice the topic to reset the timer
      spacedRepetition.recordPractice('module-assembly');

      // Assert no more degrading topics
      expect(spacedRepetition.getDegradingTopics()).toEqual([]);

      // Assert effective mastery equals raw mastery (no degradation)
      expect(spacedRepetition.getEffectiveMastery('module-assembly')).toBe(5);
    });
  });

  describe('dashboard component rendering', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
    });

    it('dashboard page receives and displays decayed topics from the service', async () => {
      // Seed localStorage so services load degrading state on construction.
      // Practice timestamp = BASE_DATE, then advance 10 days so topic is degrading.
      const practiceTimestamp = BASE_DATE.getTime();
      seedDegradingState(fakeStorage, practiceTimestamp);
      seedMasteryState(fakeStorage);

      vi.advanceTimersByTime(MS_PER_DAY * 10);

      // Render DashboardPage -- createComponent calls TestBed.configureTestingModule fresh.
      // Real SpacedRepetitionService and MasteryService load from seeded localStorage.
      // MinigameRegistryService is real (provides name mappings).
      // Satellite services are mocked.
      const { element } = await createComponent(DashboardPage, {
        providers: [
          ...ICON_PROVIDERS,
          ...getSatelliteMockProviders(),
        ],
      });

      // Assert degradation alert is visible (not display: none)
      const alert = element.querySelector('nx-degradation-alert') as HTMLElement;
      expect(alert).toBeTruthy();
      expect(alert.style.display).not.toBe('none');

      // Assert a degradation alert item exists
      const item = element.querySelector('.degradation-alert__item');
      expect(item).toBeTruthy();

      // Assert topic name is rendered
      const topicName = element.querySelector('.degradation-alert__topic-name');
      expect(topicName?.textContent?.trim()).toBe('Module Assembly');

      // Assert the mastery diff contains raw and effective values
      const masteryDiff = element.querySelector('.degradation-alert__mastery-diff');
      expect(masteryDiff?.textContent).toContain('5');

      // Assert "Practice Now" button exists
      const practiceBtn = element.querySelector('.degradation-alert__practice-btn');
      expect(practiceBtn).toBeTruthy();
      expect(practiceBtn?.textContent?.trim()).toBe('Practice Now');
    });

    it('dashboard alert disappears after practicing a decayed topic', async () => {
      // Seed degrading state: practiced at BASE_DATE, now 10 days later
      const practiceTimestamp = BASE_DATE.getTime();
      seedDegradingState(fakeStorage, practiceTimestamp);
      seedMasteryState(fakeStorage);

      vi.advanceTimersByTime(MS_PER_DAY * 10);

      const { element, fixture } = await createComponent(DashboardPage, {
        providers: [
          ...ICON_PROVIDERS,
          ...getSatelliteMockProviders(),
        ],
      });

      // Verify alert is visible before practice
      let alert = element.querySelector('nx-degradation-alert') as HTMLElement;
      expect(alert).toBeTruthy();
      expect(alert.style.display).not.toBe('none');

      // Get the real SpacedRepetitionService instance from TestBed
      const spacedRepetition = TestBed.inject(SpacedRepetitionService);

      // Practice the decayed topic to reset degradation
      spacedRepetition.recordPractice('module-assembly');

      // Trigger change detection
      fixture.detectChanges();
      await fixture.whenStable();

      // Assert alert is now hidden
      alert = element.querySelector('nx-degradation-alert') as HTMLElement;
      expect(alert).toBeTruthy();
      expect(alert.style.display).toBe('none');
    });
  });
});
