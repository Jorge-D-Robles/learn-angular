/**
 * Tests for provideMissionContent() — registers StoryMissionContent[]
 * with StoryMissionContentService during app initialization via
 * provideAppInitializer.
 */
import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StoryMissionContentService } from '../../core/curriculum';
import { PHASE_1_MISSIONS } from './phase-1';
import { PHASE_2_MISSIONS } from './phase-2';
import { PHASE_3_MISSIONS } from './phase-3';
import { PHASE_4_MISSIONS } from './phase-4';
import { PHASE_5_MISSIONS } from './phase-5';
import { PHASE_6_MISSIONS } from './phase-6';
import { provideMissionContent } from './provide-mission-content';

describe('provideMissionContent', () => {
  let service: StoryMissionContentService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideMissionContent(PHASE_1_MISSIONS)],
    });

    await TestBed.inject(ApplicationInitStatus).donePromise;
    service = TestBed.inject(StoryMissionContentService);
  });

  it('should register all 10 Phase 1 mission content entries at initialization', () => {
    for (let ch = 1; ch <= 10; ch++) {
      expect(service.getMissionContent(ch)).toBeDefined();
    }
  });

  it('should return valid content for each chapter (1-10)', () => {
    for (let ch = 1; ch <= 10; ch++) {
      const content = service.getMissionContent(ch);
      expect(content).toBeDefined();
      expect(content!.chapterId).toBe(ch);
      expect(content!.steps.length).toBeGreaterThan(0);
      expect(content!.completionCriteria).toBeDefined();
    }
  });

  it('should return correct chapterId for getMissionContent(1)', () => {
    const content = service.getMissionContent(1);
    expect(content).toBeDefined();
    expect(content!.chapterId).toBe(1);
  });

  it('should return correct chapterId for getMissionContent(10)', () => {
    const content = service.getMissionContent(10);
    expect(content).toBeDefined();
    expect(content!.chapterId).toBe(10);
  });

  it('should return undefined for unregistered chapterId (99)', () => {
    expect(service.getMissionContent(99)).toBeUndefined();
  });

  it('should return undefined for chapterId 0', () => {
    expect(service.getMissionContent(0)).toBeUndefined();
  });

  it('should be idempotent when provided multiple times', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideMissionContent(PHASE_1_MISSIONS),
        provideMissionContent(PHASE_1_MISSIONS),
      ],
    });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    const svc = TestBed.inject(StoryMissionContentService);

    const content = svc.getMissionContent(1);
    expect(content).toBeDefined();
    expect(content!.chapterId).toBe(1);
  });

  it('should have non-empty steps for every registered mission', () => {
    for (let ch = 1; ch <= 10; ch++) {
      const content = service.getMissionContent(ch);
      expect(content!.steps.length).toBeGreaterThan(0);
    }
  });
});

describe('provideMissionContent — Phase 2', () => {
  let service: StoryMissionContentService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideMissionContent(PHASE_2_MISSIONS)],
    });

    await TestBed.inject(ApplicationInitStatus).donePromise;
    service = TestBed.inject(StoryMissionContentService);
  });

  it('should register all 3 Phase 2 mission content entries at initialization', () => {
    for (let ch = 11; ch <= 13; ch++) {
      expect(service.getMissionContent(ch)).toBeDefined();
    }
  });

  it('should return valid content for each chapter (11-13)', () => {
    for (let ch = 11; ch <= 13; ch++) {
      const content = service.getMissionContent(ch);
      expect(content).toBeDefined();
      expect(content!.chapterId).toBe(ch);
      expect(content!.steps.length).toBeGreaterThan(0);
      expect(content!.completionCriteria).toBeDefined();
    }
  });

  it('should return correct chapterId for getMissionContent(11)', () => {
    const content = service.getMissionContent(11);
    expect(content).toBeDefined();
    expect(content!.chapterId).toBe(11);
  });

  it('should return correct chapterId for getMissionContent(13)', () => {
    const content = service.getMissionContent(13);
    expect(content).toBeDefined();
    expect(content!.chapterId).toBe(13);
  });

  it('should register both Phase 1 and Phase 2 content when both are provided', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideMissionContent(PHASE_1_MISSIONS),
        provideMissionContent(PHASE_2_MISSIONS),
      ],
    });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    const svc = TestBed.inject(StoryMissionContentService);

    for (let ch = 1; ch <= 10; ch++) {
      expect(svc.getMissionContent(ch)).toBeDefined();
    }
    for (let ch = 11; ch <= 13; ch++) {
      expect(svc.getMissionContent(ch)).toBeDefined();
    }
  });
});

