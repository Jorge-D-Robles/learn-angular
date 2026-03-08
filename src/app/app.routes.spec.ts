import { signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import {
  LucideIconConfig,
  LucideIconProvider,
  LUCIDE_ICONS,
} from 'lucide-angular';
import { routes } from './app.routes';
import { DashboardPage } from './pages/dashboard/dashboard';
import { NotFoundPage } from './pages/not-found/not-found';
import { createComponent, getMockProvider } from '../testing/test-utils';
import { XpService } from './core/progression/xp.service';
import { GameProgressionService } from './core/progression/game-progression.service';
import { DailyChallengeService } from './core/progression/daily-challenge.service';
import { SpacedRepetitionService } from './core/progression/spaced-repetition.service';
import { MasteryService } from './core/progression/mastery.service';
import { StreakService } from './core/progression/streak.service';
import { MinigameRegistryService } from './core/minigame/minigame-registry.service';
import { APP_ICONS } from './shared/icons';

describe('routes', () => {
  const expectedPaths = [
    '',
    'mission/:chapterId',
    'minigames',
    'minigames/:gameId',
    'minigames/:gameId/level/:levelId',
    'minigames/:gameId/endless',
    'minigames/:gameId/speedrun',
    'minigames/:gameId/daily',
    'profile',
    'settings',
    '**',
  ];

  it('should have 11 routes', () => {
    expect(routes.length).toBe(11);
  });

  it('should define all expected paths', () => {
    const paths = routes.map((r) => r.path);
    for (const path of expectedPaths) {
      expect(paths).toContain(path);
    }
  });

  it('should eager-load DashboardPage for the root path', () => {
    const root = routes.find((r) => r.path === '');
    expect(root?.component).toBe(DashboardPage);
  });

  it('should eager-load NotFoundPage for the wildcard path', () => {
    const wildcard = routes.find((r) => r.path === '**');
    expect(wildcard?.component).toBe(NotFoundPage);
  });

  it('should lazy-load all non-eager routes via loadComponent', () => {
    const lazyPaths = [
      'mission/:chapterId',
      'minigames',
      'minigames/:gameId',
      'minigames/:gameId/level/:levelId',
      'minigames/:gameId/endless',
      'minigames/:gameId/speedrun',
      'minigames/:gameId/daily',
      'profile',
      'settings',
    ];
    for (const path of lazyPaths) {
      const route = routes.find((r) => r.path === path);
      expect(route?.loadComponent).toBeDefined();
      expect(typeof route?.loadComponent).toBe('function');
    }
  });

  it('should place the wildcard route last', () => {
    expect(routes[routes.length - 1].path).toBe('**');
  });

  describe('lazy loadComponent resolution', () => {
    it('should resolve MissionPage', async () => {
      const route = routes.find((r) => r.path === 'mission/:chapterId');
      const component = await (route?.loadComponent as () => Promise<unknown>)();
      expect(component).toBeDefined();
    });

    it('should resolve MinigameHubPage', async () => {
      const route = routes.find((r) => r.path === 'minigames');
      const component = await (route?.loadComponent as () => Promise<unknown>)();
      expect(component).toBeDefined();
    });

    it('should resolve LevelSelectPage', async () => {
      const route = routes.find((r) => r.path === 'minigames/:gameId');
      const component = await (route?.loadComponent as () => Promise<unknown>)();
      expect(component).toBeDefined();
    });

    it('should resolve MinigamePlayPage', async () => {
      const route = routes.find((r) => r.path === 'minigames/:gameId/level/:levelId');
      const component = await (route?.loadComponent as () => Promise<unknown>)();
      expect(component).toBeDefined();
    });

    it('should resolve ProfilePage', async () => {
      const route = routes.find((r) => r.path === 'profile');
      const component = await (route?.loadComponent as () => Promise<unknown>)();
      expect(component).toBeDefined();
    });

    it('should resolve SettingsPage', async () => {
      const route = routes.find((r) => r.path === 'settings');
      const component = await (route?.loadComponent as () => Promise<unknown>)();
      expect(component).toBeDefined();
    });

    it('should resolve EndlessModePage', async () => {
      const route = routes.find((r) => r.path === 'minigames/:gameId/endless');
      const component = await (route?.loadComponent as () => Promise<unknown>)();
      expect(component).toBeDefined();
    });

    it('should resolve SpeedRunPage', async () => {
      const route = routes.find((r) => r.path === 'minigames/:gameId/speedrun');
      const component = await (route?.loadComponent as () => Promise<unknown>)();
      expect(component).toBeDefined();
    });

    it('should resolve DailyChallengePage', async () => {
      const route = routes.find((r) => r.path === 'minigames/:gameId/daily');
      const component = await (route?.loadComponent as () => Promise<unknown>)();
      expect(component).toBeDefined();
    });
  });

  describe('route titles', () => {
    it('should have a title on the root route', () => {
      const route = routes.find((r) => r.path === '');
      expect(route?.title).toBe('Dashboard');
    });

    it('should have a title on the mission route', () => {
      const route = routes.find((r) => r.path === 'mission/:chapterId');
      expect(route?.title).toBe('Mission');
    });

    it('should have a title on the minigames route', () => {
      const route = routes.find((r) => r.path === 'minigames');
      expect(route?.title).toBe('Minigames');
    });

    it('should have a title on the level select route', () => {
      const route = routes.find((r) => r.path === 'minigames/:gameId');
      expect(route?.title).toBe('Level Select');
    });

    it('should have a title on the gameplay route', () => {
      const route = routes.find((r) => r.path === 'minigames/:gameId/level/:levelId');
      expect(route?.title).toBe('Play');
    });

    it('should have a title on the endless mode route', () => {
      const route = routes.find((r) => r.path === 'minigames/:gameId/endless');
      expect(route?.title).toBe('Endless Mode');
    });

    it('should have a title on the speed run route', () => {
      const route = routes.find((r) => r.path === 'minigames/:gameId/speedrun');
      expect(route?.title).toBe('Speed Run');
    });

    it('should have a title on the daily challenge route', () => {
      const route = routes.find((r) => r.path === 'minigames/:gameId/daily');
      expect(route?.title).toBe('Daily Challenge');
    });

    it('should have a title on the profile route', () => {
      const route = routes.find((r) => r.path === 'profile');
      expect(route?.title).toBe('Profile');
    });

    it('should have a title on the settings route', () => {
      const route = routes.find((r) => r.path === 'settings');
      expect(route?.title).toBe('Settings');
    });

    it('should have a title on the wildcard route', () => {
      const route = routes.find((r) => r.path === '**');
      expect(route?.title).toBe('Not Found');
    });

    it('every route should have a title defined', () => {
      const allHaveTitles = routes.every(
        (r) => typeof r.title === 'string' && (r.title as string).length > 0,
      );
      expect(allHaveTitles).toBe(true);
    });
  });

  describe('eager component rendering', () => {
    it('should render DashboardPage with an h1', async () => {
      const { element } = await createComponent(DashboardPage, {
        providers: [
          {
            provide: LUCIDE_ICONS,
            multi: true,
            useValue: new LucideIconProvider(APP_ICONS),
          },
          {
            provide: LucideIconConfig,
            useValue: Object.assign(new LucideIconConfig(), { size: 24, color: 'currentColor' }),
          },
          getMockProvider(XpService, {
            totalXp: signal(0),
            currentRank: signal('Cadet'),
          }),
          getMockProvider(GameProgressionService, {
            currentMission: signal(null),
            completedMissions: signal(new Set()),
            getUnlockedMinigames: () => [],
          }),
          getMockProvider(DailyChallengeService, {
            todaysChallenge: signal({ date: '2026-01-01', gameId: 'module-assembly', levelId: 'x', bonusXp: 50, completed: false }),
          }),
          getMockProvider(SpacedRepetitionService, {
            getDegradingTopics: () => [],
          }),
          getMockProvider(MasteryService, {
            mastery: signal(new Map()),
            getMastery: () => 0,
          }),
          getMockProvider(MinigameRegistryService, {
            getAllGames: () => [],
            getConfig: () => undefined,
          }),
          getMockProvider(StreakService, {
            activeStreakDays: signal(0),
            streakMultiplier: signal(1),
          }),
          getMockProvider(Router, {
            navigate: () => Promise.resolve(true),
          }),
        ],
      });
      expect(element.querySelector('h1')).toBeTruthy();
    });

    it('should render NotFoundPage with Hull Breach text', async () => {
      const { element } = await createComponent(NotFoundPage, {
        providers: [provideRouter([])],
      });
      expect(element.textContent).toContain('Hull Breach');
    });
  });
});
