import { Component } from '@angular/core';
import { createComponent } from '../../../../testing/test-utils';
import { ReplayModeHudComponent, type ReplayMode } from './replay-mode-hud';

@Component({
  template: `
    <nx-replay-mode-hud
      [mode]="mode"
      [round]="round"
      [score]="score"
      [difficultyLevel]="difficultyLevel"
      [elapsedTime]="elapsedTime"
      [parTime]="parTime"
      [levelProgress]="levelProgress"
      [totalLevels]="totalLevels"
      [splitTimes]="splitTimes"
      [streakDays]="streakDays"
      [bonusXp]="bonusXp"
      [topicName]="topicName">
      <p class="projected-content">Minigame goes here</p>
    </nx-replay-mode-hud>
  `,
  imports: [ReplayModeHudComponent],
})
class TestHost {
  mode: ReplayMode = 'endless';
  round = 1;
  score = 0;
  difficultyLevel = 1;
  elapsedTime = 0;
  parTime = 180;
  levelProgress = 0;
  totalLevels = 10;
  splitTimes: number[] = [];
  streakDays = 0;
  bonusXp = 0;
  topicName = 'Components';
}

describe('ReplayModeHudComponent', () => {
  async function setup(overrides: Partial<TestHost> = {}) {
    const { fixture, component, element } = await createComponent(TestHost, {
      detectChanges: false,
    });
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, component, element };
  }

  function getHud(element: HTMLElement): HTMLElement {
    return element.querySelector('nx-replay-mode-hud') as HTMLElement;
  }

  // --- Creation ---

  it('should create the component', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
  });

  // --- Endless mode rendering ---

  describe('endless mode', () => {
    it('should display round counter', async () => {
      const { element } = await setup({ mode: 'endless', round: 5 });
      const hud = getHud(element);
      const roundEl = hud.querySelector('[data-testid="round-counter"]');
      expect(roundEl).toBeTruthy();
      expect(roundEl!.textContent).toContain('5');
    });

    it('should display running score', async () => {
      const { element } = await setup({ mode: 'endless', score: 1500 });
      const hud = getHud(element);
      const scoreEl = hud.querySelector('[data-testid="running-score"]');
      expect(scoreEl).toBeTruthy();
      expect(scoreEl!.textContent).toContain('1500');
    });

    it('should display difficulty level indicator', async () => {
      const { element } = await setup({ mode: 'endless', difficultyLevel: 3 });
      const hud = getHud(element);
      const diffEl = hud.querySelector('[data-testid="difficulty-indicator"]');
      expect(diffEl).toBeTruthy();
      expect(diffEl!.textContent).toContain('3');
    });

    it('should not display speed run elements in endless mode', async () => {
      const { element } = await setup({ mode: 'endless' });
      const hud = getHud(element);
      expect(hud.querySelector('[data-testid="elapsed-timer"]')).toBeNull();
      expect(hud.querySelector('[data-testid="par-comparison"]')).toBeNull();
    });
  });

  // --- Speed run mode rendering ---

  describe('speedrun mode', () => {
    it('should display elapsed timer', async () => {
      const { element } = await setup({ mode: 'speedrun', elapsedTime: 95 });
      const hud = getHud(element);
      const timerEl = hud.querySelector('[data-testid="elapsed-timer"]');
      expect(timerEl).toBeTruthy();
      expect(timerEl!.textContent).toContain('1:35');
    });

    it('should display level progress (X/Y)', async () => {
      const { element } = await setup({
        mode: 'speedrun',
        levelProgress: 3,
        totalLevels: 10,
      });
      const hud = getHud(element);
      const progressEl = hud.querySelector('[data-testid="level-progress"]');
      expect(progressEl).toBeTruthy();
      expect(progressEl!.textContent).toContain('3');
      expect(progressEl!.textContent).toContain('10');
    });

    it('should apply green color class when under par', async () => {
      const { element } = await setup({
        mode: 'speedrun',
        elapsedTime: 60,
        parTime: 180,
      });
      const hud = getHud(element);
      const timerEl = hud.querySelector('[data-testid="elapsed-timer"]');
      expect(timerEl!.classList.contains('timer--green')).toBe(true);
    });

    it('should apply orange color class when near par (>75%)', async () => {
      const { element } = await setup({
        mode: 'speedrun',
        elapsedTime: 150,
        parTime: 180,
      });
      const hud = getHud(element);
      const timerEl = hud.querySelector('[data-testid="elapsed-timer"]');
      expect(timerEl!.classList.contains('timer--orange')).toBe(true);
    });

    it('should apply red color class when over par', async () => {
      const { element } = await setup({
        mode: 'speedrun',
        elapsedTime: 200,
        parTime: 180,
      });
      const hud = getHud(element);
      const timerEl = hud.querySelector('[data-testid="elapsed-timer"]');
      expect(timerEl!.classList.contains('timer--red')).toBe(true);
    });

    it('should not display endless-mode elements in speedrun mode', async () => {
      const { element } = await setup({ mode: 'speedrun' });
      const hud = getHud(element);
      expect(hud.querySelector('[data-testid="round-counter"]')).toBeNull();
      expect(hud.querySelector('[data-testid="difficulty-indicator"]')).toBeNull();
    });
  });

  // --- Daily challenge mode rendering ---

  describe('daily mode', () => {
    it('should display streak days', async () => {
      const { element } = await setup({ mode: 'daily', streakDays: 5 });
      const hud = getHud(element);
      const streakEl = hud.querySelector('[data-testid="streak-display"]');
      expect(streakEl).toBeTruthy();
      expect(streakEl!.textContent).toContain('5');
    });

    it('should display bonus XP badge', async () => {
      const { element } = await setup({ mode: 'daily', bonusXp: 50 });
      const hud = getHud(element);
      const bonusEl = hud.querySelector('[data-testid="bonus-xp"]');
      expect(bonusEl).toBeTruthy();
      expect(bonusEl!.textContent).toContain('50');
    });

    it('should display topic name', async () => {
      const { element } = await setup({ mode: 'daily', topicName: 'Signals' });
      const hud = getHud(element);
      const topicEl = hud.querySelector('[data-testid="topic-name"]');
      expect(topicEl).toBeTruthy();
      expect(topicEl!.textContent).toContain('Signals');
    });
  });

  // --- Content projection ---

  it('should project content', async () => {
    const { element } = await setup();
    const hud = getHud(element);
    const projected = hud.querySelector('.projected-content');
    expect(projected).toBeTruthy();
    expect(projected!.textContent).toContain('Minigame goes here');
  });

  // --- Round counter updates ---

  it('should update round counter when input changes', async () => {
    const { fixture, element } = await setup({ mode: 'endless', round: 1 });
    const hud = getHud(element);

    let roundEl = hud.querySelector('[data-testid="round-counter"]');
    expect(roundEl!.textContent).toContain('1');

    fixture.componentInstance.round = 5;
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();

    roundEl = hud.querySelector('[data-testid="round-counter"]');
    expect(roundEl!.textContent).toContain('5');
  });
});
