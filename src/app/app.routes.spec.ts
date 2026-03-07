import { routes } from './app.routes';
import { DashboardPage } from './pages/dashboard/dashboard';
import { NotFoundPage } from './pages/not-found/not-found';
import { createComponent } from '../testing/test-utils';

describe('routes', () => {
  const expectedPaths = [
    '',
    'mission/:chapterId',
    'minigames',
    'minigames/:gameId',
    'minigames/:gameId/level/:levelId',
    'profile',
    'settings',
    '**',
  ];

  it('should have 8 routes', () => {
    expect(routes.length).toBe(8);
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
  });

  describe('eager component rendering', () => {
    it('should render DashboardPage with an h1', async () => {
      const { element } = await createComponent(DashboardPage);
      expect(element.querySelector('h1')).toBeTruthy();
    });

    it('should render NotFoundPage with Hull Breach text', async () => {
      const { element } = await createComponent(NotFoundPage);
      expect(element.textContent).toContain('Hull Breach');
    });
  });
});
