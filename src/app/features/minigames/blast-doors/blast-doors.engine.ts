import { signal, type Signal } from '@angular/core';
import { MinigameEngine, type ActionResult } from '../../../core/minigame/minigame-engine';
import type { MinigameEngineConfig } from '../../../core/minigame/minigame-engine';
import { MinigameStatus } from '../../../core/minigame/minigame.types';
import type {
  BlastDoorsLevelData,
  RuntimeBlastDoor,
  BehaviorBlock,
  DirectiveSpec,
  DoorScenario,
  DoorState,
  ExpectedBehavior,
  LifecycleHook,
  ScenarioResult,
  ScenarioStepResult,
  BlastDoorsLifecycleService,
} from './blast-doors.types';
import { LIFECYCLE_HOOK_ORDER, isHookOrderValid } from './blast-doors.types';

// ---------------------------------------------------------------------------
// Action types
// ---------------------------------------------------------------------------

export interface PlaceBehaviorAction {
  readonly type: 'place-behavior';
  readonly doorId: string;
  readonly hookType: LifecycleHook;
  readonly behaviorBlockId: string;
}

export interface RemoveBehaviorAction {
  readonly type: 'remove-behavior';
  readonly doorId: string;
  readonly hookType: LifecycleHook;
}

export interface ApplyDirectiveAction {
  readonly type: 'apply-directive';
  readonly doorId: string;
  readonly directiveName: string;
}

export interface RemoveDirectiveAction {
  readonly type: 'remove-directive';
  readonly doorId: string;
  readonly directiveName: string;
}

export type BlastDoorsAction =
  | PlaceBehaviorAction
  | RemoveBehaviorAction
  | ApplyDirectiveAction
  | RemoveDirectiveAction;

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

function isPlaceBehaviorAction(action: unknown): action is PlaceBehaviorAction {
  return (
    typeof action === 'object' &&
    action !== null &&
    (action as PlaceBehaviorAction).type === 'place-behavior' &&
    typeof (action as PlaceBehaviorAction).doorId === 'string' &&
    typeof (action as PlaceBehaviorAction).hookType === 'string' &&
    typeof (action as PlaceBehaviorAction).behaviorBlockId === 'string'
  );
}

function isRemoveBehaviorAction(action: unknown): action is RemoveBehaviorAction {
  return (
    typeof action === 'object' &&
    action !== null &&
    (action as RemoveBehaviorAction).type === 'remove-behavior' &&
    typeof (action as RemoveBehaviorAction).doorId === 'string' &&
    typeof (action as RemoveBehaviorAction).hookType === 'string'
  );
}

function isApplyDirectiveAction(action: unknown): action is ApplyDirectiveAction {
  return (
    typeof action === 'object' &&
    action !== null &&
    (action as ApplyDirectiveAction).type === 'apply-directive' &&
    typeof (action as ApplyDirectiveAction).doorId === 'string' &&
    typeof (action as ApplyDirectiveAction).directiveName === 'string'
  );
}

