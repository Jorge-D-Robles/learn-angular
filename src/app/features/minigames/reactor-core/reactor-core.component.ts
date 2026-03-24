import {
  Component,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MINIGAME_ENGINE } from '../../../core/minigame/minigame-engine.tokens';
import { KeyboardShortcutService } from '../../../core/minigame/keyboard-shortcut.service';
import { DraggableDirective } from '../../../shared/directives/draggable.directive';
import { ReactorCoreGraphCanvasComponent } from './graph-canvas/graph-canvas';
import { ReactorCoreNodeConfigComponent, NODE_TYPE_COLORS } from './node-config/node-config';
import { ReactorCoreGraphServiceImpl } from './reactor-core-graph.service';
import type { ReactorCoreEngine, SimulationRunResult } from './reactor-core.engine';
import type {
  ReactorNodeType,
  NodePosition,
  SignalNode,
  ComputedNode,
  EffectNode,
} from './reactor-core.types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOOLBOX_TYPES: { key: string; type: ReactorNodeType; label: string; color: string }[] = [
  { key: '1', type: 'signal', label: 'Signal', color: NODE_TYPE_COLORS.signal },
  { key: '2', type: 'computed', label: 'Computed', color: NODE_TYPE_COLORS.computed },
  { key: '3', type: 'effect', label: 'Effect', color: NODE_TYPE_COLORS.effect },
];

const SIMULATION_ANIMATION_MS = 2000;

@Component({
  selector: 'app-reactor-core',
  imports: [
    DraggableDirective,
    ReactorCoreGraphCanvasComponent,
    ReactorCoreNodeConfigComponent,
  ],
  providers: [ReactorCoreGraphServiceImpl],
  templateUrl: './reactor-core.component.html',
  styleUrl: './reactor-core.component.scss',
})
export class ReactorCoreComponent implements OnDestroy {
  private readonly engine = inject(MINIGAME_ENGINE, { optional: true }) as ReactorCoreEngine | null;
  private readonly graphService = inject(ReactorCoreGraphServiceImpl);
  private readonly shortcuts = inject(KeyboardShortcutService);

  // Expose constant for template
  readonly TOOLBOX_TYPES = TOOLBOX_TYPES;

  // Local state
  readonly selectedNodeId = signal<string | null>(null);
  readonly simulating = signal(false);
  readonly selectedToolboxType = signal<ReactorNodeType>('signal');

  private _simulationTimer: ReturnType<typeof setTimeout> | null = null;

  // Computed from engine (null-safe)
  readonly nodes = computed(() => this.engine?.nodes() ?? []);
  readonly edges = computed(() => this.engine?.edges() ?? []);
  readonly simulationResult = computed<SimulationRunResult | null>(() => this.engine?.simulationResult() ?? null);
  readonly simulationsRemaining = computed(() => this.engine?.simulationsRemaining() ?? 0);
  readonly requiredNodes = computed(() => this.engine?.requiredNodes() ?? []);

  // Derived signals
  readonly nodeMap = computed(() => new Map(this.nodes().map(n => [n.id, n])));
  readonly placedNodeIds = computed(() => new Set(this.nodes().map(n => n.id)));

  readonly selectedNode = computed<(SignalNode | ComputedNode | EffectNode) | null>(() => {
    const id = this.selectedNodeId();
    if (!id) return null;
    const node = this.nodeMap().get(id);
    if (!node) return null;
    if (node.type === 'signal' || node.type === 'computed' || node.type === 'effect') {
      return node as SignalNode | ComputedNode | EffectNode;
    }
    return null;
  });

  readonly availableDependencies = computed(() => {
    return this.nodes()
      .filter(n => n.type === 'signal' || n.type === 'computed')
      .map(n => n.label);
  });

  readonly toolboxNodes = computed(() =>
    this.requiredNodes().filter(
      n => !this.placedNodeIds().has(n.id) && n.type === this.selectedToolboxType(),
    ),
  );

  constructor() {
    if (!this.engine) return; // inert mode

    // Keyboard shortcuts
    this.shortcuts.register('s', 'Simulate', () => this.onSimulate());
    this.shortcuts.register('escape', 'Cancel / Close', () => this.onEscape());
    this.shortcuts.register('1', 'Signal toolbox', () => this.selectedToolboxType.set('signal'));
    this.shortcuts.register('2', 'Computed toolbox', () => this.selectedToolboxType.set('computed'));
    this.shortcuts.register('3', 'Effect toolbox', () => this.selectedToolboxType.set('effect'));
  }

  // --- Public methods ---

  selectToolboxType(type: ReactorNodeType): void {
    this.selectedToolboxType.set(type);
  }

  getNodeColor(type: ReactorNodeType): string {
    return NODE_TYPE_COLORS[type as keyof typeof NODE_TYPE_COLORS] ?? '#3B82F6';
  }

  onNodeAddedFromCanvas(event: { type: ReactorNodeType; position: NodePosition }): void {
    if (!this.engine) return;

    // Find the first unplaced required node of the dropped type
    const placed = this.placedNodeIds();
    const template = this.requiredNodes().find(
      n => n.type === event.type && !placed.has(n.id),
    );
    if (!template) return;

    this.engine.submitAction({ type: 'add-node', nodeId: template.id });
    this.engine.submitAction({
      type: 'set-node-position',
      nodeId: template.id,
      x: event.position.x,
      y: event.position.y,
    });
  }

  onNodeMoved(event: { nodeId: string; newPosition: NodePosition }): void {
    this.engine?.submitAction({
      type: 'set-node-position',
      nodeId: event.nodeId,
      x: event.newPosition.x,
      y: event.newPosition.y,
    });
  }

  onEdgeAdded(event: { sourceId: string; targetId: string }): void {
    this.engine?.submitAction({
      type: 'connect-edge',
      sourceId: event.sourceId,
      targetId: event.targetId,
    });
  }

  onEdgeRemoved(event: { sourceId: string; targetId: string }): void {
    this.engine?.submitAction({
      type: 'disconnect-edge',
      sourceId: event.sourceId,
      targetId: event.targetId,
    });
  }

  onNodeSelected(nodeId: string): void {
    this.selectedNodeId.set(nodeId);
  }

  onNodeConfigured(node: SignalNode | ComputedNode | EffectNode): void {
    if (!this.engine) return;

    if (node.type === 'signal') {
      this.engine.submitAction({
        type: 'set-signal-value',
        nodeId: node.id,
        value: node.initialValue,
      });
    }
    // For computed/effect: no engine action — config is for simulation via graph service only
  }

  onConfigCancelled(): void {
    this.selectedNodeId.set(null);
  }

  onSimulate(): void {
    if (!this.engine) return;

    this.engine.runSimulation();
    this.simulating.set(true);
    this._simulationTimer = setTimeout(
      () => this.simulating.set(false),
      SIMULATION_ANIMATION_MS,
    );
  }

  onEscape(): void {
    if (this.selectedNodeId()) {
      this.selectedNodeId.set(null);
    }
  }

  ngOnDestroy(): void {
    if (this._simulationTimer) {
      clearTimeout(this._simulationTimer);
    }
    this.shortcuts.unregister('s');
    this.shortcuts.unregister('escape');
    this.shortcuts.unregister('1');
    this.shortcuts.unregister('2');
    this.shortcuts.unregister('3');
  }
}
