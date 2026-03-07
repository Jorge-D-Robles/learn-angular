import { Component } from '@angular/core';
import { createComponent } from '../../../../testing/test-utils';
import { DifficultyTier } from '../../../core/minigame/minigame.types';
import { TierBadgeComponent } from './tier-badge';

@Component({
  template: `<nx-tier-badge [tier]="tier" [size]="size" />`,
  imports: [TierBadgeComponent],
})
class TestHost {
  tier: DifficultyTier = DifficultyTier.Basic;
  size: 'sm' | 'md' = 'md';
}

describe('TierBadgeComponent', () => {
  async function setup(overrides: Partial<TestHost> = {}) {
    const { fixture, component, element } = await createComponent(TestHost, {
      detectChanges: false,
    });
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, component, element };
  }

  function getHost(el: HTMLElement): HTMLElement {
    return el.querySelector('nx-tier-badge') as HTMLElement;
  }

  it('should create the component', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
  });

  // Label text per tier
  it('should display "Basic" for Basic tier', async () => {
    const { element } = await setup({ tier: DifficultyTier.Basic });
    const host = getHost(element);
    expect(host.textContent!.trim()).toBe('Basic');
  });

  it('should display "Intermediate" for Intermediate tier', async () => {
    const { element } = await setup({ tier: DifficultyTier.Intermediate });
    const host = getHost(element);
    expect(host.textContent!.trim()).toBe('Intermediate');
  });

  it('should display "Advanced" for Advanced tier', async () => {
    const { element } = await setup({ tier: DifficultyTier.Advanced });
    const host = getHost(element);
    expect(host.textContent!.trim()).toBe('Advanced');
  });

  it('should display "Boss" for Boss tier', async () => {
    const { element } = await setup({ tier: DifficultyTier.Boss });
    const host = getHost(element);
    expect(host.textContent!.trim()).toBe('Boss');
  });

  // CSS class per tier
  it('should have tier-badge--basic class for Basic tier', async () => {
    const { element } = await setup({ tier: DifficultyTier.Basic });
    const host = getHost(element);
    expect(host.classList.contains('tier-badge--basic')).toBe(true);
  });

  it('should have tier-badge--intermediate class for Intermediate tier', async () => {
    const { element } = await setup({ tier: DifficultyTier.Intermediate });
    const host = getHost(element);
    expect(host.classList.contains('tier-badge--intermediate')).toBe(true);
  });

  it('should have tier-badge--advanced class for Advanced tier', async () => {
    const { element } = await setup({ tier: DifficultyTier.Advanced });
    const host = getHost(element);
    expect(host.classList.contains('tier-badge--advanced')).toBe(true);
  });

  it('should have tier-badge--boss class for Boss tier', async () => {
    const { element } = await setup({ tier: DifficultyTier.Boss });
    const host = getHost(element);
    expect(host.classList.contains('tier-badge--boss')).toBe(true);
  });

  // Size variants
  it('should have tier-badge--md class by default', async () => {
    const { element } = await setup();
    const host = getHost(element);
    expect(host.classList.contains('tier-badge--md')).toBe(true);
  });

  it('should have tier-badge--sm class for size sm', async () => {
    const { element } = await setup({ size: 'sm' });
    const host = getHost(element);
    expect(host.classList.contains('tier-badge--sm')).toBe(true);
  });

  // Accessibility
  it('should have role=img on host', async () => {
    const { element } = await setup();
    const host = getHost(element);
    expect(host.getAttribute('role')).toBe('img');
  });

  it('should have aria-label "Basic difficulty" for Basic tier', async () => {
    const { element } = await setup({ tier: DifficultyTier.Basic });
    const host = getHost(element);
    expect(host.getAttribute('aria-label')).toBe('Basic difficulty');
  });

  it('should have aria-label "Boss difficulty" for Boss tier', async () => {
    const { element } = await setup({ tier: DifficultyTier.Boss });
    const host = getHost(element);
    expect(host.getAttribute('aria-label')).toBe('Boss difficulty');
  });

  // Dynamic updates
  it('should update label, class, and aria-label when tier changes', async () => {
    const { fixture, element } = await setup({ tier: DifficultyTier.Basic });
    const host = getHost(element);

    // Initial state
    expect(host.textContent!.trim()).toBe('Basic');
    expect(host.classList.contains('tier-badge--basic')).toBe(true);
    expect(host.getAttribute('aria-label')).toBe('Basic difficulty');

    // Update to Advanced
    fixture.componentInstance.tier = DifficultyTier.Advanced;
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();

    expect(host.textContent!.trim()).toBe('Advanced');
    expect(host.classList.contains('tier-badge--advanced')).toBe(true);
    expect(host.classList.contains('tier-badge--basic')).toBe(false);
    expect(host.getAttribute('aria-label')).toBe('Advanced difficulty');
  });
});
