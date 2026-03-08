import { Component, signal, WritableSignal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { provideRouter, RouterLinkActive } from '@angular/router';
import { createComponent, getMockProvider } from '../../testing/test-utils';
import { BottomNavComponent } from './bottom-nav';
import { GameProgressionService } from '../core/progression/game-progression.service';
import type { StoryMission } from '../core/curriculum/curriculum.types';

function stubMission(chapterId: number): StoryMission {
  return {
    chapterId,
    title: `Chapter ${chapterId}`,
    angularTopic: 'test',
    narrative: 'test',
    unlocksMinigame: null,
    deps: [],
    phase: 1,
  } as StoryMission;
}

@Component({
  template: `<app-bottom-nav />`,
  imports: [BottomNavComponent],
})
class TestHost {}

describe('BottomNavComponent', () => {
  async function setup(
    missionSignal?: WritableSignal<StoryMission | null>,
  ) {
    const currentMission =
      missionSignal ?? signal<StoryMission | null>(stubMission(1));
    return createComponent(TestHost, {
      providers: [
        provideRouter([]),
        getMockProvider(GameProgressionService, {
          currentMission: currentMission.asReadonly(),
        }),
      ],
    });
  }

  it('should create the component', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
  });

  it('should render four navigation links', async () => {
    const { element } = await setup();
    const links = element.querySelectorAll('nav a');
    expect(links.length).toBe(4);
  });

  it('should render correct link labels', async () => {
    const { element } = await setup();
    const labels = element.querySelectorAll('.bottom-nav__label');
    const texts = Array.from(labels).map((el) => el.textContent?.trim());
    expect(texts).toEqual(['Dashboard', 'Mission', 'Games', 'Profile']);
  });

  it('should have correct routerLink targets', async () => {
    const { element } = await setup();
    const links = element.querySelectorAll('nav a');
    const hrefs = Array.from(links).map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/', '/mission/1', '/minigames', '/profile']);
  });

  it('should use a nav element for accessibility', async () => {
    const { element } = await setup();
    const nav = element.querySelector('nav');
    expect(nav).toBeTruthy();
  });

  it('should have nav element with aria-label', async () => {
    const { element } = await setup();
    const nav = element.querySelector('nav');
    expect(nav?.getAttribute('aria-label')).toBe('Mobile navigation');
  });

  it('should apply exact match for Dashboard link', async () => {
    const { fixture } = await setup();
    const rlaDirectives = fixture.debugElement.queryAll(
      By.directive(RouterLinkActive),
    );
    // Dashboard is the first link
    const dashboardRla = rlaDirectives[0].injector.get(RouterLinkActive);
    expect(dashboardRla.routerLinkActiveOptions).toEqual({ exact: true });
  });

  it('should render an icon element for each tab', async () => {
    const { element } = await setup();
    const icons = element.querySelectorAll('.bottom-nav__icon');
    expect(icons.length).toBe(4);
  });

  // --- Dynamic link resolution ---

  it('should render mission link pointing to /mission/1 when currentMission is chapter 1', async () => {
    const missionSignal = signal<StoryMission | null>(stubMission(1));
    const { element } = await setup(missionSignal);
    const links = element.querySelectorAll('nav a');
    expect(links[1].getAttribute('href')).toBe('/mission/1');
  });

  it('should render mission link pointing to /mission/5 when currentMission is chapter 5', async () => {
    const missionSignal = signal<StoryMission | null>(stubMission(5));
    const { element } = await setup(missionSignal);
    const links = element.querySelectorAll('nav a');
    expect(links[1].getAttribute('href')).toBe('/mission/5');
  });

  it('should display "Mission" as link text when a mission is available', async () => {
    const missionSignal = signal<StoryMission | null>(stubMission(1));
    const { element } = await setup(missionSignal);
    const labels = element.querySelectorAll('.bottom-nav__label');
    expect(labels[1].textContent?.trim()).toBe('Mission');
  });

  // --- Completed state ---

  it('should render link pointing to /campaign when all missions complete', async () => {
    const missionSignal = signal<StoryMission | null>(null);
    const { element } = await setup(missionSignal);
    const links = element.querySelectorAll('nav a');
    expect(links[1].getAttribute('href')).toBe('/campaign');
  });

  it('should display "Complete" as link text when all missions complete', async () => {
    const missionSignal = signal<StoryMission | null>(null);
    const { element } = await setup(missionSignal);
    const labels = element.querySelectorAll('.bottom-nav__label');
    expect(labels[1].textContent?.trim()).toBe('Complete');
  });

  // --- Reactivity ---

  it('should update link when currentMission signal changes', async () => {
    const missionSignal = signal<StoryMission | null>(stubMission(1));
    const { fixture, element } = await setup(missionSignal);
    const links = element.querySelectorAll('nav a');
    expect(links[1].getAttribute('href')).toBe('/mission/1');

    missionSignal.set(stubMission(3));
    fixture.detectChanges();

    expect(links[1].getAttribute('href')).toBe('/mission/3');
  });

  it('should update to campaign link when missions become fully completed', async () => {
    const missionSignal = signal<StoryMission | null>(stubMission(1));
    const { fixture, element } = await setup(missionSignal);
    const links = element.querySelectorAll('nav a');
    expect(links[1].getAttribute('href')).toBe('/mission/1');
    expect(element.querySelectorAll('.bottom-nav__label')[1].textContent?.trim()).toBe('Mission');

    missionSignal.set(null);
    fixture.detectChanges();

    expect(links[1].getAttribute('href')).toBe('/campaign');
    expect(element.querySelectorAll('.bottom-nav__label')[1].textContent?.trim()).toBe('Complete');
  });
});
