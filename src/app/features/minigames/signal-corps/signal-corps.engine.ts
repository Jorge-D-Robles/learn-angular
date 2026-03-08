import { signal, type Signal } from '@angular/core';
import { MinigameEngine, type ActionResult } from '../../../core/minigame/minigame-engine';
import type { MinigameEngineConfig } from '../../../core/minigame/minigame-engine';
import { MinigameStatus } from '../../../core/minigame/minigame.types';
import {
  canNoiseWaveBeBlocked,
  type SignalCorpsLevelData,
  type TowerInput,
  type TowerOutput,
  type TowerPlacement,
  type ParentBinding,
  type NoiseWave,
} from './signal-corps.types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Mutable player state for a single tower. */
export interface PlayerTowerState {
  readonly towerId: string;
  readonly inputs: readonly TowerInput[];
  readonly outputs: readonly TowerOutput[];
  readonly bindings: readonly ParentBinding[];
}

/** Result of deploying towers and running wave simulation. */
export interface DeployResult {
  readonly towerResults: readonly TowerEvaluation[];
  readonly waveResults: readonly WaveResult[];
  readonly totalDamage: number;
  readonly allTowersCorrect: boolean;
  readonly allWavesBlocked: boolean;
}

export interface TowerEvaluation {
  readonly towerId: string;
  readonly inputsCorrect: boolean;
  readonly outputsCorrect: boolean;
  readonly bindingsCorrect: boolean;
  readonly allCorrect: boolean;
}

export interface WaveResult {
  readonly waveId: string;
  readonly blocked: boolean;
  readonly blockedByTowerId: string | null;
  readonly damage: number;
}

// ---------------------------------------------------------------------------
// Action types
// ---------------------------------------------------------------------------

export interface DeclareInputAction {
  readonly type: 'declare-input';
  readonly towerId: string;
  readonly input: TowerInput;
}

export interface DeclareOutputAction {
  readonly type: 'declare-output';
  readonly towerId: string;
  readonly output: TowerOutput;
}

export interface RemoveInputAction {
  readonly type: 'remove-input';
  readonly towerId: string;
  readonly inputName: string;
}

export interface RemoveOutputAction {
  readonly type: 'remove-output';
  readonly towerId: string;
  readonly outputName: string;
}

export interface SetBindingAction {
  readonly type: 'set-binding';
  readonly towerId: string;
  readonly binding: ParentBinding;
}

export interface RemoveBindingAction {
  readonly type: 'remove-binding';
  readonly towerId: string;
  readonly towerPortName: string;
}

export type SignalCorpsAction =
  | DeclareInputAction
  | DeclareOutputAction
  | RemoveInputAction
  | RemoveOutputAction
  | SetBindingAction
  | RemoveBindingAction;

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

function isDeclareInputAction(action: unknown): action is DeclareInputAction {
  return (
    typeof action === 'object' &&
    action !== null &&
    (action as DeclareInputAction).type === 'declare-input' &&
    typeof (action as DeclareInputAction).towerId === 'string' &&
    typeof (action as DeclareInputAction).input === 'object'
  );
}

function isDeclareOutputAction(action: unknown): action is DeclareOutputAction {
  return (
    typeof action === 'object' &&
    action !== null &&
    (action as DeclareOutputAction).type === 'declare-output' &&
    typeof (action as DeclareOutputAction).towerId === 'string' &&
    typeof (action as DeclareOutputAction).output === 'object'
  );
}

function isRemoveInputAction(action: unknown): action is RemoveInputAction {
  return (
    typeof action === 'object' &&
    action !== null &&
    (action as RemoveInputAction).type === 'remove-input' &&
    typeof (action as RemoveInputAction).towerId === 'string' &&
    typeof (action as RemoveInputAction).inputName === 'string'
  );
}

function isRemoveOutputAction(action: unknown): action is RemoveOutputAction {
  return (
    typeof action === 'object' &&
    action !== null &&
    (action as RemoveOutputAction).type === 'remove-output' &&
    typeof (action as RemoveOutputAction).towerId === 'string' &&
    typeof (action as RemoveOutputAction).outputName === 'string'
  );
}

function isSetBindingAction(action: unknown): action is SetBindingAction {
  return (
    typeof action === 'object' &&
    action !== null &&
    (action as SetBindingAction).type === 'set-binding' &&
    typeof (action as SetBindingAction).towerId === 'string' &&
    typeof (action as SetBindingAction).binding === 'object'
  );
}

