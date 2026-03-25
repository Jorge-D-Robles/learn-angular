import { Routes } from '@angular/router';
import { DashboardPage } from './pages/dashboard/dashboard';
import { NotFoundPage } from './pages/not-found/not-found';
import { missionGuard, minigameLevelGuard, minigamePlayGuard } from './core/guards';
import { endlessTitleResolver, speedRunTitleResolver, dailyChallengeTitleResolver } from './core/routing/replay-title.resolver';

export const routes: Routes = [
  { path: '', component: DashboardPage, title: 'Dashboard' },
  {
    path: 'campaign',
    title: 'Campaign',
    loadComponent: () => import('./pages/campaign/campaign').then((m) => m.CampaignPage),
  },
  {
    path: 'mission/:chapterId',
    title: 'Mission',
    canActivate: [missionGuard],
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
    canActivate: [minigameLevelGuard],
    canDeactivate: [minigamePlayGuard],
    loadComponent: () =>
      import('./pages/minigame-play/minigame-play').then((m) => m.MinigamePlayPage),
  },
  {
    path: 'minigames/:gameId/endless',
    title: endlessTitleResolver,
    loadComponent: () =>
      import('./pages/endless-mode/endless-mode').then((m) => m.EndlessModePage),
  },
  {
    path: 'minigames/:gameId/speedrun',
    title: speedRunTitleResolver,
    loadComponent: () =>
      import('./pages/speed-run/speed-run').then((m) => m.SpeedRunPage),
  },
  {
    path: 'minigames/:gameId/daily',
    title: dailyChallengeTitleResolver,
    loadComponent: () =>
      import('./pages/daily-challenge/daily-challenge').then((m) => m.DailyChallengePage),
  },
  {
    path: 'refresher/:topicId',
    title: 'Refresher Challenge',
    loadComponent: () =>
      import('./pages/refresher/refresher').then((m) => m.RefresherChallengePage),
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
