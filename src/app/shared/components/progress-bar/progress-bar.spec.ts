import { Component } from '@angular/core';
import { createComponent } from '../../../../testing/test-utils';
import { ProgressBarComponent } from './progress-bar';

type Variant = 'default' | 'xp' | 'mastery' | 'timer';

@Component({
  template: `<nx-progress-bar
    [value]="value"
    [max]="max"
    [label]="label"
    [variant]="variant"
    [showPercentage]="showPercentage" />`,
  imports: [ProgressBarComponent],
})
class TestHost {
  value = 50;
  max = 100;
  label: string | undefined = undefined;
  variant: Variant = 'default';
  showPercentage = false;
}

describe('ProgressBarComponent', () => {
  it('should create the component', async () => {
    const { component } = await createComponent(TestHost);
    expect(component).toBeTruthy();
  });

  it('should render fill width at 50% when value=50 max=100', async () => {
    const { element } = await createComponent(TestHost);
    const fill = element.querySelector('.progress-bar__fill') as HTMLElement;
    expect(fill.style.width).toBe('50%');
  });

  it('should render fill width at 70% when value=7 max=10', async () => {
    const { fixture, element } = await createComponent(TestHost, {
      detectChanges: false,
    });
    fixture.componentInstance.value = 7;
    fixture.componentInstance.max = 10;
    fixture.detectChanges();
    await fixture.whenStable();
    const fill = element.querySelector('.progress-bar__fill') as HTMLElement;
    expect(fill.style.width).toBe('70%');
  });

  it('should render fill width at 0% when value=0', async () => {
    const { fixture, element } = await createComponent(TestHost, {
      detectChanges: false,
    });
    fixture.componentInstance.value = 0;
    fixture.detectChanges();
    await fixture.whenStable();
    const fill = element.querySelector('.progress-bar__fill') as HTMLElement;
    expect(fill.style.width).toBe('0%');
  });

  it('should render fill width at 100% when value=100 max=100', async () => {
    const { fixture, element } = await createComponent(TestHost, {
      detectChanges: false,
    });
    fixture.componentInstance.value = 100;
    fixture.componentInstance.max = 100;
    fixture.detectChanges();
    await fixture.whenStable();
    const fill = element.querySelector('.progress-bar__fill') as HTMLElement;
    expect(fill.style.width).toBe('100%');
  });

  it('should clamp fill width to 100% when value exceeds max', async () => {
    const { fixture, element } = await createComponent(TestHost, {
      detectChanges: false,
    });
    fixture.componentInstance.value = 150;
    fixture.componentInstance.max = 100;
    fixture.detectChanges();
    await fixture.whenStable();
    const fill = element.querySelector('.progress-bar__fill') as HTMLElement;
    expect(fill.style.width).toBe('100%');
  });

  it('should clamp fill width to 0% when value is negative', async () => {
    const { fixture, element } = await createComponent(TestHost, {
      detectChanges: false,
    });
    fixture.componentInstance.value = -5;
    fixture.componentInstance.max = 100;
    fixture.detectChanges();
    await fixture.whenStable();
    const fill = element.querySelector('.progress-bar__fill') as HTMLElement;
    expect(fill.style.width).toBe('0%');
  });

  it('should render fill width at 100% when max is 0', async () => {
    const { fixture, element } = await createComponent(TestHost, {
      detectChanges: false,
    });
    fixture.componentInstance.value = 0;
    fixture.componentInstance.max = 0;
    fixture.detectChanges();
    await fixture.whenStable();
    const fill = element.querySelector('.progress-bar__fill') as HTMLElement;
    expect(fill.style.width).toBe('100%');
  });

  it('should show percentage text when showPercentage is true', async () => {
    const { fixture, element } = await createComponent(TestHost, {
      detectChanges: false,
    });
    fixture.componentInstance.value = 7;
    fixture.componentInstance.max = 10;
    fixture.componentInstance.showPercentage = true;
    fixture.detectChanges();
    await fixture.whenStable();
    const pct = element.querySelector('.progress-bar__percentage');
    expect(pct).toBeTruthy();
    expect(pct?.textContent?.trim()).toBe('70%');
  });

  it('should hide percentage text when showPercentage is false', async () => {
    const { element } = await createComponent(TestHost);
    const pct = element.querySelector('.progress-bar__percentage');
    expect(pct).toBeNull();
  });

  it('should apply progress-bar--default class for default variant', async () => {
    const { element } = await createComponent(TestHost);
    const host = element.querySelector('nx-progress-bar');
    expect(host?.classList.contains('progress-bar--default')).toBe(true);
  });

  it('should apply progress-bar--xp class for xp variant', async () => {
    const { fixture, element } = await createComponent(TestHost, {
      detectChanges: false,
    });
    fixture.componentInstance.variant = 'xp';
    fixture.detectChanges();
    await fixture.whenStable();
    const host = element.querySelector('nx-progress-bar');
    expect(host?.classList.contains('progress-bar--xp')).toBe(true);
  });

  it('should apply progress-bar--mastery class for mastery variant', async () => {
    const { fixture, element } = await createComponent(TestHost, {
      detectChanges: false,
    });
    fixture.componentInstance.variant = 'mastery';
    fixture.detectChanges();
    await fixture.whenStable();
    const host = element.querySelector('nx-progress-bar');
    expect(host?.classList.contains('progress-bar--mastery')).toBe(true);
  });

  it('should apply progress-bar--timer class for timer variant', async () => {
    const { fixture, element } = await createComponent(TestHost, {
      detectChanges: false,
    });
    fixture.componentInstance.variant = 'timer';
    fixture.detectChanges();
    await fixture.whenStable();
    const host = element.querySelector('nx-progress-bar');
    expect(host?.classList.contains('progress-bar--timer')).toBe(true);
  });

  it('should apply safe class on fill for timer variant when percentage >= 50', async () => {
    const { fixture, element } = await createComponent(TestHost, {
      detectChanges: false,
    });
    fixture.componentInstance.variant = 'timer';
    fixture.componentInstance.value = 60;
    fixture.componentInstance.max = 100;
    fixture.detectChanges();
    await fixture.whenStable();
    const fill = element.querySelector('.progress-bar__fill');
    expect(fill?.classList.contains('progress-bar__fill--safe')).toBe(true);
    expect(fill?.classList.contains('progress-bar__fill--warning')).toBe(false);
    expect(fill?.classList.contains('progress-bar__fill--critical')).toBe(
      false,
    );
  });

  it('should apply warning class on fill for timer variant when percentage 25-49', async () => {
    const { fixture, element } = await createComponent(TestHost, {
      detectChanges: false,
    });
    fixture.componentInstance.variant = 'timer';
    fixture.componentInstance.value = 30;
    fixture.componentInstance.max = 100;
    fixture.detectChanges();
    await fixture.whenStable();
    const fill = element.querySelector('.progress-bar__fill');
    expect(fill?.classList.contains('progress-bar__fill--warning')).toBe(true);
    expect(fill?.classList.contains('progress-bar__fill--safe')).toBe(false);
    expect(fill?.classList.contains('progress-bar__fill--critical')).toBe(
      false,
    );
  });

  it('should apply critical class on fill for timer variant when percentage < 25', async () => {
    const { fixture, element } = await createComponent(TestHost, {
      detectChanges: false,
    });
    fixture.componentInstance.variant = 'timer';
    fixture.componentInstance.value = 20;
    fixture.componentInstance.max = 100;
    fixture.detectChanges();
    await fixture.whenStable();
    const fill = element.querySelector('.progress-bar__fill');
    expect(fill?.classList.contains('progress-bar__fill--critical')).toBe(true);
    expect(fill?.classList.contains('progress-bar__fill--safe')).toBe(false);
    expect(fill?.classList.contains('progress-bar__fill--warning')).toBe(false);
  });

  it('should have role=progressbar on host', async () => {
    const { element } = await createComponent(TestHost);
    const host = element.querySelector('nx-progress-bar');
    expect(host?.getAttribute('role')).toBe('progressbar');
  });

  it('should set aria-valuenow to computed percentage (rounded)', async () => {
    const { fixture, element } = await createComponent(TestHost, {
      detectChanges: false,
    });
    fixture.componentInstance.value = 1;
    fixture.componentInstance.max = 3;
    fixture.detectChanges();
    await fixture.whenStable();
    const host = element.querySelector('nx-progress-bar');
    // 1/3 = 33.333... -> rounded to 33
    expect(host?.getAttribute('aria-valuenow')).toBe('33');
  });

  it('should set aria-valuemin to 0 and aria-valuemax to 100', async () => {
    const { element } = await createComponent(TestHost);
    const host = element.querySelector('nx-progress-bar');
    expect(host?.getAttribute('aria-valuemin')).toBe('0');
    expect(host?.getAttribute('aria-valuemax')).toBe('100');
  });

  it('should set custom aria-label when label is provided', async () => {
    const { fixture, element } = await createComponent(TestHost, {
      detectChanges: false,
    });
    fixture.componentInstance.label = 'Phase progress';
    fixture.detectChanges();
    await fixture.whenStable();
    const host = element.querySelector('nx-progress-bar');
    expect(host?.getAttribute('aria-label')).toBe('Phase progress');
  });

  it('should set default aria-label when no label is provided', async () => {
    const { element } = await createComponent(TestHost);
    const host = element.querySelector('nx-progress-bar');
    expect(host?.getAttribute('aria-label')).toBe('Progress: 50%');
  });

  it('should update fill width and aria-valuenow when value changes dynamically', async () => {
    const { fixture, element } = await createComponent(TestHost);

    const host = element.querySelector('nx-progress-bar');
    const fill = element.querySelector('.progress-bar__fill') as HTMLElement;

    // Initial state: 50/100 = 50%
    expect(fill.style.width).toBe('50%');
    expect(host?.getAttribute('aria-valuenow')).toBe('50');

    // Update to 80/100 = 80%
    fixture.componentInstance.value = 80;
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fill.style.width).toBe('80%');
    expect(host?.getAttribute('aria-valuenow')).toBe('80');
  });
});
