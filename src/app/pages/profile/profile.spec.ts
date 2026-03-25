import { signal } from '@angular/core';
import {
  LucideIconConfig,
  LucideIconProvider,
  LUCIDE_ICONS,
} from 'lucide-angular';
import { createComponent, getMockProvider } from '../../../testing/test-utils';
import { ProfilePage } from './profile';
import { XpService } from '../../core/progression/xp.service';
import { StreakService } from '../../core/progression/streak.service';
import { PlayTimeService } from '../../core/progression/play-time.service';
import { GameProgressionService, type CampaignProgress } from '../../core/progression/game-progression.service';
import { MinigameRegistryService } from '../../core/minigame/minigame-registry.service';
import { SpacedRepetitionService } from '../../core/progression/spaced-repetition.service';
import { AchievementService, type Achievement } from '../../core/progression/achievement.service';
import { APP_ICONS } from '../../shared/icons';
import type { MinigameConfig, MinigameId } from '../../core/minigame/minigame.types';
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

const MOCK_GAMES: MinigameConfig[] = [
  {
    id: 'blast-doors',
    name: 'Blast Doors',
    description: 'State machine programming',
    angularTopic: 'Lifecycle Hooks & Custom Directives',
    totalLevels: 18,
    difficultyTiers: [DifficultyTier.Basic],
  },
  {
    id: 'corridor-runner',
    name: 'Corridor Runner',
    description: 'Maze navigation',
    angularTopic: 'Routing',
    totalLevels: 18,
    difficultyTiers: [DifficultyTier.Basic],
  },
  {
    id: 'data-relay',
    name: 'Data Relay',
    description: 'Stream transformer',
    angularTopic: 'Pipes',
    totalLevels: 18,
    difficultyTiers: [DifficultyTier.Basic],
  },
  {
    id: 'deep-space-radio',
    name: 'Deep Space Radio',
    description: 'Message management',
    angularTopic: 'HTTP Client & Interceptors',
    totalLevels: 18,
    difficultyTiers: [DifficultyTier.Basic],
  },
  {
    id: 'flow-commander',
    name: 'Flow Commander',
    description: 'Traffic controller',
    angularTopic: 'Control Flow (@if, @for, @switch)',
    totalLevels: 18,
    difficultyTiers: [DifficultyTier.Basic],
  },
  {
    id: 'module-assembly',
    name: 'Module Assembly',
    description: 'Conveyor belt drag-and-drop',
    angularTopic: 'Components',
    totalLevels: 18,
    difficultyTiers: [DifficultyTier.Basic],
  },
  {
    id: 'power-grid',
    name: 'Power Grid',
    description: 'Circuit board puzzle',
    angularTopic: 'Services & Dependency Injection',
    totalLevels: 18,
    difficultyTiers: [DifficultyTier.Basic],
  },
  {
    id: 'reactor-core',
    name: 'Reactor Core',
    description: 'Reactive circuit design',
    angularTopic: 'Signals',
    totalLevels: 21,
    difficultyTiers: [DifficultyTier.Basic],
  },
  {
    id: 'signal-corps',
    name: 'Signal Corps',
    description: 'Tower defense',
    angularTopic: 'Input/Output Properties',
    totalLevels: 18,
    difficultyTiers: [DifficultyTier.Basic],
  },
  {
    id: 'system-certification',
    name: 'System Certification',
    description: 'Test writing challenge',
    angularTopic: 'Testing',
    totalLevels: 18,
    difficultyTiers: [DifficultyTier.Basic],
  },
  {
    id: 'terminal-hack',
    name: 'Terminal Hack',
    description: 'Timed form reconstruction',
    angularTopic: 'Forms (template-driven and reactive)',
    totalLevels: 21,
    difficultyTiers: [DifficultyTier.Basic],
  },
  {
    id: 'wire-protocol',
    name: 'Wire Protocol',
    description: 'Wiring puzzle',
    angularTopic: 'Data Binding (interpolation, property, event, two-way)',
    totalLevels: 18,
    difficultyTiers: [DifficultyTier.Basic],
  },
];

