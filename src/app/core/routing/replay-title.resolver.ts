import { inject } from '@angular/core';
import type { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { MinigameRegistryService } from '../minigame/minigame-registry.service';
import type { MinigameId } from '../minigame/minigame.types';

function getGameName(route: ActivatedRouteSnapshot): string {
  const gameId = route.paramMap.get('gameId') ?? '';
  const registry = inject(MinigameRegistryService);
  return registry.getConfig(gameId as MinigameId)?.name ?? gameId;
}

export const endlessTitleResolver: ResolveFn<string> = (route) => {
  return `${getGameName(route)} - Endless Mode`;
};

export const speedRunTitleResolver: ResolveFn<string> = (route) => {
  return `${getGameName(route)} - Speed Run`;
};

export const dailyChallengeTitleResolver: ResolveFn<string> = (route) => {
  return `${getGameName(route)} - Daily Challenge`;
};
