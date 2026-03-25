import {
  LucideIconConfig,
  LucideIconProvider,
  LUCIDE_ICONS,
} from 'lucide-angular';
import { Router } from '@angular/router';
import { createComponent, getMockProvider } from '../../../testing/test-utils';
import { MinigameHubPage } from './minigame-hub';
import { MinigameRegistryService } from '../../core/minigame/minigame-registry.service';
import { GameProgressionService } from '../../core/progression/game-progression.service';
import { MasteryService } from '../../core/progression/mastery.service';
import { LevelProgressionService } from '../../core/levels/level-progression.service';
import { APP_ICONS } from '../../shared/icons';
import type { MinigameConfig } from '../../core/minigame/minigame.types';
import { DifficultyTier } from '../../core/minigame/minigame.types';
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

const MOCK_GAMES: MinigameConfig[] = [
  {
    id: 'module-assembly',
    name: 'Module Assembly',
    description: 'Conveyor belt drag-and-drop assembly',
    angularTopic: 'Components',
    totalLevels: 18,
    difficultyTiers: [DifficultyTier.Basic, DifficultyTier.Intermediate, DifficultyTier.Advanced, DifficultyTier.Boss],
  },
  {
    id: 'signal-corps',
    name: 'Signal Corps',
    description: 'Tower defense',
    angularTopic: 'Components',
    totalLevels: 18,
    difficultyTiers: [DifficultyTier.Basic, DifficultyTier.Intermediate, DifficultyTier.Advanced, DifficultyTier.Boss],
  },
  {
    id: 'corridor-runner',
    name: 'Corridor Runner',
    description: 'Maze navigation',
    angularTopic: 'Routing',
    totalLevels: 18,
    difficultyTiers: [DifficultyTier.Basic, DifficultyTier.Intermediate, DifficultyTier.Advanced, DifficultyTier.Boss],
  },
];

function makeLevelProgress(overrides: Partial<LevelProgress> = {}): LevelProgress {
  return {
    levelId: 'test-level',
    completed: false,
    bestScore: 0,
    starRating: 0,
    perfect: false,
    attempts: 0,
    ...overrides,
  };
}

function setup(overrides: {
  getAllGames?: MinigameConfig[];
  isMinigameUnlocked?: (id: string) => boolean;
  getMastery?: (id: string) => number;
  getLevelProgress?: (id: string) => readonly LevelProgress[];
} = {}) {
  const {
    getAllGames = MOCK_GAMES,
    isMinigameUnlocked = () => true,
    getMastery = () => 0,
    getLevelProgress = () => [],
  } = overrides;

  const navigateFn = vi.fn();

  return createComponent(MinigameHubPage, {
    providers: [
      ...ICON_PROVIDERS,
      getMockProvider(MinigameRegistryService, {
        getAllGames: vi.fn().mockReturnValue(getAllGames),
      }),
      getMockProvider(GameProgressionService, {
        isMinigameUnlocked: vi.fn().mockImplementation(isMinigameUnlocked),
      }),
      getMockProvider(MasteryService, {
        getMastery: vi.fn().mockImplementation(getMastery),
      }),
      getMockProvider(LevelProgressionService, {
        getLevelProgress: vi.fn().mockImplementation(getLevelProgress),
      }),
      getMockProvider(Router, {
        navigate: navigateFn,
      }),
    ],
  });
}