function setup(overrides: {
  currentRank?: string;
  totalXp?: number;
  activeStreakDays?: number;
  streakMultiplier?: number;
  totalPlayTime?: number;
  sessionActive?: boolean;
  getCampaignProgress?: () => CampaignProgress;
  getAllGames?: MinigameConfig[];
  getEffectiveMastery?: (id: MinigameId) => number;
} = {}) {
  const {
    currentRank = 'Cadet',
    totalXp = 0,
    activeStreakDays = 0,
    streakMultiplier = 1.0,
    totalPlayTime = 0,
    sessionActive = false,
    getCampaignProgress = () => ({
      completedMissions: 0,
      totalMissions: 34,
      currentPhase: null,
    }),
    getAllGames = MOCK_GAMES,
    getEffectiveMastery = () => 0,
  } = overrides;

  return createComponent(ProfilePage, {
    providers: [
      ...ICON_PROVIDERS,
      getMockProvider(XpService, {
        currentRank: signal(currentRank),
        totalXp: signal(totalXp),
      }),
      getMockProvider(StreakService, {
        activeStreakDays: signal(activeStreakDays),
        streakMultiplier: signal(streakMultiplier),
      }),
      getMockProvider(PlayTimeService, {
        totalPlayTime: signal(totalPlayTime),
        sessionActive: signal(sessionActive),
      }),
      getMockProvider(GameProgressionService, {
        getCampaignProgress: vi.fn().mockReturnValue(getCampaignProgress()),
      }),
      getMockProvider(MinigameRegistryService, {
        getAllGames: vi.fn().mockReturnValue(getAllGames),
      }),
      getMockProvider(SpacedRepetitionService, {
        getEffectiveMastery: vi.fn().mockImplementation(getEffectiveMastery),
      }),
      getMockProvider(AchievementService, {
        achievements: signal<readonly Achievement[]>([]),
        earnedCount: signal(0),
      }),
    ],
  });
}

