import { DifficultyTier } from '../../core/minigame/minigame.types';
import type { LevelDefinition, LevelPack } from '../../core/levels/level.types';
import type {
  ReactorCoreLevelData,
  ReactorNode,
  SignalNode,
  ComputedNode,
  EffectNode,
  LinkedSignalNode,
  ToSignalNode,
  ToObservableNode,
  ResourceNode,
  GraphEdge,
  SimulationScenario,
  SignalChange,
  ExpectedOutput,
  GraphConstraint,
  ValidGraph,
  ReactorNodeType,
} from '../../features/minigames/reactor-core/reactor-core.types';

// ---------------------------------------------------------------------------
// Builder helpers (private to this file)
// ---------------------------------------------------------------------------

/** Build a SignalNode. */
function sig(id: string, label: string, initialValue: string | number | boolean): SignalNode {
  return { id, type: 'signal', label, initialValue };
}

/** Build a ComputedNode. */
function comp(id: string, label: string, expr: string, deps: readonly string[]): ComputedNode {
  return { id, type: 'computed', label, computationExpr: expr, dependencyIds: deps };
}

/** Build an EffectNode. */
function eff(
  id: string,
  label: string,
  action: string,
  deps: readonly string[],
  cleanup?: boolean,
): EffectNode {
  const base: EffectNode = { id, type: 'effect', label, actionDescription: action, dependencyIds: deps };
  return cleanup !== undefined ? { ...base, requiresCleanup: cleanup } : base;
}

/** Build a LinkedSignalNode. */
function linked(
  id: string,
  label: string,
  initialValue: string | number | boolean,
  linkedToId: string,
): LinkedSignalNode {
  return { id, type: 'linked-signal', label, initialValue, linkedToId };
}

/** Build a ToSignalNode. */
function toSig(id: string, label: string, sourceDesc: string, deps: readonly string[]): ToSignalNode {
  return { id, type: 'to-signal', label, sourceDescription: sourceDesc, dependencyIds: deps };
}

/** Build a ToObservableNode. */
function toObs(id: string, label: string, deps: readonly string[]): ToObservableNode {
  return { id, type: 'to-observable', label, dependencyIds: deps };
}

/** Build a ResourceNode. */
function resource(id: string, label: string, requestDesc: string, deps: readonly string[]): ResourceNode {
  return { id, type: 'resource', label, requestDescription: requestDesc, dependencyIds: deps };
}

/** Build a GraphEdge. */
function edge(sourceId: string, targetId: string): GraphEdge {
  return { sourceId, targetId };
}

/** Build a SimulationScenario. */
function scenario(
  id: string,
  description: string,
  changes: readonly SignalChange[],
  outputs: readonly ExpectedOutput[],
): SimulationScenario {
  return { id, description, signalChanges: changes, expectedOutputs: outputs };
}

/** Build a SignalChange. */
function change(nodeId: string, newValue: string | number | boolean): SignalChange {
  return { nodeId, newValue };
}

/** Build an ExpectedOutput. */
function expected(
  nodeId: string,
  expectedValue: string | number | boolean,
  expectedState?: 'loading' | 'error' | 'value',
): ExpectedOutput {
  const base: ExpectedOutput = { nodeId, expectedValue };
  return expectedState !== undefined ? { ...base, expectedState } : base;
}

/** Build a GraphConstraint. */
function constraint(
  maxNodes: number,
  requiredTypes: readonly ReactorNodeType[],
  forbidden?: readonly string[],
): GraphConstraint {
  const base: GraphConstraint = { maxNodes, requiredNodeTypes: requiredTypes };
  return forbidden ? { ...base, forbiddenPatterns: forbidden } : base;
}

/** Build a ValidGraph from nodes and edges. */
function graph(nodes: readonly ReactorNode[], edges: readonly GraphEdge[]): ValidGraph {
  return { nodes, edges };
}

// ---------------------------------------------------------------------------
// Level definitions
// ---------------------------------------------------------------------------

