import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { LucideIconConfig, LucideIconProvider, LUCIDE_ICONS } from 'lucide-angular';
import { of } from 'rxjs';
import { createComponent, getMockProvider } from '../../../testing/test-utils';
import { APP_ICONS } from '../../shared/icons';
import { RefresherChallengePage } from './refresher';
import {
  RefresherChallengeService,
  type RefresherChallenge,
} from '../../core/progression/refresher-challenge.service';
import { SpacedRepetitionService } from '../../core/progression/spaced-repetition.service';
import { MinigameRegistryService } from '../../core/minigame/minigame-registry.service';
import type { MinigameConfig } from '../../core/minigame/minigame.types';
import { DifficultyTier } from '../../core/minigame/minigame.types';

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

const TEST_CHALLENGE: RefresherChallenge = {
  topicId: 'module-assembly',
  questions: 4,
  gameId: 'module-assembly',
  microLevelIds: ['ma-basic-01', 'ma-basic-02', 'ma-basic-03', 'ma-inter-01'],
  restoredStars: 1,
};

function mockActivatedRoute(params: Record<string, string> = {}) {
  return {
    provide: ActivatedRoute,
    useValue: { paramMap: of(convertToParamMap(params)) },
  };
}

/** Flush microtasks so .then() callbacks resolve. */
function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

interface SetupOptions {
  topicId?: string;
  challenge?: RefresherChallenge | null;
  challengeError?: Error;
  beforeMastery?: number;
  afterMastery?: number;
  config?: MinigameConfig | undefined;
}

function setup(options: SetupOptions = {}) {
  const {
    topicId = 'module-assembly',
    challenge = TEST_CHALLENGE,
    challengeError,
    beforeMastery = 2,
    afterMastery = 3,
    config = TEST_CONFIG,
  } = options;

  let mastery = beforeMastery;
  const generateRefresher = challengeError
    ? vi.fn().mockRejectedValue(challengeError)
    : vi.fn().mockResolvedValue(challenge);

  const completeRefresher = vi.fn().mockImplementation(() => {
    mastery = afterMastery;
    return true;
  });

  const getEffectiveMastery = vi.fn().mockImplementation(() => mastery);

  const providers = [
    provideRouter([]),
    ...ICON_PROVIDERS,
    mockActivatedRoute(topicId ? { topicId } : {}),
    getMockProvider(RefresherChallengeService, {
      generateRefresher,
      completeRefresher,
    }),
    getMockProvider(SpacedRepetitionService, {
      getEffectiveMastery,
    }),
    getMockProvider(MinigameRegistryService, {
      getConfig: vi.fn((id: string) => (id === config?.id ? config : undefined)),
    }),
  ];

  return { providers, generateRefresher, completeRefresher, getEffectiveMastery };
}

