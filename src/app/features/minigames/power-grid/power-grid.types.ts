// ---------------------------------------------------------------------------
// Canonical domain model types for Power Grid minigame
// ---------------------------------------------------------------------------

/**
 * Angular DI scope for a service.
 * - `'root'` = singleton via `providedIn: 'root'`
 * - `'component'` = provided at component level
 * - `'hierarchical'` = provided at a parent component, inherited by children
 */
export type InjectionScope = 'root' | 'component' | 'hierarchical';

/**
 * How a service is provided in the Angular DI system.
 * Maps to `useClass`, `useFactory`, `useValue`, `useExisting`.
 * Basic levels default to `'class'` when omitted.
 */
export type ProviderType = 'class' | 'factory' | 'value' | 'existing';

/** A service (power source) on the grid board. */
export interface ServiceNode {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly providedIn: InjectionScope;
  /** Provider strategy. Defaults to `'class'` when omitted. */
  readonly providerType?: ProviderType;
  /** Distinguishes class-based services from `InjectionToken`s. */
  readonly kind?: 'class' | 'token';
  /** IDs of other services this service depends on (service-to-service injection). */
  readonly dependsOn?: readonly string[];
  /** Method names exposed by this service. */
  readonly methods?: readonly string[];
  /** Whether this service holds mutable state. */
  readonly stateful?: boolean;
}

/** A component (consumer module) on the grid board. */
export interface ComponentNode {
  readonly id: string;
  readonly name: string;
  /** Service IDs this component needs injected. */
  readonly requiredInjections: readonly string[];
  /** Optional component-level providers (for non-root scoping). */
  readonly providers?: readonly string[];
}

/** Static answer key: which service connects to which component at what scope. */
export interface ValidConnection {
  readonly serviceId: string;
  readonly componentId: string;
  readonly scope: InjectionScope;
}

/** Constrains what scopes are valid for a service. */
export interface ScopeRule {
  readonly serviceId: string;
  readonly allowedScopes: readonly InjectionScope[];
  readonly defaultScope: InjectionScope;
}

/** Game-specific level data for Power Grid. */
export interface PowerGridLevelData {
  readonly services: readonly ServiceNode[];
  readonly components: readonly ComponentNode[];
  readonly validConnections: readonly ValidConnection[];
  readonly scopeRules: readonly ScopeRule[];
}

// ---------------------------------------------------------------------------
// Runtime types (moved from engine, canonical source of truth)
// ---------------------------------------------------------------------------

/** A player-drawn connection between a service and component. */
export interface PowerConnection {
  readonly id: string;
  readonly serviceId: string;
  readonly componentId: string;
  readonly scope: InjectionScope;
  /** Set by validation — indicates whether this connection is correct. */
  readonly isCorrect?: boolean;
}

/** A short circuit detected during validation. */
export interface ShortCircuit {
  readonly connectionId: string;
  readonly serviceId: string;
  readonly componentId: string;
  readonly reason: 'wrong-pair' | 'wrong-scope';
  /** Human-readable description of the short circuit. */
  readonly description?: string;
  /** Node IDs involved in the short circuit. */
  readonly involvedNodes?: readonly string[];
}

/** Result of validating all connections. */
export interface GridValidationResult {
  readonly correctConnections: readonly PowerConnection[];
  readonly shortCircuits: readonly ShortCircuit[];
  readonly missingConnections: readonly ValidConnection[];
  readonly allCorrect: boolean;
}

/** Result of validating a single connection. */
export interface ConnectionResult {
  readonly valid: boolean;
  readonly reason?: 'wrong-pair' | 'wrong-scope';
}

/** Validation service interface for Power Grid (T-2026-433 will implement). */
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
// Utility functions
// ---------------------------------------------------------------------------

/**
 * Checks whether a scope is in the allowed list for a service.
 * If no scope rule exists for the service, returns true (lenient).
 */
export function isScopeAllowed(
  serviceId: string,
  scope: InjectionScope,
  scopeRules: readonly ScopeRule[],
): boolean {
  const rule = scopeRules.find(r => r.serviceId === serviceId);
  if (!rule) return true;
  return rule.allowedScopes.includes(scope);
}

/**
 * Checks whether a connection is valid against the answer key and scope rules.
 *
 * A connection is valid if and only if:
 * 1. The serviceId-componentId pair exists in `validConnections` at the specified scope
 * 2. The scope passes `isScopeAllowed` for that service (or no scopeRule exists)
 */
export function isConnectionValid(
  connection: Pick<PowerConnection, 'serviceId' | 'componentId' | 'scope'>,
  validConnections: readonly ValidConnection[],
  scopeRules: readonly ScopeRule[],
): boolean {
  const pairMatch = validConnections.find(
    vc =>
      vc.serviceId === connection.serviceId &&
      vc.componentId === connection.componentId &&
      vc.scope === connection.scope,
  );
  if (!pairMatch) return false;
  return isScopeAllowed(connection.serviceId, connection.scope, scopeRules);
}
