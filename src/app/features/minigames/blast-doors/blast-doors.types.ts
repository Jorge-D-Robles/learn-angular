// ---------------------------------------------------------------------------
// Canonical domain model types for Blast Doors minigame
//
// Level-data types (readonly, immutable) define the door configuration,
// lifecycle hook slots, directives, and scenarios for each level.
// Runtime types (mutable) extend them with processing state for use by the
// lifecycle service and engine during gameplay.
// ---------------------------------------------------------------------------

// --- String union types ---

/**
 * Angular lifecycle hook discriminator.
 * Uses a string union (not an enum) to match project conventions.
 */
export type LifecycleHook =
  | 'ngOnInit'
  | 'ngOnChanges'
  | 'ngOnDestroy'
  | 'afterNextRender'
  | 'afterRender';

/** Blast door operational state. */
export type DoorState = 'open' | 'closed' | 'locked';

/** Angular directive type discriminator. */
export type DirectiveType = 'attribute' | 'structural';

/**
 * Phase discriminator for afterRender hooks.
 * Used in levels that teach phase-aware rendering callbacks.
 */
export type AfterRenderPhase = 'read' | 'write' | 'mixedReadWrite';

// --- Level-data types (readonly) ---

/** A behavior block that can be placed in a lifecycle hook slot. */
export interface BehaviorBlock {
  readonly id: string;
  readonly description: string;
  readonly code: string;
  readonly hookTarget: LifecycleHook;
}

/**
 * A lifecycle hook slot on a blast door's timeline.
 * The optional `phase` field applies only to afterRender hooks for
 * phase-aware levels.
 */
export interface HookSlot {
  readonly hookType: LifecycleHook;
  readonly behaviorBlock: BehaviorBlock | null;
  readonly executionOrder: number;
  readonly phase?: AfterRenderPhase;
}

/** A blast door in a station section. */
export interface BlastDoor {
  readonly id: string;
  readonly position: string;
  readonly currentState: DoorState;
  readonly hookSlots: readonly HookSlot[];
}

/** An input parameter for a custom directive. */
export interface DirectiveInput {
  readonly name: string;
  readonly type: string;
  readonly defaultValue?: string;
}

/** A custom directive specification applied to a blast door. */
export interface DirectiveSpec {
  readonly name: string;
  readonly type: DirectiveType;
  readonly inputs: readonly DirectiveInput[];
  readonly hostListeners: readonly string[];
  readonly hostBindings: readonly string[];
  readonly behavior: string;
}

/** Expected door state at a point in a scenario simulation. */
export interface ExpectedDoorState {
  readonly doorId: string;
  readonly expectedState: DoorState;
}

/** A single step in a door scenario simulation. */
export interface ScenarioStep {
  readonly event: string;
  readonly expectedDoorStates: readonly ExpectedDoorState[];
}

/** A scenario that simulates events and validates door responses. */
export interface DoorScenario {
  readonly id: string;
  readonly trigger: string;
  readonly steps: readonly ScenarioStep[];
}

/** Expected behavior result for a scenario (answer key). */
export interface ExpectedBehavior {
  readonly scenarioId: string;
  readonly hooksFired: readonly LifecycleHook[];
  readonly finalDoorStates: readonly ExpectedDoorState[];
}

/**
 * Game-specific level data for Blast Doors.
 * Plugs into `LevelDefinition<BlastDoorsLevelData>`.
 */
export interface BlastDoorsLevelData {
  readonly doors: readonly BlastDoor[];
  readonly hooks: readonly LifecycleHook[];
  readonly directives: readonly DirectiveSpec[];
  readonly scenarios: readonly DoorScenario[];
  readonly expectedBehavior: readonly ExpectedBehavior[];
}

// --- Runtime types (mutable) ---

/** Runtime hook slot with mutable behavior assignment. */
export interface RuntimeHookSlot extends Omit<HookSlot, 'behaviorBlock'> {
  behaviorBlock: BehaviorBlock | null;
}

