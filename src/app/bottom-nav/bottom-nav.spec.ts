import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { provideRouter, Router, RouterLinkActive } from '@angular/router';
import { createComponent } from '../../testing/test-utils';
import { BottomNavComponent } from './bottom-nav';

@Component({ template: '', standalone: true })
class DummyComponent {}

@Component({
  template: `<app-bottom-nav />`,
  imports: [BottomNavComponent],
})
class TestHost {}

describe('BottomNavComponent', () => {
  async function setup() {
    return createComponent(TestHost, {
      providers: [
        provideRouter([
          { path: '', component: DummyComponent },
          { path: 'campaign', component: DummyComponent },
          { path: 'mission/:chapterId', component: DummyComponent },
          { path: 'minigames', component: DummyComponent },
          { path: 'profile', component: DummyComponent },
        ]),
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
    expect(hrefs).toEqual(['/', '/campaign', '/minigames', '/profile']);
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

  // --- Static Mission link ---

  it('should have Mission tab link pointing to /campaign', async () => {
    const { element } = await setup();
    const links = element.querySelectorAll('nav a');
    expect(links[1].getAttribute('href')).toBe('/campaign');
  });

  it('should always display "Mission" as the label', async () => {
    const { element } = await setup();
    const labels = element.querySelectorAll('.bottom-nav__label');
    expect(labels[1].textContent?.trim()).toBe('Mission');
  });

  // --- Active state highlighting ---

  it('should apply active class to Mission tab when navigated to /campaign', async () => {
    const { fixture, element } = await setup();
    const router = fixture.debugElement.injector.get(Router);

    await router.navigateByUrl('/campaign');
    await fixture.whenStable();
    fixture.detectChanges();

    const missionTab = element.querySelectorAll('nav a')[1];
    expect(missionTab.classList.contains('active')).toBe(true);
  });

  it('should apply active class to Mission tab when navigated to /mission/3', async () => {
    const { fixture, element } = await setup();
    const router = fixture.debugElement.injector.get(Router);

    await router.navigateByUrl('/mission/3');
    await fixture.whenStable();
    fixture.detectChanges();

    const missionTab = element.querySelectorAll('nav a')[1];
    expect(missionTab.classList.contains('active')).toBe(true);
  });

  it('should not apply active class to Mission tab when navigated to /minigames', async () => {
    const { fixture, element } = await setup();
    const router = fixture.debugElement.injector.get(Router);

    await router.navigateByUrl('/minigames');
    await fixture.whenStable();
    fixture.detectChanges();

    const missionTab = element.querySelectorAll('nav a')[1];
    expect(missionTab.classList.contains('active')).toBe(false);
  });

  it('should create without GameProgressionService', async () => {
    const { fixture } = await setup();
    const bottomNav = fixture.debugElement.query(
      By.directive(BottomNavComponent),
    );
    expect(bottomNav.componentInstance).toBeInstanceOf(BottomNavComponent);
  });
});
