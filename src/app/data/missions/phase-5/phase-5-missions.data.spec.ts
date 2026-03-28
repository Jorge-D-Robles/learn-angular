import { CURRICULUM } from '../../../core/curriculum';
import type {
  StoryMissionContent,
  MissionStep,
  NarrativeStep,
  CodeExampleStep,
  ConceptStep,
  CompletionCriteria,
} from '../../../core/curriculum';
import { PHASE_5_MISSIONS } from './index';

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
  chapterId: 20,
  steps: [_narrative, _codeExample, _concept],
  completionCriteria: _criteria,
};

const _step: MissionStep = _narrative;

void [_narrative, _codeExample, _codeExampleWithHighlight, _concept, _criteria, _mission, _step];

// --- Runtime tests ---

describe('PHASE_5_MISSIONS structure', () => {
  it('should have exactly 3 entries', () => {
    expect(PHASE_5_MISSIONS.length).toBe(3);
  });

  it('should have sequential chapter IDs from 20 to 22', () => {
    const ids = PHASE_5_MISSIONS.map(m => m.chapterId);
    expect(ids).toEqual([20, 21, 22]);
  });

  it('should have no duplicate chapter IDs', () => {
    const ids = PHASE_5_MISSIONS.map(m => m.chapterId);
    expect(new Set(ids).size).toBe(3);
  });

  it('should have each chapterId match a Phase 5 chapter in CURRICULUM', () => {
    const phase5 = CURRICULUM[4];
    const curriculumIds = new Set(phase5.chapters.map(c => c.chapterId));
    for (const mission of PHASE_5_MISSIONS) {
      expect(curriculumIds.has(mission.chapterId)).toBe(true);
    }
  });

  it('should have 3-5 steps per mission', () => {
    for (const mission of PHASE_5_MISSIONS) {
      expect(mission.steps.length).toBeGreaterThanOrEqual(3);
      expect(mission.steps.length).toBeLessThanOrEqual(5);
    }
  });

  it('should have a non-empty narrativeText for every step', () => {
    for (const mission of PHASE_5_MISSIONS) {
      for (const step of mission.steps) {
        if ('narrativeText' in step) {
          expect(step.narrativeText.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('should have a valid stepType for every step', () => {
    const validTypes = new Set(['narrative', 'code-example', 'concept']);
    for (const mission of PHASE_5_MISSIONS) {
      for (const step of mission.steps) {
        expect(validTypes.has(step.stepType)).toBe(true);
      }
    }
  });

  it('should have completionCriteria.minStepsViewed equal to steps.length for each mission', () => {
    for (const mission of PHASE_5_MISSIONS) {
      expect(mission.completionCriteria.minStepsViewed).toBe(mission.steps.length);
    }
  });
});

describe('Content-type-specific validation', () => {
  it('should have non-empty code and explanation for all code-example steps', () => {
    for (const mission of PHASE_5_MISSIONS) {
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
    for (const mission of PHASE_5_MISSIONS) {
      for (const step of mission.steps) {
        if (step.stepType === 'code-example') {
          expect(validLanguages.has(step.language)).toBe(true);
        }
      }
    }
  });

  it('should have non-empty conceptTitle and conceptBody for all concept steps', () => {
    for (const mission of PHASE_5_MISSIONS) {
      for (const step of mission.steps) {
        if (step.stepType === 'concept') {
          expect(step.conceptTitle.length).toBeGreaterThan(0);
          expect(step.conceptBody.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('should have at least 2 key points when keyPoints is present on concept steps', () => {
    for (const mission of PHASE_5_MISSIONS) {
      for (const step of mission.steps) {
        if (step.stepType === 'concept' && step.keyPoints) {
          expect(step.keyPoints.length).toBeGreaterThanOrEqual(2);
        }
      }
    }
  });
});

describe('Cross-reference validation', () => {
  it('should have all 3 chapter IDs match Phase 5 chapters from CURRICULUM', () => {
    const phase5Ids = CURRICULUM[4].chapters.map(c => c.chapterId);
    const missionIds = PHASE_5_MISSIONS.map(m => m.chapterId);
    expect(missionIds).toEqual(phase5Ids);
  });

  it('should have total step count between 9 and 15', () => {
    const totalSteps = PHASE_5_MISSIONS.reduce((sum, m) => sum + m.steps.length, 0);
    expect(totalSteps).toBeGreaterThanOrEqual(9);
    expect(totalSteps).toBeLessThanOrEqual(15);
  });
});

describe('Spot checks', () => {
  it('should have Ch 20 with a step containing DatePipe or | date in its code', () => {
    const ch20 = PHASE_5_MISSIONS.find(m => m.chapterId === 20)!;
    const hasPipe = ch20.steps.some(
      s =>
        s.stepType === 'code-example' &&
        (s.code.includes('DatePipe') || s.code.includes('| date')),
    );
    expect(hasPipe).toBe(true);
  });

  it('should have Ch 21 with a step containing AsyncPipe or | async in its code', () => {
    const ch21 = PHASE_5_MISSIONS.find(m => m.chapterId === 21)!;
    const hasPipe = ch21.steps.some(
      s =>
        s.stepType === 'code-example' &&
        (s.code.includes('AsyncPipe') || s.code.includes('| async')),
    );
    expect(hasPipe).toBe(true);
  });

  it('should have Ch 22 with a step containing @Pipe in its code', () => {
    const ch22 = PHASE_5_MISSIONS.find(m => m.chapterId === 22)!;
    const hasPipe = ch22.steps.some(
      s => s.stepType === 'code-example' && s.code.includes('@Pipe'),
    );
    expect(hasPipe).toBe(true);
  });
});