function isRemoveDirectiveAction(action: unknown): action is RemoveDirectiveAction {
  return (
    typeof action === 'object' &&
    action !== null &&
    (action as RemoveDirectiveAction).type === 'remove-directive' &&
    typeof (action as RemoveDirectiveAction).doorId === 'string' &&
    typeof (action as RemoveDirectiveAction).directiveName === 'string'
  );
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const PERFECT_SCORE_MULTIPLIER = 1.0;
export const SECOND_ATTEMPT_MULTIPLIER = 0.4;
export const THIRD_ATTEMPT_MULTIPLIER = 0.2;
export const DEFAULT_MAX_SIMULATIONS = 3;

const INVALID_NO_CHANGE: ActionResult = { valid: false, scoreChange: 0, livesChange: 0 };
const VALID_NO_CHANGE: ActionResult = { valid: true, scoreChange: 0, livesChange: 0 };

// ---------------------------------------------------------------------------
// Simulation run result (engine-local type)
// ---------------------------------------------------------------------------

export interface SimulationRunResult {
  readonly scenarioResults: readonly ScenarioResult[];
  readonly allPassed: boolean;
  readonly failedCount: number;
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class BlastDoorsEngine extends MinigameEngine<BlastDoorsLevelData> {
  // --- Private writable signals ---
  private readonly _runtimeDoors = signal<readonly RuntimeBlastDoor[]>([]);
  private readonly _availableBehaviors = signal<readonly BehaviorBlock[]>([]);
  private readonly _availableDirectives = signal<readonly DirectiveSpec[]>([]);
  private readonly _simulationResult = signal<SimulationRunResult | null>(null);
  private readonly _simulationCount = signal(0);
  private readonly _simulationsRemaining = signal(DEFAULT_MAX_SIMULATIONS);

  // --- Private state ---
  private _scenarios: readonly DoorScenario[] = [];
  private _expectedBehaviors: readonly ExpectedBehavior[] = [];
  private readonly _lifecycleService: BlastDoorsLifecycleService | undefined;

  // --- Public read-only signals ---
  readonly runtimeDoors: Signal<readonly RuntimeBlastDoor[]> = this._runtimeDoors.asReadonly();
  readonly availableBehaviors: Signal<readonly BehaviorBlock[]> = this._availableBehaviors.asReadonly();
  readonly availableDirectives: Signal<readonly DirectiveSpec[]> = this._availableDirectives.asReadonly();
  readonly simulationResult: Signal<SimulationRunResult | null> = this._simulationResult.asReadonly();
  readonly simulationCount: Signal<number> = this._simulationCount.asReadonly();
  readonly simulationsRemaining: Signal<number> = this._simulationsRemaining.asReadonly();

  constructor(config?: Partial<MinigameEngineConfig>, lifecycleService?: BlastDoorsLifecycleService) {
    super(config);
    this._lifecycleService = lifecycleService;
  }

  // --- Lifecycle hooks ---

  protected onLevelLoad(data: BlastDoorsLevelData): void {
    // Convert immutable doors to mutable runtime doors
    const runtimeDoors: RuntimeBlastDoor[] = data.doors.map(door => ({
      id: door.id,
      position: door.position,
      currentState: door.currentState,
      hookSlots: door.hookSlots.map(slot => ({
        hookType: slot.hookType,
        behaviorBlock: slot.behaviorBlock,
        executionOrder: slot.executionOrder,
        ...(slot.phase ? { phase: slot.phase } : {}),
      })),
      appliedDirectives: [],
    }));
    this._runtimeDoors.set(runtimeDoors);

    // Collect all non-null behaviorBlock values from ALL hookSlots across ALL doors,
    // dedupe by id, and store as the available pool of behavior blocks.
    // This derivation ensures the player can only use behaviors that exist in the level data.
    const blockMap = new Map<string, BehaviorBlock>();
    for (const door of data.doors) {
      for (const slot of door.hookSlots) {
        if (slot.behaviorBlock !== null && !blockMap.has(slot.behaviorBlock.id)) {
          blockMap.set(slot.behaviorBlock.id, slot.behaviorBlock);
        }
      }
    }
    this._availableBehaviors.set([...blockMap.values()]);

    this._availableDirectives.set([...data.directives]);
    this._scenarios = data.scenarios;
    this._expectedBehaviors = data.expectedBehavior;
    this._simulationResult.set(null);
    this._simulationCount.set(0);
    this._simulationsRemaining.set(DEFAULT_MAX_SIMULATIONS);

    this._lifecycleService?.reset?.();
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected onStart(): void {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected onComplete(): void {}

  // --- Action validation ---

  protected validateAction(action: unknown): ActionResult {
    if (isPlaceBehaviorAction(action)) return this.handlePlaceBehavior(action);
    if (isRemoveBehaviorAction(action)) return this.handleRemoveBehavior(action);
    if (isApplyDirectiveAction(action)) return this.handleApplyDirective(action);
    if (isRemoveDirectiveAction(action)) return this.handleRemoveDirective(action);
    return INVALID_NO_CHANGE;
  }

  // --- Simulation ---

  simulate(): SimulationRunResult | null {
    if (this.status() !== MinigameStatus.Playing) {
      return null;
    }

    // Decrement-then-check (same as all other engines)
    this._simulationsRemaining.update(v => v - 1);
    this._simulationCount.update(c => c + 1);

    const doors = this._runtimeDoors();
    const scenarioResults: ScenarioResult[] = [];

    for (const scenario of this._scenarios) {
      const expected = this._expectedBehaviors.find(eb => eb.scenarioId === scenario.id);
      if (!expected) {
        scenarioResults.push({ scenarioId: scenario.id, passed: false, stepResults: [] });
        continue;
      }

      const result = this._lifecycleService
        ? this._lifecycleService.simulateScenario(doors, scenario, this._expectedBehaviors)
        : this.inlineSimulateScenario(doors, scenario, expected);

      scenarioResults.push(result);
    }

    const failedCount = scenarioResults.filter(r => !r.passed).length;
    const allPassed = failedCount === 0;
    const runResult: SimulationRunResult = { scenarioResults, allPassed, failedCount };

    this._simulationResult.set(runResult);

    if (allPassed) {
      const score = this.calculateScore();
      this.addScore(score);
      this.complete();
    } else if (this._simulationsRemaining() <= 0) {
      this.fail();
    }

    return runResult;
  }

  // --- Private action handlers ---

  private handlePlaceBehavior(action: PlaceBehaviorAction): ActionResult {
    const doors = this._runtimeDoors();
    const door = doors.find(d => d.id === action.doorId);
    if (!door) return INVALID_NO_CHANGE;

    const block = this._availableBehaviors().find(b => b.id === action.behaviorBlockId);
    if (!block) return INVALID_NO_CHANGE;

    const slotIndex = door.hookSlots.findIndex(s => s.hookType === action.hookType);
    if (slotIndex === -1) return INVALID_NO_CHANGE;

    if (door.hookSlots[slotIndex].behaviorBlock !== null) return INVALID_NO_CHANGE;

    this._runtimeDoors.set(doors.map(d => {
      if (d.id !== action.doorId) return d;
      return {
        ...d,
        hookSlots: d.hookSlots.map((s, i) =>
          i === slotIndex ? { ...s, behaviorBlock: block } : s,
        ),
      };
    }));

    return VALID_NO_CHANGE;
  }

  private handleRemoveBehavior(action: RemoveBehaviorAction): ActionResult {
    const doors = this._runtimeDoors();
    const door = doors.find(d => d.id === action.doorId);
    if (!door) return INVALID_NO_CHANGE;

    const slotIndex = door.hookSlots.findIndex(s => s.hookType === action.hookType);
    if (slotIndex === -1) return INVALID_NO_CHANGE;

    if (door.hookSlots[slotIndex].behaviorBlock === null) return INVALID_NO_CHANGE;

    this._runtimeDoors.set(doors.map(d => {
      if (d.id !== action.doorId) return d;
      return {
        ...d,
        hookSlots: d.hookSlots.map((s, i) =>
          i === slotIndex ? { ...s, behaviorBlock: null } : s,
        ),
      };
    }));

    return VALID_NO_CHANGE;
  }

  private handleApplyDirective(action: ApplyDirectiveAction): ActionResult {
    const doors = this._runtimeDoors();
    const door = doors.find(d => d.id === action.doorId);
    if (!door) return INVALID_NO_CHANGE;

    const directive = this._availableDirectives().find(d => d.name === action.directiveName);
    if (!directive) return INVALID_NO_CHANGE;

    if (door.appliedDirectives.some(d => d.name === action.directiveName)) return INVALID_NO_CHANGE;

    this._runtimeDoors.set(doors.map(d => {
      if (d.id !== action.doorId) return d;
      return { ...d, appliedDirectives: [...d.appliedDirectives, directive] };
    }));

    return VALID_NO_CHANGE;
  }

  private handleRemoveDirective(action: RemoveDirectiveAction): ActionResult {
    const doors = this._runtimeDoors();
    const door = doors.find(d => d.id === action.doorId);
    if (!door) return INVALID_NO_CHANGE;

    if (!door.appliedDirectives.some(d => d.name === action.directiveName)) return INVALID_NO_CHANGE;

    this._runtimeDoors.set(doors.map(d => {
      if (d.id !== action.doorId) return d;
      return { ...d, appliedDirectives: d.appliedDirectives.filter(dir => dir.name !== action.directiveName) };
    }));

    return VALID_NO_CHANGE;
  }

  // --- Inline simulation ---

  private inlineSimulateScenario(
    doors: readonly RuntimeBlastDoor[],
    scenario: DoorScenario,
    expected: ExpectedBehavior,
  ): ScenarioResult {
    // Validate hook ordering on each door
    for (const door of doors) {
      if (!isHookOrderValid(door.hookSlots)) {
        return { scenarioId: scenario.id, passed: false, stepResults: [] };
      }
    }

    // Derive door states by walking hooks in LIFECYCLE_HOOK_ORDER
    const doorStates = new Map<string, DoorState>();
    for (const door of doors) {
      let state = door.currentState;

      // Walk hook slots sorted by execution order
      const sortedSlots = [...door.hookSlots].sort((a, b) => a.executionOrder - b.executionOrder);
      for (const slot of sortedSlots) {
        if (slot.behaviorBlock && slot.behaviorBlock.hookTarget === slot.hookType) {
          state = this.deriveStateFromHook(slot.behaviorBlock.hookTarget, state);
        }
      }

      // Apply directives in order
      for (const directive of door.appliedDirectives) {
        state = this.deriveStateFromDirective(directive, state);
      }

      doorStates.set(door.id, state);
    }

    // Determine hooks that were "fired": slots with a non-null behaviorBlock
    // where block.hookTarget === slot.hookType, in LIFECYCLE_HOOK_ORDER canonical order.
    const firedHooks: LifecycleHook[] = [];
    for (const hookType of LIFECYCLE_HOOK_ORDER) {
      for (const door of doors) {
        for (const slot of door.hookSlots) {
          if (
            slot.behaviorBlock !== null &&
            slot.behaviorBlock.hookTarget === slot.hookType &&
            slot.hookType === hookType &&
            !firedHooks.includes(hookType)
          ) {
            firedHooks.push(hookType);
          }
        }
      }
    }

    // Evaluate each scenario step
    const stepResults: ScenarioStepResult[] = [];
    let allStepsPassed = true;

    for (const step of scenario.steps) {
      const doorResults = step.expectedDoorStates.map(eds => {
        const actual = doorStates.get(eds.doorId) ?? 'closed';
        return {
          doorId: eds.doorId,
          expected: eds.expectedState,
          actual,
          match: actual === eds.expectedState,
        };
      });
      const passed = doorResults.every(r => r.match);
      if (!passed) allStepsPassed = false;
      stepResults.push({ event: step.event, passed, doorResults });
    }

    // Check final door states against expected
    const finalMatch = expected.finalDoorStates.every(fds => {
      const actual = doorStates.get(fds.doorId) ?? 'closed';
      return actual === fds.expectedState;
    });

    // Check fired hooks against expected
    const hooksMatch =
      firedHooks.length === expected.hooksFired.length &&
      firedHooks.every((h, i) => h === expected.hooksFired[i]);

    const passed = allStepsPassed && finalMatch && hooksMatch;

    return { scenarioId: scenario.id, passed, stepResults };
  }

  /**
   * Derives door state from a lifecycle hook target.
   * Uses hookTarget field (NOT string matching on code content).
   * Map: ngOnInit -> 'open', ngOnDestroy -> 'closed', afterRender -> keep current.
   *
   * TODO: afterRender phase ordering is OUT OF SCOPE for this ticket.
   * T-2026-444 will handle phase-aware afterRender state derivation.
   */
  private deriveStateFromHook(hookTarget: LifecycleHook, currentState: DoorState): DoorState {
    switch (hookTarget) {
      case 'ngOnInit': return 'open';
      case 'ngOnDestroy': return 'closed';
      case 'ngOnChanges': return currentState;
      case 'afterNextRender': return currentState;
      case 'afterRender': return currentState; // TODO: T-2026-444 — phase-aware ordering
      default: return currentState;
    }
  }

  /**
   * Derives door state from a directive's behavior string.
   * Checks for 'lock' -> 'locked', 'close' -> 'closed', 'open' -> 'open'.
   */
  private deriveStateFromDirective(directive: DirectiveSpec, currentState: DoorState): DoorState {
    const behavior = directive.behavior.toLowerCase();
    if (behavior.includes('lock')) return 'locked';
    if (behavior.includes('close')) return 'closed';
    if (behavior.includes('open')) return 'open';
    return currentState;
  }

  // --- Private scoring ---

  private calculateScore(): number {
    const maxScore = this.config.maxScore;
    const count = this._simulationCount();

    if (count === 1) return Math.round(maxScore * PERFECT_SCORE_MULTIPLIER);
    if (count === 2) return Math.round(maxScore * SECOND_ATTEMPT_MULTIPLIER);
    return Math.round(maxScore * THIRD_ATTEMPT_MULTIPLIER);
  }
}
