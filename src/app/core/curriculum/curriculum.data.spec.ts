import type { MinigameId } from '../minigame';
import { CURRICULUM, ALL_STORY_MISSIONS } from './curriculum.data';
import type { StoryMission, CurriculumPhase } from './curriculum.types';

/** All 12 valid MinigameId values for validation. */
const ALL_MINIGAME_IDS: MinigameId[] = [
  'module-assembly',
  'wire-protocol',
  'flow-commander',
  'signal-corps',
  'corridor-runner',
  'terminal-hack',
  'power-grid',
  'data-relay',
  'reactor-core',
  'deep-space-radio',
  'system-certification',
  'blast-doors',
];

// --- Compile-time type checks ---

const _mission: StoryMission = {
  chapterId: 1,
  title: 'Test',
  angularTopic: 'Components',
  narrative: 'Test narrative',
  unlocksMinigame: 'module-assembly',
  deps: [],
  phase: 1,
};

const _phase: CurriculumPhase = {
  phaseNumber: 1,
  name: 'Test',
  description: 'Test description',
  chapters: [_mission],
};

void [_mission, _phase];

// --- Runtime tests ---

describe('Chapter count and structure', () => {
  it('should have exactly 34 total chapters', () => {
    expect(ALL_STORY_MISSIONS.length).toBe(34);
  });

  it('should have sequential chapter IDs from 1 to 34', () => {
    const ids = ALL_STORY_MISSIONS.map(m => m.chapterId);
    const expected = Array.from({ length: 34 }, (_, i) => i + 1);
    expect(ids).toEqual(expected);
  });

  it('should have no duplicate chapter IDs', () => {
    const ids = ALL_STORY_MISSIONS.map(m => m.chapterId);
    expect(new Set(ids).size).toBe(34);
  });

  it('should have a non-empty title for every chapter', () => {
    for (const mission of ALL_STORY_MISSIONS) {
      expect(mission.title.length).toBeGreaterThan(0);
    }
  });

  it('should have a non-empty angularTopic for every chapter', () => {
    for (const mission of ALL_STORY_MISSIONS) {
      expect(mission.angularTopic.length).toBeGreaterThan(0);
    }
  });

  it('should have a non-empty narrative for every chapter', () => {
    for (const mission of ALL_STORY_MISSIONS) {
      expect(mission.narrative.length).toBeGreaterThan(0);
    }
  });
});

describe('Dependency validation', () => {
  it('should have all deps referencing valid chapter IDs (1-34)', () => {
    for (const mission of ALL_STORY_MISSIONS) {
      for (const dep of mission.deps) {
        expect(dep).toBeGreaterThanOrEqual(1);
        expect(dep).toBeLessThanOrEqual(34);
      }
    }
  });

  it('should have all deps referencing earlier chapters (dep < chapterId)', () => {
    for (const mission of ALL_STORY_MISSIONS) {
      for (const dep of mission.deps) {
        expect(dep).toBeLessThan(mission.chapterId);
      }
    }
  });

  it('should have no circular dependencies (DFS cycle check)', () => {
    const missionMap = new Map(ALL_STORY_MISSIONS.map(m => [m.chapterId, m]));
    const visited = new Set<number>();
    const inStack = new Set<number>();

    function hasCycle(id: number): boolean {
      if (inStack.has(id)) return true;
      if (visited.has(id)) return false;
      visited.add(id);
      inStack.add(id);
      const mission = missionMap.get(id)!;
      for (const dep of mission.deps) {
        if (hasCycle(dep)) return true;
      }
      inStack.delete(id);
      return false;
    }

    for (const mission of ALL_STORY_MISSIONS) {
      expect(hasCycle(mission.chapterId)).toBe(false);
    }
  });

  it('should have chapter 1 with no dependencies', () => {
    const ch1 = ALL_STORY_MISSIONS.find(m => m.chapterId === 1)!;
    expect(ch1.deps.length).toBe(0);
  });
});

