import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { vi } from 'vitest';
import { minigameLevelGuard } from './minigame-level.guard';
import { LevelProgressionService } from '../levels/level-progression.service';

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

describe('minigameLevelGuard', () => {
  let mockLevelProgression: {
    getLevelDefinition: ReturnType<typeof vi.fn>;
    isLevelUnlocked: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockLevelProgression = {
      getLevelDefinition: vi.fn(),
      isLevelUnlocked: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: LevelProgressionService, useValue: mockLevelProgression },
      ],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should allow access when level is unlocked', () => {
    mockLevelProgression.getLevelDefinition.mockReturnValue({ levelId: 'ma-basic-01', gameId: 'module-assembly' });
    mockLevelProgression.isLevelUnlocked.mockReturnValue(true);
    const route = createMockRoute({ gameId: 'module-assembly', levelId: 'ma-basic-01' });

    const result = TestBed.runInInjectionContext(() => minigameLevelGuard(route, mockState));

    expect(result).toBe(true);
  });

  it('should redirect to level select when level is locked', () => {
    mockLevelProgression.getLevelDefinition.mockReturnValue({ levelId: 'ma-inter-01', gameId: 'module-assembly' });
    mockLevelProgression.isLevelUnlocked.mockReturnValue(false);
    const route = createMockRoute({ gameId: 'module-assembly', levelId: 'ma-inter-01' });

    const result = TestBed.runInInjectionContext(() => minigameLevelGuard(route, mockState));

    expect(result).toBeInstanceOf(UrlTree);
    const urlTree = result as UrlTree;
    expect(urlTree.toString()).toContain('/minigames/module-assembly');
  });

  it('should allow access when level definition is not found', () => {
    mockLevelProgression.getLevelDefinition.mockReturnValue(null);
    const route = createMockRoute({ gameId: 'module-assembly', levelId: 'nonexistent-level' });

    const result = TestBed.runInInjectionContext(() => minigameLevelGuard(route, mockState));

    expect(result).toBe(true);
    expect(mockLevelProgression.isLevelUnlocked).not.toHaveBeenCalled();
  });

  it('should redirect using gameId from route params', () => {
    mockLevelProgression.getLevelDefinition.mockReturnValue({ levelId: 'wp-basic-01', gameId: 'wire-protocol' });
    mockLevelProgression.isLevelUnlocked.mockReturnValue(false);
    const route = createMockRoute({ gameId: 'wire-protocol', levelId: 'wp-basic-01' });

    const result = TestBed.runInInjectionContext(() => minigameLevelGuard(route, mockState));

    expect(result).toBeInstanceOf(UrlTree);
    const urlTree = result as UrlTree;
    expect(urlTree.toString()).toContain('/minigames/wire-protocol');
  });

  it('should read levelId from route params and pass it to isLevelUnlocked', () => {
    mockLevelProgression.getLevelDefinition.mockReturnValue({ levelId: 'ma-basic-03', gameId: 'module-assembly' });
    mockLevelProgression.isLevelUnlocked.mockReturnValue(true);
    const route = createMockRoute({ gameId: 'module-assembly', levelId: 'ma-basic-03' });

    TestBed.runInInjectionContext(() => minigameLevelGuard(route, mockState));

    expect(mockLevelProgression.getLevelDefinition).toHaveBeenCalledWith('ma-basic-03');
    expect(mockLevelProgression.isLevelUnlocked).toHaveBeenCalledWith('ma-basic-03');
  });

  it('should allow access when levelId is missing', () => {
    const route = createMockRoute({ gameId: 'module-assembly' });

    const result = TestBed.runInInjectionContext(() => minigameLevelGuard(route, mockState));

    expect(result).toBe(true);
    expect(mockLevelProgression.getLevelDefinition).not.toHaveBeenCalled();
    expect(mockLevelProgression.isLevelUnlocked).not.toHaveBeenCalled();
  });
});
