import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { createComponent } from '../../../../testing/test-utils';
import { AchievementNotificationComponent } from './achievement-notification';
import { AchievementNotificationService } from '../../../core/notifications/achievement-notification.service';
import type { Achievement } from '../../../core/progression/achievement.service';

@Component({
  template: `<nx-achievement-notification />`,
  imports: [AchievementNotificationComponent],
})
class TestHost {}

const MOCK_DISCOVERY: Achievement = {
  id: 'first-steps',
  title: 'First Steps',
  description: 'Complete your first story mission',
  type: 'discovery',
  isHidden: false,
  isEarned: true,
  earnedDate: '2026-03-25T00:00:00.000Z',
};

const MOCK_MASTERY: Achievement = {
  id: 'perfectionist',
  title: 'Perfectionist',
  description: 'Get a perfect score on any level',
  type: 'mastery',
  isHidden: false,
  isEarned: true,
  earnedDate: '2026-03-25T00:00:00.000Z',
};

const MOCK_COMMITMENT: Achievement = {
  id: 'dedicated',
  title: 'Dedicated',
  description: 'Achieve a 7-day streak',
  type: 'commitment',
  isHidden: false,
  isEarned: true,
  earnedDate: '2026-03-25T00:00:00.000Z',
};

describe('AchievementNotificationComponent', () => {
  let service: AchievementNotificationService;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function setup() {
    const result = await createComponent(TestHost);
    service = TestBed.inject(AchievementNotificationService);
    return result;
  }

  it('renders nothing when no notifications', async () => {
    const { element } = await setup();
    const toasts = element.querySelectorAll('.achievement-toast');
    expect(toasts.length).toBe(0);
  });

  it('renders a toast when notification is shown', async () => {
    const { fixture, element } = await setup();
    service.show(MOCK_DISCOVERY);
    fixture.detectChanges();
    await fixture.whenStable();

    const title = element.querySelector('.achievement-toast__title');
    expect(title?.textContent).toContain('First Steps');
  });

  it('renders type label for discovery achievement', async () => {
    const { fixture, element } = await setup();
    service.show(MOCK_DISCOVERY);
    fixture.detectChanges();
    await fixture.whenStable();

    const type = element.querySelector('.achievement-toast__type');
    expect(type?.textContent).toContain('Discovery');
  });

  it('renders type label for mastery achievement', async () => {
    const { fixture, element } = await setup();
    service.show(MOCK_MASTERY);
    fixture.detectChanges();
    await fixture.whenStable();

    const type = element.querySelector('.achievement-toast__type');
    expect(type?.textContent).toContain('Mastery');
  });

  it('renders type label for commitment achievement', async () => {
    const { fixture, element } = await setup();
    service.show(MOCK_COMMITMENT);
    fixture.detectChanges();
    await fixture.whenStable();

    const type = element.querySelector('.achievement-toast__type');
    expect(type?.textContent).toContain('Commitment');
  });

  it('applies discovery accent class', async () => {
    const { fixture, element } = await setup();
    service.show(MOCK_DISCOVERY);
    fixture.detectChanges();
    await fixture.whenStable();

    const toast = element.querySelector('.achievement-toast');
    expect(toast?.classList.contains('achievement-toast--discovery')).toBe(true);
  });

  it('applies mastery accent class', async () => {
    const { fixture, element } = await setup();
    service.show(MOCK_MASTERY);
    fixture.detectChanges();
    await fixture.whenStable();

    const toast = element.querySelector('.achievement-toast');
    expect(toast?.classList.contains('achievement-toast--mastery')).toBe(true);
  });

  it('applies commitment accent class', async () => {
    const { fixture, element } = await setup();
    service.show(MOCK_COMMITMENT);
    fixture.detectChanges();
    await fixture.whenStable();

    const toast = element.querySelector('.achievement-toast');
    expect(toast?.classList.contains('achievement-toast--commitment')).toBe(true);
  });

  it('renders multiple stacked toasts', async () => {
    const { fixture, element } = await setup();
    service.show(MOCK_DISCOVERY);
    service.show(MOCK_MASTERY);
    fixture.detectChanges();
    await fixture.whenStable();

    const toasts = element.querySelectorAll('.achievement-toast');
    expect(toasts.length).toBe(2);
  });

  it('auto-dismiss removes toast from DOM after timeout', async () => {
    const { fixture, element } = await setup();
    service.show(MOCK_DISCOVERY);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(element.querySelectorAll('.achievement-toast').length).toBe(1);

    vi.advanceTimersByTime(5000);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(element.querySelectorAll('.achievement-toast').length).toBe(0);
  });

  it('dismiss button removes toast immediately', async () => {
    const { fixture, element } = await setup();
    service.show(MOCK_DISCOVERY);
    fixture.detectChanges();
    await fixture.whenStable();

    const dismissBtn = element.querySelector('.achievement-toast__dismiss') as HTMLButtonElement;
    dismissBtn.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(element.querySelectorAll('.achievement-toast').length).toBe(0);
  });

  it('has role=status for accessibility', async () => {
    const { fixture, element } = await setup();
    service.show(MOCK_DISCOVERY);
    fixture.detectChanges();
    await fixture.whenStable();

    const toast = element.querySelector('.achievement-toast');
    expect(toast?.getAttribute('role')).toBe('status');
  });
});
