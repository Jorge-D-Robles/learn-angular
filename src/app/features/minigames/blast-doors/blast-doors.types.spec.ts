import {
  isHookOrderValid,
  isScenarioStepValid,
  LIFECYCLE_HOOK_ORDER,
  type BlastDoor,
  type BehaviorBlock,
  type HookSlot,
  type DirectiveSpec,
  type DoorScenario,
  type BlastDoorsLevelData,
  type RuntimeBlastDoor,
  type HookOrderResult,
  type ScenarioResult,
  type AfterRenderPhase,
} from './blast-doors.types';

// ---------------------------------------------------------------------------
// Test data helpers
// ---------------------------------------------------------------------------

function makeBlock(hookTarget: HookSlot['hookType'], id = 'b-1'): BehaviorBlock {
  return { id, description: 'test', code: 'console.log()', hookTarget };
}

function makeSlot(
  hookType: HookSlot['hookType'],
  executionOrder: number,
  block: BehaviorBlock | null = null,
  phase?: AfterRenderPhase,
): HookSlot {
  return { hookType, behaviorBlock: block, executionOrder, ...(phase ? { phase } : {}) };
}

// ---------------------------------------------------------------------------
// isHookOrderValid tests
// ---------------------------------------------------------------------------

describe('isHookOrderValid', () => {
  it('should return true when assigned hooks are in correct Angular lifecycle order', () => {
    const slots: HookSlot[] = [
      makeSlot('ngOnChanges', 0, makeBlock('ngOnChanges')),
      makeSlot('ngOnInit', 1, makeBlock('ngOnInit')),
      makeSlot('ngOnDestroy', 2, makeBlock('ngOnDestroy')),
    ];
    expect(isHookOrderValid(slots)).toBe(true);
  });

  it('should return false when hooks are in wrong order (ngOnDestroy before ngOnInit)', () => {
    const slots: HookSlot[] = [
      makeSlot('ngOnDestroy', 0, makeBlock('ngOnDestroy')),
      makeSlot('ngOnInit', 1, makeBlock('ngOnInit')),
    ];
    expect(isHookOrderValid(slots)).toBe(false);
  });

  it('should return true when all slots have null behavior blocks', () => {
    const slots: HookSlot[] = [
      makeSlot('ngOnDestroy', 0),
      makeSlot('ngOnInit', 1),
    ];
    expect(isHookOrderValid(slots)).toBe(true);
  });

  it('should return true for a single assigned hook slot', () => {
    const slots: HookSlot[] = [
      makeSlot('ngOnDestroy', 0, makeBlock('ngOnDestroy')),
    ];
    expect(isHookOrderValid(slots)).toBe(true);
  });

  it('should return true when empty slots array is provided', () => {
    expect(isHookOrderValid([])).toBe(true);
  });

  it('should return false when afterRender comes before afterNextRender', () => {
    const slots: HookSlot[] = [
      makeSlot('afterRender', 0, makeBlock('afterRender')),
      makeSlot('afterNextRender', 1, makeBlock('afterNextRender')),
    ];
    expect(isHookOrderValid(slots)).toBe(false);
  });

  it('should return true for the complete lifecycle in correct order (all 5 hooks)', () => {
    const slots: HookSlot[] = [
      makeSlot('ngOnChanges', 0, makeBlock('ngOnChanges', 'b-1')),
      makeSlot('ngOnInit', 1, makeBlock('ngOnInit', 'b-2')),
      makeSlot('afterNextRender', 2, makeBlock('afterNextRender', 'b-3')),
      makeSlot('afterRender', 3, makeBlock('afterRender', 'b-4')),
      makeSlot('ngOnDestroy', 4, makeBlock('ngOnDestroy', 'b-5')),
    ];
    expect(isHookOrderValid(slots)).toBe(true);
  });

  it('should return false when two slots share the same hookType (duplicate detection)', () => {
    const slots: HookSlot[] = [
      makeSlot('ngOnInit', 0, makeBlock('ngOnInit', 'b-1')),
      makeSlot('ngOnInit', 1, makeBlock('ngOnInit', 'b-2')),
    ];
    expect(isHookOrderValid(slots)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isScenarioStepValid tests
// ---------------------------------------------------------------------------

describe('isScenarioStepValid', () => {
  it('should return true for a valid step with non-empty event and at least one expected door state', () => {
    const step = {
      event: 'component-init',
      expectedDoorStates: [{ doorId: 'd-1', expectedState: 'open' as const }],
    };
    expect(isScenarioStepValid(step)).toBe(true);
  });

  it('should return false when event is empty string', () => {
    const step = {
      event: '',
      expectedDoorStates: [{ doorId: 'd-1', expectedState: 'open' as const }],
    };
    expect(isScenarioStepValid(step)).toBe(false);
  });

  it('should return false when event is whitespace-only', () => {
    const step = {
      event: '   ',
      expectedDoorStates: [{ doorId: 'd-1', expectedState: 'closed' as const }],
    };
    expect(isScenarioStepValid(step)).toBe(false);
  });

  it('should return false when expectedDoorStates is empty array', () => {
    const step = { event: 'component-init', expectedDoorStates: [] };
    expect(isScenarioStepValid(step)).toBe(false);
  });

  it('should return true for a step with multiple expected door states', () => {
    const step = {
      event: 'route-change',
      expectedDoorStates: [
        { doorId: 'd-1', expectedState: 'open' as const },
        { doorId: 'd-2', expectedState: 'locked' as const },
      ],
    };
    expect(isScenarioStepValid(step)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// LIFECYCLE_HOOK_ORDER constant test
// ---------------------------------------------------------------------------

describe('LIFECYCLE_HOOK_ORDER', () => {
  it('should contain exactly 5 hooks in Angular canonical order', () => {
    expect(LIFECYCLE_HOOK_ORDER).toEqual([
      'ngOnChanges',
      'ngOnInit',
      'afterNextRender',
      'afterRender',
      'ngOnDestroy',
    ]);
    expect(LIFECYCLE_HOOK_ORDER).toHaveLength(5);
  });
});

// ---------------------------------------------------------------------------
// Type structure smoke tests
// ---------------------------------------------------------------------------

describe('Type structures', () => {
  it('BlastDoor has required fields: id, position, currentState, hookSlots', () => {
    const door: BlastDoor = {
      id: 'door-1',
      position: 'north-airlock',
      currentState: 'closed',
      hookSlots: [],
    };
    expect(door.id).toBe('door-1');
    expect(door.position).toBe('north-airlock');
    expect(door.currentState).toBe('closed');
    expect(door.hookSlots).toEqual([]);
  });

  it('BehaviorBlock has required fields: id, description, code, hookTarget', () => {
    const block: BehaviorBlock = {
      id: 'bb-1',
      description: 'Initialize door sensor',
      code: 'this.sensor.start()',
      hookTarget: 'ngOnInit',
    };
    expect(block.id).toBe('bb-1');
    expect(block.description).toBe('Initialize door sensor');
    expect(block.code).toBe('this.sensor.start()');
    expect(block.hookTarget).toBe('ngOnInit');
  });

  it('HookSlot has required fields: hookType, behaviorBlock (nullable), executionOrder, optional phase', () => {
    const slotWithBlock: HookSlot = {
      hookType: 'ngOnInit',
      behaviorBlock: makeBlock('ngOnInit'),
      executionOrder: 1,
    };
    expect(slotWithBlock.hookType).toBe('ngOnInit');
    expect(slotWithBlock.behaviorBlock).not.toBeNull();
    expect(slotWithBlock.executionOrder).toBe(1);
    expect(slotWithBlock.phase).toBeUndefined();

    const slotWithPhase: HookSlot = {
      hookType: 'afterRender',
      behaviorBlock: null,
      executionOrder: 3,
      phase: 'read',
    };
    expect(slotWithPhase.phase).toBe('read');
  });

  it('DirectiveSpec has required fields: name, type, inputs, hostListeners, hostBindings, behavior', () => {
    const directive: DirectiveSpec = {
      name: 'appHighlight',
      type: 'attribute',
      inputs: [{ name: 'color', type: 'string', defaultValue: 'yellow' }],
      hostListeners: ['mouseenter', 'mouseleave'],
      hostBindings: ['style.backgroundColor'],
      behavior: 'Highlights the host element on hover',
    };
    expect(directive.name).toBe('appHighlight');
    expect(directive.type).toBe('attribute');
    expect(directive.inputs).toHaveLength(1);
    expect(directive.inputs[0].name).toBe('color');
    expect(directive.hostListeners).toEqual(['mouseenter', 'mouseleave']);
    expect(directive.hostBindings).toEqual(['style.backgroundColor']);
    expect(directive.behavior).toBe('Highlights the host element on hover');
  });

  it('DoorScenario has required fields: id, trigger, steps with event and expectedDoorStates', () => {
    const scenario: DoorScenario = {
      id: 'sc-1',
      trigger: 'Component initialization',
      steps: [
        {
          event: 'ngOnInit fires',
          expectedDoorStates: [{ doorId: 'door-1', expectedState: 'open' }],
        },
      ],
    };
    expect(scenario.id).toBe('sc-1');
    expect(scenario.trigger).toBe('Component initialization');
    expect(scenario.steps).toHaveLength(1);
    expect(scenario.steps[0].event).toBe('ngOnInit fires');
    expect(scenario.steps[0].expectedDoorStates[0].doorId).toBe('door-1');
  });

  it('BlastDoorsLevelData has doors, hooks, directives, scenarios, expectedBehavior', () => {
    const levelData: BlastDoorsLevelData = {
      doors: [{ id: 'd-1', position: 'main-corridor', currentState: 'closed', hookSlots: [] }],
      hooks: ['ngOnInit', 'ngOnDestroy'],
      directives: [],
      scenarios: [],
      expectedBehavior: [],
    };
    expect(levelData.doors).toHaveLength(1);
    expect(levelData.hooks).toEqual(['ngOnInit', 'ngOnDestroy']);
    expect(levelData.directives).toEqual([]);
    expect(levelData.scenarios).toEqual([]);
    expect(levelData.expectedBehavior).toEqual([]);
  });

  it('RuntimeBlastDoor extends BlastDoor with mutable currentState, hookSlots, and appliedDirectives', () => {
    const runtime: RuntimeBlastDoor = {
      id: 'door-1',
      position: 'engine-room-east',
      currentState: 'closed',
      hookSlots: [
        { hookType: 'ngOnInit', behaviorBlock: null, executionOrder: 0 },
      ],
      appliedDirectives: [],
    };
    expect(runtime.id).toBe('door-1');
    expect(runtime.currentState).toBe('closed');

    // Mutable fields can be updated
    runtime.currentState = 'open';
    runtime.hookSlots[0].behaviorBlock = makeBlock('ngOnInit');
    runtime.appliedDirectives.push({
      name: 'appAutoClose',
      type: 'attribute',
      inputs: [],
      hostListeners: [],
      hostBindings: [],
      behavior: 'Auto-closes door after timeout',
    });
    expect(runtime.currentState).toBe('open');
    expect(runtime.hookSlots[0].behaviorBlock).not.toBeNull();
    expect(runtime.appliedDirectives).toHaveLength(1);
  });

  it('HookOrderResult has valid, correctOrder, actualOrder, misplacedHooks', () => {
    const result: HookOrderResult = {
      valid: false,
      correctOrder: ['ngOnChanges', 'ngOnInit', 'ngOnDestroy'],
      actualOrder: ['ngOnDestroy', 'ngOnInit', 'ngOnChanges'],
      misplacedHooks: [
        { hook: 'ngOnDestroy', actualIndex: 0, expectedIndex: 2 },
        { hook: 'ngOnChanges', actualIndex: 2, expectedIndex: 0 },
      ],
    };
    expect(result.valid).toBe(false);
    expect(result.correctOrder).toEqual(['ngOnChanges', 'ngOnInit', 'ngOnDestroy']);
    expect(result.actualOrder).toEqual(['ngOnDestroy', 'ngOnInit', 'ngOnChanges']);
    expect(result.misplacedHooks).toHaveLength(2);
    expect(result.misplacedHooks[0].hook).toBe('ngOnDestroy');
  });

  it('ScenarioResult has scenarioId, passed, stepResults with door-level results', () => {
    const result: ScenarioResult = {
      scenarioId: 'sc-1',
      passed: false,
      stepResults: [
        {
          event: 'ngOnInit fires',
          passed: false,
          doorResults: [
            { doorId: 'door-1', expected: 'open', actual: 'closed', match: false },
          ],
        },
      ],
    };
    expect(result.scenarioId).toBe('sc-1');
    expect(result.passed).toBe(false);
    expect(result.stepResults).toHaveLength(1);
    expect(result.stepResults[0].doorResults[0].match).toBe(false);
  });
});