describe('provideMissionContent — Phase 3', () => {
  let service: StoryMissionContentService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideMissionContent(PHASE_3_MISSIONS)],
    });

    await TestBed.inject(ApplicationInitStatus).donePromise;
    service = TestBed.inject(StoryMissionContentService);
  });

  it('should register all 4 Phase 3 mission content entries at initialization', () => {
    for (let ch = 14; ch <= 17; ch++) {
      expect(service.getMissionContent(ch)).toBeDefined();
    }
  });

  it('should return valid content for each chapter (14-17)', () => {
    for (let ch = 14; ch <= 17; ch++) {
      const content = service.getMissionContent(ch);
      expect(content).toBeDefined();
      expect(content!.chapterId).toBe(ch);
      expect(content!.steps.length).toBeGreaterThan(0);
      expect(content!.completionCriteria).toBeDefined();
    }
  });

  it('should return correct chapterId for getMissionContent(14)', () => {
    const content = service.getMissionContent(14);
    expect(content).toBeDefined();
    expect(content!.chapterId).toBe(14);
  });

  it('should return correct chapterId for getMissionContent(17)', () => {
    const content = service.getMissionContent(17);
    expect(content).toBeDefined();
    expect(content!.chapterId).toBe(17);
  });

  it('should register Phase 1, Phase 2, and Phase 3 content when all are provided', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideMissionContent(PHASE_1_MISSIONS),
        provideMissionContent(PHASE_2_MISSIONS),
        provideMissionContent(PHASE_3_MISSIONS),
      ],
    });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    const svc = TestBed.inject(StoryMissionContentService);

    for (let ch = 1; ch <= 10; ch++) {
      expect(svc.getMissionContent(ch)).toBeDefined();
    }
    for (let ch = 11; ch <= 13; ch++) {
      expect(svc.getMissionContent(ch)).toBeDefined();
    }
    for (let ch = 14; ch <= 17; ch++) {
      expect(svc.getMissionContent(ch)).toBeDefined();
    }
  });
});

describe('provideMissionContent — Phase 4', () => {
  let service: StoryMissionContentService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideMissionContent(PHASE_4_MISSIONS)],
    });

    await TestBed.inject(ApplicationInitStatus).donePromise;
    service = TestBed.inject(StoryMissionContentService);
  });

  it('should register all 2 Phase 4 mission content entries at initialization', () => {
    for (let ch = 18; ch <= 19; ch++) {
      expect(service.getMissionContent(ch)).toBeDefined();
    }
  });

  it('should return valid content for each chapter (18-19)', () => {
    for (let ch = 18; ch <= 19; ch++) {
      const content = service.getMissionContent(ch);
      expect(content).toBeDefined();
      expect(content!.chapterId).toBe(ch);
      expect(content!.steps.length).toBeGreaterThan(0);
      expect(content!.completionCriteria).toBeDefined();
    }
  });

  it('should return correct chapterId for getMissionContent(18)', () => {
    const content = service.getMissionContent(18);
    expect(content).toBeDefined();
    expect(content!.chapterId).toBe(18);
  });

  it('should return correct chapterId for getMissionContent(19)', () => {
    const content = service.getMissionContent(19);
    expect(content).toBeDefined();
    expect(content!.chapterId).toBe(19);
  });

  it('should register Phase 1 through Phase 4 content when all are provided', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideMissionContent(PHASE_1_MISSIONS),
        provideMissionContent(PHASE_2_MISSIONS),
        provideMissionContent(PHASE_3_MISSIONS),
        provideMissionContent(PHASE_4_MISSIONS),
      ],
    });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    const svc = TestBed.inject(StoryMissionContentService);

    for (let ch = 1; ch <= 10; ch++) {
      expect(svc.getMissionContent(ch)).toBeDefined();
    }
    for (let ch = 11; ch <= 13; ch++) {
      expect(svc.getMissionContent(ch)).toBeDefined();
    }
    for (let ch = 14; ch <= 17; ch++) {
      expect(svc.getMissionContent(ch)).toBeDefined();
    }
    for (let ch = 18; ch <= 19; ch++) {
      expect(svc.getMissionContent(ch)).toBeDefined();
    }
  });
});

