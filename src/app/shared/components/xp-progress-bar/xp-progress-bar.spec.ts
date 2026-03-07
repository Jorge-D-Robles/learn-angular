import { Component } from '@angular/core';
import { createComponent } from '../../../../testing/test-utils';
import { XpProgressBarComponent } from './xp-progress-bar';

@Component({
  template: `<nx-xp-progress-bar
    [currentXp]="currentXp"
    [nextRankXp]="nextRankXp"
    [currentRank]="currentRank"
    [nextRank]="nextRank"
    [variant]="variant" />`,
  imports: [XpProgressBarComponent],
})
class TestHost {
  currentXp = 250;
  nextRankXp = 500;
  currentRank = 'Cadet';
  nextRank = 'Ensign';
  variant: 'compact' | 'full' = 'compact';
}

describe('XpProgressBarComponent', () => {
  it('should create the component', async () => {
    const { component } = await createComponent(TestHost);
    expect(component).toBeTruthy();
  });

  it('should calculate percentage for normal values', async () => {
    const { element } = await createComponent(TestHost);
    const fill = element.querySelector('.xp-progress-bar__fill') as HTMLElement;
    expect(fill.style.width).toBe('50%');
  });

  it('should calculate 0% when currentXp is 0', async () => {
    const { fixture, element } = await createComponent(TestHost, {
      detectChanges: false,
    });
    fixture.componentInstance.currentXp = 0;
    fixture.detectChanges();
    await fixture.whenStable();
    const fill = element.querySelector('.xp-progress-bar__fill') as HTMLElement;
    expect(fill.style.width).toBe('0%');
  });

  it('should calculate 100% when currentXp equals nextRankXp', async () => {
    const { fixture, element } = await createComponent(TestHost, {
      detectChanges: false,
    });
    fixture.componentInstance.currentXp = 500;
    fixture.componentInstance.nextRankXp = 500;
    fixture.detectChanges();
    await fixture.whenStable();
    const fill = element.querySelector('.xp-progress-bar__fill') as HTMLElement;
    expect(fill.style.width).toBe('100%');
  });

  it('should return 100% when nextRankXp is 0 (max rank)', async () => {
    const { fixture, element } = await createComponent(TestHost, {
      detectChanges: false,
    });
    fixture.componentInstance.currentXp = 25000;
    fixture.componentInstance.nextRankXp = 0;
    fixture.detectChanges();
    await fixture.whenStable();
    const fill = element.querySelector('.xp-progress-bar__fill') as HTMLElement;
    expect(fill.style.width).toBe('100%');
  });

  it('should clamp to 100% when currentXp exceeds nextRankXp', async () => {
    const { fixture, element } = await createComponent(TestHost, {
      detectChanges: false,
    });
    fixture.componentInstance.currentXp = 600;
    fixture.componentInstance.nextRankXp = 500;
    fixture.detectChanges();
    await fixture.whenStable();
    const fill = element.querySelector('.xp-progress-bar__fill') as HTMLElement;
    expect(fill.style.width).toBe('100%');
  });

  it('should render percentage text in compact variant', async () => {
    const { element } = await createComponent(TestHost);
    const pct = element.querySelector('.xp-progress-bar__pct');
    expect(pct?.textContent?.trim()).toBe('50%');
  });

  it('should not render rank labels in compact variant', async () => {
    const { element } = await createComponent(TestHost);
    const labels = element.querySelector('.xp-progress-bar__labels');
    expect(labels).toBeNull();
  });

  it('should not render XP text in compact variant', async () => {
    const { element } = await createComponent(TestHost);
    const xpText = element.querySelector('.xp-progress-bar__xp-text');
    expect(xpText).toBeNull();
  });

  it('should render rank labels in full variant', async () => {
    const { fixture, element } = await createComponent(TestHost, {
      detectChanges: false,
    });
    fixture.componentInstance.variant = 'full';
    fixture.detectChanges();
    await fixture.whenStable();
    const labels = element.querySelector('.xp-progress-bar__labels');
    expect(labels).toBeTruthy();
    const labelTexts = labels!.textContent;
    expect(labelTexts).toContain('Cadet');
    expect(labelTexts).toContain('Ensign');
  });

  it('should render XP numbers in full variant', async () => {
    const { fixture, element } = await createComponent(TestHost, {
      detectChanges: false,
    });
    fixture.componentInstance.variant = 'full';
    fixture.detectChanges();
    await fixture.whenStable();
    const xpText = element.querySelector('.xp-progress-bar__xp-text');
    expect(xpText?.textContent?.trim()).toBe('250 / 500 XP');
  });

  it('should hide next rank label when nextRank is empty (max rank)', async () => {
    const { fixture, element } = await createComponent(TestHost, {
      detectChanges: false,
    });
    fixture.componentInstance.variant = 'full';
    fixture.componentInstance.nextRank = '';
    fixture.detectChanges();
    await fixture.whenStable();
    const labels = element.querySelector('.xp-progress-bar__labels');
    expect(labels).toBeTruthy();
    const rightLabel = element.querySelector(
      '.xp-progress-bar__label--next',
    );
    expect(rightLabel).toBeNull();
  });

  it('should have role=progressbar on host', async () => {
    const { element } = await createComponent(TestHost);
    const host = element.querySelector('nx-xp-progress-bar');
    expect(host?.getAttribute('role')).toBe('progressbar');
  });

  it('should set aria-valuenow to computed percentage', async () => {
    const { element } = await createComponent(TestHost);
    const host = element.querySelector('nx-xp-progress-bar');
    expect(host?.getAttribute('aria-valuenow')).toBe('50');
  });

  it('should set aria-valuemin to 0 and aria-valuemax to 100', async () => {
    const { element } = await createComponent(TestHost);
    const host = element.querySelector('nx-xp-progress-bar');
    expect(host?.getAttribute('aria-valuemin')).toBe('0');
    expect(host?.getAttribute('aria-valuemax')).toBe('100');
  });

  it('should set aria-label describing rank progress', async () => {
    const { element } = await createComponent(TestHost);
    const host = element.querySelector('nx-xp-progress-bar');
    expect(host?.getAttribute('aria-label')).toBe(
      'Cadet rank progress: 50%',
    );
  });

  it('should apply xp-progress-bar--compact class in compact variant', async () => {
    const { element } = await createComponent(TestHost);
    const host = element.querySelector('nx-xp-progress-bar');
    expect(host?.classList.contains('xp-progress-bar--compact')).toBe(true);
    expect(host?.classList.contains('xp-progress-bar--full')).toBe(false);
  });

  it('should apply xp-progress-bar--full class in full variant', async () => {
    const { fixture, element } = await createComponent(TestHost, {
      detectChanges: false,
    });
    fixture.componentInstance.variant = 'full';
    fixture.detectChanges();
    await fixture.whenStable();
    const host = element.querySelector('nx-xp-progress-bar');
    expect(host?.classList.contains('xp-progress-bar--full')).toBe(true);
    expect(host?.classList.contains('xp-progress-bar--compact')).toBe(false);
  });

  it('should update bar when currentXp changes dynamically', async () => {
    const { fixture, element } = await createComponent(TestHost);

    const host = element.querySelector('nx-xp-progress-bar');
    const fill = element.querySelector(
      '.xp-progress-bar__fill',
    ) as HTMLElement;

    // Initial state: 250/500 = 50%
    expect(fill.style.width).toBe('50%');
    expect(host?.getAttribute('aria-valuenow')).toBe('50');

    // Update to 400/500 = 80%
    fixture.componentInstance.currentXp = 400;
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fill.style.width).toBe('80%');
    expect(host?.getAttribute('aria-valuenow')).toBe('80');
  });
});
