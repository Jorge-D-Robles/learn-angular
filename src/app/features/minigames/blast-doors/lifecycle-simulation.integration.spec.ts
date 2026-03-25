// ---------------------------------------------------------------------------
// Integration tests: BlastDoorsLifecycleServiceImpl hook ordering & scenario simulation
// ---------------------------------------------------------------------------
// Exercises the lifecycle service against hand-crafted multi-door configurations
// and scenario simulations. Tests the full pipeline: load doors -> assign
// behaviors -> validate hook order -> simulate scenario -> check results.
//
// Distinct from blast-doors-lifecycle.service.spec.ts (unit tests with single
// door/hook operations) and level-data-compat.integration.spec.ts (engine
// pipeline with real level data).
// ---------------------------------------------------------------------------

import { BlastDoorsLifecycleServiceImpl } from './blast-doors-lifecycle.service';
import type {
  BlastDoor,
  BehaviorBlock,
  HookSlot,
  DirectiveSpec,
  DoorScenario,
  ExpectedBehavior,
  LifecycleHook,
  RuntimeBlastDoor,
} from './blast-doors.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createService(): BlastDoorsLifecycleServiceImpl {
  return new BlastDoorsLifecycleServiceImpl();
}

function behavior(id: string, description: string, code: string, hookTarget: LifecycleHook): BehaviorBlock {
  return { id, description, code, hookTarget };
}

function hookSlot(hookType: LifecycleHook, block: BehaviorBlock | null, executionOrder: number): HookSlot {
  return { hookType, behaviorBlock: block, executionOrder };
}

function door(id: string, position: string, hookSlots: HookSlot[]): BlastDoor {
  return { id, position, currentState: 'closed', hookSlots };
}