describe('Minigame mapping', () => {
  it('should have all non-null unlocksMinigame values be valid MinigameId values', () => {
    for (const mission of ALL_STORY_MISSIONS) {
      if (mission.unlocksMinigame !== null) {
        expect(ALL_MINIGAME_IDS).toContain(mission.unlocksMinigame);
      }
    }
  });

  it('should have chapters 9, 10, 27, 33, 34 with null unlocksMinigame', () => {
    const nullChapters = [9, 10, 27, 33, 34];
    for (const chId of nullChapters) {
      const mission = ALL_STORY_MISSIONS.find(m => m.chapterId === chId)!;
      expect(mission.unlocksMinigame).toBeNull();
    }
  });

  it('should have all 12 MinigameId values appear at least once', () => {
    const unlocked = new Set(
      ALL_STORY_MISSIONS
        .map(m => m.unlocksMinigame)
        .filter((id): id is MinigameId => id !== null),
    );
    for (const gameId of ALL_MINIGAME_IDS) {
      expect(unlocked.has(gameId)).toBe(true);
    }
  });

  it('should have correct spot-check mappings', () => {
    const ch1 = ALL_STORY_MISSIONS.find(m => m.chapterId === 1)!;
    expect(ch1.unlocksMinigame).toBe('module-assembly');

    const ch4 = ALL_STORY_MISSIONS.find(m => m.chapterId === 4)!;
    expect(ch4.unlocksMinigame).toBe('flow-commander');

    const ch32 = ALL_STORY_MISSIONS.find(m => m.chapterId === 32)!;
    expect(ch32.unlocksMinigame).toBe('system-certification');
  });
});

describe('Phase validation', () => {
  it('should have exactly 6 phases', () => {
    expect(CURRICULUM.length).toBe(6);
  });

  it('should have phase numbers 1-6 in order', () => {
    const phaseNumbers = CURRICULUM.map(p => p.phaseNumber);
    expect(phaseNumbers).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('should have phase 1 containing chapters 1-10 (10 chapters)', () => {
    const phase1 = CURRICULUM[0];
    expect(phase1.chapters.length).toBe(10);
    const ids = phase1.chapters.map(c => c.chapterId);
    expect(ids).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('should have phase 2 containing chapters 11-13 (3 chapters)', () => {
    const phase2 = CURRICULUM[1];
    expect(phase2.chapters.length).toBe(3);
    const ids = phase2.chapters.map(c => c.chapterId);
    expect(ids).toEqual([11, 12, 13]);
  });

  it('should have phase 3 containing chapters 14-17 (4 chapters)', () => {
    const phase3 = CURRICULUM[2];
    expect(phase3.chapters.length).toBe(4);
    const ids = phase3.chapters.map(c => c.chapterId);
    expect(ids).toEqual([14, 15, 16, 17]);
  });

  it('should have phase 4 containing chapters 18-19 (2 chapters)', () => {
    const phase4 = CURRICULUM[3];
    expect(phase4.chapters.length).toBe(2);
    const ids = phase4.chapters.map(c => c.chapterId);
    expect(ids).toEqual([18, 19]);
  });

  it('should have phase 5 containing chapters 20-22 (3 chapters)', () => {
    const phase5 = CURRICULUM[4];
    expect(phase5.chapters.length).toBe(3);
    const ids = phase5.chapters.map(c => c.chapterId);
    expect(ids).toEqual([20, 21, 22]);
  });

  it('should have phase 6 containing chapters 23-34 (12 chapters)', () => {
    const phase6 = CURRICULUM[5];
    expect(phase6.chapters.length).toBe(12);
    const ids = phase6.chapters.map(c => c.chapterId);
    expect(ids).toEqual([23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34]);
  });

  it('should have each chapter phase field matching its parent phase', () => {
    for (const phase of CURRICULUM) {
      for (const chapter of phase.chapters) {
        expect(chapter.phase).toBe(phase.phaseNumber);
      }
    }
  });

  it('should have all phases with non-empty name and description', () => {
    for (const phase of CURRICULUM) {
      expect(phase.name.length).toBeGreaterThan(0);
      expect(phase.description.length).toBeGreaterThan(0);
    }
  });
});
