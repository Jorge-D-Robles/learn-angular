import { signal, type Signal } from '@angular/core';
import { MinigameEngine, type ActionResult } from '../../../core/minigame/minigame-engine';
import type { MinigameEngineConfig } from '../../../core/minigame/minigame-engine';
import { MinigameStatus } from '../../../core/minigame/minigame.types';
import {
  isSourceTargetCompatible,
  verifyConnections,
  WireType,
  type SourcePort,
  type TargetPort,
  type WireConnection,
  type VerificationResult,
} from './wire-protocol.types';
import type { WireProtocolLevelData } from '../../../data/levels/wire-protocol.data';
import type { WireProtocolValidationService } from './wire-protocol-validation.service';

// ---------------------------------------------------------------------------
// Action types
// ---------------------------------------------------------------------------

export interface DrawWireAction {
  readonly type: 'draw-wire';
  readonly sourcePortId: string;
  readonly targetPortId: string;
  readonly wireType: WireType;
}

export interface RemoveWireAction {
  readonly type: 'remove-wire';
  readonly wireId: string;
}

export type WireProtocolAction = DrawWireAction | RemoveWireAction;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const PERFECT_SCORE_MULTIPLIER = 1.0;
export const FIRST_ATTEMPT_MULTIPLIER = 0.7;
export const SECOND_ATTEMPT_MULTIPLIER = 0.4;
export const THIRD_ATTEMPT_MULTIPLIER = 0.2;

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

function isDrawWireAction(action: unknown): action is DrawWireAction {
  return (
    typeof action === 'object' &&
    action !== null &&
    (action as DrawWireAction).type === 'draw-wire' &&
    typeof (action as DrawWireAction).sourcePortId === 'string' &&
    typeof (action as DrawWireAction).targetPortId === 'string' &&
    typeof (action as DrawWireAction).wireType === 'string'
  );
}

