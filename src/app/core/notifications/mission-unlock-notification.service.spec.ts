import { TestBed } from '@angular/core/testing';
import { MissionUnlockNotificationService } from './mission-unlock-notification.service';

describe('MissionUnlockNotificationService', () => {
  let service: MissionUnlockNotificationService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    service = TestBed.inject(MissionUnlockNotificationService);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('showUnlock() adds a notification with correct gameName and gameId', () => {
    service.showUnlock('Module Assembly', 'module-assembly');

    const notifications = service.notifications();
    expect(notifications.length).toBe(1);
    expect(notifications[0].gameName).toBe('Module Assembly');
    expect(notifications[0].gameId).toBe('module-assembly');
  });

  it('multiple showUnlock() calls stack notifications', () => {
    service.showUnlock('Module Assembly', 'module-assembly');
    service.showUnlock('Wire Protocol', 'wire-protocol');

    expect(service.notifications().length).toBe(2);
  });

  it('each notification gets a unique ID', () => {
    service.showUnlock('Module Assembly', 'module-assembly');
    service.showUnlock('Wire Protocol', 'wire-protocol');

    const ids = service.notifications().map((n) => n.id);
    expect(ids[0]).not.toBe(ids[1]);
  });

  it('auto-dismisses after 5 seconds', () => {
    service.showUnlock('Module Assembly', 'module-assembly');

    expect(service.notifications().length).toBe(1);

    vi.advanceTimersByTime(5000);

    expect(service.notifications().length).toBe(0);
  });

  it('dismiss(id) removes specific notification and cancels timer', () => {
    service.showUnlock('Module Assembly', 'module-assembly');
    service.showUnlock('Wire Protocol', 'wire-protocol');

    const firstId = service.notifications()[0].id;

    service.dismiss(firstId);

    const remaining = service.notifications();
    expect(remaining.length).toBe(1);
    expect(remaining[0].gameName).toBe('Wire Protocol');

    // Advance past auto-dismiss duration to verify second also auto-dismisses
    vi.advanceTimersByTime(5001);

    expect(service.notifications().length).toBe(0);
  });

  it('notification contains correct gameName', () => {
    service.showUnlock('Wire Protocol', 'wire-protocol');

    expect(service.notifications()[0].gameName).toBe('Wire Protocol');
  });

  it('notification contains correct gameId', () => {
    service.showUnlock('Wire Protocol', 'wire-protocol');

    expect(service.notifications()[0].gameId).toBe('wire-protocol');
  });
});
