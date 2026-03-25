import {
  LucideIconConfig,
  LucideIconProvider,
  LUCIDE_ICONS,
} from 'lucide-angular';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of } from 'rxjs';
import { createComponent, getMockProvider } from '../../../testing/test-utils';
import { LevelSelectPage } from './level-select';
import { LevelLoaderService } from '../../core/levels/level-loader.service';
import { LevelProgressionService } from '../../core/levels/level-progression.service';
import { LeaderboardService } from '../../core/progression/leaderboard.service';
import { MinigameRegistryService } from '../../core/minigame/minigame-registry.service';
import { LeaderboardComponent } from '../../shared/components/leaderboard/leaderboard';
import { APP_ICONS } from '../../shared/icons';
import { DifficultyTier } from '../../core/minigame/minigame.types';
import type { LevelDefinition } from '../../core/levels/level.types';
import type { LevelProgress } from '../../core/levels/level-progression.service';

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

const MOCK_LEVELS: LevelDefinition[] = [
  {
    levelId: 'ma-basic-01',
    gameId: 'module-assembly',
    tier: DifficultyTier.Basic,
    order: 1,
    title: 'Minimal Component',
    conceptIntroduced: 'Component basics',
    description: 'Create a minimal component',
    data: {},
  },
  {
    levelId: 'ma-basic-02',
    gameId: 'module-assembly',
    tier: DifficultyTier.Basic,
    order: 2,
    title: 'Template Binding',
    conceptIntroduced: 'Template syntax',
    description: 'Use template binding',
    data: {},
  },
  {
    levelId: 'ma-inter-01',
    gameId: 'module-assembly',
    tier: DifficultyTier.Intermediate,
    order: 1,
    title: 'Input Properties',
    conceptIntroduced: 'Component inputs',
    description: 'Use input properties',
    data: {},
  },
  {
    levelId: 'ma-inter-02',
    gameId: 'module-assembly',
    tier: DifficultyTier.Intermediate,
    order: 2,
    title: 'Output Events',
    conceptIntroduced: 'Component outputs',
    description: 'Use output events',
    data: {},
  },
];

function mockActivatedRoute(params: Record<string, string> = {}) {
  return {
    provide: ActivatedRoute,
    useValue: { paramMap: of(convertToParamMap(params)) },
  };
}

function setup(overrides: {
  levels?: LevelDefinition[];
  isLevelUnlocked?: (id: string) => boolean;
  getLevel?: (id: string) => LevelProgress | null;
} = {}) {
  const {
    levels = MOCK_LEVELS,
    isLevelUnlocked = (id: string) =>
      id.includes('basic'),
    getLevel = (id: string) =>
      id === 'ma-basic-01'
        ? {
            levelId: id,
            completed: true,
            bestScore: 500,
            starRating: 2,
            perfect: false,
            attempts: 1,
          }
        : null,
  } = overrides;

  const navigateFn = vi.fn();

  return createComponent(LevelSelectPage, {
    providers: [
      ...ICON_PROVIDERS,
      mockActivatedRoute({ gameId: 'module-assembly' }),
      getMockProvider(LevelLoaderService, {
        loadLevelPack: vi.fn().mockReturnValue(of(levels)),
      }),
      getMockProvider(LevelProgressionService, {
        isLevelUnlocked: vi.fn().mockImplementation(isLevelUnlocked),
        getLevel: vi.fn().mockImplementation(getLevel),
      }),
      getMockProvider(Router, {
        navigate: navigateFn,
      }),
      getMockProvider(LeaderboardService, {
        getLeaderboard: vi.fn().mockReturnValue([]),
      }),
      getMockProvider(MinigameRegistryService, {
        getConfig: vi.fn().mockImplementation((id: string) =>
          id === 'module-assembly'
            ? { id: 'module-assembly', name: 'Module Assembly' }
            : undefined,
        ),
      }),
    ],
  });
}

