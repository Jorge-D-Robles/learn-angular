import { Component } from '@angular/core';
import {
  LucideIconConfig,
  LucideIconProvider,
  LUCIDE_ICONS,
} from 'lucide-angular';
import { createComponent } from '../../../../testing/test-utils';
import { APP_ICONS } from '../../icons';
import { DailyChallengeCardComponent } from './daily-challenge-card';
import type { DailyChallenge } from '../../../core/progression/daily-challenge.service';
import type { MinigameId } from '../../../core/minigame/minigame.types';

@Component({
  template: `
    <nx-daily-challenge-card
      [challenge]="challenge"
      [isCompleted]="isCompleted"
      [gameName]="gameName"
      [gameTopic]="gameTopic"
      [streakDays]="streakDays"
      (acceptChallenge)="acceptedGameId = $event" />
  `,
  imports: [DailyChallengeCardComponent],
})
class TestHost {
  challenge: DailyChallenge = {
    date: '2026-03-25',
    gameId: 'module-assembly' as MinigameId,
    levelId: 'module-assembly-basic-1',
    bonusXp: 50,
    completed: false,
  };
  isCompleted = false;
  gameName = 'Module Assembly';
  gameTopic = 'NgModule Basics';
  streakDays = 0;
  acceptedGameId: MinigameId | null = null;
}

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

describe('DailyChallengeCardComponent', () => {
  async function setup(overrides: Partial<TestHost> = {}) {
    const { fixture, component, element } = await createComponent(TestHost, {
      providers: ICON_PROVIDERS,
      detectChanges: false,
    });
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, component, element };
  }

  function getHost(element: HTMLElement): HTMLElement {
    return element.querySelector('nx-daily-challenge-card') as HTMLElement;
  }

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // --- Not-Completed State ---

  it('should create the component', async () => {
    const { element } = await setup();
    const host = getHost(element);
    expect(host).toBeTruthy();
  });

  it('should display game name when not completed', async () => {
    const { element } = await setup();
    const gameName = element.querySelector('.daily-challenge-card__game-name');
    expect(gameName).toBeTruthy();
    expect(gameName!.textContent).toContain('Module Assembly');
  });

  it('should display game topic when not completed', async () => {
    const { element } = await setup();
    const topic = element.querySelector('.daily-challenge-card__topic');
    expect(topic).toBeTruthy();
    expect(topic!.textContent).toContain('NgModule Basics');
  });

  it('should display XP bonus badge when not completed', async () => {
    const { element } = await setup();
    const badge = element.querySelector('.daily-challenge-card__xp-badge');
    expect(badge).toBeTruthy();
    expect(badge!.textContent).toContain('+50 XP');
  });

  it('should render Accept Challenge button when not completed', async () => {
    const { element } = await setup();
    const button = element.querySelector(
      '.daily-challenge-card__accept-button',
    );
    expect(button).toBeTruthy();
    expect(button!.textContent).toContain('Accept Challenge');
  });

  it('should emit acceptChallenge with gameId when Accept clicked', async () => {
    const { fixture, element } = await setup();
    const button = element.querySelector(
      '.daily-challenge-card__accept-button',
    ) as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.acceptedGameId).toBe('module-assembly');
  });

  // --- Completed State ---

  it('should not render Accept Challenge button when completed', async () => {
    const { element } = await setup({ isCompleted: true });
    const button = element.querySelector(
      '.daily-challenge-card__accept-button',
    );
    expect(button).toBeNull();
  });

  it('should show checkmark icon when completed', async () => {
    const { element } = await setup({ isCompleted: true });
    const icon = element.querySelector(
      '.daily-challenge-card__complete-icon lucide-icon',
    );
    expect(icon).toBeTruthy();
    expect(icon!.getAttribute('name')).toBe('circle-check');
  });

  it('should show "Challenge Complete" text when completed', async () => {
    const { element } = await setup({ isCompleted: true });
    const host = getHost(element);
    expect(host.textContent).toContain('Challenge Complete');
  });

  // --- Countdown Tests ---

  it('should display countdown when completed', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-25T20:00:00'));

    const { element } = await setup({ isCompleted: true });
    const countdown = element.querySelector(
      '.daily-challenge-card__countdown',
    );
    expect(countdown).toBeTruthy();
    expect(countdown!.textContent).toContain('4h 0m');
  });

  it('should update countdown after tick', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-25T20:00:00'));

    const { fixture, element } = await setup({ isCompleted: true });

    vi.advanceTimersByTime(60_000);
    fixture.detectChanges();
    await fixture.whenStable();

    const countdown = element.querySelector(
      '.daily-challenge-card__countdown',
    );
    expect(countdown).toBeTruthy();
    expect(countdown!.textContent).toContain('3h 59m');
  });

  it('should show "New challenge available" at midnight', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-26T00:00:00'));

    const { element } = await setup({ isCompleted: true });
    const countdown = element.querySelector(
      '.daily-challenge-card__countdown',
    );
    expect(countdown).toBeTruthy();
    expect(countdown!.textContent).toContain('New challenge available');
  });

  // --- Streak Indicator ---

  it('should display streak indicator with flame icon when streakDays > 0', async () => {
    const { element } = await setup({ streakDays: 5 });
    const streak = element.querySelector('.daily-challenge-card__streak');
    expect(streak).toBeTruthy();
    const icon = streak!.querySelector('lucide-icon');
    expect(icon).toBeTruthy();
    expect(icon!.getAttribute('name')).toBe('flame');
    expect(streak!.textContent).toContain('5');
  });

  it('should hide streak indicator when streakDays is 0', async () => {
    const { element } = await setup({ streakDays: 0 });
    const streak = element.querySelector('.daily-challenge-card__streak');
    expect(streak).toBeNull();
  });

  // --- Accessibility ---

  it('should have role="article" on host', async () => {
    const { element } = await setup();
    const host = getHost(element);
    expect(host.getAttribute('role')).toBe('article');
  });

  it('should have descriptive aria-label', async () => {
    const { element } = await setup();
    const host = getHost(element);
    expect(host.getAttribute('aria-label')).toBe(
      'Daily challenge: Module Assembly',
    );
  });

  it('should have completed aria-label when completed', async () => {
    const { element } = await setup({ isCompleted: true });
    const host = getHost(element);
    expect(host.getAttribute('aria-label')).toBe(
      'Daily challenge: Module Assembly - completed',
    );
  });

  // --- Timer Cleanup ---

  it('should not leak interval on destroy', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-25T20:00:00'));
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');

    const { fixture } = await setup({ isCompleted: true });
    fixture.destroy();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});
