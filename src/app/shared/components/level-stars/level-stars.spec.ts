import { Component } from '@angular/core';
import {
  LucideIconConfig,
  LucideIconProvider,
  LUCIDE_ICONS,
} from 'lucide-angular';
import { createComponent } from '../../../../testing/test-utils';
import { APP_ICONS } from '../../icons';
import { LevelStarsComponent } from './level-stars';

@Component({
  template: `<nx-level-stars [stars]="stars" [size]="size" />`,
  imports: [LevelStarsComponent],
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

describe('LevelStarsComponent', () => {
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
    return element.querySelector('nx-level-stars') as HTMLElement;
  }

  it('should create the component', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
  });

  it('should render 3 star icons', async () => {
    const { element } = await setup({ stars: 1 });
    const host = getHost(element);
    const icons = host.querySelectorAll('lucide-icon');
    expect(icons.length).toBe(3);
  });

  it('should render all empty at 0 stars', async () => {
    const { element } = await setup({ stars: 0 });
    const host = getHost(element);
    const filled = host.querySelectorAll('.level-stars__star--filled');
    const empty = host.querySelectorAll('.level-stars__star--empty');
    expect(filled.length).toBe(0);
    expect(empty.length).toBe(3);
  });

  it('should render 1 filled and 2 empty at 1 star', async () => {
    const { element } = await setup({ stars: 1 });
    const host = getHost(element);
    const filled = host.querySelectorAll('.level-stars__star--filled');
    const empty = host.querySelectorAll('.level-stars__star--empty');
    expect(filled.length).toBe(1);
    expect(empty.length).toBe(2);
  });

  it('should render 2 filled and 1 empty at 2 stars', async () => {
    const { element } = await setup({ stars: 2 });
    const host = getHost(element);
    const filled = host.querySelectorAll('.level-stars__star--filled');
    const empty = host.querySelectorAll('.level-stars__star--empty');
    expect(filled.length).toBe(2);
    expect(empty.length).toBe(1);
  });

  it('should render all filled at 3 stars', async () => {
    const { element } = await setup({ stars: 3 });
    const host = getHost(element);
    const filled = host.querySelectorAll('.level-stars__star--filled');
    expect(filled.length).toBe(3);
  });

  it('should not set --level-star-color at 0 stars', async () => {
    const { element } = await setup({ stars: 0 });
    const host = getHost(element);
    expect(host.style.getPropertyValue('--level-star-color')).toBe('');
  });

  it('should set --level-star-color to var(--nx-color-corridor) at 1 star', async () => {
    const { element } = await setup({ stars: 1 });
    const host = getHost(element);
    expect(host.style.getPropertyValue('--level-star-color').trim()).toBe(
      'var(--nx-color-corridor)',
    );
  });

  it('should set --level-star-color to var(--nx-color-alert-orange) at 2 stars', async () => {
    const { element } = await setup({ stars: 2 });
    const host = getHost(element);
    expect(host.style.getPropertyValue('--level-star-color').trim()).toBe(
      'var(--nx-color-alert-orange)',
    );
  });

  it('should set --level-star-color to var(--nx-color-solar-gold) at 3 stars', async () => {
    const { element } = await setup({ stars: 3 });
    const host = getHost(element);
    expect(host.style.getPropertyValue('--level-star-color').trim()).toBe(
      'var(--nx-color-solar-gold)',
    );
  });

  it('should set aria-label to "0 out of 3 stars" at 0 stars', async () => {
    const { element } = await setup({ stars: 0 });
    const host = getHost(element);
    expect(host.getAttribute('aria-label')).toBe('0 out of 3 stars');
  });

  it('should set aria-label to "2 out of 3 stars" at 2 stars', async () => {
    const { element } = await setup({ stars: 2 });
    const host = getHost(element);
    expect(host.getAttribute('aria-label')).toBe('2 out of 3 stars');
  });

  it('should set aria-label to "3 out of 3 stars" at 3 stars', async () => {
    const { element } = await setup({ stars: 3 });
    const host = getHost(element);
    expect(host.getAttribute('aria-label')).toBe('3 out of 3 stars');
  });

  it('should have role=img on host', async () => {
    const { element } = await setup();
    const host = getHost(element);
    expect(host.getAttribute('role')).toBe('img');
  });

  it('should apply level-stars--pulse class at 3 stars', async () => {
    const { element } = await setup({ stars: 3 });
    const host = getHost(element);
    expect(host.classList.contains('level-stars--pulse')).toBe(true);
  });

  it('should not apply level-stars--pulse class below 3 stars', async () => {
    const { element } = await setup({ stars: 2 });
    const host = getHost(element);
    expect(host.classList.contains('level-stars--pulse')).toBe(false);
  });

  it('should apply level-stars--sm class and icon size 16 for sm', async () => {
    const { element } = await setup({ size: 'sm', stars: 1 });
    const host = getHost(element);
    expect(host.classList.contains('level-stars--sm')).toBe(true);
    const svg = host.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('16');
  });

  it('should apply level-stars--md class and icon size 20 for md (default)', async () => {
    const { element } = await setup({ stars: 1 });
    const host = getHost(element);
    expect(host.classList.contains('level-stars--md')).toBe(true);
    const svg = host.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('20');
  });

  it('should apply level-stars--lg class and icon size 24 for lg', async () => {
    const { element } = await setup({ size: 'lg', stars: 1 });
    const host = getHost(element);
    expect(host.classList.contains('level-stars--lg')).toBe(true);
    const svg = host.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('24');
  });

  it('should clamp stars above 3', async () => {
    const { element } = await setup({ stars: 5 });
    const host = getHost(element);
    const filled = host.querySelectorAll('.level-stars__star--filled');
    expect(filled.length).toBe(3);
    expect(host.getAttribute('aria-label')).toBe('3 out of 3 stars');
  });

  it('should clamp stars below 0', async () => {
    const { element } = await setup({ stars: -1 });
    const host = getHost(element);
    const filled = host.querySelectorAll('.level-stars__star--filled');
    expect(filled.length).toBe(0);
    expect(host.getAttribute('aria-label')).toBe('0 out of 3 stars');
  });

  it('should update when stars changes dynamically', async () => {
    const { fixture, element } = await setup({ stars: 1 });
    const host = getHost(element);

    // Initial state: 1 filled
    expect(host.querySelectorAll('.level-stars__star--filled').length).toBe(1);
    expect(host.style.getPropertyValue('--level-star-color').trim()).toBe(
      'var(--nx-color-corridor)',
    );
    expect(host.getAttribute('aria-label')).toBe('1 out of 3 stars');

    // Update to 3 stars
    fixture.componentInstance.stars = 3;
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(host.querySelectorAll('.level-stars__star--filled').length).toBe(3);
    expect(host.style.getPropertyValue('--level-star-color').trim()).toBe(
      'var(--nx-color-solar-gold)',
    );
    expect(host.getAttribute('aria-label')).toBe('3 out of 3 stars');
  });
});
