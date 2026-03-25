import { Component } from '@angular/core';
import {
  LucideIconConfig,
  LucideIconProvider,
  LUCIDE_ICONS,
} from 'lucide-angular';
import { createComponent } from '../../../../testing/test-utils';
import { APP_ICONS } from '../../icons';
import { LevelCardComponent } from './level-card';

@Component({
  template: `
    <nx-level-card
      [levelId]="levelId"
      [levelNumber]="levelNumber"
      [levelTitle]="levelTitle"
      [starRating]="starRating"
      [bestScore]="bestScore"
      [isLocked]="locked"
      [isCurrent]="current"
      (levelClicked)="clicked = $event" />
  `,
  imports: [LevelCardComponent],
})
class TestHost {
  levelId = 'ma-basic-01';
  levelNumber = 1;
  levelTitle = 'Minimal Component';
  starRating = 0;
  bestScore: number | null = null;
  locked = false;
  current = false;
  clicked: string | null = null;
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

describe('LevelCardComponent', () => {
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
    return element.querySelector('nx-level-card') as HTMLElement;
  }

  it('should create the component', async () => {
    const { element } = await setup();
    const host = getHost(element);
    expect(host).toBeTruthy();
  });

  it('should display level number in badge', async () => {
    const { element } = await setup();
    const badge = element.querySelector('.level-card__number');
    expect(badge).toBeTruthy();
    expect(badge!.textContent!.trim()).toBe('1');
  });

  it('should display level title', async () => {
    const { element } = await setup();
    const title = element.querySelector('.level-card__title');
    expect(title).toBeTruthy();
    expect(title!.textContent).toContain('Minimal Component');
  });

  it('should render LevelStarsComponent with correct star count', async () => {
    const { element } = await setup({ starRating: 2 });
    const stars = element.querySelector('nx-level-stars');
    expect(stars).toBeTruthy();
    const filled = element.querySelectorAll('.level-stars__star--filled');
    expect(filled.length).toBe(2);
  });

  it('should display best score when provided', async () => {
    const { element } = await setup({ bestScore: 500 });
    const score = element.querySelector('.level-card__score');
    expect(score).toBeTruthy();
    expect(score!.textContent).toContain('500');
  });

  it('should display "--" when bestScore is null', async () => {
    const { element } = await setup({ bestScore: null });
    const score = element.querySelector('.level-card__score');
    expect(score).toBeTruthy();
    expect(score!.textContent).toContain('--');
  });

  it('should emit levelClicked with levelId on click', async () => {
    const { fixture, element } = await setup();
    const host = getHost(element);
    host.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.clicked).toBe('ma-basic-01');
  });

  it('should not emit levelClicked when locked', async () => {
    const { fixture, element } = await setup({ locked: true });
    const host = getHost(element);
    host.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.clicked).toBeNull();
  });

  it('should apply locked class when isLocked=true', async () => {
    const { element } = await setup({ locked: true });
    const host = getHost(element);
    expect(host.classList.contains('level-card--locked')).toBe(true);
  });

  it('should not apply locked class when isLocked=false', async () => {
    const { element } = await setup({ locked: false });
    const host = getHost(element);
    expect(host.classList.contains('level-card--locked')).toBe(false);
  });

  it('should show lock icon when locked', async () => {
    const { element } = await setup({ locked: true });
    const icon = element.querySelector(
      'nx-level-card > lucide-icon[name="lock"]',
    );
    expect(icon).toBeTruthy();
  });

  it('should not show lock icon when unlocked', async () => {
    const { element } = await setup({ locked: false });
    const icon = element.querySelector(
      'nx-level-card > lucide-icon[name="lock"]',
    );
    expect(icon).toBeNull();
  });

  it('should apply current class when isCurrent=true', async () => {
    const { element } = await setup({ current: true });
    const host = getHost(element);
    expect(host.classList.contains('level-card--current')).toBe(true);
  });

  it('should not apply current class when isCurrent=false', async () => {
    const { element } = await setup({ current: false });
    const host = getHost(element);
    expect(host.classList.contains('level-card--current')).toBe(false);
  });

  it('should set aria-label with level number and title', async () => {
    const { element } = await setup();
    const host = getHost(element);
    expect(host.getAttribute('aria-label')).toBe(
      'Level 1: Minimal Component',
    );
  });

  it('should set aria-disabled when locked', async () => {
    const { element } = await setup({ locked: true });
    const host = getHost(element);
    expect(host.getAttribute('aria-disabled')).toBe('true');
  });

  it('should not set aria-disabled when unlocked', async () => {
    const { element } = await setup({ locked: false });
    const host = getHost(element);
    expect(host.getAttribute('aria-disabled')).toBeNull();
  });

  it('should have role="article" on host', async () => {
    const { element } = await setup();
    const host = getHost(element);
    expect(host.getAttribute('role')).toBe('article');
  });
});
