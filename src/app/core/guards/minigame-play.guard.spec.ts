import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { signal, type Signal } from '@angular/core';
import { vi } from 'vitest';
import { minigamePlayGuard } from './minigame-play.guard';
import { ConfirmDialogService } from '../../shared/services/confirm-dialog.service';
import { MinigameStatus } from '../minigame/minigame.types';
import type { MinigamePlayPage } from '../../pages/minigame-play/minigame-play';

function createMockRoute(params: Record<string, string | null>): ActivatedRouteSnapshot {
  return {
    paramMap: {
      get: vi.fn((key: string) => params[key] ?? null),
      has: vi.fn((key: string) => key in params && params[key] !== null),
      getAll: vi.fn(() => []),
      keys: Object.keys(params),
    },
  } as unknown as ActivatedRouteSnapshot;
}

function createMockComponent(
  engineValue: { status: Signal<MinigameStatus> } | null,
): MinigamePlayPage {
  return {
    engine: signal(engineValue),
  } as unknown as MinigamePlayPage;
}

const mockRoute = createMockRoute({});
const mockCurrentState = {} as RouterStateSnapshot;
const mockNextState = {} as RouterStateSnapshot;

describe('minigamePlayGuard', () => {
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

  it('should allow navigation when engine is null', () => {
    const component = createMockComponent(null);

    const result = TestBed.runInInjectionContext(() =>
      minigamePlayGuard(component, mockRoute, mockCurrentState, mockNextState),
    );

    expect(result).toBe(true);
  });

  it('should allow navigation when status is Won', () => {
    const component = createMockComponent({ status: signal(MinigameStatus.Won) });

    const result = TestBed.runInInjectionContext(() =>
      minigamePlayGuard(component, mockRoute, mockCurrentState, mockNextState),
    );

    expect(result).toBe(true);
  });

  it('should allow navigation when status is Lost', () => {
    const component = createMockComponent({ status: signal(MinigameStatus.Lost) });

    const result = TestBed.runInInjectionContext(() =>
      minigamePlayGuard(component, mockRoute, mockCurrentState, mockNextState),
    );

    expect(result).toBe(true);
  });

  it('should allow navigation when status is Loading', () => {
    const component = createMockComponent({ status: signal(MinigameStatus.Loading) });

    const result = TestBed.runInInjectionContext(() =>
      minigamePlayGuard(component, mockRoute, mockCurrentState, mockNextState),
    );

    expect(result).toBe(true);
  });

  it('should show confirm dialog when status is Playing', () => {
    mockConfirmDialog.confirm.mockReturnValue(of(true));
    const component = createMockComponent({ status: signal(MinigameStatus.Playing) });

    const result = TestBed.runInInjectionContext(() =>
      minigamePlayGuard(component, mockRoute, mockCurrentState, mockNextState),
    );

    expect(mockConfirmDialog.confirm).toHaveBeenCalledTimes(1);
    expect(result).toBeInstanceOf(Observable);
  });

  it('should show confirm dialog when status is Paused', () => {
    mockConfirmDialog.confirm.mockReturnValue(of(true));
    const component = createMockComponent({ status: signal(MinigameStatus.Paused) });

    const result = TestBed.runInInjectionContext(() =>
      minigamePlayGuard(component, mockRoute, mockCurrentState, mockNextState),
    );

    expect(mockConfirmDialog.confirm).toHaveBeenCalledTimes(1);
    expect(result).toBeInstanceOf(Observable);
  });

  it('should allow navigation after user confirms', () => {
    mockConfirmDialog.confirm.mockReturnValue(of(true));
    const component = createMockComponent({ status: signal(MinigameStatus.Playing) });

    const result = TestBed.runInInjectionContext(() =>
      minigamePlayGuard(component, mockRoute, mockCurrentState, mockNextState),
    ) as Observable<boolean>;

    let emittedValue: boolean | undefined;
    result.subscribe((v) => (emittedValue = v));
    expect(emittedValue).toBe(true);
  });

  it('should block navigation after user cancels', () => {
    mockConfirmDialog.confirm.mockReturnValue(of(false));
    const component = createMockComponent({ status: signal(MinigameStatus.Playing) });

    const result = TestBed.runInInjectionContext(() =>
      minigamePlayGuard(component, mockRoute, mockCurrentState, mockNextState),
    ) as Observable<boolean>;

    let emittedValue: boolean | undefined;
    result.subscribe((v) => (emittedValue = v));
    expect(emittedValue).toBe(false);
  });

  it('should pass correct dialog options', () => {
    mockConfirmDialog.confirm.mockReturnValue(of(true));
    const component = createMockComponent({ status: signal(MinigameStatus.Playing) });

    TestBed.runInInjectionContext(() =>
      minigamePlayGuard(component, mockRoute, mockCurrentState, mockNextState),
    );

    expect(mockConfirmDialog.confirm).toHaveBeenCalledWith({
      title: 'Quit Game?',
      message: 'Quit current game? Progress will be lost.',
      confirmText: 'Quit',
      cancelText: 'Keep Playing',
      variant: 'warning',
    });
  });
});
