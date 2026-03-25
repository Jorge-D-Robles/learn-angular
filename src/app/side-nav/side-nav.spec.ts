import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { provideRouter, Router, RouterLinkActive } from '@angular/router';
import { createComponent } from '../../testing/test-utils';
import { SideNavComponent } from './side-nav';

@Component({ template: '', standalone: true })
class DummyComponent {}

@Component({
  template: `<app-side-nav />`,
  imports: [SideNavComponent],
})
class TestHost {}

describe('SideNavComponent', () => {
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
    const links = element.querySelectorAll('nav a');
    const labels = Array.from(links).map((a) => a.textContent?.trim());
    expect(labels).toEqual([
      'Dashboard',
      'Current Mission',
      'Minigames',
      'Profile',
    ]);
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
    expect(nav?.getAttribute('aria-label')).toBe('Main navigation');
  });

  it('should apply exact match for Dashboard link', async () => {
    const { fixture } = await setup();
    const rlaDirectives = fixture.debugElement.queryAll(
      By.directive(RouterLinkActive),
    );
    const dashboardRla = rlaDirectives[0].injector.get(RouterLinkActive);
    expect(dashboardRla.routerLinkActiveOptions).toEqual({ exact: true });
  });

  it('should apply active class to Current Mission link when on /campaign', async () => {
    const { fixture, element } = await setup();
    const router = fixture.debugElement.injector.get(Router);
    await router.navigateByUrl('/campaign');
    await fixture.whenStable();
    fixture.detectChanges();
    const missionLink = element.querySelectorAll('nav a')[1];
    expect(missionLink.classList.contains('active')).toBe(true);
  });

  it('should apply active class to Current Mission link when on /mission/3', async () => {
    const { fixture, element } = await setup();
    const router = fixture.debugElement.injector.get(Router);
    await router.navigateByUrl('/mission/3');
    await fixture.whenStable();
    fixture.detectChanges();
    const missionLink = element.querySelectorAll('nav a')[1];
    expect(missionLink.classList.contains('active')).toBe(true);
  });

  it('should not apply active class to Current Mission link when on /minigames', async () => {
    const { fixture, element } = await setup();
    const router = fixture.debugElement.injector.get(Router);
    await router.navigateByUrl('/minigames');
    await fixture.whenStable();
    fixture.detectChanges();
    const missionLink = element.querySelectorAll('nav a')[1];
    expect(missionLink.classList.contains('active')).toBe(false);
  });
});
