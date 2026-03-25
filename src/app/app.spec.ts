import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import {
  LUCIDE_ICONS,
  LucideIconConfig,
  LucideIconProvider,
} from 'lucide-angular';
import { App } from './app';
import { GameStateService, MissionUnlockNotificationService, RankUpNotificationService, StreakService, XpService } from './core';
import { APP_ICONS } from './shared';

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

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), ...ICON_PROVIDERS],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the top bar', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const topBar = fixture.nativeElement.querySelector('.top-bar');
    expect(topBar).toBeTruthy();
  });

  it('should render the logo with link to home', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const logo = fixture.nativeElement.querySelector('.top-bar__logo');
    expect(logo).toBeTruthy();
    expect(logo.textContent).toContain('Nexus Station');
    expect(logo.getAttribute('href')).toBe('/');
  });

  it('should render the rank badge placeholder', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const rank = fixture.nativeElement.querySelector('.top-bar__rank');
    expect(rank).toBeTruthy();
    expect(rank.textContent).toContain('Cadet');
  });

  it('should render the XP progress bar component', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const xpBar = fixture.nativeElement.querySelector('nx-xp-progress-bar');
    expect(xpBar).toBeTruthy();
  });

  it('should render the XP progress bar with progressbar role', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const xpBar = fixture.nativeElement.querySelector('nx-xp-progress-bar');
    expect(xpBar.getAttribute('role')).toBe('progressbar');
  });

  it('should render the XP progress bar with aria-valuenow 0 at default XP', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const xpBar = fixture.nativeElement.querySelector('nx-xp-progress-bar');
    expect(xpBar.getAttribute('aria-valuenow')).toBe('0');
  });

  it('should update rank reactively when XP changes', () => {
    const gameState = TestBed.inject(GameStateService);
    gameState.resetState();

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const xpService = TestBed.inject(XpService);
    xpService.addXp(600);
    fixture.detectChanges();

    const rank = fixture.nativeElement.querySelector('.top-bar__rank');
    expect(rank.textContent).toContain('Ensign');
  });

  it('should render the settings link with aria-label', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const settings = fixture.nativeElement.querySelector('.top-bar__settings');
    expect(settings).toBeTruthy();
    expect(settings.getAttribute('aria-label')).toBe('Settings');
  });

  it('should render the settings link navigating to /settings', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const settings = fixture.nativeElement.querySelector('.top-bar__settings');
    expect(settings.getAttribute('href')).toBe('/settings');
  });

  it('should render the main content area with router outlet', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const content = fixture.nativeElement.querySelector('.content');
    expect(content).toBeTruthy();
    const routerOutlet = content.querySelector('router-outlet');
    expect(routerOutlet).toBeTruthy();
  });

  it('should use header element for the top bar', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const header = fixture.nativeElement.querySelector('header');
    expect(header).toBeTruthy();
    expect(header.classList.contains('top-bar')).toBe(true);
  });

  it('should use main element for the content area', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const main = fixture.nativeElement.querySelector('main');
    expect(main).toBeTruthy();
    expect(main.classList.contains('content')).toBe(true);
  });

  it('should render the app-body wrapper', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const appBody = fixture.nativeElement.querySelector('div.app-body');
    expect(appBody).toBeTruthy();
    const sideNav = appBody.querySelector('app-side-nav');
    expect(sideNav).toBeTruthy();
    const content = appBody.querySelector('main.content');
    expect(content).toBeTruthy();
  });

  it('should render the side nav component', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const sideNav = fixture.nativeElement.querySelector(
      '.app-body app-side-nav',
    );
    expect(sideNav).toBeTruthy();
  });

  it('should render the bottom nav component', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const bottomNav = fixture.nativeElement.querySelector(
      '.app-body app-bottom-nav',
    );
    expect(bottomNav).toBeTruthy();
  });

  it('should render the xp notification component', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const xpNotification =
      fixture.nativeElement.querySelector('nx-xp-notification');
    expect(xpNotification).toBeTruthy();
  });

  // ---------------------------------------------------------------------------
  // Mission unlock notification
  // ---------------------------------------------------------------------------
  it('should render the mission unlock notification component', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector(
      'nx-mission-unlock-notification',
    );
    expect(el).toBeTruthy();
  });

  it('should show unlock toast when MissionUnlockNotificationService fires', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const unlockService = TestBed.inject(MissionUnlockNotificationService);
    unlockService.showUnlock('Module Assembly', 'module-assembly');
    fixture.detectChanges();

    const toast = fixture.nativeElement.querySelector('.unlock-toast');
    expect(toast).toBeTruthy();
  });

  it('should remove unlock toast after service dismiss', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const unlockService = TestBed.inject(MissionUnlockNotificationService);
    unlockService.showUnlock('Module Assembly', 'module-assembly');
    fixture.detectChanges();

    const id = unlockService.notifications()[0].id;
    unlockService.dismiss(id);
    fixture.detectChanges();

    const toast = fixture.nativeElement.querySelector('.unlock-toast');
    expect(toast).toBeFalsy();
  });

  it('should NOT render rank-up overlay when no rank up', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const overlay = fixture.nativeElement.querySelector('nx-rank-up-overlay');
    expect(overlay).toBeFalsy();
  });

  it('should render the rank-up overlay component when rank up occurs', () => {
    const gameState = TestBed.inject(GameStateService);
    gameState.resetState();

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    gameState.addXp(500);
    TestBed.flushEffects();
    fixture.detectChanges();

    const overlay = fixture.nativeElement.querySelector('nx-rank-up-overlay');
    expect(overlay).toBeTruthy();
  });

  it('should pass new rank to overlay', () => {
    const gameState = TestBed.inject(GameStateService);
    gameState.resetState();

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    gameState.addXp(500);
    TestBed.flushEffects();
    fixture.detectChanges();

    const title = fixture.nativeElement.querySelector(
      '.rank-up-overlay__title',
    );
    expect(title.textContent).toContain('Ensign');
  });

  it('should hide overlay when dismiss button is clicked', () => {
    const gameState = TestBed.inject(GameStateService);
    gameState.resetState();

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    gameState.addXp(500);
    TestBed.flushEffects();
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector(
      '.rank-up-overlay__dismiss',
    ) as HTMLButtonElement;
    button.click();
    fixture.detectChanges();

    const overlay = fixture.nativeElement.querySelector('nx-rank-up-overlay');
    expect(overlay).toBeFalsy();
  });

  // ---------------------------------------------------------------------------
  // Skip-to-content link (a11y)
  // ---------------------------------------------------------------------------
  it('should render the skip-to-content link', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const skipLink = fixture.nativeElement.querySelector('.skip-link');
    expect(skipLink).toBeTruthy();
    expect(skipLink.textContent.trim()).toBe('Skip to main content');
  });

  it('should target #main-content anchor', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const skipLink = fixture.nativeElement.querySelector('.skip-link');
    expect(skipLink.getAttribute('href')).toContain('#main-content');
  });

  it('should have main-content id on the main element', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const main = fixture.nativeElement.querySelector('main.content');
    expect(main.getAttribute('id')).toBe('main-content');
    expect(main.getAttribute('tabindex')).toBe('-1');
  });

  it('should render skip link before the top bar in DOM order', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const skipLink = fixture.nativeElement.querySelector('.skip-link');
    const header = fixture.nativeElement.querySelector('header');
    // DOCUMENT_POSITION_FOLLOWING means header comes after skipLink
    const position = skipLink.compareDocumentPosition(header);
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('should hide overlay when RankUpNotificationService.dismiss() is called', () => {
    const gameState = TestBed.inject(GameStateService);
    gameState.resetState();

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    gameState.addXp(500);
    TestBed.flushEffects();
    fixture.detectChanges();

    const rankUpService = TestBed.inject(RankUpNotificationService);
    rankUpService.dismiss();
    fixture.detectChanges();

    const overlay = fixture.nativeElement.querySelector('nx-rank-up-overlay');
    expect(overlay).toBeFalsy();
  });

  it('should show correct XP progress percentage mid-rank', () => {
    const gameState = TestBed.inject(GameStateService);
    gameState.resetState();

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const xpService = TestBed.inject(XpService);
    xpService.addXp(250);
    fixture.detectChanges();

    const xpBar = fixture.nativeElement.querySelector('nx-xp-progress-bar');
    expect(xpBar.getAttribute('aria-valuenow')).toBe('50');
  });

  it('should update XP progress bar dynamically on rank change', () => {
    const gameState = TestBed.inject(GameStateService);
    gameState.resetState();

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const xpService = TestBed.inject(XpService);
    xpService.addXp(600);
    fixture.detectChanges();

    const xpBar = fixture.nativeElement.querySelector('nx-xp-progress-bar');
    expect(xpBar.getAttribute('aria-valuenow')).toBe('10');
  });

  it('should show 100% progress at max rank', () => {
    const gameState = TestBed.inject(GameStateService);
    gameState.resetState();

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const xpService = TestBed.inject(XpService);
    xpService.addXp(30000);
    fixture.detectChanges();

    const xpBar = fixture.nativeElement.querySelector('nx-xp-progress-bar');
    expect(xpBar.getAttribute('aria-valuenow')).toBe('100');
  });

  // ---------------------------------------------------------------------------
  // ARIA landmark roles
  // ---------------------------------------------------------------------------
  describe('ARIA landmark roles', () => {
    it('should have aria-label on the banner landmark', () => {
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const header = fixture.nativeElement.querySelector('header');
      expect(header.getAttribute('aria-label')).toBe('Site header');
    });

    it('should have a navigation landmark with aria-label Main navigation', () => {
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const nav = fixture.nativeElement.querySelector('nav[aria-label="Main navigation"]');
      expect(nav).toBeTruthy();
    });

    it('should have a navigation landmark with aria-label Mobile navigation', () => {
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const nav = fixture.nativeElement.querySelector('nav[aria-label="Mobile navigation"]');
      expect(nav).toBeTruthy();
    });

    it('should not have duplicate navigation landmark labels', () => {
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const navs = fixture.nativeElement.querySelectorAll('nav');
      const labels = Array.from<Element>(navs).map(nav => nav.getAttribute('aria-label'));
      expect(new Set(labels).size).toBe(labels.length);
    });
  });

  // ---------------------------------------------------------------------------
  // Streak badge integration
  // ---------------------------------------------------------------------------
  describe('streak badge', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should NOT render streak badge when no streak is active', () => {
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const badge = fixture.nativeElement.querySelector('nx-streak-badge');
      expect(badge).toBeFalsy();
    });

    it('should render streak badge when streak is active', () => {
      const streakService = TestBed.inject(StreakService);
      streakService.recordDailyPlay();
      vi.advanceTimersByTime(500);

      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const badge = fixture.nativeElement.querySelector('nx-streak-badge');
      expect(badge).toBeTruthy();
    });

    it('should pass activeStreakDays to streak badge currentStreak input', async () => {
      const streakService = TestBed.inject(StreakService);
      streakService.recordDailyPlay();
      vi.advanceTimersByTime(500);

      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      await fixture.whenStable();

      const count = fixture.nativeElement.querySelector('.streak-badge__count');
      expect(count.textContent.trim()).toBe('1');
    });

    it('should pass streakMultiplier to streak badge multiplier input', async () => {
      const streakService = TestBed.inject(StreakService);
      streakService.recordDailyPlay();
      vi.advanceTimersByTime(500);

      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      await fixture.whenStable();

      const multiplier = fixture.nativeElement.querySelector('.streak-badge__multiplier');
      expect(multiplier.textContent.trim()).toBe('+10%');
    });
  });
});
