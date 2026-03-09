import {
  Component,
  type ElementRef,
  OnDestroy,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { MINIGAME_ENGINE } from '../../../core/minigame/minigame-engine.tokens';
import { KeyboardShortcutService } from '../../../core/minigame/keyboard-shortcut.service';
import { DifficultyTier } from '../../../core/minigame/minigame.types';
import { GateType, GATE_TYPE_COLORS } from './pipeline.types';
import { FlowCommanderEngine, type PlacedGate, type SimulationResult } from './flow-commander.engine';
import { FlowCommanderGateConfigComponent } from './gate-config/gate-config';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VIEWBOX_WIDTH = 1000;
const VIEWBOX_HEIGHT = 600;
const NODE_RADIUS = 20;
const CARGO_POD_SIZE = 16;
const ANIMATION_STEP_MS = 400;
const RESULT_DISPLAY_MS = 2000;

const GATE_TYPE_OPTIONS = [
  { type: GateType.if,     label: '@if',     color: GATE_TYPE_COLORS[GateType.if],     key: '1' },
  { type: GateType.for,    label: '@for',    color: GATE_TYPE_COLORS[GateType.for],    key: '2' },
  { type: GateType.switch, label: '@switch', color: GATE_TYPE_COLORS[GateType.switch], key: '3' },
];

// ---------------------------------------------------------------------------
// Animating cargo interface
// ---------------------------------------------------------------------------

interface AnimatingCargo {
  readonly item: { id: string; color: string; label: string };
  readonly waypoints: readonly { x: number; y: number }[];
  readonly currentSegment: number;
  readonly correct: boolean;
  readonly animationComplete: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

@Component({
  selector: 'app-flow-commander',
  imports: [FlowCommanderGateConfigComponent],
  templateUrl: './flow-commander.component.html',
  styleUrl: './flow-commander.component.scss',
})
export class FlowCommanderComponent implements OnDestroy {
  private readonly engine = inject(MINIGAME_ENGINE, { optional: true }) as FlowCommanderEngine | null;
  private readonly shortcuts = inject(KeyboardShortcutService);

  readonly svgRef = viewChild<ElementRef<SVGSVGElement>>('pipelineSvg');

  // Local state
  readonly selectedGateType = signal<GateType>(GateType.if);
  readonly editingGateId = signal<string | null>(null);
  readonly animatingItems = signal<readonly AnimatingCargo[]>([]);
  readonly simulationDone = signal<SimulationResult | null>(null);
  private readonly pendingTimers: ReturnType<typeof setTimeout>[] = [];

  // Template-accessible constants
  readonly gateTypeOptions = GATE_TYPE_OPTIONS;
  readonly viewBox = `0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`;
  readonly nodeRadius = NODE_RADIUS;
  readonly CARGO_POD_SIZE = CARGO_POD_SIZE;
  readonly conditionVariables = ['item.color', 'item.label', 'item.type', 'item.priority'];

  // Computed from engine (null-safe)
  readonly pipelineNodes = computed(() => this.engine?.pipelineGraph().nodes ?? []);
  readonly pipelineEdges = computed(() => this.engine?.pipelineGraph().edges ?? []);
  readonly cargoItems = computed(() => this.engine?.cargoItems() ?? []);
  readonly targetZones = computed(() => this.engine?.targetZones() ?? []);
  readonly availableGateTypes = computed(() => this.engine?.availableGateTypes() ?? []);
  readonly placedGates = computed(() => this.engine?.placedGates() ?? new Map<string, PlacedGate>());
  readonly isSimulating = computed(() => this.animatingItems().length > 0);

  // SVG node position map (percentage -> viewBox coords)
  readonly nodePositionMap = computed(() => {
    const map = new Map<string, { x: number; y: number; nodeType: string; label: string }>();
    for (const node of this.pipelineNodes()) {
      map.set(node.id, {
        x: node.position.x / 100 * VIEWBOX_WIDTH,
        y: node.position.y / 100 * VIEWBOX_HEIGHT,
        nodeType: node.nodeType,
        label: node.label,
      });
    }
    return map;
  });

  // Array version for template iteration
  readonly nodePositions = computed(() =>
    this.pipelineNodes().map(n => ({
      id: n.id,
      x: n.position.x / 100 * VIEWBOX_WIDTH,
      y: n.position.y / 100 * VIEWBOX_HEIGHT,
      nodeType: n.nodeType,
      label: n.label,
    }))
  );

  // Edge paths as bezier curves
  readonly edgePaths = computed(() => {
    const posMap = this.nodePositionMap();
    return this.pipelineEdges().map(edge => {
      const start = posMap.get(edge.sourceNodeId);
      const end = posMap.get(edge.targetNodeId);
      if (!start || !end) return null;
      return { id: edge.id, path: buildBezierPath(start.x, start.y, end.x, end.y) };
    }).filter(e => e !== null);
  });

  // Gate slot nodes (filtered for template)
  readonly gateSlotNodes = computed(() =>
    this.pipelineNodes()
      .filter(n => n.nodeType === 'gate-slot')
      .map(n => ({ id: n.id, ...this.nodePositionMap().get(n.id)! }))
  );

  // Target zone positions
  readonly targetZonePositions = computed(() => {
    const posMap = this.nodePositionMap();
    return this.targetZones().map(tz => {
      const pos = posMap.get(tz.nodeId);
      return pos ? { ...tz, x: pos.x, y: pos.y } : null;
    }).filter(t => t !== null);
  });

  // Condition editor mode (based on tier + gate type)
  readonly conditionEditorMode = computed((): 'guided' | 'raw' => {
    const gateId = this.editingGateId();
    if (!gateId) return 'raw';
    const gate = this.placedGates().get(gateId);
    if (!gate) return 'raw';

    // @for and @switch always use raw mode (their conditions don't fit guided builder)
    if (gate.gateType !== GateType.if) return 'raw';

    // Advanced/Boss tiers use raw mode for all gates
    const tier = this.engine?.currentTier();
    if (tier === DifficultyTier.Advanced || tier === DifficultyTier.Boss) return 'raw';

    // Basic/Intermediate @if gates use guided mode
    return 'guided';
  });

  // Current condition value for the editing gate
  readonly editingGateCondition = computed(() => {
    const gateId = this.editingGateId();
    if (!gateId) return '';
    return this.placedGates().get(gateId)?.condition ?? '';
  });

  // Gate type for the currently editing gate
  readonly editingGateType = computed(() => {
    const gateId = this.editingGateId();
    if (!gateId) return GateType.if;
    return this.placedGates().get(gateId)?.gateType ?? GateType.if;
  });

  // Popover position (percentage-based for responsive scaling)
  readonly editorPopoverStyle = computed(() => {
    const gateId = this.editingGateId();
    if (!gateId) return { left: '0%', top: '0%' };
    const pos = this.nodePositionMap().get(gateId);
    if (!pos) return { left: '0%', top: '0%' };
    return {
      left: `${(pos.x / VIEWBOX_WIDTH) * 100}%`,
      top: `${(pos.y / VIEWBOX_HEIGHT) * 100}%`,
    };
  });

  constructor() {
    if (!this.engine) return;

    // Keyboard shortcuts
    for (const opt of GATE_TYPE_OPTIONS) {
      this.shortcuts.register(opt.key, `Select ${opt.label}`, () => this.selectedGateType.set(opt.type));
    }
    this.shortcuts.register('r', 'Run simulation', () => this.onRun());
    this.shortcuts.register('escape', 'Close editor / Reset', () => {
      if (this.editingGateId()) {
        this.closeConditionEditor();
      }
    });
  }

  // --- Gate interaction ---

  onGateSlotClick(nodeId: string): void {
    if (!this.engine || this.isSimulating()) return;
    const gates = this.placedGates();
    if (gates.has(nodeId)) {
      this.editingGateId.set(nodeId);
    } else {
      this.engine.submitAction({
        type: 'place-gate',
        nodeId,
        gateType: this.selectedGateType(),
        condition: '',
      });
    }
  }

  onGateRightClick(event: MouseEvent, nodeId: string): void {
    event.preventDefault();
    if (!this.engine || this.isSimulating()) return;
    this.engine.submitAction({ type: 'remove-gate', nodeId });
    if (this.editingGateId() === nodeId) this.editingGateId.set(null);
  }

  onConditionApplied(condition: string): void {
    if (!this.engine) return;
    const gateId = this.editingGateId();
    if (!gateId) return;
    this.engine.submitAction({ type: 'configure-gate', nodeId: gateId, condition });
    this.closeConditionEditor();
  }

  closeConditionEditor(): void {
    this.editingGateId.set(null);
  }

  selectGateType(type: GateType): void {
    this.selectedGateType.set(type);
  }

  // --- Simulation ---

  onRun(): void {
    if (!this.engine || this.isSimulating()) return;
    this.closeConditionEditor();
    const result = this.engine.simulate();
    if (!result) return;
    this.startSimulationAnimation(result);
  }

  onReset(): void {
    if (!this.engine) return;
    this.clearPendingTimers();
    this.animatingItems.set([]);
    this.simulationDone.set(null);
    this.engine.reset();
  }

  // --- Cargo position for template ---

  getCargoX(cargo: AnimatingCargo): number {
    const idx = Math.min(cargo.currentSegment, cargo.waypoints.length - 1);
    return cargo.waypoints[idx].x - CARGO_POD_SIZE / 2;
  }

  getCargoY(cargo: AnimatingCargo): number {
    const idx = Math.min(cargo.currentSegment, cargo.waypoints.length - 1);
    return cargo.waypoints[idx].y - CARGO_POD_SIZE / 2;
  }

  ngOnDestroy(): void {
    this.clearPendingTimers();
    for (const opt of GATE_TYPE_OPTIONS) this.shortcuts.unregister(opt.key);
    this.shortcuts.unregister('r');
    this.shortcuts.unregister('escape');
  }

  // --- Private ---

  private startSimulationAnimation(result: SimulationResult): void {
    const posMap = this.nodePositionMap();
    const items: AnimatingCargo[] = result.itemResults.map(r => ({
      item: { id: r.item.id, color: r.item.color, label: r.item.label },
      waypoints: r.path.map(nodeId => posMap.get(nodeId) ?? { x: 0, y: 0 }),
      currentSegment: 0,
      correct: r.correct,
      animationComplete: false,
    }));

    this.animatingItems.set(items);

    const maxSegments = Math.max(...items.map(i => i.waypoints.length), 1);

    for (let step = 1; step < maxSegments; step++) {
      const timer = setTimeout(() => {
        this.animatingItems.update(all =>
          all.map(cargo =>
            cargo.currentSegment < cargo.waypoints.length - 1
              ? { ...cargo, currentSegment: cargo.currentSegment + 1 }
              : cargo
          )
        );
      }, step * ANIMATION_STEP_MS);
      this.pendingTimers.push(timer);
    }

    // After all steps complete, mark animation done and show results
    const completeTimer = setTimeout(() => {
      this.animatingItems.update(all =>
        all.map(cargo => ({ ...cargo, animationComplete: true }))
      );
      this.simulationDone.set(result);

      // Clear animation after result display
      const clearTimer = setTimeout(() => {
        this.animatingItems.set([]);
      }, RESULT_DISPLAY_MS);
      this.pendingTimers.push(clearTimer);
    }, maxSegments * ANIMATION_STEP_MS);
    this.pendingTimers.push(completeTimer);
  }

  private clearPendingTimers(): void {
    for (const t of this.pendingTimers) clearTimeout(t);
    this.pendingTimers.length = 0;
  }
}

// Module-level helper (same bezier formula as Wire Protocol)
function buildBezierPath(startX: number, startY: number, endX: number, endY: number): string {
  const dx = Math.abs(endX - startX) * 0.4;
  return `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;
}
