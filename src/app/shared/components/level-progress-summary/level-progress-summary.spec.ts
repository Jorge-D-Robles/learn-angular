import { Component } from '@angular/core';
import {
  LucideIconConfig,
  LucideIconProvider,
  LUCIDE_ICONS,
} from 'lucide-angular';
import { createComponent } from '../../../../testing/test-utils';
import { APP_ICONS } from '../../icons';
import { LevelProgressSummaryComponent } from './level-progress-summary';

@Component({
  template: `<nx-level-progress-summary
    [completedLevels]="completedLevels"
    [totalLevels]="totalLevels"
    [totalStars]="totalStars"
    [maxStars]="maxStars"
    [variant]="variant" />`,
  imports: [LevelProgressSummaryComponent],
})
class TestHost {
  completedLevels = 12;
  totalLevels = 18;
  totalStars = 36;
  maxStars = 54;
  variant: 'compact' | 'full' = 'compact';
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

describe('LevelProgressSummaryComponent', () => {
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
    return element.querySelector('nx-level-progress-summary') as HTMLElement;
  }

  it('should create the component', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
  });

  it('should display completion fraction "12/18"', async () => {
    const { element } = await setup();
    const fraction = element.querySelector(
      '.level-progress-summary__fraction',
    );
    expect(fraction?.textContent?.trim()).toBe('12/18');
  });

  it('should display star count "36/54"', async () => {
    const { element } = await setup();
    const stars = element.querySelector('.level-progress-summary__stars');
    expect(stars?.textContent).toContain('36/54');
  });

  it('should render a progress bar with correct value and max', async () => {
    const { element } = await setup();
    const bar = element.querySelector('nx-progress-bar');
    expect(bar).toBeTruthy();
    expect(bar?.getAttribute('aria-valuenow')).toBe('67');
  });

  it('should display "0/0" when totalLevels is 0', async () => {
    const { element } = await setup({
      completedLevels: 0,
      totalLevels: 0,
      totalStars: 0,
      maxStars: 0,
    });
    const fraction = element.querySelector(
      '.level-progress-summary__fraction',
    );
    expect(fraction?.textContent?.trim()).toBe('0/0');
  });

  it('should clamp completedLevels to totalLevels when exceeded', async () => {
    const { element } = await setup({
      completedLevels: 20,
      totalLevels: 18,
    });
    const fraction = element.querySelector(
      '.level-progress-summary__fraction',
    );
    expect(fraction?.textContent?.trim()).toBe('18/18');
  });

  it('should clamp negative completedLevels to 0', async () => {
    const { element } = await setup({
      completedLevels: -5,
      totalLevels: 18,
    });
    const fraction = element.querySelector(
      '.level-progress-summary__fraction',
    );
    expect(fraction?.textContent?.trim()).toBe('0/18');
  });

  it('should clamp totalStars to maxStars when exceeded', async () => {
    const { element } = await setup({
      totalStars: 60,
      maxStars: 54,
    });
    const stars = element.querySelector('.level-progress-summary__stars');
    expect(stars?.textContent).toContain('54/54');
  });

  it('should clamp negative totalStars to 0', async () => {
    const { element } = await setup({
      totalStars: -3,
      maxStars: 54,
    });
    const stars = element.querySelector('.level-progress-summary__stars');
    expect(stars?.textContent).toContain('0/54');
  });

  it('should apply compact variant class on host', async () => {
    const { element } = await setup({ variant: 'compact' });
    const host = getHost(element);
    expect(
      host.classList.contains('level-progress-summary--compact'),
    ).toBe(true);
  });

  it('should apply full variant class on host', async () => {
    const { element } = await setup({ variant: 'full' });
    const host = getHost(element);
    expect(host.classList.contains('level-progress-summary--full')).toBe(
      true,
    );
  });

  it('should render star icon', async () => {
    const { element } = await setup();
    const host = getHost(element);
    const icon = host.querySelector('lucide-icon');
    expect(icon).toBeTruthy();
    expect(icon?.getAttribute('name')).toBe('star');
  });

  it('should set aria-label with level and star counts', async () => {
    const { element } = await setup();
    const host = getHost(element);
    expect(host.getAttribute('aria-label')).toBe(
      'Level progress: 12 of 18 levels completed, 36 of 54 stars earned',
    );
  });

  it('should have role="group" on host', async () => {
    const { element } = await setup();
    const host = getHost(element);
    expect(host.getAttribute('role')).toBe('group');
  });

  it('should update display when inputs change dynamically', async () => {
    const { fixture, element } = await setup();

    const fraction = element.querySelector(
      '.level-progress-summary__fraction',
    );
    expect(fraction?.textContent?.trim()).toBe('12/18');

    fixture.componentInstance.completedLevels = 15;
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fraction?.textContent?.trim()).toBe('15/18');

    const host = getHost(element);
    expect(host.getAttribute('aria-label')).toBe(
      'Level progress: 15 of 18 levels completed, 36 of 54 stars earned',
    );
  });
});
