import { DifficultyTier } from '../../core/minigame/minigame.types';
import type { LevelDefinition, LevelPack } from '../../core/levels/level.types';
import type {
  BlastDoorsLevelData,
  BlastDoor,
  HookSlot,
  BehaviorBlock,
  DirectiveSpec,
  DirectiveInput,
  DoorScenario,
  ScenarioStep,
  ExpectedDoorState,
  ExpectedBehavior,
  LifecycleHook,
  DoorState,
  DirectiveType,
  AfterRenderPhase,
} from '../../features/minigames/blast-doors/blast-doors.types';

// ---------------------------------------------------------------------------
// Builder helpers (private to this file)
// ---------------------------------------------------------------------------

/** Build a BehaviorBlock. */
function behavior(id: string, description: string, code: string, hookTarget: LifecycleHook): BehaviorBlock {
  return { id, description, code, hookTarget };
}

/** Build a HookSlot. */
function hookSlot(hookType: LifecycleHook, block: BehaviorBlock | null, executionOrder: number, phase?: AfterRenderPhase): HookSlot {
  return { hookType, behaviorBlock: block, executionOrder, ...(phase ? { phase } : {}) };
}

/** Build a BlastDoor. */
function door(id: string, position: string, currentState: DoorState, hookSlots: HookSlot[]): BlastDoor {
  return { id, position, currentState, hookSlots };
}

/** Build a DirectiveInput. */
function dirInput(name: string, type: string, defaultValue?: string): DirectiveInput {
  return { name, type, ...(defaultValue !== undefined ? { defaultValue } : {}) };
}

/** Build a DirectiveSpec. */
function directive(
  name: string, type: DirectiveType, inputs: DirectiveInput[],
  hostListeners: string[], hostBindings: string[], behaviorDesc: string,
): DirectiveSpec {
  return { name, type, inputs, hostListeners, hostBindings, behavior: behaviorDesc };
}

/** Build an ExpectedDoorState. */
function doorState(doorId: string, expectedState: DoorState): ExpectedDoorState {
  return { doorId, expectedState };
}

/** Build a ScenarioStep. */
function step(event: string, expectedDoorStates: ExpectedDoorState[]): ScenarioStep {
  return { event, expectedDoorStates };
}

/** Build a DoorScenario. */
function scenario(id: string, trigger: string, steps: ScenarioStep[]): DoorScenario {
  return { id, trigger, steps };
}

/** Build an ExpectedBehavior. */
function expected(scenarioId: string, hooksFired: LifecycleHook[], finalDoorStates: ExpectedDoorState[]): ExpectedBehavior {
  return { scenarioId, hooksFired, finalDoorStates };
}

// ---------------------------------------------------------------------------
// Type alias
// ---------------------------------------------------------------------------

type Level = LevelDefinition<BlastDoorsLevelData>;

// ---------------------------------------------------------------------------
// Level definitions
// ---------------------------------------------------------------------------

