import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import {
  LucideIconConfig,
  LucideIconProvider,
  LUCIDE_ICONS,
} from 'lucide-angular';
import { createComponent } from '../../../../testing/test-utils';
import { APP_ICONS } from '../../../shared/icons';
import { LevelFailedComponent } from '../../../shared/components/level-failed/level-failed';
import { MinigameShellComponent } from './minigame-shell';
import { PauseMenuComponent } from '../../../shared/components/pause-menu/pause-menu';
import { MinigameStatus } from '../minigame.types';

const ICON_PROVIDERS = [
  {
    provide: LUCIDE_ICONS,
    multi: true,
    useValue: new LucideIconProvider(APP_ICONS),
  },
  {
    provide: LucideIconConfig,
    useValue: Object.assign(new LucideIconConfig(), {
      size: 24,
      color: 'currentColor',
    }),
  },
];

@Component({
  template: `<app-minigame-shell
    [score]="score" [lives]="lives" [maxLives]="maxLives"
    [timeRemaining]="timeRemaining" [timerDuration]="timerDuration"
    [status]="status" [xpEarned]="xpEarned" [starRating]="starRating"
    [hintsAvailable]="hintsAvailable"
    [hintCount]="hintCount" [hintPenalty]="hintPenalty" [activeHintText]="activeHintText"
    (pauseGame)="onPause()" (resumeGame)="onResume()" (restartGame)="onRestart()"
    (quit)="onQuit()" (retry)="onRetry()" (useHint)="onUseHint()"
    (nextLevel)="onNextLevel()" (replay)="onReplay()"
    (requestHint)="onRequestHint()"
  ><p class="game-content">Game here</p></app-minigame-shell>`,
  imports: [MinigameShellComponent],
})
class TestHost {
  score = 0;
  lives = 3;
  maxLives = 3;
  timeRemaining = 0;
  timerDuration = 0;
  status: MinigameStatus = MinigameStatus.Playing;
  xpEarned = 0;
  starRating = 0;
  hintsAvailable = false;
  hintCount = 0;
  hintPenalty = 0;
  activeHintText = '';

  pauseCalled = false;
  resumeCalled = false;
  restartCalled = false;
  quitCalled = false;
  retryCalled = false;
  useHintCalled = false;
  nextLevelCalled = false;
  replayCalled = false;
  requestHintCalled = false;

  onPause(): void { this.pauseCalled = true; }
  onResume(): void { this.resumeCalled = true; }
  onRestart(): void { this.restartCalled = true; }
  onQuit(): void { this.quitCalled = true; }
  onRetry(): void { this.retryCalled = true; }
  onUseHint(): void { this.useHintCalled = true; }
  onNextLevel(): void { this.nextLevelCalled = true; }
  onReplay(): void { this.replayCalled = true; }
  onRequestHint(): void { this.requestHintCalled = true; }
}