describe('MinigameHubPage', () => {
  // 1. Basic smoke test
  it('should create the component', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
  });

  // 2. Render a card for each minigame
  it('should render a card for each minigame from the registry', async () => {
    const { element } = await setup();
    const cards = element.querySelectorAll('nx-minigame-card');
    expect(cards.length).toBe(3);
  });

  // 3. Display game name and Angular topic
  it('should display game name and Angular topic on each card', async () => {
    const { element } = await setup();
    const cards = element.querySelectorAll('nx-minigame-card');

    expect(cards[0].querySelector('.minigame-card__name')?.textContent).toContain('Module Assembly');
    expect(cards[0].querySelector('.minigame-card__topic')?.textContent).toContain('Components');
    expect(cards[2].querySelector('.minigame-card__name')?.textContent).toContain('Corridor Runner');
    expect(cards[2].querySelector('.minigame-card__topic')?.textContent).toContain('Routing');
  });

  // 4. Render MasteryStarsComponent for each card
  it('should render MasteryStarsComponent for each card', async () => {
    const { element } = await setup({
      getMastery: (id: string) => (id === 'module-assembly' ? 3 : 0),
    });
    const starEls = element.querySelectorAll('nx-mastery-stars');
    expect(starEls.length).toBe(3);
  });

  // 5. Show locked overlay with mission-based unlock message
  it('should show locked overlay with mission-based unlock message', async () => {
    const { element } = await setup({
      isMinigameUnlocked: (id: string) => id !== 'corridor-runner',
    });
    const cards = element.querySelectorAll('nx-minigame-card');
    // corridor-runner is the 3rd card (index 2)
    const overlay = cards[2].querySelector('.locked-content__overlay');
    expect(overlay).toBeTruthy();
    expect(overlay!.textContent).toContain('Complete mission: Station Map');
  });

  // 6. No locked overlay for unlocked games
  it('should not show locked overlay for unlocked games', async () => {
    const { element } = await setup({
      isMinigameUnlocked: () => true,
    });
    const overlays = element.querySelectorAll('.locked-content__overlay');
    expect(overlays.length).toBe(0);
  });

  // 7. Display levels completed / total
  it('should display levels completed / total', async () => {
    const progress: LevelProgress[] = Array.from({ length: 18 }, (_, i) =>
      makeLevelProgress({
        levelId: `ma-${i}`,
        completed: i < 3,
        bestScore: i < 3 ? 100 : 0,
      }),
    );
    const { element } = await setup({
      getLevelProgress: (id: string) => (id === 'module-assembly' ? progress : []),
    });
    const cards = element.querySelectorAll('nx-minigame-card');
    expect(cards[0].querySelector('.minigame-card__stats')?.textContent).toContain('3/18 levels');
  });

  // 9. Filter by topic
  it('should filter by topic', async () => {
    const { component, element, fixture } = await setup();
    component.topicFilter.set('Routing');
    fixture.detectChanges();
    const cards = element.querySelectorAll('nx-minigame-card');
    expect(cards.length).toBe(1);
    expect(cards[0].textContent).toContain('Corridor Runner');
  });

  // 10. Filter by mastery level (>= semantics)
  it('should filter by mastery level (>= semantics)', async () => {
    const { component, element, fixture } = await setup({
      getMastery: (id: string) => {
        if (id === 'module-assembly') return 4;
        if (id === 'signal-corps') return 1;
        return 0;
      },
    });
    component.masteryFilter.set(3);
    fixture.detectChanges();
    const cards = element.querySelectorAll('nx-minigame-card');
    expect(cards.length).toBe(1);
    expect(cards[0].textContent).toContain('Module Assembly');
  });

  // 11. Show all games when filters reset
  it('should show all games when filters are reset to "All"', async () => {
    const { component, element, fixture } = await setup();
    component.topicFilter.set('Routing');
    fixture.detectChanges();
    expect(element.querySelectorAll('nx-minigame-card').length).toBe(1);

    component.topicFilter.set('');
    component.masteryFilter.set(-1);
    fixture.detectChanges();
    expect(element.querySelectorAll('nx-minigame-card').length).toBe(3);
  });

  // 12. Navigate to /minigames/:gameId on unlocked card click
  it('should navigate to /minigames/:gameId when unlocked card is clicked', async () => {
    const { element, fixture } = await setup({
      isMinigameUnlocked: () => true,
    });
    const card = element.querySelector('nx-minigame-card') as HTMLElement;
    card.click();
    fixture.detectChanges();

    const router = fixture.debugElement.injector.get(Router);
    expect(router.navigate).toHaveBeenCalledWith(['/minigames', 'module-assembly']);
  });

  // 13. Should NOT navigate when locked card is clicked
  it('should not navigate when locked card is clicked', async () => {
    const { element, fixture } = await setup({
      isMinigameUnlocked: (id: string) => id !== 'corridor-runner',
    });
    const cards = element.querySelectorAll('nx-minigame-card');
    // corridor-runner is card at index 2
    (cards[2] as HTMLElement).click();
    fixture.detectChanges();

    const router = fixture.debugElement.injector.get(Router);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  // 14. Render page heading
  it('should render page heading "Minigame Hub"', async () => {
    const { element } = await setup();
    const h1 = element.querySelector('h1');
    expect(h1?.textContent).toContain('Minigame Hub');
  });

  // 15. Populate topic dropdown with distinct sorted topics
  it('should populate topic dropdown with distinct sorted topics', async () => {
    const { element } = await setup();
    const selects = element.querySelectorAll('select');
    const topicSelect = selects[0];
    const options = topicSelect.querySelectorAll('option');
    const texts = Array.from(options).map(o => o.textContent?.trim());
    expect(texts).toEqual(['All Topics', 'Components', 'Routing']);
  });
});
