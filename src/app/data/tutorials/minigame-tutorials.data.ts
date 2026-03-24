import type { MinigameId } from '../../core/minigame/minigame.types';
import type { TutorialStep } from '../../shared/components/minigame-tutorial/minigame-tutorial.types';

/** Grouped tutorial data for a single minigame. */
export interface MinigameTutorialData {
  readonly gameId: MinigameId;
  readonly steps: readonly TutorialStep[];
}

// ---------------------------------------------------------------------------
// Module Assembly (3 steps)
// ---------------------------------------------------------------------------

const MODULE_ASSEMBLY_STEPS: readonly TutorialStep[] = [
  {
    title: 'Drag Parts to Slots',
    description:
      'Component parts arrive on a conveyor belt. Drag them from the belt into the correct blueprint slots — decorator, selector, template, styles, class body, or imports.',
  },
  {
    title: 'Reject Decoys',
    description:
      'Some parts on the belt are decoys with invalid code. Double-click a part to discard it before it wastes a slot or causes a strike.',
  },
  {
    title: 'Keyboard Shortcuts',
    description:
      'Press number keys 1-6 to select a blueprint slot, then press spacebar to grab the next part from the belt. Use these shortcuts for faster assembly.',
  },
];

// ---------------------------------------------------------------------------
// Wire Protocol (4 steps)
// ---------------------------------------------------------------------------

const WIRE_PROTOCOL_STEPS: readonly TutorialStep[] = [
  {
    title: 'Draw Wires',
    description:
      'Click a source port on the component class (left panel), then click a destination port on the template (right panel) to draw a wire between them.',
  },
  {
    title: 'Select Wire Type',
    description:
      'Choose the correct binding type for each wire: interpolation (blue), property binding (green), event binding (orange), or two-way binding (purple). Press 1-4 to toggle types.',
  },
  {
    title: 'Verify Connections',
    description:
      'Press the Verify button to check all connections. You have 3 verification attempts — fewer verifications earn a higher score.',
  },
  {
    title: 'Remove Wires',
    description:
      'Right-click a wire to remove it. Fix incorrect connections before verifying to avoid wasting attempts.',
  },
];

// ---------------------------------------------------------------------------
// Flow Commander (4 steps)
// ---------------------------------------------------------------------------

const FLOW_COMMANDER_STEPS: readonly TutorialStep[] = [
  {
    title: 'Place Gates',
    description:
      'Drag control flow gates (@if, @for, @switch) from the toolbox onto junction points in the pipeline to control how cargo pods are routed.',
  },
  {
    title: 'Configure Conditions',
    description:
      'Click a placed gate to open its condition editor. Set the filtering or routing logic — for example, an @if gate can filter by item.priority or item.type.',
  },
  {
    title: 'Run and Reset',
    description:
      'Press Run to watch cargo pods flow through your pipeline. If items reach the wrong targets, press Reset to rearrange your gates and try again.',
  },
  {
    title: 'Route Items to Targets',
    description:
      'Each target zone on the right expects specific items. Use gates to filter, duplicate, or branch the flow so every item reaches its correct destination.',
  },
];

// ---------------------------------------------------------------------------
// Signal Corps (4 steps)
// ---------------------------------------------------------------------------

const SIGNAL_CORPS_STEPS: readonly TutorialStep[] = [
  {
    title: 'Configure Towers',
    description:
      'Click a signal tower to open its configuration panel. Each tower is a child component that needs input and output declarations to function.',
  },
  {
    title: 'Declare Inputs and Outputs',
    description:
      'Add input() declarations with a name and type to receive data from the parent. Add output() declarations with an event type to emit events back.',
  },
  {
    title: 'Wire to Parent',
    description:
      'Draw bindings from the parent command center to each tower\'s ports — connect parent properties to tower inputs and parent handlers to tower outputs.',
  },
  {
    title: 'Deploy',
    description:
      'Press Deploy to activate all towers and start the noise wave. Correctly configured towers block noise; misconfigured towers let it through and damage the station.',
  },
];

