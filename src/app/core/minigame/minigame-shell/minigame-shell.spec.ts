import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { createComponent } from '../../../../testing/test-utils';
import { MinigameShellComponent } from './minigame-shell';
import { PauseMenuComponent } from '../../../shared/components/pause-menu/pause-menu';
import { MinigameStatus } from '../minigame.types';

@Component({
  template: `<app-minigame-shell
    [score]="score" [lives]="lives" [maxLives]="maxLives"
    [timeRemaining]="timeRemaining" [timerDuration]="timerDuration"
    [status]="status" [xpEarned]="xpEarned" [starRating]="starRating"
    (pauseGame)="onPause()" (resumeGame)="onResume()" (restartGame)="onRestart()"
    (quit)="onQuit()" (retry)="onRetry()" (nextLevel)="onNextLevel()" (replay)="onReplay()"
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

  pauseCalled = false;
  resumeCalled = false;
  restartCalled = false;
  quitCalled = false;
  retryCalled = false;
  nextLevelCalled = false;
  replayCalled = false;

  onPause(): void { this.pauseCalled = true; }
  onResume(): void { this.resumeCalled = true; }
  onRestart(): void { this.restartCalled = true; }
  onQuit(): void { this.quitCalled = true; }
  onRetry(): void { this.retryCalled = true; }
  onNextLevel(): void { this.nextLevelCalled = true; }
  onReplay(): void { this.replayCalled = true; }
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
    const { component } = await createComponent(TestHost);
    expect(component).toBeTruthy();
  });

  // --- 2. Content projection ---
  it('should project content into shell-content', async () => {
    const { element } = await createComponent(TestHost);
    const projected = element.querySelector('.shell-content .game-content');
    expect(projected?.textContent).toContain('Game here');
  });

  // --- 3. Score display ---
  it('should display the score value', async () => {
    const { fixture, element } = await createComponent(TestHost, { detectChanges: false });
    fixture.componentInstance.score = 150;
    fixture.detectChanges();
    await fixture.whenStable();
    const scoreEl = element.querySelector('.shell-hud__score');
    expect(scoreEl?.textContent).toContain('150');
  });

  // --- 4. Score updates ---
  it('should update displayed score when input changes', async () => {
    const { fixture, element } = await createComponent(TestHost, { detectChanges: false });
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
    const { fixture, element } = await createComponent(TestHost, { detectChanges: false });
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
    const { fixture, element } = await createComponent(TestHost, { detectChanges: false });
    fixture.componentInstance.timerDuration = 0;
    fixture.detectChanges();
    await fixture.whenStable();
    const timer = element.querySelector('.shell-hud__timer');
    expect(timer).toBeNull();
  });

  // --- 7. Timer shown when timerDuration > 0 ---
  it('should show timer when timerDuration is greater than 0', async () => {
    const { fixture, element } = await createComponent(TestHost, { detectChanges: false });
    fixture.componentInstance.timerDuration = 60;
    fixture.componentInstance.timeRemaining = 30;
    fixture.detectChanges();
    await fixture.whenStable();
    const timer = element.querySelector('.shell-hud__timer');
    expect(timer).toBeTruthy();
  });

  // --- 8. Timer color green (>50%) ---
  it('should use green timer color when more than 50% time remains', async () => {
    const { fixture, element } = await createComponent(TestHost, { detectChanges: false });
    fixture.componentInstance.timerDuration = 60;
    fixture.componentInstance.timeRemaining = 40;
    fixture.detectChanges();
    await fixture.whenStable();
    const timer = element.querySelector('.shell-hud__timer') as HTMLElement;
    expect(timer.style.color).toContain('sensor-green');
  });

  // --- 9. Timer color orange (25-50%) ---
  it('should use orange timer color when 25-50% time remains', async () => {
    const { fixture, element } = await createComponent(TestHost, { detectChanges: false });
    fixture.componentInstance.timerDuration = 60;
    fixture.componentInstance.timeRemaining = 20;
    fixture.detectChanges();
    await fixture.whenStable();
    const timer = element.querySelector('.shell-hud__timer') as HTMLElement;
    expect(timer.style.color).toContain('alert-orange');
  });

  // --- 10. Timer color red (<25%) ---
  it('should use red timer color when less than 25% time remains', async () => {
    const { fixture, element } = await createComponent(TestHost, { detectChanges: false });
    fixture.componentInstance.timerDuration = 60;
    fixture.componentInstance.timeRemaining = 10;
    fixture.detectChanges();
    await fixture.whenStable();
    const timer = element.querySelector('.shell-hud__timer') as HTMLElement;
    expect(timer.style.color).toContain('emergency-red');
  });

  // --- 11. No overlay during Playing ---
  it('should not show any overlay during Playing status', async () => {
    const { fixture, element } = await createComponent(TestHost, { detectChanges: false });
    fixture.componentInstance.status = MinigameStatus.Playing;
    fixture.detectChanges();
    await fixture.whenStable();
    const overlay = element.querySelector('.shell-overlay');
    expect(overlay).toBeNull();
  });

  // --- 12. Pause overlay renders PauseMenuComponent ---
  it('should render nx-pause-menu when status is Paused', async () => {
    const { fixture, element } = await createComponent(TestHost, { detectChanges: false });
    fixture.componentInstance.status = MinigameStatus.Paused;
    fixture.detectChanges();
    await fixture.whenStable();
    expect(element.querySelector('nx-pause-menu')).toBeTruthy();
    expect(element.querySelector('.shell-overlay__panel')).toBeNull();
  });

  // --- 13. Completion overlay visible ---
  it('should show completion overlay when status is Won', async () => {
    const { fixture, element } = await createComponent(TestHost, { detectChanges: false });
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

  // --- 14. Failure overlay visible ---
  it('should show failure overlay when status is Lost', async () => {
    const { fixture, element } = await createComponent(TestHost, { detectChanges: false });
    fixture.componentInstance.status = MinigameStatus.Lost;
    fixture.componentInstance.score = 80;
    fixture.detectChanges();
    await fixture.whenStable();
    const overlay = element.querySelector('.shell-overlay--failure');
    expect(overlay).toBeTruthy();
    expect(overlay?.getAttribute('role')).toBe('dialog');
    expect(overlay?.getAttribute('aria-modal')).toBe('true');
    expect(overlay?.textContent).toContain('80');
    expect(overlay?.textContent).toContain('Retry');
    expect(overlay?.textContent).toContain('Quit');
  });

  // --- 15. Star rating display ---
  it('should display correct number of filled and unfilled stars', async () => {
    const { fixture, element } = await createComponent(TestHost, { detectChanges: false });
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
    const { fixture, element } = await createComponent(TestHost);
    const pauseBtn = element.querySelector('.shell-hud__pause') as HTMLButtonElement;
    pauseBtn.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.pauseCalled).toBe(true);
  });

  // --- 17. Resume event forwarding from PauseMenuComponent ---
  it('should emit resumeGame when resume event fires from pause menu', async () => {
    const { fixture } = await createComponent(TestHost, { detectChanges: false });
    fixture.componentInstance.status = MinigameStatus.Paused;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.debugElement.query(By.directive(PauseMenuComponent)).triggerEventHandler('resume');
    fixture.detectChanges();
    expect(fixture.componentInstance.resumeCalled).toBe(true);
  });

  // --- 18. Quit event forwarding from PauseMenuComponent ---
  it('should emit quit when quit event fires from pause menu', async () => {
    const { fixture } = await createComponent(TestHost, { detectChanges: false });
    fixture.componentInstance.status = MinigameStatus.Paused;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.debugElement.query(By.directive(PauseMenuComponent)).triggerEventHandler('quit');
    fixture.detectChanges();
    expect(fixture.componentInstance.quitCalled).toBe(true);
  });

  // --- 18b. Restart event forwarding from PauseMenuComponent ---
  it('should emit restartGame when restart event fires from pause menu', async () => {
    const { fixture } = await createComponent(TestHost, { detectChanges: false });
    fixture.componentInstance.status = MinigameStatus.Paused;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.debugElement.query(By.directive(PauseMenuComponent)).triggerEventHandler('restart');
    fixture.detectChanges();
    expect(fixture.componentInstance.restartCalled).toBe(true);
  });

  // --- 18c. No pause menu when playing ---
  it('should not render nx-pause-menu when status is Playing', async () => {
    const { fixture, element } = await createComponent(TestHost, { detectChanges: false });
    fixture.componentInstance.status = MinigameStatus.Playing;
    fixture.detectChanges();
    await fixture.whenStable();
    expect(element.querySelector('nx-pause-menu')).toBeNull();
  });

  // --- 19. Retry button emits from failure overlay ---
  it('should emit retry when Retry is clicked in failure overlay', async () => {
    const { fixture, element } = await createComponent(TestHost, { detectChanges: false });
    fixture.componentInstance.status = MinigameStatus.Lost;
    fixture.detectChanges();
    await fixture.whenStable();
    const buttons = element.querySelectorAll('.shell-overlay__panel button');
    const retryBtn = Array.from(buttons).find(b => b.textContent?.trim() === 'Retry') as HTMLButtonElement;
    retryBtn.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.retryCalled).toBe(true);
  });

  // --- 20. Quit button emits from failure overlay ---
  it('should emit quit when Quit is clicked in failure overlay', async () => {
    const { fixture, element } = await createComponent(TestHost, { detectChanges: false });
    fixture.componentInstance.status = MinigameStatus.Lost;
    fixture.detectChanges();
    await fixture.whenStable();
    const buttons = element.querySelectorAll('.shell-overlay__panel button');
    const quitBtn = Array.from(buttons).find(b => b.textContent?.trim() === 'Quit') as HTMLButtonElement;
    quitBtn.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.quitCalled).toBe(true);
  });

  // --- 21. Next Level button emits ---
  it('should emit nextLevel when Next Level is clicked in completion overlay', async () => {
    const { fixture, element } = await createComponent(TestHost, { detectChanges: false });
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
    const { fixture, element } = await createComponent(TestHost, { detectChanges: false });
    fixture.componentInstance.status = MinigameStatus.Won;
    fixture.detectChanges();
    await fixture.whenStable();
    const buttons = element.querySelectorAll('.shell-overlay__panel button');
    const replayBtn = Array.from(buttons).find(b => b.textContent?.trim() === 'Replay') as HTMLButtonElement;
    replayBtn.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.replayCalled).toBe(true);
  });
});
