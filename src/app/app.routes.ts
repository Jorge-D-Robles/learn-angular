import { Routes } from '@angular/router';
import { DashboardPage } from './pages/dashboard/dashboard';
import { NotFoundPage } from './pages/not-found/not-found';

export const routes: Routes = [
  { path: '', component: DashboardPage },
  {
    path: 'mission/:chapterId',
    loadComponent: () => import('./pages/mission/mission').then((m) => m.MissionPage),
  },
  {
    path: 'minigames',
    loadComponent: () => import('./pages/minigame-hub/minigame-hub').then((m) => m.MinigameHubPage),
  },
  {
    path: 'minigames/:gameId',
    loadComponent: () => import('./pages/level-select/level-select').then((m) => m.LevelSelectPage),
  },
  {
    path: 'minigames/:gameId/level/:levelId',
    loadComponent: () =>
      import('./pages/minigame-play/minigame-play').then((m) => m.MinigamePlayPage),
  },
  {
    path: 'minigames/:gameId/endless',
    loadComponent: () =>
      import('./pages/endless-mode/endless-mode').then((m) => m.EndlessModePage),
  },
  {
    path: 'minigames/:gameId/speedrun',
    loadComponent: () =>
      import('./pages/speed-run/speed-run').then((m) => m.SpeedRunPage),
  },
  {
    path: 'minigames/:gameId/daily',
    loadComponent: () =>
      import('./pages/daily-challenge/daily-challenge').then((m) => m.DailyChallengePage),
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile').then((m) => m.ProfilePage),
  },
  {
    path: 'settings',
    loadComponent: () => import('./pages/settings/settings').then((m) => m.SettingsPage),
  },
  { path: '**', component: NotFoundPage },
];