describe('ProfilePage', () => {
  // 1. Smoke test
  it('should create the component', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
  });

  // 2. Display the current rank name
  it('should display the current rank name', async () => {
    const { element } = await setup({ currentRank: 'Commander' });
    const rankName = element.querySelector('.profile__rank-name');
    expect(rankName?.textContent).toContain('Commander');
  });

  // 3. Display total XP
  it('should display total XP', async () => {
    const { element } = await setup({ totalXp: 3500 });
    const totalXp = element.querySelector('.profile__total-xp');
    expect(totalXp?.textContent).toContain('3,500 XP');
  });

  // 4. Render XpProgressBarComponent in full variant
  it('should render XpProgressBarComponent in full variant', async () => {
    const { element } = await setup({ totalXp: 500 });
    const progressBar = element.querySelector('nx-xp-progress-bar');
    expect(progressBar).toBeTruthy();
    expect(progressBar!.classList.contains('xp-progress-bar--full')).toBe(true);
  });

  // 5. Display streak counter with active streak
  it('should display streak counter with active streak', async () => {
    const { element } = await setup({
      activeStreakDays: 3,
      streakMultiplier: 1.3,
    });
    const badge = element.querySelector('nx-streak-badge');
    expect(badge).toBeTruthy();
  });

  // 6. Hide streak badge when streak is 0
  it('should hide streak badge when streak is 0', async () => {
    const { element } = await setup({ activeStreakDays: 0 });
    const badge = element.querySelector('nx-streak-badge');
    expect(badge).toBeNull();
  });

  // 7. Display total play time
  it('should display total play time', async () => {
    const { element } = await setup({ totalPlayTime: 7200 });
    const playTimeCard = element.querySelector('.profile__stat-card--play-time');
    expect(playTimeCard?.textContent).toContain('2h');
  });

  // 8. Display campaign progress
  it('should display campaign progress', async () => {
    const { element } = await setup({
      getCampaignProgress: () => ({
        completedMissions: 10,
        totalMissions: 34,
        currentPhase: 3,
      }),
    });
    const campaignCard = element.querySelector('.profile__stat-card--campaign');
    expect(campaignCard?.textContent).toContain('10 / 34');
  });

  // 9. Render mastery table with all 12 minigame topics
  it('should render mastery table with all 12 minigame topics', async () => {
    const { element } = await setup();
    const rows = element.querySelectorAll('.profile__mastery-table tbody tr');
    expect(rows.length).toBe(12);
  });

  // 10. Display effective mastery stars via MasteryStarsComponent
  it('should display effective mastery stars via MasteryStarsComponent', async () => {
    const { element } = await setup({
      getEffectiveMastery: (id: MinigameId) =>
        id === 'module-assembly' ? 3.7 : 0,
    });
    const starEls = element.querySelectorAll('nx-mastery-stars');
    expect(starEls.length).toBe(12);
  });

  // 11. Sort mastery table by topic name ascending by default
  it('should sort mastery table by topic name ascending by default', async () => {
    const { element } = await setup();
    const rows = element.querySelectorAll('.profile__mastery-table tbody tr');
    const firstRowText = rows[0]?.textContent ?? '';
    // "Blast Doors" should be first alphabetically by topic (angularTopic)
    // Topics sorted alpha: Components, Control Flow, Data Binding, Forms, HTTP, IO Props, Lifecycle, Pipes, Routing, Services, Signals, Testing
    expect(firstRowText).toContain('Components');
  });

  // 12. Toggle sort direction when clicking the same column header
  it('should toggle sort direction when clicking the same column header', async () => {
    const { element, fixture } = await setup();
    const topicHeader = element.querySelector('.profile__mastery-table th') as HTMLElement;

    // Click once — should already be ascending, clicking again toggles to descending
    topicHeader.click();
    fixture.detectChanges();

    const rows = element.querySelectorAll('.profile__mastery-table tbody tr');
    const firstRowText = rows[0]?.textContent ?? '';
    // Last alphabetically by topic: Testing
    expect(firstRowText).toContain('Testing');
  });

  // 13. Sort by stars when clicking Stars column header
  it('should sort by stars when clicking Stars column header', async () => {
    const { element, fixture } = await setup({
      getEffectiveMastery: (id: MinigameId) => {
        if (id === 'module-assembly') return 4;
        if (id === 'corridor-runner') return 2;
        return 0;
      },
    });
    const headers = element.querySelectorAll('.profile__mastery-table th');
    const starsHeader = headers[2] as HTMLElement; // Topic, Minigame, Stars
    starsHeader.click();
    fixture.detectChanges();

    const rows = element.querySelectorAll('.profile__mastery-table tbody tr');
    const firstRowText = rows[0]?.textContent ?? '';
    // Stars descending: module-assembly (4) should be first
    expect(firstRowText).toContain('Module Assembly');
  });

  // 14. Display page heading "Profile"
  it('should display page heading "Profile"', async () => {
    const { element } = await setup();
    const h1 = element.querySelector('h1');
    expect(h1?.textContent).toContain('Profile');
  });

  // 15. Display campaign progress percentage
  it('should display campaign progress percentage', async () => {
    const { element } = await setup({
      getCampaignProgress: () => ({
        completedMissions: 10,
        totalMissions: 34,
        currentPhase: 3,
      }),
    });
    const campaignCard = element.querySelector('.profile__stat-card--campaign');
    expect(campaignCard?.textContent).toContain('29%');
  });

  // 16. Render achievement grid in achievements section
  it('should render nx-achievement-grid in the achievements section', async () => {
    const { element } = await setup();
    const section = element.querySelector('.profile__achievements-section');
    const grid = section?.querySelector('nx-achievement-grid');
    expect(grid).toBeTruthy();
  });

  // 17. Display "Achievements" heading in achievements section
  it('should display "Achievements" heading in the achievements section', async () => {
    const { element } = await setup();
    const heading = element.querySelector('.profile__achievements-section h2');
    expect(heading?.textContent).toContain('Achievements');
  });
});
