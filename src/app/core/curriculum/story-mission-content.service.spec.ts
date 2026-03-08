import { TestBed } from '@angular/core/testing';
import { StoryMissionContentService } from './story-mission-content.service';
import { GameProgressionService } from '../progression/game-progression.service';
import type { StoryMissionContent } from './story-mission-content.types';
import type { ChapterId } from './curriculum.types';

const MOCK_MISSION_1: StoryMissionContent = {
  chapterId: 1 as ChapterId,
  steps: [
    { stepType: 'narrative', narrativeText: 'Step 1 narrative' },
    { stepType: 'code-example', narrativeText: 'Step 2', code: 'const x = 1;', language: 'typescript', explanation: 'A variable' },
    { stepType: 'concept', narrativeText: 'Step 3', conceptTitle: 'Concept', conceptBody: 'Body' },
  ],
  completionCriteria: { description: 'View all steps', minStepsViewed: 3 },
};

const MOCK_MISSION_2: StoryMissionContent = {
  chapterId: 2 as ChapterId,
  steps: [
    { stepType: 'narrative', narrativeText: 'Mission 2 step 1' },
    { stepType: 'narrative', narrativeText: 'Mission 2 step 2' },
    { stepType: 'narrative', narrativeText: 'Mission 2 step 3' },
  ],
  completionCriteria: { description: 'View all steps', minStepsViewed: 3 },
};

const MOCK_MISSION_3: StoryMissionContent = {
  chapterId: 3 as ChapterId,
  steps: [
    { stepType: 'narrative', narrativeText: 'Mission 3 step 1' },
    { stepType: 'narrative', narrativeText: 'Mission 3 step 2' },
  ],
  completionCriteria: { description: 'View 1 step', minStepsViewed: 1 },
};

