import { TestBed } from '@angular/core/testing';
import { BlastDoorsLifecycleServiceImpl } from './blast-doors-lifecycle.service';
import {
  LIFECYCLE_HOOK_ORDER,
  type BlastDoor,
  type BehaviorBlock,
  type DirectiveSpec,
  type DoorScenario,
  type ExpectedBehavior,
  type HookSlot,
  type LifecycleHook,
  type RuntimeBlastDoor,
  type RuntimeHookSlot,
} from './blast-doors.types';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeBlock(hookTarget: LifecycleHook, id = 'b-1'): BehaviorBlock {
  return { id, description: 'test', code: `this.door.${hookTarget}()`, hookTarget };
}

function makeSlot(
  hookType: LifecycleHook,
  executionOrder: number,
  block: BehaviorBlock | null = null,
): HookSlot {
  return { hookType, behaviorBlock: block, executionOrder };
}

function makeDoor(overrides?: Partial<BlastDoor>): BlastDoor {
  return {
    id: 'door-1',
    position: 'north-airlock',
    currentState: 'closed',
    hookSlots: [
      makeSlot('ngOnInit', 0),
      makeSlot('ngOnDestroy', 1),
    ],
    ...overrides,
  };
}

function makeRuntimeDoor(overrides?: Partial<RuntimeBlastDoor>): RuntimeBlastDoor {
  return {
    id: 'door-1',
    position: 'north-airlock',
    currentState: 'closed',
    hookSlots: [
      makeSlot('ngOnInit', 0),
      makeSlot('ngOnDestroy', 1),
    ],
    appliedDirectives: [],
    ...overrides,
  };
}

function makeDirective(overrides?: Partial<DirectiveSpec>): DirectiveSpec {
  return {
    name: 'appAutoLock',
    type: 'attribute',
    inputs: [],
    hostListeners: [],
    hostBindings: [],
    behavior: 'Locks the door after timeout',
    ...overrides,
  };
}

function makeScenario(overrides?: Partial<DoorScenario>): DoorScenario {
  return {
    id: 'sc-1',
    trigger: 'Component initialization',
    steps: [
      {
        event: 'ngOnInit fires',
        expectedDoorStates: [{ doorId: 'door-1', expectedState: 'open' }],
      },
    ],
    ...overrides,
  };
}

