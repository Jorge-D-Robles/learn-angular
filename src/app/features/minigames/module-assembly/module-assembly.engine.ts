import { signal, computed, type Signal, type WritableSignal } from '@angular/core';
import { MinigameEngine, type ActionResult } from '../../../core/minigame/minigame-engine';
import type { MinigameEngineConfig } from '../../../core/minigame/minigame-engine';
import { MinigameStatus } from '../../../core/minigame/minigame.types';
import { isDecoyPart, type BlueprintGroup, type ComponentPart, type ComponentBlueprint, type ModuleAssemblyLevelData } from './module-assembly.types';
import type { ConveyorBeltService } from './conveyor-belt.service';

// ---------------------------------------------------------------------------
// Action types
// ---------------------------------------------------------------------------

export interface PlacePartAction {
  readonly type: 'place-part';
  readonly partId: string;
  readonly targetSlotId: string;
}

export interface RejectDecoyAction {
  readonly type: 'reject-decoy';
  readonly partId: string;
}

export type ModuleAssemblyAction = PlacePartAction | RejectDecoyAction;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const BASE_PLACEMENT_SCORE = 100;
export const DECOY_BONUS_SCORE = 25;

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

function isPlacePartAction(action: unknown): action is PlacePartAction {
  return (
    typeof action === 'object' &&
    action !== null &&
    (action as PlacePartAction).type === 'place-part' &&
    typeof (action as PlacePartAction).partId === 'string' &&
    typeof (action as PlacePartAction).targetSlotId === 'string'
  );
}

function isRejectDecoyAction(action: unknown): action is RejectDecoyAction {
  return (
    typeof action === 'object' &&
    action !== null &&
    (action as RejectDecoyAction).type === 'reject-decoy' &&
    typeof (action as RejectDecoyAction).partId === 'string'
  );
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

const INVALID_NO_CHANGE: ActionResult = { valid: false, scoreChange: 0, livesChange: 0 };

export class ModuleAssemblyEngine extends MinigameEngine<ModuleAssemblyLevelData> {
  // --- Private writable signals ---
  private readonly _beltParts = signal<readonly ComponentPart[]>([]);
  private readonly _beltSpeed = signal(0);
  private readonly _filledSlots = signal<ReadonlyMap<string, ComponentPart>>(new Map());
  private readonly _blueprint: WritableSignal<ComponentBlueprint> = signal<ComponentBlueprint>({ name: '', slots: [], expectedParts: [] });
  private readonly _blueprintGroups = signal<readonly BlueprintGroup[]>([]);

  // --- Public read-only signals ---
  readonly beltParts: Signal<readonly ComponentPart[]> = this._beltParts.asReadonly();
  readonly beltSpeed: Signal<number> = this._beltSpeed.asReadonly();
  readonly filledSlots: Signal<ReadonlyMap<string, ComponentPart>> = this._filledSlots.asReadonly();
  readonly blueprint: Signal<ComponentBlueprint> = this._blueprint.asReadonly();
  readonly blueprintGroups: Signal<readonly BlueprintGroup[]> = this._blueprintGroups.asReadonly();

  readonly strikes = computed(() => this.config.initialLives - this.lives());
  readonly maxStrikes = computed(() => this.config.initialLives);

  private readonly _conveyorBelt: ConveyorBeltService | undefined;

  constructor(config?: Partial<MinigameEngineConfig>, conveyorBelt?: ConveyorBeltService) {
    super(config);
    this._conveyorBelt = conveyorBelt;
  }

  // --- Lifecycle hooks ---

  protected onLevelLoad(data: ModuleAssemblyLevelData): void {
    this._blueprint.set(data.blueprint);
    this._blueprintGroups.set(data.blueprints ?? []);
    this._beltParts.set([...data.parts]);
    this._beltSpeed.set(data.beltSpeed);
    this._filledSlots.set(new Map());
    this._conveyorBelt?.reset(data.parts, data.beltSpeed);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected onStart(): void {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected onComplete(): void {}

  // --- Action validation ---

  protected validateAction(action: unknown): ActionResult {
    if (isPlacePartAction(action)) {
      return this.handlePlacePart(action);
    }
    if (isRejectDecoyAction(action)) {
      return this.handleRejectDecoy(action);
    }
    return INVALID_NO_CHANGE;
  }

  // --- Private handlers ---

  private handlePlacePart(action: PlacePartAction): ActionResult {
    const parts = this._beltParts();
    const part = parts.find((p) => p.id === action.partId);
    const slot = this._blueprint().slots.find((s) => s.id === action.targetSlotId);

    if (!part || !slot) {
      return INVALID_NO_CHANGE;
    }

    if (this._filledSlots().has(slot.id)) {
      return INVALID_NO_CHANGE;
    }

    if (part.correctSlotId === slot.id) {
      // Correct placement
      this._beltParts.set(parts.filter((p) => p.id !== action.partId));
      this._conveyorBelt?.removePart(action.partId);
      const newMap = new Map(this._filledSlots());
      newMap.set(slot.id, part);
      this._filledSlots.set(newMap);

      this.recordCorrectAction();
      const scoreChange = Math.round(BASE_PLACEMENT_SCORE * this.getComboMultiplier());

      this.checkWinCondition();
      this.checkBeltExhaustion();

      return { valid: true, scoreChange, livesChange: 0 };
    }

    // Wrong placement (includes type-match but wrong slot, and decoys dragged to slots)
    this.recordIncorrectAction();
    return { valid: false, scoreChange: 0, livesChange: -1 };
  }

  private handleRejectDecoy(action: RejectDecoyAction): ActionResult {
    const parts = this._beltParts();
    const part = parts.find((p) => p.id === action.partId);

    if (!part) {
      return INVALID_NO_CHANGE;
    }

    if (isDecoyPart(part)) {
      // Correct rejection
      this._beltParts.set(parts.filter((p) => p.id !== action.partId));
      this._conveyorBelt?.removePart(action.partId);
      this.checkBeltExhaustion();
      return { valid: true, scoreChange: DECOY_BONUS_SCORE, livesChange: 0 };
    }

    // Wrong rejection (rejected a valid part)
    this.recordIncorrectAction();
    return { valid: false, scoreChange: 0, livesChange: -1 };
  }

  // --- Tick ---

  /**
   * Advances the conveyor belt by `dt` seconds and checks for exhaustion.
   * Called by the component's animation loop each frame.
   * No-op if no ConveyorBeltService was provided.
   */
  tick(dt: number): void {
    this._conveyorBelt?.tick(dt);
    this.checkBeltExhaustion();
  }

  // --- Private condition checks ---

  private checkWinCondition(): void {
    const requiredSlots = this._blueprint().slots.filter((s) => s.isRequired);
    const filled = this._filledSlots();
    if (requiredSlots.every((s) => filled.has(s.id))) {
      this.complete();
    }
  }

  private checkBeltExhaustion(): void {
    if (this.status() !== MinigameStatus.Playing) {
      return;
    }

    const exhausted = this._conveyorBelt
      ? this._conveyorBelt.isExhausted()
      : this._beltParts().length === 0;

    if (exhausted) {
      const requiredSlots = this._blueprint().slots.filter((s) => s.isRequired);
      const filled = this._filledSlots();
      if (requiredSlots.some((s) => !filled.has(s.id))) {
        this.fail();
      }
    }
  }
}
