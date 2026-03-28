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

  it('should have 3-7 steps per mission', () => {
    for (const mission of PHASE_4_MISSIONS) {
      expect(mission.steps.length).toBeGreaterThanOrEqual(3);
      expect(mission.steps.length).toBeLessThanOrEqual(7);
    }
  });

  it('should have a non-empty narrativeText for every step', () => {
    for (const mission of PHASE_4_MISSIONS) {
      for (const step of mission.steps) {
        if ('narrativeText' in step) {
          expect(step.narrativeText.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('should have a valid stepType for every step', () => {
    const validTypes = new Set(['narrative', 'code-example', 'concept', 'code-challenge']);
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

  it('should have total step count between 11 and 14', () => {
    const totalSteps = PHASE_4_MISSIONS.reduce((sum, m) => sum + m.steps.length, 0);
    expect(totalSteps).toBeGreaterThanOrEqual(11);
    expect(totalSteps).toBeLessThanOrEqual(14);
  });
});

describe('Code-challenge validation', () => {
  const challengeSteps: { chapterId: number; step: CodeChallengeStep }[] = [];

  beforeAll(() => {
    for (const mission of PHASE_4_MISSIONS) {
      for (const step of mission.steps) {
        if (step.stepType === 'code-challenge') {
          challengeSteps.push({ chapterId: mission.chapterId, step });
        }
      }
    }
  });

  it('should have code-challenge steps for chapters 18-19', () => {
    for (let ch = 18; ch <= 19; ch++) {
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

  it('should have Ch 18 with a challenge that validates @Injectable', () => {
    const ch18Challenges = challengeSteps.filter(c => c.chapterId === 18);
    const hasInjectableRule = ch18Challenges.some(c =>
      c.step.validationRules.some(
        r => (r.type === 'contains' && r.value === '@Injectable') ||
             (r.type === 'pattern' && r.pattern.includes('@Injectable')),
      ),
    );
    expect(hasInjectableRule).toBe(true);
  });

  it('should have Ch 19 with a challenge that validates providers:', () => {
    const ch19Challenges = challengeSteps.filter(c => c.chapterId === 19);
    const hasProvidersRule = ch19Challenges.some(c =>
      c.step.validationRules.some(
        r => (r.type === 'contains' && r.value.includes('providers')) ||
             (r.type === 'pattern' && r.pattern.includes('providers')),
      ),
    );
    expect(hasProvidersRule).toBe(true);
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