export const REACTOR_CORE_LEVELS: readonly LevelDefinition<ReactorCoreLevelData>[] = [
  // =========================================================================
  // BASIC TIER (Levels 1-7)
  // =========================================================================

  // Level 1 — First Signal
  {
    levelId: 'rc-basic-01',
    gameId: 'reactor-core',
    tier: DifficultyTier.Basic,
    order: 1,
    title: 'First Signal',
    conceptIntroduced: 'signal()',
    description: 'Create a writable signal to monitor reactor temperature.',
    data: {
      requiredNodes: [
        sig('rc-b01-s1', 'Temperature', 72),
      ],
      scenarios: [
        scenario('rc-b01-sc1', 'Read initial temperature', [
          change('rc-b01-s1', 72),
        ], [
          expected('rc-b01-s1', 72),
        ]),
      ],
      validGraphs: [
        graph([sig('rc-b01-s1', 'Temperature', 72)], []),
      ],
      constraints: constraint(1, ['signal']),
    },
  },

  // Level 2 — Signal Update
  {
    levelId: 'rc-basic-02',
    gameId: 'reactor-core',
    tier: DifficultyTier.Basic,
    order: 2,
    title: 'Signal Update',
    conceptIntroduced: 'signal.set()',
    description: 'Use signal.set() to update the reactor pressure reading.',
    data: {
      requiredNodes: [
        sig('rc-b02-s1', 'Pressure', 100),
      ],
      scenarios: [
        scenario('rc-b02-sc1', 'Set pressure to 150', [
          change('rc-b02-s1', 150),
        ], [
          expected('rc-b02-s1', 150),
        ]),
        scenario('rc-b02-sc2', 'Set pressure to 80', [
          change('rc-b02-s1', 80),
        ], [
          expected('rc-b02-s1', 80),
        ]),
      ],
      validGraphs: [
        graph([sig('rc-b02-s1', 'Pressure', 100)], []),
      ],
      constraints: constraint(1, ['signal']),
    },
  },

  // Level 3 — Increment Protocol
  {
    levelId: 'rc-basic-03',
    gameId: 'reactor-core',
    tier: DifficultyTier.Basic,
    order: 3,
    title: 'Increment Protocol',
    conceptIntroduced: 'signal.update()',
    description: 'Use signal.update() to increment the fuel counter based on its current value.',
    data: {
      requiredNodes: [
        sig('rc-b03-s1', 'Fuel Level', 50),
      ],
      scenarios: [
        scenario('rc-b03-sc1', 'Increase fuel by 10', [
          change('rc-b03-s1', 60),
        ], [
          expected('rc-b03-s1', 60),
        ]),
        scenario('rc-b03-sc2', 'Decrease fuel by 20', [
          change('rc-b03-s1', 30),
        ], [
          expected('rc-b03-s1', 30),
        ]),
      ],
      validGraphs: [
        graph([sig('rc-b03-s1', 'Fuel Level', 50)], []),
      ],
      constraints: constraint(1, ['signal']),
    },
  },

  // Level 4 — Derived Reading
  {
    levelId: 'rc-basic-04',
    gameId: 'reactor-core',
    tier: DifficultyTier.Basic,
    order: 4,
    title: 'Derived Reading',
    conceptIntroduced: 'computed()',
    description: 'Create a computed signal to derive Fahrenheit from a Celsius temperature signal.',
    data: {
      requiredNodes: [
        sig('rc-b04-s1', 'Temp Celsius', 20),
        comp('rc-b04-c1', 'Temp Fahrenheit', 'celsius * 9/5 + 32', ['rc-b04-s1']),
      ],
      scenarios: [
        scenario('rc-b04-sc1', 'Convert 20C to Fahrenheit', [
          change('rc-b04-s1', 20),
        ], [
          expected('rc-b04-c1', 68),
        ]),
        scenario('rc-b04-sc2', 'Convert 100C to Fahrenheit', [
          change('rc-b04-s1', 100),
        ], [
          expected('rc-b04-c1', 212),
        ]),
      ],
      validGraphs: [
        graph([
          sig('rc-b04-s1', 'Temp Celsius', 20),
          comp('rc-b04-c1', 'Temp Fahrenheit', 'celsius * 9/5 + 32', ['rc-b04-s1']),
        ], [
          edge('rc-b04-s1', 'rc-b04-c1'),
        ]),
      ],
      constraints: constraint(2, ['signal', 'computed']),
    },
  },

  // Level 5 — Multi-Source Monitor
  {
    levelId: 'rc-basic-05',
    gameId: 'reactor-core',
    tier: DifficultyTier.Basic,
    order: 5,
    title: 'Multi-Source Monitor',
    conceptIntroduced: 'computed() from multiple signals',
    description: 'Derive a total power reading from two reactor output signals.',
    data: {
      requiredNodes: [
        sig('rc-b05-s1', 'Output A', 200),
        sig('rc-b05-s2', 'Output B', 300),
        comp('rc-b05-c1', 'Total Power', 'outputA + outputB', ['rc-b05-s1', 'rc-b05-s2']),
      ],
      scenarios: [
        scenario('rc-b05-sc1', 'Change Output A', [
          change('rc-b05-s1', 250),
        ], [
          expected('rc-b05-c1', 550),
        ]),
        scenario('rc-b05-sc2', 'Change Output B', [
          change('rc-b05-s2', 400),
        ], [
          expected('rc-b05-c1', 600),
        ]),
      ],
      validGraphs: [
        graph([
          sig('rc-b05-s1', 'Output A', 200),
          sig('rc-b05-s2', 'Output B', 300),
          comp('rc-b05-c1', 'Total Power', 'outputA + outputB', ['rc-b05-s1', 'rc-b05-s2']),
        ], [
          edge('rc-b05-s1', 'rc-b05-c1'),
          edge('rc-b05-s2', 'rc-b05-c1'),
        ]),
      ],
      constraints: constraint(3, ['signal', 'computed']),
    },
  },

  // Level 6 — Chain Reaction
  {
    levelId: 'rc-basic-06',
    gameId: 'reactor-core',
    tier: DifficultyTier.Basic,
    order: 6,
    title: 'Chain Reaction',
    conceptIntroduced: 'Chained computed',
    description: 'Chain computed signals: raw reading -> calibrated -> display value.',
    data: {
      requiredNodes: [
        sig('rc-b06-s1', 'Raw Reading', 50),
        comp('rc-b06-c1', 'Calibrated', 'raw * 1.1', ['rc-b06-s1']),
        comp('rc-b06-c2', 'Display Value', 'Math.round(calibrated)', ['rc-b06-c1']),
      ],
      scenarios: [
        scenario('rc-b06-sc1', 'Calibrate and display 50', [
          change('rc-b06-s1', 50),
        ], [
          expected('rc-b06-c2', 55),
        ]),
        scenario('rc-b06-sc2', 'Calibrate and display 90', [
          change('rc-b06-s1', 90),
        ], [
          expected('rc-b06-c2', 99),
        ]),
      ],
      validGraphs: [
        graph([
          sig('rc-b06-s1', 'Raw Reading', 50),
          comp('rc-b06-c1', 'Calibrated', 'raw * 1.1', ['rc-b06-s1']),
          comp('rc-b06-c2', 'Display Value', 'Math.round(calibrated)', ['rc-b06-c1']),
        ], [
          edge('rc-b06-s1', 'rc-b06-c1'),
          edge('rc-b06-c1', 'rc-b06-c2'),
        ]),
      ],
      constraints: constraint(3, ['signal', 'computed']),
    },
  },

  // Level 7 — Propagation Trace
  {
    levelId: 'rc-basic-07',
    gameId: 'reactor-core',
    tier: DifficultyTier.Basic,
    order: 7,
    title: 'Propagation Trace',
    conceptIntroduced: 'Reactivity visualization',
    description: 'Trace change propagation through a branching signal graph.',
    data: {
      requiredNodes: [
        sig('rc-b07-s1', 'Sensor Alpha', 10),
        sig('rc-b07-s2', 'Sensor Beta', 20),
        comp('rc-b07-c1', 'Average', '(alpha + beta) / 2', ['rc-b07-s1', 'rc-b07-s2']),
        comp('rc-b07-c2', 'Status', 'average > 25 ? "high" : "normal"', ['rc-b07-c1']),
      ],
      scenarios: [
        scenario('rc-b07-sc1', 'Both sensors low', [
          change('rc-b07-s1', 10),
          change('rc-b07-s2', 20),
        ], [
          expected('rc-b07-c1', 15),
          expected('rc-b07-c2', 'normal'),
        ]),
        scenario('rc-b07-sc2', 'Alpha sensor high', [
          change('rc-b07-s1', 40),
        ], [
          expected('rc-b07-c1', 30),
          expected('rc-b07-c2', 'high'),
        ]),
        scenario('rc-b07-sc3', 'Beta sensor high', [
          change('rc-b07-s2', 50),
        ], [
          expected('rc-b07-c1', 30),
          expected('rc-b07-c2', 'high'),
        ]),
      ],
      validGraphs: [
        graph([
          sig('rc-b07-s1', 'Sensor Alpha', 10),
          sig('rc-b07-s2', 'Sensor Beta', 20),
          comp('rc-b07-c1', 'Average', '(alpha + beta) / 2', ['rc-b07-s1', 'rc-b07-s2']),
          comp('rc-b07-c2', 'Status', 'average > 25 ? "high" : "normal"', ['rc-b07-c1']),
        ], [
          edge('rc-b07-s1', 'rc-b07-c1'),
          edge('rc-b07-s2', 'rc-b07-c1'),
          edge('rc-b07-c1', 'rc-b07-c2'),
        ]),
      ],
      constraints: constraint(4, ['signal', 'computed']),
    },
  },

  // =========================================================================
  // INTERMEDIATE TIER (Levels 8-14)
  // =========================================================================

  // Level 8 — Automated Response
  {
    levelId: 'rc-intermediate-01',
    gameId: 'reactor-core',
    tier: DifficultyTier.Intermediate,
    order: 1,
    title: 'Automated Response',
    conceptIntroduced: 'effect()',
    description: 'Create an effect that triggers an emergency log when temperature exceeds threshold.',
    data: {
      requiredNodes: [
        sig('rc-i01-s1', 'Temperature', 70),
        eff('rc-i01-e1', 'Emergency Log', 'Log alert when temp > 100', ['rc-i01-s1']),
      ],
      scenarios: [
        scenario('rc-i01-sc1', 'Temperature rises above threshold', [
          change('rc-i01-s1', 110),
        ], [
          expected('rc-i01-s1', 110),
        ]),
        scenario('rc-i01-sc2', 'Temperature stays safe', [
          change('rc-i01-s1', 80),
        ], [
          expected('rc-i01-s1', 80),
        ]),
      ],
      validGraphs: [
        graph([
          sig('rc-i01-s1', 'Temperature', 70),
          eff('rc-i01-e1', 'Emergency Log', 'Log alert when temp > 100', ['rc-i01-s1']),
        ], [
          edge('rc-i01-s1', 'rc-i01-e1'),
        ]),
      ],
      constraints: constraint(2, ['signal', 'effect']),
    },
  },

  // Level 9 — Safe Shutdown
  {
    levelId: 'rc-intermediate-02',
    gameId: 'reactor-core',
    tier: DifficultyTier.Intermediate,
    order: 2,
    title: 'Safe Shutdown',
    conceptIntroduced: 'Effect cleanup',
    description: 'Create an effect with cleanup to manage reactor shutdown timers.',
    data: {
      requiredNodes: [
        sig('rc-i02-s1', 'Shutdown Signal', false),
        eff('rc-i02-e1', 'Shutdown Timer', 'Start countdown; cleanup clears interval', ['rc-i02-s1'], true),
      ],
      scenarios: [
        scenario('rc-i02-sc1', 'Initiate shutdown', [
          change('rc-i02-s1', true),
        ], [
          expected('rc-i02-s1', true),
        ]),
        scenario('rc-i02-sc2', 'Cancel shutdown', [
          change('rc-i02-s1', false),
        ], [
          expected('rc-i02-s1', false),
        ]),
      ],
      validGraphs: [
        graph([
          sig('rc-i02-s1', 'Shutdown Signal', false),
          eff('rc-i02-e1', 'Shutdown Timer', 'Start countdown; cleanup clears interval', ['rc-i02-s1'], true),
        ], [
          edge('rc-i02-s1', 'rc-i02-e1'),
        ]),
      ],
      constraints: constraint(2, ['signal', 'effect']),
    },
  },

  // Level 10 — Alert Network
  {
    levelId: 'rc-intermediate-03',
    gameId: 'reactor-core',
    tier: DifficultyTier.Intermediate,
    order: 3,
    title: 'Alert Network',
    conceptIntroduced: 'Multiple effects',
    description: 'Wire multiple effects to a single signal: audible alarm and visual warning.',
    data: {
      requiredNodes: [
        sig('rc-i03-s1', 'Danger Level', 0),
        eff('rc-i03-e1', 'Audible Alarm', 'Sound alarm when danger > 5', ['rc-i03-s1']),
        eff('rc-i03-e2', 'Visual Warning', 'Flash lights when danger > 5', ['rc-i03-s1']),
      ],
      scenarios: [
        scenario('rc-i03-sc1', 'Danger low', [
          change('rc-i03-s1', 3),
        ], [
          expected('rc-i03-s1', 3),
        ]),
        scenario('rc-i03-sc2', 'Danger high', [
          change('rc-i03-s1', 8),
        ], [
          expected('rc-i03-s1', 8),
        ]),
        scenario('rc-i03-sc3', 'Danger critical', [
          change('rc-i03-s1', 10),
        ], [
          expected('rc-i03-s1', 10),
        ]),
      ],
      validGraphs: [
        graph([
          sig('rc-i03-s1', 'Danger Level', 0),
          eff('rc-i03-e1', 'Audible Alarm', 'Sound alarm when danger > 5', ['rc-i03-s1']),
          eff('rc-i03-e2', 'Visual Warning', 'Flash lights when danger > 5', ['rc-i03-s1']),
        ], [
          edge('rc-i03-s1', 'rc-i03-e1'),
          edge('rc-i03-s1', 'rc-i03-e2'),
        ]),
      ],
      constraints: constraint(3, ['signal', 'effect']),
    },
  },

  // Level 11 — Adaptive Sensor
  {
    levelId: 'rc-intermediate-04',
    gameId: 'reactor-core',
    tier: DifficultyTier.Intermediate,
    order: 4,
    title: 'Adaptive Sensor',
    conceptIntroduced: 'Conditional computed',
    description: 'Create a computed that selects between two sensor sources based on a mode signal.',
    data: {
      requiredNodes: [
        sig('rc-i04-s1', 'Sensor Mode', 'primary'),
        sig('rc-i04-s2', 'Primary Reading', 42),
        comp('rc-i04-c1', 'Active Reading', 'mode === "primary" ? primary : backup', ['rc-i04-s1', 'rc-i04-s2']),
      ],
      scenarios: [
        scenario('rc-i04-sc1', 'Primary mode reading', [
          change('rc-i04-s1', 'primary'),
          change('rc-i04-s2', 42),
        ], [
          expected('rc-i04-c1', 42),
        ]),
        scenario('rc-i04-sc2', 'Switch to backup mode', [
          change('rc-i04-s1', 'backup'),
        ], [
          expected('rc-i04-c1', 0),
        ]),
        scenario('rc-i04-sc3', 'Update primary while in primary mode', [
          change('rc-i04-s1', 'primary'),
          change('rc-i04-s2', 99),
        ], [
          expected('rc-i04-c1', 99),
        ]),
      ],
      validGraphs: [
        graph([
          sig('rc-i04-s1', 'Sensor Mode', 'primary'),
          sig('rc-i04-s2', 'Primary Reading', 42),
          comp('rc-i04-c1', 'Active Reading', 'mode === "primary" ? primary : backup', ['rc-i04-s1', 'rc-i04-s2']),
        ], [
          edge('rc-i04-s1', 'rc-i04-c1'),
          edge('rc-i04-s2', 'rc-i04-c1'),
        ]),
      ],
      constraints: constraint(3, ['signal', 'computed']),
    },
  },

  // Level 12 — Linked Controls
  {
    levelId: 'rc-intermediate-05',
    gameId: 'reactor-core',
    tier: DifficultyTier.Intermediate,
    order: 5,
    title: 'Linked Controls',
    conceptIntroduced: 'linkedSignal()',
    description: 'Link two control signals so adjusting one updates the other.',
    data: {
      requiredNodes: [
        sig('rc-i05-s1', 'Master Throttle', 50),
        linked('rc-i05-ls1', 'Slave Throttle', 50, 'rc-i05-s1'),
      ],
      scenarios: [
        scenario('rc-i05-sc1', 'Master changes slave', [
          change('rc-i05-s1', 75),
        ], [
          expected('rc-i05-ls1', 75),
        ]),
        scenario('rc-i05-sc2', 'Master at zero', [
          change('rc-i05-s1', 0),
        ], [
          expected('rc-i05-ls1', 0),
        ]),
      ],
      validGraphs: [
        graph([
          sig('rc-i05-s1', 'Master Throttle', 50),
          linked('rc-i05-ls1', 'Slave Throttle', 50, 'rc-i05-s1'),
        ], [
          edge('rc-i05-s1', 'rc-i05-ls1'),
        ]),
      ],
      constraints: constraint(2, ['signal', 'linked-signal']),
    },
  },

  // Level 13 — Shared Telemetry
  {
    levelId: 'rc-intermediate-06',
    gameId: 'reactor-core',
    tier: DifficultyTier.Intermediate,
    order: 6,
    title: 'Shared Telemetry',
    conceptIntroduced: 'Signal in services',
    description: 'Use shared service signals to broadcast telemetry across multiple reactor modules.',
    data: {
      requiredNodes: [
        sig('rc-i06-s1', 'Telemetry Source', 0),
        sig('rc-i06-s2', 'Module Config', 1),
        comp('rc-i06-c1', 'Adjusted Telemetry', 'source * config', ['rc-i06-s1', 'rc-i06-s2']),
        eff('rc-i06-e1', 'Telemetry Logger', 'Log adjusted telemetry', ['rc-i06-c1']),
      ],
      scenarios: [
        scenario('rc-i06-sc1', 'Initial telemetry', [
          change('rc-i06-s1', 100),
          change('rc-i06-s2', 2),
        ], [
          expected('rc-i06-c1', 200),
        ]),
        scenario('rc-i06-sc2', 'Config change', [
          change('rc-i06-s2', 3),
        ], [
          expected('rc-i06-c1', 300),
        ]),
        scenario('rc-i06-sc3', 'Source change', [
          change('rc-i06-s1', 50),
        ], [
          expected('rc-i06-c1', 150),
        ]),
      ],
      validGraphs: [
        graph([
          sig('rc-i06-s1', 'Telemetry Source', 0),
          sig('rc-i06-s2', 'Module Config', 1),
          comp('rc-i06-c1', 'Adjusted Telemetry', 'source * config', ['rc-i06-s1', 'rc-i06-s2']),
          eff('rc-i06-e1', 'Telemetry Logger', 'Log adjusted telemetry', ['rc-i06-c1']),
        ], [
          edge('rc-i06-s1', 'rc-i06-c1'),
          edge('rc-i06-s2', 'rc-i06-c1'),
          edge('rc-i06-c1', 'rc-i06-e1'),
        ]),
      ],
      constraints: constraint(4, ['signal', 'computed', 'effect']),
    },
  },

  // Level 14 — Mixed Circuit
  {
    levelId: 'rc-intermediate-07',
    gameId: 'reactor-core',
    tier: DifficultyTier.Intermediate,
    order: 7,
    title: 'Mixed Circuit',
    conceptIntroduced: 'Mixed challenge',
    description: 'Build a full reactive circuit with signals, computed values, and effects.',
    data: {
      requiredNodes: [
        sig('rc-i07-s1', 'Reactor Temp', 70),
        sig('rc-i07-s2', 'Coolant Flow', 50),
        comp('rc-i07-c1', 'Heat Index', 'temp - coolant * 0.5', ['rc-i07-s1', 'rc-i07-s2']),
        comp('rc-i07-c2', 'Safety Rating', 'heatIndex < 50 ? "safe" : "warning"', ['rc-i07-c1']),
        eff('rc-i07-e1', 'Dashboard Update', 'Refresh dashboard display', ['rc-i07-c2']),
        eff('rc-i07-e2', 'Alert System', 'Trigger alert if warning', ['rc-i07-c2']),
      ],
      scenarios: [
        scenario('rc-i07-sc1', 'Normal operation', [
          change('rc-i07-s1', 70),
          change('rc-i07-s2', 50),
        ], [
          expected('rc-i07-c1', 45),
          expected('rc-i07-c2', 'safe'),
        ]),
        scenario('rc-i07-sc2', 'Temperature spike', [
          change('rc-i07-s1', 120),
        ], [
          expected('rc-i07-c1', 95),
          expected('rc-i07-c2', 'warning'),
        ]),
        scenario('rc-i07-sc3', 'Increase coolant', [
          change('rc-i07-s2', 100),
        ], [
          expected('rc-i07-c1', 70),
          expected('rc-i07-c2', 'warning'),
        ]),
      ],
      validGraphs: [
        graph([
          sig('rc-i07-s1', 'Reactor Temp', 70),
          sig('rc-i07-s2', 'Coolant Flow', 50),
          comp('rc-i07-c1', 'Heat Index', 'temp - coolant * 0.5', ['rc-i07-s1', 'rc-i07-s2']),
          comp('rc-i07-c2', 'Safety Rating', 'heatIndex < 50 ? "safe" : "warning"', ['rc-i07-c1']),
          eff('rc-i07-e1', 'Dashboard Update', 'Refresh dashboard display', ['rc-i07-c2']),
          eff('rc-i07-e2', 'Alert System', 'Trigger alert if warning', ['rc-i07-c2']),
        ], [
          edge('rc-i07-s1', 'rc-i07-c1'),
          edge('rc-i07-s2', 'rc-i07-c1'),
          edge('rc-i07-c1', 'rc-i07-c2'),
          edge('rc-i07-c2', 'rc-i07-e1'),
          edge('rc-i07-c2', 'rc-i07-e2'),
        ]),
      ],
      constraints: constraint(6, ['signal', 'computed', 'effect']),
    },
  },

  // =========================================================================
  // ADVANCED TIER (Levels 15-20)
  // =========================================================================

  // Level 15 — Observable Bridge
  {
    levelId: 'rc-advanced-01',
    gameId: 'reactor-core',
    tier: DifficultyTier.Advanced,
    order: 1,
    title: 'Observable Bridge',
    conceptIntroduced: 'toSignal()',
    description: 'Convert an external observable data feed into a signal for the reactor graph.',
    data: {
      requiredNodes: [
        sig('rc-a01-s1', 'Manual Override', false),
        toSig('rc-a01-ts1', 'External Feed', 'HTTP polling observable', ['rc-a01-s1']),
        comp('rc-a01-c1', 'Combined Status', 'override || feed', ['rc-a01-s1', 'rc-a01-ts1']),
      ],
      scenarios: [
        scenario('rc-a01-sc1', 'Feed active, no override', [
          change('rc-a01-s1', false),
        ], [
          expected('rc-a01-c1', true),
        ]),
        scenario('rc-a01-sc2', 'Manual override engaged', [
          change('rc-a01-s1', true),
        ], [
          expected('rc-a01-c1', true),
        ]),
      ],
      validGraphs: [
        graph([
          sig('rc-a01-s1', 'Manual Override', false),
          toSig('rc-a01-ts1', 'External Feed', 'HTTP polling observable', ['rc-a01-s1']),
          comp('rc-a01-c1', 'Combined Status', 'override || feed', ['rc-a01-s1', 'rc-a01-ts1']),
        ], [
          edge('rc-a01-s1', 'rc-a01-ts1'),
          edge('rc-a01-s1', 'rc-a01-c1'),
          edge('rc-a01-ts1', 'rc-a01-c1'),
        ]),
      ],
      constraints: constraint(3, ['signal', 'to-signal', 'computed']),
    },
  },

  // Level 16 — Signal Broadcast
  {
    levelId: 'rc-advanced-02',
    gameId: 'reactor-core',
    tier: DifficultyTier.Advanced,
    order: 2,
    title: 'Signal Broadcast',
    conceptIntroduced: 'toObservable()',
    description: 'Convert a signal to an observable for legacy subsystem consumption.',
    data: {
      requiredNodes: [
        sig('rc-a02-s1', 'Core Status', 'nominal'),
        comp('rc-a02-c1', 'Status Code', 'status === "nominal" ? 0 : 1', ['rc-a02-s1']),
        toObs('rc-a02-to1', 'Legacy Broadcast', ['rc-a02-c1']),
      ],
      scenarios: [
        scenario('rc-a02-sc1', 'Nominal status broadcast', [
          change('rc-a02-s1', 'nominal'),
        ], [
          expected('rc-a02-c1', 0),
        ]),
        scenario('rc-a02-sc2', 'Alert status broadcast', [
          change('rc-a02-s1', 'alert'),
        ], [
          expected('rc-a02-c1', 1),
        ]),
      ],
      validGraphs: [
        graph([
          sig('rc-a02-s1', 'Core Status', 'nominal'),
          comp('rc-a02-c1', 'Status Code', 'status === "nominal" ? 0 : 1', ['rc-a02-s1']),
          toObs('rc-a02-to1', 'Legacy Broadcast', ['rc-a02-c1']),
        ], [
          edge('rc-a02-s1', 'rc-a02-c1'),
          edge('rc-a02-c1', 'rc-a02-to1'),
        ]),
      ],
      constraints: constraint(3, ['signal', 'computed', 'to-observable']),
    },
  },

  // Level 17 — Async Reactor Feed
  {
    levelId: 'rc-advanced-03',
    gameId: 'reactor-core',
    tier: DifficultyTier.Advanced,
    order: 3,
    title: 'Async Reactor Feed',
    conceptIntroduced: 'Resource signals',
    description: 'Use resource signals to load reactor diagnostic data asynchronously.',
    data: {
      requiredNodes: [
        sig('rc-a03-s1', 'Reactor ID', 1),
        resource('rc-a03-r1', 'Diagnostics', 'GET /api/reactors/{id}/diagnostics', ['rc-a03-s1']),
        comp('rc-a03-c1', 'Health Score', 'diagnostics.score', ['rc-a03-r1']),
        eff('rc-a03-e1', 'Status Display', 'Update UI with health score', ['rc-a03-c1']),
      ],
      scenarios: [
        scenario('rc-a03-sc1', 'Load diagnostics for reactor 1', [
          change('rc-a03-s1', 1),
        ], [
          expected('rc-a03-r1', 95, 'value'),
        ]),
        scenario('rc-a03-sc2', 'Switch to reactor 2', [
          change('rc-a03-s1', 2),
        ], [
          expected('rc-a03-r1', 87, 'value'),
        ]),
        scenario('rc-a03-sc3', 'Loading state during fetch', [
          change('rc-a03-s1', 3),
        ], [
          expected('rc-a03-r1', 0, 'loading'),
        ]),
      ],
      validGraphs: [
        graph([
          sig('rc-a03-s1', 'Reactor ID', 1),
          resource('rc-a03-r1', 'Diagnostics', 'GET /api/reactors/{id}/diagnostics', ['rc-a03-s1']),
          comp('rc-a03-c1', 'Health Score', 'diagnostics.score', ['rc-a03-r1']),
          eff('rc-a03-e1', 'Status Display', 'Update UI with health score', ['rc-a03-c1']),
        ], [
          edge('rc-a03-s1', 'rc-a03-r1'),
          edge('rc-a03-r1', 'rc-a03-c1'),
          edge('rc-a03-c1', 'rc-a03-e1'),
        ]),
      ],
      constraints: constraint(4, ['signal', 'resource', 'computed', 'effect']),
    },
  },

  // Level 18 — Complex Network
  {
    levelId: 'rc-advanced-04',
    gameId: 'reactor-core',
    tier: DifficultyTier.Advanced,
    order: 4,
    title: 'Complex Network',
    conceptIntroduced: 'Complex graphs (10+ nodes)',
    description: 'Design a complex signal network with branching and merging paths for reactor monitoring.',
    data: {
      requiredNodes: [
        sig('rc-a04-s1', 'Core Temp', 200),
        sig('rc-a04-s2', 'Pressure', 50),
        sig('rc-a04-s3', 'Coolant Level', 80),
        sig('rc-a04-s4', 'Radiation', 5),
        comp('rc-a04-c1', 'Thermal Index', 'temp * pressure / 100', ['rc-a04-s1', 'rc-a04-s2']),
        comp('rc-a04-c2', 'Coolant Efficiency', 'coolant / temp * 100', ['rc-a04-s3', 'rc-a04-s1']),
        comp('rc-a04-c3', 'Safety Score', 'thermal < 150 && efficiency > 30 ? "safe" : "risk"', ['rc-a04-c1', 'rc-a04-c2']),
        comp('rc-a04-c4', 'Radiation Status', 'radiation < 10 ? "normal" : "elevated"', ['rc-a04-s4']),
        eff('rc-a04-e1', 'Safety Monitor', 'Update safety dashboard', ['rc-a04-c3']),
        eff('rc-a04-e2', 'Radiation Alert', 'Trigger radiation alarm', ['rc-a04-c4']),
        eff('rc-a04-e3', 'Master Logger', 'Log all readings', ['rc-a04-c3', 'rc-a04-c4']),
      ],
      scenarios: [
        scenario('rc-a04-sc1', 'Normal operation', [
          change('rc-a04-s1', 200),
          change('rc-a04-s2', 50),
          change('rc-a04-s3', 80),
          change('rc-a04-s4', 5),
        ], [
          expected('rc-a04-c1', 100),
          expected('rc-a04-c3', 'safe'),
          expected('rc-a04-c4', 'normal'),
        ]),
        scenario('rc-a04-sc2', 'Temperature spike', [
          change('rc-a04-s1', 400),
        ], [
          expected('rc-a04-c1', 200),
          expected('rc-a04-c3', 'risk'),
        ]),
        scenario('rc-a04-sc3', 'Radiation spike', [
          change('rc-a04-s4', 15),
        ], [
          expected('rc-a04-c4', 'elevated'),
        ]),
        scenario('rc-a04-sc4', 'Coolant drop', [
          change('rc-a04-s3', 20),
        ], [
          expected('rc-a04-c2', 10),
        ]),
      ],
      validGraphs: [
        graph([
          sig('rc-a04-s1', 'Core Temp', 200),
          sig('rc-a04-s2', 'Pressure', 50),
          sig('rc-a04-s3', 'Coolant Level', 80),
          sig('rc-a04-s4', 'Radiation', 5),
          comp('rc-a04-c1', 'Thermal Index', 'temp * pressure / 100', ['rc-a04-s1', 'rc-a04-s2']),
          comp('rc-a04-c2', 'Coolant Efficiency', 'coolant / temp * 100', ['rc-a04-s3', 'rc-a04-s1']),
          comp('rc-a04-c3', 'Safety Score', 'thermal < 150 && efficiency > 30 ? "safe" : "risk"', ['rc-a04-c1', 'rc-a04-c2']),
          comp('rc-a04-c4', 'Radiation Status', 'radiation < 10 ? "normal" : "elevated"', ['rc-a04-s4']),
          eff('rc-a04-e1', 'Safety Monitor', 'Update safety dashboard', ['rc-a04-c3']),
          eff('rc-a04-e2', 'Radiation Alert', 'Trigger radiation alarm', ['rc-a04-c4']),
          eff('rc-a04-e3', 'Master Logger', 'Log all readings', ['rc-a04-c3', 'rc-a04-c4']),
        ], [
          edge('rc-a04-s1', 'rc-a04-c1'),
          edge('rc-a04-s2', 'rc-a04-c1'),
          edge('rc-a04-s3', 'rc-a04-c2'),
          edge('rc-a04-s1', 'rc-a04-c2'),
          edge('rc-a04-c1', 'rc-a04-c3'),
          edge('rc-a04-c2', 'rc-a04-c3'),
          edge('rc-a04-s4', 'rc-a04-c4'),
          edge('rc-a04-c3', 'rc-a04-e1'),
          edge('rc-a04-c4', 'rc-a04-e2'),
          edge('rc-a04-c3', 'rc-a04-e3'),
          edge('rc-a04-c4', 'rc-a04-e3'),
        ]),
      ],
      constraints: constraint(11, ['signal', 'computed', 'effect']),
    },
  },

  // Level 19 — Efficiency Audit
  {
    levelId: 'rc-advanced-05',
    gameId: 'reactor-core',
    tier: DifficultyTier.Advanced,
    order: 5,
    title: 'Efficiency Audit',
    conceptIntroduced: 'Performance optimization',
    description: 'Minimize recomputations by smart wiring of signal dependencies.',
    data: {
      requiredNodes: [
        sig('rc-a05-s1', 'Input Alpha', 10),
        sig('rc-a05-s2', 'Input Beta', 20),
        sig('rc-a05-s3', 'Input Gamma', 30),
        comp('rc-a05-c1', 'Sum AB', 'alpha + beta', ['rc-a05-s1', 'rc-a05-s2']),
        comp('rc-a05-c2', 'Sum BC', 'beta + gamma', ['rc-a05-s2', 'rc-a05-s3']),
        comp('rc-a05-c3', 'Max Sums', 'Math.max(sumAB, sumBC)', ['rc-a05-c1', 'rc-a05-c2']),
        comp('rc-a05-c4', 'Final Output', 'maxSums * 2', ['rc-a05-c3']),
        eff('rc-a05-e1', 'Result Logger', 'Log final output', ['rc-a05-c4']),
        eff('rc-a05-e2', 'Audit Trail', 'Record computation path', ['rc-a05-c3']),
      ],
      scenarios: [
        scenario('rc-a05-sc1', 'Initial state', [
          change('rc-a05-s1', 10),
          change('rc-a05-s2', 20),
          change('rc-a05-s3', 30),
        ], [
          expected('rc-a05-c1', 30),
          expected('rc-a05-c2', 50),
          expected('rc-a05-c3', 50),
          expected('rc-a05-c4', 100),
        ]),
        scenario('rc-a05-sc2', 'Change alpha only', [
          change('rc-a05-s1', 40),
        ], [
          expected('rc-a05-c1', 60),
          expected('rc-a05-c3', 60),
        ]),
        scenario('rc-a05-sc3', 'Change gamma only', [
          change('rc-a05-s3', 50),
        ], [
          expected('rc-a05-c2', 70),
          expected('rc-a05-c3', 70),
        ]),
        scenario('rc-a05-sc4', 'Change beta affects both', [
          change('rc-a05-s2', 100),
        ], [
          expected('rc-a05-c1', 110),
          expected('rc-a05-c2', 130),
          expected('rc-a05-c3', 130),
        ]),
      ],
      validGraphs: [
        graph([
          sig('rc-a05-s1', 'Input Alpha', 10),
          sig('rc-a05-s2', 'Input Beta', 20),
          sig('rc-a05-s3', 'Input Gamma', 30),
          comp('rc-a05-c1', 'Sum AB', 'alpha + beta', ['rc-a05-s1', 'rc-a05-s2']),
          comp('rc-a05-c2', 'Sum BC', 'beta + gamma', ['rc-a05-s2', 'rc-a05-s3']),
          comp('rc-a05-c3', 'Max Sums', 'Math.max(sumAB, sumBC)', ['rc-a05-c1', 'rc-a05-c2']),
          comp('rc-a05-c4', 'Final Output', 'maxSums * 2', ['rc-a05-c3']),
          eff('rc-a05-e1', 'Result Logger', 'Log final output', ['rc-a05-c4']),
          eff('rc-a05-e2', 'Audit Trail', 'Record computation path', ['rc-a05-c3']),
        ], [
          edge('rc-a05-s1', 'rc-a05-c1'),
          edge('rc-a05-s2', 'rc-a05-c1'),
          edge('rc-a05-s2', 'rc-a05-c2'),
          edge('rc-a05-s3', 'rc-a05-c2'),
          edge('rc-a05-c1', 'rc-a05-c3'),
          edge('rc-a05-c2', 'rc-a05-c3'),
          edge('rc-a05-c3', 'rc-a05-c4'),
          edge('rc-a05-c4', 'rc-a05-e1'),
          edge('rc-a05-c3', 'rc-a05-e2'),
        ]),
      ],
      constraints: constraint(9, ['signal', 'computed', 'effect'], ['unnecessary-recomputation']),
    },
  },

  // Level 20 — Reactor Blueprint
  {
    levelId: 'rc-advanced-06',
    gameId: 'reactor-core',
    tier: DifficultyTier.Advanced,
    order: 6,
    title: 'Reactor Blueprint',
    conceptIntroduced: 'Design challenge',
    description: 'Design a full signal graph from requirements: sensor inputs, derived metrics, and automated responses.',
    data: {
      requiredNodes: [
        sig('rc-a06-s1', 'Voltage', 220),
        sig('rc-a06-s2', 'Current', 10),
        sig('rc-a06-s3', 'Resistance', 22),
        comp('rc-a06-c1', 'Power', 'voltage * current', ['rc-a06-s1', 'rc-a06-s2']),
        comp('rc-a06-c2', 'Expected Current', 'voltage / resistance', ['rc-a06-s1', 'rc-a06-s3']),
        comp('rc-a06-c3', 'Current Delta', 'Math.abs(actual - expected)', ['rc-a06-s2', 'rc-a06-c2']),
        eff('rc-a06-e1', 'Power Meter', 'Display power reading', ['rc-a06-c1']),
        eff('rc-a06-e2', 'Anomaly Detector', 'Alert if delta > 2', ['rc-a06-c3']),
      ],
      scenarios: [
        scenario('rc-a06-sc1', 'Normal operation (Ohm law holds)', [
          change('rc-a06-s1', 220),
          change('rc-a06-s2', 10),
          change('rc-a06-s3', 22),
        ], [
          expected('rc-a06-c1', 2200),
          expected('rc-a06-c2', 10),
          expected('rc-a06-c3', 0),
        ]),
        scenario('rc-a06-sc2', 'Current anomaly', [
          change('rc-a06-s2', 15),
        ], [
          expected('rc-a06-c3', 5),
        ]),
        scenario('rc-a06-sc3', 'Voltage change', [
          change('rc-a06-s1', 110),
        ], [
          expected('rc-a06-c1', 1100),
          expected('rc-a06-c2', 5),
        ]),
        scenario('rc-a06-sc4', 'Resistance change', [
          change('rc-a06-s3', 11),
        ], [
          expected('rc-a06-c2', 20),
        ]),
      ],
      validGraphs: [
        graph([
          sig('rc-a06-s1', 'Voltage', 220),
          sig('rc-a06-s2', 'Current', 10),
          sig('rc-a06-s3', 'Resistance', 22),
          comp('rc-a06-c1', 'Power', 'voltage * current', ['rc-a06-s1', 'rc-a06-s2']),
          comp('rc-a06-c2', 'Expected Current', 'voltage / resistance', ['rc-a06-s1', 'rc-a06-s3']),
          comp('rc-a06-c3', 'Current Delta', 'Math.abs(actual - expected)', ['rc-a06-s2', 'rc-a06-c2']),
          eff('rc-a06-e1', 'Power Meter', 'Display power reading', ['rc-a06-c1']),
          eff('rc-a06-e2', 'Anomaly Detector', 'Alert if delta > 2', ['rc-a06-c3']),
        ], [
          edge('rc-a06-s1', 'rc-a06-c1'),
          edge('rc-a06-s2', 'rc-a06-c1'),
          edge('rc-a06-s1', 'rc-a06-c2'),
          edge('rc-a06-s3', 'rc-a06-c2'),
          edge('rc-a06-s2', 'rc-a06-c3'),
          edge('rc-a06-c2', 'rc-a06-c3'),
          edge('rc-a06-c1', 'rc-a06-e1'),
          edge('rc-a06-c3', 'rc-a06-e2'),
        ]),
      ],
      constraints: constraint(8, ['signal', 'computed', 'effect']),
    },
  },

  // =========================================================================
  // BOSS TIER (Level 21)
  // =========================================================================

  // Level 21 — Reactor Redesign
  {
    levelId: 'rc-boss-01',
    gameId: 'reactor-core',
    tier: DifficultyTier.Boss,
    order: 1,
    title: 'Reactor Redesign',
    conceptIntroduced: 'Complete signal architecture',
    description: 'Design the complete reactor monitoring system: temperature signals, pressure computed values, threshold effects, linked control signals, and observable bridges.',
    parTime: 300,
    data: {
      requiredNodes: [
        // 6 signals
        sig('rc-boss-s1', 'Core Temperature', 200),
        sig('rc-boss-s2', 'Core Pressure', 100),
        sig('rc-boss-s3', 'Coolant Flow Rate', 75),
        sig('rc-boss-s4', 'Radiation Level', 3),
        sig('rc-boss-s5', 'Control Rod Position', 50),
        sig('rc-boss-s6', 'Emergency Mode', false),
        // 5 computed
        comp('rc-boss-c1', 'Thermal Output', 'temp * pressure / 200', ['rc-boss-s1', 'rc-boss-s2']),
        comp('rc-boss-c2', 'Cooling Efficiency', 'coolant / temp * 100', ['rc-boss-s3', 'rc-boss-s1']),
        comp('rc-boss-c3', 'Safety Index', '(efficiency + (100 - radiation * 10)) / 2', ['rc-boss-c2', 'rc-boss-s4']),
        comp('rc-boss-c4', 'Power Output', 'thermal * (controlRod / 100)', ['rc-boss-c1', 'rc-boss-s5']),
        comp('rc-boss-c5', 'System Status', 'emergency ? "shutdown" : safety > 50 ? "nominal" : "warning"', ['rc-boss-s6', 'rc-boss-c3']),
        // 4 effects
        eff('rc-boss-e1', 'Temperature Monitor', 'Display real-time temperature graph', ['rc-boss-s1', 'rc-boss-c1']),
        eff('rc-boss-e2', 'Safety Alert', 'Trigger alarms when safety < 30', ['rc-boss-c3']),
        eff('rc-boss-e3', 'Power Meter', 'Update power output display', ['rc-boss-c4']),
        eff('rc-boss-e4', 'Emergency Protocol', 'Initiate emergency shutdown sequence', ['rc-boss-c5'], true),
      ],
      scenarios: [
        scenario('rc-boss-sc01', 'Nominal operation', [
          change('rc-boss-s1', 200),
          change('rc-boss-s2', 100),
          change('rc-boss-s3', 75),
          change('rc-boss-s4', 3),
          change('rc-boss-s5', 50),
          change('rc-boss-s6', false),
        ], [
          expected('rc-boss-c1', 100),
          expected('rc-boss-c4', 50),
          expected('rc-boss-c5', 'nominal'),
        ]),
        scenario('rc-boss-sc02', 'Temperature spike', [
          change('rc-boss-s1', 400),
        ], [
          expected('rc-boss-c1', 200),
          expected('rc-boss-c2', 18.75),
        ]),
        scenario('rc-boss-sc03', 'Pressure drop', [
          change('rc-boss-s2', 50),
        ], [
          expected('rc-boss-c1', 50),
          expected('rc-boss-c4', 25),
        ]),
        scenario('rc-boss-sc04', 'Coolant failure', [
          change('rc-boss-s3', 10),
        ], [
          expected('rc-boss-c2', 5),
          expected('rc-boss-c3', 37.5),
        ]),
        scenario('rc-boss-sc05', 'Radiation surge', [
          change('rc-boss-s4', 9),
        ], [
          expected('rc-boss-c3', 22.5),
          expected('rc-boss-c5', 'warning'),
        ]),
        scenario('rc-boss-sc06', 'Control rod withdrawal', [
          change('rc-boss-s5', 100),
        ], [
          expected('rc-boss-c4', 100),
        ]),
        scenario('rc-boss-sc07', 'Emergency activation', [
          change('rc-boss-s6', true),
        ], [
          expected('rc-boss-c5', 'shutdown'),
        ]),
        scenario('rc-boss-sc08', 'Recovery sequence', [
          change('rc-boss-s6', false),
          change('rc-boss-s3', 90),
        ], [
          expected('rc-boss-c5', 'nominal'),
          expected('rc-boss-c2', 45),
        ]),
        scenario('rc-boss-sc09', 'Multiple simultaneous changes', [
          change('rc-boss-s1', 300),
          change('rc-boss-s2', 120),
        ], [
          expected('rc-boss-c1', 180),
          expected('rc-boss-c4', 90),
        ]),
        scenario('rc-boss-sc10', 'Full system stress', [
          change('rc-boss-s1', 350),
          change('rc-boss-s3', 30),
          change('rc-boss-s4', 8),
        ], [
          expected('rc-boss-c2', 8.57),
          expected('rc-boss-c3', 14.285),
        ]),
      ],
      validGraphs: [
        graph([
          sig('rc-boss-s1', 'Core Temperature', 200),
          sig('rc-boss-s2', 'Core Pressure', 100),
          sig('rc-boss-s3', 'Coolant Flow Rate', 75),
          sig('rc-boss-s4', 'Radiation Level', 3),
          sig('rc-boss-s5', 'Control Rod Position', 50),
          sig('rc-boss-s6', 'Emergency Mode', false),
          comp('rc-boss-c1', 'Thermal Output', 'temp * pressure / 200', ['rc-boss-s1', 'rc-boss-s2']),
          comp('rc-boss-c2', 'Cooling Efficiency', 'coolant / temp * 100', ['rc-boss-s3', 'rc-boss-s1']),
          comp('rc-boss-c3', 'Safety Index', '(efficiency + (100 - radiation * 10)) / 2', ['rc-boss-c2', 'rc-boss-s4']),
          comp('rc-boss-c4', 'Power Output', 'thermal * (controlRod / 100)', ['rc-boss-c1', 'rc-boss-s5']),
          comp('rc-boss-c5', 'System Status', 'emergency ? "shutdown" : safety > 50 ? "nominal" : "warning"', ['rc-boss-s6', 'rc-boss-c3']),
          eff('rc-boss-e1', 'Temperature Monitor', 'Display real-time temperature graph', ['rc-boss-s1', 'rc-boss-c1']),
          eff('rc-boss-e2', 'Safety Alert', 'Trigger alarms when safety < 30', ['rc-boss-c3']),
          eff('rc-boss-e3', 'Power Meter', 'Update power output display', ['rc-boss-c4']),
          eff('rc-boss-e4', 'Emergency Protocol', 'Initiate emergency shutdown sequence', ['rc-boss-c5'], true),
        ], [
          edge('rc-boss-s1', 'rc-boss-c1'),
          edge('rc-boss-s2', 'rc-boss-c1'),
          edge('rc-boss-s3', 'rc-boss-c2'),
          edge('rc-boss-s1', 'rc-boss-c2'),
          edge('rc-boss-c2', 'rc-boss-c3'),
          edge('rc-boss-s4', 'rc-boss-c3'),
          edge('rc-boss-c1', 'rc-boss-c4'),
          edge('rc-boss-s5', 'rc-boss-c4'),
          edge('rc-boss-s6', 'rc-boss-c5'),
          edge('rc-boss-c3', 'rc-boss-c5'),
          edge('rc-boss-s1', 'rc-boss-e1'),
          edge('rc-boss-c1', 'rc-boss-e1'),
          edge('rc-boss-c3', 'rc-boss-e2'),
          edge('rc-boss-c4', 'rc-boss-e3'),
          edge('rc-boss-c5', 'rc-boss-e4'),
        ]),
      ],
      constraints: constraint(15, ['signal', 'computed', 'effect']),
    },
  },
];

// ---------------------------------------------------------------------------
// Level pack
// ---------------------------------------------------------------------------

export const REACTOR_CORE_LEVEL_PACK: LevelPack = {
  gameId: 'reactor-core',
  levels: REACTOR_CORE_LEVELS,
};
