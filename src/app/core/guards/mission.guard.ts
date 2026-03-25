import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { GameProgressionService } from '../progression/game-progression.service';
import type { ChapterId } from '../curriculum/curriculum.types';

/**
 * Route guard that prevents navigation to locked story missions.
 * Redirects to /campaign if the mission is not available (prerequisites unmet).
 * Allows access if the mission is available (playable or replayable).
 */
export const missionGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const progression = inject(GameProgressionService);

  const raw = route.paramMap.get('chapterId');
  const parsed = Number(raw);

  if (raw === null || raw === '' || isNaN(parsed)) {
    return router.createUrlTree(['/campaign']);
  }

  const chapterId = parsed as ChapterId;

  if (progression.isMissionAvailable(chapterId)) {
    return true;
  }

  return router.createUrlTree(['/campaign'], {
    queryParams: { locked: String(chapterId) },
  });
};
