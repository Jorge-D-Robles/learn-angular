// ---------------------------------------------------------------------------
// PowerGridInjectionServiceImpl — DI scope validation and connection checking
// ---------------------------------------------------------------------------
// NOT providedIn: 'root'. This service is scoped to the Power Grid
// component tree. Providing it locally ensures automatic cleanup on
// component destroy and prevents leaked state between minigame sessions.
// ---------------------------------------------------------------------------

import { Injectable } from '@angular/core';
import {
  isScopeAllowed,
  isConnectionValid,
  type PowerGridInjectionService,
  type PowerConnection,
  type ServiceNode,
  type ComponentNode,
  type ValidConnection,
  type ScopeRule,
  type InjectionScope,
  type ShortCircuit,
  type GridValidationResult,
  type ConnectionResult,
} from './power-grid.types';

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class PowerGridInjectionServiceImpl implements PowerGridInjectionService {
  private _lastValidationResult: GridValidationResult | null = null;

  /** Exposes the cached result for testing/downstream consumers. */
  get lastValidationResult(): GridValidationResult | null {
    return this._lastValidationResult;
  }

  // --- Interface method ---

  validateAll(
    connections: readonly PowerConnection[],
    services: readonly ServiceNode[],
    components: readonly ComponentNode[],
    validConnections: readonly ValidConnection[],
    scopeRules: readonly ScopeRule[],
  ): GridValidationResult {
    const correctConnections: PowerConnection[] = [];
    const shortCircuits: ShortCircuit[] = [];

    for (const conn of connections) {
      if (isConnectionValid(conn, validConnections, scopeRules)) {
        correctConnections.push(conn);
      } else {
        shortCircuits.push(this._buildShortCircuit(conn, validConnections));
      }
    }

    const missingConnections = validConnections.filter(
      vc =>
        !connections.some(
          c => c.serviceId === vc.serviceId && c.componentId === vc.componentId && c.scope === vc.scope,
        ),
    );

    const allCorrect = shortCircuits.length === 0 && missingConnections.length === 0;

    const result: GridValidationResult = { correctConnections, shortCircuits, missingConnections, allCorrect };
    this._lastValidationResult = result;
    return result;
  }

  reset(): void {
    this._lastValidationResult = null;
  }

  // --- Additional public methods ---

  validateConnection(
    connection: PowerConnection,
    validConnections: readonly ValidConnection[],
    scopeRules: readonly ScopeRule[],
  ): ConnectionResult {
    if (isConnectionValid(connection, validConnections, scopeRules)) {
      return { valid: true };
    }
    const reason = this._classifyFailure(connection, validConnections);
    return { valid: false, reason };
  }

  checkScope(
    serviceId: string,
    scope: InjectionScope,
    scopeRules: readonly ScopeRule[],
  ): boolean {
    return isScopeAllowed(serviceId, scope, scopeRules);
  }

  detectShortCircuit(
    connections: readonly PowerConnection[],
    services: readonly ServiceNode[],
    validConnections: readonly ValidConnection[],
    scopeRules: readonly ScopeRule[],
  ): ShortCircuit[] {
    const shortCircuits: ShortCircuit[] = [];

    for (const conn of connections) {
      if (!isConnectionValid(conn, validConnections, scopeRules)) {
        shortCircuits.push(this._buildShortCircuit(conn, validConnections));
      }
    }

    return shortCircuits;
  }

  getValidConnections(
    svc: ServiceNode,
    components: readonly ComponentNode[],
    validConnections: readonly ValidConnection[],
    scopeRules: readonly ScopeRule[],
  ): ComponentNode[] {
    const matchingVCs = validConnections.filter(
      vc => vc.serviceId === svc.id && isScopeAllowed(svc.id, vc.scope, scopeRules),
    );
    const matchingComponentIds = new Set(matchingVCs.map(vc => vc.componentId));
    return components.filter(c => matchingComponentIds.has(c.id));
  }

  // --- Private helpers ---

  private _classifyFailure(
    conn: Pick<PowerConnection, 'serviceId' | 'componentId'>,
    validConnections: readonly ValidConnection[],
  ): 'wrong-pair' | 'wrong-scope' {
    const pairMatch = validConnections.find(
      vc => vc.serviceId === conn.serviceId && vc.componentId === conn.componentId,
    );
    return pairMatch ? 'wrong-scope' : 'wrong-pair';
  }

  private _buildShortCircuit(
    conn: PowerConnection,
    validConnections: readonly ValidConnection[],
  ): ShortCircuit {
    return {
      connectionId: conn.id,
      serviceId: conn.serviceId,
      componentId: conn.componentId,
      reason: this._classifyFailure(conn, validConnections),
    };
  }
}
