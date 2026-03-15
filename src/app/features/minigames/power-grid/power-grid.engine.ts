import { signal, type Signal } from '@angular/core';
import { MinigameEngine, type ActionResult } from '../../../core/minigame/minigame-engine';
import type { MinigameEngineConfig } from '../../../core/minigame/minigame-engine';
import { MinigameStatus } from '../../../core/minigame/minigame.types';
import type {
  ServiceNode,
  ComponentNode,
  ValidConnection,
  ScopeRule,
  InjectionScope,
  PowerGridLevelData,
} from './power-grid.types';

// ---------------------------------------------------------------------------
// Local types (engine-specific, will be reconciled by T-2026-270)
// ---------------------------------------------------------------------------

/** A player-drawn connection between a service and component. */
export interface PowerConnection {
  readonly id: string;
  readonly serviceId: string;
  readonly componentId: string;
  readonly scope: InjectionScope;
}

/** A short circuit detected during validation. */
export interface ShortCircuitInfo {
  readonly connectionId: string;
  readonly serviceId: string;
  readonly componentId: string;
  readonly reason: 'wrong-pair' | 'wrong-scope';
}

/** Result of validating all connections. */
export interface GridValidationResult {
  readonly correctConnections: readonly PowerConnection[];
  readonly shortCircuits: readonly ShortCircuitInfo[];
  readonly missingConnections: readonly ValidConnection[];
  readonly allCorrect: boolean;
}

// ---------------------------------------------------------------------------
// Action types
// ---------------------------------------------------------------------------

export interface ConnectServiceAction {
  readonly type: 'connect-service';
  readonly serviceId: string;
  readonly componentId: string;
  readonly scope: InjectionScope;
}

export interface DisconnectServiceAction {
  readonly type: 'disconnect-service';
  readonly connectionId: string;
}

export type PowerGridAction = ConnectServiceAction | DisconnectServiceAction;

// ---------------------------------------------------------------------------
// Validation service interface (T-2026-433 will implement)
// ---------------------------------------------------------------------------

export interface PowerGridInjectionService {
  validateAll(
    connections: readonly PowerConnection[],
    services: readonly ServiceNode[],
    components: readonly ComponentNode[],
    validConnections: readonly ValidConnection[],
    scopeRules: readonly ScopeRule[],
  ): GridValidationResult;
  reset?(): void;
}

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

function isConnectServiceAction(action: unknown): action is ConnectServiceAction {
  return (
    typeof action === 'object' &&
    action !== null &&
    (action as ConnectServiceAction).type === 'connect-service' &&
    typeof (action as ConnectServiceAction).serviceId === 'string' &&
    typeof (action as ConnectServiceAction).componentId === 'string' &&
    typeof (action as ConnectServiceAction).scope === 'string'
  );
}