describe('RefresherChallengePage', () => {
  // 1. Component creation
  it('should create the component', async () => {
    const { providers } = setup();
    const { component } = await createComponent(RefresherChallengePage, {
      providers,
    });
    expect(component).toBeTruthy();
  });

  // 2. Loading state
  it('should show loading spinner while generateRefresher is pending', async () => {
    let resolveChallenge!: (value: RefresherChallenge | null) => void;
    const pendingPromise = new Promise<RefresherChallenge | null>((resolve) => {
      resolveChallenge = resolve;
    });

    const { providers } = setup();
    // Override generateRefresher to return a pending promise
    const refresherService = providers.find(
      (p: any) => p?.provide === RefresherChallengeService,
    ) as any;
    refresherService.useValue.generateRefresher = vi.fn().mockReturnValue(pendingPromise);

    const { element } = await createComponent(RefresherChallengePage, {
      providers,
    });

    const spinner = element.querySelector('nx-loading-spinner');
    expect(spinner).toBeTruthy();

    // Clean up
    resolveChallenge(null);
  });

  // 3. Not-degrading state
  it('should show "All caught up!" when generateRefresher returns null', async () => {
    const { providers } = setup({ challenge: null });
    const { fixture, element } = await createComponent(RefresherChallengePage, {
      providers,
    });
    await flushMicrotasks();
    fixture.detectChanges();
    expect(element.textContent).toContain('All caught up!');
  });

  // 4. Not-degrading back link
  it('should show "Back to Dashboard" link in not-degrading state', async () => {
    const { providers } = setup({ challenge: null });
    const { fixture, element } = await createComponent(RefresherChallengePage, {
      providers,
    });
    await flushMicrotasks();
    fixture.detectChanges();
    const link = element.querySelector('a[href="/dashboard"]');
    expect(link).toBeTruthy();
    expect(link?.textContent).toContain('Back to Dashboard');
  });

  // 5. Playing state - topic name
  it('should display challenge topic name from MinigameRegistryService', async () => {
    const { providers } = setup();
    const { fixture, element } = await createComponent(RefresherChallengePage, {
      providers,
    });
    await flushMicrotasks();
    fixture.detectChanges();
    expect(element.textContent).toContain('Module Assembly');
  });

  // 6. Playing state - micro-level count
  it('should display the correct number of micro-levels', async () => {
    const { providers } = setup();
    const { fixture, element } = await createComponent(RefresherChallengePage, {
      providers,
    });
    await flushMicrotasks();
    fixture.detectChanges();
    const levelItems = element.querySelectorAll('.refresher__level-item');
    expect(levelItems.length).toBe(4);
  });

  // 7. Playing state - progress tracking
  it('should track current progress', async () => {
    const { providers } = setup();
    const { fixture, element } = await createComponent(RefresherChallengePage, {
      providers,
    });
    await flushMicrotasks();
    fixture.detectChanges();

    // Initially 0 of 4 completed
    expect(element.textContent).toContain('0 of 4 completed');

    // Click first "Complete" button
    const buttons = element.querySelectorAll<HTMLButtonElement>('.refresher__complete-btn');
    buttons[0].click();
    fixture.detectChanges();

    expect(element.textContent).toContain('1 of 4 completed');
  });

  // 8. Level completion - clicking Complete advances progress
  it('should advance progress when clicking Complete on a micro-level', async () => {
    const { providers } = setup();
    const { fixture, element } = await createComponent(RefresherChallengePage, {
      providers,
    });
    await flushMicrotasks();
    fixture.detectChanges();

    const buttons = element.querySelectorAll<HTMLButtonElement>('.refresher__complete-btn');
    expect(buttons.length).toBe(4);

    buttons[0].click();
    fixture.detectChanges();

    // First button should be gone (replaced by "Done")
    const updatedButtons = element.querySelectorAll<HTMLButtonElement>('.refresher__complete-btn');
    expect(updatedButtons.length).toBe(3);
  });

  // 9. Challenge completion - completeRefresher called
  it('should call completeRefresher when all micro-levels are completed', async () => {
    const { providers, completeRefresher } = setup();
    const { fixture, element } = await createComponent(RefresherChallengePage, {
      providers,
    });
    await flushMicrotasks();
    fixture.detectChanges();

    // Complete all 4 levels
    for (let i = 0; i < 4; i++) {
      const btn = element.querySelector<HTMLButtonElement>('.refresher__complete-btn');
      expect(btn).toBeTruthy();
      btn!.click();
      fixture.detectChanges();
    }

    expect(completeRefresher).toHaveBeenCalledWith('module-assembly');
  });

  // 10. Completed state - mastery restoration display
  it('should show mastery restoration result with before/after stars', async () => {
    const { providers } = setup({ beforeMastery: 2, afterMastery: 3 });
    const { fixture, element } = await createComponent(RefresherChallengePage, {
      providers,
    });
    await flushMicrotasks();
    fixture.detectChanges();

    // Complete all levels
    for (let i = 0; i < 4; i++) {
      const btn = element.querySelector<HTMLButtonElement>('.refresher__complete-btn');
      btn!.click();
      fixture.detectChanges();
    }

    expect(element.textContent).toContain('2');
    expect(element.textContent).toContain('3');
    const masteryStars = element.querySelectorAll('nx-mastery-stars');
    expect(masteryStars.length).toBeGreaterThanOrEqual(2);
  });

  // 11. Completed state - back link
  it('should show "Back to Dashboard" link in completed state', async () => {
    const { providers } = setup();
    const { fixture, element } = await createComponent(RefresherChallengePage, {
      providers,
    });
    await flushMicrotasks();
    fixture.detectChanges();

    // Complete all levels
    for (let i = 0; i < 4; i++) {
      const btn = element.querySelector<HTMLButtonElement>('.refresher__complete-btn');
      btn!.click();
      fixture.detectChanges();
    }

    const link = element.querySelector('a[href="/dashboard"]');
    expect(link).toBeTruthy();
    expect(link?.textContent).toContain('Back to Dashboard');
  });

  // 12. Error state
  it('should show error message when generateRefresher throws', async () => {
    const { providers } = setup({
      challengeError: new Error('Network failure'),
    });
    const { fixture, element } = await createComponent(RefresherChallengePage, {
      providers,
    });
    await flushMicrotasks();
    fixture.detectChanges();
    const errorState = element.querySelector('nx-error-state');
    expect(errorState).toBeTruthy();
  });

  // 13. Error state - retry
  it('should allow retry on error', async () => {
    const { providers, generateRefresher } = setup({
      challengeError: new Error('Network failure'),
    });
    const { fixture, element } = await createComponent(RefresherChallengePage, {
      providers,
    });
    await flushMicrotasks();
    fixture.detectChanges();

    // Now make the next call succeed
    generateRefresher.mockResolvedValue(TEST_CHALLENGE);

    const retryBtn = element.querySelector<HTMLButtonElement>('.error-state__retry-btn');
    expect(retryBtn).toBeTruthy();
    retryBtn!.click();
    fixture.detectChanges();
    await flushMicrotasks();
    fixture.detectChanges();

    // After retry, should be in playing state
    expect(generateRefresher).toHaveBeenCalledTimes(2);
  });

  // 14. Empty topicId
  it('should handle missing route param gracefully (not-degrading state)', async () => {
    const { providers } = setup({ topicId: '' });
    const { element } = await createComponent(RefresherChallengePage, {
      providers,
    });
    expect(element.textContent).toContain('All caught up!');
  });
});
