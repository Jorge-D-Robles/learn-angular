import { Component } from '@angular/core';
import {
  LucideIconConfig,
  LucideIconProvider,
  LUCIDE_ICONS,
} from 'lucide-angular';
import { createComponent } from '../../../../testing/test-utils';
import { APP_ICONS } from '../../icons';
import { MasteryStarsComponent } from './mastery-stars';

@Component({
  template: `<nx-mastery-stars [stars]="stars" [size]="size" />`,
  imports: [MasteryStarsComponent],
})
class TestHost {
  stars = 0;
  size: 'sm' | 'md' | 'lg' = 'md';
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

describe('MasteryStarsComponent', () => {
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
    return element.querySelector('nx-mastery-stars') as HTMLElement;
  }

  it('should create the component', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
  });

  it('should render 5 star icons', async () => {
    const { element } = await setup({ stars: 3 });
    const host = getHost(element);
    const icons = host.querySelectorAll('lucide-icon');
    expect(icons.length).toBe(5);
  });

  it('should render all empty at 0 stars', async () => {
    const { element } = await setup({ stars: 0 });
    const host = getHost(element);
    const filled = host.querySelectorAll('.mastery-stars__star--filled');
    const empty = host.querySelectorAll('.mastery-stars__star--empty');
    expect(filled.length).toBe(0);
    expect(empty.length).toBe(5);
  });

  it('should render 3 filled and 2 empty at 3 stars', async () => {
    const { element } = await setup({ stars: 3 });
    const host = getHost(element);
    const filled = host.querySelectorAll('.mastery-stars__star--filled');
    const empty = host.querySelectorAll('.mastery-stars__star--empty');
    expect(filled.length).toBe(3);
    expect(empty.length).toBe(2);
  });

  it('should render all filled at 5 stars', async () => {
    const { element } = await setup({ stars: 5 });
    const host = getHost(element);
    const filled = host.querySelectorAll('.mastery-stars__star--filled');
    expect(filled.length).toBe(5);
  });

  it('should not set --mastery-glow at 0 stars', async () => {
    const { element } = await setup({ stars: 0 });
    const host = getHost(element);
    expect(host.style.getPropertyValue('--mastery-glow')).toBe('');
  });

  it('should set --mastery-glow to var(--nx-mastery-1) at 1 star', async () => {
    const { element } = await setup({ stars: 1 });
    const host = getHost(element);
    expect(host.style.getPropertyValue('--mastery-glow').trim()).toBe(
      'var(--nx-mastery-1)',
    );
  });

  it('should set --mastery-glow to var(--nx-mastery-2) at 2 stars', async () => {
    const { element } = await setup({ stars: 2 });
    const host = getHost(element);
    expect(host.style.getPropertyValue('--mastery-glow').trim()).toBe(
      'var(--nx-mastery-2)',
    );
  });

  it('should set --mastery-glow to var(--nx-mastery-3) at 3 stars', async () => {
    const { element } = await setup({ stars: 3 });
    const host = getHost(element);
    expect(host.style.getPropertyValue('--mastery-glow').trim()).toBe(
      'var(--nx-mastery-3)',
    );
  });

  it('should set --mastery-glow to var(--nx-mastery-4) at 4 stars', async () => {
    const { element } = await setup({ stars: 4 });
    const host = getHost(element);
    expect(host.style.getPropertyValue('--mastery-glow').trim()).toBe(
      'var(--nx-mastery-4)',
    );
  });

  it('should set --mastery-glow to var(--nx-mastery-5) at 5 stars', async () => {
    const { element } = await setup({ stars: 5 });
    const host = getHost(element);
    expect(host.style.getPropertyValue('--mastery-glow').trim()).toBe(
      'var(--nx-mastery-5)',
    );
  });

  it('should set aria-label to "0 out of 5 stars mastery" at 0 stars', async () => {
    const { element } = await setup({ stars: 0 });
    const host = getHost(element);
    expect(host.getAttribute('aria-label')).toBe('0 out of 5 stars mastery');
  });

  it('should set aria-label to "3 out of 5 stars mastery" at 3 stars', async () => {
    const { element } = await setup({ stars: 3 });
    const host = getHost(element);
    expect(host.getAttribute('aria-label')).toBe('3 out of 5 stars mastery');
  });

  it('should set aria-label to "5 out of 5 stars mastery" at 5 stars', async () => {
    const { element } = await setup({ stars: 5 });
    const host = getHost(element);
    expect(host.getAttribute('aria-label')).toBe('5 out of 5 stars mastery');
  });

  it('should have role=img on host', async () => {
    const { element } = await setup();
    const host = getHost(element);
    expect(host.getAttribute('role')).toBe('img');
  });

  it('should apply mastery-stars--pulse class at 5 stars', async () => {
    const { element } = await setup({ stars: 5 });
    const host = getHost(element);
    expect(host.classList.contains('mastery-stars--pulse')).toBe(true);
  });

  it('should not apply mastery-stars--pulse class below 5 stars', async () => {
    const { element } = await setup({ stars: 4 });
    const host = getHost(element);
    expect(host.classList.contains('mastery-stars--pulse')).toBe(false);
  });

  it('should apply mastery-stars--sm class and icon size 16 for sm', async () => {
    const { element } = await setup({ size: 'sm' });
    const host = getHost(element);
    expect(host.classList.contains('mastery-stars--sm')).toBe(true);
    const svg = host.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('16');
  });

  it('should apply mastery-stars--md class and icon size 20 for md (default)', async () => {
    const { element } = await setup();
    const host = getHost(element);
    expect(host.classList.contains('mastery-stars--md')).toBe(true);
    const svg = host.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('20');
  });

  it('should apply mastery-stars--lg class and icon size 24 for lg', async () => {
    const { element } = await setup({ size: 'lg' });
    const host = getHost(element);
    expect(host.classList.contains('mastery-stars--lg')).toBe(true);
    const svg = host.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('24');
  });

  it('should clamp stars above 5', async () => {
    const { element } = await setup({ stars: 7 });
    const host = getHost(element);
    const filled = host.querySelectorAll('.mastery-stars__star--filled');
    expect(filled.length).toBe(5);
    expect(host.getAttribute('aria-label')).toBe('5 out of 5 stars mastery');
  });

  it('should clamp stars below 0', async () => {
    const { element } = await setup({ stars: -1 });
    const host = getHost(element);
    const filled = host.querySelectorAll('.mastery-stars__star--filled');
    expect(filled.length).toBe(0);
    expect(host.getAttribute('aria-label')).toBe('0 out of 5 stars mastery');
  });

  it('should update when stars changes dynamically', async () => {
    const { fixture, element } = await setup({ stars: 2 });
    const host = getHost(element);

    // Initial state: 2 filled
    expect(host.querySelectorAll('.mastery-stars__star--filled').length).toBe(2);
    expect(host.style.getPropertyValue('--mastery-glow').trim()).toBe(
      'var(--nx-mastery-2)',
    );
    expect(host.getAttribute('aria-label')).toBe('2 out of 5 stars mastery');

    // Update to 4 stars
    fixture.componentInstance.stars = 4;
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(host.querySelectorAll('.mastery-stars__star--filled').length).toBe(4);
    expect(host.style.getPropertyValue('--mastery-glow').trim()).toBe(
      'var(--nx-mastery-4)',
    );
    expect(host.getAttribute('aria-label')).toBe('4 out of 5 stars mastery');
  });
});
