import {
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import type { MapLayout, RouteEntry } from '../corridor-runner.types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VIEWBOX_WIDTH = 1000;
const VIEWBOX_HEIGHT = 600;
const NODE_RADIUS = 20;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

@Component({
  selector: 'app-corridor-runner-map',
  imports: [],
  template: `
    <svg class="cr-map__svg"
         [class.cr-map__svg--full]="expanded()"
         [attr.viewBox]="viewBox"
         preserveAspectRatio="xMidYMid meet">

      <!-- Corridor edges -->
      @for (edge of edgePaths(); track edge.id) {
        <path [attr.d]="edge.path"
              class="cr-map__corridor"
              [class.cr-map__corridor--lit]="corridorGlowMap().get(edge.id)" />
      }

      <!-- Station module nodes -->
      @for (node of nodePositions(); track node.id) {
        <g class="cr-map__module">
          <circle [attr.cx]="node.x" [attr.cy]="node.y" [attr.r]="nodeRadius"
                  (click)="moduleClicked.emit(node.id)" />
          <text [attr.x]="node.x" [attr.y]="node.y - nodeRadius - 6"
                class="cr-map__module-label" text-anchor="middle">{{ node.label }}</text>
        </g>
      }

      <!-- Crew sprite -->
      @if (crewPath().length > 0) {
        <g class="cr-map__crew"
           [class.cr-map__crew--hull-breach]="isHullBreach() && animationComplete()"
           [class.cr-map__crew--success]="isSuccess() && animationComplete()">
          <circle [attr.cx]="crewX()" [attr.cy]="crewY()" r="12"
                  class="cr-map__crew-dot" />
        </g>
      }
    </svg>
  `,
  styleUrl: './map.scss',
})
export class CorridorRunnerMapComponent {
  // --- Inputs ---
  readonly stationMap = input<MapLayout>({ nodes: [], edges: [] });
  readonly configuredRoutes = input<readonly RouteEntry[]>([]);
  readonly crewPath = input<readonly string[]>([]);
  readonly crewStep = input(0);
  readonly isHullBreach = input(false);
  readonly isSuccess = input(false);
  readonly animationComplete = input(false);
  readonly expanded = input(false);

  // --- Outputs ---
  readonly moduleClicked = output<string>();

  // --- Template constants ---
  readonly viewBox = `0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`;
  readonly nodeRadius = NODE_RADIUS;

  // --- Computed: node position map (percentage -> viewBox coords) ---
  readonly nodePositionMap = computed(() => {
    const map = new Map<string, { x: number; y: number }>();
    for (const node of this.stationMap().nodes) {
      map.set(node.id, {
        x: (node.position.x / 100) * VIEWBOX_WIDTH,
        y: (node.position.y / 100) * VIEWBOX_HEIGHT,
      });
    }
    return map;
  });

  // --- Computed: array version for template @for ---
  readonly nodePositions = computed(() =>
    this.stationMap().nodes.map(n => ({
      id: n.id,
      label: n.label,
      x: (n.position.x / 100) * VIEWBOX_WIDTH,
      y: (n.position.y / 100) * VIEWBOX_HEIGHT,
    })),
  );

  // --- Computed: edge paths as bezier curves ---
  readonly edgePaths = computed(() => {
    const posMap = this.nodePositionMap();
    return this.stationMap()
      .edges.map(edge => {
        const start = posMap.get(edge.sourceNodeId);
        const end = posMap.get(edge.targetNodeId);
        if (!start || !end) return null;
        return { id: edge.id, path: buildBezierPath(start.x, start.y, end.x, end.y) };
      })
      .filter(e => e !== null);
  });

  // --- Computed: corridor glow map ---
  readonly corridorGlowMap = computed(() => {
    const routes = this.configuredRoutes();
    const configuredComponents = new Set(
      routes.map(r => r.component).filter((c): c is string => Boolean(c)),
    );
    const layout = this.stationMap();
    const nodeMap = new Map(layout.nodes.map(n => [n.id, n]));
    const glowMap = new Map<string, boolean>();

    for (const edge of layout.edges) {
      const source = nodeMap.get(edge.sourceNodeId);
      const target = nodeMap.get(edge.targetNodeId);
      const lit =
        (source && configuredComponents.has(source.label)) ||
        (target && configuredComponents.has(target.label));
      glowMap.set(edge.id, !!lit);
    }
    return glowMap;
  });

  // --- Computed: crew sprite position ---
  readonly crewX = computed(() => {
    const path = this.crewPath();
    if (path.length === 0) return 0;
    const clampedStep = Math.min(this.crewStep(), path.length - 1);
    const nodeId = path[clampedStep];
    const pos = this.nodePositionMap().get(nodeId);
    return pos ? pos.x : 0;
  });

  readonly crewY = computed(() => {
    const path = this.crewPath();
    if (path.length === 0) return 0;
    const clampedStep = Math.min(this.crewStep(), path.length - 1);
    const nodeId = path[clampedStep];
    const pos = this.nodePositionMap().get(nodeId);
    return pos ? pos.y : 0;
  });
}

// ---------------------------------------------------------------------------
// Module-level helper
// ---------------------------------------------------------------------------

function buildBezierPath(startX: number, startY: number, endX: number, endY: number): string {
  const dx = Math.abs(endX - startX) * 0.4;
  return `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;
}
