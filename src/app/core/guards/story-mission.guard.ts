import { inject } from '@angular/core';
import type { CanDeactivateFn } from '@angular/router';
import { ConfirmDialogService } from '../../shared/services/confirm-dialog.service';
import type { MissionPage } from '../../pages/mission/mission';

/**
 * Route guard that shows a confirmation dialog when the player
 * tries to navigate away from a story mission mid-step.
 * Allows navigation freely at step 0 or after mission completion.
 */
export const storyMissionGuard: CanDeactivateFn<MissionPage> = (component) => {
  const confirmDialog = inject(ConfirmDialogService);

  const currentStep = component.currentStep();
  const totalSteps = component.totalSteps();
  const missionCompleted = component.missionCompleted();

  // Allow navigation at step 0 (not started) or after completion
  if (currentStep === 0 || missionCompleted || totalSteps === 0) {
    return true;
  }

  // Mid-mission: confirm before leaving
  return confirmDialog.confirm({
    title: 'Leave Mission?',
    message: 'Leave this mission? Your step progress will be lost.',
    confirmText: 'Leave',
    cancelText: 'Stay',
    variant: 'warning',
  });
};