function directive(name: string, behaviorDesc: string): DirectiveSpec {
  return {
    name,
    type: 'attribute',
    inputs: [],
    hostListeners: [],
    hostBindings: [],
    behavior: behaviorDesc,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BlastDoorsLifecycleService integration (hook ordering & scenario simulation)', () => {
  let service: BlastDoorsLifecycleServiceImpl;

  beforeEach(() => {
    service = createService();
  });

  // =========================================================================
  // Test 1: Behaviors placed in correct lifecycle order pass validation
  // =========================================================================
  it('1. behaviors placed in correct lifecycle order pass validation', () => {
    const initBehavior = behavior('bh1', 'Initialize door', 'this.state = "open"', 'ngOnInit');
    const destroyBehavior = behavior('bh2', 'Cleanup door', 'this.sub.unsubscribe()', 'ngOnDestroy');

    // Correct order: ngOnInit (order=1) before ngOnDestroy (order=2)
    const d = door('d1', 'main-corridor', [
      hookSlot('ngOnInit', null, 1),
      hookSlot('ngOnDestroy', null, 2),
    ]);

    service.loadDoors([d]);

    // Assign behaviors in correct hooks
    expect(service.assignBehavior('d1', 'ngOnInit', initBehavior)).toBe(true);
    expect(service.assignBehavior('d1', 'ngOnDestroy', destroyBehavior)).toBe(true);

    // Validate hook order
    const result = service.validateHookOrder('d1');
    expect(result.valid).toBe(true);
    expect(result.actualOrder).toEqual(['ngOnInit', 'ngOnDestroy']);
    expect(result.misplacedHooks).toEqual([]);
  });

  // =========================================================================
  // Test 2: Behaviors in wrong order fail validation with specific error
  // =========================================================================
  it('2. behaviors in wrong order fail validation with specific error', () => {
    const destroyBehavior = behavior('bh1', 'Cleanup', 'this.sub.unsubscribe()', 'ngOnDestroy');
    const initBehavior = behavior('bh2', 'Init', 'this.state = "open"', 'ngOnInit');

    // Wrong order: ngOnDestroy (order=1) before ngOnInit (order=2)
    const d = door('d1', 'engineering-bay', [
      hookSlot('ngOnDestroy', null, 1),
      hookSlot('ngOnInit', null, 2),
    ]);

    service.loadDoors([d]);

    // Assign behaviors in the wrong-ordered slots
    expect(service.assignBehavior('d1', 'ngOnDestroy', destroyBehavior)).toBe(true);
    expect(service.assignBehavior('d1', 'ngOnInit', initBehavior)).toBe(true);

    // Validate hook order: should fail
    const result = service.validateHookOrder('d1');
    expect(result.valid).toBe(false);
    expect(result.actualOrder).toEqual(['ngOnDestroy', 'ngOnInit']);
    expect(result.misplacedHooks.length).toBeGreaterThan(0);
  });

  // =========================================================================
  // Test 3: Scenario simulation with correct hooks produces expected door states
  // =========================================================================
  it('3. scenario simulation with correct hooks produces expected door states', () => {
    const initBehavior = behavior('bh1', 'Open door on init', 'this.state = "open"', 'ngOnInit');

    const d = door('d1', 'main-corridor', [
      hookSlot('ngOnInit', null, 1),
    ]);

    service.loadDoors([d]);
    service.assignBehavior('d1', 'ngOnInit', initBehavior);

    // Get runtime doors from the service
    const doorStates = service.getDoorStates();
    const doors: RuntimeBlastDoor[] = Array.from(doorStates().values());

    const scenario: DoorScenario = {
      id: 'sc-1',
      trigger: 'Section power-up',
      steps: [
        { event: 'Power activated', expectedDoorStates: [{ doorId: 'd1', expectedState: 'open' }] },
      ],
    };

    const expectedBehavior: ExpectedBehavior[] = [
      {
        scenarioId: 'sc-1',
        hooksFired: ['ngOnInit'],
        finalDoorStates: [{ doorId: 'd1', expectedState: 'open' }],
      },
    ];

    const result = service.simulateScenario(doors, scenario, expectedBehavior);
    expect(result.passed).toBe(true);
    expect(result.scenarioId).toBe('sc-1');
    expect(result.stepResults.length).toBe(1);
    expect(result.stepResults[0].passed).toBe(true);
  });

  // =========================================================================
  // Test 4: Scenario with missing ngOnInit behavior causes door to remain closed
  // =========================================================================
  it('4. scenario with missing ngOnInit behavior causes door to remain closed', () => {
    // Door has a hook slot but no behavior assigned
    const d = door('d1', 'cargo-bay', [
      hookSlot('ngOnInit', null, 1),
    ]);

    service.loadDoors([d]);

    // Do NOT assign any behavior -- slot remains empty

    const doorStates = service.getDoorStates();
    const doors: RuntimeBlastDoor[] = Array.from(doorStates().values());

    const scenario: DoorScenario = {
      id: 'sc-2',
      trigger: 'Cargo bay initialization',
      steps: [
        { event: 'System boot', expectedDoorStates: [{ doorId: 'd1', expectedState: 'open' }] },
      ],
    };

    const expectedBehavior: ExpectedBehavior[] = [
      {
        scenarioId: 'sc-2',
        hooksFired: [],
        finalDoorStates: [{ doorId: 'd1', expectedState: 'open' }],
      },
    ];

    // Door stays closed because no behavior was assigned
    const result = service.simulateScenario(doors, scenario, expectedBehavior);
    expect(result.passed).toBe(false);
  });

  // =========================================================================
  // Test 5: Custom directive application modifies door behavior
  // =========================================================================
  it('5. custom directive application modifies door behavior', () => {
    const initBehavior = behavior('bh1', 'Open door', 'this.state = "open"', 'ngOnInit');
    const lockDirective = directive('appLockDirective', 'Lock door after initialization');

    const d = door('d1', 'secure-area', [
      hookSlot('ngOnInit', null, 1),
    ]);

    service.loadDoors([d]);
    service.assignBehavior('d1', 'ngOnInit', initBehavior);

    // Apply lock directive
    expect(service.applyDirective('d1', lockDirective)).toBe(true);

    // Verify directive is applied
    const doorStates = service.getDoorStates();
    const runtimeDoor = doorStates().get('d1');
    expect(runtimeDoor).toBeTruthy();
    expect(runtimeDoor!.appliedDirectives.length).toBe(1);
    expect(runtimeDoor!.appliedDirectives[0].name).toBe('appLockDirective');

    // Duplicate directive should be rejected
    expect(service.applyDirective('d1', lockDirective)).toBe(false);

    // Simulate: ngOnInit opens the door, then the lock directive locks it
    const doors: RuntimeBlastDoor[] = Array.from(doorStates().values());

    const scenario: DoorScenario = {
      id: 'sc-3',
      trigger: 'Secure area lockdown',
      steps: [
        { event: 'Initialize and lock', expectedDoorStates: [{ doorId: 'd1', expectedState: 'locked' }] },
      ],
    };

    const expectedBehavior: ExpectedBehavior[] = [
      {
        scenarioId: 'sc-3',
        hooksFired: ['ngOnInit'],
        finalDoorStates: [{ doorId: 'd1', expectedState: 'locked' }],
      },
    ];

    const result = service.simulateScenario(doors, scenario, expectedBehavior);
    expect(result.passed).toBe(true);
  });

  // =========================================================================
  // Test 6: ngOnDestroy cleanup runs when door is removed from simulation
  // =========================================================================
  it('6. ngOnDestroy cleanup runs when door is removed from simulation', () => {
    const destroyBehavior = behavior('bh1', 'Cleanup on destroy', 'this.sub.unsubscribe()', 'ngOnDestroy');

    const d = door('d1', 'temp-section', [
      hookSlot('ngOnDestroy', null, 1),
    ]);

    service.loadDoors([d]);
    service.assignBehavior('d1', 'ngOnDestroy', destroyBehavior);

    const doorStates = service.getDoorStates();
    const doors: RuntimeBlastDoor[] = Array.from(doorStates().values());

    // ngOnDestroy causes state to become 'closed'
    const scenario: DoorScenario = {
      id: 'sc-4',
      trigger: 'Section removal',
      steps: [
        { event: 'Section deactivated', expectedDoorStates: [{ doorId: 'd1', expectedState: 'closed' }] },
      ],
    };

    const expectedBehavior: ExpectedBehavior[] = [
      {
        scenarioId: 'sc-4',
        hooksFired: ['ngOnDestroy'],
        finalDoorStates: [{ doorId: 'd1', expectedState: 'closed' }],
      },
    ];

    const result = service.simulateScenario(doors, scenario, expectedBehavior);
    expect(result.passed).toBe(true);
    expect(result.stepResults[0].passed).toBe(true);
  });

  // =========================================================================
  // Test 7: Multi-door scenario with mixed hook ordering
  // =========================================================================
  it('7. multi-door scenario with correct hooks on two doors', () => {
    const initBh = behavior('bh1', 'Init door', 'this.state = "open"', 'ngOnInit');
    const destroyBh = behavior('bh2', 'Destroy door', 'this.state = "closed"', 'ngOnDestroy');

    const d1 = door('d1', 'bridge', [
      hookSlot('ngOnInit', null, 1),
    ]);
    const d2 = door('d2', 'engine-room', [
      hookSlot('ngOnDestroy', null, 1),
    ]);

    service.loadDoors([d1, d2]);
    service.assignBehavior('d1', 'ngOnInit', initBh);
    service.assignBehavior('d2', 'ngOnDestroy', destroyBh);

    const doorStates = service.getDoorStates();
    const doors: RuntimeBlastDoor[] = Array.from(doorStates().values());

    const scenario: DoorScenario = {
      id: 'sc-5',
      trigger: 'Dual door operation',
      steps: [
        {
          event: 'Bridge opens, engine shuts down',
          expectedDoorStates: [
            { doorId: 'd1', expectedState: 'open' },
            { doorId: 'd2', expectedState: 'closed' },
          ],
        },
      ],
    };

    const expectedBehavior: ExpectedBehavior[] = [
      {
        scenarioId: 'sc-5',
        hooksFired: ['ngOnInit', 'ngOnDestroy'],
        finalDoorStates: [
          { doorId: 'd1', expectedState: 'open' },
          { doorId: 'd2', expectedState: 'closed' },
        ],
      },
    ];

    const result = service.simulateScenario(doors, scenario, expectedBehavior);
    expect(result.passed).toBe(true);
  });

  // =========================================================================
  // Test 8: Reset clears all door state
  // =========================================================================
  it('8. reset clears all door state', () => {
    const bh = behavior('bh1', 'Init', 'this.state = "open"', 'ngOnInit');
    const d = door('d1', 'test-area', [
      hookSlot('ngOnInit', null, 1),
    ]);

    service.loadDoors([d]);
    service.assignBehavior('d1', 'ngOnInit', bh);

    // Verify state exists
    expect(service.getDoorStates()().size).toBe(1);

    // Reset
    service.reset();
    expect(service.getDoorStates()().size).toBe(0);

    // Load fresh doors and verify independence
    const d2 = door('d2', 'new-area', [
      hookSlot('ngOnDestroy', null, 1),
    ]);
    service.loadDoors([d2]);

    expect(service.getDoorStates()().size).toBe(1);
    expect(service.getDoorStates()().has('d2')).toBe(true);
    expect(service.getDoorStates()().has('d1')).toBe(false);
  });
});
