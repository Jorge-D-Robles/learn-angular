import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { vi } from 'vitest';
import { missionGuard } from './mission.guard';
import { GameProgressionService } from '../progression/game-progression.service';

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

const mockState = {} as RouterStateSnapshot;

describe('missionGuard', () => {
  let mockProgression: { isMissionAvailable: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockProgression = {
      isMissionAvailable: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: GameProgressionService, useValue: mockProgression },
      ],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should allow access when mission is available', () => {
    mockProgression.isMissionAvailable.mockReturnValue(true);
    const route = createMockRoute({ chapterId: '5' });

    const result = TestBed.runInInjectionContext(() => missionGuard(route, mockState));

    expect(result).toBe(true);
  });

  it('should redirect to /campaign with locked query param when mission is locked', () => {
    mockProgression.isMissionAvailable.mockReturnValue(false);
    const route = createMockRoute({ chapterId: '5' });

    const result = TestBed.runInInjectionContext(() => missionGuard(route, mockState));

    expect(result).toBeInstanceOf(UrlTree);
    const urlTree = result as UrlTree;
    expect(urlTree.toString()).toContain('/campaign');
    expect(urlTree.queryParams['locked']).toBe('5');
  });

  it('should redirect to /campaign when chapterId is missing', () => {
    const route = createMockRoute({});

    const result = TestBed.runInInjectionContext(() => missionGuard(route, mockState));

    expect(result).toBeInstanceOf(UrlTree);
    const urlTree = result as UrlTree;
    expect(urlTree.toString()).toContain('/campaign');
    expect(urlTree.queryParams['locked']).toBeUndefined();
  });

  it('should redirect to /campaign when chapterId is non-numeric', () => {
    const route = createMockRoute({ chapterId: 'abc' });

    const result = TestBed.runInInjectionContext(() => missionGuard(route, mockState));

    expect(result).toBeInstanceOf(UrlTree);
    const urlTree = result as UrlTree;
    expect(urlTree.toString()).toContain('/campaign');
    expect(urlTree.queryParams['locked']).toBeUndefined();
  });

  it('should read chapterId from route params and pass correct numeric value to isMissionAvailable', () => {
    mockProgression.isMissionAvailable.mockReturnValue(true);
    const route = createMockRoute({ chapterId: '7' });

    TestBed.runInInjectionContext(() => missionGuard(route, mockState));

    expect(mockProgression.isMissionAvailable).toHaveBeenCalledWith(7);
  });

  it('should allow access to completed missions (replay)', () => {
    mockProgression.isMissionAvailable.mockReturnValue(true);
    const route = createMockRoute({ chapterId: '1' });

    const result = TestBed.runInInjectionContext(() => missionGuard(route, mockState));

    expect(result).toBe(true);
    expect(mockProgression.isMissionAvailable).toHaveBeenCalledWith(1);
  });

  it('should redirect when chapterId is out of range (e.g., 99)', () => {
    mockProgression.isMissionAvailable.mockReturnValue(false);
    const route = createMockRoute({ chapterId: '99' });

    const result = TestBed.runInInjectionContext(() => missionGuard(route, mockState));

    expect(result).toBeInstanceOf(UrlTree);
    const urlTree = result as UrlTree;
    expect(urlTree.toString()).toContain('/campaign');
    expect(urlTree.queryParams['locked']).toBe('99');
  });
});
