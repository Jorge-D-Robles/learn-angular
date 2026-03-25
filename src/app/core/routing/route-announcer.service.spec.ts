import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, Routes } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Component, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { RouteAnnouncerService } from './route-announcer.service';
import { SettingsService } from '../settings/settings.service';

@Component({ template: '' })
class TestComponent {}

const testRoutes: Routes = [
  { path: 'dashboard', component: TestComponent, title: 'Dashboard' },
  { path: 'settings', component: TestComponent, title: 'Settings' },
  { path: 'no-title', component: TestComponent },
  { path: '', component: TestComponent },
];

describe('RouteAnnouncerService', () => {
  let service: RouteAnnouncerService;
  let router: Router;
  let titleService: Title;
  let doc: Document;

  const mockSettings = { settings: signal({ reducedMotion: false }) };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(testRoutes),
        RouteAnnouncerService,
        { provide: SettingsService, useValue: mockSettings },
      ],
    });

    doc = TestBed.inject(DOCUMENT);
    router = TestBed.inject(Router);
    titleService = TestBed.inject(Title);

    // Create a #main-content element in the test DOM
    const mainContent = doc.createElement('main');
    mainContent.id = 'main-content';
    mainContent.tabIndex = -1;
    doc.body.appendChild(mainContent);

    service = TestBed.inject(RouteAnnouncerService);
  });

  afterEach(() => {
    // Clean up #main-content
    const mainContent = doc.getElementById('main-content');
    if (mainContent) {
      mainContent.remove();
    }
    // Clean up any live region left behind
    const liveRegion = doc.querySelector('[aria-live="polite"][aria-atomic="true"]');
    if (liveRegion) {
      liveRegion.remove();
    }
    // Reset reduced motion for next test
    mockSettings.settings.set({ reducedMotion: false });
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should focus #main-content on NavigationEnd', async () => {
    const mainContent = doc.getElementById('main-content')!;
    const focusSpy = vi.spyOn(mainContent, 'focus');

    titleService.setTitle('Dashboard | Nexus Station');
    await router.navigateByUrl('/dashboard');

    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
  });

  it('should not throw if #main-content element is missing', async () => {
    // Remove #main-content
    const mainContent = doc.getElementById('main-content');
    mainContent?.remove();

    titleService.setTitle('Dashboard | Nexus Station');
    await expect(router.navigateByUrl('/dashboard')).resolves.toBeTruthy();
  });

  it('should create an ARIA live region element in the document body', () => {
    const liveRegion = doc.querySelector('[aria-live="polite"][aria-atomic="true"]');
    expect(liveRegion).toBeTruthy();
  });

  it('should announce page title in ARIA live region on NavigationEnd', async () => {
    titleService.setTitle('Dashboard | Nexus Station');
    await router.navigateByUrl('/dashboard');

    const liveRegion = doc.querySelector('[aria-live="polite"][aria-atomic="true"]');
    expect(liveRegion!.textContent).toBe('Dashboard | Nexus Station');
  });

  it('should clear ARIA live region text before setting new title', async () => {
    const liveRegion = doc.querySelector('[aria-live="polite"][aria-atomic="true"]') as HTMLElement;

    // Navigate to first route
    titleService.setTitle('Dashboard | Nexus Station');
    await router.navigateByUrl('/dashboard');
    expect(liveRegion.textContent).toBe('Dashboard | Nexus Station');

    // Track textContent changes
    const textContentValues: string[] = [];
    const originalDescriptor = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent')!;
    Object.defineProperty(liveRegion, 'textContent', {
      set(value: string) {
        textContentValues.push(value);
        originalDescriptor.set!.call(this, value);
      },
      get() {
        return originalDescriptor.get!.call(this);
      },
      configurable: true,
    });

    // Navigate to second route
    titleService.setTitle('Settings | Nexus Station');
    await router.navigateByUrl('/settings');

    // Should have cleared then set
    expect(textContentValues).toContain('');
    expect(textContentValues).toContain('Settings | Nexus Station');
    const clearIndex = textContentValues.indexOf('');
    const setIndex = textContentValues.indexOf('Settings | Nexus Station');
    expect(clearIndex).toBeLessThan(setIndex);
  });

  it('should scroll to top on navigation with smooth behavior', async () => {
    const win = (doc as Document).defaultView!;
    const scrollSpy = vi.spyOn(win, 'scrollTo').mockReturnValue(undefined);

    titleService.setTitle('Dashboard | Nexus Station');
    await router.navigateByUrl('/dashboard');

    expect(scrollSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('should scroll to top with instant behavior when reduced motion is active', async () => {
    mockSettings.settings.set({ reducedMotion: true });

    const win = (doc as Document).defaultView!;
    const scrollSpy = vi.spyOn(win, 'scrollTo').mockReturnValue(undefined);

    titleService.setTitle('Settings | Nexus Station');
    await router.navigateByUrl('/settings');

    expect(scrollSpy).toHaveBeenCalledWith({ top: 0, behavior: 'instant' });
  });

  it('should clean up ARIA live region on destroy', () => {
    const liveRegion = doc.querySelector('[aria-live="polite"][aria-atomic="true"]');
    expect(liveRegion).toBeTruthy();

    TestBed.resetTestingModule();

    const liveRegionAfter = doc.querySelector('[aria-live="polite"][aria-atomic="true"]');
    expect(liveRegionAfter).toBeFalsy();
  });

  it('should unsubscribe from router events on destroy', async () => {
    const mainContent = doc.getElementById('main-content')!;
    const focusSpy = vi.spyOn(mainContent, 'focus');

    titleService.setTitle('Dashboard | Nexus Station');
    await router.navigateByUrl('/dashboard');
    expect(focusSpy).toHaveBeenCalledTimes(1);

    // Destroy the service's injector
    TestBed.resetTestingModule();

    // Re-create a minimal TestBed to get a new router
    TestBed.configureTestingModule({
      providers: [provideRouter(testRoutes)],
    });
    const newRouter = TestBed.inject(Router);
    await newRouter.navigateByUrl('/settings');

    // Focus should not have been called again by the destroyed service
    expect(focusSpy).toHaveBeenCalledTimes(1);
  });
});