describe('provideMissionContent — Phase 5', () => {
  let service: StoryMissionContentService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideMissionContent(PHASE_5_MISSIONS)],
    });

    await TestBed.inject(ApplicationInitStatus).donePromise;
    service = TestBed.inject(StoryMissionContentService);
  });

  it('should register all 3 Phase 5 mission content entries at initialization', () => {
    for (let ch = 20; ch <= 22; ch++) {
      expect(service.getMissionContent(ch)).toBeDefined();
    }
  });

  it('should return valid content for each chapter (20-22)', () => {
    for (let ch = 20; ch <= 22; ch++) {
      const content = service.getMissionContent(ch);
      expect(content).toBeDefined();
      expect(content!.chapterId).toBe(ch);
      expect(content!.steps.length).toBeGreaterThan(0);
      expect(content!.completionCriteria).toBeDefined();
    }
  });

  it('should return correct chapterId for getMissionContent(20)', () => {
    const content = service.getMissionContent(20);
    expect(content).toBeDefined();
    expect(content!.chapterId).toBe(20);
  });

  it('should return correct chapterId for getMissionContent(22)', () => {
    const content = service.getMissionContent(22);
    expect(content).toBeDefined();
    expect(content!.chapterId).toBe(22);
  });

  it('should register Phase 1 through Phase 5 content when all are provided', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideMissionContent(PHASE_1_MISSIONS),
        provideMissionContent(PHASE_2_MISSIONS),
        provideMissionContent(PHASE_3_MISSIONS),
        provideMissionContent(PHASE_4_MISSIONS),
        provideMissionContent(PHASE_5_MISSIONS),
      ],
    });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    const svc = TestBed.inject(StoryMissionContentService);

    for (let ch = 1; ch <= 10; ch++) {
      expect(svc.getMissionContent(ch)).toBeDefined();
    }
    for (let ch = 11; ch <= 13; ch++) {
      expect(svc.getMissionContent(ch)).toBeDefined();
    }
    for (let ch = 14; ch <= 17; ch++) {
      expect(svc.getMissionContent(ch)).toBeDefined();
    }
    for (let ch = 18; ch <= 19; ch++) {
      expect(svc.getMissionContent(ch)).toBeDefined();
    }
    for (let ch = 20; ch <= 22; ch++) {
      expect(svc.getMissionContent(ch)).toBeDefined();
    }
  });
});

describe('provideMissionContent — Phase 6', () => {
  let service: StoryMissionContentService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideMissionContent(PHASE_6_MISSIONS)],
    });

    await TestBed.inject(ApplicationInitStatus).donePromise;
    service = TestBed.inject(StoryMissionContentService);
  });

  it('should register all 4 Phase 6 mission content entries at initialization', () => {
    for (let ch = 23; ch <= 26; ch++) {
      expect(service.getMissionContent(ch)).toBeDefined();
    }
  });

  it('should return valid content for each chapter (23-26)', () => {
    for (let ch = 23; ch <= 26; ch++) {
      const content = service.getMissionContent(ch);
      expect(content).toBeDefined();
      expect(content!.chapterId).toBe(ch);
      expect(content!.steps.length).toBeGreaterThan(0);
      expect(content!.completionCriteria).toBeDefined();
    }
  });

  it('should return correct chapterId for getMissionContent(23)', () => {
    const content = service.getMissionContent(23);
    expect(content).toBeDefined();
    expect(content!.chapterId).toBe(23);
  });

  it('should return correct chapterId for getMissionContent(26)', () => {
    const content = service.getMissionContent(26);
    expect(content).toBeDefined();
    expect(content!.chapterId).toBe(26);
  });

  it('should register Phase 1 through Phase 6 content when all are provided', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideMissionContent(PHASE_1_MISSIONS),
        provideMissionContent(PHASE_2_MISSIONS),
        provideMissionContent(PHASE_3_MISSIONS),
        provideMissionContent(PHASE_4_MISSIONS),
        provideMissionContent(PHASE_5_MISSIONS),
        provideMissionContent(PHASE_6_MISSIONS),
      ],
    });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    const svc = TestBed.inject(StoryMissionContentService);

    for (let ch = 1; ch <= 10; ch++) {
      expect(svc.getMissionContent(ch)).toBeDefined();
    }
    for (let ch = 11; ch <= 13; ch++) {
      expect(svc.getMissionContent(ch)).toBeDefined();
    }
    for (let ch = 14; ch <= 17; ch++) {
      expect(svc.getMissionContent(ch)).toBeDefined();
    }
    for (let ch = 18; ch <= 19; ch++) {
      expect(svc.getMissionContent(ch)).toBeDefined();
    }
    for (let ch = 20; ch <= 22; ch++) {
      expect(svc.getMissionContent(ch)).toBeDefined();
    }
    for (let ch = 23; ch <= 26; ch++) {
      expect(svc.getMissionContent(ch)).toBeDefined();
    }
  });
});
