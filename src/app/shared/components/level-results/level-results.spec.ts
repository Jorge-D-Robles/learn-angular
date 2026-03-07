import { Component } from '@angular/core';
import {
  LucideIconConfig,
  LucideIconProvider,
  LUCIDE_ICONS,
} from 'lucide-angular';
import { vi } from 'vitest';
import { createComponent } from '../../../../testing/test-utils';
import { APP_ICONS } from '../../icons';
import { MinigameResult } from '../../../core/minigame/minigame.types';
import { LevelResultsComponent } from './level-results';

@Component({
  template: `
    <nx-level-results
      [result]="result"
      [previousBest]="previousBest"
      [xpAwarded]="xpAwarded"
      [bonuses]="bonuses"
      [nextLevelLocked]="nextLevelLocked"
      (nextLevel)="onNextLevel()"
      (replay)="onReplay()"
      (quit)="onQuit()" />
  `,
  imports: [LevelResultsComponent],
})
class TestHost {
  result: MinigameResult = {
    gameId: 'module-assembly' as any,
    levelId: 'level-1',
    score: 750,
    perfect: false,
    timeElapsed: 45,
    xpEarned: 100,
    starRating: 2,
  };
  previousBest: number | null = null;
  xpAwarded = 100;
  bonuses: { label: string; amount: number }[] = [];
  nextLevelLocked = false;
  onNextLevel = vi.fn();
  onReplay = vi.fn();
  onQuit = vi.fn();
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

describe('LevelResultsComponent', () => {
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
    return element.querySelector('nx-level-results') as HTMLElement;
  }

  it('should create the component', async () => {
    const { element } = await setup();
    expect(getHost(element)).toBeTruthy();
  });

  it('should display the score', async () => {
    const { element } = await setup();
    const scoreEl = element.querySelector('.level-results__score');
    expect(scoreEl?.textContent?.trim()).toBe('750');
  });

  it('should render star rating via LevelStarsComponent', async () => {
    const { element } = await setup();
    const starsHost = element.querySelector('nx-level-stars');
    expect(starsHost).toBeTruthy();
    const filled = starsHost!.querySelectorAll('.level-stars__star--filled');
    expect(filled.length).toBe(2);
  });

  it('should display XP total', async () => {
    const { element } = await setup({ xpAwarded: 150 });
    const xpTotal = element.querySelector('.level-results__xp-total');
    expect(xpTotal?.textContent?.trim()).toBe('+150 XP');
  });

  it('should render XP breakdown rows', async () => {
    const { element } = await setup({
      bonuses: [
        { label: 'Base', amount: 20 },
        { label: 'Perfect', amount: 20 },
      ],
    });
    const rows = element.querySelectorAll('.level-results__xp-row');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Base');
    expect(rows[0].textContent).toContain('+20');
    expect(rows[1].textContent).toContain('Perfect');
    expect(rows[1].textContent).toContain('+20');
  });

  it('should show "New Best!" when score exceeds previousBest', async () => {
    const { element } = await setup({ previousBest: 500 });
    const newBest = element.querySelector('.level-results__new-best');
    expect(newBest).toBeTruthy();
    expect(newBest?.textContent?.trim()).toBe('New Best!');
  });

  it('should NOT show "New Best!" when score is below previousBest', async () => {
    const result: MinigameResult = {
      gameId: 'module-assembly' as any,
      levelId: 'level-1',
      score: 500,
      perfect: false,
      timeElapsed: 45,
      xpEarned: 100,
      starRating: 1,
    };
    const { element } = await setup({ result, previousBest: 1000 });
    const newBest = element.querySelector('.level-results__new-best');
    expect(newBest).toBeFalsy();
  });

  it('should NOT show "New Best!" when previousBest is null', async () => {
    const { element } = await setup({ previousBest: null });
    const newBest = element.querySelector('.level-results__new-best');
    expect(newBest).toBeFalsy();
  });

  it('should show previous best score when previousBest is not null', async () => {
    const { element } = await setup({ previousBest: 500 });
    const prev = element.querySelector('.level-results__previous');
    expect(prev).toBeTruthy();
    expect(prev?.textContent).toContain('500');
  });

  it('should emit nextLevel when Next Level button is clicked', async () => {
    const { element, component } = await setup();
    const btn = element.querySelector(
      '.level-results__btn--primary',
    ) as HTMLButtonElement;
    btn.click();
    expect((component as TestHost).onNextLevel).toHaveBeenCalled();
  });

  it('should emit replay when Replay button is clicked', async () => {
    const { element, component } = await setup();
    const btns = element.querySelectorAll('.level-results__btn--secondary');
    (btns[0] as HTMLButtonElement).click();
    expect((component as TestHost).onReplay).toHaveBeenCalled();
  });

  it('should emit quit when Level Select button is clicked', async () => {
    const { element, component } = await setup();
    const btns = element.querySelectorAll('.level-results__btn--secondary');
    (btns[1] as HTMLButtonElement).click();
    expect((component as TestHost).onQuit).toHaveBeenCalled();
  });

  it('should disable Next Level button when nextLevelLocked is true', async () => {
    const { element } = await setup({ nextLevelLocked: true });
    const btn = element.querySelector(
      '.level-results__btn--primary',
    ) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('should apply level-results--perfect class when result.perfect is true', async () => {
    const result: MinigameResult = {
      gameId: 'module-assembly' as any,
      levelId: 'level-1',
      score: 1000,
      perfect: true,
      timeElapsed: 30,
      xpEarned: 150,
      starRating: 3,
    };
    const { element } = await setup({ result });
    const host = getHost(element);
    expect(host.classList.contains('level-results--perfect')).toBe(true);
  });

  it('should have correct ARIA attributes', async () => {
    const { element } = await setup();
    const dialog = element.querySelector('.level-results') as HTMLElement;
    expect(dialog.getAttribute('role')).toBe('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBe('results-title');
    expect(dialog.querySelector('#results-title')).toBeTruthy();
  });
});
