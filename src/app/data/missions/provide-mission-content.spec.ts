/**
 * Tests for provideMissionContent() — registers StoryMissionContent[]
 * with StoryMissionContentService during app initialization via
 * provideAppInitializer.
 */
import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StoryMissionContentService } from '../../core/curriculum';
import { PHASE_1_MISSIONS } from './phase-1';
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