export const BLAST_DOORS_LEVELS: readonly Level[] = [
  // =========================================================================
  // BASIC TIER (Levels 1-6) — Lifecycle Hooks only
  // =========================================================================

  // Level 1 — ngOnInit
  {
    levelId: 'bd-basic-01',
    gameId: 'blast-doors',
    tier: DifficultyTier.Basic,
    order: 1,
    title: 'First Seal',
    conceptIntroduced: 'ngOnInit',
    description: 'Initialize a blast door on creation using ngOnInit.',
    data: {
      doors: [
        door('bd-b01-d1', 'main-corridor', 'closed', [
          hookSlot('ngOnInit', behavior('bd-b01-bh1', 'Initialize door state', 'this.state = "closed"; this.sensorActive = true;', 'ngOnInit'), 1),
        ]),
      ],
      hooks: ['ngOnInit'],
      directives: [],
      scenarios: [
        scenario('bd-b01-sc1', 'Section power-up', [
          step('Power activated in main corridor', [doorState('bd-b01-d1', 'closed')]),
        ]),
      ],
      expectedBehavior: [
        expected('bd-b01-sc1', ['ngOnInit'], [doorState('bd-b01-d1', 'closed')]),
      ],
    },
  },

  // Level 2 — ngOnDestroy
  {
    levelId: 'bd-basic-02',
    gameId: 'blast-doors',
    tier: DifficultyTier.Basic,
    order: 2,
    title: 'Clean Shutdown',
    conceptIntroduced: 'ngOnDestroy',
    description: 'Clean up subscriptions and deactivate sensors when a door section is removed.',
    data: {
      doors: [
        door('bd-b02-d1', 'engineering-bay', 'closed', [
          hookSlot('ngOnDestroy', behavior('bd-b02-bh1', 'Cleanup on removal', 'this.subscription.unsubscribe(); this.sensor.deactivate();', 'ngOnDestroy'), 1),
        ]),
      ],
      hooks: ['ngOnDestroy'],
      directives: [],
      scenarios: [
        scenario('bd-b02-sc1', 'Section deactivation', [
          step('Engineering bay powering down', [doorState('bd-b02-d1', 'locked')]),
        ]),
      ],
      expectedBehavior: [
        expected('bd-b02-sc1', ['ngOnDestroy'], [doorState('bd-b02-d1', 'locked')]),
      ],
    },
  },

  // Level 3 — ngOnChanges
  {
    levelId: 'bd-basic-03',
    gameId: 'blast-doors',
    tier: DifficultyTier.Basic,
    order: 3,
    title: 'Change Detected',
    conceptIntroduced: 'ngOnChanges',
    description: 'Respond to input property changes to update door lock status.',
    data: {
      doors: [
        door('bd-b03-d1', 'bridge-entrance', 'closed', [
          hookSlot('ngOnChanges', behavior('bd-b03-bh1', 'React to input changes', 'if (changes["accessLevel"]) { this.updateLock(); }', 'ngOnChanges'), 1),
          hookSlot('ngOnChanges', behavior('bd-b03-bh2', 'Log change event', 'console.log("Access level changed:", changes["accessLevel"].currentValue);', 'ngOnChanges'), 2),
        ]),
      ],
      hooks: ['ngOnChanges'],
      directives: [],
      scenarios: [
        scenario('bd-b03-sc1', 'Access level change', [
          step('Crew rank updated from ensign to commander', [doorState('bd-b03-d1', 'open')]),
        ]),
      ],
      expectedBehavior: [
        expected('bd-b03-sc1', ['ngOnChanges'], [doorState('bd-b03-d1', 'open')]),
      ],
    },
  },

  // Level 4 — Hook order
  {
    levelId: 'bd-basic-04',
    gameId: 'blast-doors',
    tier: DifficultyTier.Basic,
    order: 4,
    title: 'Order of Operations',
    conceptIntroduced: 'Hook order',
    description: 'Arrange lifecycle hooks in the correct execution order: ngOnChanges, ngOnInit, ngOnDestroy.',
    data: {
      doors: [
        door('bd-b04-d1', 'airlock-alpha', 'closed', [
          hookSlot('ngOnChanges', behavior('bd-b04-bh1', 'Handle input changes', 'this.updateFromInputs();', 'ngOnChanges'), 1),
          hookSlot('ngOnInit', behavior('bd-b04-bh2', 'Initialize door', 'this.state = "closed"; this.initSensors();', 'ngOnInit'), 2),
          hookSlot('ngOnDestroy', behavior('bd-b04-bh3', 'Cleanup on removal', 'this.teardown();', 'ngOnDestroy'), 3),
        ]),
      ],
      hooks: ['ngOnChanges', 'ngOnInit', 'ngOnDestroy'],
      directives: [],
      scenarios: [
        scenario('bd-b04-sc1', 'Full lifecycle sequence', [
          step('Airlock door created with initial inputs', [doorState('bd-b04-d1', 'closed')]),
          step('Door section removed during maintenance', [doorState('bd-b04-d1', 'locked')]),
        ]),
      ],
      expectedBehavior: [
        expected('bd-b04-sc1', ['ngOnChanges', 'ngOnInit', 'ngOnDestroy'], [doorState('bd-b04-d1', 'locked')]),
      ],
    },
  },

  // Level 5 — afterNextRender
  {
    levelId: 'bd-basic-05',
    gameId: 'blast-doors',
    tier: DifficultyTier.Basic,
    order: 5,
    title: 'Render Ready',
    conceptIntroduced: 'afterNextRender',
    description: 'Perform one-time DOM measurement after the first render using afterNextRender.',
    data: {
      doors: [
        door('bd-b05-d1', 'cargo-hold', 'closed', [
          hookSlot('ngOnInit', behavior('bd-b05-bh1', 'Basic initialization', 'this.state = "closed";', 'ngOnInit'), 1),
          hookSlot('afterNextRender', behavior('bd-b05-bh2', 'Measure door width', 'this.doorWidth = this.elementRef.nativeElement.offsetWidth;', 'afterNextRender'), 2),
        ]),
      ],
      hooks: ['ngOnInit', 'afterNextRender'],
      directives: [],
      scenarios: [
        scenario('bd-b05-sc1', 'First render measurement', [
          step('Cargo hold door rendered for the first time', [doorState('bd-b05-d1', 'closed')]),
        ]),
      ],
      expectedBehavior: [
        expected('bd-b05-sc1', ['ngOnInit', 'afterNextRender'], [doorState('bd-b05-d1', 'closed')]),
      ],
    },
  },

  // Level 6 — Multiple hooks
  {
    levelId: 'bd-basic-06',
    gameId: 'blast-doors',
    tier: DifficultyTier.Basic,
    order: 6,
    title: 'Full Lifecycle',
    conceptIntroduced: 'Multiple hooks',
    description: 'Combine ngOnChanges, ngOnInit, afterNextRender, and ngOnDestroy in a full power cycle.',
    data: {
      doors: [
        door('bd-b06-d1', 'medical-bay', 'closed', [
          hookSlot('ngOnChanges', behavior('bd-b06-bh1', 'React to input changes', 'this.applyInputChanges(changes);', 'ngOnChanges'), 1),
          hookSlot('ngOnInit', behavior('bd-b06-bh2', 'Initialize door', 'this.state = "closed"; this.activateSensors();', 'ngOnInit'), 2),
          hookSlot('afterNextRender', behavior('bd-b06-bh3', 'One-time DOM setup', 'this.calibrateSensorOverlay();', 'afterNextRender'), 3),
          hookSlot('ngOnDestroy', behavior('bd-b06-bh4', 'Teardown', 'this.subscription.unsubscribe();', 'ngOnDestroy'), 4),
        ]),
        door('bd-b06-d2', 'reactor-access', 'locked', [
          hookSlot('ngOnChanges', behavior('bd-b06-bh5', 'Check clearance changes', 'this.verifyClearance(changes);', 'ngOnChanges'), 1),
          hookSlot('ngOnInit', behavior('bd-b06-bh6', 'Initialize reactor door', 'this.state = "locked"; this.engageHeavyLock();', 'ngOnInit'), 2),
          hookSlot('afterNextRender', behavior('bd-b06-bh7', 'Measure seal integrity', 'this.sealIntegrity = this.measureSeal();', 'afterNextRender'), 3),
          hookSlot('ngOnDestroy', behavior('bd-b06-bh8', 'Emergency seal', 'this.emergencySeal();', 'ngOnDestroy'), 4),
        ]),
      ],
      hooks: ['ngOnChanges', 'ngOnInit', 'afterNextRender', 'ngOnDestroy'],
      directives: [],
      scenarios: [
        scenario('bd-b06-sc1', 'Full power cycle', [
          step('Section powered up with initial configuration', [
            doorState('bd-b06-d1', 'closed'),
            doorState('bd-b06-d2', 'locked'),
          ]),
          step('Section shutdown initiated', [
            doorState('bd-b06-d1', 'locked'),
            doorState('bd-b06-d2', 'locked'),
          ]),
        ]),
      ],
      expectedBehavior: [
        expected('bd-b06-sc1', ['ngOnChanges', 'ngOnInit', 'afterNextRender', 'ngOnDestroy'], [
          doorState('bd-b06-d1', 'locked'),
          doorState('bd-b06-d2', 'locked'),
        ]),
      ],
    },
  },

  // =========================================================================
  // INTERMEDIATE TIER (Levels 7-12) — Directives introduced
  // =========================================================================

  // Level 7 — Attribute directive
  {
    levelId: 'bd-intermediate-01',
    gameId: 'blast-doors',
    tier: DifficultyTier.Intermediate,
    order: 1,
    title: 'Hazard Highlight',
    conceptIntroduced: 'Attribute directive',
    description: 'Create an attribute directive that highlights hazardous doors.',
    data: {
      doors: [
        door('bd-i01-d1', 'reactor-access', 'closed', [
          hookSlot('ngOnInit', behavior('bd-i01-bh1', 'Initialize door', 'this.state = "closed";', 'ngOnInit'), 1),
        ]),
      ],
      hooks: ['ngOnInit'],
      directives: [
        directive('appHazardHighlight', 'attribute', [], [], ['class.hazard-zone'], 'Adds visual highlight class to door element'),
      ],
      scenarios: [
        scenario('bd-i01-sc1', 'Directive highlights door', [
          step('Hazard directive applied to reactor door', [doorState('bd-i01-d1', 'closed')]),
        ]),
      ],
      expectedBehavior: [
        expected('bd-i01-sc1', ['ngOnInit'], [doorState('bd-i01-d1', 'closed')]),
      ],
    },
  },

  // Level 8 — Directive with input
  {
    levelId: 'bd-intermediate-02',
    gameId: 'blast-doors',
    tier: DifficultyTier.Intermediate,
    order: 2,
    title: 'Configurable Seal',
    conceptIntroduced: 'Directive with input',
    description: 'Create a directive that accepts a color input to configure door seal appearance.',
    data: {
      doors: [
        door('bd-i02-d1', 'crew-quarters', 'closed', [
          hookSlot('ngOnInit', behavior('bd-i02-bh1', 'Initialize door', 'this.state = "closed";', 'ngOnInit'), 1),
        ]),
      ],
      hooks: ['ngOnInit'],
      directives: [
        directive('appSealColor', 'attribute', [dirInput('sealColor', 'string', '#00ff00')], [], ['style.borderColor'], 'Applies configured color to door seal border'),
      ],
      scenarios: [
        scenario('bd-i02-sc1', 'Directive applies configured color', [
          step('Seal color directive set to red for restricted area', [doorState('bd-i02-d1', 'closed')]),
        ]),
      ],
      expectedBehavior: [
        expected('bd-i02-sc1', ['ngOnInit'], [doorState('bd-i02-d1', 'closed')]),
      ],
    },
  },

  // Level 9 — HostListener
  {
    levelId: 'bd-intermediate-03',
    gameId: 'blast-doors',
    tier: DifficultyTier.Intermediate,
    order: 3,
    title: 'Proximity Alert',
    conceptIntroduced: 'HostListener',
    description: 'Create a directive that responds to hover events to trigger proximity alerts.',
    data: {
      doors: [
        door('bd-i03-d1', 'docking-port', 'closed', [
          hookSlot('ngOnInit', behavior('bd-i03-bh1', 'Initialize door', 'this.state = "closed";', 'ngOnInit'), 1),
        ]),
      ],
      hooks: ['ngOnInit'],
      directives: [
        directive('appProximityAlert', 'attribute', [], ['mouseenter', 'mouseleave'], [], 'Triggers proximity alert on hover near door'),
      ],
      scenarios: [
        scenario('bd-i03-sc1', 'Crew approaches door', [
          step('Crew member enters proximity zone', [doorState('bd-i03-d1', 'open')]),
        ]),
        scenario('bd-i03-sc2', 'Crew departs door', [
          step('Crew member leaves proximity zone', [doorState('bd-i03-d1', 'closed')]),
        ]),
      ],
      expectedBehavior: [
        expected('bd-i03-sc1', ['ngOnInit'], [doorState('bd-i03-d1', 'open')]),
        expected('bd-i03-sc2', ['ngOnInit'], [doorState('bd-i03-d1', 'closed')]),
      ],
    },
  },

  // Level 10 — HostBinding
  {
    levelId: 'bd-intermediate-04',
    gameId: 'blast-doors',
    tier: DifficultyTier.Intermediate,
    order: 4,
    title: 'Status Binding',
    conceptIntroduced: 'HostBinding',
    description: 'Create a directive that binds CSS classes based on door state using HostBinding.',
    data: {
      doors: [
        door('bd-i04-d1', 'main-corridor', 'closed', [
          hookSlot('ngOnInit', behavior('bd-i04-bh1', 'Initialize door', 'this.state = "closed";', 'ngOnInit'), 1),
          hookSlot('ngOnChanges', behavior('bd-i04-bh2', 'Update on state change', 'this.refreshVisual();', 'ngOnChanges'), 2),
        ]),
        door('bd-i04-d2', 'bridge-entrance', 'open', [
          hookSlot('ngOnInit', behavior('bd-i04-bh3', 'Initialize bridge door', 'this.state = "open";', 'ngOnInit'), 1),
          hookSlot('ngOnChanges', behavior('bd-i04-bh4', 'Update bridge visual', 'this.refreshVisual();', 'ngOnChanges'), 2),
        ]),
      ],
      hooks: ['ngOnInit', 'ngOnChanges'],
      directives: [
        directive('appStatusClass', 'attribute', [], [], ['class.door-open', 'class.door-closed', 'class.door-locked'], 'Toggles CSS class based on door operational state'),
      ],
      scenarios: [
        scenario('bd-i04-sc1', 'Door state changes reflected in CSS', [
          step('Corridor door locks during alert', [
            doorState('bd-i04-d1', 'locked'),
            doorState('bd-i04-d2', 'open'),
          ]),
        ]),
        scenario('bd-i04-sc2', 'All doors close', [
          step('Security protocol engages', [
            doorState('bd-i04-d1', 'closed'),
            doorState('bd-i04-d2', 'closed'),
          ]),
        ]),
      ],
      expectedBehavior: [
        expected('bd-i04-sc1', ['ngOnInit', 'ngOnChanges'], [
          doorState('bd-i04-d1', 'locked'),
          doorState('bd-i04-d2', 'open'),
        ]),
        expected('bd-i04-sc2', ['ngOnInit', 'ngOnChanges'], [
          doorState('bd-i04-d1', 'closed'),
          doorState('bd-i04-d2', 'closed'),
        ]),
      ],
    },
  },

  // Level 11 — Structural-like behavior
  {
    levelId: 'bd-intermediate-05',
    gameId: 'blast-doors',
    tier: DifficultyTier.Intermediate,
    order: 5,
    title: 'Restricted Access',
    conceptIntroduced: 'Structural-like behavior',
    description: 'Create a directive that shows or hides door control panels based on access level.',
    data: {
      doors: [
        door('bd-i05-d1', 'bridge-entrance', 'locked', [
          hookSlot('ngOnInit', behavior('bd-i05-bh1', 'Initialize bridge door', 'this.state = "locked";', 'ngOnInit'), 1),
        ]),
        door('bd-i05-d2', 'crew-quarters', 'closed', [
          hookSlot('ngOnInit', behavior('bd-i05-bh2', 'Initialize quarters door', 'this.state = "closed";', 'ngOnInit'), 1),
        ]),
      ],
      hooks: ['ngOnInit'],
      directives: [
        directive('appAccessGate', 'structural', [dirInput('requiredRank', 'string')], [], [], 'Shows or hides door controls based on crew access level'),
      ],
      scenarios: [
        scenario('bd-i05-sc1', 'Authorized crew accesses bridge', [
          step('Commander approaches bridge door', [doorState('bd-i05-d1', 'open')]),
        ]),
        scenario('bd-i05-sc2', 'Unauthorized crew denied', [
          step('Ensign approaches bridge door', [doorState('bd-i05-d1', 'locked')]),
        ]),
      ],
      expectedBehavior: [
        expected('bd-i05-sc1', ['ngOnInit'], [doorState('bd-i05-d1', 'open')]),
        expected('bd-i05-sc2', ['ngOnInit'], [doorState('bd-i05-d1', 'locked')]),
      ],
    },
  },

  // Level 12 — Mixed challenge
  {
    levelId: 'bd-intermediate-06',
    gameId: 'blast-doors',
    tier: DifficultyTier.Intermediate,
    order: 6,
    title: 'Combined Protocols',
    conceptIntroduced: 'Mixed challenge',
    description: 'Combine lifecycle hooks with a directive that has inputs and host listeners.',
    data: {
      doors: [
        door('bd-i06-d1', 'airlock-alpha', 'closed', [
          hookSlot('ngOnChanges', behavior('bd-i06-bh1', 'Handle input change', 'this.updatePressure(changes);', 'ngOnChanges'), 1),
          hookSlot('ngOnInit', behavior('bd-i06-bh2', 'Initialize airlock', 'this.state = "closed"; this.pressurize();', 'ngOnInit'), 2),
          hookSlot('ngOnDestroy', behavior('bd-i06-bh3', 'Emergency depressurize', 'this.depressurize();', 'ngOnDestroy'), 3),
        ]),
        door('bd-i06-d2', 'cargo-hold', 'closed', [
          hookSlot('ngOnChanges', behavior('bd-i06-bh4', 'Track cargo bay changes', 'this.updateManifest(changes);', 'ngOnChanges'), 1),
          hookSlot('ngOnInit', behavior('bd-i06-bh5', 'Initialize cargo door', 'this.state = "closed";', 'ngOnInit'), 2),
          hookSlot('ngOnDestroy', behavior('bd-i06-bh6', 'Seal cargo bay', 'this.sealBay();', 'ngOnDestroy'), 3),
        ]),
      ],
      hooks: ['ngOnChanges', 'ngOnInit', 'ngOnDestroy'],
      directives: [
        directive('appPressureMonitor', 'attribute', [dirInput('threshold', 'number', '1.0')], ['pressureChange'], ['class.pressure-warning'], 'Monitors pressure and applies warning class when threshold exceeded'),
      ],
      scenarios: [
        scenario('bd-i06-sc1', 'Normal airlock cycle', [
          step('Airlock pressurized and doors initialized', [
            doorState('bd-i06-d1', 'closed'),
            doorState('bd-i06-d2', 'closed'),
          ]),
          step('Crew enters airlock, pressure nominal', [
            doorState('bd-i06-d1', 'open'),
            doorState('bd-i06-d2', 'closed'),
          ]),
        ]),
        scenario('bd-i06-sc2', 'Pressure warning triggers', [
          step('Pressure drops below threshold', [
            doorState('bd-i06-d1', 'locked'),
            doorState('bd-i06-d2', 'locked'),
          ]),
        ]),
      ],
      expectedBehavior: [
        expected('bd-i06-sc1', ['ngOnChanges', 'ngOnInit'], [
          doorState('bd-i06-d1', 'open'),
          doorState('bd-i06-d2', 'closed'),
        ]),
        expected('bd-i06-sc2', ['ngOnChanges', 'ngOnInit', 'ngOnDestroy'], [
          doorState('bd-i06-d1', 'locked'),
          doorState('bd-i06-d2', 'locked'),
        ]),
      ],
    },
  },

  // =========================================================================
  // ADVANCED TIER (Levels 13-17) — Complex directive patterns
  // =========================================================================

  // Level 13 — Directive composition
  {
    levelId: 'bd-advanced-01',
    gameId: 'blast-doors',
    tier: DifficultyTier.Advanced,
    order: 1,
    title: 'Multi-Layer Defense',
    conceptIntroduced: 'Directive composition',
    description: 'Apply multiple directives to the same door to compose complex behavior.',
    data: {
      doors: [
        door('bd-a01-d1', 'reactor-access', 'locked', [
          hookSlot('ngOnInit', behavior('bd-a01-bh1', 'Initialize reactor door', 'this.state = "locked"; this.radiationCheck();', 'ngOnInit'), 1),
          hookSlot('ngOnChanges', behavior('bd-a01-bh2', 'Update clearance', 'this.updateClearance(changes);', 'ngOnChanges'), 2),
        ]),
        door('bd-a01-d2', 'engineering-bay', 'closed', [
          hookSlot('ngOnInit', behavior('bd-a01-bh3', 'Initialize engineering door', 'this.state = "closed";', 'ngOnInit'), 1),
          hookSlot('ngOnChanges', behavior('bd-a01-bh4', 'Handle mode change', 'this.applyMode(changes);', 'ngOnChanges'), 2),
        ]),
      ],
      hooks: ['ngOnInit', 'ngOnChanges'],
      directives: [
        directive('appHazardHighlight', 'attribute', [], [], ['class.hazard-zone'], 'Adds visual highlight class to hazardous door'),
        directive('appAccessControl', 'attribute', [dirInput('requiredClearance', 'string')], [], [], 'Checks crew rank against required clearance level'),
      ],
      scenarios: [
        scenario('bd-a01-sc1', 'Both directives active on reactor door', [
          step('Engineer approaches reactor access', [doorState('bd-a01-d1', 'locked')]),
          step('Chief engineer with clearance approaches', [doorState('bd-a01-d1', 'open')]),
        ]),
        scenario('bd-a01-sc2', 'Highlight only on engineering door', [
          step('Engineering door shows hazard highlight', [doorState('bd-a01-d2', 'closed')]),
        ]),
      ],
      expectedBehavior: [
        expected('bd-a01-sc1', ['ngOnInit', 'ngOnChanges'], [doorState('bd-a01-d1', 'open')]),
        expected('bd-a01-sc2', ['ngOnInit'], [doorState('bd-a01-d2', 'closed')]),
      ],
    },
  },

  // Level 14 — Directive with DI
  {
    levelId: 'bd-advanced-02',
    gameId: 'blast-doors',
    tier: DifficultyTier.Advanced,
    order: 2,
    title: 'Service-Powered Seal',
    conceptIntroduced: 'Directive with DI',
    description: 'Create a directive that injects a service to perform authentication checks.',
    data: {
      doors: [
        door('bd-a02-d1', 'bridge-entrance', 'locked', [
          hookSlot('ngOnInit', behavior('bd-a02-bh1', 'Initialize bridge door', 'this.state = "locked";', 'ngOnInit'), 1),
          hookSlot('ngOnDestroy', behavior('bd-a02-bh2', 'Revoke session on removal', 'this.authService.revokeSession();', 'ngOnDestroy'), 2),
        ]),
        door('bd-a02-d2', 'observation-deck', 'closed', [
          hookSlot('ngOnInit', behavior('bd-a02-bh3', 'Initialize deck door', 'this.state = "closed";', 'ngOnInit'), 1),
          hookSlot('ngOnDestroy', behavior('bd-a02-bh4', 'Cleanup observer', 'this.observer.disconnect();', 'ngOnDestroy'), 2),
        ]),
      ],
      hooks: ['ngOnInit', 'ngOnDestroy'],
      directives: [
        directive('appAuthGate', 'attribute', [dirInput('minRank', 'string')], [], [], 'Injects AuthService to verify crew rank before allowing door operation'),
      ],
      scenarios: [
        scenario('bd-a02-sc1', 'Authorized crew opens bridge door', [
          step('Captain authenticates at bridge', [doorState('bd-a02-d1', 'open')]),
        ]),
        scenario('bd-a02-sc2', 'Session revoked on section shutdown', [
          step('Bridge section powers down', [
            doorState('bd-a02-d1', 'locked'),
            doorState('bd-a02-d2', 'locked'),
          ]),
        ]),
      ],
      expectedBehavior: [
        expected('bd-a02-sc1', ['ngOnInit'], [doorState('bd-a02-d1', 'open')]),
        expected('bd-a02-sc2', ['ngOnInit', 'ngOnDestroy'], [
          doorState('bd-a02-d1', 'locked'),
          doorState('bd-a02-d2', 'locked'),
        ]),
      ],
    },
  },

  // Level 15 — exportAs
  {
    levelId: 'bd-advanced-03',
    gameId: 'blast-doors',
    tier: DifficultyTier.Advanced,
    order: 3,
    title: 'Public API',
    conceptIntroduced: 'exportAs',
    description: 'Use exportAs to expose a directive API via a template reference for external control.',
    data: {
      doors: [
        door('bd-a03-d1', 'airlock-alpha', 'closed', [
          hookSlot('ngOnInit', behavior('bd-a03-bh1', 'Initialize airlock door', 'this.state = "closed";', 'ngOnInit'), 1),
        ]),
        door('bd-a03-d2', 'docking-port', 'closed', [
          hookSlot('ngOnInit', behavior('bd-a03-bh2', 'Initialize docking door', 'this.state = "closed";', 'ngOnInit'), 1),
        ]),
      ],
      hooks: ['ngOnInit'],
      directives: [
        directive('appDoorControl', 'attribute', [], [], [], 'Exposes open/close/lock methods via exportAs for template ref access'),
      ],
      scenarios: [
        scenario('bd-a03-sc1', 'Template ref calls open()', [
          step('External control opens airlock', [doorState('bd-a03-d1', 'open')]),
        ]),
        scenario('bd-a03-sc2', 'Template ref calls lock()', [
          step('External control locks docking port', [doorState('bd-a03-d2', 'locked')]),
        ]),
        scenario('bd-a03-sc3', 'Sequential API calls', [
          step('Open both doors via API', [
            doorState('bd-a03-d1', 'open'),
            doorState('bd-a03-d2', 'open'),
          ]),
          step('Lock both doors via API', [
            doorState('bd-a03-d1', 'locked'),
            doorState('bd-a03-d2', 'locked'),
          ]),
        ]),
      ],
      expectedBehavior: [
        expected('bd-a03-sc1', ['ngOnInit'], [doorState('bd-a03-d1', 'open')]),
        expected('bd-a03-sc2', ['ngOnInit'], [doorState('bd-a03-d2', 'locked')]),
        expected('bd-a03-sc3', ['ngOnInit'], [
          doorState('bd-a03-d1', 'locked'),
          doorState('bd-a03-d2', 'locked'),
        ]),
      ],
    },
  },

  // Level 16 — afterRender phases
  {
    levelId: 'bd-advanced-04',
    gameId: 'blast-doors',
    tier: DifficultyTier.Advanced,
    order: 4,
    title: 'Render Phases',
    conceptIntroduced: 'afterRender phases',
    description: 'Use afterRender with phase ordering (read, write, mixedReadWrite) for efficient DOM operations.',
    data: {
      doors: [
        door('bd-a04-d1', 'main-corridor', 'closed', [
          hookSlot('ngOnInit', behavior('bd-a04-bh1', 'Initialize corridor door', 'this.state = "closed";', 'ngOnInit'), 1),
          hookSlot('afterRender', behavior('bd-a04-bh2', 'Read door dimensions', 'this.width = this.el.offsetWidth;', 'afterRender'), 2, 'read'),
        ]),
        door('bd-a04-d2', 'engineering-bay', 'closed', [
          hookSlot('ngOnInit', behavior('bd-a04-bh3', 'Initialize engineering door', 'this.state = "closed";', 'ngOnInit'), 1),
          hookSlot('afterRender', behavior('bd-a04-bh4', 'Write animation frame', 'this.animationFrame = requestAnimationFrame(this.animate);', 'afterRender'), 2, 'write'),
        ]),
        door('bd-a04-d3', 'medical-bay', 'closed', [
          hookSlot('ngOnInit', behavior('bd-a04-bh5', 'Initialize medical door', 'this.state = "closed";', 'ngOnInit'), 1),
          hookSlot('afterRender', behavior('bd-a04-bh6', 'Mixed read-write operation', 'this.syncOverlayPosition();', 'afterRender'), 2, 'mixedReadWrite'),
        ]),
      ],
      hooks: ['ngOnInit', 'afterRender'],
      directives: [
        directive('appRenderSync', 'attribute', [], [], [], 'Coordinates afterRender phases across multiple doors'),
      ],
      scenarios: [
        scenario('bd-a04-sc1', 'Phase ordering validation', [
          step('All doors render with correct phase order: read -> write -> mixedReadWrite', [
            doorState('bd-a04-d1', 'closed'),
            doorState('bd-a04-d2', 'closed'),
            doorState('bd-a04-d3', 'closed'),
          ]),
        ]),
        scenario('bd-a04-sc2', 'Read phase measures layout', [
          step('Corridor door reads dimensions after render', [doorState('bd-a04-d1', 'closed')]),
        ]),
        scenario('bd-a04-sc3', 'Write phase triggers animation', [
          step('Engineering door starts animation after render', [doorState('bd-a04-d2', 'closed')]),
        ]),
      ],
      expectedBehavior: [
        expected('bd-a04-sc1', ['ngOnInit', 'afterRender'], [
          doorState('bd-a04-d1', 'closed'),
          doorState('bd-a04-d2', 'closed'),
          doorState('bd-a04-d3', 'closed'),
        ]),
        expected('bd-a04-sc2', ['ngOnInit', 'afterRender'], [doorState('bd-a04-d1', 'closed')]),
        expected('bd-a04-sc3', ['ngOnInit', 'afterRender'], [doorState('bd-a04-d2', 'closed')]),
      ],
    },
  },

  // Level 17 — Full door system
  {
    levelId: 'bd-advanced-05',
    gameId: 'blast-doors',
    tier: DifficultyTier.Advanced,
    order: 5,
    title: 'Full Door System',
    conceptIntroduced: 'Full door system',
    description: 'Build a complete door system using all lifecycle hooks and multiple directives.',
    data: {
      doors: [
        door('bd-a05-d1', 'bridge-entrance', 'locked', [
          hookSlot('ngOnChanges', behavior('bd-a05-bh1', 'Process clearance update', 'this.processClearance(changes);', 'ngOnChanges'), 1),
          hookSlot('ngOnInit', behavior('bd-a05-bh2', 'Initialize bridge door', 'this.state = "locked"; this.activateBiometrics();', 'ngOnInit'), 2),
          hookSlot('afterNextRender', behavior('bd-a05-bh3', 'Calibrate biometric scanner', 'this.calibrateScanner();', 'afterNextRender'), 3),
          hookSlot('afterRender', behavior('bd-a05-bh4', 'Update status display', 'this.refreshStatusDisplay();', 'afterRender'), 4),
          hookSlot('ngOnDestroy', behavior('bd-a05-bh5', 'Secure bridge on removal', 'this.engageDeadlock();', 'ngOnDestroy'), 5),
        ]),
        door('bd-a05-d2', 'reactor-access', 'locked', [
          hookSlot('ngOnChanges', behavior('bd-a05-bh6', 'Update radiation readings', 'this.updateRadiation(changes);', 'ngOnChanges'), 1),
          hookSlot('ngOnInit', behavior('bd-a05-bh7', 'Initialize reactor door', 'this.state = "locked"; this.radiationShield();', 'ngOnInit'), 2),
          hookSlot('afterNextRender', behavior('bd-a05-bh8', 'Measure shield thickness', 'this.shieldThickness = this.measureShield();', 'afterNextRender'), 3),
          hookSlot('afterRender', behavior('bd-a05-bh9', 'Animate radiation meter', 'this.animateRadiationMeter();', 'afterRender'), 4),
          hookSlot('ngOnDestroy', behavior('bd-a05-bh10', 'Emergency containment', 'this.containmentProtocol();', 'ngOnDestroy'), 5),
        ]),
        door('bd-a05-d3', 'airlock-alpha', 'closed', [
          hookSlot('ngOnChanges', behavior('bd-a05-bh11', 'Pressure changes', 'this.adjustPressure(changes);', 'ngOnChanges'), 1),
          hookSlot('ngOnInit', behavior('bd-a05-bh12', 'Initialize airlock', 'this.state = "closed"; this.pressurize();', 'ngOnInit'), 2),
          hookSlot('afterNextRender', behavior('bd-a05-bh13', 'Calibrate pressure gauge', 'this.calibratePressureGauge();', 'afterNextRender'), 3),
          hookSlot('afterRender', behavior('bd-a05-bh14', 'Update pressure readout', 'this.updatePressureReadout();', 'afterRender'), 4),
          hookSlot('ngOnDestroy', behavior('bd-a05-bh15', 'Safe depressurize', 'this.safeDepressurize();', 'ngOnDestroy'), 5),
        ]),
      ],
      hooks: ['ngOnChanges', 'ngOnInit', 'afterNextRender', 'afterRender', 'ngOnDestroy'],
      directives: [
        directive('appAccessControl', 'attribute', [dirInput('requiredClearance', 'string')], [], [], 'Checks crew rank against required clearance level'),
        directive('appStatusIndicator', 'attribute', [], [], ['class.status-open', 'class.status-closed', 'class.status-locked'], 'Adds visual feedback based on door state'),
      ],
      scenarios: [
        scenario('bd-a05-sc1', 'Full system initialization', [
          step('All doors initialize with full lifecycle', [
            doorState('bd-a05-d1', 'locked'),
            doorState('bd-a05-d2', 'locked'),
            doorState('bd-a05-d3', 'closed'),
          ]),
        ]),
        scenario('bd-a05-sc2', 'Clearance change propagation', [
          step('Commander badge scanned, clearance updated', [
            doorState('bd-a05-d1', 'open'),
            doorState('bd-a05-d2', 'locked'),
            doorState('bd-a05-d3', 'closed'),
          ]),
        ]),
        scenario('bd-a05-sc3', 'System shutdown sequence', [
          step('Station-wide shutdown initiated', [
            doorState('bd-a05-d1', 'locked'),
            doorState('bd-a05-d2', 'locked'),
            doorState('bd-a05-d3', 'locked'),
          ]),
        ]),
      ],
      expectedBehavior: [
        expected('bd-a05-sc1', ['ngOnChanges', 'ngOnInit', 'afterNextRender', 'afterRender'], [
          doorState('bd-a05-d1', 'locked'),
          doorState('bd-a05-d2', 'locked'),
          doorState('bd-a05-d3', 'closed'),
        ]),
        expected('bd-a05-sc2', ['ngOnChanges', 'ngOnInit'], [
          doorState('bd-a05-d1', 'open'),
          doorState('bd-a05-d2', 'locked'),
          doorState('bd-a05-d3', 'closed'),
        ]),
        expected('bd-a05-sc3', ['ngOnChanges', 'ngOnInit', 'ngOnDestroy'], [
          doorState('bd-a05-d1', 'locked'),
          doorState('bd-a05-d2', 'locked'),
          doorState('bd-a05-d3', 'locked'),
        ]),
      ],
    },
  },

  // =========================================================================
  // BOSS TIER (Level 18)
  // Note: Spec describes 8-door config for Speed Run mode; story mode uses 6.
  // =========================================================================

  // Level 18 — Emergency Lockdown Protocol
  {
    levelId: 'bd-boss-01',
    gameId: 'blast-doors',
    tier: DifficultyTier.Boss,
    order: 1,
    title: 'Emergency Lockdown Protocol',
    conceptIntroduced: 'Complete system',
    description:
      'Program 6 blast doors with full lifecycle management and 4 custom directives. ' +
      'Handle 5 scenarios: normal operation, crew transition, power failure, hull breach, and full lockdown.',
    parTime: 360, // 6 minutes — spec par time; 8-door config is for Speed Run mode
    data: {
      doors: [
        door('bd-boss-d1', 'main-corridor', 'closed', [
          hookSlot('ngOnChanges', behavior('bd-boss-bh1', 'Track state changes', 'this.processChanges(changes);', 'ngOnChanges'), 1),
          hookSlot('ngOnInit', behavior('bd-boss-bh2', 'Initialize corridor door', 'this.state = "closed"; this.activateAllSensors();', 'ngOnInit'), 2),
          hookSlot('afterNextRender', behavior('bd-boss-bh3', 'Calibrate door sensors', 'this.calibrateSensors();', 'afterNextRender'), 3),
          hookSlot('afterRender', behavior('bd-boss-bh4', 'Sync status display', 'this.syncDisplay();', 'afterRender'), 4),
          hookSlot('ngOnDestroy', behavior('bd-boss-bh5', 'Emergency seal', 'this.emergencySeal();', 'ngOnDestroy'), 5),
        ]),
        door('bd-boss-d2', 'bridge-entrance', 'locked', [
          hookSlot('ngOnChanges', behavior('bd-boss-bh6', 'Clearance check', 'this.verifyClearance(changes);', 'ngOnChanges'), 1),
          hookSlot('ngOnInit', behavior('bd-boss-bh7', 'Initialize bridge door', 'this.state = "locked"; this.biometricInit();', 'ngOnInit'), 2),
          hookSlot('afterNextRender', behavior('bd-boss-bh8', 'Setup biometric overlay', 'this.setupBiometricOverlay();', 'afterNextRender'), 3),
          hookSlot('afterRender', behavior('bd-boss-bh9', 'Animate lock indicator', 'this.animateLock();', 'afterRender'), 4),
          hookSlot('ngOnDestroy', behavior('bd-boss-bh10', 'Deadlock bridge', 'this.engageDeadlock();', 'ngOnDestroy'), 5),
        ]),
        door('bd-boss-d3', 'engineering-bay', 'closed', [
          hookSlot('ngOnChanges', behavior('bd-boss-bh11', 'Monitor power levels', 'this.updatePower(changes);', 'ngOnChanges'), 1),
          hookSlot('ngOnInit', behavior('bd-boss-bh12', 'Initialize engineering door', 'this.state = "closed"; this.powerMonitorInit();', 'ngOnInit'), 2),
          hookSlot('afterNextRender', behavior('bd-boss-bh13', 'Measure power conduit', 'this.measureConduit();', 'afterNextRender'), 3),
          hookSlot('afterRender', behavior('bd-boss-bh14', 'Update power graph', 'this.refreshPowerGraph();', 'afterRender'), 4),
          hookSlot('ngOnDestroy', behavior('bd-boss-bh15', 'Shut down power monitor', 'this.powerMonitor.stop();', 'ngOnDestroy'), 5),
        ]),
        door('bd-boss-d4', 'airlock-alpha', 'closed', [
          hookSlot('ngOnChanges', behavior('bd-boss-bh16', 'Pressure update', 'this.adjustPressure(changes);', 'ngOnChanges'), 1),
          hookSlot('ngOnInit', behavior('bd-boss-bh17', 'Initialize airlock', 'this.state = "closed"; this.pressurize();', 'ngOnInit'), 2),
          hookSlot('afterNextRender', behavior('bd-boss-bh18', 'Calibrate pressure seal', 'this.calibratePressureSeal();', 'afterNextRender'), 3),
          hookSlot('afterRender', behavior('bd-boss-bh19', 'Animate pressure gauge', 'this.animatePressure();', 'afterRender'), 4),
          hookSlot('ngOnDestroy', behavior('bd-boss-bh20', 'Safe depressurize', 'this.safeDepressurize();', 'ngOnDestroy'), 5),
        ]),
        door('bd-boss-d5', 'medical-bay', 'closed', [
          hookSlot('ngOnChanges', behavior('bd-boss-bh21', 'Contamination check', 'this.checkContamination(changes);', 'ngOnChanges'), 1),
          hookSlot('ngOnInit', behavior('bd-boss-bh22', 'Initialize medical door', 'this.state = "closed"; this.decontaminationInit();', 'ngOnInit'), 2),
          hookSlot('afterNextRender', behavior('bd-boss-bh23', 'Setup quarantine overlay', 'this.setupQuarantineOverlay();', 'afterNextRender'), 3),
          hookSlot('afterRender', behavior('bd-boss-bh24', 'Update contamination meter', 'this.refreshContaminationMeter();', 'afterRender'), 4),
          hookSlot('ngOnDestroy', behavior('bd-boss-bh25', 'Seal quarantine', 'this.sealQuarantine();', 'ngOnDestroy'), 5),
        ]),
        door('bd-boss-d6', 'cargo-hold', 'closed', [
          hookSlot('ngOnChanges', behavior('bd-boss-bh26', 'Manifest update', 'this.updateManifest(changes);', 'ngOnChanges'), 1),
          hookSlot('ngOnInit', behavior('bd-boss-bh27', 'Initialize cargo door', 'this.state = "closed"; this.inventoryInit();', 'ngOnInit'), 2),
          hookSlot('afterNextRender', behavior('bd-boss-bh28', 'Scan cargo bay', 'this.scanCargoBay();', 'afterNextRender'), 3),
          hookSlot('afterRender', behavior('bd-boss-bh29', 'Animate inventory ticker', 'this.animateInventory();', 'afterRender'), 4),
          hookSlot('ngOnDestroy', behavior('bd-boss-bh30', 'Lock cargo bay', 'this.lockCargoBay();', 'ngOnDestroy'), 5),
        ]),
      ],
      hooks: ['ngOnChanges', 'ngOnInit', 'afterNextRender', 'afterRender', 'ngOnDestroy'],
      directives: [
        directive('appAccessControl', 'attribute', [dirInput('requiredClearance', 'string')], [], [], 'Checks crew rank against required clearance level'),
        directive('appAutoSeal', 'attribute', [dirInput('delay', 'number', '5000')], [], [], 'Automatically closes door after configurable delay'),
        directive('appEmergencyOverride', 'attribute', [dirInput('overrideCode', 'string')], ['emergencySignal'], [], 'Forces door open/closed regardless of normal state'),
        directive('appStatusIndicator', 'attribute', [], [], ['class.status-open', 'class.status-closed', 'class.status-locked', 'style.boxShadow'], 'Adds visual feedback (icon, glow) based on door state'),
      ],
      scenarios: [
        // Scenario 1: Normal operation
        scenario('bd-boss-sc1', 'Normal operation — crew approaches door', [
          step('Crew approaches main corridor door', [
            doorState('bd-boss-d1', 'open'),
            doorState('bd-boss-d2', 'locked'),
            doorState('bd-boss-d3', 'closed'),
            doorState('bd-boss-d4', 'closed'),
            doorState('bd-boss-d5', 'closed'),
            doorState('bd-boss-d6', 'closed'),
          ]),
          step('Crew passes, auto-seal closes door', [
            doorState('bd-boss-d1', 'closed'),
            doorState('bd-boss-d2', 'locked'),
            doorState('bd-boss-d3', 'closed'),
            doorState('bd-boss-d4', 'closed'),
            doorState('bd-boss-d5', 'closed'),
            doorState('bd-boss-d6', 'closed'),
          ]),
        ]),
        // Scenario 2: Crew transition
        scenario('bd-boss-sc2', 'Crew transition — shift change', [
          step('Shift change begins, multiple doors open in sequence', [
            doorState('bd-boss-d1', 'open'),
            doorState('bd-boss-d2', 'open'),
            doorState('bd-boss-d3', 'open'),
            doorState('bd-boss-d4', 'closed'),
            doorState('bd-boss-d5', 'closed'),
            doorState('bd-boss-d6', 'closed'),
          ]),
          step('Transition complete, doors return to default', [
            doorState('bd-boss-d1', 'closed'),
            doorState('bd-boss-d2', 'locked'),
            doorState('bd-boss-d3', 'closed'),
            doorState('bd-boss-d4', 'closed'),
            doorState('bd-boss-d5', 'closed'),
            doorState('bd-boss-d6', 'closed'),
          ]),
        ]),
        // Scenario 3: Power failure
        scenario('bd-boss-sc3', 'Power failure — all doors lock to fail-safe', [
          step('Main power lost, emergency power activates', [
            doorState('bd-boss-d1', 'locked'),
            doorState('bd-boss-d2', 'locked'),
            doorState('bd-boss-d3', 'locked'),
            doorState('bd-boss-d4', 'locked'),
            doorState('bd-boss-d5', 'locked'),
            doorState('bd-boss-d6', 'locked'),
          ]),
        ]),
        // Scenario 4: Hull breach
        scenario('bd-boss-sc4', 'Hull breach — emergency containment', [
          step('Hull breach detected near airlock', [
            doorState('bd-boss-d1', 'open'),
            doorState('bd-boss-d2', 'locked'),
            doorState('bd-boss-d3', 'open'),
            doorState('bd-boss-d4', 'locked'),
            doorState('bd-boss-d5', 'open'),
            doorState('bd-boss-d6', 'locked'),
          ]),
        ]),
        // Scenario 5: Full lockdown
        scenario('bd-boss-sc5', 'Full lockdown — command override only', [
          step('Full lockdown engaged, all doors locked', [
            doorState('bd-boss-d1', 'locked'),
            doorState('bd-boss-d2', 'locked'),
            doorState('bd-boss-d3', 'locked'),
            doorState('bd-boss-d4', 'locked'),
            doorState('bd-boss-d5', 'locked'),
            doorState('bd-boss-d6', 'locked'),
          ]),
          step('Command-rank crew uses emergency override on bridge', [
            doorState('bd-boss-d1', 'locked'),
            doorState('bd-boss-d2', 'open'),
            doorState('bd-boss-d3', 'locked'),
            doorState('bd-boss-d4', 'locked'),
            doorState('bd-boss-d5', 'locked'),
            doorState('bd-boss-d6', 'locked'),
          ]),
        ]),
      ],
      expectedBehavior: [
        expected('bd-boss-sc1', ['ngOnChanges', 'ngOnInit', 'afterNextRender', 'afterRender'], [
          doorState('bd-boss-d1', 'closed'),
          doorState('bd-boss-d2', 'locked'),
          doorState('bd-boss-d3', 'closed'),
          doorState('bd-boss-d4', 'closed'),
          doorState('bd-boss-d5', 'closed'),
          doorState('bd-boss-d6', 'closed'),
        ]),
        expected('bd-boss-sc2', ['ngOnChanges', 'ngOnInit', 'afterNextRender', 'afterRender'], [
          doorState('bd-boss-d1', 'closed'),
          doorState('bd-boss-d2', 'locked'),
          doorState('bd-boss-d3', 'closed'),
          doorState('bd-boss-d4', 'closed'),
          doorState('bd-boss-d5', 'closed'),
          doorState('bd-boss-d6', 'closed'),
        ]),
        expected('bd-boss-sc3', ['ngOnChanges', 'ngOnInit', 'afterNextRender', 'afterRender', 'ngOnDestroy'], [
          doorState('bd-boss-d1', 'locked'),
          doorState('bd-boss-d2', 'locked'),
          doorState('bd-boss-d3', 'locked'),
          doorState('bd-boss-d4', 'locked'),
          doorState('bd-boss-d5', 'locked'),
          doorState('bd-boss-d6', 'locked'),
        ]),
        expected('bd-boss-sc4', ['ngOnChanges', 'ngOnInit', 'afterNextRender', 'afterRender'], [
          doorState('bd-boss-d1', 'open'),
          doorState('bd-boss-d2', 'locked'),
          doorState('bd-boss-d3', 'open'),
          doorState('bd-boss-d4', 'locked'),
          doorState('bd-boss-d5', 'open'),
          doorState('bd-boss-d6', 'locked'),
        ]),
        expected('bd-boss-sc5', ['ngOnChanges', 'ngOnInit', 'afterNextRender', 'afterRender', 'ngOnDestroy'], [
          doorState('bd-boss-d1', 'locked'),
          doorState('bd-boss-d2', 'open'),
          doorState('bd-boss-d3', 'locked'),
          doorState('bd-boss-d4', 'locked'),
          doorState('bd-boss-d5', 'locked'),
          doorState('bd-boss-d6', 'locked'),
        ]),
      ],
    },
  },
];

// ---------------------------------------------------------------------------
// LevelPack export
// ---------------------------------------------------------------------------

export const BLAST_DOORS_LEVEL_PACK: LevelPack = {
  gameId: 'blast-doors',
  levels: BLAST_DOORS_LEVELS,
};
