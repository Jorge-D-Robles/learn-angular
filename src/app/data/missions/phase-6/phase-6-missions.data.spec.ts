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
import { PHASE_6_MISSIONS } from './index';

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
  chapterId: 23,
  steps: [_narrative, _codeExample, _concept],
  completionCriteria: _criteria,
};

const _step: MissionStep = _narrative;

void [_narrative, _codeExample, _codeExampleWithHighlight, _concept, _criteria, _mission, _step];

// --- Runtime tests ---

describe('PHASE_6_MISSIONS structure', () => {
  it('should have exactly 4 entries', () => {
    expect(PHASE_6_MISSIONS.length).toBe(4);
  });

  it('should have sequential chapter IDs from 23 to 26', () => {
    const ids = PHASE_6_MISSIONS.map(m => m.chapterId);
    expect(ids).toEqual([23, 24, 25, 26]);
  });

  it('should have no duplicate chapter IDs', () => {
    const ids = PHASE_6_MISSIONS.map(m => m.chapterId);
    expect(new Set(ids).size).toBe(4);
  });

  it('should have each chapterId match a Phase 6 chapter in CURRICULUM', () => {
    const phase6 = CURRICULUM[5];
    const curriculumIds = new Set(phase6.chapters.map(c => c.chapterId));
    for (const mission of PHASE_6_MISSIONS) {
      expect(curriculumIds.has(mission.chapterId)).toBe(true);
    }
  });

  it('should have 3-7 steps per mission', () => {
    for (const mission of PHASE_6_MISSIONS) {
      expect(mission.steps.length).toBeGreaterThanOrEqual(3);
      expect(mission.steps.length).toBeLessThanOrEqual(7);
    }
  });

  it('should have a non-empty narrativeText for every step', () => {
    for (const mission of PHASE_6_MISSIONS) {
      for (const step of mission.steps) {
        if ('narrativeText' in step) {
          expect(step.narrativeText.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('should have a valid stepType for every step', () => {
    const validTypes = new Set(['narrative', 'code-example', 'concept', 'code-challenge']);
    for (const mission of PHASE_6_MISSIONS) {
      for (const step of mission.steps) {
        expect(validTypes.has(step.stepType)).toBe(true);
      }
    }
  });

  it('should have completionCriteria.minStepsViewed equal to steps.length for each mission', () => {
    for (const mission of PHASE_6_MISSIONS) {
      expect(mission.completionCriteria.minStepsViewed).toBe(mission.steps.length);
    }
  });
});

describe('Content-type-specific validation', () => {
  it('should have non-empty code and explanation for all code-example steps', () => {
    for (const mission of PHASE_6_MISSIONS) {
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
    for (const mission of PHASE_6_MISSIONS) {
      for (const step of mission.steps) {
        if (step.stepType === 'code-example') {
          expect(validLanguages.has(step.language)).toBe(true);
        }
      }
    }
  });

  it('should have non-empty conceptTitle and conceptBody for all concept steps', () => {
    for (const mission of PHASE_6_MISSIONS) {
      for (const step of mission.steps) {
        if (step.stepType === 'concept') {
          expect(step.conceptTitle.length).toBeGreaterThan(0);
          expect(step.conceptBody.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('should have at least 2 key points when keyPoints is present on concept steps', () => {
    for (const mission of PHASE_6_MISSIONS) {
      for (const step of mission.steps) {
        if (step.stepType === 'concept' && step.keyPoints) {
          expect(step.keyPoints.length).toBeGreaterThanOrEqual(2);
        }
      }
    }
  });
});

describe('Cross-reference validation', () => {
  it('should have all 4 chapter IDs match the first 4 Phase 6 chapters from CURRICULUM', () => {
    const phase6Ids = CURRICULUM[5].chapters.slice(0, 4).map(c => c.chapterId);
    const missionIds = PHASE_6_MISSIONS.map(m => m.chapterId);
    expect(missionIds).toEqual(phase6Ids);
  });

  it('should have total step count between 20 and 24', () => {
    const totalSteps = PHASE_6_MISSIONS.reduce((sum, m) => sum + m.steps.length, 0);
    expect(totalSteps).toBeGreaterThanOrEqual(20);
    expect(totalSteps).toBeLessThanOrEqual(24);
  });
});

describe('Code-challenge validation', () => {
  const challengeSteps: { chapterId: number; step: CodeChallengeStep }[] = [];

  beforeAll(() => {
    for (const mission of PHASE_6_MISSIONS) {
      for (const step of mission.steps) {
        if (step.stepType === 'code-challenge') {
          challengeSteps.push({ chapterId: mission.chapterId, step });
        }
      }
    }
  });

  it('should have code-challenge steps for chapters 23-26', () => {
    for (let ch = 23; ch <= 26; ch++) {
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

  it('should have Ch 23 with a challenge that validates signal(', () => {
    const ch23Challenges = challengeSteps.filter(c => c.chapterId === 23);
    const hasSignalRule = ch23Challenges.some(c =>
      c.step.validationRules.some(
        r => (r.type === 'contains' && r.value.includes('signal(')) ||
             (r.type === 'pattern' && r.pattern.includes('signal(')),
      ),
    );
    expect(hasSignalRule).toBe(true);
  });

  it('should have Ch 24 with a challenge that validates computed(', () => {
    const ch24Challenges = challengeSteps.filter(c => c.chapterId === 24);
    const hasComputedRule = ch24Challenges.some(c =>
      c.step.validationRules.some(
        r => (r.type === 'contains' && r.value.includes('computed(')) ||
             (r.type === 'pattern' && r.pattern.includes('computed(')),
      ),
    );
    expect(hasComputedRule).toBe(true);
  });

  it('should have Ch 25 with a challenge that validates linkedSignal(', () => {
    const ch25Challenges = challengeSteps.filter(c => c.chapterId === 25);
    const hasLinkedSignalRule = ch25Challenges.some(c =>
      c.step.validationRules.some(
        r => (r.type === 'contains' && r.value.includes('linkedSignal(')) ||
             (r.type === 'pattern' && r.pattern.includes('linkedSignal(')),
      ),
    );
    expect(hasLinkedSignalRule).toBe(true);
  });

  it('should have Ch 26 with a challenge that validates onCleanup', () => {
    const ch26Challenges = challengeSteps.filter(c => c.chapterId === 26);
    const hasOnCleanupRule = ch26Challenges.some(c =>
      c.step.validationRules.some(
        r => (r.type === 'contains' && r.value.includes('onCleanup')) ||
             (r.type === 'pattern' && r.pattern.includes('onCleanup')),
      ),
    );
    expect(hasOnCleanupRule).toBe(true);
  });

  it('should have starterCode that does NOT pass its own validationRules', () => {
    const service = new CodeChallengeValidationService();
    for (const { chapterId, step } of challengeSteps) {
      const result = service.validateCode(step.starterCode, step.validationRules);
      expect(result.valid, `Ch ${chapterId} starter code should NOT pass validation`).toBe(false);
    }
  });

  it('should have notContains rules whose banned string appears in starterCode', () => {
    for (const { chapterId, step } of challengeSteps) {
      for (const rule of step.validationRules) {
        if (rule.type === 'notContains') {
          expect(
            step.starterCode.includes(rule.value),
            `Ch ${chapterId}: notContains rule value "${rule.value}" must appear in starterCode`,
          ).toBe(true);
        }
      }
    }
  });
});

describe('Spot checks', () => {
  it('should have Ch 23 with a step containing signal( in its code', () => {
    const ch23 = PHASE_6_MISSIONS.find(m => m.chapterId === 23)!;
    const hasSignal = ch23.steps.some(
      s =>
        s.stepType === 'code-example' &&
        s.code.includes('signal('),
    );
    expect(hasSignal).toBe(true);
  });

  it('should have Ch 24 with a step containing computed( in its code', () => {
    const ch24 = PHASE_6_MISSIONS.find(m => m.chapterId === 24)!;
    const hasComputed = ch24.steps.some(
      s =>
        s.stepType === 'code-example' &&
        s.code.includes('computed('),
    );
    expect(hasComputed).toBe(true);
  });

  it('should have Ch 25 with a step containing linkedSignal in its code', () => {
    const ch25 = PHASE_6_MISSIONS.find(m => m.chapterId === 25)!;
    const hasLinkedSignal = ch25.steps.some(
      s =>
        s.stepType === 'code-example' &&
        s.code.includes('linkedSignal'),
    );
    expect(hasLinkedSignal).toBe(true);
  });

  it('should have Ch 26 with a step containing effect( in its code', () => {
    const ch26 = PHASE_6_MISSIONS.find(m => m.chapterId === 26)!;
    const hasEffect = ch26.steps.some(
      s =>
        s.stepType === 'code-example' &&
        s.code.includes('effect('),
    );
    expect(hasEffect).toBe(true);
  });
});
