import { Component } from '@angular/core';
import {
  LucideIconConfig,
  LucideIconProvider,
  LUCIDE_ICONS,
} from 'lucide-angular';
import { createComponent } from '../../../../testing/test-utils';
import { APP_ICONS } from '../../icons';
import { ActiveMissionCardComponent } from './active-mission-card';
import type { ChapterId, StoryMission } from '../../../core/curriculum';

const TEST_MISSION: StoryMission = {
  chapterId: 3,
  title: 'Power Routing',
  angularTopic: 'Dependency Injection',
  narrative: 'Route power to subsystems',
  unlocksMinigame: 'flow-commander',
  deps: [1, 2],
  phase: 1,
};

@Component({
  template: `
    <nx-active-mission-card
      [mission]="mission"
      [isAllComplete]="allComplete"
      [totalXp]="xp"
      (continueClicked)="clickedId = $event" />
  `,
  imports: [ActiveMissionCardComponent],
})
class TestHost {
  mission: StoryMission | null = TEST_MISSION;
  allComplete = false;
  xp = 0;
  clickedId: ChapterId | null = null;
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

describe('ActiveMissionCardComponent', () => {
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
    return element.querySelector('nx-active-mission-card') as HTMLElement;
  }

  it('should create the component', async () => {
    const { element } = await setup();
    const host = getHost(element);
    expect(host).toBeTruthy();
  });

  it('should display chapter badge with chapter number when mission is active', async () => {
    const { element } = await setup();
    const badge = element.querySelector('.active-mission-card__badge');
    expect(badge).toBeTruthy();
    expect(badge!.textContent!.trim()).toBe('3');
  });

  it('should display mission title when mission is active', async () => {
    const { element } = await setup();
    const title = element.querySelector('.active-mission-card__title');
    expect(title).toBeTruthy();
    expect(title!.textContent).toContain('Power Routing');
  });

  it('should display Angular topic when mission is active', async () => {
    const { element } = await setup();
    const topic = element.querySelector('.active-mission-card__topic');
    expect(topic).toBeTruthy();
    expect(topic!.textContent).toContain('Dependency Injection');
  });

  it('should show Continue button when mission is active', async () => {
    const { element } = await setup();
    const button = element.querySelector('.active-mission-card__action');
    expect(button).toBeTruthy();
    expect(button!.textContent!.trim()).toBe('Continue');
  });

  it('should emit continueClicked with chapterId when Continue is clicked', async () => {
    const { fixture, element } = await setup();
    const button = element.querySelector(
      '.active-mission-card__action',
    ) as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.clickedId).toBe(3);
  });

  it('should apply active host class when mission is active', async () => {
    const { element } = await setup();
    const host = getHost(element);
    expect(host.classList.contains('active-mission-card--active')).toBe(true);
  });

  it('should show Campaign Complete when isAllComplete is true', async () => {
    const { element } = await setup({ allComplete: true });
    const title = element.querySelector('.active-mission-card__title');
    expect(title).toBeTruthy();
    expect(title!.textContent).toContain('Campaign Complete');
  });

  it('should show trophy icon when all complete', async () => {
    const { element } = await setup({ allComplete: true });
    const icon = element.querySelector('lucide-icon[name="trophy"]');
    expect(icon).toBeTruthy();
  });

  it('should display total XP when all complete', async () => {
    const { element } = await setup({ allComplete: true, xp: 1500 });
    const summary = element.querySelector('.active-mission-card__summary');
    expect(summary).toBeTruthy();
    expect(summary!.textContent).toContain('1500');
  });

  it('should apply complete host class when all complete', async () => {
    const { element } = await setup({ allComplete: true });
    const host = getHost(element);
    expect(host.classList.contains('active-mission-card--complete')).toBe(true);
  });

  it('should not show Continue button when all complete', async () => {
    const { element } = await setup({ allComplete: true });
    const button = element.querySelector('.active-mission-card__action');
    expect(button).toBeNull();
  });

  it('should show "Begin your journey" when no mission and not all complete', async () => {
    const { element } = await setup({ mission: null, allComplete: false });
    const title = element.querySelector('.active-mission-card__title');
    expect(title).toBeTruthy();
    expect(title!.textContent).toContain('Begin your journey');
  });

  it('should show "Start Mission 1" button when no mission', async () => {
    const { element } = await setup({ mission: null, allComplete: false });
    const button = element.querySelector('.active-mission-card__action');
    expect(button).toBeTruthy();
    expect(button!.textContent!.trim()).toBe('Start Mission 1');
  });

  it('should emit continueClicked with chapterId 1 when Start Mission 1 is clicked', async () => {
    const { fixture, element } = await setup({
      mission: null,
      allComplete: false,
    });
    const button = element.querySelector(
      '.active-mission-card__action',
    ) as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.clickedId).toBe(1);
  });

  it('should apply empty host class when no mission and not all complete', async () => {
    const { element } = await setup({ mission: null, allComplete: false });
    const host = getHost(element);
    expect(host.classList.contains('active-mission-card--empty')).toBe(true);
  });

  it('should have role="region" on host', async () => {
    const { element } = await setup();
    const host = getHost(element);
    expect(host.getAttribute('role')).toBe('region');
  });

  it('should have aria-label on host', async () => {
    const { element } = await setup();
    const host = getHost(element);
    expect(host.getAttribute('aria-label')).toBe('Active mission');
  });
});
