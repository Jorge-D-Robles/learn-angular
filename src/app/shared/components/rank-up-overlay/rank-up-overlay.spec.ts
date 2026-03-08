import { Component } from '@angular/core';
import {
  LucideIconConfig,
  LucideIconProvider,
  LUCIDE_ICONS,
} from 'lucide-angular';
import { vi } from 'vitest';
import { createComponent } from '../../../../testing/test-utils';
import { APP_ICONS } from '../../icons';
import { Rank } from '../../../core/state/rank.constants';
import { RankUpOverlayComponent } from './rank-up-overlay';

@Component({
  template: `
    @if (show) {
      <nx-rank-up-overlay [rank]="rank" (dismissed)="onDismiss()" />
    }
  `,
  imports: [RankUpOverlayComponent],
})
class TestHost {
  show = true;
  rank: Rank = 'Commander';
  onDismiss = vi.fn();
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

describe('RankUpOverlayComponent', () => {
  async function setup(opts?: { useFakeTimers?: boolean; overrides?: Partial<TestHost> }) {
    if (opts?.useFakeTimers) vi.useFakeTimers();
    const { fixture, component, element } = await createComponent(TestHost, {
      providers: ICON_PROVIDERS,
      detectChanges: false,
    });
    if (opts?.overrides) Object.assign(fixture.componentInstance, opts.overrides);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, host: component, element };
  }

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render rank name in title', async () => {
    const { element } = await setup();
    const title = element.querySelector('.rank-up-overlay__title');
    expect(title?.textContent?.trim()).toBe('Promoted to Commander!');
  });

  it('should render shield icon', async () => {
    const { element } = await setup();
    const icon = element.querySelector('lucide-icon');
    expect(icon).toBeTruthy();
  });

  it('should render congratulatory message', async () => {
    const { element } = await setup();
    const message = element.querySelector('.rank-up-overlay__message');
    expect(message?.textContent?.trim()).toBe("You've earned a new station rank.");
  });

  it('should render dismiss button', async () => {
    const { element } = await setup();
    const button = element.querySelector('.rank-up-overlay__dismiss') as HTMLButtonElement;
    expect(button).toBeTruthy();
    expect(button.textContent?.trim()).toBe('Continue');
  });

  it('should emit dismissed on button click', async () => {
    const { element, host } = await setup();
    const button = element.querySelector('.rank-up-overlay__dismiss') as HTMLButtonElement;
    button.click();
    expect(host.onDismiss).toHaveBeenCalled();
  });

  it('should auto-dismiss after 5 seconds', async () => {
    const { host } = await setup({ useFakeTimers: true });
    expect(host.onDismiss).not.toHaveBeenCalled();
    vi.advanceTimersByTime(5000);
    expect(host.onDismiss).toHaveBeenCalled();
  });

  it('should NOT auto-dismiss before 5 seconds', async () => {
    const { host } = await setup({ useFakeTimers: true });
    vi.advanceTimersByTime(4999);
    expect(host.onDismiss).not.toHaveBeenCalled();
  });

  it('should display different rank names', async () => {
    const { element } = await setup({ overrides: { rank: 'Fleet Admiral' } });
    const title = element.querySelector('.rank-up-overlay__title');
    expect(title?.textContent?.trim()).toBe('Promoted to Fleet Admiral!');
  });

  it('should have correct ARIA attributes', async () => {
    const { element } = await setup();
    const overlay = element.querySelector('.rank-up-overlay') as HTMLElement;
    expect(overlay.getAttribute('role')).toBe('alertdialog');
    expect(overlay.getAttribute('aria-labelledby')).toBe('rank-up-title');
    expect(overlay.querySelector('#rank-up-title')).toBeTruthy();
  });
});
