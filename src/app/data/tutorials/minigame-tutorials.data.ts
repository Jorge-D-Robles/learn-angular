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
// Exports
// ---------------------------------------------------------------------------

/** Tutorial data for all P2 minigames. */
export const MINIGAME_TUTORIALS: readonly MinigameTutorialData[] = [
  { gameId: 'module-assembly', steps: MODULE_ASSEMBLY_STEPS },
  { gameId: 'wire-protocol', steps: WIRE_PROTOCOL_STEPS },
  { gameId: 'flow-commander', steps: FLOW_COMMANDER_STEPS },
  { gameId: 'signal-corps', steps: SIGNAL_CORPS_STEPS },
];

/** Look up tutorial data for a specific minigame. */
export function getMinigameTutorial(
  gameId: MinigameId,
): MinigameTutorialData | undefined {
  return MINIGAME_TUTORIALS.find(t => t.gameId === gameId);
}
