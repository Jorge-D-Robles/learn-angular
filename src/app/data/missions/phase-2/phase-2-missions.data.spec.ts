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
import { PHASE_2_MISSIONS } from './index';

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
  chapterId: 11,
  steps: [_narrative, _codeExample, _concept],
  completionCriteria: _criteria,
};

const _step: MissionStep = _narrative;

void [_narrative, _codeExample, _codeExampleWithHighlight, _concept, _criteria, _mission, _step];

// --- Runtime tests ---

describe('PHASE_2_MISSIONS structure', () => {
  it('should have exactly 3 entries', () => {
    expect(PHASE_2_MISSIONS.length).toBe(3);
  });

  it('should have sequential chapter IDs from 11 to 13', () => {
    const ids = PHASE_2_MISSIONS.map(m => m.chapterId);
    expect(ids).toEqual([11, 12, 13]);
  });

  it('should have no duplicate chapter IDs', () => {
    const ids = PHASE_2_MISSIONS.map(m => m.chapterId);
    expect(new Set(ids).size).toBe(3);
  });

  it('should have each chapterId match a Phase 2 chapter in CURRICULUM', () => {
    const phase2 = CURRICULUM[1];
    const curriculumIds = new Set(phase2.chapters.map(c => c.chapterId));
    for (const mission of PHASE_2_MISSIONS) {
      expect(curriculumIds.has(mission.chapterId)).toBe(true);
    }
  });

  it('should have 3-7 steps per mission', () => {
    for (const mission of PHASE_2_MISSIONS) {
      expect(mission.steps.length).toBeGreaterThanOrEqual(3);
      expect(mission.steps.length).toBeLessThanOrEqual(7);
    }
  });

  it('should have a non-empty narrativeText for every step', () => {
    for (const mission of PHASE_2_MISSIONS) {
      for (const step of mission.steps) {
        if ('narrativeText' in step) {
          expect(step.narrativeText.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('should have a valid stepType for every step', () => {
    const validTypes = new Set(['narrative', 'code-example', 'concept', 'code-challenge']);
    for (const mission of PHASE_2_MISSIONS) {
      for (const step of mission.steps) {
        expect(validTypes.has(step.stepType)).toBe(true);
      }
    }
  });

  it('should have completionCriteria.minStepsViewed equal to steps.length for each mission', () => {
    for (const mission of PHASE_2_MISSIONS) {
      expect(mission.completionCriteria.minStepsViewed).toBe(mission.steps.length);
    }
  });
});

describe('Content-type-specific validation', () => {
  it('should have non-empty code and explanation for all code-example steps', () => {
    for (const mission of PHASE_2_MISSIONS) {
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
    for (const mission of PHASE_2_MISSIONS) {
      for (const step of mission.steps) {
        if (step.stepType === 'code-example') {
          expect(validLanguages.has(step.language)).toBe(true);
        }
      }
    }
  });

  it('should have non-empty conceptTitle and conceptBody for all concept steps', () => {
    for (const mission of PHASE_2_MISSIONS) {
      for (const step of mission.steps) {
        if (step.stepType === 'concept') {
          expect(step.conceptTitle.length).toBeGreaterThan(0);
          expect(step.conceptBody.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('should have at least 2 key points when keyPoints is present on concept steps', () => {
    for (const mission of PHASE_2_MISSIONS) {
      for (const step of mission.steps) {
        if (step.stepType === 'concept' && step.keyPoints) {
          expect(step.keyPoints.length).toBeGreaterThanOrEqual(2);
        }
      }
    }
  });
});

describe('Cross-reference validation', () => {
  it('should have all 3 chapter IDs match Phase 2 chapters from CURRICULUM', () => {
    const phase2Ids = CURRICULUM[1].chapters.map(c => c.chapterId);
    const missionIds = PHASE_2_MISSIONS.map(m => m.chapterId);
    expect(missionIds).toEqual(phase2Ids);
  });

  it('should have total step count between 12 and 18', () => {
    const totalSteps = PHASE_2_MISSIONS.reduce((sum, m) => sum + m.steps.length, 0);
    expect(totalSteps).toBeGreaterThanOrEqual(12);
    expect(totalSteps).toBeLessThanOrEqual(18);
  });
});

describe('Code-challenge validation', () => {
  const challengeSteps: { chapterId: number; step: CodeChallengeStep }[] = [];

  beforeAll(() => {
    for (const mission of PHASE_2_MISSIONS) {
      for (const step of mission.steps) {
        if (step.stepType === 'code-challenge') {
          challengeSteps.push({ chapterId: mission.chapterId, step });
        }
      }
    }
  });

  it('should have code-challenge steps for chapters 11-13', () => {
    for (let ch = 11; ch <= 13; ch++) {
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

  it('should have Ch 13 with two code-challenge steps', () => {
    const ch13Challenges = challengeSteps.filter(c => c.chapterId === 13);
    expect(ch13Challenges.length).toBe(2);
  });

  it('should have code-challenge for Ch 11 that validates provideRouter', () => {
    const ch11Challenge = challengeSteps.find(c => c.chapterId === 11)!;
    const hasProvideRouterRule = ch11Challenge.step.validationRules.some(
      r => (r.type === 'contains' && r.value === 'provideRouter') ||
           (r.type === 'pattern' && r.pattern.includes('provideRouter')),
    );
    expect(hasProvideRouterRule).toBe(true);
  });

  it('should have code-challenge for Ch 12 that validates route parameters and wildcards', () => {
    const ch12Challenge = challengeSteps.find(c => c.chapterId === 12)!;
    const hasParamRule = ch12Challenge.step.validationRules.some(
      r => (r.type === 'pattern' && r.pattern.includes(':')) ||
           (r.type === 'contains' && r.value.includes(':')),
    );
    const hasWildcardRule = ch12Challenge.step.validationRules.some(
      r => (r.type === 'contains' && r.value === '**') ||
           (r.type === 'pattern' && r.pattern.includes('\\*\\*')),
    );
    expect(hasParamRule).toBe(true);
    expect(hasWildcardRule).toBe(true);
  });

  it('should have code-challenge for Ch 13 that validates routerLink', () => {
    const ch13Challenges = challengeSteps.filter(c => c.chapterId === 13);
    const hasRouterLinkChallenge = ch13Challenges.some(c =>
      c.step.validationRules.some(
        r => r.type === 'contains' && r.value === 'routerLink',
      ),
    );
    expect(hasRouterLinkChallenge).toBe(true);
  });

  it('should have code-challenge for Ch 13 that validates Router.navigate', () => {
    const ch13Challenges = challengeSteps.filter(c => c.chapterId === 13);
    const hasNavigateChallenge = ch13Challenges.some(c =>
      c.step.validationRules.some(
        r => r.type === 'pattern' && r.pattern.includes('.navigate'),
      ),
    );
    expect(hasNavigateChallenge).toBe(true);
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
  it('should have Ch 11 with a step containing router-outlet in its code', () => {
    const ch11 = PHASE_2_MISSIONS.find(m => m.chapterId === 11)!;
    const hasRouterOutlet = ch11.steps.some(
      s => s.stepType === 'code-example' && s.code.includes('router-outlet'),
    );
    expect(hasRouterOutlet).toBe(true);
  });

  it('should have Ch 12 with a step containing ** (wildcard) in its code', () => {
    const ch12 = PHASE_2_MISSIONS.find(m => m.chapterId === 12)!;
    const hasWildcard = ch12.steps.some(
      s => s.stepType === 'code-example' && s.code.includes('**'),
    );
    expect(hasWildcard).toBe(true);
  });

  it('should have Ch 13 with a step containing routerLink in its code', () => {
    const ch13 = PHASE_2_MISSIONS.find(m => m.chapterId === 13)!;
    const hasRouterLink = ch13.steps.some(
      s => s.stepType === 'code-example' && s.code.includes('routerLink'),
    );
    expect(hasRouterLink).toBe(true);
  });
});