function isDisconnectServiceAction(action: unknown): action is DisconnectServiceAction {
  return (
    typeof action === 'object' &&
    action !== null &&
    (action as DisconnectServiceAction).type === 'disconnect-service' &&
    typeof (action as DisconnectServiceAction).connectionId === 'string'
  );
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const PERFECT_SCORE_MULTIPLIER = 1.0;
export const SECOND_ATTEMPT_MULTIPLIER = 0.4;
export const THIRD_ATTEMPT_MULTIPLIER = 0.2;
export const DEFAULT_MAX_VERIFICATIONS = 3;

const INVALID_NO_CHANGE: ActionResult = { valid: false, scoreChange: 0, livesChange: 0 };
const VALID_NO_CHANGE: ActionResult = { valid: true, scoreChange: 0, livesChange: 0 };

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class PowerGridEngine extends MinigameEngine<PowerGridLevelData> {
  // --- Private writable signals ---
  private readonly _connections = signal<readonly PowerConnection[]>([]);
  private readonly _validationResult = signal<GridValidationResult | null>(null);
  private readonly _services = signal<readonly ServiceNode[]>([]);
  private readonly _components = signal<readonly ComponentNode[]>([]);
  private readonly _verificationsRemaining = signal(DEFAULT_MAX_VERIFICATIONS);
  private readonly _verificationCount = signal(0);

  // --- Private state ---
  private _validConnections: readonly ValidConnection[] = [];
  private _scopeRules: readonly ScopeRule[] = [];
  private _serviceMap = new Map<string, ServiceNode>();
  private _componentMap = new Map<string, ComponentNode>();
  private _nextConnectionId = 1;
  private readonly _injectionService: PowerGridInjectionService | undefined;

  // --- Public read-only signals ---
  readonly connections: Signal<readonly PowerConnection[]> = this._connections.asReadonly();
  readonly validationResult: Signal<GridValidationResult | null> = this._validationResult.asReadonly();
  readonly services: Signal<readonly ServiceNode[]> = this._services.asReadonly();
  readonly components: Signal<readonly ComponentNode[]> = this._components.asReadonly();
  readonly verificationsRemaining: Signal<number> = this._verificationsRemaining.asReadonly();
  readonly verificationCount: Signal<number> = this._verificationCount.asReadonly();

  constructor(config?: Partial<MinigameEngineConfig>, injectionService?: PowerGridInjectionService) {
    super(config);
    this._injectionService = injectionService;
  }

  // --- Lifecycle hooks ---

  protected onLevelLoad(data: PowerGridLevelData): void {
    this._services.set(data.services);
    this._components.set(data.components);
    this._validConnections = data.validConnections;
    this._scopeRules = data.scopeRules;
    this._connections.set([]);
    this._validationResult.set(null);
    this._verificationsRemaining.set(DEFAULT_MAX_VERIFICATIONS);
    this._verificationCount.set(0);
    this._nextConnectionId = 1;

    this._serviceMap = new Map(data.services.map(s => [s.id, s]));
    this._componentMap = new Map(data.components.map(c => [c.id, c]));

    this._injectionService?.reset?.();
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected onStart(): void {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected onComplete(): void {}

  // --- Action validation ---

  protected validateAction(action: unknown): ActionResult {
    if (isConnectServiceAction(action)) {
      return this.handleConnect(action);
    }
    if (isDisconnectServiceAction(action)) {
      return this.handleDisconnect(action);
    }
    return INVALID_NO_CHANGE;
  }

  // --- Verification ---

  verify(): GridValidationResult | null {
    if (this.status() !== MinigameStatus.Playing) {
      return null;
    }

    this._verificationsRemaining.update(v => v - 1);
    this._verificationCount.update(c => c + 1);

    const result = this._injectionService
      ? this._injectionService.validateAll(
          this._connections(),
          this._services(),
          this._components(),
          this._validConnections,
          this._scopeRules,
        )
      : this.inlineValidate();

    this._validationResult.set(result);

    if (result.allCorrect) {
      const score = this.calculateScore();
      this.addScore(score);
      this.complete();
    } else if (this._verificationsRemaining() <= 0) {
      this.fail();
    }

    return result;
  }

  // --- Private handlers ---

  private handleConnect(action: ConnectServiceAction): ActionResult {
    const service = this._serviceMap.get(action.serviceId);
    const component = this._componentMap.get(action.componentId);

    if (!service || !component) {
      return INVALID_NO_CHANGE;
    }

    // Component must require this service
    if (!component.requiredInjections.includes(action.serviceId)) {
      return INVALID_NO_CHANGE;
    }

    // No duplicate (same serviceId + componentId)
    const duplicate = this._connections().some(
      c => c.serviceId === action.serviceId && c.componentId === action.componentId,
    );
    if (duplicate) {
      return INVALID_NO_CHANGE;
    }

    const connectionId = `conn-${this._nextConnectionId++}`;
    const newConnection: PowerConnection = {
      id: connectionId,
      serviceId: action.serviceId,
      componentId: action.componentId,
      scope: action.scope,
    };

    this._connections.update(conns => [...conns, newConnection]);
    return VALID_NO_CHANGE;
  }

  private handleDisconnect(action: DisconnectServiceAction): ActionResult {
    const conns = this._connections();
    const index = conns.findIndex(c => c.id === action.connectionId);

    if (index === -1) {
      return INVALID_NO_CHANGE;
    }

    this._connections.set(conns.filter((_, i) => i !== index));
    return VALID_NO_CHANGE;
  }

  // --- Inline validation ---

  private inlineValidate(): GridValidationResult {
    const connections = this._connections();
    const correctConnections: PowerConnection[] = [];
    const shortCircuits: ShortCircuitInfo[] = [];

    for (const conn of connections) {
      // Find a matching valid connection with same serviceId + componentId
      const pairMatch = this._validConnections.find(
        vc => vc.serviceId === conn.serviceId && vc.componentId === conn.componentId,
      );

      if (!pairMatch) {
        shortCircuits.push({
          connectionId: conn.id,
          serviceId: conn.serviceId,
          componentId: conn.componentId,
          reason: 'wrong-pair',
        });
      } else if (pairMatch.scope !== conn.scope) {
        shortCircuits.push({
          connectionId: conn.id,
          serviceId: conn.serviceId,
          componentId: conn.componentId,
          reason: 'wrong-scope',
        });
      } else {
        correctConnections.push(conn);
      }
    }

    // Missing connections: valid connections with no matching player connection
    const missingConnections = this._validConnections.filter(
      vc => !connections.some(
        c => c.serviceId === vc.serviceId && c.componentId === vc.componentId && c.scope === vc.scope,
      ),
    );

    const allCorrect = shortCircuits.length === 0 && missingConnections.length === 0;

    return { correctConnections, shortCircuits, missingConnections, allCorrect };
  }

  // --- Private scoring ---

  private calculateScore(): number {
    const maxScore = this.config.maxScore;
    const count = this._verificationCount();

    if (count === 1) {
      return Math.round(maxScore * PERFECT_SCORE_MULTIPLIER);
    }
    if (count === 2) {
      return Math.round(maxScore * SECOND_ATTEMPT_MULTIPLIER);
    }
    return Math.round(maxScore * THIRD_ATTEMPT_MULTIPLIER);
  }
}
