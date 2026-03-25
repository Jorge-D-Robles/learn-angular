import { Component } from '@angular/core';
import {
  LucideIconConfig,
  LucideIconProvider,
  LUCIDE_ICONS,
} from 'lucide-angular';
import { vi } from 'vitest';
import { createComponent } from '../../../../testing/test-utils';
import { APP_ICONS } from '../../icons';
import { AnimationService } from '../../../core/animation/animation.service';
import { LevelFailedComponent } from './level-failed';

@Component({
  template: `
    <nx-level-failed
      [reason]="reason"
      [score]="score"
      [hintsAvailable]="hintsAvailable"
      (retry)="onRetry()"
      (useHint)="onUseHint()"
      (quit)="onQuit()" />
  `,
  imports: [LevelFailedComponent],
})
class TestHost {
  reason = 'Time expired';
  score = 350;
  hintsAvailable = false;
  onRetry = vi.fn();
  onUseHint = vi.fn();
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

describe('LevelFailedComponent', () => {
  async function setup(overrides: Partial<TestHost> = {}) {
    const { fixture, component, element } = await createComponent(TestHost, {
      providers: [...ICON_PROVIDERS, { provide: AnimationService, useValue: { getDuration: () => 250, isReducedMotion: () => false } }],
      detectChanges: false,
    });
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, component, element };
  }

  function getHost(element: HTMLElement): HTMLElement {
    return element.querySelector('nx-level-failed') as HTMLElement;
  }

  function getButtonByText(
    element: HTMLElement,
    text: string,
  ): HTMLButtonElement | null {
    const buttons = element.querySelectorAll('.level-failed__btn');
    for (const btn of buttons) {
      if (btn.textContent?.trim() === text) {
        return btn as HTMLButtonElement;
      }
    }
    return null;
  }

  it('should create the component', async () => {
    const { element } = await setup();
    expect(getHost(element)).toBeTruthy();
  });

  it('should display the failure reason', async () => {
    const { element } = await setup({ reason: 'Time expired' });
    const reasonEl = element.querySelector('.level-failed__reason');
    expect(reasonEl?.textContent?.trim()).toBe('Time expired');
  });

  it('should display the partial score', async () => {
    const { element } = await setup({ score: 350 });
    const scoreEl = element.querySelector('.level-failed__score');
    expect(scoreEl?.textContent?.trim()).toBe('350');
  });

  it('should display score of 0', async () => {
    const { element } = await setup({ score: 0 });
    const scoreEl = element.querySelector('.level-failed__score');
    expect(scoreEl?.textContent?.trim()).toBe('0');
  });

  it('should emit retry when Retry button is clicked', async () => {
    const { fixture, element } = await setup();
    const btn = getButtonByText(element, 'Retry');
    expect(btn).toBeTruthy();
    btn!.click();
    expect(fixture.componentInstance.onRetry).toHaveBeenCalled();
  });

  it('should show Use Hint button when hintsAvailable is true', async () => {
    const { element } = await setup({ hintsAvailable: true });
    const btn = getButtonByText(element, 'Use Hint');
    expect(btn).toBeTruthy();
  });

  it('should hide Use Hint button when hintsAvailable is false', async () => {
    const { element } = await setup({ hintsAvailable: false });
    const btn = getButtonByText(element, 'Use Hint');
    expect(btn).toBeNull();
  });

  it('should emit useHint when Use Hint button is clicked', async () => {
    const { fixture, element } = await setup({ hintsAvailable: true });
    const btn = getButtonByText(element, 'Use Hint');
    expect(btn).toBeTruthy();
    btn!.click();
    expect(fixture.componentInstance.onUseHint).toHaveBeenCalled();
  });

  it('should emit quit when Level Select button is clicked', async () => {
    const { fixture, element } = await setup();
    const btn = getButtonByText(element, 'Level Select');
    expect(btn).toBeTruthy();
    btn!.click();
    expect(fixture.componentInstance.onQuit).toHaveBeenCalled();
  });

  it('should have correct ARIA attributes', async () => {
    const { element } = await setup();
    const dialog = element.querySelector('.level-failed') as HTMLElement;
    expect(dialog.getAttribute('role')).toBe('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBe('failed-title');
    expect(dialog.querySelector('#failed-title')).toBeTruthy();
  });

  it('should render the alert icon', async () => {
    const { element } = await setup();
    const icon = element.querySelector('lucide-icon[name="circle-alert"]');
    expect(icon).toBeTruthy();
  });
});
