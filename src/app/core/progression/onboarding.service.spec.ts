import { TestBed } from '@angular/core/testing';
import {
  OnboardingService,
  OnboardingStep,
  ONBOARDING_STEP_ORDER,
} from './onboarding.service';

// --- Test helpers ---

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

describe('OnboardingService', () => {
  let fakeStorage: Storage;
  let originalLocalStorage: Storage;

  beforeEach(() => {
    fakeStorage = createFakeStorage();
    originalLocalStorage = window.localStorage;

    Object.defineProperty(window, 'localStorage', {
      value: fakeStorage,
      writable: true,
      configurable: true,
    });

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
  });

  // --- Initialization tests ---

  it('should be created', () => {
    const service = TestBed.inject(OnboardingService);
    expect(service).toBeTruthy();
  });

  it('should default isOnboardingComplete to false', () => {
    const service = TestBed.inject(OnboardingService);
    expect(service.isOnboardingComplete()).toBe(false);
  });

  it('should default nextPendingStep() to OnboardingStep.Welcome', () => {
    const service = TestBed.inject(OnboardingService);
    expect(service.nextPendingStep()).toBe(OnboardingStep.Welcome);
  });

  // --- isStepCompleted tests ---

  it('should return false for an uncompleted step', () => {
    const service = TestBed.inject(OnboardingService);
    expect(service.isStepCompleted(OnboardingStep.Welcome)).toBe(false);
  });

  it('should return true for a completed step', () => {
    const service = TestBed.inject(OnboardingService);
    service.completeStep(OnboardingStep.Welcome);
    expect(service.isStepCompleted(OnboardingStep.Welcome)).toBe(true);
  });

  // --- completeStep tests ---

  it('should mark a step as completed', () => {
    const service = TestBed.inject(OnboardingService);
    service.completeStep(OnboardingStep.Welcome);
    expect(service.isStepCompleted(OnboardingStep.Welcome)).toBe(true);
  });

  it('should not affect other steps', () => {
    const service = TestBed.inject(OnboardingService);
    service.completeStep(OnboardingStep.Welcome);
    expect(service.isStepCompleted(OnboardingStep.FirstMission)).toBe(false);
  });

  it('should be idempotent', () => {
    const service = TestBed.inject(OnboardingService);
    service.completeStep(OnboardingStep.Welcome);
    service.completeStep(OnboardingStep.Welcome);
    expect(service.isStepCompleted(OnboardingStep.Welcome)).toBe(true);
  });

  it('should update isOnboardingComplete when all steps are done', () => {
    const service = TestBed.inject(OnboardingService);

    for (const step of ONBOARDING_STEP_ORDER) {
      service.completeStep(step);
    }

    expect(service.isOnboardingComplete()).toBe(true);
  });

  // --- nextPendingStep tests ---

  it('should return the first uncompleted step in order', () => {
    const service = TestBed.inject(OnboardingService);
    expect(service.nextPendingStep()).toBe(ONBOARDING_STEP_ORDER[0]);
  });

  it('should skip completed steps', () => {
    const service = TestBed.inject(OnboardingService);
    service.completeStep(OnboardingStep.Welcome);
    expect(service.nextPendingStep()).toBe(OnboardingStep.FirstMission);
  });

  it('should return null when all steps are done', () => {
    const service = TestBed.inject(OnboardingService);

    for (const step of ONBOARDING_STEP_ORDER) {
      service.completeStep(step);
    }

    expect(service.nextPendingStep()).toBeNull();
  });

  // --- Persistence tests ---

  it('should persist completed steps immediately on completeStep()', () => {
    const service = TestBed.inject(OnboardingService);
    service.completeStep(OnboardingStep.Welcome);

    const raw = fakeStorage.getItem('nexus-station:onboarding');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed).toContain(OnboardingStep.Welcome);
  });

  it('should load persisted steps on init', () => {
    fakeStorage.setItem(
      'nexus-station:onboarding',
      JSON.stringify([OnboardingStep.Welcome, OnboardingStep.FirstMission]),
    );

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const service = TestBed.inject(OnboardingService);

    expect(service.isStepCompleted(OnboardingStep.Welcome)).toBe(true);
    expect(service.isStepCompleted(OnboardingStep.FirstMission)).toBe(true);
    expect(service.isStepCompleted(OnboardingStep.FirstMinigame)).toBe(false);
  });

  it('should handle corrupted saved data gracefully', () => {
    fakeStorage.setItem('nexus-station:onboarding', '{invalid json');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const service = TestBed.inject(OnboardingService);

    expect(service.isOnboardingComplete()).toBe(false);
    expect(service.nextPendingStep()).toBe(OnboardingStep.Welcome);
    warnSpy.mockRestore();
  });

  it('should handle partially valid saved data', () => {
    fakeStorage.setItem(
      'nexus-station:onboarding',
      JSON.stringify([OnboardingStep.Welcome, 'invalidStep', 42, null]),
    );

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const service = TestBed.inject(OnboardingService);

    expect(service.isStepCompleted(OnboardingStep.Welcome)).toBe(true);
    expect(service.isStepCompleted(OnboardingStep.FirstMission)).toBe(false);
  });

  // --- resetOnboarding tests ---

  it('should clear all completed steps', () => {
    const service = TestBed.inject(OnboardingService);
    service.completeStep(OnboardingStep.Welcome);
    service.completeStep(OnboardingStep.FirstMission);

    service.resetOnboarding();

    expect(service.isStepCompleted(OnboardingStep.Welcome)).toBe(false);
    expect(service.isStepCompleted(OnboardingStep.FirstMission)).toBe(false);
    expect(service.isOnboardingComplete()).toBe(false);
  });

  it('should clear persisted data', () => {
    const service = TestBed.inject(OnboardingService);
    service.completeStep(OnboardingStep.Welcome);

    service.resetOnboarding();

    const raw = fakeStorage.getItem('nexus-station:onboarding');
    expect(raw).toBeNull();
  });

  // --- Edge case ---

  it('should ignore invalid step values in completeStep', () => {
    const service = TestBed.inject(OnboardingService);
    service.completeStep('notARealStep' as OnboardingStep);

    expect(service.isOnboardingComplete()).toBe(false);
    expect(service.nextPendingStep()).toBe(OnboardingStep.Welcome);
  });
});