// ---------------------------------------------------------------------------
// Terminal Hack (4 steps)
// ---------------------------------------------------------------------------

const TERMINAL_HACK_STEPS: readonly TutorialStep[] = [
  {
    title: 'Read the Target Form',
    description:
      'The left panel shows the target form you must rebuild. The right panel shows a live preview of your form taking shape. Match the target layout, fields, and behavior.',
  },
  {
    title: 'Write Form Code',
    description:
      'Use the code editor to write Angular form code — template HTML and component class. Available form tools for each level are shown in the toolbox.',
  },
  {
    title: 'Run Tests',
    description:
      'Press the Test button to run predefined inputs against your form. The timer at the top depletes as you work — if it runs out or you fail more than 3 tests, you lose the level.',
  },
  {
    title: 'Use Hints',
    description:
      'Stuck? Press the Hint button to reveal one form element or validation rule. Hints cost points — avoid them for a perfect score.',
  },
];

// ---------------------------------------------------------------------------
// Power Grid (4 steps)
// ---------------------------------------------------------------------------

const POWER_GRID_STEPS: readonly TutorialStep[] = [
  {
    title: 'Draw Power Lines',
    description:
      'Click a service (power source) on the left, then click a component (consumer) on the right to draw a power line connecting them.',
  },
  {
    title: 'Set Injection Scope',
    description:
      'Right-click a service to change its providedIn scope. Drag a service into a component\'s providers array to make it component-scoped instead of root-scoped.',
  },
  {
    title: 'Activate the Grid',
    description:
      'Press Activate to power up the grid and verify all connections. Correct connections glow; incorrect ones cause short circuits.',
  },
  {
    title: 'Avoid Short Circuits',
    description:
      'Wrong service-to-component wiring or incorrect scoping causes short circuits that damage the grid. Fix wiring before activating.',
  },
];

// ---------------------------------------------------------------------------
// Data Relay (4 steps)
// ---------------------------------------------------------------------------

const DATA_RELAY_STEPS: readonly TutorialStep[] = [
  {
    title: 'Drag Pipes into Streams',
    description:
      'Data streams flow left-to-right. Drag pipe blocks from the toolbox into a stream to transform the raw data as it flows through.',
  },
  {
    title: 'Configure Pipe Parameters',
    description:
      'Click a placed pipe to set its parameters — for example, a date format string for DatePipe or digit info for DecimalPipe.',
  },
  {
    title: 'Chain Multiple Pipes',
    description:
      'Place multiple pipes in sequence to build multi-step transformations. Data transforms at each pipe it passes through.',
  },
  {
    title: 'Run and Compare',
    description:
      'Press Run to send test data through your pipeline. Compare actual output against the target format shown on the right.',
  },
];

// ---------------------------------------------------------------------------
// Reactor Core (4 steps)
// ---------------------------------------------------------------------------

const REACTOR_CORE_STEPS: readonly TutorialStep[] = [
  {
    title: 'Place Signal Nodes',
    description:
      'Drag signal (blue), computed (green), and effect (orange) nodes from the toolbox onto the reactor board. Each node type plays a different role in the reactive circuit.',
  },
  {
    title: 'Wire Dependencies',
    description:
      'Draw edges between nodes to define data flow. Connect signals to computed nodes as inputs, and computed nodes to effects as triggers. Avoid circular dependencies — they cause reactor meltdowns.',
  },
  {
    title: 'Configure Node Logic',
    description:
      'Click a node to configure it. Set initial values on signal nodes, define derivation formulas on computed nodes, and choose side-effect actions on effect nodes.',
  },
  {
    title: 'Simulate and Verify',
    description:
      'Press Simulate to change signal values and watch changes propagate through the graph in real-time. All simulation scenarios must produce correct outputs to complete the level.',
  },
];

// ---------------------------------------------------------------------------
// Deep Space Radio (4 steps)
// ---------------------------------------------------------------------------

