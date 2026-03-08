import { TestBed } from '@angular/core/testing';
import { CurriculumService } from './curriculum.service';
import type { MinigameId } from '../minigame';

describe('CurriculumService', () => {
  let service: CurriculumService;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    service = TestBed.inject(CurriculumService);
  });

  // --- Service creation ---

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // --- getChapter ---

  describe('getChapter', () => {
    it('should return StoryMission for valid chapter 1', () => {
      const mission = service.getChapter(1);
      expect(mission).toBeDefined();
      expect(mission!.chapterId).toBe(1);
      expect(mission!.title).toBe('Build the Emergency Shelter');
      expect(mission!.angularTopic).toBe('Components');
    });

    it('should return StoryMission for valid chapter 34', () => {
      const mission = service.getChapter(34);
      expect(mission).toBeDefined();
      expect(mission!.chapterId).toBe(34);
      expect(mission!.title).toBe('Station Hardening');
      expect(mission!.angularTopic).toBe('Performance & Security');
    });

    it('should return undefined for invalid chapter 0', () => {
      expect(service.getChapter(0)).toBeUndefined();
    });

    it('should return undefined for invalid chapter 99', () => {
      expect(service.getChapter(99)).toBeUndefined();
    });

    it('should return undefined for negative chapter -1', () => {
      expect(service.getChapter(-1)).toBeUndefined();
    });
  });

  // --- getMinigameForChapter ---

  describe('getMinigameForChapter', () => {
    it('should return "module-assembly" for chapter 1', () => {
      expect(service.getMinigameForChapter(1)).toBe('module-assembly');
    });

    it('should return "flow-commander" for chapter 4', () => {
      expect(service.getMinigameForChapter(4)).toBe('flow-commander');
    });

    it('should return "system-certification" for chapter 32', () => {
      expect(service.getMinigameForChapter(32)).toBe('system-certification');
    });

    it('should return null for chapter 9 (no minigame)', () => {
      expect(service.getMinigameForChapter(9)).toBeNull();
    });

    it('should return null for chapter 10 (no minigame)', () => {
      expect(service.getMinigameForChapter(10)).toBeNull();
    });

    it('should return null for invalid chapter 99', () => {
      expect(service.getMinigameForChapter(99)).toBeNull();
    });
  });

  // --- getChapterForMinigame ---

  describe('getChapterForMinigame', () => {
    it('should return 1 for "module-assembly"', () => {
      expect(service.getChapterForMinigame('module-assembly')).toBe(1);
    });

    it('should return 4 for "flow-commander"', () => {
      expect(service.getChapterForMinigame('flow-commander')).toBe(4);
    });

    it('should return 32 for "system-certification"', () => {
      expect(service.getChapterForMinigame('system-certification')).toBe(32);
    });

    it('should return null for unknown minigame ID', () => {
      expect(service.getChapterForMinigame('nonexistent' as MinigameId)).toBeNull();
    });
  });

  // --- getPhaseForChapter ---

  describe('getPhaseForChapter', () => {
    it('should return phase 1 for chapter 1', () => {
      const phase = service.getPhaseForChapter(1);
      expect(phase.phaseNumber).toBe(1);
      expect(phase.name).toBe('Foundations');
    });

    it('should return phase 1 for chapter 10', () => {
      const phase = service.getPhaseForChapter(10);
      expect(phase.phaseNumber).toBe(1);
      expect(phase.name).toBe('Foundations');
    });

    it('should return phase 2 for chapter 11', () => {
      const phase = service.getPhaseForChapter(11);
      expect(phase.phaseNumber).toBe(2);
      expect(phase.name).toBe('Navigation');
    });

    it('should return phase 6 for chapter 34', () => {
      const phase = service.getPhaseForChapter(34);
      expect(phase.phaseNumber).toBe(6);
      expect(phase.name).toBe('Advanced');
    });

    it('should throw for invalid chapter 0', () => {
      expect(() => service.getPhaseForChapter(0)).toThrow('Chapter not found: 0');
    });

    it('should throw for invalid chapter 99', () => {
      expect(() => service.getPhaseForChapter(99)).toThrow('Chapter not found: 99');
    });
  });

  // --- getPrerequisites ---

  describe('getPrerequisites', () => {
    it('should return [] for chapter 1 (no deps)', () => {
      expect(service.getPrerequisites(1)).toEqual([]);
    });

    it('should return [1] for chapter 2', () => {
      expect(service.getPrerequisites(2)).toEqual([1]);
    });

    it('should return [4] for chapter 5', () => {
      expect(service.getPrerequisites(5)).toEqual([4]);
    });

    it('should return [] for invalid chapter 99', () => {
      expect(service.getPrerequisites(99)).toEqual([]);
    });
  });
});
