import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { storyMissionGuard } from './story-mission.guard';
import { ConfirmDialogService } from '../../shared/services/confirm-dialog.service';
import type { MissionPage } from '../../pages/mission/mission';

function createMockRoute(): ActivatedRouteSnapshot {
  return {} as ActivatedRouteSnapshot;
}

function createMockComponent(overrides: {
  currentStep?: number;
  totalSteps?: number;
  missionCompleted?: boolean;
}): MissionPage {
  return {
    currentStep: signal(overrides.currentStep ?? 0),
    totalSteps: signal(overrides.totalSteps ?? 5),
    missionCompleted: signal(overrides.missionCompleted ?? false),
  } as unknown as MissionPage;
}

const mockRoute = createMockRoute();
const mockCurrentState = {} as RouterStateSnapshot;
const mockNextState = {} as RouterStateSnapshot;

describe('storyMissionGuard', () => {
  let mockConfirmDialog: { confirm: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockConfirmDialog = {
      confirm: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: ConfirmDialogService, useValue: mockConfirmDialog },
      ],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should allow navigation when at step 0 (not started)', () => {
    const component = createMockComponent({ currentStep: 0, totalSteps: 5 });

    const result = TestBed.runInInjectionContext(() =>
      storyMissionGuard(component, mockRoute, mockCurrentState, mockNextState),
    );

    expect(result).toBe(true);
  });

  it('should allow navigation when mission is completed', () => {
    const component = createMockComponent({
      currentStep: 3,
      totalSteps: 5,
      missionCompleted: true,
    });

    const result = TestBed.runInInjectionContext(() =>
      storyMissionGuard(component, mockRoute, mockCurrentState, mockNextState),
    );

    expect(result).toBe(true);
  });

  it('should allow navigation when totalSteps is 0', () => {
    const component = createMockComponent({ currentStep: 0, totalSteps: 0 });

    const result = TestBed.runInInjectionContext(() =>
      storyMissionGuard(component, mockRoute, mockCurrentState, mockNextState),
    );

    expect(result).toBe(true);
  });

  it('should show confirm dialog when mid-mission', () => {
    mockConfirmDialog.confirm.mockReturnValue(of(true));
    const component = createMockComponent({ currentStep: 2, totalSteps: 5 });

    const result = TestBed.runInInjectionContext(() =>
      storyMissionGuard(component, mockRoute, mockCurrentState, mockNextState),
    );

    expect(mockConfirmDialog.confirm).toHaveBeenCalledTimes(1);
    expect(result).toBeInstanceOf(Observable);
  });

  it('should allow navigation after user confirms leaving', () => {
    mockConfirmDialog.confirm.mockReturnValue(of(true));
    const component = createMockComponent({ currentStep: 2, totalSteps: 5 });

    const result = TestBed.runInInjectionContext(() =>
      storyMissionGuard(component, mockRoute, mockCurrentState, mockNextState),
    ) as Observable<boolean>;

    let emittedValue: boolean | undefined;
    result.subscribe((v) => (emittedValue = v));
    expect(emittedValue).toBe(true);
  });

  it('should block navigation after user cancels', () => {
    mockConfirmDialog.confirm.mockReturnValue(of(false));
    const component = createMockComponent({ currentStep: 2, totalSteps: 5 });

    const result = TestBed.runInInjectionContext(() =>
      storyMissionGuard(component, mockRoute, mockCurrentState, mockNextState),
    ) as Observable<boolean>;

    let emittedValue: boolean | undefined;
    result.subscribe((v) => (emittedValue = v));
    expect(emittedValue).toBe(false);
  });

  it('should pass correct dialog options', () => {
    mockConfirmDialog.confirm.mockReturnValue(of(true));
    const component = createMockComponent({ currentStep: 3, totalSteps: 5 });

    TestBed.runInInjectionContext(() =>
      storyMissionGuard(component, mockRoute, mockCurrentState, mockNextState),
    );

    expect(mockConfirmDialog.confirm).toHaveBeenCalledWith({
      title: 'Leave Mission?',
      message: 'Leave this mission? Your step progress will be lost.',
      confirmText: 'Leave',
      cancelText: 'Stay',
      variant: 'warning',
    });
  });

  it('should prompt when on last step but mission not completed', () => {
    mockConfirmDialog.confirm.mockReturnValue(of(true));
    const component = createMockComponent({
      currentStep: 4,
      totalSteps: 5,
      missionCompleted: false,
    });

    const result = TestBed.runInInjectionContext(() =>
      storyMissionGuard(component, mockRoute, mockCurrentState, mockNextState),
    );

    expect(mockConfirmDialog.confirm).toHaveBeenCalledTimes(1);
    expect(result).toBeInstanceOf(Observable);
  });
});
