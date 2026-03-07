import { TestBed } from '@angular/core/testing';
import { MasteryService } from './mastery.service';
import { SpacedRepetitionService } from './spaced-repetition.service';

// --- Test helpers ---

const MS_PER_DAY = 86_400_000;

function createFakeStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  } as Storage;
}

describe('SpacedRepetitionService', () => {
  let service: SpacedRepetitionService;
  let masteryService: MasteryService;
  let fakeStorage: Storage;
  let originalLocalStorage: Storage;
  let getMasterySpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-07T12:00:00'));

    fakeStorage = createFakeStorage();
    originalLocalStorage = window.localStorage;

    Object.defineProperty(window, 'localStorage', {
      value: fakeStorage,
      writable: true,
      configurable: true,
    });

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});

    masteryService = TestBed.inject(MasteryService);
    getMasterySpy = vi.spyOn(masteryService, 'getMastery');
    getMasterySpy.mockReturnValue(0);

    service = TestBed.inject(SpacedRepetitionService);
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
  });

  // --- Initialization ---

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return empty lastPracticed map initially', () => {
    expect(service.lastPracticed().size).toBe(0);
  });

  // --- recordPractice ---

  it('should record lastPracticed timestamp for a topic', () => {
    service.recordPractice('module-assembly');
    expect(service.lastPracticed().has('module-assembly')).toBe(true);
    expect(service.lastPracticed().get('module-assembly')).toBe(Date.now());
  });

  it('should update lastPracticed to current time on subsequent calls', () => {
    service.recordPractice('module-assembly');
    const first = service.lastPracticed().get('module-assembly');

    vi.advanceTimersByTime(MS_PER_DAY);
    service.recordPractice('module-assembly');
    const second = service.lastPracticed().get('module-assembly');

    expect(second).toBe(first! + MS_PER_DAY);
    expect(second).not.toBe(first);
  });

  // --- getEffectiveMastery: no degradation ---

  it('should return raw mastery when never practiced (no tracking entry)', () => {
    getMasterySpy.mockReturnValue(5);
    expect(service.getEffectiveMastery('module-assembly')).toBe(5);
  });

  it('should return raw mastery when practiced less than 7 days ago', () => {
    getMasterySpy.mockReturnValue(5);
    service.recordPractice('module-assembly');

    vi.advanceTimersByTime(MS_PER_DAY * 3);
    expect(service.getEffectiveMastery('module-assembly')).toBe(5);
  });

  it('should return raw mastery at exactly 6 days 23 hours', () => {
    getMasterySpy.mockReturnValue(5);
    service.recordPractice('module-assembly');

    vi.advanceTimersByTime(MS_PER_DAY * 6 + 23 * 3_600_000);
    expect(service.getEffectiveMastery('module-assembly')).toBe(5);
  });

  it('should return 0 for topic with 0 raw mastery regardless of time', () => {
    getMasterySpy.mockReturnValue(0);
    service.recordPractice('module-assembly');

    vi.advanceTimersByTime(MS_PER_DAY * 30);
    expect(service.getEffectiveMastery('module-assembly')).toBe(0);
  });

  // --- getEffectiveMastery: partial degradation (7-14 days) ---

  it('should show no degradation at exactly 7 days', () => {
    getMasterySpy.mockReturnValue(5);
    service.recordPractice('module-assembly');

    vi.advanceTimersByTime(MS_PER_DAY * 7);
    // (7 - 7) / 7 = 0.0, effective = 5.0
    expect(service.getEffectiveMastery('module-assembly')).toBe(5);
  });

  it('should show non-zero degradation at 7 days + 1ms', () => {
    getMasterySpy.mockReturnValue(5);
    service.recordPractice('module-assembly');

    vi.advanceTimersByTime(MS_PER_DAY * 7 + 1);
    const effective = service.getEffectiveMastery('module-assembly');
    expect(effective).toBeLessThan(5);
    expect(effective).toBeGreaterThan(4.99);
  });

  it('should show partial degradation at 10.5 days (0.5 star lost)', () => {
    getMasterySpy.mockReturnValue(5);
    service.recordPractice('module-assembly');

    vi.advanceTimersByTime(MS_PER_DAY * 10.5);
    // (10.5 - 7) / 7 = 0.5, effective = 5 - 0.5 = 4.5
    expect(service.getEffectiveMastery('module-assembly')).toBeCloseTo(4.5);
  });

  it('should show 1 full star lost at exactly 14 days', () => {
    getMasterySpy.mockReturnValue(5);
    service.recordPractice('module-assembly');

    vi.advanceTimersByTime(MS_PER_DAY * 14);
    // (14 - 7) / 7 = 1.0, effective = 5 - 1.0 = 4.0
    expect(service.getEffectiveMastery('module-assembly')).toBeCloseTo(4.0);
  });

  // --- getEffectiveMastery: full degradation (14-21 days) ---

  it('should show 1.5 stars lost at 17.5 days', () => {
    getMasterySpy.mockReturnValue(5);
    service.recordPractice('module-assembly');

    vi.advanceTimersByTime(MS_PER_DAY * 17.5);
    // (17.5 - 7) / 7 = 1.5, effective = 5 - 1.5 = 3.5
    expect(service.getEffectiveMastery('module-assembly')).toBeCloseTo(3.5);
  });

  it('should show 2 full stars lost at exactly 21 days', () => {
    getMasterySpy.mockReturnValue(5);
    service.recordPractice('module-assembly');

    vi.advanceTimersByTime(MS_PER_DAY * 21);
    // (21 - 7) / 7 = 2.0, effective = 5 - 2.0 = 3.0
    expect(service.getEffectiveMastery('module-assembly')).toBeCloseTo(3.0);
  });

  // --- getEffectiveMastery: cap ---

  it('should cap degradation at 2 stars (5-star bottoms at 3)', () => {
    getMasterySpy.mockReturnValue(5);
    service.recordPractice('module-assembly');

    vi.advanceTimersByTime(MS_PER_DAY * 30);
    // (30 - 7) / 7 = 3.28, capped at 2. effective = 5 - 2 = 3.0
    expect(service.getEffectiveMastery('module-assembly')).toBeCloseTo(3.0);
  });

  it('should cap degradation at 2 stars (3-star topic bottoms at 1)', () => {
    getMasterySpy.mockReturnValue(3);
    service.recordPractice('module-assembly');

    vi.advanceTimersByTime(MS_PER_DAY * 30);
    // rawMastery=3, degradation capped at 2, effective = max(3-2, 0) = 1.0
    expect(service.getEffectiveMastery('module-assembly')).toBeCloseTo(1.0);
  });

  it('should not go below 0 for 1-star topic at max degradation', () => {
    getMasterySpy.mockReturnValue(1);
    service.recordPractice('module-assembly');

    vi.advanceTimersByTime(MS_PER_DAY * 30);
    // rawMastery=1, degradation capped at 2, effective = max(1-2, 0) = 0
    expect(service.getEffectiveMastery('module-assembly')).toBe(0);
  });

  // --- getDegradingTopics ---

  it('should return empty array when no topics have been practiced', () => {
    expect(service.getDegradingTopics()).toEqual([]);
  });

  it('should return empty array when all topics practiced recently', () => {
    getMasterySpy.mockReturnValue(5);
    service.recordPractice('module-assembly');

    vi.advanceTimersByTime(MS_PER_DAY * 3);
    expect(service.getDegradingTopics()).toEqual([]);
  });

  it('should return topics degrading after 7 days', () => {
    getMasterySpy.mockReturnValue(5);
    service.recordPractice('module-assembly');

    vi.advanceTimersByTime(MS_PER_DAY * 10);
    const topics = service.getDegradingTopics();

    expect(topics.length).toBe(1);
    expect(topics[0].topicId).toBe('module-assembly');
    expect(topics[0].rawMastery).toBe(5);
    expect(topics[0].daysSinceLastPractice).toBeCloseTo(10);
    expect(topics[0].degradation).toBeCloseTo((10 - 7) / 7);
    expect(topics[0].effectiveMastery).toBeCloseTo(5 - (10 - 7) / 7);
  });

  it('should not include topics with 0 raw mastery', () => {
    getMasterySpy.mockReturnValue(0);
    service.recordPractice('module-assembly');

    vi.advanceTimersByTime(MS_PER_DAY * 10);
    expect(service.getDegradingTopics()).toEqual([]);
  });

  it('should sort by degradation descending', () => {
    getMasterySpy.mockReturnValue(5);

    // Practice two topics at different times
    service.recordPractice('module-assembly');
    vi.advanceTimersByTime(MS_PER_DAY * 3);
    service.recordPractice('wire-protocol');

    // Advance so both are degrading but module-assembly has more degradation
    vi.advanceTimersByTime(MS_PER_DAY * 10);
    const topics = service.getDegradingTopics();

    expect(topics.length).toBe(2);
    expect(topics[0].topicId).toBe('module-assembly');
    expect(topics[1].topicId).toBe('wire-protocol');
    expect(topics[0].degradation).toBeGreaterThan(topics[1].degradation);
  });

  // --- recordPractice resets degradation ---

  it('should reset degradation when recordPractice is called', () => {
    getMasterySpy.mockReturnValue(5);
    service.recordPractice('module-assembly');

    // Advance 14 days (1 star lost)
    vi.advanceTimersByTime(MS_PER_DAY * 14);
    expect(service.getEffectiveMastery('module-assembly')).toBeCloseTo(4.0);

    // Re-practice
    service.recordPractice('module-assembly');
    expect(service.getEffectiveMastery('module-assembly')).toBe(5);
  });

  // --- Persistence ---

  it('should auto-save lastPracticed after debounce', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const ms = TestBed.inject(MasteryService);
    vi.spyOn(ms, 'getMastery').mockReturnValue(0);
    const svc = TestBed.inject(SpacedRepetitionService);
    vi.clearAllTimers();
    vi.setSystemTime(new Date('2026-03-07T12:00:00'));

    svc.recordPractice('module-assembly');
    const recordedAt = Date.now();
    TestBed.flushEffects();

    // Before debounce -- not saved yet
    const before = fakeStorage.getItem('nexus-station:spaced-repetition');
    expect(before).toBeNull();

    vi.advanceTimersByTime(500);

    const after = fakeStorage.getItem('nexus-station:spaced-repetition');
    expect(after).not.toBeNull();
    const parsed = JSON.parse(after!);
    expect(parsed['module-assembly']).toBe(recordedAt);
  });

  it('should load saved state on init', () => {
    const now = new Date('2026-03-07T12:00:00').getTime();
    fakeStorage.setItem(
      'nexus-station:spaced-repetition',
      JSON.stringify({ 'module-assembly': now }),
    );

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const svc = TestBed.inject(SpacedRepetitionService);

    expect(svc.lastPracticed().get('module-assembly')).toBe(now);
  });

  it('should handle corrupted saved data gracefully', () => {
    fakeStorage.setItem('nexus-station:spaced-repetition', '{invalid json');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const svc = TestBed.inject(SpacedRepetitionService);

    expect(svc.lastPracticed().size).toBe(0);
    warnSpy.mockRestore();
  });

  it('should drop invalid keys from saved data', () => {
    fakeStorage.setItem(
      'nexus-station:spaced-repetition',
      JSON.stringify({
        'invalid-game-id': Date.now(),
        'module-assembly': Date.now(),
      }),
    );

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const svc = TestBed.inject(SpacedRepetitionService);

    expect(svc.lastPracticed().size).toBe(1);
    expect(svc.lastPracticed().has('module-assembly')).toBe(true);
  });
});
