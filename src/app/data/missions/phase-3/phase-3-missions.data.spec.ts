import { CURRICULUM } from '../../../core/curriculum';
import type {
  StoryMissionContent,
  MissionStep,
  NarrativeStep,
  CodeExampleStep,
  ConceptStep,
  CodeChallengeStep,
  CompletionCriteria,
} from '../../../core/curriculum';
import { CodeChallengeValidationService } from '../../../core/curriculum';
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

  it('should have 3-7 steps per mission', () => {
    for (const mission of PHASE_3_MISSIONS) {
      expect(mission.steps.length).toBeGreaterThanOrEqual(3);
      expect(mission.steps.length).toBeLessThanOrEqual(7);
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
    const validTypes = new Set(['narrative', 'code-example', 'concept', 'code-challenge']);
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

  it('should have total step count between 20 and 28', () => {
    const totalSteps = PHASE_3_MISSIONS.reduce((sum, m) => sum + m.steps.length, 0);
    expect(totalSteps).toBeGreaterThanOrEqual(20);
    expect(totalSteps).toBeLessThanOrEqual(28);
  });
});

describe('Code-challenge validation', () => {
  const challengeSteps: { chapterId: number; step: CodeChallengeStep }[] = [];

  beforeAll(() => {
    for (const mission of PHASE_3_MISSIONS) {
      for (const step of mission.steps) {
        if (step.stepType === 'code-challenge') {
          challengeSteps.push({ chapterId: mission.chapterId, step });
        }
      }
    }
  });

  it('should have code-challenge steps for chapters 14-17', () => {
    for (let ch = 14; ch <= 17; ch++) {
      const hasCh = challengeSteps.some(c => c.chapterId === ch);
      expect(hasCh, `Chapter ${ch} should have a code-challenge step`).toBe(true);
    }
  });

  it('should have valid code-challenge fields for all code-challenge steps', () => {
    expect(challengeSteps.length).toBeGreaterThan(0);
    for (const { step } of challengeSteps) {
      expect(step.prompt.length).toBeGreaterThan(0);
      expect(step.starterCode.length).toBeGreaterThan(0);
      expect(['typescript', 'html']).toContain(step.language);
      expect(step.validationRules.length).toBeGreaterThanOrEqual(3);
      expect(step.validationRules.length).toBeLessThanOrEqual(6);
      expect(step.successMessage.length).toBeGreaterThan(0);
      expect(step.explanation.length).toBeGreaterThan(0);
    }
  });

  it('should have hints for all code-challenge steps', () => {
    for (const { step } of challengeSteps) {
      expect(step.hints).toBeDefined();
      expect(step.hints!.length).toBeGreaterThanOrEqual(1);
      expect(step.hints!.length).toBeLessThanOrEqual(2);
      for (const hint of step.hints!) {
        expect(hint.length).toBeGreaterThan(0);
      }
    }
  });

  it('should have starterCode that contains TODO markers', () => {
    for (const { step } of challengeSteps) {
      expect(step.starterCode).toContain('TODO');
    }
  });

  it('should have validation rules with non-empty errorMessage', () => {
    for (const { step } of challengeSteps) {
      for (const rule of step.validationRules) {
        expect(rule.errorMessage.length).toBeGreaterThan(0);
      }
    }
  });

  it('should have Ch 16 with two code-challenge steps', () => {
    const ch16Challenges = challengeSteps.filter(c => c.chapterId === 16);
    expect(ch16Challenges.length).toBe(2);
  });

  it('should have Ch 17 with two code-challenge steps', () => {
    const ch17Challenges = challengeSteps.filter(c => c.chapterId === 17);
    expect(ch17Challenges.length).toBe(2);
  });

  it('should have code-challenge for Ch 14 that validates ngModel', () => {
    const ch14Challenge = challengeSteps.find(c => c.chapterId === 14)!;
    const hasNgModelRule = ch14Challenge.step.validationRules.some(
      r => (r.type === 'contains' && r.value === 'ngModel') ||
           (r.type === 'pattern' && r.pattern.includes('ngModel')),
    );
    expect(hasNgModelRule).toBe(true);
  });

  it('should have code-challenge for Ch 15 that validates ngModelChange', () => {
    const ch15Challenge = challengeSteps.find(c => c.chapterId === 15)!;
    const hasNgModelChangeRule = ch15Challenge.step.validationRules.some(
      r => (r.type === 'contains' && r.value.includes('ngModelChange')) ||
           (r.type === 'pattern' && r.pattern.includes('ngModelChange')),
    );
    expect(hasNgModelChangeRule).toBe(true);
  });

  it('should have code-challenge for Ch 16 that validates FormBuilder.group', () => {
    const ch16Challenges = challengeSteps.filter(c => c.chapterId === 16);
    const hasFbGroupChallenge = ch16Challenges.some(c =>
      c.step.validationRules.some(
        r => r.type === 'contains' && r.value === 'fb.group',
      ),
    );
    expect(hasFbGroupChallenge).toBe(true);
  });

  it('should have code-challenge for Ch 17 that validates ValidatorFn', () => {
    const ch17Challenges = challengeSteps.filter(c => c.chapterId === 17);
    const hasValidatorFnChallenge = ch17Challenges.some(c =>
      c.step.validationRules.some(
        r => r.type === 'contains' && r.value === ': ValidatorFn',
      ),
    );
    expect(hasValidatorFnChallenge).toBe(true);
  });

  it('should have starterCode that does NOT pass its own validationRules', () => {
    const service = new CodeChallengeValidationService();
    for (const { chapterId, step } of challengeSteps) {
      const result = service.validateCode(step.starterCode, step.validationRules);
      expect(result.valid, `Ch ${chapterId} starter code should NOT pass validation`).toBe(false);
    }
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