describe('StoryMissionContentService', () => {
  let service: StoryMissionContentService;
  let isMissionAvailableSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    isMissionAvailableSpy = vi.fn().mockReturnValue(true);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        StoryMissionContentService,
        {
          provide: GameProgressionService,
          useValue: { isMissionAvailable: isMissionAvailableSpy },
        },
      ],
    });
    service = TestBed.inject(StoryMissionContentService);
    service.registerContent([MOCK_MISSION_1, MOCK_MISSION_2]);
  });

  // --- Service creation ---

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // --- registerContent ---

  describe('registerContent', () => {
    it('should register a single StoryMissionContent', () => {
      service.registerContent(MOCK_MISSION_3);
      expect(service.getMissionContent(3)).toBe(MOCK_MISSION_3);
    });

    it('should register an array of StoryMissionContent', () => {
      expect(service.getMissionContent(1)).toBe(MOCK_MISSION_1);
      expect(service.getMissionContent(2)).toBe(MOCK_MISSION_2);
    });

    it('should overwrite existing content for the same chapterId', () => {
      const updated: StoryMissionContent = {
        ...MOCK_MISSION_1,
        steps: [{ stepType: 'narrative', narrativeText: 'Updated' }],
        completionCriteria: { description: 'Updated', minStepsViewed: 1 },
      };
      service.registerContent(updated);
      expect(service.getMissionContent(1)).toBe(updated);
      expect(service.getMissionStepCount(1)).toBe(1);
    });

    it('should not throw for empty array', () => {
      expect(() => service.registerContent([])).not.toThrow();
    });
  });

  // --- getMissionContent ---

  describe('getMissionContent', () => {
    it('should return StoryMissionContent for a registered chapter', () => {
      const content = service.getMissionContent(1);
      expect(content).toBe(MOCK_MISSION_1);
      expect(content?.chapterId).toBe(1);
    });

    it('should return undefined for an unregistered chapter', () => {
      expect(service.getMissionContent(99)).toBeUndefined();
    });

    it('should return undefined for chapterId 0', () => {
      expect(service.getMissionContent(0)).toBeUndefined();
    });

    it('should return undefined for negative chapterId', () => {
      expect(service.getMissionContent(-1)).toBeUndefined();
    });
  });

  // --- getMissionStepCount ---

  describe('getMissionStepCount', () => {
    it('should return the number of steps for a registered chapter', () => {
      expect(service.getMissionStepCount(1)).toBe(3);
      expect(service.getMissionStepCount(2)).toBe(3);
    });

    it('should return 0 for an unregistered chapter', () => {
      expect(service.getMissionStepCount(99)).toBe(0);
    });
  });

  // --- completeMissionStep ---

  describe('completeMissionStep', () => {
    it('should mark a step as completed', () => {
      service.completeMissionStep(1, 0);
      service.completeMissionStep(1, 1);
      service.completeMissionStep(1, 2);
      expect(service.isMissionComplete(1)).toBe(true);
    });

    it('should be idempotent for the same step', () => {
      service.completeMissionStep(1, 0);
      service.completeMissionStep(1, 0);
      expect(service.getViewedSteps(1).size).toBe(1);
    });

    it('should throw for unregistered chapter', () => {
      expect(() => service.completeMissionStep(99, 0))
        .toThrowError('Mission content not found: chapter 99');
    });

    it('should throw for stepIndex out of range (negative)', () => {
      expect(() => service.completeMissionStep(1, -1))
        .toThrowError('Step index out of range');
    });

    it('should throw for stepIndex out of range (>= steps.length)', () => {
      expect(() => service.completeMissionStep(1, 3))
        .toThrowError('Step index out of range');
    });

    it('should throw for unavailable mission', () => {
      isMissionAvailableSpy.mockReturnValue(false);
      expect(() => service.completeMissionStep(1, 0))
        .toThrowError('Mission not available: chapter 1');
    });
  });

  // --- isMissionComplete ---

  describe('isMissionComplete', () => {
    it('should return false when no steps completed', () => {
      expect(service.isMissionComplete(1)).toBe(false);
    });

    it('should return false when some but not all required steps completed', () => {
      service.completeMissionStep(1, 0);
      service.completeMissionStep(1, 1);
      expect(service.isMissionComplete(1)).toBe(false);
    });

    it('should return true when all required steps are completed (minStepsViewed met)', () => {
      service.completeMissionStep(1, 0);
      service.completeMissionStep(1, 1);
      service.completeMissionStep(1, 2);
      expect(service.isMissionComplete(1)).toBe(true);
    });

    it('should return true when minStepsViewed < steps.length and threshold met', () => {
      service.registerContent(MOCK_MISSION_3);
      service.completeMissionStep(3, 0);
      expect(service.isMissionComplete(3)).toBe(true);
    });

    it('should return false for unregistered chapter', () => {
      expect(service.isMissionComplete(99)).toBe(false);
    });
  });

  // --- getViewedSteps ---

  describe('getViewedSteps', () => {
    it('should return empty set for chapter with no viewed steps', () => {
      expect(service.getViewedSteps(1).size).toBe(0);
    });

    it('should return set of viewed step indices', () => {
      service.completeMissionStep(1, 0);
      service.completeMissionStep(1, 2);
      const viewed = service.getViewedSteps(1);
      expect(viewed.size).toBe(2);
      expect(viewed.has(0)).toBe(true);
      expect(viewed.has(2)).toBe(true);
    });

    it('should return a new set to prevent external mutation', () => {
      service.completeMissionStep(1, 0);
      const viewed1 = service.getViewedSteps(1);
      const viewed2 = service.getViewedSteps(1);
      expect(viewed1).not.toBe(viewed2);
    });
  });

  // --- resetMissionProgress ---

  describe('resetMissionProgress', () => {
    it('should clear viewed steps for a specific chapter', () => {
      service.completeMissionStep(1, 0);
      service.completeMissionStep(1, 1);
      service.completeMissionStep(1, 2);
      expect(service.isMissionComplete(1)).toBe(true);

      service.resetMissionProgress(1);
      expect(service.isMissionComplete(1)).toBe(false);
      expect(service.getViewedSteps(1).size).toBe(0);
    });

    it('should not affect other chapters', () => {
      service.completeMissionStep(1, 0);
      service.completeMissionStep(2, 0);

      service.resetMissionProgress(1);
      expect(service.getViewedSteps(1).size).toBe(0);
      expect(service.getViewedSteps(2).size).toBe(1);
    });

    it('should be a no-op for chapter with no progress', () => {
      expect(() => service.resetMissionProgress(99)).not.toThrow();
    });
  });

  // --- Integration with GameProgressionService ---

  describe('integration with GameProgressionService', () => {
    it('should call isMissionAvailable with chapterId when completing a step', () => {
      service.completeMissionStep(1, 0);
      expect(isMissionAvailableSpy).toHaveBeenCalledWith(1);
    });

    it('should throw when completing a step for an unavailable mission', () => {
      isMissionAvailableSpy.mockReturnValue(false);
      expect(() => service.completeMissionStep(2, 0))
        .toThrowError('Mission not available: chapter 2');
    });
  });
});
