import {
  Component,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MINIGAME_ENGINE } from '../../../core/minigame/minigame-engine.tokens';
import { KeyboardShortcutService } from '../../../core/minigame/keyboard-shortcut.service';
import { CodeEditorComponent } from '../../../shared/components/code-editor/code-editor';
import { CorridorRunnerEngine, type NavigationResult, type RunResult } from './corridor-runner.engine';
import type { MapLayout, RouteEntry } from './corridor-runner.types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VIEWBOX_WIDTH = 1000;
const VIEWBOX_HEIGHT = 600;
const NODE_RADIUS = 20;
export const CREW_STEP_MS = 300;
const RESULT_DISPLAY_MS = 1500;

// ---------------------------------------------------------------------------
// Local types
// ---------------------------------------------------------------------------

type GamePhase = 'config' | 'run';

interface AnimatingCrew {
  readonly waypoints: readonly { x: number; y: number; nodeId: string }[];
  readonly currentStep: number;
  readonly animationComplete: boolean;
  readonly isHullBreach: boolean;
  readonly isSuccess: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

@Component({
  selector: 'app-corridor-runner',
  imports: [CodeEditorComponent],
  templateUrl: './corridor-runner.component.html',
  styleUrl: './corridor-runner.component.scss',
})
export class CorridorRunnerComponent implements OnDestroy {
  private readonly engine = inject(MINIGAME_ENGINE, { optional: true }) as CorridorRunnerEngine | null;
  private readonly shortcuts = inject(KeyboardShortcutService);

  // Local UI state
  readonly phase = signal<GamePhase>('config');
  readonly currentUrl = signal('');
  readonly animatingCrew = signal<AnimatingCrew | null>(null);
  readonly routeConfigText = signal('');
  readonly parseError = signal<string | null>(null);
  readonly navigationIndex = signal(0);
  private readonly pendingTimers: ReturnType<typeof setTimeout>[] = [];

  // Template constants
  readonly viewBox = `0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`;
  readonly nodeRadius = NODE_RADIUS;

  // Computed from engine (null-safe)
  readonly mapLayout = computed<MapLayout>(() =>
    this.engine?.mapLayout() ?? { nodes: [], edges: [] }
  );
  readonly mapNodes = computed(() => this.mapLayout().nodes);
  readonly mapEdges = computed(() => this.mapLayout().edges);
  readonly testNavigations = computed(() => this.engine?.testNavigations() ?? []);
  readonly playerRouteConfig = computed(() => this.engine?.playerRouteConfig() ?? []);
  readonly runResult = computed(() => this.engine?.runResult() ?? null);
  readonly isAnimating = computed(() => this.animatingCrew() !== null);

  // SVG node position map (percentage -> viewBox coords)
  readonly nodePositionMap = computed(() => {
    const map = new Map<string, { x: number; y: number }>();
    for (const node of this.mapNodes()) {
      map.set(node.id, {
        x: node.position.x / 100 * VIEWBOX_WIDTH,
        y: node.position.y / 100 * VIEWBOX_HEIGHT,
      });
    }
    return map;
  });

  // Array version for template @for
  readonly nodePositions = computed(() =>
    this.mapNodes().map(n => ({
      id: n.id,
      label: n.label,
      x: n.position.x / 100 * VIEWBOX_WIDTH,
      y: n.position.y / 100 * VIEWBOX_HEIGHT,
    }))
  );

  // Edge paths as bezier curves
  readonly edgePaths = computed(() => {
    const posMap = this.nodePositionMap();
    return this.mapEdges().map(edge => {
      const start = posMap.get(edge.sourceNodeId);
      const end = posMap.get(edge.targetNodeId);
      if (!start || !end) return null;
      return { id: edge.id, path: buildBezierPath(start.x, start.y, end.x, end.y) };
    }).filter(e => e !== null);
  });

  // Corridor glow: which edges have routes configured
  readonly corridorGlowMap = computed(() => {
    const routes = this.engine?.playerRouteConfig() ?? [];
    const configuredComponents = new Set(
      routes.map(r => r.component).filter((c): c is string => Boolean(c))
    );
    const layout = this.mapLayout();
    const nodes = layout.nodes;
    const edges = layout.edges;

    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const glowMap = new Map<string, boolean>();

    for (const edge of edges) {
      const source = nodeMap.get(edge.sourceNodeId);
      const target = nodeMap.get(edge.targetNodeId);
      const lit = (source && configuredComponents.has(source.label)) ||
                  (target && configuredComponents.has(target.label));
      glowMap.set(edge.id, !!lit);
    }
    return glowMap;
  });

  // Crew position for template
  readonly crewX = computed(() => {
    const crew = this.animatingCrew();
    if (!crew || crew.waypoints.length === 0) return 0;
    const idx = Math.min(crew.currentStep, crew.waypoints.length - 1);
    return crew.waypoints[idx].x;
  });

  readonly crewY = computed(() => {
    const crew = this.animatingCrew();
    if (!crew || crew.waypoints.length === 0) return 0;
    const idx = Math.min(crew.currentStep, crew.waypoints.length - 1);
    return crew.waypoints[idx].y;
  });

