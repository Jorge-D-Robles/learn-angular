import { CURRICULUM } from '../../../core/curriculum';
import type {
  StoryMissionContent,
  MissionStep,
  NarrativeStep,
  CodeExampleStep,
  ConceptStep,
  CompletionCriteria,
} from '../../../core/curriculum';
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

  it('should have 3-5 steps per mission', () => {
    for (const mission of PHASE_2_MISSIONS) {
      expect(mission.steps.length).toBeGreaterThanOrEqual(3);
      expect(mission.steps.length).toBeLessThanOrEqual(5);
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
    const validTypes = new Set(['narrative', 'code-example', 'concept']);
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

  it('should have total step count between 9 and 15', () => {
    const totalSteps = PHASE_2_MISSIONS.reduce((sum, m) => sum + m.steps.length, 0);
    expect(totalSteps).toBeGreaterThanOrEqual(9);
    expect(totalSteps).toBeLessThanOrEqual(15);
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
