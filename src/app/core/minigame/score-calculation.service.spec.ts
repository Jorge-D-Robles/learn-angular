import {
  ScoreCalculationService,
  STAR_THRESHOLDS,
  type ScoreConfig,
} from './score-calculation.service';

describe('ScoreCalculationService', () => {
  let service: ScoreCalculationService;

  beforeEach(() => {
    service = new ScoreCalculationService();
  });

  // --- Structural tests ---

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should export STAR_THRESHOLDS with correct values', () => {
    expect(STAR_THRESHOLDS.ONE_STAR).toBe(0.6);
    expect(STAR_THRESHOLDS.TWO_STAR).toBe(0.8);
    expect(STAR_THRESHOLDS.THREE_STAR).toBe(0.95);
  });

  it('should export ScoreConfig interface (compile-time check)', () => {
    const config: ScoreConfig = {
      timeWeight: 10,
      accuracyWeight: 100,
      comboWeight: 25,
      maxScore: 1000,
    };
    expect(config.maxScore).toBe(1000);
  });

  // --- calculateScore ---

  describe('calculateScore', () => {
    const moduleAssemblyConfig: ScoreConfig = {
      timeWeight: 10,
      accuracyWeight: 100,
      comboWeight: 25,
      maxScore: 1000,
    };

    it('should calculate Module Assembly formula correctly', () => {
      // (30*10) + (5*100) + (8*25) = 300 + 500 + 200 = 1000, clamped to 1000
      const score = service.calculateScore(moduleAssemblyConfig, 30, 5, 8);
      expect(score).toBe(1000);
    });

    it('should return 0 for zero inputs', () => {
      const score = service.calculateScore(moduleAssemblyConfig, 0, 0, 0);
      expect(score).toBe(0);
    });

    it('should clamp to maxScore when raw exceeds it', () => {
      const config: ScoreConfig = {
        timeWeight: 10,
        accuracyWeight: 100,
        comboWeight: 25,
        maxScore: 500,
      };
      // (30*10) + (5*100) + (8*25) = 1000, clamped to 500
      const score = service.calculateScore(config, 30, 5, 8);
      expect(score).toBe(500);
    });

    it('should clamp negative raw scores to 0', () => {
      const score = service.calculateScore(moduleAssemblyConfig, -5, 0, 0);
      expect(score).toBe(0);
    });

    it('should round to nearest integer', () => {
      const config: ScoreConfig = {
        timeWeight: 3.5,
        accuracyWeight: 7,
        comboWeight: 1,
        maxScore: 1000,
      };
      // (1*3.5) + (3*7) + (1*1) = 3.5 + 21 + 1 = 25.5, rounded to 26
      const score = service.calculateScore(config, 1, 3, 1);
      expect(score).toBe(26);
    });

    it('should only use time weight when others are 0', () => {
      const config: ScoreConfig = {
        timeWeight: 10,
        accuracyWeight: 0,
        comboWeight: 0,
        maxScore: 1000,
      };
      // (50*10) + (100*0) + (10*0) = 500
      const score = service.calculateScore(config, 50, 100, 10);
      expect(score).toBe(500);
    });

    it('should only use accuracy weight when others are 0', () => {
      const config: ScoreConfig = {
        timeWeight: 0,
        accuracyWeight: 100,
        comboWeight: 0,
        maxScore: 1000,
      };
      // (50*0) + (5*100) + (10*0) = 500
      const score = service.calculateScore(config, 50, 5, 10);
      expect(score).toBe(500);
    });

    it('should clamp accuracy-only score to maxScore', () => {
      const config: ScoreConfig = {
        timeWeight: 0,
        accuracyWeight: 100,
        comboWeight: 0,
        maxScore: 1000,
      };
      // (50*0) + (15*100) + (10*0) = 1500, clamped to 1000
      const score = service.calculateScore(config, 50, 15, 10);
      expect(score).toBe(1000);
    });

    describe('comboMultiplier', () => {
      const config: ScoreConfig = {
        timeWeight: 3.5,
        accuracyWeight: 7,
        comboWeight: 1,
        maxScore: 1000,
      };

      const moduleAssemblyConfig: ScoreConfig = {
        timeWeight: 10,
        accuracyWeight: 100,
        comboWeight: 25,
        maxScore: 1000,
      };

      it('should produce identical results when comboMultiplier is omitted (backward compatible)', () => {
        // raw = 3.5*30 + 7*5 + 1*8 = 105 + 35 + 8 = 148
        const score = service.calculateScore(config, 30, 5, 8);
        expect(score).toBe(148);
      });

      it('should produce identical results with explicit 1.0 multiplier', () => {
        // raw = 3.5*30 + 7*5 + 1*8 = 148; * 1.0 = 148
        const score = service.calculateScore(config, 30, 5, 8, 1.0);
        expect(score).toBe(148);
      });

      it('should scale raw score with 1.5x multiplier', () => {
        // raw = (10*10) + (3*100) + (2*25) = 100 + 300 + 50 = 450; * 1.5 = 675
        const score = service.calculateScore(
          moduleAssemblyConfig,
          10,
          3,
          2,
          1.5,
        );
        expect(score).toBe(675);
      });

      it('should clamp to maxScore with 2.0x multiplier', () => {
        // raw = (30*10) + (5*100) + (8*25) = 1000; * 2.0 = 2000, clamped to 1000
        const score = service.calculateScore(
          moduleAssemblyConfig,
          30,
          5,
          8,
          2.0,
        );
        expect(score).toBe(1000);
      });

      it('should apply 3.0x multiplier on small score', () => {
        // raw = 10 + 100 + 0 = 110; * 3.0 = 330
        const score = service.calculateScore(
          moduleAssemblyConfig,
          1,
          1,
          0,
          3.0,
        );
        expect(score).toBe(330);
      });

      it('should round correctly with fractional multiplied score', () => {
        // raw = 3.5 + 21 + 1 = 25.5; * 1.5 = 38.25, Math.round = 38
        const score = service.calculateScore(config, 1, 3, 1, 1.5);
        expect(score).toBe(38);
      });

      it('should not rescue negative-input scores with multiplier', () => {
        // raw = (-50 + 0 + 0) * 2.0 = -100, clamped to 0
        const score = service.calculateScore(
          moduleAssemblyConfig,
          -5,
          0,
          0,
          2.0,
        );
        expect(score).toBe(0);
      });
    });
  });

  // --- isPerfect ---

  describe('isPerfect', () => {
    it('should return true when score equals maxScore', () => {
      expect(service.isPerfect(1000, 1000)).toBe(true);
    });

    it('should return false when score is less than maxScore', () => {
      expect(service.isPerfect(999, 1000)).toBe(false);
    });

    it('should return true when score exceeds maxScore (edge case)', () => {
      expect(service.isPerfect(1001, 1000)).toBe(true);
    });

    it('should return true when both score and maxScore are 0', () => {
      expect(service.isPerfect(0, 0)).toBe(true);
    });
  });

  // --- getStarRating ---

  describe('getStarRating', () => {
    it('should return 3 stars at exactly 95%', () => {
      expect(service.getStarRating(950, 1000)).toBe(3);
    });

    it('should return 3 stars at 100%', () => {
      expect(service.getStarRating(1000, 1000)).toBe(3);
    });

    it('should return 2 stars at exactly 80%', () => {
      expect(service.getStarRating(800, 1000)).toBe(2);
    });

    it('should return 2 stars at 94% (just below 3-star)', () => {
      expect(service.getStarRating(940, 1000)).toBe(2);
    });

    it('should return 1 star at exactly 60%', () => {
      expect(service.getStarRating(600, 1000)).toBe(1);
    });

    it('should return 1 star at 0%', () => {
      expect(service.getStarRating(0, 1000)).toBe(1);
    });

    it('should return 1 star at 59% (below 1-star threshold)', () => {
      expect(service.getStarRating(590, 1000)).toBe(1);
    });

    it('should return 1 star when maxScore is 0 (division by zero guard)', () => {
      expect(service.getStarRating(0, 0)).toBe(1);
    });
  });
});
