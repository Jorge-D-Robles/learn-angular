import { Component } from '@angular/core';
import {
  LucideIconConfig,
  LucideIconProvider,
  LUCIDE_ICONS,
} from 'lucide-angular';
import { createComponent } from '../../../../testing/test-utils';
import { APP_ICONS } from '../../icons';
import { StreakBadgeComponent } from './streak-badge';

@Component({
  template: `<nx-streak-badge [currentStreak]="currentStreak" [multiplier]="multiplier" />`,
  imports: [StreakBadgeComponent],
})
class TestHost {
  currentStreak = 0;
  multiplier = 1;
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

describe('StreakBadgeComponent', () => {
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
    return element.querySelector('nx-streak-badge') as HTMLElement;
  }

  // --- Rendering Tests ---

  it('should create the component', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
  });

  it('should render flame icon', async () => {
    const { element } = await setup();
    const host = getHost(element);
    const icon = host.querySelector('lucide-icon');
    expect(icon).toBeTruthy();
    expect(icon!.getAttribute('name')).toBe('flame');
  });

  it('should display streak count', async () => {
    const { element } = await setup({ currentStreak: 3 });
    const host = getHost(element);
    const count = host.querySelector('.streak-badge__count');
    expect(count).toBeTruthy();
    expect(count!.textContent!.trim()).toBe('3');
  });

  it('should display multiplier percentage when bonus is active', async () => {
    const { element } = await setup({ currentStreak: 3, multiplier: 1.3 });
    const host = getHost(element);
    const multiplier = host.querySelector('.streak-badge__multiplier');
    expect(multiplier).toBeTruthy();
    expect(multiplier!.textContent!.trim()).toBe('+30%');
  });

  it('should hide multiplier when multiplier is 1', async () => {
    const { element } = await setup({ currentStreak: 3, multiplier: 1 });
    const host = getHost(element);
    const multiplier = host.querySelector('.streak-badge__multiplier');
    expect(multiplier).toBeNull();
  });

  it('should hide multiplier when multiplier is 0', async () => {
    const { element } = await setup({ currentStreak: 0, multiplier: 0 });
    const host = getHost(element);
    const multiplier = host.querySelector('.streak-badge__multiplier');
    expect(multiplier).toBeNull();
  });

  // --- Visual State Tests ---

  it('should apply "none" class when currentStreak is 0', async () => {
    const { element } = await setup({ currentStreak: 0 });
    const host = getHost(element);
    expect(host.classList.contains('streak-badge--none')).toBe(true);
    expect(host.classList.contains('streak-badge--active')).toBe(false);
    expect(host.classList.contains('streak-badge--max')).toBe(false);
  });

  it('should apply "active" class when currentStreak is between 1 and 4', async () => {
    const { element } = await setup({ currentStreak: 3 });
    const host = getHost(element);
    expect(host.classList.contains('streak-badge--active')).toBe(true);
    expect(host.classList.contains('streak-badge--none')).toBe(false);
    expect(host.classList.contains('streak-badge--max')).toBe(false);
  });

  it('should apply "max" class when currentStreak is 5 or more', async () => {
    const { element } = await setup({ currentStreak: 5 });
    const host = getHost(element);
    expect(host.classList.contains('streak-badge--max')).toBe(true);
    expect(host.classList.contains('streak-badge--none')).toBe(false);
    expect(host.classList.contains('streak-badge--active')).toBe(false);
  });

  it('should apply "max" class when currentStreak exceeds 5', async () => {
    const { element } = await setup({ currentStreak: 12 });
    const host = getHost(element);
    expect(host.classList.contains('streak-badge--max')).toBe(true);
  });

  // --- Accessibility Tests ---

  it('should have role="img" on host', async () => {
    const { element } = await setup();
    const host = getHost(element);
    expect(host.getAttribute('role')).toBe('img');
  });

  it('should have aria-label "No active streak" when streak is 0', async () => {
    const { element } = await setup({ currentStreak: 0 });
    const host = getHost(element);
    expect(host.getAttribute('aria-label')).toBe('No active streak');
  });

  it('should have aria-label with day count and bonus for active streak', async () => {
    const { element } = await setup({ currentStreak: 3, multiplier: 1.3 });
    const host = getHost(element);
    expect(host.getAttribute('aria-label')).toBe(
      '3 days streak, +30% XP bonus',
    );
  });

  it('should use singular "day" for streak of 1', async () => {
    const { element } = await setup({ currentStreak: 1, multiplier: 1.1 });
    const host = getHost(element);
    expect(host.getAttribute('aria-label')).toBe(
      '1 day streak, +10% XP bonus',
    );
  });

  it('should have aria-label without bonus when multiplier is 1', async () => {
    const { element } = await setup({ currentStreak: 2, multiplier: 1 });
    const host = getHost(element);
    expect(host.getAttribute('aria-label')).toBe('2 days streak');
  });

  // --- Edge Cases ---

  it('should treat negative currentStreak as no streak', async () => {
    const { element } = await setup({ currentStreak: -1 });
    const host = getHost(element);
    expect(host.classList.contains('streak-badge--none')).toBe(true);
    expect(host.getAttribute('aria-label')).toBe('No active streak');
  });

  it('should round multiplier bonus to whole number', async () => {
    const { element } = await setup({ currentStreak: 3, multiplier: 1.333 });
    const host = getHost(element);
    const multiplier = host.querySelector('.streak-badge__multiplier');
    expect(multiplier).toBeTruthy();
    expect(multiplier!.textContent!.trim()).toBe('+33%');
  });

  it('should update visual state when currentStreak changes dynamically', async () => {
    const { fixture, element } = await setup({ currentStreak: 0 });
    const host = getHost(element);

    // Initial state: none
    expect(host.classList.contains('streak-badge--none')).toBe(true);
    expect(host.classList.contains('streak-badge--active')).toBe(false);

    // Update to active streak
    fixture.componentInstance.currentStreak = 3;
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(host.classList.contains('streak-badge--active')).toBe(true);
    expect(host.classList.contains('streak-badge--none')).toBe(false);
  });
});
