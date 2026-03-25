import { signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  LucideIconConfig,
  LucideIconProvider,
  LUCIDE_ICONS,
} from 'lucide-angular';
import { vi } from 'vitest';
import { createComponent, getMockProvider } from '../../../testing/test-utils';
import { CampaignPage } from './campaign';
import { GameProgressionService } from '../../core/progression/game-progression.service';
import { CURRICULUM } from '../../core/curriculum/curriculum.data';
import { APP_ICONS } from '../../shared/icons';
import type { ChapterId, StoryMission } from '../../core/curriculum/curriculum.types';

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

const CHAPTER_1: StoryMission = CURRICULUM[0].chapters[0];

interface SetupOptions {
  completedMissions?: Set<ChapterId>;
  currentMission?: StoryMission | null;
}

async function setup(options: SetupOptions = {}) {
  const {
    completedMissions = new Set<ChapterId>(),
    currentMission = CHAPTER_1,
  } = options;

  const completedSignal = signal<ReadonlySet<ChapterId>>(completedMissions);
  const navigateFn = vi.fn();

  const isMissionAvailable = (chapterId: ChapterId): boolean => {
    const allMissions = CURRICULUM.flatMap((p) => p.chapters);
    const mission = allMissions.find((m) => m.chapterId === chapterId);
    if (!mission) return false;
    if (completedSignal().has(chapterId)) return true;
    return mission.deps.every((dep) => completedSignal().has(dep));
  };

  const result = await createComponent(CampaignPage, {
    providers: [
      ...ICON_PROVIDERS,
      getMockProvider(GameProgressionService, {
        completedMissions: completedSignal,
        completedMissionCount: signal(completedMissions.size),
        isMissionCompleted: (id: ChapterId) => completedSignal().has(id),
        isMissionAvailable,
        currentMission: signal(currentMission),
      }),
      getMockProvider(Router, {
        navigate: navigateFn,
      }),
    ],
  });

  return { ...result, navigateFn };
}

describe('CampaignPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create the component', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
  });

  it('should render "Campaign" heading', async () => {
    const { element } = await setup();
    const h1 = element.querySelector('h1');
    expect(h1?.textContent).toContain('Campaign');
  });

  it('should render all 6 phase groups', async () => {
    const { element } = await setup();
    const phaseHeaders = element.querySelectorAll('.campaign__phase-header');
    expect(phaseHeaders.length).toBe(6);
  });

  it('should show correct phase names', async () => {
    const { element } = await setup();
    const phaseNames = element.querySelectorAll('.campaign__phase-name');
    const names = Array.from(phaseNames).map((el) => el.textContent?.trim());
    expect(names).toContain('Phase 1: Foundations');
    expect(names).toContain('Phase 2: Navigation');
    expect(names).toContain('Phase 3: Data Input');
    expect(names).toContain('Phase 4: Shared Systems');
    expect(names).toContain('Phase 5: Data Processing');
    expect(names).toContain('Phase 6: Advanced');
  });

  it('should show progress counts in phase headers', async () => {
    const completedPhase1 = new Set<ChapterId>([1, 2, 3]);
    const { element } = await setup({ completedMissions: completedPhase1 });
    const progressLabels = element.querySelectorAll('.campaign__phase-progress');
    const firstPhaseProgress = progressLabels[0]?.textContent?.trim();
    expect(firstPhaseProgress).toContain('3');
    expect(firstPhaseProgress).toContain('10');
  });

  it('should render 34 mission cards total', async () => {
    const { element } = await setup();
    const cards = element.querySelectorAll('nx-mission-card');
    expect(cards.length).toBe(34);
  });

  it('should show completed state for completed missions', async () => {
    const completedSet = new Set<ChapterId>([1]);
    const { element } = await setup({ completedMissions: completedSet });
    const cards = element.querySelectorAll('nx-mission-card');
    const firstCard = cards[0];
    expect(firstCard?.classList.contains('mission-card--completed')).toBe(true);
  });

  it('should show locked state for unavailable missions', async () => {
    const { element } = await setup({ completedMissions: new Set() });
    const cards = element.querySelectorAll('nx-mission-card');
    // Chapter 3 depends on chapter 2 which is not completed, so it should be locked
    const chapter3Card = cards[2];
    expect(chapter3Card?.classList.contains('mission-card--locked')).toBe(true);
  });

  it('should show current state for the current mission', async () => {
    const { element } = await setup({
      completedMissions: new Set(),
      currentMission: CHAPTER_1,
    });
    const cards = element.querySelectorAll('nx-mission-card');
    const firstCard = cards[0];
    expect(firstCard?.classList.contains('mission-card--current')).toBe(true);
  });

  it('should navigate on click of unlocked mission card', async () => {
    const { element, fixture, navigateFn } = await setup({
      completedMissions: new Set(),
      currentMission: CHAPTER_1,
    });
    const cards = element.querySelectorAll('nx-mission-card');
    const firstCard = cards[0] as HTMLElement;
    firstCard.click();
    fixture.detectChanges();
    expect(navigateFn).toHaveBeenCalledWith(['/mission', 1]);
  });

  it('should NOT navigate on click of locked mission card', async () => {
    const { element, fixture, navigateFn } = await setup({
      completedMissions: new Set(),
    });
    const cards = element.querySelectorAll('nx-mission-card');
    // Chapter 3 is locked (deps not met)
    const lockedCard = cards[2] as HTMLElement;
    lockedCard.click();
    fixture.detectChanges();
    expect(navigateFn).not.toHaveBeenCalled();
  });

  it('should show overall progress with completed count', async () => {
    const completedSet = new Set<ChapterId>([1, 2, 3, 4, 5]);
    const { element } = await setup({ completedMissions: completedSet });
    const overview = element.querySelector('.campaign__overview');
    expect(overview?.textContent).toContain('5');
    expect(overview?.textContent).toContain('34');
  });

  it('should show empty state with chapter 1 as current and others locked', async () => {
    const { element } = await setup({
      completedMissions: new Set(),
      currentMission: CHAPTER_1,
    });
    const cards = element.querySelectorAll('nx-mission-card');

    // Chapter 1 is current (not locked)
    expect(cards[0]?.classList.contains('mission-card--current')).toBe(true);
    expect(cards[0]?.classList.contains('mission-card--locked')).toBe(false);

    // Chapter 2 is locked (depends on chapter 1)
    expect(cards[1]?.classList.contains('mission-card--locked')).toBe(true);
  });
});
