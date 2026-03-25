import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { createComponent } from '../../../../testing/test-utils';
import { MissionUnlockNotificationComponent } from './mission-unlock-notification';
import { MissionUnlockNotificationService } from '../../../core/notifications/mission-unlock-notification.service';

@Component({
  template: `<nx-mission-unlock-notification />`,
  imports: [MissionUnlockNotificationComponent],
})
class TestHost {}

describe('MissionUnlockNotificationComponent', () => {
  let service: MissionUnlockNotificationService;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function setup() {
    const result = await createComponent(TestHost, {
      providers: [provideRouter([])],
    });
    service = TestBed.inject(MissionUnlockNotificationService);
    return result;
  }

  it('renders nothing when no notifications', async () => {
    const { element } = await setup();
    const toasts = element.querySelectorAll('.unlock-toast');
    expect(toasts.length).toBe(0);
  });

  it('renders a toast when notification is shown', async () => {
    const { fixture, element } = await setup();
    service.showUnlock('Module Assembly', 'module-assembly');
    fixture.detectChanges();
    await fixture.whenStable();

    const toasts = element.querySelectorAll('.unlock-toast');
    expect(toasts.length).toBe(1);
  });

  it('renders game name in the toast', async () => {
    const { fixture, element } = await setup();
    service.showUnlock('Wire Protocol', 'wire-protocol');
    fixture.detectChanges();
    await fixture.whenStable();

    const gameName = element.querySelector('.unlock-toast__game-name');
    expect(gameName?.textContent).toContain('Wire Protocol');
  });

  it('renders multiple stacked toasts', async () => {
    const { fixture, element } = await setup();
    service.showUnlock('Module Assembly', 'module-assembly');
    service.showUnlock('Wire Protocol', 'wire-protocol');
    fixture.detectChanges();
    await fixture.whenStable();

    const toasts = element.querySelectorAll('.unlock-toast');
    expect(toasts.length).toBe(2);
  });

  it('auto-dismiss removes toast from DOM', async () => {
    const { fixture, element } = await setup();
    service.showUnlock('Module Assembly', 'module-assembly');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(element.querySelectorAll('.unlock-toast').length).toBe(1);

    vi.advanceTimersByTime(5000);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(element.querySelectorAll('.unlock-toast').length).toBe(0);
  });

  it('dismiss button removes specific toast', async () => {
    const { fixture, element } = await setup();
    service.showUnlock('Module Assembly', 'module-assembly');
    fixture.detectChanges();
    await fixture.whenStable();

    const dismissBtn = element.querySelector(
      '.unlock-toast__dismiss',
    ) as HTMLButtonElement;
    expect(dismissBtn).toBeTruthy();
    dismissBtn.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(element.querySelectorAll('.unlock-toast').length).toBe(0);
  });

  it('Play Now link points to correct minigame route', async () => {
    const { fixture, element } = await setup();
    service.showUnlock('Module Assembly', 'module-assembly');
    fixture.detectChanges();
    await fixture.whenStable();

    const playNow = element.querySelector(
      '.unlock-toast__play-now',
    ) as HTMLAnchorElement;
    expect(playNow).toBeTruthy();
    expect(playNow.getAttribute('href')).toContain(
      '/minigames/module-assembly',
    );
  });
});
