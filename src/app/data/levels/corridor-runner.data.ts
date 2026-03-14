import { DifficultyTier } from '../../core/minigame/minigame.types';
import type { LevelDefinition, LevelPack } from '../../core/levels/level.types';
import type {
  CorridorRunnerLevelData,
  MapNode,
  MapEdge,
  RouteEntry,
  TestNavigation,
  TargetDestination,
} from '../../features/minigames/corridor-runner/corridor-runner.types';

// ---------------------------------------------------------------------------
// Builder helpers (private to this file)
// ---------------------------------------------------------------------------

/** Build a MapNode with auto-prefixed ID. */
function mapNode(
  prefix: string,
  idx: number,
  label: string,
  x: number,
  y: number,
  deck?: number,
): MapNode {
  const base: MapNode = { id: `${prefix}-n${idx}`, label, position: { x, y } };
  return deck !== undefined ? { ...base, deck } : base;
}

/** Build a MapEdge with auto-prefixed ID. */
function mapEdge(
  prefix: string,
  idx: number,
  sourceNodeId: string,
  targetNodeId: string,
): MapEdge {
  return { id: `${prefix}-e${idx}`, sourceNodeId, targetNodeId };
}

/** Build a RouteEntry. */
function route(
  path: string,
  component?: string,
  opts?: Partial<Omit<RouteEntry, 'path' | 'component'>>,
): RouteEntry {
  const entry: RouteEntry = { path, ...(component ? { component } : {}), ...opts };
  return entry;
}

/** Build a TestNavigation. */
function testNav(
  url: string,
  expectedDestination: string,
  description: string,
  params?: Readonly<Record<string, string>>,
): TestNavigation {
  const nav: TestNavigation = { url, expectedDestination, description };
  return params ? { ...nav, params } : nav;
}

/** Build a TargetDestination. */
function target(
  moduleId: string,
  moduleName: string,
  requiredPath: string,
): TargetDestination {
  return { moduleId, moduleName, requiredPath };
}

// ---------------------------------------------------------------------------
// Level definitions
// ---------------------------------------------------------------------------

