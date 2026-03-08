import {
  LucideIconConfig,
  LucideIconProvider,
  LUCIDE_ICONS,
} from 'lucide-angular';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of } from 'rxjs';
import { createComponent, getMockProvider } from '../../../testing/test-utils';
import { LevelSelectPage } from './level-select';
import { LevelLoaderService } from '../../core/levels/level-loader.service';
import { LevelProgressionService } from '../../core/levels/level-progression.service';
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

  // 3. Group levels by tier
  it('should group levels by tier', async () => {
    const { element } = await setup();
    const sections = element.querySelectorAll('.level-select__tier-group');
    expect(sections.length).toBe(2);
    // Basic section has 2 level buttons, Intermediate section has 2
    const firstButtons = sections[0].querySelectorAll('.level-select__level-btn');
    const secondButtons = sections[1].querySelectorAll('.level-select__level-btn');
    expect(firstButtons.length).toBe(2);
    expect(secondButtons.length).toBe(2);
  });

  // 4. Display level title and order number
  it('should display level title and order number', async () => {
    const { element } = await setup();
    const buttons = element.querySelectorAll('.level-select__level-btn');
    expect(buttons[0].textContent).toContain('1');
    expect(buttons[0].textContent).toContain('Minimal Component');
    expect(buttons[1].textContent).toContain('2');
    expect(buttons[1].textContent).toContain('Template Binding');
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
    const scores = element.querySelectorAll('.level-select__level-score');
    expect(scores[0].textContent).toContain('500');
  });

  // 7. Show "--" for unplayed levels
  it('should show "--" for unplayed levels', async () => {
    const { element } = await setup({
      getLevel: () => null,
    });
    const scores = element.querySelectorAll('.level-select__level-score');
    expect(scores[0].textContent).toContain('--');
  });

  // 8. Wrap locked levels in LockedContentComponent
  it('should wrap locked levels in LockedContentComponent', async () => {
    const { element } = await setup({
      isLevelUnlocked: (id: string) => id.includes('basic'),
    });
    // Intermediate levels are locked
    const sections = element.querySelectorAll('.level-select__tier-group');
    const intermediateSection = sections[1];
    const lockedOverlays = intermediateSection.querySelectorAll(
      '.locked-content__overlay',
    );
    expect(lockedOverlays.length).toBe(2);
  });

  // 9. Not wrap unlocked levels in locked state
  it('should not wrap unlocked levels in locked state', async () => {
    const { element } = await setup({
      isLevelUnlocked: () => true,
    });
    const overlays = element.querySelectorAll('.locked-content__overlay');
    expect(overlays.length).toBe(0);
  });

  // 10. Navigate to level route on unlocked level click
  it('should navigate to level route on unlocked level click', async () => {
    const { element, fixture } = await setup({
      isLevelUnlocked: () => true,
    });
    const btn = element.querySelector('.level-select__level-btn') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();

    const router = fixture.debugElement.injector.get(Router);
    expect(router.navigate).toHaveBeenCalledWith([
      '/minigames',
      'module-assembly',
      'level',
      'ma-basic-01',
    ]);
  });

  // 11. Not navigate on locked level click (disabled button)
  it('should not navigate on locked level click', async () => {
    const { element, fixture } = await setup({
      isLevelUnlocked: (id: string) => id.includes('basic'),
    });
    const sections = element.querySelectorAll('.level-select__tier-group');
    const lockedBtn = sections[1].querySelector(
      '.level-select__level-btn',
    ) as HTMLButtonElement;
    expect(lockedBtn.disabled).toBe(true);
    lockedBtn.click();
    fixture.detectChanges();

    const router = fixture.debugElement.injector.get(Router);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  // 12. Render replay mode tabs
  it('should render replay mode tabs', async () => {
    const { element } = await setup();
    const tabs = element.querySelectorAll('[role="tab"]');
    expect(tabs.length).toBe(4);
    const labels = Array.from(tabs).map((t) => t.textContent?.trim());
    expect(labels).toEqual(['Story', 'Endless', 'Speed Run', 'Daily']);
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

  // 17. Show empty state when no levels
  it('should show empty state when no levels', async () => {
    const { element } = await setup({ levels: [] });
    const empty = element.querySelector('.level-select__empty');
    expect(empty).toBeTruthy();
    expect(empty!.textContent).toContain('No levels available');
  });
});
