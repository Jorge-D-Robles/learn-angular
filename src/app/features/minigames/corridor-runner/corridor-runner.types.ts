// ---------------------------------------------------------------------------
// Canonical domain model types for Corridor Runner minigame
// ---------------------------------------------------------------------------

/** A station module (node) on the corridor map. */
export interface MapNode {
  readonly id: string;
  readonly label: string;
  readonly position: { readonly x: number; readonly y: number };
  readonly deck?: number;
}

/**
 * A corridor (edge) connecting two station modules.
 * Edges are UNDIRECTED — corridors allow bidirectional movement.
 * sourceNodeId/targetNodeId are just the two endpoints.
 */
export interface MapEdge {
  readonly id: string;
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
}

/** The station corridor map layout. */
export interface MapLayout {
  readonly nodes: readonly MapNode[];
  readonly edges: readonly MapEdge[];
}

/**
 * A route entry in the route configuration.
 * This is the SOLUTION config (answer key) — the route configuration the
 * player must reproduce. The engine (T-2026-082) uses this to evaluate
 * the player's config.
 */
export interface RouteEntry {
  readonly path: string;
  readonly component?: string;
  readonly redirectTo?: string;
  readonly pathMatch?: 'full' | 'prefix';
  readonly children?: readonly RouteEntry[];
  readonly loadComponent?: string;
  readonly canActivate?: readonly string[];
  readonly resolve?: Readonly<Record<string, string>>;
}

/** A test navigation the system will run during the Run phase. */
export interface TestNavigation {
  readonly url: string;
  readonly expectedDestination: string;
  readonly description: string;
  readonly params?: Readonly<Record<string, string>>;
}

/** A destination that must be reachable through the route config. */
export interface TargetDestination {
  readonly moduleId: string;
  readonly moduleName: string;
  readonly requiredPath: string;
}

/** Game-specific level data for Corridor Runner. */
export interface CorridorRunnerLevelData {
  /**
   * The SOLUTION route configuration (answer key) the player must reproduce.
   * Every level has at least 1 route entry.
   */
  readonly routeConfig: readonly RouteEntry[];
  readonly mapLayout: MapLayout;
  readonly testNavigations: readonly TestNavigation[];
  readonly targetDestinations: readonly TargetDestination[];
}