export const CORRIDOR_RUNNER_LEVELS: readonly LevelDefinition<CorridorRunnerLevelData>[] = [
  // =========================================================================
  // BASIC TIER (Levels 1-6)
  // =========================================================================

  // Level 1 — Single Corridor (Single route)
  {
    levelId: 'cr-basic-01',
    gameId: 'corridor-runner',
    tier: DifficultyTier.Basic,
    order: 1,
    title: 'Single Corridor',
    conceptIntroduced: 'Single route',
    description: 'Map a single path to a station module. The simplest route configuration.',
    data: {
      routeConfig: [
        route('engineering', 'EngineeringBay'),
      ],
      mapLayout: {
        nodes: [
          mapNode('cr-basic-01', 1, 'Main Hub', 0, 0),
          mapNode('cr-basic-01', 2, 'Engineering Bay', 200, 0),
        ],
        edges: [
          mapEdge('cr-basic-01', 1, 'cr-basic-01-n1', 'cr-basic-01-n2'),
        ],
      },
      testNavigations: [
        testNav('/engineering', 'Engineering Bay', 'Navigate to Engineering Bay'),
      ],
      targetDestinations: [
        target('cr-basic-01-n2', 'Engineering Bay', '/engineering'),
      ],
    },
  },

  // Level 2 — Module Trio (Multiple routes)
  {
    levelId: 'cr-basic-02',
    gameId: 'corridor-runner',
    tier: DifficultyTier.Basic,
    order: 2,
    title: 'Module Trio',
    conceptIntroduced: 'Multiple routes',
    description: 'Configure three routes to connect the hub to three station modules.',
    data: {
      routeConfig: [
        route('bridge', 'Bridge'),
        route('medbay', 'MedBay'),
        route('cargo', 'CargoBay'),
      ],
      mapLayout: {
        nodes: [
          mapNode('cr-basic-02', 1, 'Main Hub', 100, 100),
          mapNode('cr-basic-02', 2, 'Bridge', 200, 0),
          mapNode('cr-basic-02', 3, 'Med Bay', 0, 200),
          mapNode('cr-basic-02', 4, 'Cargo Bay', 200, 200),
        ],
        edges: [
          mapEdge('cr-basic-02', 1, 'cr-basic-02-n1', 'cr-basic-02-n2'),
          mapEdge('cr-basic-02', 2, 'cr-basic-02-n1', 'cr-basic-02-n3'),
          mapEdge('cr-basic-02', 3, 'cr-basic-02-n1', 'cr-basic-02-n4'),
        ],
      },
      testNavigations: [
        testNav('/bridge', 'Bridge', 'Navigate to Bridge'),
        testNav('/medbay', 'Med Bay', 'Navigate to Med Bay'),
        testNav('/cargo', 'Cargo Bay', 'Navigate to Cargo Bay'),
      ],
      targetDestinations: [
        target('cr-basic-02-n2', 'Bridge', '/bridge'),
        target('cr-basic-02-n3', 'Med Bay', '/medbay'),
        target('cr-basic-02-n4', 'Cargo Bay', '/cargo'),
      ],
    },
  },

  // Level 3 — Default Destination (Default route)
  {
    levelId: 'cr-basic-03',
    gameId: 'corridor-runner',
    tier: DifficultyTier.Basic,
    order: 3,
    title: 'Default Destination',
    conceptIntroduced: 'Default route',
    description: 'Set a default route so the empty path redirects to a module.',
    data: {
      routeConfig: [
        route('', undefined, { redirectTo: 'ops-center', pathMatch: 'full' }),
        route('ops-center', 'OpsCenter'),
        route('lab', 'ScienceLab'),
      ],
      mapLayout: {
        nodes: [
          mapNode('cr-basic-03', 1, 'Main Hub', 0, 100),
          mapNode('cr-basic-03', 2, 'Ops Center', 200, 0),
          mapNode('cr-basic-03', 3, 'Science Lab', 200, 200),
        ],
        edges: [
          mapEdge('cr-basic-03', 1, 'cr-basic-03-n1', 'cr-basic-03-n2'),
          mapEdge('cr-basic-03', 2, 'cr-basic-03-n1', 'cr-basic-03-n3'),
        ],
      },
      testNavigations: [
        testNav('/', 'Ops Center', 'Empty path redirects to Ops Center'),
        testNav('/lab', 'Science Lab', 'Navigate to Science Lab'),
      ],
      targetDestinations: [
        target('cr-basic-03-n2', 'Ops Center', '/ops-center'),
        target('cr-basic-03-n3', 'Science Lab', '/lab'),
      ],
    },
  },

  // Level 4 — Hull Breach Handler (Wildcard route)
  {
    levelId: 'cr-basic-04',
    gameId: 'corridor-runner',
    tier: DifficultyTier.Basic,
    order: 4,
    title: 'Hull Breach Handler',
    conceptIntroduced: 'Wildcard route',
    description: 'Add a wildcard route to catch unknown paths and show an error page.',
    data: {
      routeConfig: [
        route('reactor', 'ReactorRoom'),
        route('armory', 'Armory'),
        route('**', 'HullBreachAlert'),
      ],
      mapLayout: {
        nodes: [
          mapNode('cr-basic-04', 1, 'Main Hub', 100, 100),
          mapNode('cr-basic-04', 2, 'Reactor Room', 0, 0),
          mapNode('cr-basic-04', 3, 'Armory', 200, 0),
          mapNode('cr-basic-04', 4, 'Hull Breach Alert', 100, 200),
        ],
        edges: [
          mapEdge('cr-basic-04', 1, 'cr-basic-04-n1', 'cr-basic-04-n2'),
          mapEdge('cr-basic-04', 2, 'cr-basic-04-n1', 'cr-basic-04-n3'),
          mapEdge('cr-basic-04', 3, 'cr-basic-04-n1', 'cr-basic-04-n4'),
        ],
      },
      testNavigations: [
        testNav('/reactor', 'Reactor Room', 'Navigate to Reactor Room'),
        testNav('/armory', 'Armory', 'Navigate to Armory'),
        testNav('/unknown-deck', 'Hull Breach Alert', 'Unknown path triggers Hull Breach Alert'),
      ],
      targetDestinations: [
        target('cr-basic-04-n2', 'Reactor Room', '/reactor'),
        target('cr-basic-04-n3', 'Armory', '/armory'),
        target('cr-basic-04-n4', 'Hull Breach Alert', '/**'),
      ],
    },
  },

  // Level 5 — Priority Corridors (Route order matters)
  {
    levelId: 'cr-basic-05',
    gameId: 'corridor-runner',
    tier: DifficultyTier.Basic,
    order: 5,
    title: 'Priority Corridors',
    conceptIntroduced: 'Route order matters',
    description: 'Order routes correctly so specific paths match before wildcard catches all.',
    data: {
      routeConfig: [
        route('comms', 'CommsArray'),
        route('storage', 'StorageBay'),
        route('maintenance', 'MaintenanceShaft'),
        route('**', 'LostInSpace'),
      ],
      mapLayout: {
        nodes: [
          mapNode('cr-basic-05', 1, 'Main Hub', 100, 100),
          mapNode('cr-basic-05', 2, 'Comms Array', 0, 0),
          mapNode('cr-basic-05', 3, 'Storage Bay', 200, 0),
          mapNode('cr-basic-05', 4, 'Maintenance Shaft', 0, 200),
          mapNode('cr-basic-05', 5, 'Lost In Space', 200, 200),
        ],
        edges: [
          mapEdge('cr-basic-05', 1, 'cr-basic-05-n1', 'cr-basic-05-n2'),
          mapEdge('cr-basic-05', 2, 'cr-basic-05-n1', 'cr-basic-05-n3'),
          mapEdge('cr-basic-05', 3, 'cr-basic-05-n1', 'cr-basic-05-n4'),
          mapEdge('cr-basic-05', 4, 'cr-basic-05-n1', 'cr-basic-05-n5'),
        ],
      },
      testNavigations: [
        testNav('/comms', 'Comms Array', 'Navigate to Comms Array'),
        testNav('/storage', 'Storage Bay', 'Navigate to Storage Bay'),
        testNav('/maintenance', 'Maintenance Shaft', 'Navigate to Maintenance Shaft'),
        testNav('/nowhere', 'Lost In Space', 'Unknown path hits wildcard'),
      ],
      targetDestinations: [
        target('cr-basic-05-n2', 'Comms Array', '/comms'),
        target('cr-basic-05-n3', 'Storage Bay', '/storage'),
        target('cr-basic-05-n4', 'Maintenance Shaft', '/maintenance'),
        target('cr-basic-05-n5', 'Lost In Space', '/**'),
      ],
    },
  },

  // Level 6 — Navigation Links (RouterLink)
  {
    levelId: 'cr-basic-06',
    gameId: 'corridor-runner',
    tier: DifficultyTier.Basic,
    order: 6,
    title: 'Navigation Links',
    conceptIntroduced: 'RouterLink',
    description: 'Use routerLink directives to connect navigation buttons to routes.',
    data: {
      routeConfig: [
        route('', undefined, { redirectTo: 'dashboard', pathMatch: 'full' }),
        route('dashboard', 'Dashboard'),
        route('sensors', 'SensorArray'),
        route('crew-quarters', 'CrewQuarters'),
      ],
      mapLayout: {
        nodes: [
          mapNode('cr-basic-06', 1, 'Main Hub', 100, 100),
          mapNode('cr-basic-06', 2, 'Dashboard', 100, 0),
          mapNode('cr-basic-06', 3, 'Sensor Array', 0, 200),
          mapNode('cr-basic-06', 4, 'Crew Quarters', 200, 200),
        ],
        edges: [
          mapEdge('cr-basic-06', 1, 'cr-basic-06-n1', 'cr-basic-06-n2'),
          mapEdge('cr-basic-06', 2, 'cr-basic-06-n1', 'cr-basic-06-n3'),
          mapEdge('cr-basic-06', 3, 'cr-basic-06-n1', 'cr-basic-06-n4'),
        ],
      },
      testNavigations: [
        testNav('/dashboard', 'Dashboard', 'Navigate to Dashboard'),
        testNav('/sensors', 'Sensor Array', 'Navigate to Sensor Array'),
        testNav('/crew-quarters', 'Crew Quarters', 'Navigate to Crew Quarters'),
      ],
      targetDestinations: [
        target('cr-basic-06-n2', 'Dashboard', '/dashboard'),
        target('cr-basic-06-n3', 'Sensor Array', '/sensors'),
        target('cr-basic-06-n4', 'Crew Quarters', '/crew-quarters'),
      ],
    },
  },

  // =========================================================================
  // INTERMEDIATE TIER (Levels 7-12)
  // =========================================================================

  // Level 7 — Dynamic Corridors (Route parameters)
  {
    levelId: 'cr-intermediate-01',
    gameId: 'corridor-runner',
    tier: DifficultyTier.Intermediate,
    order: 1,
    title: 'Dynamic Corridors',
    conceptIntroduced: 'Route parameters',
    description: 'Use route parameters to create dynamic paths for crew member profiles.',
    data: {
      routeConfig: [
        route('crew', 'CrewList'),
        route('crew/:id', 'CrewProfile'),
      ],
      mapLayout: {
        nodes: [
          mapNode('cr-intermediate-01', 1, 'Main Hub', 0, 100),
          mapNode('cr-intermediate-01', 2, 'Crew List', 200, 0),
          mapNode('cr-intermediate-01', 3, 'Crew Profile', 200, 200),
          mapNode('cr-intermediate-01', 4, 'Crew Directory', 400, 100),
        ],
        edges: [
          mapEdge('cr-intermediate-01', 1, 'cr-intermediate-01-n1', 'cr-intermediate-01-n2'),
          mapEdge('cr-intermediate-01', 2, 'cr-intermediate-01-n2', 'cr-intermediate-01-n3'),
          mapEdge('cr-intermediate-01', 3, 'cr-intermediate-01-n3', 'cr-intermediate-01-n4'),
        ],
      },
      testNavigations: [
        testNav('/crew', 'Crew List', 'Navigate to Crew List'),
        testNav('/crew/cpt-nova', 'Crew Profile', 'Navigate to Captain Nova profile', { id: 'cpt-nova' }),
        testNav('/crew/eng-pulse', 'Crew Profile', 'Navigate to Engineer Pulse profile', { id: 'eng-pulse' }),
      ],
      targetDestinations: [
        target('cr-intermediate-01-n2', 'Crew List', '/crew'),
        target('cr-intermediate-01-n3', 'Crew Profile', '/crew/:id'),
        target('cr-intermediate-01-n4', 'Crew Directory', '/crew/directory'),
      ],
    },
  },

  // Level 8 — Param Reader (Reading params)
  {
    levelId: 'cr-intermediate-02',
    gameId: 'corridor-runner',
    tier: DifficultyTier.Intermediate,
    order: 2,
    title: 'Param Reader',
    conceptIntroduced: 'Reading params',
    description: 'Read route parameters to display module details and system status.',
    data: {
      routeConfig: [
        route('modules', 'ModuleList'),
        route('modules/:moduleId', 'ModuleDetail'),
        route('systems/:systemId/status', 'SystemStatus'),
      ],
      mapLayout: {
        nodes: [
          mapNode('cr-intermediate-02', 1, 'Main Hub', 0, 100),
          mapNode('cr-intermediate-02', 2, 'Module List', 150, 0),
          mapNode('cr-intermediate-02', 3, 'Module Detail', 300, 0),
          mapNode('cr-intermediate-02', 4, 'System Status', 300, 200),
          mapNode('cr-intermediate-02', 5, 'Systems Hub', 150, 200),
        ],
        edges: [
          mapEdge('cr-intermediate-02', 1, 'cr-intermediate-02-n1', 'cr-intermediate-02-n2'),
          mapEdge('cr-intermediate-02', 2, 'cr-intermediate-02-n2', 'cr-intermediate-02-n3'),
          mapEdge('cr-intermediate-02', 3, 'cr-intermediate-02-n1', 'cr-intermediate-02-n5'),
          mapEdge('cr-intermediate-02', 4, 'cr-intermediate-02-n5', 'cr-intermediate-02-n4'),
        ],
      },
      testNavigations: [
        testNav('/modules', 'Module List', 'Navigate to Module List'),
        testNav('/modules/nav-array', 'Module Detail', 'View nav-array module detail', { moduleId: 'nav-array' }),
        testNav('/systems/life-support/status', 'System Status', 'Check life-support status', { systemId: 'life-support' }),
      ],
      targetDestinations: [
        target('cr-intermediate-02-n2', 'Module List', '/modules'),
        target('cr-intermediate-02-n3', 'Module Detail', '/modules/:moduleId'),
        target('cr-intermediate-02-n4', 'System Status', '/systems/:systemId/status'),
      ],
    },
  },

  // Level 9 — Nested Sections (Nested routes / children)
  {
    levelId: 'cr-intermediate-03',
    gameId: 'corridor-runner',
    tier: DifficultyTier.Intermediate,
    order: 3,
    title: 'Nested Sections',
    conceptIntroduced: 'Nested routes (children)',
    description: 'Use child routes to create nested views within an admin section.',
    data: {
      routeConfig: [
        route('admin', 'AdminPanel', {
          children: [
            route('users', 'UserManagement'),
            route('logs', 'SystemLogs'),
            route('config', 'StationConfig'),
          ],
        }),
      ],
      mapLayout: {
        nodes: [
          mapNode('cr-intermediate-03', 1, 'Main Hub', 0, 100),
          mapNode('cr-intermediate-03', 2, 'Admin Panel', 200, 100),
          mapNode('cr-intermediate-03', 3, 'User Management', 400, 0),
          mapNode('cr-intermediate-03', 4, 'System Logs', 400, 100),
          mapNode('cr-intermediate-03', 5, 'Station Config', 400, 200),
        ],
        edges: [
          mapEdge('cr-intermediate-03', 1, 'cr-intermediate-03-n1', 'cr-intermediate-03-n2'),
          mapEdge('cr-intermediate-03', 2, 'cr-intermediate-03-n2', 'cr-intermediate-03-n3'),
          mapEdge('cr-intermediate-03', 3, 'cr-intermediate-03-n2', 'cr-intermediate-03-n4'),
          mapEdge('cr-intermediate-03', 4, 'cr-intermediate-03-n2', 'cr-intermediate-03-n5'),
        ],
      },
      testNavigations: [
        testNav('/admin/users', 'User Management', 'Navigate to User Management'),
        testNav('/admin/logs', 'System Logs', 'Navigate to System Logs'),
        testNav('/admin/config', 'Station Config', 'Navigate to Station Config'),
      ],
      targetDestinations: [
        target('cr-intermediate-03-n3', 'User Management', '/admin/users'),
        target('cr-intermediate-03-n4', 'System Logs', '/admin/logs'),
        target('cr-intermediate-03-n5', 'Station Config', '/admin/config'),
      ],
    },
  },

  // Level 10 — Multi-View Deck (Router outlet)
  {
    levelId: 'cr-intermediate-04',
    gameId: 'corridor-runner',
    tier: DifficultyTier.Intermediate,
    order: 4,
    title: 'Multi-View Deck',
    conceptIntroduced: 'Router outlet',
    description: 'Use router-outlet to display different views in a multi-section deck.',
    data: {
      routeConfig: [
        route('deck', 'DeckLayout', {
          children: [
            route('', undefined, { redirectTo: 'overview', pathMatch: 'full' }),
            route('overview', 'DeckOverview'),
            route('diagnostics', 'DeckDiagnostics'),
            route('personnel', 'DeckPersonnel'),
          ],
        }),
      ],
      mapLayout: {
        nodes: [
          mapNode('cr-intermediate-04', 1, 'Main Hub', 0, 100),
          mapNode('cr-intermediate-04', 2, 'Deck Layout', 200, 100),
          mapNode('cr-intermediate-04', 3, 'Deck Overview', 400, 0),
          mapNode('cr-intermediate-04', 4, 'Deck Diagnostics', 400, 100),
          mapNode('cr-intermediate-04', 5, 'Deck Personnel', 400, 200),
        ],
        edges: [
          mapEdge('cr-intermediate-04', 1, 'cr-intermediate-04-n1', 'cr-intermediate-04-n2'),
          mapEdge('cr-intermediate-04', 2, 'cr-intermediate-04-n2', 'cr-intermediate-04-n3'),
          mapEdge('cr-intermediate-04', 3, 'cr-intermediate-04-n2', 'cr-intermediate-04-n4'),
          mapEdge('cr-intermediate-04', 4, 'cr-intermediate-04-n2', 'cr-intermediate-04-n5'),
        ],
      },
      testNavigations: [
        testNav('/deck/overview', 'Deck Overview', 'View deck overview'),
        testNav('/deck/diagnostics', 'Deck Diagnostics', 'View deck diagnostics'),
        testNav('/deck/personnel', 'Deck Personnel', 'View deck personnel'),
      ],
      targetDestinations: [
        target('cr-intermediate-04-n3', 'Deck Overview', '/deck/overview'),
        target('cr-intermediate-04-n4', 'Deck Diagnostics', '/deck/diagnostics'),
        target('cr-intermediate-04-n5', 'Deck Personnel', '/deck/personnel'),
      ],
    },
  },

  // Level 11 — Search Parameters (Query parameters)
  {
    levelId: 'cr-intermediate-05',
    gameId: 'corridor-runner',
    tier: DifficultyTier.Intermediate,
    order: 5,
    title: 'Search Parameters',
    conceptIntroduced: 'Query parameters',
    description: 'Use query parameters to filter and search across station records.',
    data: {
      routeConfig: [
        route('records', 'RecordsArchive'),
        route('records/search', 'RecordSearch'),
        route('inventory', 'InventoryList'),
        route('inventory/:itemId', 'InventoryDetail'),
      ],
      mapLayout: {
        nodes: [
          mapNode('cr-intermediate-05', 1, 'Main Hub', 0, 100),
          mapNode('cr-intermediate-05', 2, 'Records Archive', 200, 0),
          mapNode('cr-intermediate-05', 3, 'Record Search', 400, 0),
          mapNode('cr-intermediate-05', 4, 'Inventory List', 200, 200),
          mapNode('cr-intermediate-05', 5, 'Inventory Detail', 400, 200),
        ],
        edges: [
          mapEdge('cr-intermediate-05', 1, 'cr-intermediate-05-n1', 'cr-intermediate-05-n2'),
          mapEdge('cr-intermediate-05', 2, 'cr-intermediate-05-n2', 'cr-intermediate-05-n3'),
          mapEdge('cr-intermediate-05', 3, 'cr-intermediate-05-n1', 'cr-intermediate-05-n4'),
          mapEdge('cr-intermediate-05', 4, 'cr-intermediate-05-n4', 'cr-intermediate-05-n5'),
        ],
      },
      testNavigations: [
        testNav('/records', 'Records Archive', 'Navigate to Records Archive'),
        testNav('/records/search?type=incident', 'Record Search', 'Search for incident records'),
        testNav('/inventory', 'Inventory List', 'Navigate to Inventory List'),
        testNav('/inventory/plasma-coil', 'Inventory Detail', 'View plasma coil inventory', { itemId: 'plasma-coil' }),
      ],
      targetDestinations: [
        target('cr-intermediate-05-n2', 'Records Archive', '/records'),
        target('cr-intermediate-05-n3', 'Record Search', '/records/search'),
        target('cr-intermediate-05-n4', 'Inventory List', '/inventory'),
        target('cr-intermediate-05-n5', 'Inventory Detail', '/inventory/:itemId'),
      ],
    },
  },

  // Level 12 — Deck Integration (Mixed challenge)
  {
    levelId: 'cr-intermediate-06',
    gameId: 'corridor-runner',
    tier: DifficultyTier.Intermediate,
    order: 6,
    title: 'Deck Integration',
    conceptIntroduced: 'Mixed challenge',
    description: 'Combine routes, params, children, and redirects in a full deck layout.',
    data: {
      routeConfig: [
        route('', undefined, { redirectTo: 'hub', pathMatch: 'full' }),
        route('hub', 'StationHub'),
        route('section/:sectionId', 'SectionView', {
          children: [
            route('', undefined, { redirectTo: 'info', pathMatch: 'full' }),
            route('info', 'SectionInfo'),
            route('crew', 'SectionCrew'),
          ],
        }),
        route('emergency', 'EmergencyPanel'),
        route('**', 'NotFound'),
      ],
      mapLayout: {
        nodes: [
          mapNode('cr-intermediate-06', 1, 'Main Hub', 0, 150),
          mapNode('cr-intermediate-06', 2, 'Station Hub', 150, 0),
          mapNode('cr-intermediate-06', 3, 'Section View', 300, 100),
          mapNode('cr-intermediate-06', 4, 'Section Info', 450, 50),
          mapNode('cr-intermediate-06', 5, 'Section Crew', 450, 150),
          mapNode('cr-intermediate-06', 6, 'Emergency Panel', 150, 300),
          mapNode('cr-intermediate-06', 7, 'Not Found', 300, 300),
          mapNode('cr-intermediate-06', 8, 'Corridor Junction', 150, 150),
        ],
        edges: [
          mapEdge('cr-intermediate-06', 1, 'cr-intermediate-06-n1', 'cr-intermediate-06-n2'),
          mapEdge('cr-intermediate-06', 2, 'cr-intermediate-06-n1', 'cr-intermediate-06-n8'),
          mapEdge('cr-intermediate-06', 3, 'cr-intermediate-06-n8', 'cr-intermediate-06-n3'),
          mapEdge('cr-intermediate-06', 4, 'cr-intermediate-06-n3', 'cr-intermediate-06-n4'),
          mapEdge('cr-intermediate-06', 5, 'cr-intermediate-06-n3', 'cr-intermediate-06-n5'),
          mapEdge('cr-intermediate-06', 6, 'cr-intermediate-06-n1', 'cr-intermediate-06-n6'),
          mapEdge('cr-intermediate-06', 7, 'cr-intermediate-06-n1', 'cr-intermediate-06-n7'),
        ],
      },
      testNavigations: [
        testNav('/hub', 'Station Hub', 'Navigate to Station Hub'),
        testNav('/section/alpha/info', 'Section Info', 'View Alpha section info', { sectionId: 'alpha' }),
        testNav('/section/beta/crew', 'Section Crew', 'View Beta section crew', { sectionId: 'beta' }),
        testNav('/emergency', 'Emergency Panel', 'Navigate to Emergency Panel'),
        testNav('/nonexistent', 'Not Found', 'Unknown path hits Not Found'),
      ],
      targetDestinations: [
        target('cr-intermediate-06-n2', 'Station Hub', '/hub'),
        target('cr-intermediate-06-n4', 'Section Info', '/section/:sectionId/info'),
        target('cr-intermediate-06-n5', 'Section Crew', '/section/:sectionId/crew'),
        target('cr-intermediate-06-n6', 'Emergency Panel', '/emergency'),
        target('cr-intermediate-06-n7', 'Not Found', '/**'),
      ],
    },
  },

  // =========================================================================
  // ADVANCED TIER (Levels 13-17)
  // =========================================================================

  // Level 13 — Lazy Corridors (Lazy loading)
  {
    levelId: 'cr-advanced-01',
    gameId: 'corridor-runner',
    tier: DifficultyTier.Advanced,
    order: 1,
    title: 'Lazy Corridors',
    conceptIntroduced: 'Lazy loading',
    description: 'Use loadComponent to lazily load station modules on demand.',
    data: {
      routeConfig: [
        route('command', 'CommandCenter'),
        route('science', undefined, { loadComponent: 'ScienceLab' }),
        route('engineering', undefined, { loadComponent: 'EngineeringDeck' }),
        route('hydroponics', undefined, { loadComponent: 'Hydroponics' }),
        route('observatory', undefined, { loadComponent: 'Observatory' }),
      ],
      mapLayout: {
        nodes: [
          mapNode('cr-advanced-01', 1, 'Main Hub', 0, 200),
          mapNode('cr-advanced-01', 2, 'Command Center', 200, 0),
          mapNode('cr-advanced-01', 3, 'Science Lab', 200, 100),
          mapNode('cr-advanced-01', 4, 'Engineering Deck', 200, 200),
          mapNode('cr-advanced-01', 5, 'Hydroponics', 200, 300),
          mapNode('cr-advanced-01', 6, 'Observatory', 200, 400),
        ],
        edges: [
          mapEdge('cr-advanced-01', 1, 'cr-advanced-01-n1', 'cr-advanced-01-n2'),
          mapEdge('cr-advanced-01', 2, 'cr-advanced-01-n1', 'cr-advanced-01-n3'),
          mapEdge('cr-advanced-01', 3, 'cr-advanced-01-n1', 'cr-advanced-01-n4'),
          mapEdge('cr-advanced-01', 4, 'cr-advanced-01-n1', 'cr-advanced-01-n5'),
          mapEdge('cr-advanced-01', 5, 'cr-advanced-01-n1', 'cr-advanced-01-n6'),
        ],
      },
      testNavigations: [
        testNav('/command', 'Command Center', 'Navigate to Command Center (eager)'),
        testNav('/science', 'Science Lab', 'Lazy-load Science Lab'),
        testNav('/engineering', 'Engineering Deck', 'Lazy-load Engineering Deck'),
        testNav('/hydroponics', 'Hydroponics', 'Lazy-load Hydroponics'),
        testNav('/observatory', 'Observatory', 'Lazy-load Observatory'),
      ],
      targetDestinations: [
        target('cr-advanced-01-n2', 'Command Center', '/command'),
        target('cr-advanced-01-n3', 'Science Lab', '/science'),
        target('cr-advanced-01-n4', 'Engineering Deck', '/engineering'),
        target('cr-advanced-01-n5', 'Hydroponics', '/hydroponics'),
        target('cr-advanced-01-n6', 'Observatory', '/observatory'),
      ],
    },
  },

  // Level 14 — Access Control (Route guards)
  {
    levelId: 'cr-advanced-02',
    gameId: 'corridor-runner',
    tier: DifficultyTier.Advanced,
    order: 2,
    title: 'Access Control',
    conceptIntroduced: 'Route guards',
    description: 'Add canActivate guards to restrict access to sensitive station areas.',
    data: {
      routeConfig: [
        route('public-deck', 'PublicDeck'),
        route('restricted-lab', 'RestrictedLab', { canActivate: ['AuthGuard'] }),
        route('command-bridge', 'CommandBridge', { canActivate: ['AuthGuard', 'OfficerGuard'] }),
        route('brig', 'Brig', { canActivate: ['AuthGuard'] }),
        route('unauthorized', 'Unauthorized'),
      ],
      mapLayout: {
        nodes: [
          mapNode('cr-advanced-02', 1, 'Main Hub', 0, 150),
          mapNode('cr-advanced-02', 2, 'Public Deck', 200, 0),
          mapNode('cr-advanced-02', 3, 'Restricted Lab', 200, 75),
          mapNode('cr-advanced-02', 4, 'Command Bridge', 200, 150),
          mapNode('cr-advanced-02', 5, 'Brig', 200, 225),
          mapNode('cr-advanced-02', 6, 'Unauthorized', 200, 300),
          mapNode('cr-advanced-02', 7, 'Security Checkpoint', 100, 150),
        ],
        edges: [
          mapEdge('cr-advanced-02', 1, 'cr-advanced-02-n1', 'cr-advanced-02-n2'),
          mapEdge('cr-advanced-02', 2, 'cr-advanced-02-n1', 'cr-advanced-02-n7'),
          mapEdge('cr-advanced-02', 3, 'cr-advanced-02-n7', 'cr-advanced-02-n3'),
          mapEdge('cr-advanced-02', 4, 'cr-advanced-02-n7', 'cr-advanced-02-n4'),
          mapEdge('cr-advanced-02', 5, 'cr-advanced-02-n7', 'cr-advanced-02-n5'),
          mapEdge('cr-advanced-02', 6, 'cr-advanced-02-n1', 'cr-advanced-02-n6'),
        ],
      },
      testNavigations: [
        testNav('/public-deck', 'Public Deck', 'Navigate to Public Deck (no guard)'),
        testNav('/restricted-lab', 'Restricted Lab', 'Access Restricted Lab (AuthGuard)'),
        testNav('/command-bridge', 'Command Bridge', 'Access Command Bridge (AuthGuard + OfficerGuard)'),
        testNav('/brig', 'Brig', 'Access Brig (AuthGuard)'),
        testNav('/unauthorized', 'Unauthorized', 'Navigate to Unauthorized page'),
      ],
      targetDestinations: [
        target('cr-advanced-02-n2', 'Public Deck', '/public-deck'),
        target('cr-advanced-02-n3', 'Restricted Lab', '/restricted-lab'),
        target('cr-advanced-02-n4', 'Command Bridge', '/command-bridge'),
        target('cr-advanced-02-n5', 'Brig', '/brig'),
        target('cr-advanced-02-n6', 'Unauthorized', '/unauthorized'),
      ],
    },
  },

  // Level 15 — Pre-Fetch Protocol (Resolvers)
  {
    levelId: 'cr-advanced-03',
    gameId: 'corridor-runner',
    tier: DifficultyTier.Advanced,
    order: 3,
    title: 'Pre-Fetch Protocol',
    conceptIntroduced: 'Resolvers',
    description: 'Use resolvers to pre-fetch data before navigating to station modules.',
    data: {
      routeConfig: [
        route('mission-log', 'MissionLog', { resolve: { missions: 'MissionResolver' } }),
        route('crew-manifest', 'CrewManifest', { resolve: { crew: 'CrewResolver' } }),
        route('cargo-manifest', 'CargoManifest', { resolve: { cargo: 'CargoResolver', stats: 'StatsResolver' } }),
        route('status', 'StationStatus'),
      ],
      mapLayout: {
        nodes: [
          mapNode('cr-advanced-03', 1, 'Main Hub', 0, 150),
          mapNode('cr-advanced-03', 2, 'Mission Log', 200, 0),
          mapNode('cr-advanced-03', 3, 'Crew Manifest', 200, 100),
          mapNode('cr-advanced-03', 4, 'Cargo Manifest', 200, 200),
          mapNode('cr-advanced-03', 5, 'Station Status', 200, 300),
          mapNode('cr-advanced-03', 6, 'Data Center', 100, 150),
        ],
        edges: [
          mapEdge('cr-advanced-03', 1, 'cr-advanced-03-n1', 'cr-advanced-03-n6'),
          mapEdge('cr-advanced-03', 2, 'cr-advanced-03-n6', 'cr-advanced-03-n2'),
          mapEdge('cr-advanced-03', 3, 'cr-advanced-03-n6', 'cr-advanced-03-n3'),
          mapEdge('cr-advanced-03', 4, 'cr-advanced-03-n6', 'cr-advanced-03-n4'),
          mapEdge('cr-advanced-03', 5, 'cr-advanced-03-n1', 'cr-advanced-03-n5'),
        ],
      },
      testNavigations: [
        testNav('/mission-log', 'Mission Log', 'Navigate to Mission Log (resolved)'),
        testNav('/crew-manifest', 'Crew Manifest', 'Navigate to Crew Manifest (resolved)'),
        testNav('/cargo-manifest', 'Cargo Manifest', 'Navigate to Cargo Manifest (2 resolvers)'),
        testNav('/status', 'Station Status', 'Navigate to Station Status (no resolver)'),
      ],
      targetDestinations: [
        target('cr-advanced-03-n2', 'Mission Log', '/mission-log'),
        target('cr-advanced-03-n3', 'Crew Manifest', '/crew-manifest'),
        target('cr-advanced-03-n4', 'Cargo Manifest', '/cargo-manifest'),
        target('cr-advanced-03-n5', 'Station Status', '/status'),
      ],
    },
  },

  // Level 16 — Redirect Network (Redirect chains)
  {
    levelId: 'cr-advanced-04',
    gameId: 'corridor-runner',
    tier: DifficultyTier.Advanced,
    order: 4,
    title: 'Redirect Network',
    conceptIntroduced: 'Redirect chains',
    description: 'Configure redirect chains to reroute legacy paths to new station modules.',
    data: {
      routeConfig: [
        route('', undefined, { redirectTo: 'main-ops', pathMatch: 'full' }),
        route('main-ops', 'MainOps'),
        route('old-bridge', undefined, { redirectTo: 'main-ops', pathMatch: 'full' }),
        route('legacy-lab', undefined, { redirectTo: 'research', pathMatch: 'full' }),
        route('research', 'ResearchWing'),
        route('old-quarters', undefined, { redirectTo: 'habitat', pathMatch: 'full' }),
        route('habitat', 'HabitatRing'),
        route('teleporter', 'TeleporterPad'),
        route('**', 'DriftZone'),
      ],
      mapLayout: {
        nodes: [
          mapNode('cr-advanced-04', 1, 'Main Hub', 0, 200),
          mapNode('cr-advanced-04', 2, 'Main Ops', 200, 0),
          mapNode('cr-advanced-04', 3, 'Research Wing', 200, 100),
          mapNode('cr-advanced-04', 4, 'Habitat Ring', 200, 200),
          mapNode('cr-advanced-04', 5, 'Teleporter Pad', 200, 300),
          mapNode('cr-advanced-04', 6, 'Drift Zone', 200, 400),
          mapNode('cr-advanced-04', 7, 'Legacy Junction', 100, 100),
          mapNode('cr-advanced-04', 8, 'Transition Hub', 100, 300),
        ],
        edges: [
          mapEdge('cr-advanced-04', 1, 'cr-advanced-04-n1', 'cr-advanced-04-n2'),
          mapEdge('cr-advanced-04', 2, 'cr-advanced-04-n1', 'cr-advanced-04-n7'),
          mapEdge('cr-advanced-04', 3, 'cr-advanced-04-n7', 'cr-advanced-04-n3'),
          mapEdge('cr-advanced-04', 4, 'cr-advanced-04-n1', 'cr-advanced-04-n8'),
          mapEdge('cr-advanced-04', 5, 'cr-advanced-04-n8', 'cr-advanced-04-n4'),
          mapEdge('cr-advanced-04', 6, 'cr-advanced-04-n1', 'cr-advanced-04-n5'),
          mapEdge('cr-advanced-04', 7, 'cr-advanced-04-n1', 'cr-advanced-04-n6'),
        ],
      },
      testNavigations: [
        testNav('/main-ops', 'Main Ops', 'Navigate to Main Ops'),
        testNav('/old-bridge', 'Main Ops', 'Old Bridge redirects to Main Ops'),
        testNav('/legacy-lab', 'Research Wing', 'Legacy Lab redirects to Research Wing'),
        testNav('/research', 'Research Wing', 'Navigate to Research Wing directly'),
        testNav('/habitat', 'Habitat Ring', 'Navigate to Habitat Ring'),
        testNav('/teleporter', 'Teleporter Pad', 'Navigate to Teleporter Pad'),
      ],
      targetDestinations: [
        target('cr-advanced-04-n2', 'Main Ops', '/main-ops'),
        target('cr-advanced-04-n3', 'Research Wing', '/research'),
        target('cr-advanced-04-n4', 'Habitat Ring', '/habitat'),
        target('cr-advanced-04-n5', 'Teleporter Pad', '/teleporter'),
        target('cr-advanced-04-n6', 'Drift Zone', '/**'),
      ],
    },
  },

  // Level 17 — Full Deck System (Complex navigation)
  {
    levelId: 'cr-advanced-05',
    gameId: 'corridor-runner',
    tier: DifficultyTier.Advanced,
    order: 5,
    title: 'Full Deck System',
    conceptIntroduced: 'Complex navigation',
    description: 'Build a complete deck navigation with lazy loading, guards, params, and children.',
    data: {
      routeConfig: [
        route('', undefined, { redirectTo: 'bridge', pathMatch: 'full' }),
        route('bridge', 'Bridge'),
        route('engineering', undefined, { loadComponent: 'EngineeringDeck', canActivate: ['CrewGuard'] }),
        route('science', 'ScienceWing', {
          children: [
            route('', undefined, { redirectTo: 'overview', pathMatch: 'full' }),
            route('overview', 'ScienceOverview'),
            route('project/:projectId', 'ProjectDetail', { resolve: { project: 'ProjectResolver' } }),
          ],
        }),
        route('quarters/:crewId', 'CrewQuarter'),
        route('**', 'VoidScreen'),
      ],
      mapLayout: {
        nodes: [
          mapNode('cr-advanced-05', 1, 'Main Hub', 0, 200),
          mapNode('cr-advanced-05', 2, 'Bridge', 200, 0),
          mapNode('cr-advanced-05', 3, 'Engineering Deck', 200, 100),
          mapNode('cr-advanced-05', 4, 'Science Wing', 200, 200),
          mapNode('cr-advanced-05', 5, 'Science Overview', 400, 150),
          mapNode('cr-advanced-05', 6, 'Project Detail', 400, 250),
          mapNode('cr-advanced-05', 7, 'Crew Quarter', 200, 300),
          mapNode('cr-advanced-05', 8, 'Void Screen', 200, 400),
          mapNode('cr-advanced-05', 9, 'Central Corridor', 100, 200),
          mapNode('cr-advanced-05', 10, 'Security Gate', 100, 100),
        ],
        edges: [
          mapEdge('cr-advanced-05', 1, 'cr-advanced-05-n1', 'cr-advanced-05-n9'),
          mapEdge('cr-advanced-05', 2, 'cr-advanced-05-n9', 'cr-advanced-05-n2'),
          mapEdge('cr-advanced-05', 3, 'cr-advanced-05-n9', 'cr-advanced-05-n10'),
          mapEdge('cr-advanced-05', 4, 'cr-advanced-05-n10', 'cr-advanced-05-n3'),
          mapEdge('cr-advanced-05', 5, 'cr-advanced-05-n9', 'cr-advanced-05-n4'),
          mapEdge('cr-advanced-05', 6, 'cr-advanced-05-n4', 'cr-advanced-05-n5'),
          mapEdge('cr-advanced-05', 7, 'cr-advanced-05-n4', 'cr-advanced-05-n6'),
          mapEdge('cr-advanced-05', 8, 'cr-advanced-05-n1', 'cr-advanced-05-n7'),
          mapEdge('cr-advanced-05', 9, 'cr-advanced-05-n1', 'cr-advanced-05-n8'),
        ],
      },
      testNavigations: [
        testNav('/bridge', 'Bridge', 'Navigate to Bridge'),
        testNav('/engineering', 'Engineering Deck', 'Lazy-load Engineering (guarded)'),
        testNav('/science/overview', 'Science Overview', 'Navigate to Science Overview'),
        testNav('/science/project/warp-drive', 'Project Detail', 'View warp-drive project', { projectId: 'warp-drive' }),
        testNav('/quarters/cpt-nova', 'Crew Quarter', 'View Captain Nova quarters', { crewId: 'cpt-nova' }),
        testNav('/missing-deck', 'Void Screen', 'Unknown path hits Void Screen'),
      ],
      targetDestinations: [
        target('cr-advanced-05-n2', 'Bridge', '/bridge'),
        target('cr-advanced-05-n3', 'Engineering Deck', '/engineering'),
        target('cr-advanced-05-n5', 'Science Overview', '/science/overview'),
        target('cr-advanced-05-n6', 'Project Detail', '/science/project/:projectId'),
        target('cr-advanced-05-n7', 'Crew Quarter', '/quarters/:crewId'),
        target('cr-advanced-05-n8', 'Void Screen', '/**'),
      ],
    },
  },

  // =========================================================================
  // BOSS TIER (Level 18)
  // =========================================================================

  // Level 18 — Station-Wide Navigation (Full station navigation)
  {
    levelId: 'cr-boss-01',
    gameId: 'corridor-runner',
    tier: DifficultyTier.Boss,
    order: 1,
    title: 'Station-Wide Navigation',
    conceptIntroduced: 'Full station navigation',
    description: 'Configure the entire station routing: 3 decks, lazy loading, guards, resolvers, nested routes, and redirects.',
    parTime: 300,
    data: {
      routeConfig: [
        route('', undefined, { redirectTo: 'command-deck/bridge', pathMatch: 'full' }),
        route('command-deck', 'CommandDeck', {
          children: [
            route('bridge', 'Bridge'),
            route('tactical', 'TacticalOps', { canActivate: ['OfficerGuard'] }),
          ],
        }),
        route('science-deck', 'ScienceDeck', {
          children: [
            route('labs', 'ResearchLabs'),
            route('labs/:labId', 'LabDetail', { resolve: { labData: 'LabResolver' } }),
          ],
        }),
        route('engineering-deck', undefined, { loadComponent: 'EngineeringDeck', canActivate: ['EngineerGuard'] }),
        route('crew/:crewId', 'CrewProfile'),
        route('old-nav', undefined, { redirectTo: 'command-deck/bridge', pathMatch: 'full' }),
        route('**', 'SpaceVoid'),
      ],
      mapLayout: {
        nodes: [
          // Deck 1 — Command
          mapNode('cr-boss-01', 1, 'Central Hub', 300, 200, 1),
          mapNode('cr-boss-01', 2, 'Command Deck', 100, 0, 1),
          mapNode('cr-boss-01', 3, 'Bridge', 0, 0, 1),
          mapNode('cr-boss-01', 4, 'Tactical Ops', 200, 0, 1),
          // Deck 2 — Science
          mapNode('cr-boss-01', 5, 'Science Deck', 100, 200, 2),
          mapNode('cr-boss-01', 6, 'Research Labs', 0, 200, 2),
          mapNode('cr-boss-01', 7, 'Lab Detail', 0, 300, 2),
          // Deck 3 — Engineering
          mapNode('cr-boss-01', 8, 'Engineering Deck', 100, 400, 3),
          mapNode('cr-boss-01', 9, 'Crew Profile', 500, 200, 1),
          mapNode('cr-boss-01', 10, 'Space Void', 500, 400, 3),
        ],
        edges: [
          // Command deck connections
          mapEdge('cr-boss-01', 1, 'cr-boss-01-n1', 'cr-boss-01-n2'),
          mapEdge('cr-boss-01', 2, 'cr-boss-01-n2', 'cr-boss-01-n3'),
          mapEdge('cr-boss-01', 3, 'cr-boss-01-n2', 'cr-boss-01-n4'),
          // Science deck connections
          mapEdge('cr-boss-01', 4, 'cr-boss-01-n1', 'cr-boss-01-n5'),
          mapEdge('cr-boss-01', 5, 'cr-boss-01-n5', 'cr-boss-01-n6'),
          mapEdge('cr-boss-01', 6, 'cr-boss-01-n6', 'cr-boss-01-n7'),
          // Engineering deck connections
          mapEdge('cr-boss-01', 7, 'cr-boss-01-n1', 'cr-boss-01-n8'),
          // Cross-deck connections
          mapEdge('cr-boss-01', 8, 'cr-boss-01-n1', 'cr-boss-01-n9'),
          mapEdge('cr-boss-01', 9, 'cr-boss-01-n1', 'cr-boss-01-n10'),
          // Additional corridor connections
          mapEdge('cr-boss-01', 10, 'cr-boss-01-n5', 'cr-boss-01-n8'),
          mapEdge('cr-boss-01', 11, 'cr-boss-01-n2', 'cr-boss-01-n5'),
          mapEdge('cr-boss-01', 12, 'cr-boss-01-n9', 'cr-boss-01-n10'),
        ],
      },
      testNavigations: [
        testNav('/command-deck/bridge', 'Bridge', 'Navigate to Bridge on Command Deck'),
        testNav('/command-deck/tactical', 'Tactical Ops', 'Access Tactical Ops (guarded)'),
        testNav('/science-deck/labs', 'Research Labs', 'Navigate to Research Labs'),
        testNav('/science-deck/labs/xenobiology', 'Lab Detail', 'View Xenobiology lab detail', { labId: 'xenobiology' }),
        testNav('/engineering-deck', 'Engineering Deck', 'Lazy-load Engineering Deck (guarded)'),
        testNav('/crew/cpt-nova', 'Crew Profile', 'View Captain Nova profile', { crewId: 'cpt-nova' }),
        testNav('/old-nav', 'Bridge', 'Legacy path redirects to Bridge'),
        testNav('/wormhole', 'Space Void', 'Unknown path hits Space Void'),
      ],
      targetDestinations: [
        target('cr-boss-01-n3', 'Bridge', '/command-deck/bridge'),
        target('cr-boss-01-n4', 'Tactical Ops', '/command-deck/tactical'),
        target('cr-boss-01-n6', 'Research Labs', '/science-deck/labs'),
        target('cr-boss-01-n7', 'Lab Detail', '/science-deck/labs/:labId'),
        target('cr-boss-01-n8', 'Engineering Deck', '/engineering-deck'),
        target('cr-boss-01-n9', 'Crew Profile', '/crew/:crewId'),
        target('cr-boss-01-n10', 'Space Void', '/**'),
        target('cr-boss-01-n2', 'Command Deck', '/command-deck'),
      ],
    },
  },
];

// ---------------------------------------------------------------------------
// Level Pack
// ---------------------------------------------------------------------------

export const CORRIDOR_RUNNER_LEVEL_PACK: LevelPack = {
  gameId: 'corridor-runner',
  levels: CORRIDOR_RUNNER_LEVELS,
};