const DEEP_SPACE_RADIO_STEPS: readonly TutorialStep[] = [
  {
    title: 'Build Request',
    description:
      'Use the request editor to configure an HTTP request — select a method (GET, POST, PUT, DELETE), enter the URL, and add any headers or body data required by Mission Control.',
  },
  {
    title: 'Add Interceptors',
    description:
      'Drag interceptor blocks from the toolbox into the pipeline. Each interceptor processes the request before transmission — auth adds a token, logging records the call, retry handles failures.',
  },
  {
    title: 'Transmit Data',
    description:
      'Press Transmit to send the request through your interceptor chain. Watch the radio wave pass through each interceptor station and travel to the endpoint.',
  },
  {
    title: 'Read Response',
    description:
      'After transmission, inspect the response in the response viewer. Verify the data matches expectations, handle errors, and apply the correct response type.',
  },
];

// ---------------------------------------------------------------------------
// System Certification (4 steps)
// ---------------------------------------------------------------------------

const SYSTEM_CERTIFICATION_STEPS: readonly TutorialStep[] = [
  {
    title: 'Read Source Code',
    description:
      'The left panel shows the component or service source code under test. Study its properties, methods, and behavior before writing any tests.',
  },
  {
    title: 'Write Tests',
    description:
      'Use the test editor on the right to write unit tests using describe, it, and expect. Each test should verify a specific behavior of the source code.',
  },
  {
    title: 'Check Coverage',
    description:
      'Press Run to execute your tests and view the coverage meter. Toggle the coverage overlay to see which source lines are covered (green) and uncovered (red).',
  },
  {
    title: 'Use Hints',
    description:
      'Stuck on an uncovered code path? Press Hint to highlight it. Hints cost points — avoid them for a perfect score.',
  },
];

// ---------------------------------------------------------------------------
// Blast Doors (4 steps)
// ---------------------------------------------------------------------------

const BLAST_DOORS_STEPS: readonly TutorialStep[] = [
  {
    title: 'Read Timeline',
    description:
      'Each blast door has a lifecycle timeline showing hook slots — ngOnInit, ngOnChanges, ngOnDestroy, and more. Study the timeline to understand when each hook fires.',
  },
  {
    title: 'Place Hook Behaviors',
    description:
      'Drag behavior blocks from the toolbox into the correct lifecycle hook slots on the timeline. Each behavior must run at the right moment in the component lifecycle.',
  },
  {
    title: 'Apply Directives',
    description:
      'For directive challenges, write custom directive logic in the directive editor. Directives add behavior to doors — access control, auto-seal, or emergency override.',
  },
  {
    title: 'Run Simulation',
    description:
      'Press Simulate to run a scenario and watch your doors respond. Correctly programmed doors open and close as expected; misconfigured doors cause security breaches or trap crew.',
  },
];

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

/** Tutorial data for all minigames with tutorial content. */
export const MINIGAME_TUTORIALS: readonly MinigameTutorialData[] = [
  { gameId: 'module-assembly', steps: MODULE_ASSEMBLY_STEPS },
  { gameId: 'wire-protocol', steps: WIRE_PROTOCOL_STEPS },
  { gameId: 'flow-commander', steps: FLOW_COMMANDER_STEPS },
  { gameId: 'signal-corps', steps: SIGNAL_CORPS_STEPS },
  { gameId: 'terminal-hack', steps: TERMINAL_HACK_STEPS },
  { gameId: 'power-grid', steps: POWER_GRID_STEPS },
  { gameId: 'data-relay', steps: DATA_RELAY_STEPS },
  { gameId: 'reactor-core', steps: REACTOR_CORE_STEPS },
  { gameId: 'deep-space-radio', steps: DEEP_SPACE_RADIO_STEPS },
  { gameId: 'system-certification', steps: SYSTEM_CERTIFICATION_STEPS },
  { gameId: 'blast-doors', steps: BLAST_DOORS_STEPS },
];

/** Look up tutorial data for a specific minigame. */
export function getMinigameTutorial(
  gameId: MinigameId,
): MinigameTutorialData | undefined {
  return MINIGAME_TUTORIALS.find(t => t.gameId === gameId);
}