function isRemoveBindingAction(action: unknown): action is RemoveBindingAction {
  return (
    typeof action === 'object' &&
    action !== null &&
    (action as RemoveBindingAction).type === 'remove-binding' &&
    typeof (action as RemoveBindingAction).towerId === 'string' &&
    typeof (action as RemoveBindingAction).towerPortName === 'string'
  );
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const DEPLOY_PENALTY_PER_ATTEMPT = 0.15;
export const MIN_DEPLOY_MULTIPLIER = 0.5;
export const HEALTH_BONUS_MIN = 0.5;
export const TIME_BONUS_MIN = 0.5;

const INVALID_NO_CHANGE: ActionResult = { valid: false, scoreChange: 0, livesChange: 0 };
const VALID_NO_CHANGE: ActionResult = { valid: true, scoreChange: 0, livesChange: 0 };

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class SignalCorpsEngine extends MinigameEngine<SignalCorpsLevelData> {
  // --- Private writable signals ---
  private readonly _playerTowers = signal<ReadonlyMap<string, PlayerTowerState>>(new Map());
  private readonly _stationHealth = signal(100);
  private readonly _deployResult = signal<DeployResult | null>(null);
  private readonly _deployCount = signal(0);

  // --- Private writable signals (level data) ---
  private readonly _towerPlacements = signal<readonly TowerPlacement[]>([]);
  private readonly _noiseWaves = signal<readonly NoiseWave[]>([]);
  private readonly _gridSize = signal<{ rows: number; cols: number }>({ rows: 0, cols: 0 });

  // --- Private state ---
  private _expectedTowers: readonly TowerPlacement[] = [];
  private _expectedBindingsByTower = new Map<string, readonly ParentBinding[]>();
  private _initialHealth = 100;

  // --- Public read-only signals ---
  readonly playerTowers: Signal<ReadonlyMap<string, PlayerTowerState>> = this._playerTowers.asReadonly();
  readonly stationHealth: Signal<number> = this._stationHealth.asReadonly();
  readonly deployResult: Signal<DeployResult | null> = this._deployResult.asReadonly();
  readonly deployCount: Signal<number> = this._deployCount.asReadonly();
  readonly towerPlacements: Signal<readonly TowerPlacement[]> = this._towerPlacements.asReadonly();
  readonly noiseWaves: Signal<readonly NoiseWave[]> = this._noiseWaves.asReadonly();
  readonly gridSize: Signal<{ rows: number; cols: number }> = this._gridSize.asReadonly();

  constructor(config?: Partial<MinigameEngineConfig>) {
    super(config);
  }

  // --- Lifecycle hooks ---

  protected onLevelLoad(data: SignalCorpsLevelData): void {
    this._expectedTowers = data.towerPlacements;
    this._towerPlacements.set(data.towerPlacements);
    this._noiseWaves.set(data.noiseWaves);
    this._gridSize.set(data.gridSize);
    this._initialHealth = data.stationHealth;

    // Build expected bindings per tower
    this._expectedBindingsByTower = new Map<string, readonly ParentBinding[]>();
    for (const tower of data.towerPlacements) {
      const towerBindings = data.expectedBindings.filter(binding => {
        if (binding.bindingType === 'input') {
          return tower.config.inputs.some(i => i.name === binding.towerPortName);
        }
        return tower.config.outputs.some(o => o.name === binding.towerPortName);
      });
      this._expectedBindingsByTower.set(tower.towerId, towerBindings);
    }

    // Initialize player towers with empty state
    const towerMap = new Map<string, PlayerTowerState>();
    for (const tower of data.towerPlacements) {
      towerMap.set(tower.towerId, {
        towerId: tower.towerId,
        inputs: [],
        outputs: [],
        bindings: [],
      });
    }
    this._playerTowers.set(towerMap);

    this._stationHealth.set(data.stationHealth);
    this._deployResult.set(null);
    this._deployCount.set(0);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected onStart(): void {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected onComplete(): void {}

  // --- Action validation ---

  protected validateAction(action: unknown): ActionResult {
    if (isDeclareInputAction(action)) {
      return this.handleDeclareInput(action);
    }
    if (isDeclareOutputAction(action)) {
      return this.handleDeclareOutput(action);
    }
    if (isRemoveInputAction(action)) {
      return this.handleRemoveInput(action);
    }
    if (isRemoveOutputAction(action)) {
      return this.handleRemoveOutput(action);
    }
    if (isSetBindingAction(action)) {
      return this.handleSetBinding(action);
    }
    if (isRemoveBindingAction(action)) {
      return this.handleRemoveBinding(action);
    }
    return INVALID_NO_CHANGE;
  }

  // --- Deploy ---

  deploy(): DeployResult | null {
    if (this.status() !== MinigameStatus.Playing) {
      return null;
    }

    this._deployCount.update(c => c + 1);

    // Evaluate each tower
    const towerResults: TowerEvaluation[] = [];
    const playerTowers = this._playerTowers();

    for (const expectedTower of this._expectedTowers) {
      const state = playerTowers.get(expectedTower.towerId);
      if (!state) continue;

      const inputsCorrect = this.compareInputs(state.inputs, expectedTower.config.inputs);
      const outputsCorrect = this.compareOutputs(state.outputs, expectedTower.config.outputs);
      const expectedBindings = this._expectedBindingsByTower.get(expectedTower.towerId) ?? [];
      const bindingsCorrect = this.compareBindings(state.bindings, expectedBindings);

      towerResults.push({
        towerId: expectedTower.towerId,
        inputsCorrect,
        outputsCorrect,
        bindingsCorrect,
        allCorrect: inputsCorrect && outputsCorrect && bindingsCorrect,
      });
    }

    // Assemble player TowerPlacements for correctly configured towers
    const correctPlacements: TowerPlacement[] = [];
    for (const eval_ of towerResults) {
      if (eval_.allCorrect) {
        const state = playerTowers.get(eval_.towerId)!;
        const expectedTower = this._expectedTowers.find(t => t.towerId === eval_.towerId)!;
        correctPlacements.push({
          towerId: state.towerId,
          position: expectedTower.position,
          config: { inputs: [...state.inputs], outputs: [...state.outputs] },
        });
      }
    }

    // Run wave simulation
    const waveResults: WaveResult[] = [];
    for (const wave of this._noiseWaves()) {
      let blocked = false;
      let blockedByTowerId: string | null = null;

      for (const placement of correctPlacements) {
        if (canNoiseWaveBeBlocked(wave, placement)) {
          blocked = true;
          blockedByTowerId = placement.towerId;
          break;
        }
      }

      waveResults.push({
        waveId: wave.waveId,
        blocked,
        blockedByTowerId,
        damage: blocked ? 0 : wave.damage,
      });
    }

    const totalDamage = waveResults.reduce((sum, w) => sum + w.damage, 0);
    const allTowersCorrect = towerResults.every(t => t.allCorrect);
    const allWavesBlocked = waveResults.every(w => w.blocked);

    // Apply damage
    this._stationHealth.update(h => Math.max(0, h - totalDamage));

    const result: DeployResult = {
      towerResults,
      waveResults,
      totalDamage,
      allTowersCorrect,
      allWavesBlocked,
    };

    this._deployResult.set(result);

    // Check for failure
    if (this._stationHealth() <= 0) {
      this.fail();
      return result;
    }

    // Check for completion
    if (allTowersCorrect && allWavesBlocked) {
      const score = this.calculateScore(result);
      this.addScore(score);
      this.complete();
    }

    return result;
  }

  // --- Private handlers ---

  private handleDeclareInput(action: DeclareInputAction): ActionResult {
    const existing = this._playerTowers().get(action.towerId);
    if (!existing) {
      return INVALID_NO_CHANGE;
    }

    if (existing.inputs.some(i => i.name === action.input.name)) {
      return INVALID_NO_CHANGE;
    }

    const newMap = new Map(this._playerTowers());
    newMap.set(action.towerId, { ...existing, inputs: [...existing.inputs, action.input] });
    this._playerTowers.set(newMap);

    return VALID_NO_CHANGE;
  }

  private handleDeclareOutput(action: DeclareOutputAction): ActionResult {
    const existing = this._playerTowers().get(action.towerId);
    if (!existing) {
      return INVALID_NO_CHANGE;
    }

    if (existing.outputs.some(o => o.name === action.output.name)) {
      return INVALID_NO_CHANGE;
    }

    const newMap = new Map(this._playerTowers());
    newMap.set(action.towerId, { ...existing, outputs: [...existing.outputs, action.output] });
    this._playerTowers.set(newMap);

    return VALID_NO_CHANGE;
  }

  private handleRemoveInput(action: RemoveInputAction): ActionResult {
    const existing = this._playerTowers().get(action.towerId);
    if (!existing) {
      return INVALID_NO_CHANGE;
    }

    if (!existing.inputs.some(i => i.name === action.inputName)) {
      return INVALID_NO_CHANGE;
    }

    const newMap = new Map(this._playerTowers());
    newMap.set(action.towerId, {
      ...existing,
      inputs: existing.inputs.filter(i => i.name !== action.inputName),
    });
    this._playerTowers.set(newMap);

    return VALID_NO_CHANGE;
  }

  private handleRemoveOutput(action: RemoveOutputAction): ActionResult {
    const existing = this._playerTowers().get(action.towerId);
    if (!existing) {
      return INVALID_NO_CHANGE;
    }

    if (!existing.outputs.some(o => o.name === action.outputName)) {
      return INVALID_NO_CHANGE;
    }

    const newMap = new Map(this._playerTowers());
    newMap.set(action.towerId, {
      ...existing,
      outputs: existing.outputs.filter(o => o.name !== action.outputName),
    });
    this._playerTowers.set(newMap);

    return VALID_NO_CHANGE;
  }

  private handleSetBinding(action: SetBindingAction): ActionResult {
    const existing = this._playerTowers().get(action.towerId);
    if (!existing) {
      return INVALID_NO_CHANGE;
    }

    if (!action.binding.towerPortName) {
      return INVALID_NO_CHANGE;
    }

    // Replace existing binding for same port or add new
    const filtered = existing.bindings.filter(b => b.towerPortName !== action.binding.towerPortName);
    const newMap = new Map(this._playerTowers());
    newMap.set(action.towerId, {
      ...existing,
      bindings: [...filtered, action.binding],
    });
    this._playerTowers.set(newMap);

    return VALID_NO_CHANGE;
  }

  private handleRemoveBinding(action: RemoveBindingAction): ActionResult {
    const existing = this._playerTowers().get(action.towerId);
    if (!existing) {
      return INVALID_NO_CHANGE;
    }

    if (!existing.bindings.some(b => b.towerPortName === action.towerPortName)) {
      return INVALID_NO_CHANGE;
    }

    const newMap = new Map(this._playerTowers());
    newMap.set(action.towerId, {
      ...existing,
      bindings: existing.bindings.filter(b => b.towerPortName !== action.towerPortName),
    });
    this._playerTowers.set(newMap);

    return VALID_NO_CHANGE;
  }

  // --- Private comparison helpers ---

  private compareInputs(player: readonly TowerInput[], expected: readonly TowerInput[]): boolean {
    if (player.length !== expected.length) return false;

    return expected.every(exp =>
      player.some(p =>
        p.name === exp.name &&
        p.type === exp.type &&
        p.required === exp.required &&
        p.transform === exp.transform &&
        p.aliasName === exp.aliasName,
      ),
    );
  }

  private compareOutputs(player: readonly TowerOutput[], expected: readonly TowerOutput[]): boolean {
    if (player.length !== expected.length) return false;

    return expected.every(exp =>
      player.some(p => p.name === exp.name && p.payloadType === exp.payloadType),
    );
  }

  private compareBindings(player: readonly ParentBinding[], expected: readonly ParentBinding[]): boolean {
    if (player.length !== expected.length) return false;

    return expected.every(exp =>
      player.some(p =>
        p.towerPortName === exp.towerPortName &&
        p.bindingType === exp.bindingType &&
        p.parentProperty === exp.parentProperty &&
        p.parentHandler === exp.parentHandler,
      ),
    );
  }

  // --- Private scoring ---

  private calculateScore(result: DeployResult): number {
    const maxScore = this.config.maxScore;
    const totalTowers = this._expectedTowers.length;
    const correctTowers = result.towerResults.filter(t => t.allCorrect).length;
    const correctnessRatio = totalTowers === 0 ? 1.0 : correctTowers / totalTowers;

    const healthRatio = this._initialHealth === 0 ? 1.0 : this._stationHealth() / this._initialHealth;
    const healthBonus = Math.min(1.0, Math.max(HEALTH_BONUS_MIN, healthRatio));

    const deployPenalty = Math.max(MIN_DEPLOY_MULTIPLIER, 1.0 - DEPLOY_PENALTY_PER_ATTEMPT * Math.max(0, this._deployCount() - 1));

    const timerDuration = this.config.timerDuration;
    const timeBonus = timerDuration === null
      ? 1.0
      : Math.min(1.0, Math.max(TIME_BONUS_MIN, this.timeRemaining() / timerDuration));

    return Math.round(maxScore * correctnessRatio * healthBonus * deployPenalty * timeBonus);
  }
}
