import { CURRICULUM } from '../../../core/curriculum';
import type {
  StoryMissionContent,
  MissionStep,
  NarrativeStep,
  CodeExampleStep,
  ConceptStep,
  CompletionCriteria,
} from '../../../core/curriculum';
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

  it('should have 3-5 steps per mission', () => {
    for (const mission of PHASE_1_MISSIONS) {
      expect(mission.steps.length).toBeGreaterThanOrEqual(3);
      expect(mission.steps.length).toBeLessThanOrEqual(5);
    }
  });

  it('should have a non-empty narrativeText for every step', () => {
    for (const mission of PHASE_1_MISSIONS) {
      for (const step of mission.steps) {
        expect(step.narrativeText.length).toBeGreaterThan(0);
      }
    }
  });

  it('should have a valid stepType for every step', () => {
    const validTypes = new Set(['narrative', 'code-example', 'concept']);
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

  it('should have total step count between 30 and 50', () => {
    const totalSteps = PHASE_1_MISSIONS.reduce((sum, m) => sum + m.steps.length, 0);
    expect(totalSteps).toBeGreaterThanOrEqual(30);
    expect(totalSteps).toBeLessThanOrEqual(50);
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
