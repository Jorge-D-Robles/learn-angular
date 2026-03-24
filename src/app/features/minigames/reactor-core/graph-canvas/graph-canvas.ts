import {
  Component,
  type ElementRef,
  computed,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { SvgPortComponent } from '../../../../shared/components/svg-port/svg-port';
import { DropZoneDirective } from '../../../../shared/directives/drop-zone.directive';
import { WireDrawService } from '../../../../core/minigame/wire-draw.service';
import type { DropResult } from '../../../../core/minigame/drag-drop.service';
import { NODE_TYPE_COLORS } from '../node-config/node-config';
import type {
  ReactorNodeType,
  RuntimeReactorNode,
  GraphEdge,
  NodePosition,
} from '../reactor-core.types';
import { wouldCreateCycle } from '../reactor-core.types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const NODE_WIDTH = 160;
const NODE_HEIGHT = 80;
const PORT_RADIUS_OFFSET = 40; // vertical center of node

/** Extended color map covering all ReactorNodeType values. */
export const EXTENDED_NODE_COLORS: Record<ReactorNodeType, string> = {
  ...(NODE_TYPE_COLORS as Record<string, string>),
  'linked-signal': '#A855F7',
  'to-signal': '#3B82F6',
  'to-observable': '#A855F7',
  resource: '#EAB308',
} as Record<ReactorNodeType, string>;

// ---------------------------------------------------------------------------
// Wire descriptor (internal)
// ---------------------------------------------------------------------------

export interface GraphWireDescriptor {
  readonly sourceId: string;
  readonly targetId: string;
  readonly path: string;
  readonly color: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

@Component({
  selector: 'app-reactor-core-graph-canvas',
  imports: [SvgPortComponent, DropZoneDirective],
  templateUrl: './graph-canvas.html',
  styleUrl: './graph-canvas.scss',
})
export class ReactorCoreGraphCanvasComponent implements OnInit, OnDestroy {
  private readonly wireDrawService = inject(WireDrawService, { optional: true });

  readonly canvasSvgRef = viewChild<ElementRef<SVGSVGElement>>('canvasSvg');

  // Inputs
  readonly nodes = input<Map<string, RuntimeReactorNode>>(new Map());
  readonly edges = input<readonly GraphEdge[]>([]);
  readonly toolboxItems = input<readonly ReactorNodeType[]>([]);
  readonly simulating = input(false);
  readonly selectedNodeId = input<string | null>(null);

  // Outputs
  readonly nodeAdded = output<{ type: ReactorNodeType; position: NodePosition }>();
  readonly nodeMoved = output<{ nodeId: string; newPosition: NodePosition }>();
  readonly edgeAdded = output<{ sourceId: string; targetId: string }>();
  readonly edgeRemoved = output<{ sourceId: string; targetId: string }>();
  readonly nodeSelected = output<string>();

  // Internal signals
  private readonly panX = signal(0);
  private readonly panY = signal(0);
  private readonly zoomLevel = signal(1);

  // Dragging state
  private draggingNodeId: string | null = null;
  private dragStartClientX = 0;
  private dragStartClientY = 0;
  private dragStartNodeX = 0;
  private dragStartNodeY = 0;

  // Template constants
  readonly viewBox = '0 0 1200 800';
  readonly nodeWidth = NODE_WIDTH;
  readonly nodeHeight = NODE_HEIGHT;

  // Computed: node array from Map
  readonly nodeArray = computed(() => Array.from(this.nodes().values()));

  // Computed: canvas transform for pan/zoom
  readonly canvasTransform = computed(() =>
    `translate(${this.panX()}, ${this.panY()}) scale(${this.zoomLevel()})`,
  );

  // Computed: wire descriptors from edges
  readonly wireDescriptors = computed<readonly GraphWireDescriptor[]>(() => {
    const edgeList = this.edges();
    const nodeMap = this.nodes();
    const descriptors: GraphWireDescriptor[] = [];

    for (const edge of edgeList) {
      const sourceNode = nodeMap.get(edge.sourceId);
      const targetNode = nodeMap.get(edge.targetId);
      if (!sourceNode || !targetNode) continue;

      const startX = sourceNode.position.x + NODE_WIDTH;
      const startY = sourceNode.position.y + PORT_RADIUS_OFFSET;
      const endX = targetNode.position.x;
      const endY = targetNode.position.y + PORT_RADIUS_OFFSET;

      descriptors.push({
        sourceId: edge.sourceId,
        targetId: edge.targetId,
        path: this.buildBezierPath(startX, startY, endX, endY),
        color: EXTENDED_NODE_COLORS[sourceNode.type] ?? '#3B82F6',
      });
    }

    return descriptors;
  });

  // Computed: preview wire during drawing
  readonly previewPath = computed(() => {
    if (!this.wireDrawService || this.wireDrawService.phase() !== 'drawing') return null;
    const sourcePort = this.wireDrawService.activeSourcePort();
    const pointer = this.wireDrawService.pointerPosition();
    if (!sourcePort || !pointer) return null;
    return this.buildBezierPath(sourcePort.x, sourcePort.y, pointer.x, pointer.y);
  });

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  ngOnInit(): void {
    if (this.wireDrawService) {
      this.wireDrawService.setValidator((sourcePort, targetPort) => {
        const edges = this.edges();
        const nodeIds = Array.from(this.nodes().keys());

        // Extract node IDs from port IDs (format: "nodeId-source" / "nodeId-target")
        const sourceNodeId = sourcePort.id.replace(/-source$/, '');
        const targetNodeId = targetPort.id.replace(/-target$/, '');

        // Check would-create-cycle
        return !wouldCreateCycle(
          edges,
          { sourceId: sourceNodeId, targetId: targetNodeId },
          nodeIds,
        );
      });
    }
  }

  ngOnDestroy(): void {
    this.wireDrawService?.reset();
  }

  // ---------------------------------------------------------------------------
  // Color helpers
  // ---------------------------------------------------------------------------

  getNodeColor(type: ReactorNodeType): string {
    return EXTENDED_NODE_COLORS[type] ?? '#3B82F6';
  }

  hasCurrentValue(node: RuntimeReactorNode): boolean {
    return 'currentValue' in node;
  }

  getCurrentValue(node: RuntimeReactorNode): string {
    if ('currentValue' in node) {
      return String((node as { currentValue: string | number | boolean }).currentValue);
    }
    return '';
  }

  hasTargetPort(node: RuntimeReactorNode): boolean {
    return node.type !== 'signal';
  }

  // ---------------------------------------------------------------------------
  // Port position helpers (absolute SVG coordinates)
  // ---------------------------------------------------------------------------

  getSourcePortX(node: RuntimeReactorNode): number {
    return node.position.x + NODE_WIDTH;
  }

  getSourcePortY(node: RuntimeReactorNode): number {
    return node.position.y + PORT_RADIUS_OFFSET;
  }

  getTargetPortX(node: RuntimeReactorNode): number {
    return node.position.x;
  }

  getTargetPortY(node: RuntimeReactorNode): number {
    return node.position.y + PORT_RADIUS_OFFSET;
  }

  // ---------------------------------------------------------------------------
  // Port state helpers
  // ---------------------------------------------------------------------------

  isPortActive(portId: string): boolean {
    return this.wireDrawService?.activeSourcePort()?.id === portId;
  }

  isSourceConnected(nodeId: string): boolean {
    return this.edges().some(e => e.sourceId === nodeId);
  }

  isTargetConnected(nodeId: string): boolean {
    return this.edges().some(e => e.targetId === nodeId);
  }

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------

  onNodeClick(event: Event, nodeId: string): void {
    event.stopPropagation();
    this.nodeSelected.emit(nodeId);
  }

  onNodePointerDown(event: PointerEvent, node: RuntimeReactorNode): void {
    event.stopPropagation();
    event.preventDefault();
    this.draggingNodeId = node.id;
    this.dragStartClientX = event.clientX;
    this.dragStartClientY = event.clientY;
    this.dragStartNodeX = node.position.x;
    this.dragStartNodeY = node.position.y;

    const svgEl = this.canvasSvgRef()?.nativeElement;
    if (svgEl) {
      try { svgEl.setPointerCapture(event.pointerId); } catch { /* JSDOM fallback */ }
    }
  }

  onPointerMove(event: PointerEvent): void {
    if (this.draggingNodeId) {
      // Node drag in progress - handled on pointerup
      return;
    }
    // Wire drawing pointer update
    if (this.wireDrawService && this.wireDrawService.phase() === 'drawing') {
      const svgCoords = this.mouseToSvg(event);
      this.wireDrawService.updatePointer(svgCoords);
    }
  }

  onPointerUp(event: PointerEvent): void {
    if (this.draggingNodeId) {
      const deltaX = event.clientX - this.dragStartClientX;
      const deltaY = event.clientY - this.dragStartClientY;
      this.nodeMoved.emit({
        nodeId: this.draggingNodeId,
        newPosition: {
          x: this.dragStartNodeX + deltaX,
          y: this.dragStartNodeY + deltaY,
        },
      });
      this.draggingNodeId = null;

      const svgEl = this.canvasSvgRef()?.nativeElement;
      if (svgEl) {
        try { svgEl.releasePointerCapture(event.pointerId); } catch { /* already released */ }
      }
    }
  }

  onPointerCancel(event: PointerEvent): void {
    if (this.draggingNodeId) {
      this.draggingNodeId = null;
      const svgEl = this.canvasSvgRef()?.nativeElement;
      if (svgEl) {
        try { svgEl.releasePointerCapture(event.pointerId); } catch { /* already released */ }
      }
    }
  }

  onWireRightClick(event: MouseEvent, sourceId: string, targetId: string): void {
    event.preventDefault();
    this.edgeRemoved.emit({ sourceId, targetId });
  }

  onCanvasDrop(result: DropResult): void {
    if (!result.accepted) return;
    const type = result.data as ReactorNodeType;
    // Use center of canvas as fallback position since we can't get mouse coordinates from DropResult
    this.nodeAdded.emit({ type, position: { x: 100, y: 100 } });
  }

  onSvgMouseMove(event: MouseEvent): void {
    if (this.wireDrawService && this.wireDrawService.phase() === 'drawing') {
      const svgCoords = this.mouseToSvg(event);
      this.wireDrawService.updatePointer(svgCoords);
    }
  }

  onPortActivated(_portId: string): void {
    if (!this.wireDrawService) return;

    // If wire was just completed, intercept the result
    const result = this.wireDrawService.lastResult();
    if (result && result.accepted) {
      const sourceNodeId = result.sourcePortId.replace(/-source$/, '');
      const targetNodeId = result.targetPortId.replace(/-target$/, '');
      this.edgeAdded.emit({ sourceId: sourceNodeId, targetId: targetNodeId });
    }
  }

  // Zoom via mouse wheel
  onWheel(event: WheelEvent): void {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.1 : 0.1;
    this.zoomLevel.update(z => Math.max(0.3, Math.min(3, z + delta)));
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  buildBezierPath(startX: number, startY: number, endX: number, endY: number): string {
    const dx = Math.abs(endX - startX) * 0.4;
    const cp1x = startX + dx;
    const cp1y = startY;
    const cp2x = endX - dx;
    const cp2y = endY;
    return `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
  }

  private mouseToSvg(event: MouseEvent): { x: number; y: number } {
    const svgEl = this.canvasSvgRef()?.nativeElement;
    if (!svgEl) return { x: 0, y: 0 };
    const ctm = svgEl.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const point = svgEl.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const svgPoint = point.matrixTransform(ctm.inverse());
    return { x: svgPoint.x, y: svgPoint.y };
  }
}
