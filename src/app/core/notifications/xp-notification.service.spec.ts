import { TestBed } from '@angular/core/testing';
import { XpNotificationService } from './xp-notification.service';

describe('XpNotificationService', () => {
  let service: XpNotificationService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
    service = TestBed.inject(XpNotificationService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('show() adds a notification', () => {
    service.show(25);

    const notifications = service.notifications();
    expect(notifications.length).toBe(1);
    expect(notifications[0].amount).toBe(25);
    expect(notifications[0].bonuses).toEqual([]);
  });

  it('show() with bonuses stores bonus labels', () => {
    service.show(50, ['Perfect!', 'Streak x3']);

    const notifications = service.notifications();
    expect(notifications.length).toBe(1);
    expect(notifications[0].amount).toBe(50);
    expect(notifications[0].bonuses).toEqual(['Perfect!', 'Streak x3']);
  });

  it('multiple show() calls stack notifications', () => {
    service.show(10);
    service.show(20);
    service.show(30);

    expect(service.notifications().length).toBe(3);
  });

  it('auto-dismisses after duration', () => {
    service.show(10, [], 3000);

    expect(service.notifications().length).toBe(1);

    vi.advanceTimersByTime(3000);

    expect(service.notifications().length).toBe(0);
  });

  it('dismiss() removes specific notification and cancels its timer', () => {
    service.show(10);
    service.show(20);

    const firstId = service.notifications()[0].id;

    service.dismiss(firstId);

    const remaining = service.notifications();
    expect(remaining.length).toBe(1);
    expect(remaining[0].amount).toBe(20);

    // Advance past default duration to verify second auto-dismisses
    vi.advanceTimersByTime(3000);

    expect(service.notifications().length).toBe(0);
  });

  it('each notification gets a unique ID', () => {
    service.show(10);
    service.show(20);

    const ids = service.notifications().map((n) => n.id);
    expect(ids[0]).not.toBe(ids[1]);
  });
});