function isRemoveWireAction(action: unknown): action is RemoveWireAction {
  return (
    typeof action === 'object' &&
    action !== null &&
    (action as RemoveWireAction).type === 'remove-wire' &&
    typeof (action as RemoveWireAction).wireId === 'string'
  );
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

const INVALID_NO_CHANGE: ActionResult = { valid: false, scoreChange: 0, livesChange: 0 };
const VALID_NO_CHANGE: ActionResult = { valid: true, scoreChange: 0, livesChange: 0 };

export class WireProtocolEngine extends MinigameEngine<WireProtocolLevelData> {
  // --- Private writable signals ---
  private readonly _wires = signal<readonly WireConnection[]>([]);
  private readonly _sourcePorts = signal<readonly SourcePort[]>([]);
  private readonly _targetPorts = signal<readonly TargetPort[]>([]);
  private readonly _verificationsRemaining = signal(3);
  private readonly _verificationCount = signal(0);
  private readonly _availableWireTypes = signal<WireType[]>([]);

  // --- Private state ---
  private _correctWires: readonly WireConnection[] = [];
  private _sourcePortMap = new Map<string, SourcePort>();
  private _targetPortMap = new Map<string, TargetPort>();
  private _hadIncorrectWire = false;
  private _nextWireId = 1;
  private readonly _validationService: WireProtocolValidationService | undefined;

  // --- Public read-only signals ---
  readonly wires: Signal<readonly WireConnection[]> = this._wires.asReadonly();
  readonly sourcePorts: Signal<readonly SourcePort[]> = this._sourcePorts.asReadonly();
  readonly targetPorts: Signal<readonly TargetPort[]> = this._targetPorts.asReadonly();
  readonly verificationsRemaining: Signal<number> = this._verificationsRemaining.asReadonly();
  readonly verificationCount: Signal<number> = this._verificationCount.asReadonly();
  readonly availableWireTypes: Signal<readonly WireType[]> = this._availableWireTypes.asReadonly();

  constructor(config?: Partial<MinigameEngineConfig>, validationService?: WireProtocolValidationService) {
    super(config);
    this._validationService = validationService;
  }

  // --- Lifecycle hooks ---

  protected onLevelLoad(data: WireProtocolLevelData): void {
    this._sourcePorts.set(data.sourcePorts);
    this._targetPorts.set(data.targetPorts);
    this._correctWires = data.correctWires;
    this._verificationsRemaining.set(data.maxVerifications);
    this._verificationCount.set(0);
    this._hadIncorrectWire = false;
    this._nextWireId = 1;

    // Derive available wire types from correctWires, preserving enum order
    const typeSet = new Set(data.correctWires.map(w => w.wireType));
    this._availableWireTypes.set(Object.values(WireType).filter(t => typeSet.has(t)));

    // Build lookup maps
    this._sourcePortMap = new Map(data.sourcePorts.map(p => [p.id, p]));
    this._targetPortMap = new Map(data.targetPorts.map(p => [p.id, p]));

    // Load pre-wired connections
    this._wires.set([...data.preWiredConnections]);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected onStart(): void {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected onComplete(): void {}

  // --- Action validation ---

  protected validateAction(action: unknown): ActionResult {
    if (isDrawWireAction(action)) {
      return this.handleDrawWire(action);
    }
    if (isRemoveWireAction(action)) {
      return this.handleRemoveWire(action);
    }
    return INVALID_NO_CHANGE;
  }

  // --- Verification ---

  verify(): VerificationResult | null {
    if (this.status() !== MinigameStatus.Playing) {
      return null;
    }

    this._verificationsRemaining.update(v => v - 1);
    this._verificationCount.update(c => c + 1);

    const result = this._validationService
      ? this._validationService.validateAll(this._wires(), this._correctWires)
      : verifyConnections(this._wires(), this._correctWires);

    if (result.incorrectWires.length > 0) {
      this._hadIncorrectWire = true;
    }

    const allCorrect =
      result.incorrectWires.length === 0 && result.missingWires.length === 0;

    if (allCorrect) {
      const score = this.calculateScore();
      this.addScore(score);
      this.complete();
    } else if (this._verificationsRemaining() <= 0) {
      this.fail();
    }

    return result;
  }

  // --- Hints ---

  getHintForWire(wireId: string): string | null {
    if (!this._validationService) {
      return null;
    }

    const wire = this._wires().find(w => w.id === wireId);
    if (!wire) {
      return null;
    }

    const source = this._sourcePortMap.get(wire.sourcePortId);
    const target = this._targetPortMap.get(wire.targetPortId);
    if (!source || !target) {
      return null;
    }

    return this._validationService.getCommonMistake(source, target, wire.wireType);
  }

  // --- Private handlers ---

  private handleDrawWire(action: DrawWireAction): ActionResult {
    const source = this._sourcePortMap.get(action.sourcePortId);
    const target = this._targetPortMap.get(action.targetPortId);

    if (!source || !target) {
      return INVALID_NO_CHANGE;
    }

    const compatible = this._validationService
      ? this._validationService.isCorrectBindingType(source, target, action.wireType)
      : isSourceTargetCompatible(source, target, action.wireType);

    if (!compatible) {
      return INVALID_NO_CHANGE;
    }

    // Check for duplicate (sourcePortId, targetPortId) pair
    const duplicate = this._wires().some(
      w => w.sourcePortId === action.sourcePortId && w.targetPortId === action.targetPortId,
    );
    if (duplicate) {
      return INVALID_NO_CHANGE;
    }

    const wireId = `wire-${this._nextWireId++}`;
    const newWire: WireConnection = {
      id: wireId,
      sourcePortId: action.sourcePortId,
      targetPortId: action.targetPortId,
      wireType: action.wireType,
      isPreWired: false,
    };

    this._wires.update(wires => [...wires, newWire]);
    return VALID_NO_CHANGE;
  }

  private handleRemoveWire(action: RemoveWireAction): ActionResult {
    const wires = this._wires();
    const wireIndex = wires.findIndex(w => w.id === action.wireId);

    if (wireIndex === -1) {
      return INVALID_NO_CHANGE;
    }

    this._wires.set(wires.filter((_, i) => i !== wireIndex));
    return VALID_NO_CHANGE;
  }

  // --- Private scoring ---

  private calculateScore(): number {
    const maxScore = this.config.maxScore;
    const count = this._verificationCount();

    if (count === 1 && !this._hadIncorrectWire) {
      return Math.round(maxScore * PERFECT_SCORE_MULTIPLIER);
    }
    if (count === 1 && this._hadIncorrectWire) {
      return Math.round(maxScore * FIRST_ATTEMPT_MULTIPLIER);
    }
    if (count === 2) {
      return Math.round(maxScore * SECOND_ATTEMPT_MULTIPLIER);
    }
    return Math.round(maxScore * THIRD_ATTEMPT_MULTIPLIER);
  }
}
