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
import { PHASE_1_MISSIONS } from './index';

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
  chapterId: 1,
  steps: [_narrative, _codeExample, _concept],
  completionCriteria: _criteria,
};

const _step: MissionStep = _narrative;

void [_narrative, _codeExample, _codeExampleWithHighlight, _concept, _criteria, _mission, _step];

// --- Runtime tests ---

describe('PHASE_1_MISSIONS structure', () => {
  it('should have exactly 10 entries', () => {
    expect(PHASE_1_MISSIONS.length).toBe(10);
  });

  it('should have sequential chapter IDs from 1 to 10', () => {
    const ids = PHASE_1_MISSIONS.map(m => m.chapterId);
    expect(ids).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('should have no duplicate chapter IDs', () => {
    const ids = PHASE_1_MISSIONS.map(m => m.chapterId);
    expect(new Set(ids).size).toBe(10);
  });

  it('should have each chapterId match a Phase 1 chapter in CURRICULUM', () => {
    const phase1 = CURRICULUM[0];
    const curriculumIds = new Set(phase1.chapters.map(c => c.chapterId));
    for (const mission of PHASE_1_MISSIONS) {
      expect(curriculumIds.has(mission.chapterId)).toBe(true);
    }
  });

  it('should have 3-7 steps per mission', () => {
    for (const mission of PHASE_1_MISSIONS) {
      expect(mission.steps.length).toBeGreaterThanOrEqual(3);
      expect(mission.steps.length).toBeLessThanOrEqual(7);
    }
  });

  it('should have a non-empty narrativeText for every step', () => {
    for (const mission of PHASE_1_MISSIONS) {
      for (const step of mission.steps) {
        if ('narrativeText' in step) {
          expect(step.narrativeText.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('should have a valid stepType for every step', () => {
    const validTypes = new Set(['narrative', 'code-example', 'concept', 'code-challenge']);
    for (const mission of PHASE_1_MISSIONS) {
      for (const step of mission.steps) {
        expect(validTypes.has(step.stepType)).toBe(true);
      }
    }
  });

  it('should have completionCriteria.minStepsViewed equal to steps.length for each mission', () => {
    for (const mission of PHASE_1_MISSIONS) {
      expect(mission.completionCriteria.minStepsViewed).toBe(mission.steps.length);
    }
  });
});

describe('Content-type-specific validation', () => {
  it('should have non-empty code and explanation for all code-example steps', () => {
    for (const mission of PHASE_1_MISSIONS) {
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
    for (const mission of PHASE_1_MISSIONS) {
      for (const step of mission.steps) {
        if (step.stepType === 'code-example') {
          expect(validLanguages.has(step.language)).toBe(true);
        }
      }
    }
  });

  it('should have non-empty conceptTitle and conceptBody for all concept steps', () => {
    for (const mission of PHASE_1_MISSIONS) {
      for (const step of mission.steps) {
        if (step.stepType === 'concept') {
          expect(step.conceptTitle.length).toBeGreaterThan(0);
          expect(step.conceptBody.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('should have at least 2 key points when keyPoints is present on concept steps', () => {
    for (const mission of PHASE_1_MISSIONS) {
      for (const step of mission.steps) {
        if (step.stepType === 'concept' && step.keyPoints) {
          expect(step.keyPoints.length).toBeGreaterThanOrEqual(2);
        }
      }
    }
  });
});

describe('Cross-reference validation', () => {
  it('should have all 10 chapter IDs match Phase 1 chapters from CURRICULUM', () => {
    const phase1Ids = CURRICULUM[0].chapters.map(c => c.chapterId);
    const missionIds = PHASE_1_MISSIONS.map(m => m.chapterId);
    expect(missionIds).toEqual(phase1Ids);
  });

  it('should have total step count between 30 and 55', () => {
    const totalSteps = PHASE_1_MISSIONS.reduce((sum, m) => sum + m.steps.length, 0);
    expect(totalSteps).toBeGreaterThanOrEqual(30);
    expect(totalSteps).toBeLessThanOrEqual(55);
  });
});

describe('Code-challenge validation', () => {
  const challengeSteps: { chapterId: number; step: CodeChallengeStep }[] = [];

  beforeAll(() => {
    for (const mission of PHASE_1_MISSIONS) {
      for (const step of mission.steps) {
        if (step.stepType === 'code-challenge') {
          challengeSteps.push({ chapterId: mission.chapterId, step });
        }
      }
    }
  });

  it('should have code-challenge steps for chapters 1-10', () => {
    for (let ch = 1; ch <= 10; ch++) {
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

  it('should have starterCode that contains TODO markers for all code-challenge steps', () => {
    for (const { step } of challengeSteps) {
      expect(step.starterCode).toContain('TODO');
    }
  });

  it('should have validation rules with non-empty errorMessage for all code-challenge steps', () => {
    for (const { step } of challengeSteps) {
      for (const rule of step.validationRules) {
        expect(rule.errorMessage.length).toBeGreaterThan(0);
      }
    }
  });

  it('should have Ch 4 with two code-challenge steps', () => {
    const ch4Challenges = challengeSteps.filter(c => c.chapterId === 4);
    expect(ch4Challenges.length).toBe(2);
  });

  it('should have code-challenge for Ch 1 that validates @Component pattern', () => {
    const ch1Challenge = challengeSteps.find(c => c.chapterId === 1)!;
    const hasComponentRule = ch1Challenge.step.validationRules.some(
      r => (r.type === 'contains' && r.value === '@Component') ||
           (r.type === 'pattern' && r.pattern.includes('@Component')),
    );
    expect(hasComponentRule).toBe(true);
  });

  it('should have code-challenge for Ch 6 that validates event binding', () => {
    const ch6Challenge = challengeSteps.find(c => c.chapterId === 6)!;
    const hasClickRule = ch6Challenge.step.validationRules.some(
      r => r.type === 'pattern' && r.pattern.includes('click'),
    );
    const hasKeyupRule = ch6Challenge.step.validationRules.some(
      r => r.type === 'pattern' && r.pattern.includes('keyup'),
    );
    expect(hasClickRule).toBe(true);
    expect(hasKeyupRule).toBe(true);
  });

  it('should have code-challenge for Ch 8 that validates output() pattern', () => {
    const ch8Challenge = challengeSteps.find(c => c.chapterId === 8)!;
    const hasOutputRule = ch8Challenge.step.validationRules.some(
      r => r.type === 'pattern' && r.pattern.includes('output<'),
    );
    const hasEmitRule = ch8Challenge.step.validationRules.some(
      r => r.type === 'contains' && r.value === '.emit(',
    );
    expect(hasOutputRule).toBe(true);
    expect(hasEmitRule).toBe(true);
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
  it('should have Ch 1 with a step mentioning @Component in its code', () => {
    const ch1 = PHASE_1_MISSIONS.find(m => m.chapterId === 1)!;
    const hasComponent = ch1.steps.some(
      s => s.stepType === 'code-example' && s.code.includes('@Component'),
    );
    expect(hasComponent).toBe(true);
  });

  it('should have Ch 4 with steps covering @if, @for, and @switch', () => {
    const ch4 = PHASE_1_MISSIONS.find(m => m.chapterId === 4)!;
    const codeSteps = ch4.steps.filter(
      (s): s is CodeExampleStep => s.stepType === 'code-example',
    );
    const allCode = codeSteps.map(s => s.code).join('\n');
    expect(allCode).toContain('@if');
    expect(allCode).toContain('@for');
    expect(allCode).toContain('@switch');
  });

  it('should have Ch 7 with a step containing input() or input.required() in its code', () => {
    const ch7 = PHASE_1_MISSIONS.find(m => m.chapterId === 7)!;
    const hasInput = ch7.steps.some(
      s => s.stepType === 'code-example' && (s.code.includes('input()') || s.code.includes('input.required')),
    );
    expect(hasInput).toBe(true);
  });

  it('should have Ch 9 with a step containing @defer in its code', () => {
    const ch9 = PHASE_1_MISSIONS.find(m => m.chapterId === 9)!;
    const hasDefer = ch9.steps.some(
      s => s.stepType === 'code-example' && s.code.includes('@defer'),
    );
    expect(hasDefer).toBe(true);
  });
});