describe('LevelSelectPage', () => {
  // 1. Smoke test
  it('should create the component', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
  });

  // 2. Tier group headings
  it('should render tier group headings', async () => {
    const { element } = await setup();
    const badges = element.querySelectorAll('nx-tier-badge');
    expect(badges.length).toBe(2);
  });

  // 3. Group levels by tier -- uses nx-level-card instead of .level-select__level-btn
  it('should group levels by tier', async () => {
    const { element } = await setup();
    const sections = element.querySelectorAll('.level-select__tier-group');
    expect(sections.length).toBe(2);
    const firstCards = sections[0].querySelectorAll('nx-level-card');
    const secondCards = sections[1].querySelectorAll('nx-level-card');
    expect(firstCards.length).toBe(2);
    expect(secondCards.length).toBe(2);
  });

  // 4. Display level title and order number via card-internal selectors
  it('should display level title and order number', async () => {
    const { element } = await setup();
    const cards = element.querySelectorAll('nx-level-card');
    const firstCard = cards[0];
    expect(firstCard.querySelector('.level-card__number')!.textContent!.trim()).toBe('1');
    expect(firstCard.querySelector('.level-card__title')!.textContent).toContain('Minimal Component');
    const secondCard = cards[1];
    expect(secondCard.querySelector('.level-card__number')!.textContent!.trim()).toBe('2');
    expect(secondCard.querySelector('.level-card__title')!.textContent).toContain('Template Binding');
  });

  // 5. Display LevelStarsComponent for each level
  it('should display LevelStarsComponent for each level', async () => {
    const { element } = await setup();
    const stars = element.querySelectorAll('nx-level-stars');
    expect(stars.length).toBe(4);
  });

  // 6. Show best score for completed levels
  it('should show best score for completed levels', async () => {
    const { element } = await setup({
      getLevel: (id: string) =>
        id === 'ma-basic-01'
          ? {
              levelId: id,
              completed: true,
              bestScore: 500,
              starRating: 2,
              perfect: false,
              attempts: 1,
            }
          : null,
    });
    const firstCard = element.querySelector('nx-level-card')!;
    const score = firstCard.querySelector('.level-card__score');
    expect(score!.textContent).toContain('500');
  });

  // 7. Show "--" for unplayed levels
  it('should show "--" for unplayed levels', async () => {
    const { element } = await setup({
      getLevel: () => null,
    });
    const firstCard = element.querySelector('nx-level-card')!;
    const score = firstCard.querySelector('.level-card__score');
    expect(score!.textContent).toContain('--');
  });

  // 8. Locked levels have .level-card--locked class (replaces LockedContentComponent test)
  it('should apply locked class to locked level cards', async () => {
    const { element } = await setup({
      isLevelUnlocked: (id: string) => id.includes('basic'),
    });
    const sections = element.querySelectorAll('.level-select__tier-group');
    const intermediateSection = sections[1];
    const lockedCards = intermediateSection.querySelectorAll(
      'nx-level-card.level-card--locked',
    );
    expect(lockedCards.length).toBe(2);
  });

  // 9. Unlocked levels do not have locked class
  it('should not apply locked class to unlocked level cards', async () => {
    const { element } = await setup({
      isLevelUnlocked: () => true,
    });
    const lockedCards = element.querySelectorAll('nx-level-card.level-card--locked');
    expect(lockedCards.length).toBe(0);
  });

  // 10. Navigate to level route on unlocked level click
  it('should navigate to level route on unlocked level click', async () => {
    const { element, fixture } = await setup({
      isLevelUnlocked: () => true,
    });
    const card = element.querySelector('nx-level-card') as HTMLElement;
    card.click();
    fixture.detectChanges();

    const router = fixture.debugElement.injector.get(Router);
    expect(router.navigate).toHaveBeenCalledWith([
      '/minigames',
      'module-assembly',
      'level',
      'ma-basic-01',
    ]);
  });

  // 11. Not navigate on locked level click (card suppresses event)
  it('should not navigate on locked level click', async () => {
    const { element, fixture } = await setup({
      isLevelUnlocked: (id: string) => id.includes('basic'),
    });
    const sections = element.querySelectorAll('.level-select__tier-group');
    const lockedCard = sections[1].querySelector('nx-level-card') as HTMLElement;
    lockedCard.click();
    fixture.detectChanges();

    const router = fixture.debugElement.injector.get(Router);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  // 12. Render replay mode tabs (including Leaderboard)
  it('should render replay mode tabs', async () => {
    const { element } = await setup();
    const tabs = element.querySelectorAll('[role="tab"]');
    expect(tabs.length).toBe(5);
    const labels = Array.from(tabs).map((t) => t.textContent?.trim());
    expect(labels).toEqual(['Story', 'Endless', 'Speed Run', 'Daily', 'Leaderboard']);
  });

  // 13. Show Story tab as active by default
  it('should show Story tab as active by default', async () => {
    const { element } = await setup();
    const tabs = element.querySelectorAll('[role="tab"]');
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(tabs[1].getAttribute('aria-selected')).toBe('false');
  });

  // 14. Switch tabs on click
  it('should switch tabs on click', async () => {
    const { element, fixture } = await setup();
    const tabs = element.querySelectorAll('[role="tab"]');
    (tabs[1] as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    expect(tabs[0].getAttribute('aria-selected')).toBe('false');
  });

  // 15. Show mode launcher for non-story tabs
  it('should show mode launcher for non-story tabs', async () => {
    const { element, fixture } = await setup();
    const tabs = element.querySelectorAll('[role="tab"]');
    (tabs[1] as HTMLButtonElement).click();
    fixture.detectChanges();

    const launcher = element.querySelector('.level-select__mode-launcher');
    expect(launcher).toBeTruthy();
    const launchBtn = launcher!.querySelector('.level-select__launch-btn');
    expect(launchBtn).toBeTruthy();
    expect(launchBtn!.textContent).toContain('Launch Endless');
  });

  // 16. Navigate to mode route on launch
  it('should navigate to mode route on launch', async () => {
    const { element, fixture } = await setup();
    const tabs = element.querySelectorAll('[role="tab"]');
    (tabs[1] as HTMLButtonElement).click();
    fixture.detectChanges();

    const launchBtn = element.querySelector(
      '.level-select__launch-btn',
    ) as HTMLButtonElement;
    launchBtn.click();
    fixture.detectChanges();

    const router = fixture.debugElement.injector.get(Router);
    expect(router.navigate).toHaveBeenCalledWith([
      '/minigames',
      'module-assembly',
      'endless',
    ]);
  });

  // 17. Show EmptyStateComponent when no levels
  it('should show EmptyStateComponent when no levels', async () => {
    const { element } = await setup({ levels: [] });
    const emptyState = element.querySelector('nx-empty-state');
    expect(emptyState).toBeTruthy();
  });

  // 17b. Empty state title says "Levels coming soon"
  it('should display "Levels coming soon" in the empty state title', async () => {
    const { element } = await setup({ levels: [] });
    const title = element.querySelector('.empty-state__title');
    expect(title).toBeTruthy();
    expect(title!.textContent).toContain('Levels coming soon');
  });

  // 17c. Empty state message contains game name from registry
  it('should display the game name in the empty state message', async () => {
    const { element } = await setup({ levels: [] });
    const message = element.querySelector('.empty-state__message');
    expect(message).toBeTruthy();
    expect(message!.textContent).toContain('Module Assembly');
  });

  // 17d. "Back to Minigames" button navigates to /minigames
  it('should navigate to /minigames when "Back to Minigames" is clicked', async () => {
    const { element, fixture } = await setup({ levels: [] });
    const backBtn = element.querySelector('.level-select__back-btn') as HTMLButtonElement;
    expect(backBtn).toBeTruthy();
    expect(backBtn.textContent).toContain('Back to Minigames');
    backBtn.click();
    fixture.detectChanges();
    const router = fixture.debugElement.injector.get(Router);
    expect(router.navigate).toHaveBeenCalledWith(['/minigames']);
  });

  // 17e. Empty state is hidden when levels exist
  it('should not show EmptyStateComponent when levels exist', async () => {
    const { element } = await setup();
    const emptyState = element.querySelector('nx-empty-state');
    expect(emptyState).toBeNull();
  });

  // 18. Navigate to speedrun route on Speed Run mode launch
  it('should navigate to speedrun route on Speed Run mode launch', async () => {
    const { element, fixture } = await setup();
    const tabs = element.querySelectorAll('[role="tab"]');
    (tabs[2] as HTMLButtonElement).click(); // Speed Run tab (index 2)
    fixture.detectChanges();

    const launchBtn = element.querySelector('.level-select__launch-btn') as HTMLButtonElement;
    launchBtn.click();
    fixture.detectChanges();

    const router = fixture.debugElement.injector.get(Router);
    expect(router.navigate).toHaveBeenCalledWith([
      '/minigames',
      'module-assembly',
      'speedrun',
    ]);
  });

  // 19. Navigate to daily route on Daily mode launch
  it('should navigate to daily route on Daily mode launch', async () => {
    const { element, fixture } = await setup();
    const tabs = element.querySelectorAll('[role="tab"]');
    (tabs[3] as HTMLButtonElement).click(); // Daily tab (index 3)
    fixture.detectChanges();

    const launchBtn = element.querySelector('.level-select__launch-btn') as HTMLButtonElement;
    launchBtn.click();
    fixture.detectChanges();

    const router = fixture.debugElement.injector.get(Router);
    expect(router.navigate).toHaveBeenCalledWith([
      '/minigames',
      'module-assembly',
      'daily',
    ]);
  });

  // 20. Render nx-leaderboard when Leaderboard tab is active
  it('should render nx-leaderboard when Leaderboard tab is active', async () => {
    const { element, fixture } = await setup();
    const tabs = element.querySelectorAll('[role="tab"]');
    (tabs[4] as HTMLButtonElement).click(); // Leaderboard tab (index 4)
    fixture.detectChanges();

    const leaderboard = element.querySelector('nx-leaderboard');
    expect(leaderboard).toBeTruthy();

    const launcher = element.querySelector('.level-select__mode-launcher');
    expect(launcher).toBeNull();
  });

  // 21. Pass gameId to nx-leaderboard
  it('should pass gameId to nx-leaderboard', async () => {
    const { fixture } = await setup();
    const tabs = fixture.nativeElement.querySelectorAll('[role="tab"]');
    (tabs[4] as HTMLButtonElement).click();
    fixture.detectChanges();

    const leaderboardDebug = fixture.debugElement.query(By.directive(LeaderboardComponent));
    expect(leaderboardDebug).toBeTruthy();
    const leaderboardInstance = leaderboardDebug.componentInstance as LeaderboardComponent;
    expect(leaderboardInstance.gameId()).toBe('module-assembly');
  });

  // 22. Mode launcher NOT shown when Leaderboard tab is active
  it('should not show mode launcher when Leaderboard tab is active', async () => {
    const { element, fixture } = await setup();
    const tabs = element.querySelectorAll('[role="tab"]');
    (tabs[4] as HTMLButtonElement).click();
    fixture.detectChanges();

    const launcher = element.querySelector('.level-select__mode-launcher');
    expect(launcher).toBeNull();
  });

  // 23. Story levels NOT shown when Leaderboard tab is active
  it('should not show story levels when Leaderboard tab is active', async () => {
    const { element, fixture } = await setup();
    const tabs = element.querySelectorAll('[role="tab"]');
    (tabs[4] as HTMLButtonElement).click();
    fixture.detectChanges();

    const tierGroups = element.querySelectorAll('.level-select__tier-group');
    expect(tierGroups.length).toBe(0);
  });

  // 24. Leaderboard tab wrapped in leaderboard container
  it('should wrap leaderboard in a container div', async () => {
    const { element, fixture } = await setup();
    const tabs = element.querySelectorAll('[role="tab"]');
    (tabs[4] as HTMLButtonElement).click();
    fixture.detectChanges();

    const container = element.querySelector('.level-select__leaderboard');
    expect(container).toBeTruthy();
    expect(container!.querySelector('nx-leaderboard')).toBeTruthy();
  });

  // === New isCurrent tests ===

  // 25. Current level highlighted -- first unlocked uncompleted level
  it('should highlight the current level (first unlocked uncompleted)', async () => {
    const { element } = await setup({
      isLevelUnlocked: (id: string) => id.includes('basic'),
      getLevel: (id: string) =>
        id === 'ma-basic-01'
          ? {
              levelId: id,
              completed: true,
              bestScore: 500,
              starRating: 2,
              perfect: false,
              attempts: 1,
            }
          : null,
    });
    const cards = element.querySelectorAll('nx-level-card');
    // ma-basic-01 is completed, so NOT current
    expect(cards[0].classList.contains('level-card--current')).toBe(false);
    // ma-basic-02 is the first unlocked uncompleted level, so IS current
    expect(cards[1].classList.contains('level-card--current')).toBe(true);
  });

  // 26. No current level when all completed
  it('should not highlight any level when all are completed', async () => {
    const { element } = await setup({
      isLevelUnlocked: () => true,
      getLevel: (id: string) => ({
        levelId: id,
        completed: true,
        bestScore: 500,
        starRating: 3,
        perfect: false,
        attempts: 1,
      }),
    });
    const currentCards = element.querySelectorAll('nx-level-card.level-card--current');
    expect(currentCards.length).toBe(0);
  });

  // 27. Current level is the first level when none completed
  it('should highlight the first level when none are completed', async () => {
    const { element } = await setup({
      isLevelUnlocked: (id: string) => id.includes('basic'),
      getLevel: () => null,
    });
    const cards = element.querySelectorAll('nx-level-card');
    // ma-basic-01 is the first unlocked uncompleted, so IS current
    expect(cards[0].classList.contains('level-card--current')).toBe(true);
    // ma-basic-02 is NOT current (not the first)
    expect(cards[1].classList.contains('level-card--current')).toBe(false);
  });
});
