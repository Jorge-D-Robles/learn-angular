import { CURRICULUM } from '../../../core/curriculum';
import type {
  StoryMissionContent,
  MissionStep,
  NarrativeStep,
  CodeExampleStep,
  ConceptStep,
  CompletionCriteria,
} from '../../../core/curriculum';
import { PHASE_3_MISSIONS } from './index';

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
  chapterId: 14,
  steps: [_narrative, _codeExample, _concept],
  completionCriteria: _criteria,
};

const _step: MissionStep = _narrative;

void [_narrative, _codeExample, _codeExampleWithHighlight, _concept, _criteria, _mission, _step];

// --- Runtime tests ---

describe('PHASE_3_MISSIONS structure', () => {
  it('should have exactly 4 entries', () => {
    expect(PHASE_3_MISSIONS.length).toBe(4);
  });

  it('should have sequential chapter IDs from 14 to 17', () => {
    const ids = PHASE_3_MISSIONS.map(m => m.chapterId);
    expect(ids).toEqual([14, 15, 16, 17]);
  });

  it('should have no duplicate chapter IDs', () => {
    const ids = PHASE_3_MISSIONS.map(m => m.chapterId);
    expect(new Set(ids).size).toBe(4);
  });

  it('should have each chapterId match a Phase 3 chapter in CURRICULUM', () => {
    const phase3 = CURRICULUM[2];
    const curriculumIds = new Set(phase3.chapters.map(c => c.chapterId));
    for (const mission of PHASE_3_MISSIONS) {
      expect(curriculumIds.has(mission.chapterId)).toBe(true);
    }
  });

  it('should have 3-5 steps per mission', () => {
    for (const mission of PHASE_3_MISSIONS) {
      expect(mission.steps.length).toBeGreaterThanOrEqual(3);
      expect(mission.steps.length).toBeLessThanOrEqual(5);
    }
  });

  it('should have a non-empty narrativeText for every step', () => {
    for (const mission of PHASE_3_MISSIONS) {
      for (const step of mission.steps) {
        if ('narrativeText' in step) {
          expect(step.narrativeText.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('should have a valid stepType for every step', () => {
    const validTypes = new Set(['narrative', 'code-example', 'concept']);
    for (const mission of PHASE_3_MISSIONS) {
      for (const step of mission.steps) {
        expect(validTypes.has(step.stepType)).toBe(true);
      }
    }
  });

  it('should have completionCriteria.minStepsViewed equal to steps.length for each mission', () => {
    for (const mission of PHASE_3_MISSIONS) {
      expect(mission.completionCriteria.minStepsViewed).toBe(mission.steps.length);
    }
  });
});

describe('Content-type-specific validation', () => {
  it('should have non-empty code and explanation for all code-example steps', () => {
    for (const mission of PHASE_3_MISSIONS) {
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
    for (const mission of PHASE_3_MISSIONS) {
      for (const step of mission.steps) {
        if (step.stepType === 'code-example') {
          expect(validLanguages.has(step.language)).toBe(true);
        }
      }
    }
  });

  it('should have non-empty conceptTitle and conceptBody for all concept steps', () => {
    for (const mission of PHASE_3_MISSIONS) {
      for (const step of mission.steps) {
        if (step.stepType === 'concept') {
          expect(step.conceptTitle.length).toBeGreaterThan(0);
          expect(step.conceptBody.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('should have at least 2 key points when keyPoints is present on concept steps', () => {
    for (const mission of PHASE_3_MISSIONS) {
      for (const step of mission.steps) {
        if (step.stepType === 'concept' && step.keyPoints) {
          expect(step.keyPoints.length).toBeGreaterThanOrEqual(2);
        }
      }
    }
  });
});

describe('Cross-reference validation', () => {
  it('should have all 4 chapter IDs match Phase 3 chapters from CURRICULUM', () => {
    const phase3Ids = CURRICULUM[2].chapters.map(c => c.chapterId);
    const missionIds = PHASE_3_MISSIONS.map(m => m.chapterId);
    expect(missionIds).toEqual(phase3Ids);
  });

  it('should have total step count between 12 and 20', () => {
    const totalSteps = PHASE_3_MISSIONS.reduce((sum, m) => sum + m.steps.length, 0);
    expect(totalSteps).toBeGreaterThanOrEqual(12);
    expect(totalSteps).toBeLessThanOrEqual(20);
  });
});

describe('Spot checks', () => {
  it('should have Ch 14 with a step containing ngModel in its code', () => {
    const ch14 = PHASE_3_MISSIONS.find(m => m.chapterId === 14)!;
    const hasNgModel = ch14.steps.some(
      s => s.stepType === 'code-example' && s.code.includes('ngModel'),
    );
    expect(hasNgModel).toBe(true);
  });

  it('should have Ch 15 with a step containing ngModelChange in its code', () => {
    const ch15 = PHASE_3_MISSIONS.find(m => m.chapterId === 15)!;
    const hasNgModelChange = ch15.steps.some(
      s => s.stepType === 'code-example' && s.code.includes('ngModelChange'),
    );
    expect(hasNgModelChange).toBe(true);
  });

  it('should have Ch 16 with a step containing FormBuilder in its code', () => {
    const ch16 = PHASE_3_MISSIONS.find(m => m.chapterId === 16)!;
    const hasFormBuilder = ch16.steps.some(
      s => s.stepType === 'code-example' && s.code.includes('FormBuilder'),
    );
    expect(hasFormBuilder).toBe(true);
  });

  it('should have Ch 17 with a step containing Validators in its code', () => {
    const ch17 = PHASE_3_MISSIONS.find(m => m.chapterId === 17)!;
    const hasValidators = ch17.steps.some(
      s => s.stepType === 'code-example' && s.code.includes('Validators'),
    );
    expect(hasValidators).toBe(true);
  });
});
