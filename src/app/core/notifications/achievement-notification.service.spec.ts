import { TestBed } from '@angular/core/testing';
import { AchievementNotificationService } from './achievement-notification.service';
import type { Achievement } from '../progression/achievement.service';

const MOCK_ACHIEVEMENT: Achievement = {
  id: 'first-steps',
  title: 'First Steps',
  description: 'Complete your first story mission',
  type: 'discovery',
  isHidden: false,
  isEarned: true,
  earnedDate: '2026-03-25T00:00:00.000Z',
};

const MOCK_ACHIEVEMENT_2: Achievement = {
  id: 'explorer',
  title: 'Explorer',
  description: 'Unlock 4 minigames',
  type: 'discovery',
  isHidden: false,
  isEarned: true,
  earnedDate: '2026-03-25T00:00:00.000Z',
};

describe('AchievementNotificationService', () => {
  let service: AchievementNotificationService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    service = TestBed.inject(AchievementNotificationService);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add notification to queue on show()', () => {
    service.show(MOCK_ACHIEVEMENT);

    const notifications = service.notifications();
    expect(notifications.length).toBe(1);
    expect(notifications[0].achievement).toBe(MOCK_ACHIEVEMENT);
  });

  it('should auto-dismiss after timeout', () => {
    service.show(MOCK_ACHIEVEMENT);

    expect(service.notifications().length).toBe(1);

    vi.advanceTimersByTime(5000);

    expect(service.notifications().length).toBe(0);
  });

  it('should dismiss immediately on dismiss(id)', () => {
    service.show(MOCK_ACHIEVEMENT);
    const id = service.notifications()[0].id;

    service.dismiss(id);

    expect(service.notifications().length).toBe(0);
  });

  it('should support multiple concurrent notifications', () => {
    service.show(MOCK_ACHIEVEMENT);
    service.show(MOCK_ACHIEVEMENT_2);

    const notifications = service.notifications();
    expect(notifications.length).toBe(2);
    expect(notifications[0].achievement.id).toBe('first-steps');
    expect(notifications[1].achievement.id).toBe('explorer');
  });
});
