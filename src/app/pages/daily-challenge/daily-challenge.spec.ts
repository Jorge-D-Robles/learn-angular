import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { createComponent, getMockProvider } from '../../../testing/test-utils';
import { DailyChallengePage } from './daily-challenge';
import {
  DailyChallengeService,
  type DailyChallenge,
} from '../../core/progression/daily-challenge.service';
import { StreakService } from '../../core/progression/streak.service';
import { MinigameRegistryService } from '../../core/minigame/minigame-registry.service';
import type { MinigameConfig } from '../../core/minigame/minigame.types';
import { DifficultyTier } from '../../core/minigame/minigame.types';

const TEST_CHALLENGE: DailyChallenge = {
  date: '2026-03-25',
  gameId: 'module-assembly',
  levelId: 'daily-module-assembly-2026-03-25',
  bonusXp: 50,
  completed: false,
};

const TEST_CONFIG: MinigameConfig = {
  id: 'module-assembly',
  name: 'Module Assembly',
  description: 'Conveyor belt drag-and-drop assembly',
  angularTopic: 'Components',
  totalLevels: 18,
  difficultyTiers: [
    DifficultyTier.Basic,
    DifficultyTier.Intermediate,
    DifficultyTier.Advanced,
    DifficultyTier.Boss,
  ],
};

interface SetupOptions {
  challenge?: DailyChallenge;
  streakDays?: number;
  streakMultiplier?: number;
  config?: MinigameConfig | undefined;
}

function setup(options: SetupOptions = {}) {
  const {
    challenge = TEST_CHALLENGE,
    streakDays = 3,
    streakMultiplier = 1.3,
    config = TEST_CONFIG,
  } = options;

  const challengeSignal = signal(challenge);

  const providers = [
    provideRouter([]),
    getMockProvider(DailyChallengeService, {
      todaysChallenge: challengeSignal,
    }),
    getMockProvider(StreakService, {
      activeStreakDays: signal(streakDays),
      streakMultiplier: signal(streakMultiplier),
    }),
    getMockProvider(MinigameRegistryService, {
      getConfig: vi.fn((id: string) =>
        id === config?.id ? config : undefined,
      ),
    }),
  ];

  return { challengeSignal, providers };
}

describe('DailyChallengePage', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create the component', async () => {
    const { providers } = setup();
    const { component } = await createComponent(DailyChallengePage, {
      providers,
    });
    expect(component).toBeTruthy();
  });

  // --- Challenge display ---

  it('should show game name from MinigameRegistryService', async () => {
    const { providers } = setup();
    const { element } = await createComponent(DailyChallengePage, {
      providers,
    });
    expect(element.textContent).toContain('Module Assembly');
  });

  it('should show Angular topic from MinigameRegistryService', async () => {
    const { providers } = setup();
    const { element } = await createComponent(DailyChallengePage, {
      providers,
    });
    expect(element.textContent).toContain('Components');
  });

  it('should show bonus XP value (50)', async () => {
    const { providers } = setup();
    const { element } = await createComponent(DailyChallengePage, {
      providers,
    });
    expect(element.textContent).toContain('50');
  });

  it('should show level ID as preview text', async () => {
    const { providers } = setup();
    const { element } = await createComponent(DailyChallengePage, {
      providers,
    });
    expect(element.textContent).toContain(
      'daily-module-assembly-2026-03-25',
    );
  });

  // --- Pending state ---

  it('should show "Accept Challenge" link when not completed', async () => {
    const { providers } = setup();
    const { element } = await createComponent(DailyChallengePage, {
      providers,
    });
    const link = element.querySelector('a');
    expect(link?.textContent).toContain('Accept Challenge');
  });

  it('"Accept Challenge" link should have correct routerLink to minigame level', async () => {
    const { providers } = setup();
    const { element } = await createComponent(DailyChallengePage, {
      providers,
    });
    const link = element.querySelector(
      'a[href="/minigames/module-assembly/level/daily-module-assembly-2026-03-25"]',
    );
    expect(link).toBeTruthy();
  });

  // --- Completed state ---

  it('should show completion checkmark when challenge is completed', async () => {
    const { providers } = setup({
      challenge: { ...TEST_CHALLENGE, completed: true },
    });
    const { element } = await createComponent(DailyChallengePage, {
      providers,
    });
    expect(element.textContent).toContain('\u2713');
  });

  it('should show countdown timer when challenge is completed', async () => {
    // Set fake time to 2026-03-25 at 18:00:00 (6 hours = 21600s until midnight)
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 25, 18, 0, 0));

    const { providers } = setup({
      challenge: { ...TEST_CHALLENGE, completed: true },
    });
    const { element } = await createComponent(DailyChallengePage, {
      providers,
    });
    // 6 hours = 6:00:00 in short format
    expect(element.textContent).toContain('6:00:00');
  });

  it('should NOT show "Accept Challenge" when completed', async () => {
    const { providers } = setup({
      challenge: { ...TEST_CHALLENGE, completed: true },
    });
    const { element } = await createComponent(DailyChallengePage, {
      providers,
    });
    expect(element.textContent).not.toContain('Accept Challenge');
  });

  // --- Streak display ---

  it('should show current streak days', async () => {
    const { providers } = setup({ streakDays: 7 });
    const { element } = await createComponent(DailyChallengePage, {
      providers,
    });
    expect(element.textContent).toContain('7');
  });

  it('should show streak multiplier formatted as percentage', async () => {
    const { providers } = setup({ streakMultiplier: 1.3 });
    const { element } = await createComponent(DailyChallengePage, {
      providers,
    });
    expect(element.textContent).toContain('130%');
  });

  // --- Countdown timer ---

  it('should compute seconds until midnight correctly', async () => {
    // Set to 23:00:00 — 1 hour (3600s) until midnight
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 25, 23, 0, 0));

    const { providers } = setup({
      challenge: { ...TEST_CHALLENGE, completed: true },
    });
    const { component } = await createComponent(DailyChallengePage, {
      providers,
    });
    expect(component.countdown()).toBe(3600);
  });
});
