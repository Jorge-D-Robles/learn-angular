import { CURRICULUM } from '../../../core/curriculum';
import type {
  StoryMissionContent,
  MissionStep,
  NarrativeStep,
  CodeExampleStep,
  ConceptStep,
  CompletionCriteria,
} from '../../../core/curriculum';
import { PHASE_4_MISSIONS } from './index';

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
  chapterId: 18,
  steps: [_narrative, _codeExample, _concept],
  completionCriteria: _criteria,
};

const _step: MissionStep = _narrative;

void [_narrative, _codeExample, _codeExampleWithHighlight, _concept, _criteria, _mission, _step];

// --- Runtime tests ---

describe('PHASE_4_MISSIONS structure', () => {
  it('should have exactly 2 entries', () => {
    expect(PHASE_4_MISSIONS.length).toBe(2);
  });

  it('should have sequential chapter IDs from 18 to 19', () => {
    const ids = PHASE_4_MISSIONS.map(m => m.chapterId);
    expect(ids).toEqual([18, 19]);
  });

  it('should have no duplicate chapter IDs', () => {
    const ids = PHASE_4_MISSIONS.map(m => m.chapterId);
    expect(new Set(ids).size).toBe(2);
  });

  it('should have each chapterId match a Phase 4 chapter in CURRICULUM', () => {
    const phase4 = CURRICULUM[3];
    const curriculumIds = new Set(phase4.chapters.map(c => c.chapterId));
    for (const mission of PHASE_4_MISSIONS) {
      expect(curriculumIds.has(mission.chapterId)).toBe(true);
    }
  });

  it('should have 3-5 steps per mission', () => {
    for (const mission of PHASE_4_MISSIONS) {
      expect(mission.steps.length).toBeGreaterThanOrEqual(3);
      expect(mission.steps.length).toBeLessThanOrEqual(5);
    }
  });

  it('should have a non-empty narrativeText for every step', () => {
    for (const mission of PHASE_4_MISSIONS) {
      for (const step of mission.steps) {
        expect(step.narrativeText.length).toBeGreaterThan(0);
      }
    }
  });

  it('should have a valid stepType for every step', () => {
    const validTypes = new Set(['narrative', 'code-example', 'concept']);
    for (const mission of PHASE_4_MISSIONS) {
      for (const step of mission.steps) {
        expect(validTypes.has(step.stepType)).toBe(true);
      }
    }
  });

  it('should have completionCriteria.minStepsViewed equal to steps.length for each mission', () => {
    for (const mission of PHASE_4_MISSIONS) {
      expect(mission.completionCriteria.minStepsViewed).toBe(mission.steps.length);
    }
  });
});

describe('Content-type-specific validation', () => {
  it('should have non-empty code and explanation for all code-example steps', () => {
    for (const mission of PHASE_4_MISSIONS) {
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
    for (const mission of PHASE_4_MISSIONS) {
      for (const step of mission.steps) {
        if (step.stepType === 'code-example') {
          expect(validLanguages.has(step.language)).toBe(true);
        }
      }
    }
  });

  it('should have non-empty conceptTitle and conceptBody for all concept steps', () => {
    for (const mission of PHASE_4_MISSIONS) {
      for (const step of mission.steps) {
        if (step.stepType === 'concept') {
          expect(step.conceptTitle.length).toBeGreaterThan(0);
          expect(step.conceptBody.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('should have at least 2 key points when keyPoints is present on concept steps', () => {
    for (const mission of PHASE_4_MISSIONS) {
      for (const step of mission.steps) {
        if (step.stepType === 'concept' && step.keyPoints) {
          expect(step.keyPoints.length).toBeGreaterThanOrEqual(2);
        }
      }
    }
  });
});

describe('Cross-reference validation', () => {
  it('should have all 2 chapter IDs match Phase 4 chapters from CURRICULUM', () => {
    const phase4Ids = CURRICULUM[3].chapters.map(c => c.chapterId);
    const missionIds = PHASE_4_MISSIONS.map(m => m.chapterId);
    expect(missionIds).toEqual(phase4Ids);
  });

  it('should have total step count between 6 and 10', () => {
    const totalSteps = PHASE_4_MISSIONS.reduce((sum, m) => sum + m.steps.length, 0);
    expect(totalSteps).toBeGreaterThanOrEqual(6);
    expect(totalSteps).toBeLessThanOrEqual(10);
  });
});

describe('Spot checks', () => {
  it('should have Ch 18 with a step containing @Injectable in its code', () => {
    const ch18 = PHASE_4_MISSIONS.find(m => m.chapterId === 18)!;
    const hasInjectable = ch18.steps.some(
      s => s.stepType === 'code-example' && s.code.includes('@Injectable'),
    );
    expect(hasInjectable).toBe(true);
  });

  it('should have Ch 19 with a step containing inject( in its code', () => {
    const ch19 = PHASE_4_MISSIONS.find(m => m.chapterId === 19)!;
    const hasInject = ch19.steps.some(
      s => s.stepType === 'code-example' && s.code.includes('inject('),
    );
    expect(hasInject).toBe(true);
  });
});