  constructor() {
    if (!this.engine) return;

    this.shortcuts.register('enter', 'Lock routes / Run test', () => {
      if (this.phase() === 'config') {
        this.onLockRoutes();
      } else {
        this.onRunTest();
      }
    });
    this.shortcuts.register('escape', 'Reset', () => this.onReset());
  }

  // --- Public methods ---

  onCodeChange(text: string): void {
    this.routeConfigText.set(text);
    try {
      const routes = JSON.parse(text) as RouteEntry[];
      if (!Array.isArray(routes)) throw new Error('Must be an array');
      this.parseError.set(null);
      this.engine?.submitAction({ type: 'set-route-config', routes });
    } catch {
      this.parseError.set('Invalid route configuration');
    }
  }

  onLockRoutes(): void {
    if (this.parseError()) return;
    this.phase.set('run');
  }

  onRunTest(): void {
    if (!this.engine || this.isAnimating()) return;
    const result = this.engine.runAllNavigations();
    if (!result) return;
    this.startCrewAnimation(result);
  }

  onReset(): void {
    if (!this.engine) return;
    this.clearPendingTimers();
    this.phase.set('config');
    this.currentUrl.set('');
    this.animatingCrew.set(null);
    this.navigationIndex.set(0);
    this.engine.reset();
  }

  ngOnDestroy(): void {
    this.clearPendingTimers();
    this.shortcuts.unregister('enter');
    this.shortcuts.unregister('escape');
  }

  // --- Private: Animation ---

  private startCrewAnimation(result: RunResult): void {
    this.animateNextNavigation(result.navigationResults, 0);
  }

  private animateNextNavigation(results: readonly NavigationResult[], index: number): void {
    if (index >= results.length) {
      return;
    }

    const nav = results[index];
    this.currentUrl.set(nav.url);
    this.navigationIndex.set(index);

    const waypoints = this.resolvePathWaypoints(nav);
    const crew: AnimatingCrew = {
      waypoints,
      currentStep: 0,
      animationComplete: false,
      isHullBreach: nav.isHullBreach,
      isSuccess: nav.correct,
    };
    this.animatingCrew.set(crew);

    // Advance through waypoints
    for (let step = 1; step < waypoints.length; step++) {
      const timer = setTimeout(() => {
        this.animatingCrew.update(c => c ? { ...c, currentStep: step } : null);
      }, step * CREW_STEP_MS);
      this.pendingTimers.push(timer);
    }

    // After final step: mark complete, pause, then next navigation
    const completeTimer = setTimeout(() => {
      this.animatingCrew.update(c => c ? { ...c, animationComplete: true } : null);
      const nextTimer = setTimeout(() => {
        this.animateNextNavigation(results, index + 1);
      }, RESULT_DISPLAY_MS);
      this.pendingTimers.push(nextTimer);
    }, waypoints.length * CREW_STEP_MS);
    this.pendingTimers.push(completeTimer);
  }

  // --- Private: Pathfinding ---

  private resolvePathWaypoints(nav: NavigationResult): { x: number; y: number; nodeId: string }[] {
    const layout = this.mapLayout();
    if (!layout || layout.nodes.length === 0) return [];

    const posMap = this.nodePositionMap();
    const entryNode = layout.nodes[0];
    const targetNode = nav.isHullBreach
      ? null
      : layout.nodes.find(n => n.label === nav.resolvedComponent);

    const targetId = targetNode?.id ?? null;
    const path = this.bfs(entryNode.id, targetId, layout);

    return path.map(nodeId => ({
      ...posMap.get(nodeId)!,
      nodeId,
    }));
  }

  private bfs(startId: string, targetId: string | null, layout: MapLayout): string[] {
    if (targetId === null) {
      // Hull breach: crew stays at entry node
      return [startId];
    }

    // Build undirected adjacency map
    const adj = new Map<string, string[]>();
    for (const edge of layout.edges) {
      if (!adj.has(edge.sourceNodeId)) adj.set(edge.sourceNodeId, []);
      if (!adj.has(edge.targetNodeId)) adj.set(edge.targetNodeId, []);
      adj.get(edge.sourceNodeId)!.push(edge.targetNodeId);
      adj.get(edge.targetNodeId)!.push(edge.sourceNodeId);
    }

    // Standard BFS
    const visited = new Set<string>([startId]);
    const parent = new Map<string, string>();
    const queue: string[] = [startId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === targetId) {
        // Reconstruct path
        const path: string[] = [];
        let node: string | undefined = targetId;
        while (node !== undefined) {
          path.unshift(node);
          node = parent.get(node);
        }
        return path;
      }
      for (const neighbor of adj.get(current) ?? []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          parent.set(neighbor, current);
          queue.push(neighbor);
        }
      }
    }

    // No path found, stay at start
    return [startId];
  }

  private clearPendingTimers(): void {
    for (const t of this.pendingTimers) clearTimeout(t);
    this.pendingTimers.length = 0;
  }
}

// Module-level helper
function buildBezierPath(startX: number, startY: number, endX: number, endY: number): string {
  const dx = Math.abs(endX - startX) * 0.4;
  return `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;
}