/** Runtime blast door with mutable state and hook slots. */
export interface RuntimeBlastDoor extends Omit<BlastDoor, 'currentState' | 'hookSlots'> {
  currentState: DoorState;
  hookSlots: RuntimeHookSlot[];
  appliedDirectives: DirectiveSpec[];
}

/** Result of validating hook ordering on a door. */
export interface HookOrderResult {
  readonly valid: boolean;
  readonly correctOrder: readonly LifecycleHook[];
  readonly actualOrder: readonly LifecycleHook[];
  readonly misplacedHooks: readonly { hook: LifecycleHook; actualIndex: number; expectedIndex: number }[];
}

/** Result of a single scenario step execution. */
export interface ScenarioStepResult {
  readonly event: string;
  readonly passed: boolean;
  readonly doorResults: readonly { doorId: string; expected: DoorState; actual: DoorState; match: boolean }[];
}

/** Result of running a full scenario simulation. */
export interface ScenarioResult {
  readonly scenarioId: string;
  readonly passed: boolean;
  readonly stepResults: readonly ScenarioStepResult[];
}

// --- Service interface ---

/**
 * Lifecycle simulation service interface for Blast Doors.
 * Placeholder with simplified signature — T-2026-444 will expand this interface
 * with full loadDoors, assignBehavior, validateHookOrder, getDoorStates, etc.
 *
 * Matching the established pattern (PowerGridInjectionService in power-grid.types.ts).
 */
export interface BlastDoorsLifecycleService {
  simulateScenario(
    doors: readonly RuntimeBlastDoor[],
    scenario: DoorScenario,
    expectedBehavior: readonly ExpectedBehavior[],
  ): ScenarioResult;
  reset?(): void;
}

// --- Constants ---

/**
 * Angular's lifecycle hook execution order.
 * This is the canonical ordering used for validation.
 *
 * Note: afterRender phases (read, write, mixedReadWrite) are phase-specific
 * and their intra-phase ordering is deferred to the engine (T-2026-107).
 * This constant only tracks hook-level ordering.
 */
export const LIFECYCLE_HOOK_ORDER: readonly LifecycleHook[] = [
  'ngOnChanges',
  'ngOnInit',
  'afterNextRender',
  'afterRender',
  'ngOnDestroy',
] as const;

// --- Utility functions ---

/**
 * Validates that hook slots are arranged in Angular's correct lifecycle order.
 * Only considers slots that have a behavior block assigned (non-null).
 * Compares the relative ordering of assigned hooks against LIFECYCLE_HOOK_ORDER.
 *
 * Returns false if two slots share the same hookType (duplicate hook detection).
 */
export function isHookOrderValid(
  hookSlots: readonly HookSlot[],
): boolean {
  const assignedSlots = hookSlots
    .filter(slot => slot.behaviorBlock !== null)
    .sort((a, b) => a.executionOrder - b.executionOrder);

  if (assignedSlots.length <= 1) return true;

  // Duplicate hook detection: two assigned slots must not share the same hookType
  const seen = new Set<LifecycleHook>();
  for (const slot of assignedSlots) {
    if (seen.has(slot.hookType)) return false;
    seen.add(slot.hookType);
  }

  for (let i = 0; i < assignedSlots.length - 1; i++) {
    const currentIdx = LIFECYCLE_HOOK_ORDER.indexOf(assignedSlots[i].hookType);
    const nextIdx = LIFECYCLE_HOOK_ORDER.indexOf(assignedSlots[i + 1].hookType);
    if (currentIdx > nextIdx) return false;
  }

  return true;
}

/**
 * Validates that a scenario step has a non-empty event and at least one
 * expected door state.
 */
export function isScenarioStepValid(
  step: Pick<ScenarioStep, 'event' | 'expectedDoorStates'>,
): boolean {
  return step.event.trim().length > 0 && step.expectedDoorStates.length > 0;
}
