import { Routes } from '@angular/router';
import { DashboardPage } from './pages/dashboard/dashboard';
import { NotFoundPage } from './pages/not-found/not-found';

export const routes: Routes = [
  { path: '', component: DashboardPage, title: 'Dashboard' },
  {
    path: 'mission/:chapterId',
    // dynamic title resolver deferred to T-2026-372
    title: 'Mission',
    loadComponent: () => import('./pages/mission/mission').then((m) => m.MissionPage),
  },
  {
    path: 'minigames',
    title: 'Minigames',
    loadComponent: () => import('./pages/minigame-hub/minigame-hub').then((m) => m.MinigameHubPage),
  },
  {
    path: 'minigames/:gameId',
    title: 'Level Select',
    loadComponent: () => import('./pages/level-select/level-select').then((m) => m.LevelSelectPage),
  },
  {
    path: 'minigames/:gameId/level/:levelId',
    title: 'Play',
    loadComponent: () =>
      import('./pages/minigame-play/minigame-play').then((m) => m.MinigamePlayPage),
  },
  {
    path: 'minigames/:gameId/endless',
    title: 'Endless Mode',
    loadComponent: () =>
      import('./pages/endless-mode/endless-mode').then((m) => m.EndlessModePage),
  },
  {
    path: 'minigames/:gameId/speedrun',
    title: 'Speed Run',
    loadComponent: () =>
      import('./pages/speed-run/speed-run').then((m) => m.SpeedRunPage),
  },
  {
    path: 'minigames/:gameId/daily',
    title: 'Daily Challenge',
    loadComponent: () =>
      import('./pages/daily-challenge/daily-challenge').then((m) => m.DailyChallengePage),
  },
  {
    path: 'profile',
    title: 'Profile',
    loadComponent: () => import('./pages/profile/profile').then((m) => m.ProfilePage),
  },
  {
    path: 'settings',
    title: 'Settings',
    loadComponent: () => import('./pages/settings/settings').then((m) => m.SettingsPage),
  },
  { path: '**', component: NotFoundPage, title: 'Not Found' },
];
