import { CURRICULUM } from '../../../core/curriculum';
import type {
  StoryMissionContent,
  MissionStep,
  NarrativeStep,
  CodeExampleStep,
  ConceptStep,
  CompletionCriteria,
} from '../../../core/curriculum';
import { PHASE_7_MISSIONS } from './index';

// --- Compile-time type checks ---

const _narrative: NarrativeStep = {
  stepType: 'narrative',
  narrativeText: 'test',
};

const _codeExample: CodeExampleStep = {
  stepType: 'code-example',
  narrativeText: 'test',
  code: 'const x = 1;',
  language: 'typescript',
  explanation: 'test explanation',
};

const _codeExampleWithHighlight: CodeExampleStep = {
  stepType: 'code-example',
  narrativeText: 'test',
  code: 'const x = 1;',
  language: 'typescript',
  highlightLines: [1, 2],
  explanation: 'test explanation',
};

const _concept: ConceptStep = {
  stepType: 'concept',
  narrativeText: 'test',
  conceptTitle: 'Test Title',
  conceptBody: 'Test body',
  keyPoints: ['point 1', 'point 2'],
};

const _criteria: CompletionCriteria = {
  description: 'test',
  minStepsViewed: 3,
};

const _mission: StoryMissionContent = {
  chapterId: 27,
  steps: [_narrative, _codeExample, _concept],
  completionCriteria: _criteria,
};

const _step: MissionStep = _narrative;

void [_narrative, _codeExample, _codeExampleWithHighlight, _concept, _criteria, _mission, _step];

// --- Runtime tests ---

describe('PHASE_7_MISSIONS structure', () => {
  it('should have exactly 8 entries', () => {
    expect(PHASE_7_MISSIONS.length).toBe(8);
  });

  it('should have sequential chapter IDs from 27 to 34', () => {
    const ids = PHASE_7_MISSIONS.map(m => m.chapterId);
    expect(ids).toEqual([27, 28, 29, 30, 31, 32, 33, 34]);
  });

  it('should have no duplicate chapter IDs', () => {
    const ids = PHASE_7_MISSIONS.map(m => m.chapterId);
    expect(new Set(ids).size).toBe(8);
  });

  it('should have each chapterId match a Phase 6 chapter in CURRICULUM', () => {
    const phase6 = CURRICULUM[5];
    const curriculumIds = new Set(phase6.chapters.map(c => c.chapterId));
    for (const mission of PHASE_7_MISSIONS) {
      expect(curriculumIds.has(mission.chapterId)).toBe(true);
    }
  });

  it('should have 3-5 steps per mission', () => {
    for (const mission of PHASE_7_MISSIONS) {
      expect(mission.steps.length).toBeGreaterThanOrEqual(3);
      expect(mission.steps.length).toBeLessThanOrEqual(5);
    }
  });

  it('should have a non-empty narrativeText for every step', () => {
    for (const mission of PHASE_7_MISSIONS) {
      for (const step of mission.steps) {
        expect(step.narrativeText.length).toBeGreaterThan(0);
      }
    }
  });

  it('should have a valid stepType for every step', () => {
    const validTypes = new Set(['narrative', 'code-example', 'concept']);
    for (const mission of PHASE_7_MISSIONS) {
      for (const step of mission.steps) {
        expect(validTypes.has(step.stepType)).toBe(true);
      }
    }
  });

  it('should have completionCriteria.minStepsViewed equal to steps.length for each mission', () => {
    for (const mission of PHASE_7_MISSIONS) {
      expect(mission.completionCriteria.minStepsViewed).toBe(mission.steps.length);
    }
  });
});

describe('Content-type-specific validation', () => {
  it('should have non-empty code and explanation for all code-example steps', () => {
    for (const mission of PHASE_7_MISSIONS) {
      for (const step of mission.steps) {
        if (step.stepType === 'code-example') {
          expect(step.code.length).toBeGreaterThan(0);
          expect(step.explanation.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('should have language set to a valid value for all code-example steps', () => {
    const validLanguages = new Set(['typescript', 'html', 'angular-template']);
    for (const mission of PHASE_7_MISSIONS) {
      for (const step of mission.steps) {
        if (step.stepType === 'code-example') {
          expect(validLanguages.has(step.language)).toBe(true);
        }
      }
    }
  });

  it('should have non-empty conceptTitle and conceptBody for all concept steps', () => {
    for (const mission of PHASE_7_MISSIONS) {
      for (const step of mission.steps) {
        if (step.stepType === 'concept') {
          expect(step.conceptTitle.length).toBeGreaterThan(0);
          expect(step.conceptBody.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('should have at least 2 key points when keyPoints is present on concept steps', () => {
    for (const mission of PHASE_7_MISSIONS) {
      for (const step of mission.steps) {
        if (step.stepType === 'concept' && step.keyPoints) {
          expect(step.keyPoints.length).toBeGreaterThanOrEqual(2);
        }
      }
    }
  });
});

describe('Cross-reference validation', () => {
  it('should have all 8 chapter IDs match the last 8 Phase 6 chapters from CURRICULUM', () => {
    const phase6Ids = CURRICULUM[5].chapters.slice(4).map(c => c.chapterId);
    const missionIds = PHASE_7_MISSIONS.map(m => m.chapterId);
    expect(missionIds).toEqual(phase6Ids);
  });

  it('should have total step count between 24 and 40', () => {
    const totalSteps = PHASE_7_MISSIONS.reduce((sum, m) => sum + m.steps.length, 0);
    expect(totalSteps).toBeGreaterThanOrEqual(24);
    expect(totalSteps).toBeLessThanOrEqual(40);
  });
});

describe('Spot checks', () => {
  it('should have Ch 27 with a step containing ng-content in its code', () => {
    const ch27 = PHASE_7_MISSIONS.find(m => m.chapterId === 27)!;
    const hasContent = ch27.steps.some(
      s =>
        s.stepType === 'code-example' &&
        s.code.includes('ng-content'),
    );
    expect(hasContent).toBe(true);
  });

  it('should have Ch 28 with a step containing ngOnInit or OnInit in its code', () => {
    const ch28 = PHASE_7_MISSIONS.find(m => m.chapterId === 28)!;
    const hasLifecycle = ch28.steps.some(
      s =>
        s.stepType === 'code-example' &&
        (s.code.includes('ngOnInit') || s.code.includes('OnInit')),
    );
    expect(hasLifecycle).toBe(true);
  });

  it('should have Ch 29 with a step containing @Directive or Directive in its code', () => {
    const ch29 = PHASE_7_MISSIONS.find(m => m.chapterId === 29)!;
    const hasDirective = ch29.steps.some(
      s =>
        s.stepType === 'code-example' &&
        (s.code.includes('@Directive') || s.code.includes('Directive')),
    );
    expect(hasDirective).toBe(true);
  });

  it('should have Ch 30 with a step containing HttpClient or httpClient in its code', () => {
    const ch30 = PHASE_7_MISSIONS.find(m => m.chapterId === 30)!;
    const hasHttp = ch30.steps.some(
      s =>
        s.stepType === 'code-example' &&
        (s.code.includes('HttpClient') || s.code.includes('httpClient')),
    );
    expect(hasHttp).toBe(true);
  });
});