describe('MinigameShellComponent', () => {
  // HTMLDialogElement polyfill — PauseMenuComponent uses ConfirmDialogComponent which calls showModal()
  beforeEach(() => {
    if (!HTMLDialogElement.prototype.showModal) {
      HTMLDialogElement.prototype.showModal = function () {
        this.setAttribute('open', '');
      };
    }
    if (!HTMLDialogElement.prototype.close) {
      HTMLDialogElement.prototype.close = function () {
        this.removeAttribute('open');
      };
    }
  });

  // --- 1. Component creation ---
  it('should create the component', async () => {
    const { component } = await createComponent(TestHost, { providers: [...ICON_PROVIDERS] });
    expect(component).toBeTruthy();
  });

  // --- 2. Content projection ---
  it('should project content into shell-content', async () => {
    const { element } = await createComponent(TestHost, { providers: [...ICON_PROVIDERS] });
    const projected = element.querySelector('.shell-content .game-content');
    expect(projected?.textContent).toContain('Game here');
  });

  // --- 3. Score display ---
  it('should display the score value', async () => {
    const { fixture, element } = await createComponent(TestHost, { providers: [...ICON_PROVIDERS], detectChanges: false });
    fixture.componentInstance.score = 150;
    fixture.detectChanges();
    await fixture.whenStable();
    const scoreEl = element.querySelector('.shell-hud__score');
    expect(scoreEl?.textContent).toContain('150');
  });

  // --- 4. Score updates ---
  it('should update displayed score when input changes', async () => {
    const { fixture, element } = await createComponent(TestHost, { providers: [...ICON_PROVIDERS], detectChanges: false });
    fixture.componentInstance.score = 100;
    fixture.detectChanges();
    await fixture.whenStable();
    expect(element.querySelector('.shell-hud__score')?.textContent).toContain('100');

    fixture.componentInstance.score = 250;
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(element.querySelector('.shell-hud__score')?.textContent).toContain('250');
  });

  // --- 5. Lives display ---
  it('should display correct filled and empty lives', async () => {
    const { fixture, element } = await createComponent(TestHost, { providers: [...ICON_PROVIDERS], detectChanges: false });
    fixture.componentInstance.lives = 2;
    fixture.componentInstance.maxLives = 3;
    fixture.detectChanges();
    await fixture.whenStable();
    const allLives = element.querySelectorAll('.shell-hud__life');
    const emptyLives = element.querySelectorAll('.shell-hud__life--empty');
    expect(allLives.length).toBe(3);
    expect(emptyLives.length).toBe(1);
  });

  // --- 6. Timer hidden when timerDuration is 0 ---
  it('should hide timer when timerDuration is 0', async () => {
    const { fixture, element } = await createComponent(TestHost, { providers: [...ICON_PROVIDERS], detectChanges: false });
    fixture.componentInstance.timerDuration = 0;
    fixture.detectChanges();
    await fixture.whenStable();
    const timer = element.querySelector('.shell-hud__timer');
    expect(timer).toBeNull();
  });

  // --- 7. Timer shown when timerDuration > 0 ---
  it('should show timer when timerDuration is greater than 0', async () => {
    const { fixture, element } = await createComponent(TestHost, { providers: [...ICON_PROVIDERS], detectChanges: false });
    fixture.componentInstance.timerDuration = 60;
    fixture.componentInstance.timeRemaining = 30;
    fixture.detectChanges();
    await fixture.whenStable();
    const timer = element.querySelector('.shell-hud__timer');
    expect(timer).toBeTruthy();
  });

  // --- 8. Timer color green (>50%) ---
  it('should use green timer color when more than 50% time remains', async () => {
    const { fixture, element } = await createComponent(TestHost, { providers: [...ICON_PROVIDERS], detectChanges: false });
    fixture.componentInstance.timerDuration = 60;
    fixture.componentInstance.timeRemaining = 40;
    fixture.detectChanges();
    await fixture.whenStable();
    const timer = element.querySelector('.shell-hud__timer') as HTMLElement;
    expect(timer.style.color).toContain('sensor-green');
  });

  // --- 9. Timer color orange (25-50%) ---
  it('should use orange timer color when 25-50% time remains', async () => {
    const { fixture, element } = await createComponent(TestHost, { providers: [...ICON_PROVIDERS], detectChanges: false });
    fixture.componentInstance.timerDuration = 60;
    fixture.componentInstance.timeRemaining = 20;
    fixture.detectChanges();
    await fixture.whenStable();
    const timer = element.querySelector('.shell-hud__timer') as HTMLElement;
    expect(timer.style.color).toContain('alert-orange');
  });

  // --- 10. Timer color red (<25%) ---
  it('should use red timer color when less than 25% time remains', async () => {
    const { fixture, element } = await createComponent(TestHost, { providers: [...ICON_PROVIDERS], detectChanges: false });
    fixture.componentInstance.timerDuration = 60;
    fixture.componentInstance.timeRemaining = 10;
    fixture.detectChanges();
    await fixture.whenStable();
    const timer = element.querySelector('.shell-hud__timer') as HTMLElement;
    expect(timer.style.color).toContain('emergency-red');
  });

  // --- 11. No overlay during Playing ---
  it('should not show any overlay during Playing status', async () => {
    const { fixture, element } = await createComponent(TestHost, { providers: [...ICON_PROVIDERS], detectChanges: false });
    fixture.componentInstance.status = MinigameStatus.Playing;
    fixture.detectChanges();
    await fixture.whenStable();
    const overlay = element.querySelector('.shell-overlay');
    expect(overlay).toBeNull();
  });

  // --- 12. Pause overlay renders PauseMenuComponent ---
  it('should render nx-pause-menu when status is Paused', async () => {
    const { fixture, element } = await createComponent(TestHost, { providers: [...ICON_PROVIDERS], detectChanges: false });
    fixture.componentInstance.status = MinigameStatus.Paused;
    fixture.detectChanges();
    await fixture.whenStable();
    expect(element.querySelector('nx-pause-menu')).toBeTruthy();
    expect(element.querySelector('.shell-overlay__panel')).toBeNull();
  });

  // --- 13. Completion overlay visible ---
  it('should show completion overlay when status is Won', async () => {
    const { fixture, element } = await createComponent(TestHost, { providers: [...ICON_PROVIDERS], detectChanges: false });
    fixture.componentInstance.status = MinigameStatus.Won;
    fixture.componentInstance.score = 500;
    fixture.componentInstance.xpEarned = 120;
    fixture.componentInstance.starRating = 3;
    fixture.detectChanges();
    await fixture.whenStable();
    const overlay = element.querySelector('.shell-overlay--success');
    expect(overlay).toBeTruthy();
    expect(overlay?.getAttribute('role')).toBe('dialog');
    expect(overlay?.getAttribute('aria-modal')).toBe('true');
    expect(overlay?.textContent).toContain('500');
    expect(overlay?.textContent).toContain('+120 XP');
    expect(overlay?.textContent).toContain('Next Level');
    expect(overlay?.textContent).toContain('Replay');
  });

  // --- 14. Failure overlay renders <nx-level-failed> ---
  it('should show failure overlay when status is Lost', async () => {
    const { fixture, element } = await createComponent(TestHost, { providers: [...ICON_PROVIDERS], detectChanges: false });
    fixture.componentInstance.status = MinigameStatus.Lost;
    fixture.componentInstance.score = 80;
    fixture.componentInstance.lives = 0;
    fixture.detectChanges();
    await fixture.whenStable();
    expect(element.querySelector('nx-level-failed')).toBeTruthy();
    expect(element.querySelector('.level-failed__reason')?.textContent).toContain('3 strikes');
    expect(element.querySelector('.level-failed__score')?.textContent?.trim()).toBe('80');
  });

  // --- 15. Star rating display ---
  it('should display correct number of filled and unfilled stars', async () => {
    const { fixture, element } = await createComponent(TestHost, { providers: [...ICON_PROVIDERS], detectChanges: false });
    fixture.componentInstance.status = MinigameStatus.Won;
    fixture.componentInstance.starRating = 3;
    fixture.detectChanges();
    await fixture.whenStable();
    const filledStars = element.querySelectorAll('.shell-overlay__star--filled');
    const allStars = element.querySelectorAll('.shell-overlay__stars span');
    expect(filledStars.length).toBe(3);
    expect(allStars.length).toBe(5);
  });

  // --- 16. Pause button emits ---
  it('should emit pause when pause button is clicked', async () => {
    const { fixture, element } = await createComponent(TestHost, { providers: [...ICON_PROVIDERS] });
    const pauseBtn = element.querySelector('.shell-hud__pause') as HTMLButtonElement;
    pauseBtn.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.pauseCalled).toBe(true);
  });

  // --- 17. Resume event forwarding from PauseMenuComponent ---
  it('should emit resumeGame when resume event fires from pause menu', async () => {
    const { fixture } = await createComponent(TestHost, { providers: [...ICON_PROVIDERS], detectChanges: false });
    fixture.componentInstance.status = MinigameStatus.Paused;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.debugElement.query(By.directive(PauseMenuComponent)).triggerEventHandler('resume');
    fixture.detectChanges();
    expect(fixture.componentInstance.resumeCalled).toBe(true);
  });

  // --- 18. Quit event forwarding from PauseMenuComponent ---
  it('should emit quit when quit event fires from pause menu', async () => {
    const { fixture } = await createComponent(TestHost, { providers: [...ICON_PROVIDERS], detectChanges: false });
    fixture.componentInstance.status = MinigameStatus.Paused;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.debugElement.query(By.directive(PauseMenuComponent)).triggerEventHandler('quit');
    fixture.detectChanges();
    expect(fixture.componentInstance.quitCalled).toBe(true);
  });

  // --- 18b. Restart event forwarding from PauseMenuComponent ---
  it('should emit restartGame when restart event fires from pause menu', async () => {
    const { fixture } = await createComponent(TestHost, { providers: [...ICON_PROVIDERS], detectChanges: false });
    fixture.componentInstance.status = MinigameStatus.Paused;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.debugElement.query(By.directive(PauseMenuComponent)).triggerEventHandler('restart');
    fixture.detectChanges();
    expect(fixture.componentInstance.restartCalled).toBe(true);
  });

  // --- 18c. No pause menu when playing ---
  it('should not render nx-pause-menu when status is Playing', async () => {
    const { fixture, element } = await createComponent(TestHost, { providers: [...ICON_PROVIDERS], detectChanges: false });
    fixture.componentInstance.status = MinigameStatus.Playing;
    fixture.detectChanges();
    await fixture.whenStable();
    expect(element.querySelector('nx-pause-menu')).toBeNull();
  });

  // --- 19. Retry event forwarding from LevelFailedComponent ---
  it('should emit retry when retry event fires from level-failed', async () => {
    const { fixture } = await createComponent(TestHost, { providers: [...ICON_PROVIDERS], detectChanges: false });
    fixture.componentInstance.status = MinigameStatus.Lost;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.debugElement.query(By.directive(LevelFailedComponent)).triggerEventHandler('retry');
    fixture.detectChanges();
    expect(fixture.componentInstance.retryCalled).toBe(true);
  });

  // --- 20. Quit event forwarding from LevelFailedComponent ---
  it('should emit quit when quit event fires from level-failed', async () => {
    const { fixture } = await createComponent(TestHost, { providers: [...ICON_PROVIDERS], detectChanges: false });
    fixture.componentInstance.status = MinigameStatus.Lost;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.debugElement.query(By.directive(LevelFailedComponent)).triggerEventHandler('quit');
    fixture.detectChanges();
    expect(fixture.componentInstance.quitCalled).toBe(true);
  });

  // --- 21. Next Level button emits ---
  it('should emit nextLevel when Next Level is clicked in completion overlay', async () => {
    const { fixture, element } = await createComponent(TestHost, { providers: [...ICON_PROVIDERS], detectChanges: false });
    fixture.componentInstance.status = MinigameStatus.Won;
    fixture.detectChanges();
    await fixture.whenStable();
    const buttons = element.querySelectorAll('.shell-overlay__panel button');
    const nextBtn = Array.from(buttons).find(b => b.textContent?.trim() === 'Next Level') as HTMLButtonElement;
    nextBtn.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.nextLevelCalled).toBe(true);
  });

  // --- 22. Replay button emits ---
  it('should emit replay when Replay is clicked in completion overlay', async () => {
    const { fixture, element } = await createComponent(TestHost, { providers: [...ICON_PROVIDERS], detectChanges: false });
    fixture.componentInstance.status = MinigameStatus.Won;
    fixture.detectChanges();
    await fixture.whenStable();
    const buttons = element.querySelectorAll('.shell-overlay__panel button');
    const replayBtn = Array.from(buttons).find(b => b.textContent?.trim() === 'Replay') as HTMLButtonElement;
    replayBtn.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.replayCalled).toBe(true);
  });

  // --- 23. Failure reason '3 strikes' when lives are 0 ---
  it("should derive failure reason as '3 strikes' when lives are 0", async () => {
    const { fixture, element } = await createComponent(TestHost, { providers: [...ICON_PROVIDERS], detectChanges: false });
    fixture.componentInstance.status = MinigameStatus.Lost;
    fixture.componentInstance.lives = 0;
    fixture.detectChanges();
    await fixture.whenStable();
    expect(element.querySelector('.level-failed__reason')?.textContent).toContain('3 strikes');
  });

  // --- 24. Failure reason 'Time expired' ---
  it("should derive failure reason as 'Time expired' when timer has expired", async () => {
    const { fixture, element } = await createComponent(TestHost, { providers: [...ICON_PROVIDERS], detectChanges: false });
    fixture.componentInstance.status = MinigameStatus.Lost;
    fixture.componentInstance.lives = 2;
    fixture.componentInstance.timerDuration = 60;
    fixture.componentInstance.timeRemaining = 0;
    fixture.detectChanges();
    await fixture.whenStable();
    expect(element.querySelector('.level-failed__reason')?.textContent).toContain('Time expired');
  });

  // --- 25. Failure reason 'Mission failed' fallback ---
  it("should derive failure reason as 'Mission failed' for generic failure", async () => {
    const { fixture, element } = await createComponent(TestHost, { providers: [...ICON_PROVIDERS], detectChanges: false });
    fixture.componentInstance.status = MinigameStatus.Lost;
    fixture.componentInstance.lives = 1;
    fixture.componentInstance.timerDuration = 0;
    fixture.detectChanges();
    await fixture.whenStable();
    expect(element.querySelector('.level-failed__reason')?.textContent).toContain('Mission failed');
  });

  // --- 26. UseHint event forwarding from LevelFailedComponent ---
  it('should emit useHint when useHint event fires from level-failed', async () => {
    const { fixture } = await createComponent(TestHost, { providers: [...ICON_PROVIDERS], detectChanges: false });
    fixture.componentInstance.status = MinigameStatus.Lost;
    fixture.componentInstance.hintsAvailable = true;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.debugElement.query(By.directive(LevelFailedComponent)).triggerEventHandler('useHint');
    fixture.detectChanges();
    expect(fixture.componentInstance.useHintCalled).toBe(true);
  });

  // --- 27. hintsAvailable passed through to level-failed ---
  it('should pass hintsAvailable to level-failed component', async () => {
    const { fixture, element } = await createComponent(TestHost, { providers: [...ICON_PROVIDERS], detectChanges: false });
    fixture.componentInstance.status = MinigameStatus.Lost;
    fixture.componentInstance.hintsAvailable = true;
    fixture.detectChanges();
    await fixture.whenStable();
    const useHintBtn = Array.from(element.querySelectorAll('.level-failed__btn'))
      .find(b => b.textContent?.trim() === 'Use Hint');
    expect(useHintBtn).toBeTruthy();
  });

  // --- 28. Hint button hidden when hintCount is 0 and no active hint ---
  it('should hide hint button when hintCount is 0 and no activeHintText', async () => {
    const { fixture, element } = await createComponent(TestHost, { providers: [...ICON_PROVIDERS], detectChanges: false });
    fixture.componentInstance.hintCount = 0;
    fixture.componentInstance.activeHintText = '';
    fixture.detectChanges();
    await fixture.whenStable();
    expect(element.querySelector('.shell-hud__hint')).toBeNull();
  });

  // --- 29. Hint button visible when hintCount > 0 ---
  it('should show hint button when hintCount > 0', async () => {
    const { fixture, element } = await createComponent(TestHost, { providers: [...ICON_PROVIDERS], detectChanges: false });
    fixture.componentInstance.hintCount = 3;
    fixture.detectChanges();
    await fixture.whenStable();
    expect(element.querySelector('.shell-hud__hint')).toBeTruthy();
  });

  // --- 30. Hint badge shows remaining count ---
  it('should show remaining hint count in badge', async () => {
    const { fixture, element } = await createComponent(TestHost, { providers: [...ICON_PROVIDERS], detectChanges: false });
    fixture.componentInstance.hintCount = 2;
    fixture.detectChanges();
    await fixture.whenStable();
    const badge = element.querySelector('.shell-hud__hint-badge');
    expect(badge?.textContent?.trim()).toBe('2');
  });

  // --- 31. Hint cost label shown ---
  it('should show hint cost label when hintPenalty > 0 and hintCount > 0', async () => {
    const { fixture, element } = await createComponent(TestHost, { providers: [...ICON_PROVIDERS], detectChanges: false });
    fixture.componentInstance.hintCount = 1;
    fixture.componentInstance.hintPenalty = 50;
    fixture.detectChanges();
    await fixture.whenStable();
    const cost = element.querySelector('.shell-hud__hint-cost');
    expect(cost?.textContent).toContain('-50 pts');
  });

  // --- 32. Hint cost label hidden when hintCount is 0 ---
  it('should hide hint cost label when hintCount is 0', async () => {
    const { fixture, element } = await createComponent(TestHost, { providers: [...ICON_PROVIDERS], detectChanges: false });
    fixture.componentInstance.hintCount = 0;
    fixture.componentInstance.activeHintText = 'still showing';
    fixture.componentInstance.hintPenalty = 50;
    fixture.detectChanges();
    await fixture.whenStable();
    expect(element.querySelector('.shell-hud__hint-cost')).toBeNull();
  });

  // --- 33. Hint button disabled when hintCount is 0 but activeHintText is showing ---
  it('should disable hint button when hintCount is 0 but activeHintText is showing', async () => {
    const { fixture, element } = await createComponent(TestHost, { providers: [...ICON_PROVIDERS], detectChanges: false });
    fixture.componentInstance.hintCount = 0;
    fixture.componentInstance.activeHintText = 'some text';
    fixture.detectChanges();
    await fixture.whenStable();
    const btn = element.querySelector('.shell-hud__hint') as HTMLButtonElement;
    expect(btn).toBeTruthy();
    expect(btn.disabled).toBe(true);
  });

  // --- 34. Click emits requestHint output ---
  it('should emit requestHint when hint button is clicked', async () => {
    const { fixture, element } = await createComponent(TestHost, { providers: [...ICON_PROVIDERS], detectChanges: false });
    fixture.componentInstance.hintCount = 2;
    fixture.detectChanges();
    await fixture.whenStable();
    const btn = element.querySelector('.shell-hud__hint') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.requestHintCalled).toBe(true);
  });

  // --- 35. Hint popover shown when activeHintText is set ---
  it('should show hint popover when activeHintText is set', async () => {
    const { fixture, element } = await createComponent(TestHost, { providers: [...ICON_PROVIDERS], detectChanges: false });
    fixture.componentInstance.hintCount = 1;
    fixture.componentInstance.activeHintText = 'Try this';
    fixture.detectChanges();
    await fixture.whenStable();
    const popover = element.querySelector('.shell-hud__hint-popover');
    expect(popover).toBeTruthy();
    expect(popover?.textContent?.trim()).toBe('Try this');
  });

  // --- 36. Hint popover hidden when activeHintText is empty ---
  it('should hide hint popover when activeHintText is empty', async () => {
    const { fixture, element } = await createComponent(TestHost, { providers: [...ICON_PROVIDERS], detectChanges: false });
    fixture.componentInstance.hintCount = 2;
    fixture.componentInstance.activeHintText = '';
    fixture.detectChanges();
    await fixture.whenStable();
    expect(element.querySelector('.shell-hud__hint-popover')).toBeNull();
  });
});
