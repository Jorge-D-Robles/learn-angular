import { TestBed } from '@angular/core/testing';
import {
  ConveyorBeltService,
  DEFAULT_BELT_LENGTH,
  PART_SPACING,
  type BeltPart,
} from './conveyor-belt.service';
import type { ComponentPart } from './module-assembly.types';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function createTestPart(overrides?: Partial<ComponentPart>): ComponentPart {
  return {
    id: 'part-1',
    type: 'template',
    content: '<h1>Hello</h1>',
    isDecoy: false,
    correctSlotId: 'slot-1',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ConveyorBeltService', () => {
  let service: ConveyorBeltService;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [ConveyorBeltService],
    });
    service = TestBed.inject(ConveyorBeltService);
  });

  // --- 1. Creation and initial state ---

  describe('Creation and initial state', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should start with empty parts list', () => {
      expect(service.parts()).toEqual([]);
    });

    it('should start with beltSpeed 0', () => {
      expect(service.beltSpeed()).toBe(0);
    });

    it('should start with isExhausted false', () => {
      expect(service.isExhausted()).toBe(false);
    });
  });

  // --- 2. reset() ---

  describe('reset()', () => {
    it('should set parts with staggered positions starting from beltLength', () => {
      const parts = [
        createTestPart({ id: 'p1' }),
        createTestPart({ id: 'p2' }),
        createTestPart({ id: 'p3' }),
      ];
      service.reset(parts, 100);

      const beltParts = service.parts();
      expect(beltParts).toHaveLength(3);
      expect(beltParts[0].x).toBe(DEFAULT_BELT_LENGTH);
      expect(beltParts[1].x).toBe(DEFAULT_BELT_LENGTH + PART_SPACING);
      expect(beltParts[2].x).toBe(DEFAULT_BELT_LENGTH + 2 * PART_SPACING);
    });

    it('should set beltSpeed from reset parameter', () => {
      service.reset([], 150);
      expect(service.beltSpeed()).toBe(150);
    });

    it('should accept custom beltLength', () => {
      const parts = [createTestPart({ id: 'p1' })];
      service.reset(parts, 100, 500);

      expect(service.beltLength()).toBe(500);
      expect(service.parts()[0].x).toBe(500);
    });

    it('should clear previous parts on reset', () => {
      service.reset([createTestPart({ id: 'p1' })], 100);
      expect(service.parts()).toHaveLength(1);

      service.reset([createTestPart({ id: 'p2' }), createTestPart({ id: 'p3' })], 200);
      expect(service.parts()).toHaveLength(2);
      expect(service.parts()[0].part.id).toBe('p2');
    });

    it('should reset isExhausted to false', () => {
      // Set up exhaustion: 1 part, advance it past 0
      service.reset([createTestPart({ id: 'p1' })], 100);
      service.tick(10); // moves 1000px left, well past 0
      expect(service.isExhausted()).toBe(true);

      // Reset clears exhaustion
      service.reset([createTestPart({ id: 'p2' })], 100);
      expect(service.isExhausted()).toBe(false);
    });
  });

  // --- 3. addPart() ---

  describe('addPart()', () => {
    it('should add a part at x = beltLength', () => {
      service.reset([], 100);
      const part = createTestPart({ id: 'new-part' });
      service.addPart(part);

      expect(service.parts()).toHaveLength(1);
      expect(service.parts()[0].x).toBe(DEFAULT_BELT_LENGTH);
      expect(service.parts()[0].part.id).toBe('new-part');
    });

    it('should append to existing parts', () => {
      service.reset([createTestPart({ id: 'p1' })], 100);
      service.addPart(createTestPart({ id: 'p2' }));

      expect(service.parts()).toHaveLength(2);
      expect(service.parts()[1].part.id).toBe('p2');
    });

    it('should use current beltLength for x position', () => {
      service.reset([], 100, 600);
      service.addPart(createTestPart({ id: 'p1' }));

      expect(service.parts()[0].x).toBe(600);
    });
  });

  // --- 4. tick() ---

  describe('tick()', () => {
    it('should advance all part positions by speed * deltaTime', () => {
      service.reset([createTestPart({ id: 'p1' }), createTestPart({ id: 'p2' })], 100);
      const initialX0 = service.parts()[0].x;
      const initialX1 = service.parts()[1].x;

      service.tick(0.1); // 100 * 0.1 = 10px

      expect(service.parts()[0].x).toBe(initialX0 - 10);
      expect(service.parts()[1].x).toBe(initialX1 - 10);
    });

    it('should handle fractional deltaTime', () => {
      service.reset([createTestPart({ id: 'p1' })], 200);
      const initialX = service.parts()[0].x;

      service.tick(0.016); // ~60fps frame: 200 * 0.016 = 3.2px

      expect(service.parts()[0].x).toBeCloseTo(initialX - 3.2, 5);
    });

    it('should not modify parts when speed is 0', () => {
      service.reset([createTestPart({ id: 'p1' })], 0);
      const initialX = service.parts()[0].x;

      service.tick(1.0);

      expect(service.parts()[0].x).toBe(initialX);
    });

    it('should not modify parts when parts list is empty', () => {
      service.reset([], 100);
      // Should not throw
      service.tick(1.0);
      expect(service.parts()).toEqual([]);
    });

    it('should produce new BeltPart objects (immutable update)', () => {
      service.reset([createTestPart({ id: 'p1' })], 100);
      const beforeTick = service.parts()[0];

      service.tick(0.1);
      const afterTick = service.parts()[0];

      // Different object references
      expect(afterTick).not.toBe(beforeTick);
      // Same underlying part reference
      expect(afterTick.part).toBe(beforeTick.part);
      // Different x value
      expect(afterTick.x).not.toBe(beforeTick.x);
    });
  });

  // --- 5. removePart() ---

  describe('removePart()', () => {
    it('should remove part by id', () => {
      service.reset(
        [createTestPart({ id: 'p1' }), createTestPart({ id: 'p2' })],
        100,
      );

      service.removePart('p1');

      expect(service.parts()).toHaveLength(1);
      expect(service.parts()[0].part.id).toBe('p2');
    });

    it('should not affect other parts', () => {
      service.reset(
        [
          createTestPart({ id: 'p1' }),
          createTestPart({ id: 'p2' }),
          createTestPart({ id: 'p3' }),
        ],
        100,
      );

      const p2xBefore = service.parts()[1].x;
      const p3xBefore = service.parts()[2].x;

      service.removePart('p1');

      expect(service.parts()[0].part.id).toBe('p2');
      expect(service.parts()[0].x).toBe(p2xBefore);
      expect(service.parts()[1].part.id).toBe('p3');
      expect(service.parts()[1].x).toBe(p3xBefore);
    });

    it('should be a no-op for unknown partId', () => {
      service.reset([createTestPart({ id: 'p1' })], 100);

      service.removePart('non-existent');

      expect(service.parts()).toHaveLength(1);
    });
  });

  // --- 6. isExhausted computed ---

  describe('isExhausted', () => {
    it('should be false when no parts exist', () => {
      expect(service.isExhausted()).toBe(false);
    });

    it('should be false when parts have positive x', () => {
      service.reset([createTestPart({ id: 'p1' })], 100);
      expect(service.isExhausted()).toBe(false);
    });

    it('should be false when some parts have x < 0 and some >= 0', () => {
      service.reset(
        [createTestPart({ id: 'p1' }), createTestPart({ id: 'p2' })],
        100,
      );
      // Tick enough to move first part past 0 but not second (staggered)
      // p1 starts at 800, p2 starts at 920
      // Need to move 801px to get p1 below 0 (speed=100, dt=8.01)
      // p2 would be at 920 - 801 = 119 (still positive)
      service.tick(8.01);

      const parts = service.parts();
      expect(parts[0].x).toBeLessThan(0);
      expect(parts[1].x).toBeGreaterThanOrEqual(0);
      expect(service.isExhausted()).toBe(false);
    });

    it('should be true when all parts have x < 0', () => {
      service.reset([createTestPart({ id: 'p1' })], 100);
      // Move 801px: speed=100, dt=8.01
      service.tick(8.01);

      expect(service.parts()[0].x).toBeLessThan(0);
      expect(service.isExhausted()).toBe(true);
    });

    it('should update reactively after tick moves parts past 0', () => {
      service.reset([createTestPart({ id: 'p1' })], 100);
      expect(service.isExhausted()).toBe(false);

      // Tick to move past 0
      service.tick(10);
      expect(service.isExhausted()).toBe(true);
    });

    it('should return to false after reset', () => {
      service.reset([createTestPart({ id: 'p1' })], 100);
      service.tick(10);
      expect(service.isExhausted()).toBe(true);

      service.reset([createTestPart({ id: 'p2' })], 100);
      expect(service.isExhausted()).toBe(false);
    });
  });

  // --- 7. Edge cases ---

  describe('Edge cases', () => {
    it('should handle reset with empty parts array', () => {
      service.reset([], 100);
      expect(service.parts()).toEqual([]);
      expect(service.isExhausted()).toBe(false);
    });

    it('should handle very large deltaTime', () => {
      service.reset([createTestPart({ id: 'p1' })], 100);
      service.tick(100000); // 100 * 100000 = 10,000,000px left
      expect(service.parts()[0].x).toBeLessThan(0);
      expect(service.isExhausted()).toBe(true);
    });

    it('should handle rapid add/remove cycles', () => {
      service.reset([], 100);

      for (let i = 0; i < 10; i++) {
        service.addPart(createTestPart({ id: `p${i}` }));
      }
      expect(service.parts()).toHaveLength(10);

      for (let i = 0; i < 5; i++) {
        service.removePart(`p${i}`);
      }
      expect(service.parts()).toHaveLength(5);
      expect(service.parts()[0].part.id).toBe('p5');
    });

    it('should clamp negative deltaTime to 0', () => {
      service.reset([createTestPart({ id: 'p1' })], 100);
      const initialX = service.parts()[0].x;

      service.tick(-1.0);

      // Parts should not move backward
      expect(service.parts()[0].x).toBe(initialX);
    });
  });

  // --- 8. Exported constants ---

  describe('Exported constants', () => {
    it('should export DEFAULT_BELT_LENGTH as 800', () => {
      expect(DEFAULT_BELT_LENGTH).toBe(800);
    });

    it('should export PART_SPACING as 120', () => {
      expect(PART_SPACING).toBe(120);
    });

    it('should export BeltPart interface (compile-time check)', () => {
      const bp: BeltPart = { part: createTestPart(), x: 100 };
      expect(bp).toBeTruthy();
    });
  });
});