function makeExpectedBehavior(overrides?: Partial<ExpectedBehavior>): ExpectedBehavior {
  return {
    scenarioId: 'sc-1',
    hooksFired: ['ngOnInit'],
    finalDoorStates: [{ doorId: 'door-1', expectedState: 'open' }],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BlastDoorsLifecycleServiceImpl', () => {
  let service: BlastDoorsLifecycleServiceImpl;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [BlastDoorsLifecycleServiceImpl],
    });
    service = TestBed.inject(BlastDoorsLifecycleServiceImpl);
  });

  // =========================================================================
  // 1. Creation and initial state
  // =========================================================================
  describe('Creation and initial state', () => {
    it('should be created via TestBed', () => {
      expect(service).toBeTruthy();
    });

    it('getDoorStates() returns empty map initially', () => {
      const states = service.getDoorStates();
      expect(states().size).toBe(0);
    });

    it('reset() does not throw when called with no prior state', () => {
      expect(() => service.reset()).not.toThrow();
    });
  });

  // =========================================================================
  // 2. loadDoors
  // =========================================================================
  describe('loadDoors', () => {
    it('initializes runtime door state from level data doors', () => {
      const doors = [
        makeDoor({ id: 'door-1' }),
        makeDoor({ id: 'door-2', position: 'south-airlock' }),
      ];
      service.loadDoors(doors);

      const states = service.getDoorStates()();
      expect(states.size).toBe(2);
      expect(states.has('door-1')).toBe(true);
      expect(states.has('door-2')).toBe(true);
    });

    it('converts immutable doors to mutable runtime doors', () => {
      const doors = [makeDoor({ id: 'door-1', currentState: 'closed' })];
      service.loadDoors(doors);

      const door = service.getDoorStates()().get('door-1');
      expect(door).toBeDefined();
      expect(door!.currentState).toBe('closed');
      expect(door!.appliedDirectives).toEqual([]);
    });

    it('replaces previous state when called again', () => {
      service.loadDoors([makeDoor({ id: 'door-1' })]);
      service.loadDoors([makeDoor({ id: 'door-2' })]);

      const states = service.getDoorStates()();
      expect(states.size).toBe(1);
      expect(states.has('door-2')).toBe(true);
      expect(states.has('door-1')).toBe(false);
    });
  });

  // =========================================================================
  // 3. assignBehavior
  // =========================================================================
  describe('assignBehavior', () => {
    it('places behavior block in the matching hook slot', () => {
      service.loadDoors([makeDoor({ id: 'door-1' })]);
      const block = makeBlock('ngOnInit', 'b-init');

      const result = service.assignBehavior('door-1', 'ngOnInit', block);

      expect(result).toBe(true);
      const door = service.getDoorStates()().get('door-1')!;
      const slot = door.hookSlots.find((s: RuntimeHookSlot) => s.hookType === 'ngOnInit')!;
      expect(slot.behaviorBlock).not.toBeNull();
      expect(slot.behaviorBlock!.id).toBe('b-init');
    });

    it('returns false when door does not exist', () => {
      service.loadDoors([makeDoor({ id: 'door-1' })]);
      const result = service.assignBehavior('non-existent', 'ngOnInit', makeBlock('ngOnInit'));
      expect(result).toBe(false);
    });

    it('returns false when hook slot does not exist on door', () => {
      service.loadDoors([makeDoor({ id: 'door-1' })]);
      const result = service.assignBehavior('door-1', 'afterRender', makeBlock('afterRender'));
      expect(result).toBe(false);
    });

    it('returns false when slot already has a behavior block', () => {
      const block = makeBlock('ngOnInit', 'b-init');
      service.loadDoors([
        makeDoor({ id: 'door-1', hookSlots: [makeSlot('ngOnInit', 0, block)] }),
      ]);

      const result = service.assignBehavior('door-1', 'ngOnInit', makeBlock('ngOnInit', 'b-other'));
      expect(result).toBe(false);
    });
  });

  // =========================================================================
  // 4. removeBehavior
  // =========================================================================
  describe('removeBehavior', () => {
    it('clears behavior block from hook slot', () => {
      const block = makeBlock('ngOnInit', 'b-init');
      service.loadDoors([
        makeDoor({ id: 'door-1', hookSlots: [makeSlot('ngOnInit', 0, block), makeSlot('ngOnDestroy', 1)] }),
      ]);

      const result = service.removeBehavior('door-1', 'ngOnInit');

      expect(result).toBe(true);
      const door = service.getDoorStates()().get('door-1')!;
      const slot = door.hookSlots.find((s: RuntimeHookSlot) => s.hookType === 'ngOnInit')!;
      expect(slot.behaviorBlock).toBeNull();
    });

    it('returns false when door does not exist', () => {
      service.loadDoors([]);
      const result = service.removeBehavior('non-existent', 'ngOnInit');
      expect(result).toBe(false);
    });

    it('returns false when slot has no behavior block', () => {
      service.loadDoors([makeDoor({ id: 'door-1' })]);
      const result = service.removeBehavior('door-1', 'ngOnInit');
      expect(result).toBe(false);
    });

    it('returns false when hook slot does not exist on door', () => {
      service.loadDoors([makeDoor({ id: 'door-1' })]);
      const result = service.removeBehavior('door-1', 'afterRender');
      expect(result).toBe(false);
    });
  });

  // =========================================================================
  // 5. validateHookOrder
  // =========================================================================
  describe('validateHookOrder', () => {
    it('returns valid: true when hooks are in correct Angular lifecycle order', () => {
      service.loadDoors([
        makeDoor({
          id: 'door-1',
          hookSlots: [
            makeSlot('ngOnInit', 0, makeBlock('ngOnInit', 'b-init')),
            makeSlot('ngOnDestroy', 1, makeBlock('ngOnDestroy', 'b-destroy')),
          ],
        }),
      ]);

      const result = service.validateHookOrder('door-1');

      expect(result.valid).toBe(true);
      expect(result.misplacedHooks).toHaveLength(0);
    });

    it('returns valid: false when hooks are in wrong order (ngOnDestroy before ngOnInit)', () => {
      service.loadDoors([
        makeDoor({
          id: 'door-1',
          hookSlots: [
            makeSlot('ngOnDestroy', 0, makeBlock('ngOnDestroy', 'b-destroy')),
            makeSlot('ngOnInit', 1, makeBlock('ngOnInit', 'b-init')),
          ],
        }),
      ]);

      const result = service.validateHookOrder('door-1');

      expect(result.valid).toBe(false);
      expect(result.misplacedHooks.length).toBeGreaterThan(0);
    });

    it('returns valid: true when only one hook is assigned', () => {
      service.loadDoors([
        makeDoor({
          id: 'door-1',
          hookSlots: [
            makeSlot('ngOnInit', 0, makeBlock('ngOnInit', 'b-init')),
            makeSlot('ngOnDestroy', 1),
          ],
        }),
      ]);

      const result = service.validateHookOrder('door-1');
      expect(result.valid).toBe(true);
    });

    it('returns valid: true when no hooks are assigned', () => {
      service.loadDoors([makeDoor({ id: 'door-1' })]);
      const result = service.validateHookOrder('door-1');
      expect(result.valid).toBe(true);
    });

    it('returns correctOrder matching LIFECYCLE_HOOK_ORDER', () => {
      service.loadDoors([makeDoor({ id: 'door-1' })]);
      const result = service.validateHookOrder('door-1');
      expect(result.correctOrder).toEqual(LIFECYCLE_HOOK_ORDER);
    });

    it('returns actualOrder reflecting assigned hook types in execution order', () => {
      service.loadDoors([
        makeDoor({
          id: 'door-1',
          hookSlots: [
            makeSlot('ngOnInit', 0, makeBlock('ngOnInit', 'b-init')),
            makeSlot('ngOnDestroy', 1, makeBlock('ngOnDestroy', 'b-destroy')),
          ],
        }),
      ]);

      const result = service.validateHookOrder('door-1');
      expect(result.actualOrder).toEqual(['ngOnInit', 'ngOnDestroy']);
    });

    it('returns misplacedHooks with expected and actual indices', () => {
      service.loadDoors([
        makeDoor({
          id: 'door-1',
          hookSlots: [
            makeSlot('ngOnDestroy', 0, makeBlock('ngOnDestroy', 'b-destroy')),
            makeSlot('ngOnInit', 1, makeBlock('ngOnInit', 'b-init')),
          ],
        }),
      ]);

      const result = service.validateHookOrder('door-1');
      // ngOnDestroy is at index 0 but should be after ngOnInit
      const misplaced = result.misplacedHooks;
      expect(misplaced.length).toBeGreaterThan(0);
      expect(misplaced.some((m: { hook: LifecycleHook }) => m.hook === 'ngOnDestroy')).toBe(true);
    });

    it('throws when door does not exist', () => {
      service.loadDoors([]);
      expect(() => service.validateHookOrder('non-existent')).toThrow();
    });
  });

  // =========================================================================
  // 6. getCorrectHookOrder
  // =========================================================================
  describe('getCorrectHookOrder', () => {
    it('returns LIFECYCLE_HOOK_ORDER constant', () => {
      const order = service.getCorrectHookOrder();
      expect(order).toEqual(LIFECYCLE_HOOK_ORDER);
    });

    it('returns a readonly array (same reference as LIFECYCLE_HOOK_ORDER)', () => {
      const order = service.getCorrectHookOrder();
      expect(order).toBe(LIFECYCLE_HOOK_ORDER);
    });
  });

  // =========================================================================
  // 7. applyDirective
  // =========================================================================
  describe('applyDirective', () => {
    it('adds directive to door appliedDirectives', () => {
      service.loadDoors([makeDoor({ id: 'door-1' })]);
      const directive = makeDirective();

      const result = service.applyDirective('door-1', directive);

      expect(result).toBe(true);
      const door = service.getDoorStates()().get('door-1')!;
      expect(door.appliedDirectives).toHaveLength(1);
      expect(door.appliedDirectives[0].name).toBe('appAutoLock');
    });

    it('returns false when door does not exist', () => {
      service.loadDoors([]);
      const result = service.applyDirective('non-existent', makeDirective());
      expect(result).toBe(false);
    });

    it('returns false when directive is already applied to door', () => {
      service.loadDoors([makeDoor({ id: 'door-1' })]);
      const directive = makeDirective();

      service.applyDirective('door-1', directive);
      const result = service.applyDirective('door-1', directive);

      expect(result).toBe(false);
    });

    it('allows different directives on same door', () => {
      service.loadDoors([makeDoor({ id: 'door-1' })]);

      service.applyDirective('door-1', makeDirective({ name: 'appAutoLock' }));
      service.applyDirective('door-1', makeDirective({ name: 'appHighlight' }));

      const door = service.getDoorStates()().get('door-1')!;
      expect(door.appliedDirectives).toHaveLength(2);
    });
  });

  // =========================================================================
  // 8. simulateScenario (engine interface method)
  // =========================================================================
  describe('simulateScenario', () => {
    it('returns passed: true when all steps match expected door states', () => {
      const initBlock = makeBlock('ngOnInit', 'b-init');
      const doors = [
        makeRuntimeDoor({
          id: 'door-1',
          currentState: 'closed',
          hookSlots: [makeSlot('ngOnInit', 0, initBlock)],
        }),
      ];
      // Use the engine-facing interface method (takes doors, scenario, expectedBehavior)
      const scenario = makeScenario({
        id: 'sc-1',
        steps: [
          { event: 'ngOnInit fires', expectedDoorStates: [{ doorId: 'door-1', expectedState: 'open' }] },
        ],
      });
      const expected = [
        makeExpectedBehavior({
          scenarioId: 'sc-1',
          hooksFired: ['ngOnInit'],
          finalDoorStates: [{ doorId: 'door-1', expectedState: 'open' }],
        }),
      ];

      const result = service.simulateScenario(doors, scenario, expected);

      expect(result.scenarioId).toBe('sc-1');
      expect(result.passed).toBe(true);
    });

    it('returns passed: false when hook order is invalid', () => {
      const doors = [
        makeRuntimeDoor({
          id: 'door-1',
          currentState: 'closed',
          hookSlots: [
            makeSlot('ngOnDestroy', 0, makeBlock('ngOnDestroy', 'b-destroy')),
            makeSlot('ngOnInit', 1, makeBlock('ngOnInit', 'b-init')),
          ],
        }),
      ];
      const scenario = makeScenario();
      const expected = [makeExpectedBehavior()];

      const result = service.simulateScenario(doors, scenario, expected);

      expect(result.passed).toBe(false);
      expect(result.stepResults).toHaveLength(0);
    });

    it('returns passed: false when step door states do not match', () => {
      // Door starts closed, only ngOnDestroy block -> stays closed
      // but scenario expects 'open'
      const doors = [
        makeRuntimeDoor({
          id: 'door-1',
          currentState: 'closed',
          hookSlots: [makeSlot('ngOnDestroy', 0, makeBlock('ngOnDestroy', 'b-destroy'))],
        }),
      ];
      const scenario = makeScenario({
        id: 'sc-1',
        steps: [
          { event: 'init', expectedDoorStates: [{ doorId: 'door-1', expectedState: 'open' }] },
        ],
      });
      const expected = [
        makeExpectedBehavior({
          scenarioId: 'sc-1',
          hooksFired: ['ngOnInit'],
          finalDoorStates: [{ doorId: 'door-1', expectedState: 'open' }],
        }),
      ];

      const result = service.simulateScenario(doors, scenario, expected);
      expect(result.passed).toBe(false);
    });

    it('returns passed: false when fired hooks do not match expected', () => {
      const doors = [
        makeRuntimeDoor({
          id: 'door-1',
          currentState: 'closed',
          hookSlots: [makeSlot('ngOnInit', 0, makeBlock('ngOnInit', 'b-init'))],
        }),
      ];
      const scenario = makeScenario({
        id: 'sc-1',
        steps: [
          { event: 'init', expectedDoorStates: [{ doorId: 'door-1', expectedState: 'open' }] },
        ],
      });
      // Expected hooksFired includes ngOnDestroy but it was never fired
      const expected = [
        makeExpectedBehavior({
          scenarioId: 'sc-1',
          hooksFired: ['ngOnInit', 'ngOnDestroy'],
          finalDoorStates: [{ doorId: 'door-1', expectedState: 'open' }],
        }),
      ];

      const result = service.simulateScenario(doors, scenario, expected);
      expect(result.passed).toBe(false);
    });

    it('applies directives when deriving door states', () => {
      const runtimeDoors = [
        makeRuntimeDoor({
          id: 'door-1',
          currentState: 'closed',
          hookSlots: [makeSlot('ngOnInit', 0, makeBlock('ngOnInit', 'b-init'))],
          appliedDirectives: [makeDirective({ name: 'appAutoLock', behavior: 'lock door' })],
        }),
      ];

      const scenario = makeScenario({
        id: 'sc-1',
        steps: [
          { event: 'init', expectedDoorStates: [{ doorId: 'door-1', expectedState: 'locked' }] },
        ],
      });
      const expected = [
        makeExpectedBehavior({
          scenarioId: 'sc-1',
          hooksFired: ['ngOnInit'],
          finalDoorStates: [{ doorId: 'door-1', expectedState: 'locked' }],
        }),
      ];

      const result = service.simulateScenario(runtimeDoors, scenario, expected);
      expect(result.passed).toBe(true);
    });

    it('returns scenarioId matching the input scenario', () => {
      const doors = [
        makeRuntimeDoor({
          id: 'door-1',
          currentState: 'closed',
          hookSlots: [makeSlot('ngOnInit', 0, makeBlock('ngOnInit', 'b-init'))],
        }),
      ];
      const scenario = makeScenario({ id: 'my-scenario' });
      const expected = [makeExpectedBehavior({ scenarioId: 'my-scenario' })];

      const result = service.simulateScenario(doors, scenario, expected);
      expect(result.scenarioId).toBe('my-scenario');
    });

    it('returns step results with per-door match details', () => {
      const initBlock = makeBlock('ngOnInit', 'b-init');
      const doors = [
        makeRuntimeDoor({
          id: 'door-1',
          currentState: 'closed',
          hookSlots: [makeSlot('ngOnInit', 0, initBlock)],
        }),
      ];
      const scenario = makeScenario({
        id: 'sc-1',
        steps: [
          { event: 'ngOnInit fires', expectedDoorStates: [{ doorId: 'door-1', expectedState: 'open' }] },
        ],
      });
      const expected = [
        makeExpectedBehavior({
          scenarioId: 'sc-1',
          hooksFired: ['ngOnInit'],
          finalDoorStates: [{ doorId: 'door-1', expectedState: 'open' }],
        }),
      ];

      const result = service.simulateScenario(doors, scenario, expected);
      expect(result.stepResults).toHaveLength(1);
      expect(result.stepResults[0].event).toBe('ngOnInit fires');
      expect(result.stepResults[0].passed).toBe(true);
      expect(result.stepResults[0].doorResults[0].match).toBe(true);
    });
  });

  // =========================================================================
  // 9. getDoorStates
  // =========================================================================
  describe('getDoorStates', () => {
    it('returns a signal (read-only)', () => {
      const states = service.getDoorStates();
      expect(typeof states).toBe('function');
    });

    it('reflects changes after loadDoors', () => {
      service.loadDoors([makeDoor({ id: 'door-1' })]);
      const states = service.getDoorStates()();
      expect(states.size).toBe(1);
    });

    it('reflects changes after assignBehavior', () => {
      service.loadDoors([makeDoor({ id: 'door-1' })]);
      service.assignBehavior('door-1', 'ngOnInit', makeBlock('ngOnInit'));

      const door = service.getDoorStates()().get('door-1')!;
      expect(door.hookSlots.find((s: RuntimeHookSlot) => s.hookType === 'ngOnInit')!.behaviorBlock).not.toBeNull();
    });
  });

  // =========================================================================
  // 10. reset
  // =========================================================================
  describe('reset', () => {
    it('clears all door state', () => {
      service.loadDoors([makeDoor({ id: 'door-1' }), makeDoor({ id: 'door-2' })]);
      service.reset();

      expect(service.getDoorStates()().size).toBe(0);
    });

    it('is idempotent (calling reset twice does not throw)', () => {
      service.reset();
      expect(() => service.reset()).not.toThrow();
    });

    it('allows loadDoors after reset', () => {
      service.loadDoors([makeDoor({ id: 'door-1' })]);
      service.reset();
      service.loadDoors([makeDoor({ id: 'door-2' })]);

      expect(service.getDoorStates()().size).toBe(1);
      expect(service.getDoorStates()().has('door-2')).toBe(true);
    });
  });
});
