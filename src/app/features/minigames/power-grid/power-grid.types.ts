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
