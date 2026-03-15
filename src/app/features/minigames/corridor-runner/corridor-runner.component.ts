import {
  Component,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MINIGAME_ENGINE } from '../../../core/minigame/minigame-engine.tokens';
import { KeyboardShortcutService } from '../../../core/minigame/keyboard-shortcut.service';
import { CorridorRunnerEngine, type NavigationResult, type RunResult } from './corridor-runner.engine';
import { CorridorRunnerMapComponent } from './map/map';
import { CorridorRunnerRouteEditorComponent } from './route-editor/route-editor';
import type { MapLayout, RouteEntry } from './corridor-runner.types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const CREW_STEP_MS = 300;
const RESULT_DISPLAY_MS = 1500;

// ---------------------------------------------------------------------------
// Local types
// ---------------------------------------------------------------------------

type GamePhase = 'config' | 'run';

interface AnimatingCrew {
  readonly path: readonly string[];
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
  imports: [CorridorRunnerRouteEditorComponent, CorridorRunnerMapComponent],
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
  readonly navigationIndex = signal(0);
  private readonly pendingTimers: ReturnType<typeof setTimeout>[] = [];

  // Computed from engine (null-safe)
  readonly mapLayout = computed<MapLayout>(() =>
    this.engine?.mapLayout() ?? { nodes: [], edges: [] }
  );
  readonly testNavigations = computed(() => this.engine?.testNavigations() ?? []);
  readonly playerRouteConfig = computed(() => this.engine?.playerRouteConfig() ?? []);
  readonly runResult = computed(() => this.engine?.runResult() ?? null);
  readonly isAnimating = computed(() => this.animatingCrew() !== null);

  // Crew state for map child component
  readonly crewPath = computed(() => this.animatingCrew()?.path ?? []);
  readonly crewStep = computed(() => this.animatingCrew()?.currentStep ?? 0);
  readonly crewIsHullBreach = computed(() => this.animatingCrew()?.isHullBreach ?? false);
  readonly crewIsSuccess = computed(() => this.animatingCrew()?.isSuccess ?? false);
  readonly crewAnimationComplete = computed(() => this.animatingCrew()?.animationComplete ?? false);
  readonly mapExpanded = computed(() => this.phase() === 'run');

  // Available component names for route editor, derived from map nodes (excluding entry node)
  readonly availableComponents = computed(() => {
    const layout = this.mapLayout();
    return layout.nodes
      .filter(n => n.id !== layout.nodes[0]?.id)
      .map(n => n.label);
  });
  readonly emptyConfig: RouteEntry[] = [];

  constructor() {
    if (!this.engine) return;

    this.shortcuts.register('enter', 'Lock routes / Run test', () => {
      if (this.phase() === 'config') {
        this.onConfigSubmitted();
      } else {
        this.onRunTest();
      }
    });
    this.shortcuts.register('escape', 'Reset', () => this.onReset());
  }

  // --- Public methods ---

  onConfigChanged(routes: RouteEntry[]): void {
    this.engine?.submitAction({ type: 'set-route-config', routes });
  }

  onConfigSubmitted(): void {
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

  onModuleClicked(_nodeId: string): void {
    // Placeholder for future navigation-by-click feature (T-2026-505 URL bar)
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

    const path = this.resolvePathWaypoints(nav);
    const crew: AnimatingCrew = {
      path,
      currentStep: 0,
      animationComplete: false,
      isHullBreach: nav.isHullBreach,
      isSuccess: nav.correct,
    };
    this.animatingCrew.set(crew);

    // Advance through path steps
    for (let step = 1; step < path.length; step++) {
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
    }, path.length * CREW_STEP_MS);
    this.pendingTimers.push(completeTimer);
  }

  // --- Private: Pathfinding ---

  private resolvePathWaypoints(nav: NavigationResult): string[] {
    const layout = this.mapLayout();
    if (!layout || layout.nodes.length === 0) return [];

    const entryNode = layout.nodes[0];
    const targetNode = nav.isHullBreach
      ? null
      : layout.nodes.find(n => n.label === nav.resolvedComponent);

    const targetId = targetNode?.id ?? null;
    return this.bfs(entryNode.id, targetId, layout);
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
