import {
  HintService,
  DEFAULT_HINT_PENALTY_FRACTION,
  type HintDefinition,
} from './hint.service';

describe('HintService', () => {
  let service: HintService;

  beforeEach(() => {
    service = new HintService();
  });

  // --- Structural tests ---

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should export DEFAULT_HINT_PENALTY_FRACTION as 0.25', () => {
    expect(DEFAULT_HINT_PENALTY_FRACTION).toBe(0.25);
  });

  // --- registerHints ---

  describe('registerHints', () => {
    it('should register hints for a level', () => {
      const hints: HintDefinition[] = [
        { id: 'h1', text: 'Hint 1' },
        { id: 'h2', text: 'Hint 2' },
        { id: 'h3', text: 'Hint 3' },
      ];
      service.registerHints('level-1', hints);
      expect(service.getHintCount('level-1')).toBe(3);
    });

    it('should handle multiple levels independently', () => {
      service.registerHints('level-1', [
        { id: 'h1', text: 'Hint 1' },
        { id: 'h2', text: 'Hint 2' },
      ]);
      service.registerHints('level-2', [
        { id: 'h3', text: 'Hint 3' },
      ]);
      expect(service.getHintCount('level-1')).toBe(2);
      expect(service.getHintCount('level-2')).toBe(1);
    });

    it('should replace hints for the same level on re-registration', () => {
      service.registerHints('level-1', [
        { id: 'h1', text: 'Hint 1' },
        { id: 'h2', text: 'Hint 2' },
        { id: 'h3', text: 'Hint 3' },
      ]);
      service.registerHints('level-1', [
        { id: 'h4', text: 'Hint 4' },
        { id: 'h5', text: 'Hint 5' },
      ]);
      expect(service.getHintCount('level-1')).toBe(2);
    });
  });

  // --- configure ---

  describe('configure', () => {
    it('should use default penalty fraction of 0.25', () => {
      service.registerHints('level-1', [
        { id: 'h1', text: 'Hint 1' },
      ]);
      service.configure({ maxScore: 1000 });
      const result = service.requestHint('level-1');
      expect(result).not.toBeNull();
      expect(result!.penalty).toBe(250);
    });

    it('should allow custom penalty fraction', () => {
      service.registerHints('level-1', [
        { id: 'h1', text: 'Hint 1' },
      ]);
      service.configure({ maxScore: 1000, penaltyFraction: 0.5 });
      const result = service.requestHint('level-1');
      expect(result).not.toBeNull();
      expect(result!.penalty).toBe(500);
    });
  });

  // --- requestHint ---

  describe('requestHint', () => {
    const threeHints: HintDefinition[] = [
      { id: 'h1', text: 'Hint 1' },
      { id: 'h2', text: 'Hint 2' },
      { id: 'h3', text: 'Hint 3' },
    ];

    beforeEach(() => {
      service.registerHints('level-1', threeHints);
      service.configure({ maxScore: 1000, penaltyFraction: 0.25 });
    });

    it('should return the first unused hint', () => {
      const result = service.requestHint('level-1');
      expect(result).not.toBeNull();
      expect(result!.hint).toEqual(threeHints[0]);
    });

    it('should return hints in registration order', () => {
      const first = service.requestHint('level-1');
      const second = service.requestHint('level-1');
      const third = service.requestHint('level-1');
      expect(first!.hint).toEqual(threeHints[0]);
      expect(second!.hint).toEqual(threeHints[1]);
      expect(third!.hint).toEqual(threeHints[2]);
    });

    it('should return null when no hints remain', () => {
      service.registerHints('level-2', [
        { id: 'h1', text: 'Hint 1' },
        { id: 'h2', text: 'Hint 2' },
      ]);
      service.requestHint('level-2');
      service.requestHint('level-2');
      const result = service.requestHint('level-2');
      expect(result).toBeNull();
    });

    it('should return null for unregistered level', () => {
      const result = service.requestHint('unknown-level');
      expect(result).toBeNull();
    });

    it('should calculate penalty as penaltyFraction * maxScore', () => {
      const result = service.requestHint('level-1');
      expect(result).not.toBeNull();
      expect(result!.penalty).toBe(250);
    });

    it('should report correct remainingHints count', () => {
      const first = service.requestHint('level-1');
      expect(first!.remainingHints).toBe(2);
      const second = service.requestHint('level-1');
      expect(second!.remainingHints).toBe(1);
      const third = service.requestHint('level-1');
      expect(third!.remainingHints).toBe(0);
    });
  });

  // --- getHintCount ---

  describe('getHintCount', () => {
    it('should return 0 for unregistered level', () => {
      expect(service.getHintCount('unknown-level')).toBe(0);
    });

    it('should return total registered hints regardless of used hints', () => {
      service.registerHints('level-1', [
        { id: 'h1', text: 'Hint 1' },
        { id: 'h2', text: 'Hint 2' },
        { id: 'h3', text: 'Hint 3' },
      ]);
      service.configure({ maxScore: 100 });
      service.requestHint('level-1');
      expect(service.getHintCount('level-1')).toBe(3);
    });
  });

  // --- getUsedHints ---

  describe('getUsedHints', () => {
    it('should return empty array initially', () => {
      expect(service.getUsedHints()).toEqual([]);
    });

    it('should track used hints in order', () => {
      const hints: HintDefinition[] = [
        { id: 'h1', text: 'Hint 1' },
        { id: 'h2', text: 'Hint 2' },
        { id: 'h3', text: 'Hint 3' },
      ];
      service.registerHints('level-1', hints);
      service.configure({ maxScore: 100 });
      service.requestHint('level-1');
      service.requestHint('level-1');
      expect(service.getUsedHints()).toEqual([hints[0], hints[1]]);
    });

    it('should update usedHints signal reactively', () => {
      const hints: HintDefinition[] = [
        { id: 'h1', text: 'Hint 1' },
      ];
      service.registerHints('level-1', hints);
      service.configure({ maxScore: 100 });
      expect(service.usedHints()).toEqual([]);
      service.requestHint('level-1');
      expect(service.usedHints()).toEqual([hints[0]]);
      expect(service.usedHints()).toEqual(service.getUsedHints());
    });
  });

  // --- hasUsedHints ---

  describe('hasUsedHints', () => {
    it('should return false when no hints used', () => {
      expect(service.hasUsedHints()).toBe(false);
    });

    it('should return true after requesting a hint', () => {
      service.registerHints('level-1', [
        { id: 'h1', text: 'Hint 1' },
      ]);
      service.configure({ maxScore: 100 });
      service.requestHint('level-1');
      expect(service.hasUsedHints()).toBe(true);
    });
  });

  // --- getRemainingHints ---

  describe('getRemainingHints', () => {
    it('should return total count when none used', () => {
      service.registerHints('level-1', [
        { id: 'h1', text: 'Hint 1' },
        { id: 'h2', text: 'Hint 2' },
        { id: 'h3', text: 'Hint 3' },
      ]);
      expect(service.getRemainingHints('level-1')).toBe(3);
    });

    it('should decrease as hints are used', () => {
      service.registerHints('level-1', [
        { id: 'h1', text: 'Hint 1' },
        { id: 'h2', text: 'Hint 2' },
        { id: 'h3', text: 'Hint 3' },
      ]);
      service.configure({ maxScore: 100 });
      service.requestHint('level-1');
      expect(service.getRemainingHints('level-1')).toBe(2);
    });
  });

  // --- reset ---

  describe('reset', () => {
    it('should clear used hints', () => {
      service.registerHints('level-1', [
        { id: 'h1', text: 'Hint 1' },
      ]);
      service.configure({ maxScore: 100 });
      service.requestHint('level-1');
      expect(service.hasUsedHints()).toBe(true);
      service.reset();
      expect(service.getUsedHints()).toEqual([]);
      expect(service.hasUsedHints()).toBe(false);
    });

    it('should allow re-requesting hints after reset', () => {
      const hints: HintDefinition[] = [
        { id: 'h1', text: 'Hint 1' },
        { id: 'h2', text: 'Hint 2' },
      ];
      service.registerHints('level-1', hints);
      service.configure({ maxScore: 100 });
      service.requestHint('level-1');
      service.reset();
      // Registrations survive reset -- no need to re-register
      service.configure({ maxScore: 100 });
      const result = service.requestHint('level-1');
      expect(result).not.toBeNull();
      expect(result!.hint).toEqual(hints[0]);
    });

    it('should clear config', () => {
      service.registerHints('level-1', [
        { id: 'h1', text: 'Hint 1' },
      ]);
      service.configure({ maxScore: 1000, penaltyFraction: 0.5 });
      service.reset();
      // After reset, config defaults: maxScore=0, penaltyFraction=0.25
      // So penalty = 0 * 0.25 = 0
      const result = service.requestHint('level-1');
      expect(result).not.toBeNull();
      expect(result!.penalty).toBe(0);
    });
  });

  // --- Edge cases ---

  describe('edge cases', () => {
    it('should handle level with zero hints', () => {
      service.registerHints('level-1', []);
      expect(service.requestHint('level-1')).toBeNull();
      expect(service.getHintCount('level-1')).toBe(0);
    });

    it('should not double-count hints on repeated requests after exhaustion', () => {
      service.registerHints('level-1', [
        { id: 'h1', text: 'Hint 1' },
        { id: 'h2', text: 'Hint 2' },
      ]);
      service.configure({ maxScore: 100 });
      service.requestHint('level-1');
      service.requestHint('level-1');
      service.requestHint('level-1'); // past limit, returns null
      service.requestHint('level-1'); // past limit again
      expect(service.getUsedHints().length).toBe(2);
    });
  });

  // --- getNextHintPenalty ---

  describe('getNextHintPenalty', () => {
    it('should return penalty when hints remain', () => {
      service.registerHints('level-1', [
        { id: 'h1', text: 'Hint 1' },
        { id: 'h2', text: 'Hint 2' },
      ]);
      service.configure({ maxScore: 1000, penaltyFraction: 0.25 });
      expect(service.getNextHintPenalty('level-1')).toBe(250);
    });

    it('should return 0 when no hints remain', () => {
      service.registerHints('level-1', [
        { id: 'h1', text: 'Hint 1' },
      ]);
      service.configure({ maxScore: 1000, penaltyFraction: 0.25 });
      service.requestHint('level-1');
      expect(service.getNextHintPenalty('level-1')).toBe(0);
    });

    it('should return 0 for unregistered level', () => {
      service.configure({ maxScore: 1000, penaltyFraction: 0.25 });
      expect(service.getNextHintPenalty('unknown')).toBe(0);
    });

    it('should return 0 after reset', () => {
      service.registerHints('level-1', [
        { id: 'h1', text: 'Hint 1' },
      ]);
      service.configure({ maxScore: 1000, penaltyFraction: 0.25 });
      service.reset();
      // After reset, maxScore resets to 0, so penalty = 0 * 0.25 = 0
      expect(service.getNextHintPenalty('level-1')).toBe(0);
    });

    it('should not consume a hint', () => {
      service.registerHints('level-1', [
        { id: 'h1', text: 'Hint 1' },
        { id: 'h2', text: 'Hint 2' },
      ]);
      service.configure({ maxScore: 1000, penaltyFraction: 0.25 });
      service.getNextHintPenalty('level-1');
      expect(service.getRemainingHints('level-1')).toBe(2);
    });
  });
});
