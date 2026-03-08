import { Component } from '@angular/core';
import {
  LucideIconConfig,
  LucideIconProvider,
  LUCIDE_ICONS,
} from 'lucide-angular';
import { createComponent } from '../../../../testing/test-utils';
import { APP_ICONS } from '../../icons';
import { MissionCardComponent } from './mission-card';
import type { ChapterId, StoryMission } from '../../../core/curriculum';

@Component({
  template: `
    <nx-mission-card
      [mission]="mission"
      [isCompleted]="completed"
      [isLocked]="locked"
      [isCurrent]="current"
      (missionClicked)="clicked = $event" />
  `,
  imports: [MissionCardComponent],
})
class TestHost {
  mission: StoryMission = {
    chapterId: 5,
    title: 'Module Configuration Panels',
    angularTopic: 'Property Binding',
    narrative: 'Bind configuration data',
    unlocksMinigame: 'wire-protocol',
    deps: [4],
    phase: 1,
  };
  completed = false;
  locked = false;
  current = false;
  clicked: ChapterId | null = null;
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

describe('MissionCardComponent', () => {
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
    return element.querySelector('nx-mission-card') as HTMLElement;
  }

  it('should create the component', async () => {
    const { element } = await setup();
    const host = getHost(element);
    expect(host).toBeTruthy();
  });

  it('should display chapter number badge', async () => {
    const { element } = await setup();
    const badge = element.querySelector('.mission-card__badge');
    expect(badge).toBeTruthy();
    expect(badge!.textContent!.trim()).toBe('5');
  });

  it('should display mission title', async () => {
    const { element } = await setup();
    const title = element.querySelector('.mission-card__title');
    expect(title).toBeTruthy();
    expect(title!.textContent).toContain('Module Configuration Panels');
  });

  it('should display Angular topic', async () => {
    const { element } = await setup();
    const topic = element.querySelector('.mission-card__topic');
    expect(topic).toBeTruthy();
    expect(topic!.textContent).toContain('Property Binding');
  });

  it('should emit missionClicked with chapterId on click', async () => {
    const { fixture, element } = await setup();
    const host = getHost(element);
    host.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.clicked).toBe(5);
  });

  it('should not emit missionClicked when locked', async () => {
    const { fixture, element } = await setup({ locked: true });
    const host = getHost(element);
    host.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.clicked).toBeNull();
  });

  it('should apply completed class and show checkmark icon', async () => {
    const { element } = await setup({ completed: true });
    const host = getHost(element);
    expect(host.classList.contains('mission-card--completed')).toBe(true);
    const icon = element.querySelector(
      '.mission-card__status lucide-icon',
    );
    expect(icon).toBeTruthy();
    expect(icon!.getAttribute('name')).toBe('circle-check');
  });

  it('should apply locked class and show lock icon', async () => {
    const { element } = await setup({ locked: true });
    const host = getHost(element);
    expect(host.classList.contains('mission-card--locked')).toBe(true);
    const icon = element.querySelector(
      '.mission-card__status lucide-icon',
    );
    expect(icon).toBeTruthy();
    expect(icon!.getAttribute('name')).toBe('lock');
  });

  it('should apply current class and show Continue badge', async () => {
    const { element } = await setup({ current: true });
    const host = getHost(element);
    expect(host.classList.contains('mission-card--current')).toBe(true);
    const badge = element.querySelector('.mission-card__continue-badge');
    expect(badge).toBeTruthy();
    expect(badge!.textContent).toContain('Continue');
  });

  it('should not show any status icon or badge in default state', async () => {
    const { element } = await setup();
    const icon = element.querySelector(
      '.mission-card__status lucide-icon',
    );
    const badge = element.querySelector('.mission-card__continue-badge');
    expect(icon).toBeNull();
    expect(badge).toBeNull();
  });

  it('should set aria-disabled when locked', async () => {
    const { element } = await setup({ locked: true });
    const host = getHost(element);
    expect(host.getAttribute('aria-disabled')).toBe('true');
  });

  it('should not set aria-disabled when not locked', async () => {
    const { element } = await setup();
    const host = getHost(element);
    expect(host.getAttribute('aria-disabled')).toBeNull();
  });

  it('should have role="article" on host', async () => {
    const { element } = await setup();
    const host = getHost(element);
    expect(host.getAttribute('role')).toBe('article');
  });

  it('should set aria-label with mission info', async () => {
    const { element } = await setup();
    const host = getHost(element);
    expect(host.getAttribute('aria-label')).toBe(
      'Mission 5: Module Configuration Panels - Property Binding',
    );
  });

  it('should update dynamically from locked to unlocked', async () => {
    const { fixture, element } = await setup({ locked: true });
    const host = getHost(element);

    // Locked state
    expect(host.classList.contains('mission-card--locked')).toBe(true);
    expect(host.getAttribute('aria-disabled')).toBe('true');
    const lockIcon = element.querySelector(
      '.mission-card__status lucide-icon',
    );
    expect(lockIcon).toBeTruthy();
    expect(lockIcon!.getAttribute('name')).toBe('lock');

    // Switch to unlocked
    fixture.componentInstance.locked = false;
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(host.classList.contains('mission-card--locked')).toBe(false);
    expect(host.getAttribute('aria-disabled')).toBeNull();
    const iconAfter = element.querySelector(
      '.mission-card__status lucide-icon',
    );
    expect(iconAfter).toBeNull();
  });
});
