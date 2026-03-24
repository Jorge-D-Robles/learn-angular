// ---------------------------------------------------------------------------
// BlastDoorsLifecycleServiceImpl — lifecycle hook ordering and scenario simulation
// ---------------------------------------------------------------------------
// NOT providedIn: 'root'. This service is scoped to the Blast Doors
// component tree. Providing it locally ensures automatic cleanup on
// component destroy and prevents leaked state between minigame sessions.
// ---------------------------------------------------------------------------

import { Injectable, signal, type Signal } from '@angular/core';
import {
  LIFECYCLE_HOOK_ORDER,
  isHookOrderValid,
  type BlastDoorsLifecycleService,
  type BlastDoor,
  type BehaviorBlock,
  type DirectiveSpec,
  type DoorScenario,
  type DoorState,
  type ExpectedBehavior,
  type HookOrderResult,
  type LifecycleHook,
  type RuntimeBlastDoor,
  type ScenarioResult,
  type ScenarioStepResult,
} from './blast-doors.types';

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class BlastDoorsLifecycleServiceImpl implements BlastDoorsLifecycleService {
  private readonly _doorStates = signal<Map<string, RuntimeBlastDoor>>(new Map());

  // =========================================================================
  // loadDoors
  // =========================================================================

  loadDoors(doors: readonly BlastDoor[]): void {
    const map = new Map<string, RuntimeBlastDoor>();
    for (const door of doors) {
      map.set(door.id, this._toRuntime(door));
    }
    this._doorStates.set(map);
  }

  // =========================================================================
  // assignBehavior
  // =========================================================================

  assignBehavior(doorId: string, hookType: LifecycleHook, behavior: BehaviorBlock): boolean {
    const map = this._doorStates();
    const door = map.get(doorId);
    if (!door) return false;

    const slotIndex = door.hookSlots.findIndex(s => s.hookType === hookType);
    if (slotIndex === -1) return false;
    if (door.hookSlots[slotIndex].behaviorBlock !== null) return false;

    const updated = this._updateDoor(door, {
      hookSlots: door.hookSlots.map((s, i) =>
        i === slotIndex ? { ...s, behaviorBlock: behavior } : s,
      ),
    });
    this._setDoor(updated);
    return true;
  }

  // =========================================================================
  // removeBehavior
  // =========================================================================

  removeBehavior(doorId: string, hookType: LifecycleHook): boolean {
    const map = this._doorStates();
    const door = map.get(doorId);
    if (!door) return false;

    const slotIndex = door.hookSlots.findIndex(s => s.hookType === hookType);
    if (slotIndex === -1) return false;
    if (door.hookSlots[slotIndex].behaviorBlock === null) return false;

    const updated = this._updateDoor(door, {
      hookSlots: door.hookSlots.map((s, i) =>
        i === slotIndex ? { ...s, behaviorBlock: null } : s,
      ),
    });
    this._setDoor(updated);
    return true;
  }

  // =========================================================================
  // validateHookOrder
  // =========================================================================

  validateHookOrder(doorId: string): HookOrderResult {
    const map = this._doorStates();
    const door = map.get(doorId);
    if (!door) {
      throw new Error(`Door not found: ${doorId}`);
    }

    const assignedSlots = door.hookSlots
      .filter(s => s.behaviorBlock !== null)
      .sort((a, b) => a.executionOrder - b.executionOrder);

    const actualOrder: LifecycleHook[] = assignedSlots.map(s => s.hookType);
    const valid = isHookOrderValid(door.hookSlots);

    const misplacedHooks: { hook: LifecycleHook; actualIndex: number; expectedIndex: number }[] = [];

    if (!valid) {
      for (let i = 0; i < actualOrder.length; i++) {
        const hook = actualOrder[i];
        const expectedIndex = LIFECYCLE_HOOK_ORDER.indexOf(hook);
        // Find where this hook should be relative to the others
        const sortedByExpected = [...actualOrder].sort(
          (a, b) => LIFECYCLE_HOOK_ORDER.indexOf(a) - LIFECYCLE_HOOK_ORDER.indexOf(b),
        );
        const expectedPosition = sortedByExpected.indexOf(hook);
        if (i !== expectedPosition) {
          misplacedHooks.push({ hook, actualIndex: i, expectedIndex });
        }
      }
    }

    return {
      valid,
      correctOrder: LIFECYCLE_HOOK_ORDER,
      actualOrder,
      misplacedHooks,
    };
  }

  // =========================================================================
  // simulateScenario (engine interface method)
  // =========================================================================

  simulateScenario(
    doors: readonly RuntimeBlastDoor[],
    scenario: DoorScenario,
    expectedBehavior: readonly ExpectedBehavior[],
  ): ScenarioResult {
    const expected = expectedBehavior.find(eb => eb.scenarioId === scenario.id);
    if (!expected) {
      return { scenarioId: scenario.id, passed: false, stepResults: [] };
    }

    // Validate hook ordering on each door
    for (const door of doors) {
      if (!isHookOrderValid(door.hookSlots)) {
        return { scenarioId: scenario.id, passed: false, stepResults: [] };
      }
    }

    // Derive door states by walking hooks in execution order
    const doorStates = new Map<string, DoorState>();
    for (const door of doors) {
      let state = door.currentState;

      const sortedSlots = [...door.hookSlots].sort((a, b) => a.executionOrder - b.executionOrder);
      for (const slot of sortedSlots) {
        if (slot.behaviorBlock && slot.behaviorBlock.hookTarget === slot.hookType) {
          state = this._deriveStateFromHook(slot.behaviorBlock.hookTarget, state);
        }
      }

      // Apply directives in order
      for (const directive of door.appliedDirectives) {
        state = this._deriveStateFromDirective(directive, state);
      }

      doorStates.set(door.id, state);
    }

    // Determine hooks that were "fired"
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

  // =========================================================================
  // getCorrectHookOrder
  // =========================================================================

  getCorrectHookOrder(): readonly LifecycleHook[] {
    return LIFECYCLE_HOOK_ORDER;
  }

  // =========================================================================
  // applyDirective
  // =========================================================================

  applyDirective(doorId: string, directive: DirectiveSpec): boolean {
    const map = this._doorStates();
    const door = map.get(doorId);
    if (!door) return false;

    if (door.appliedDirectives.some(d => d.name === directive.name)) return false;

    const updated = this._updateDoor(door, {
      appliedDirectives: [...door.appliedDirectives, directive],
    });
    this._setDoor(updated);
    return true;
  }

  // =========================================================================
  // getDoorStates
  // =========================================================================

  getDoorStates(): Signal<Map<string, RuntimeBlastDoor>> {
    return this._doorStates.asReadonly();
  }

  // =========================================================================
  // reset
  // =========================================================================

  reset(): void {
    this._doorStates.set(new Map());
  }

  // =========================================================================
  // Private helpers
  // =========================================================================

  private _toRuntime(door: BlastDoor): RuntimeBlastDoor {
    return {
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
    };
  }

  private _updateDoor(
    door: RuntimeBlastDoor,
    changes: Partial<RuntimeBlastDoor>,
  ): RuntimeBlastDoor {
    return { ...door, ...changes };
  }

  private _setDoor(door: RuntimeBlastDoor): void {
    this._doorStates.update(map => {
      const next = new Map(map);
      next.set(door.id, door);
      return next;
    });
  }

  private _deriveStateFromHook(hookTarget: LifecycleHook, currentState: DoorState): DoorState {
    switch (hookTarget) {
      case 'ngOnInit': return 'open';
      case 'ngOnDestroy': return 'closed';
      case 'ngOnChanges': return currentState;
      case 'afterNextRender': return currentState;
      case 'afterRender': return currentState;
      default: return currentState;
    }
  }

  private _deriveStateFromDirective(directive: DirectiveSpec, currentState: DoorState): DoorState {
    const behavior = directive.behavior.toLowerCase();
    if (behavior.includes('lock')) return 'locked';
    if (behavior.includes('close')) return 'closed';
    if (behavior.includes('open')) return 'open';
    return currentState;
  }
}
