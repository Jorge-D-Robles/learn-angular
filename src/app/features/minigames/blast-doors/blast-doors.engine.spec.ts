import {
  BlastDoorsEngine,
  PERFECT_SCORE_MULTIPLIER,
  SECOND_ATTEMPT_MULTIPLIER,
  THIRD_ATTEMPT_MULTIPLIER,
  DEFAULT_MAX_SIMULATIONS,
  type PlaceBehaviorAction,
  type RemoveBehaviorAction,
  type ApplyDirectiveAction,
  type RemoveDirectiveAction,
} from './blast-doors.engine';
import type {
  BlastDoorsLevelData,
  BlastDoorsLifecycleService,
  BehaviorBlock,
  BlastDoor,
  DirectiveSpec,
  DoorScenario,
  ExpectedBehavior,
  HookSlot,
  ScenarioResult,
} from './blast-doors.types';
import {
  MinigameStatus,
  DifficultyTier,
  type MinigameLevel,
} from '../../../core/minigame/minigame.types';
import type { MinigameEngineConfig } from '../../../core/minigame/minigame-engine';

// ---------------------------------------------------------------------------
// Test data helpers
// ---------------------------------------------------------------------------

function makeBlock(hookTarget: HookSlot['hookType'], id = 'b-1'): BehaviorBlock {
  return { id, description: 'test', code: `this.door.${hookTarget}()`, hookTarget };
}

function makeSlot(
  hookType: HookSlot['hookType'],
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
      makeSlot('ngOnInit', 0, makeBlock('ngOnInit', 'b-init')),
      makeSlot('ngOnDestroy', 1, makeBlock('ngOnDestroy', 'b-destroy')),
    ],
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

function createTestLevelData(
  overrides?: Partial<BlastDoorsLevelData>,
): BlastDoorsLevelData {
  const door1 = makeDoor({
    id: 'door-1',
    hookSlots: [
      makeSlot('ngOnInit', 0, makeBlock('ngOnInit', 'b-init')),
      makeSlot('ngOnDestroy', 1, makeBlock('ngOnDestroy', 'b-destroy')),
    ],
  });
  const door2 = makeDoor({
    id: 'door-2',
    position: 'south-airlock',
    hookSlots: [
      makeSlot('ngOnInit', 0),
      makeSlot('ngOnDestroy', 1),
    ],
  });

  return {
    doors: [door1, door2],
    hooks: ['ngOnInit', 'ngOnDestroy'],
    directives: [makeDirective()],
    scenarios: [makeScenario()],
    expectedBehavior: [makeExpectedBehavior()],
    ...overrides,
  };
}

function createLevel(
  data: BlastDoorsLevelData,
): MinigameLevel<BlastDoorsLevelData> {
  return {
    id: 'bd-test-01',
    gameId: 'blast-doors',
    tier: DifficultyTier.Basic,
    conceptIntroduced: 'Lifecycle Hooks',
    description: 'Test level',
    data,
  };
}

function createEngine(
  config?: Partial<MinigameEngineConfig>,
): BlastDoorsEngine {
  return new BlastDoorsEngine(config);
}

function initAndStart(
  engine: BlastDoorsEngine,
  data?: BlastDoorsLevelData,
): void {
  engine.initialize(createLevel(data ?? createTestLevelData()));
  engine.start();
}

/**
 * Creates level data where door-1 starts closed, has ngOnInit block placed,
 * and the scenario expects the door to open. Only one hook (ngOnInit) is used
 * so there is no subsequent ngOnDestroy to close it again.
 */
