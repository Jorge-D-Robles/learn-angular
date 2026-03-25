import { inject } from '@angular/core';
import type { CanDeactivateFn } from '@angular/router';
import { ConfirmDialogService } from '../../shared/services/confirm-dialog.service';
import { MinigameStatus } from '../minigame/minigame.types';
import type { MinigamePlayPage } from '../../pages/minigame-play/minigame-play';

/**
 * Route guard that shows a quit confirmation dialog when the player
 * tries to navigate away from an active minigame (Playing or Paused).
 * Allows navigation freely when the game is Loading, Won, or Lost.
 */
export const minigamePlayGuard: CanDeactivateFn<MinigamePlayPage> = (component) => {
  const confirmDialog = inject(ConfirmDialogService);

  const engine = component.engine();
  if (!engine) {
    return true;
  }

  const status = engine.status();
  if (status === MinigameStatus.Playing || status === MinigameStatus.Paused) {
    return confirmDialog.confirm({
      title: 'Quit Game?',
      message: 'Quit current game? Progress will be lost.',
      confirmText: 'Quit',
      cancelText: 'Keep Playing',
      variant: 'warning',
    });
  }

  return true;
};
