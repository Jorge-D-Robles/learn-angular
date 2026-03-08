import { TestBed } from '@angular/core/testing';
import {
  ComboTrackerService,
  COMBO_THRESHOLDS,
  type ComboThreshold,
} from './combo-tracker.service';

describe('ComboTrackerService', () => {
  let service: ComboTrackerService;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ComboTrackerService);
  });

  // --- Structural tests ---

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should export COMBO_THRESHOLDS constant with expected values', () => {
    expect(COMBO_THRESHOLDS).toBeDefined();
    expect(COMBO_THRESHOLDS).toEqual([
      { minCombo: 10, multiplier: 3.0 },
      { minCombo: 5, multiplier: 2.0 },
      { minCombo: 3, multiplier: 1.5 },
      { minCombo: 0, multiplier: 1.0 },
    ]);
  });

  it('should export ComboThreshold interface (compile-time check)', () => {
    const threshold: ComboThreshold = { minCombo: 5, multiplier: 2.0 };
    expect(threshold).toBeTruthy();
  });

  // --- currentCombo signal ---

  describe('currentCombo', () => {
    it('should start at 0', () => {
      expect(service.currentCombo()).toBe(0);
    });

    it('should increment on recordCorrect()', () => {
      service.recordCorrect();
      expect(service.currentCombo()).toBe(1);
    });

    it('should increment multiple times', () => {
      for (let i = 0; i < 5; i++) {
        service.recordCorrect();
      }
      expect(service.currentCombo()).toBe(5);
    });

    it('should be read-only', () => {
      // The public signal should not have a .set or .update method
      expect((service.currentCombo as unknown as Record<string, unknown>)['set']).toBeUndefined();
      expect((service.currentCombo as unknown as Record<string, unknown>)['update']).toBeUndefined();
    });
  });

  // --- recordCorrect ---

  describe('recordCorrect', () => {
    it('should increment combo by 1', () => {
      service.recordCorrect();
      expect(service.currentCombo()).toBe(1);
    });

    it('should chain increments', () => {
      service.recordCorrect();
      service.recordCorrect();
      service.recordCorrect();
      expect(service.currentCombo()).toBe(3);
    });
  });

  // --- recordIncorrect ---

  describe('recordIncorrect', () => {
    it('should reset combo to 0', () => {
      for (let i = 0; i < 5; i++) {
        service.recordCorrect();
      }
      expect(service.currentCombo()).toBe(5);
      service.recordIncorrect();
      expect(service.currentCombo()).toBe(0);
    });

    it('should be idempotent at 0', () => {
      service.recordIncorrect();
      expect(service.currentCombo()).toBe(0);
    });
  });

  // --- comboMultiplier computed signal ---

  describe('comboMultiplier', () => {
    it('should return 1.0x at combo 0', () => {
      expect(service.comboMultiplier()).toBe(1.0);
    });

    it('should return 1.0x at combo 1', () => {
      service.recordCorrect();
      expect(service.comboMultiplier()).toBe(1.0);
    });

    it('should return 1.0x at combo 2', () => {
      service.recordCorrect();
      service.recordCorrect();
      expect(service.comboMultiplier()).toBe(1.0);
    });

    it('should return 1.5x at combo 3', () => {
      for (let i = 0; i < 3; i++) {
        service.recordCorrect();
      }
      expect(service.comboMultiplier()).toBe(1.5);
    });

    it('should return 1.5x at combo 4', () => {
      for (let i = 0; i < 4; i++) {
        service.recordCorrect();
      }
      expect(service.comboMultiplier()).toBe(1.5);
    });

    it('should return 2.0x at combo 5', () => {
      for (let i = 0; i < 5; i++) {
        service.recordCorrect();
      }
      expect(service.comboMultiplier()).toBe(2.0);
    });

    it('should return 2.0x at combo 9', () => {
      for (let i = 0; i < 9; i++) {
        service.recordCorrect();
      }
      expect(service.comboMultiplier()).toBe(2.0);
    });

    it('should return 3.0x at combo 10', () => {
      for (let i = 0; i < 10; i++) {
        service.recordCorrect();
      }
      expect(service.comboMultiplier()).toBe(3.0);
    });

    it('should return 3.0x at combo 100', () => {
      for (let i = 0; i < 100; i++) {
        service.recordCorrect();
      }
      expect(service.comboMultiplier()).toBe(3.0);
    });
  });

  // --- maxCombo signal ---

  describe('maxCombo', () => {
    it('should start at 0', () => {
      expect(service.maxCombo()).toBe(0);
    });

    it('should track highest combo reached', () => {
      // 3 correct -> maxCombo 3
      service.recordCorrect();
      service.recordCorrect();
      service.recordCorrect();
      expect(service.maxCombo()).toBe(3);

      // 1 incorrect -> currentCombo 0, maxCombo still 3
      service.recordIncorrect();
      expect(service.maxCombo()).toBe(3);

      // 2 correct -> currentCombo 2, maxCombo still 3
      service.recordCorrect();
      service.recordCorrect();
      expect(service.maxCombo()).toBe(3);
    });

    it('should not decrease on incorrect', () => {
      for (let i = 0; i < 5; i++) {
        service.recordCorrect();
      }
      expect(service.maxCombo()).toBe(5);
      service.recordIncorrect();
      expect(service.maxCombo()).toBe(5);
    });

    it('should update when new high is set', () => {
      for (let i = 0; i < 3; i++) {
        service.recordCorrect();
      }
      expect(service.maxCombo()).toBe(3);

      service.recordIncorrect();

      for (let i = 0; i < 7; i++) {
        service.recordCorrect();
      }
      expect(service.maxCombo()).toBe(7);
    });
  });

  // --- reset ---

  describe('reset', () => {
    it('should reset currentCombo to 0', () => {
      for (let i = 0; i < 5; i++) {
        service.recordCorrect();
      }
      service.reset();
      expect(service.currentCombo()).toBe(0);
    });

    it('should reset maxCombo to 0', () => {
      for (let i = 0; i < 5; i++) {
        service.recordCorrect();
      }
      expect(service.maxCombo()).toBe(5);
      service.reset();
      expect(service.maxCombo()).toBe(0);
    });

    it('should reset comboMultiplier to 1.0x', () => {
      for (let i = 0; i < 10; i++) {
        service.recordCorrect();
      }
      expect(service.comboMultiplier()).toBe(3.0);
      service.reset();
      expect(service.comboMultiplier()).toBe(1.0);
    });

    it('should allow fresh tracking after reset', () => {
      for (let i = 0; i < 5; i++) {
        service.recordCorrect();
      }
      service.reset();
      service.recordCorrect();
      expect(service.currentCombo()).toBe(1);
      expect(service.maxCombo()).toBe(1);
    });
  });

  // --- Edge cases ---

  describe('edge cases', () => {
    it('should handle rapid alternating correct/incorrect', () => {
      service.recordCorrect();   // combo 1, max 1
      service.recordIncorrect(); // combo 0, max 1
      service.recordCorrect();   // combo 1, max 1
      expect(service.currentCombo()).toBe(1);
      expect(service.maxCombo()).toBe(1);
    });

    it('should handle very large combo counts', () => {
      for (let i = 0; i < 1000; i++) {
        service.recordCorrect();
      }
      expect(service.currentCombo()).toBe(1000);
      expect(service.comboMultiplier()).toBe(3.0);
    });
  });
});