function createSolvableLevelData(): BlastDoorsLevelData {
  const initBlock = makeBlock('ngOnInit', 'b-init');

  return {
    doors: [
      makeDoor({
        id: 'door-1',
        currentState: 'closed',
        hookSlots: [
          makeSlot('ngOnInit', 0, initBlock),
        ],
      }),
    ],
    hooks: ['ngOnInit'],
    directives: [],
    scenarios: [
      makeScenario({
        id: 'sc-1',
        steps: [
          {
            event: 'ngOnInit fires',
            expectedDoorStates: [{ doorId: 'door-1', expectedState: 'open' }],
          },
        ],
      }),
    ],
    expectedBehavior: [
      makeExpectedBehavior({
        scenarioId: 'sc-1',
        hooksFired: ['ngOnInit'],
        finalDoorStates: [{ doorId: 'door-1', expectedState: 'open' }],
      }),
    ],
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BlastDoorsEngine', () => {
  // --- 1. Initialization ---

  describe('Initialization', () => {
    it('should initialize with Loading status', () => {
      const engine = createEngine();
      engine.initialize(createLevel(createTestLevelData()));

      expect(engine.status()).toBe(MinigameStatus.Loading);
    });

    it('should populate runtimeDoors signal from level data doors', () => {
      const engine = createEngine();
      engine.initialize(createLevel(createTestLevelData()));

      expect(engine.runtimeDoors()).toHaveLength(2);
      expect(engine.runtimeDoors()[0].id).toBe('door-1');
      expect(engine.runtimeDoors()[1].id).toBe('door-2');
    });

    it('should populate availableBehaviors from door hookSlots (deduped by id)', () => {
      const engine = createEngine();
      engine.initialize(createLevel(createTestLevelData()));

      // Default test data: door-1 has b-init and b-destroy; door-2 has no blocks
      const behaviors = engine.availableBehaviors();
      expect(behaviors.length).toBe(2);
      const ids = behaviors.map(b => b.id);
      expect(ids).toContain('b-init');
      expect(ids).toContain('b-destroy');
    });

    it('should start with simulationCount at 0 and simulationsRemaining at 3', () => {
      const engine = createEngine();
      engine.initialize(createLevel(createTestLevelData()));

      expect(engine.simulationCount()).toBe(0);
      expect(engine.simulationsRemaining()).toBe(DEFAULT_MAX_SIMULATIONS);
    });
  });

  // --- 2. Place Behavior -- valid ---

  describe('Place Behavior - valid', () => {
    it('should assign behavior block to correct hook slot on door', () => {
      const data = createTestLevelData({
        doors: [
          makeDoor({
            id: 'door-1',
            hookSlots: [
              makeSlot('ngOnInit', 0), // empty slot
              makeSlot('ngOnDestroy', 1, makeBlock('ngOnDestroy', 'b-destroy')), // source for pool
            ],
          }),
          makeDoor({
            id: 'door-2',
            hookSlots: [
              makeSlot('ngOnInit', 0, makeBlock('ngOnInit', 'b-init')), // source for pool
            ],
          }),
        ],
      });
      const engine = createEngine();
      initAndStart(engine, data);

      engine.submitAction({
        type: 'place-behavior',
        doorId: 'door-1',
        hookType: 'ngOnInit',
        behaviorBlockId: 'b-init',
      } as PlaceBehaviorAction);

      const door = engine.runtimeDoors().find(d => d.id === 'door-1')!;
      const slot = door.hookSlots.find(s => s.hookType === 'ngOnInit')!;
      expect(slot.behaviorBlock).not.toBeNull();
      expect(slot.behaviorBlock!.id).toBe('b-init');
    });

    it('should return valid: true, scoreChange: 0, livesChange: 0', () => {
      const data = createTestLevelData({
        doors: [
          makeDoor({
            id: 'door-1',
            hookSlots: [
              makeSlot('ngOnInit', 0),
              makeSlot('ngOnDestroy', 1, makeBlock('ngOnDestroy', 'b-destroy')),
            ],
          }),
          makeDoor({
            id: 'door-2',
            hookSlots: [makeSlot('ngOnInit', 0, makeBlock('ngOnInit', 'b-init'))],
          }),
        ],
      });
      const engine = createEngine();
      initAndStart(engine, data);

      const result = engine.submitAction({
        type: 'place-behavior',
        doorId: 'door-1',
        hookType: 'ngOnInit',
        behaviorBlockId: 'b-init',
      } as PlaceBehaviorAction);

      expect(result.valid).toBe(true);
      expect(result.scoreChange).toBe(0);
      expect(result.livesChange).toBe(0);
    });

    it('should not allow placing in a slot that already has a behavior block', () => {
      const engine = createEngine();
      initAndStart(engine);

      // door-1's ngOnInit slot already has b-init from test data
      const result = engine.submitAction({
        type: 'place-behavior',
        doorId: 'door-1',
        hookType: 'ngOnInit',
        behaviorBlockId: 'b-init',
      } as PlaceBehaviorAction);

      expect(result.valid).toBe(false);
    });
  });

  // --- 3. Place Behavior -- invalid ---

  describe('Place Behavior - invalid', () => {
    it('should return invalid when doorId does not exist', () => {
      const engine = createEngine();
      initAndStart(engine);

      const result = engine.submitAction({
        type: 'place-behavior',
        doorId: 'non-existent',
        hookType: 'ngOnInit',
        behaviorBlockId: 'b-init',
      } as PlaceBehaviorAction);

      expect(result.valid).toBe(false);
    });

    it('should return invalid when behaviorBlockId does not exist', () => {
      const engine = createEngine();
      initAndStart(engine);

      const result = engine.submitAction({
        type: 'place-behavior',
        doorId: 'door-1',
        hookType: 'ngOnInit',
        behaviorBlockId: 'non-existent',
      } as PlaceBehaviorAction);

      expect(result.valid).toBe(false);
    });

    it('should return invalid when hookType does not exist on door', () => {
      const engine = createEngine();
      initAndStart(engine);

      const result = engine.submitAction({
        type: 'place-behavior',
        doorId: 'door-1',
        hookType: 'afterRender',
        behaviorBlockId: 'b-init',
      } as PlaceBehaviorAction);

      expect(result.valid).toBe(false);
    });
  });

  // --- 4. Remove Behavior ---

  describe('Remove Behavior', () => {
    it('should clear behavior block from hook slot', () => {
      const engine = createEngine();
      initAndStart(engine);

      // door-1 has b-init in ngOnInit slot
      engine.submitAction({
        type: 'remove-behavior',
        doorId: 'door-1',
        hookType: 'ngOnInit',
      } as RemoveBehaviorAction);

      const door = engine.runtimeDoors().find(d => d.id === 'door-1')!;
      const slot = door.hookSlots.find(s => s.hookType === 'ngOnInit')!;
      expect(slot.behaviorBlock).toBeNull();
    });

    it('should return invalid when slot has no behavior block', () => {
      const engine = createEngine();
      initAndStart(engine);

      // door-2 has empty slots
      const result = engine.submitAction({
        type: 'remove-behavior',
        doorId: 'door-2',
        hookType: 'ngOnInit',
      } as RemoveBehaviorAction);

      expect(result.valid).toBe(false);
    });

    it('should return invalid when doorId does not exist', () => {
      const engine = createEngine();
      initAndStart(engine);

      const result = engine.submitAction({
        type: 'remove-behavior',
        doorId: 'non-existent',
        hookType: 'ngOnInit',
      } as RemoveBehaviorAction);

      expect(result.valid).toBe(false);
    });
  });

  // --- 5. Apply Directive -- valid ---

  describe('Apply Directive - valid', () => {
    it('should add directive to door appliedDirectives', () => {
      const engine = createEngine();
      initAndStart(engine);

      engine.submitAction({
        type: 'apply-directive',
        doorId: 'door-1',
        directiveName: 'appAutoLock',
      } as ApplyDirectiveAction);

      const door = engine.runtimeDoors().find(d => d.id === 'door-1')!;
      expect(door.appliedDirectives).toHaveLength(1);
      expect(door.appliedDirectives[0].name).toBe('appAutoLock');
    });

    it('should return invalid for duplicate directive on same door', () => {
      const engine = createEngine();
      initAndStart(engine);

      engine.submitAction({
        type: 'apply-directive',
        doorId: 'door-1',
        directiveName: 'appAutoLock',
      } as ApplyDirectiveAction);

      const result = engine.submitAction({
        type: 'apply-directive',
        doorId: 'door-1',
        directiveName: 'appAutoLock',
      } as ApplyDirectiveAction);

      expect(result.valid).toBe(false);
    });
  });

  // --- 6. Apply Directive -- invalid ---

  describe('Apply Directive - invalid', () => {
    it('should return invalid when doorId does not exist', () => {
      const engine = createEngine();
      initAndStart(engine);

      const result = engine.submitAction({
        type: 'apply-directive',
        doorId: 'non-existent',
        directiveName: 'appAutoLock',
      } as ApplyDirectiveAction);

      expect(result.valid).toBe(false);
    });

    it('should return invalid when directiveName does not exist in available directives', () => {
      const engine = createEngine();
      initAndStart(engine);

      const result = engine.submitAction({
        type: 'apply-directive',
        doorId: 'door-1',
        directiveName: 'nonExistentDirective',
      } as ApplyDirectiveAction);

      expect(result.valid).toBe(false);
    });
  });

  // --- 7. Remove Directive ---

  describe('Remove Directive', () => {
    it('should remove directive from door appliedDirectives', () => {
      const engine = createEngine();
      initAndStart(engine);

      engine.submitAction({
        type: 'apply-directive',
        doorId: 'door-1',
        directiveName: 'appAutoLock',
      } as ApplyDirectiveAction);

      engine.submitAction({
        type: 'remove-directive',
        doorId: 'door-1',
        directiveName: 'appAutoLock',
      } as RemoveDirectiveAction);

      const door = engine.runtimeDoors().find(d => d.id === 'door-1')!;
      expect(door.appliedDirectives).toHaveLength(0);
    });

    it('should return invalid when directive is not applied to door', () => {
      const engine = createEngine();
      initAndStart(engine);

      const result = engine.submitAction({
        type: 'remove-directive',
        doorId: 'door-1',
        directiveName: 'appAutoLock',
      } as RemoveDirectiveAction);

      expect(result.valid).toBe(false);
    });
  });

  // --- 8. Simulation -- all correct ---

  describe('Simulation - all correct', () => {
    it('should complete when all scenarios pass', () => {
      const engine = createEngine();
      initAndStart(engine, createSolvableLevelData());

      engine.simulate();

      expect(engine.status()).toBe(MinigameStatus.Won);
    });

    it('should award maxScore on first-attempt success', () => {
      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine, createSolvableLevelData());

      engine.simulate();

      expect(engine.score()).toBe(1000 * PERFECT_SCORE_MULTIPLIER);
    });

    it('should decrement simulationsRemaining by 1', () => {
      const engine = createEngine();
      initAndStart(engine, createSolvableLevelData());

      engine.simulate();

      expect(engine.simulationsRemaining()).toBe(DEFAULT_MAX_SIMULATIONS - 1);
    });
  });

  // --- 9. Simulation -- failures ---

  describe('Simulation - failures', () => {
    it('should not complete when scenario step door states mismatch', () => {
      // Door starts closed, ngOnDestroy block in slot -> stays closed,
      // but scenario expects 'open'
      const data: BlastDoorsLevelData = {
        doors: [
          makeDoor({
            id: 'door-1',
            currentState: 'closed',
            hookSlots: [
              makeSlot('ngOnDestroy', 0, makeBlock('ngOnDestroy', 'b-destroy')),
            ],
          }),
        ],
        hooks: ['ngOnDestroy'],
        directives: [],
        scenarios: [
          makeScenario({
            id: 'sc-1',
            steps: [
              { event: 'component init', expectedDoorStates: [{ doorId: 'door-1', expectedState: 'open' }] },
            ],
          }),
        ],
        expectedBehavior: [
          makeExpectedBehavior({
            scenarioId: 'sc-1',
            hooksFired: ['ngOnInit'],
            finalDoorStates: [{ doorId: 'door-1', expectedState: 'open' }],
          }),
        ],
      };

      const engine = createEngine();
      initAndStart(engine, data);

      engine.simulate();

      expect(engine.status()).toBe(MinigameStatus.Playing);
    });

    it('should fail when all simulation attempts exhausted', () => {
      // Create a level that always fails
      const data: BlastDoorsLevelData = {
        doors: [
          makeDoor({
            id: 'door-1',
            currentState: 'closed',
            hookSlots: [makeSlot('ngOnDestroy', 0, makeBlock('ngOnDestroy', 'b-destroy'))],
          }),
        ],
        hooks: ['ngOnDestroy'],
        directives: [],
        scenarios: [
          makeScenario({
            id: 'sc-1',
            steps: [
              { event: 'component init', expectedDoorStates: [{ doorId: 'door-1', expectedState: 'open' }] },
            ],
          }),
        ],
        expectedBehavior: [
          makeExpectedBehavior({
            scenarioId: 'sc-1',
            hooksFired: ['ngOnInit'],
            finalDoorStates: [{ doorId: 'door-1', expectedState: 'open' }],
          }),
        ],
      };

      const engine = createEngine();
      initAndStart(engine, data);

      engine.simulate(); // attempt 1
      engine.simulate(); // attempt 2
      engine.simulate(); // attempt 3

      expect(engine.simulationsRemaining()).toBe(0);
      expect(engine.status()).toBe(MinigameStatus.Lost);
    });

    it('should detect hook order violations', () => {
      // ngOnDestroy before ngOnInit (wrong order)
      const data: BlastDoorsLevelData = {
        doors: [
          makeDoor({
            id: 'door-1',
            currentState: 'closed',
            hookSlots: [
              makeSlot('ngOnDestroy', 0, makeBlock('ngOnDestroy', 'b-destroy')),
              makeSlot('ngOnInit', 1, makeBlock('ngOnInit', 'b-init')),
            ],
          }),
        ],
        hooks: ['ngOnInit', 'ngOnDestroy'],
        directives: [],
        scenarios: [
          makeScenario({
            id: 'sc-1',
            steps: [
              { event: 'init', expectedDoorStates: [{ doorId: 'door-1', expectedState: 'open' }] },
            ],
          }),
        ],
        expectedBehavior: [
          makeExpectedBehavior({
            scenarioId: 'sc-1',
            hooksFired: ['ngOnInit', 'ngOnDestroy'],
            finalDoorStates: [{ doorId: 'door-1', expectedState: 'open' }],
          }),
        ],
      };

      const engine = createEngine();
      initAndStart(engine, data);

      const result = engine.simulate();

      expect(result).not.toBeNull();
      expect(result!.allPassed).toBe(false);
    });
  });

  // --- 10. Simulation -- multi-attempt scoring ---

  describe('Simulation - multi-attempt scoring', () => {
    it('should award maxScore * 0.4 on second-attempt success', () => {
      // First attempt fails (wrong blocks), second succeeds
      const initBlock = makeBlock('ngOnInit', 'b-init');
      const destroyBlock = makeBlock('ngOnDestroy', 'b-destroy');

      const data: BlastDoorsLevelData = {
        doors: [
          makeDoor({
            id: 'door-1',
            currentState: 'closed',
            hookSlots: [
              makeSlot('ngOnInit', 0, destroyBlock), // wrong block -> will fail
              makeSlot('ngOnDestroy', 1, initBlock),  // source for pool
            ],
          }),
        ],
        hooks: ['ngOnInit', 'ngOnDestroy'],
        directives: [],
        scenarios: [
          makeScenario({
            id: 'sc-1',
            steps: [
              { event: 'init', expectedDoorStates: [{ doorId: 'door-1', expectedState: 'open' }] },
            ],
          }),
        ],
        expectedBehavior: [
          makeExpectedBehavior({
            scenarioId: 'sc-1',
            hooksFired: ['ngOnInit'],
            finalDoorStates: [{ doorId: 'door-1', expectedState: 'open' }],
          }),
        ],
      };

      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine, data);

      // First attempt: mismatch (ngOnDestroy target in ngOnInit slot -> hookTarget !== hookType, so no state change)
      engine.simulate();
      expect(engine.status()).toBe(MinigameStatus.Playing);

      // Fix: remove wrong block, place correct one
      engine.submitAction({ type: 'remove-behavior', doorId: 'door-1', hookType: 'ngOnInit' } as RemoveBehaviorAction);
      engine.submitAction({ type: 'remove-behavior', doorId: 'door-1', hookType: 'ngOnDestroy' } as RemoveBehaviorAction);
      engine.submitAction({ type: 'place-behavior', doorId: 'door-1', hookType: 'ngOnInit', behaviorBlockId: 'b-init' } as PlaceBehaviorAction);

      // Second attempt: correct
      engine.simulate();

      expect(engine.score()).toBe(Math.round(1000 * SECOND_ATTEMPT_MULTIPLIER));
      expect(engine.status()).toBe(MinigameStatus.Won);
    });

    it('should award maxScore * 0.2 on third-attempt success', () => {
      const initBlock = makeBlock('ngOnInit', 'b-init');
      const destroyBlock = makeBlock('ngOnDestroy', 'b-destroy');

      const data: BlastDoorsLevelData = {
        doors: [
          makeDoor({
            id: 'door-1',
            currentState: 'closed',
            hookSlots: [
              makeSlot('ngOnInit', 0, destroyBlock), // wrong initially
              makeSlot('ngOnDestroy', 1, initBlock),
            ],
          }),
        ],
        hooks: ['ngOnInit', 'ngOnDestroy'],
        directives: [],
        scenarios: [
          makeScenario({
            id: 'sc-1',
            steps: [
              { event: 'init', expectedDoorStates: [{ doorId: 'door-1', expectedState: 'open' }] },
            ],
          }),
        ],
        expectedBehavior: [
          makeExpectedBehavior({
            scenarioId: 'sc-1',
            hooksFired: ['ngOnInit'],
            finalDoorStates: [{ doorId: 'door-1', expectedState: 'open' }],
          }),
        ],
      };

      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine, data);

      // Attempts 1 and 2 fail
      engine.simulate();
      engine.simulate();

      // Fix on attempt 3
      engine.submitAction({ type: 'remove-behavior', doorId: 'door-1', hookType: 'ngOnInit' } as RemoveBehaviorAction);
      engine.submitAction({ type: 'remove-behavior', doorId: 'door-1', hookType: 'ngOnDestroy' } as RemoveBehaviorAction);
      engine.submitAction({ type: 'place-behavior', doorId: 'door-1', hookType: 'ngOnInit', behaviorBlockId: 'b-init' } as PlaceBehaviorAction);

      engine.simulate();

      expect(engine.score()).toBe(Math.round(1000 * THIRD_ATTEMPT_MULTIPLIER));
      expect(engine.status()).toBe(MinigameStatus.Won);
    });
  });

  // --- 11. Edge cases ---

  describe('Edge cases', () => {
    it('should return null from simulate() when not Playing', () => {
      const engine = createEngine();
      engine.initialize(createLevel(createTestLevelData()));
      // Still in Loading status, not started

      const result = engine.simulate();

      expect(result).toBeNull();
    });

    it('should handle empty scenarios (complete immediately)', () => {
      const data = createTestLevelData({
        scenarios: [],
        expectedBehavior: [],
      });
      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine, data);

      engine.simulate();

      expect(engine.status()).toBe(MinigameStatus.Won);
      expect(engine.score()).toBe(1000 * PERFECT_SCORE_MULTIPLIER);
    });

    it('should return invalid for unknown action types', () => {
      const engine = createEngine();
      initAndStart(engine);

      const result = engine.submitAction({ type: 'unknown-action' });

      expect(result.valid).toBe(false);
      expect(result.scoreChange).toBe(0);
      expect(result.livesChange).toBe(0);
    });

    it('should restore initial state on reset', () => {
      const engine = createEngine();
      initAndStart(engine);

      // Modify state
      engine.submitAction({
        type: 'apply-directive',
        doorId: 'door-1',
        directiveName: 'appAutoLock',
      } as ApplyDirectiveAction);

      expect(engine.runtimeDoors()[0].appliedDirectives).toHaveLength(1);

      // Reset
      engine.reset();

      expect(engine.runtimeDoors()[0].appliedDirectives).toHaveLength(0);
      expect(engine.simulationCount()).toBe(0);
      expect(engine.simulationsRemaining()).toBe(DEFAULT_MAX_SIMULATIONS);
      expect(engine.status()).toBe(MinigameStatus.Playing);
    });
  });

  // --- 12. Service integration ---

  describe('Service integration', () => {
    function createMockService(): BlastDoorsLifecycleService {
      return {
        simulateScenario: vi.fn(),
        reset: vi.fn(),
      };
    }

    it('should accept lifecycle service in constructor', () => {
      const service = createMockService();
      const engine = new BlastDoorsEngine(undefined, service);

      expect(engine).toBeDefined();
    });

    it('should delegate to service on simulate()', () => {
      const service = createMockService();
      const mockResult: ScenarioResult = {
        scenarioId: 'sc-1',
        passed: true,
        stepResults: [],
      };
      (service.simulateScenario as ReturnType<typeof vi.fn>).mockReturnValue(mockResult);

      const engine = new BlastDoorsEngine({ maxScore: 1000 }, service);
      initAndStart(engine);

      engine.simulate();

      expect(service.simulateScenario).toHaveBeenCalledOnce();
    });

    it('should fall back to inline simulation when no service provided', () => {
      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine, createSolvableLevelData());

      const result = engine.simulate();

      expect(result).not.toBeNull();
      expect(result!.allPassed).toBe(true);
      expect(engine.status()).toBe(MinigameStatus.Won);
    });

    it('should call service reset on level load', () => {
      const service = createMockService();
      const engine = new BlastDoorsEngine(undefined, service);
      engine.initialize(createLevel(createTestLevelData()));

      expect(service.reset).toHaveBeenCalledOnce();
    });
  });

  // --- 13. Scoring constants ---

  describe('Scoring constants', () => {
    it('should define PERFECT_SCORE_MULTIPLIER, SECOND_ATTEMPT_MULTIPLIER, THIRD_ATTEMPT_MULTIPLIER, DEFAULT_MAX_SIMULATIONS', () => {
      expect(PERFECT_SCORE_MULTIPLIER).toBe(1.0);
      expect(SECOND_ATTEMPT_MULTIPLIER).toBe(0.4);
      expect(THIRD_ATTEMPT_MULTIPLIER).toBe(0.2);
      expect(DEFAULT_MAX_SIMULATIONS).toBe(3);
    });
  });
});
