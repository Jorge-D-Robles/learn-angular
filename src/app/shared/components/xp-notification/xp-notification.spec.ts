import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { createComponent } from '../../../../testing/test-utils';
import { XpNotificationComponent } from './xp-notification';
import { XpNotificationService } from '../../../core/notifications/xp-notification.service';

@Component({
  template: `<nx-xp-notification />`,
  imports: [XpNotificationComponent],
})
class TestHost {}

describe('XpNotificationComponent', () => {
  let service: XpNotificationService;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function setup() {
    const result = await createComponent(TestHost);
    service = TestBed.inject(XpNotificationService);
    return result;
  }

  it('renders nothing when no notifications', async () => {
    const { element } = await setup();
    const toasts = element.querySelectorAll('.xp-toast');
    expect(toasts.length).toBe(0);
  });

  it('renders a toast when notification is shown', async () => {
    const { fixture, element } = await setup();
    service.show(25);
    fixture.detectChanges();
    await fixture.whenStable();

    const amount = element.querySelector('.xp-toast__amount');
    expect(amount?.textContent).toContain('+25 XP');
  });

  it('renders bonus labels', async () => {
    const { fixture, element } = await setup();
    service.show(50, ['Perfect!']);
    fixture.detectChanges();
    await fixture.whenStable();

    const bonus = element.querySelector('.xp-toast__bonus');
    expect(bonus?.textContent).toContain('Perfect!');
  });

  it('renders multiple stacked toasts', async () => {
    const { fixture, element } = await setup();
    service.show(10);
    service.show(20);
    fixture.detectChanges();
    await fixture.whenStable();

    const toasts = element.querySelectorAll('.xp-toast');
    expect(toasts.length).toBe(2);
  });

  it('auto-dismiss removes toast from DOM', async () => {
    const { fixture, element } = await setup();
    service.show(10, [], 1000);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(element.querySelectorAll('.xp-toast').length).toBe(1);

    vi.advanceTimersByTime(1000);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(element.querySelectorAll('.xp-toast').length).toBe(0);
  });
});
