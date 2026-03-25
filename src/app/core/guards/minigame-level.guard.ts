import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { LevelProgressionService } from '../levels/level-progression.service';

/**
 * Route guard that prevents navigation to locked minigame levels.
 * TWO-STEP CHECK: first checks if the level definition exists, then checks unlock status.
 * - If the level definition is not found (unregistered), allows access (let the page handle not-found).
 * - If the level is unlocked, allows access.
 * - If the level is locked, redirects to /minigames/:gameId (level select page).
 */
export const minigameLevelGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const levelProgression = inject(LevelProgressionService);

  const gameId = route.paramMap.get('gameId');
  const levelId = route.paramMap.get('levelId');

  // If levelId is missing, let the page handle it
  if (!levelId) {
    return true;
  }

  // Step 1: Check if the level definition exists
  const levelDef = levelProgression.getLevelDefinition(levelId);
  if (levelDef === null) {
    // Level not registered — allow access, let the page handle not-found
    return true;
  }

  // Step 2: Check if the level is unlocked
  if (levelProgression.isLevelUnlocked(levelId)) {
    return true;
  }

  // Level is locked — redirect to level select
  return router.createUrlTree(['/minigames', gameId]);
};
