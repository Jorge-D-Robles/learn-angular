import {
  Component,
  type ElementRef,
  computed,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { SvgPortComponent } from '../../../../shared/components/svg-port/svg-port';
import { WireDrawService } from '../../../../core/minigame/wire-draw.service';
import type { ServiceNode, ComponentNode, PowerConnection } from '../power-grid.types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VIEWBOX_WIDTH = 1000;
const VIEWBOX_HEIGHT = 600;
export const SERVICE_X = 150;
export const COMPONENT_X = 850;

// ---------------------------------------------------------------------------
// Wire descriptor interface
// ---------------------------------------------------------------------------

export interface BoardWireDescriptor {
  readonly id: string;
  readonly connectionId: string;
  readonly path: string;
  readonly color: string;
  readonly cssClass: string;
  readonly animated: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

@Component({
  selector: 'app-power-grid-board',
  imports: [SvgPortComponent],
  templateUrl: './board.html',
  styleUrl: './board.scss',
})
export class PowerGridBoardComponent {
  private readonly wireDrawService = inject(WireDrawService, { optional: true });

  readonly wireSvgRef = viewChild<ElementRef<SVGSVGElement>>('gridSvg');

  // Inputs
  readonly services = input<readonly ServiceNode[]>([]);
  readonly components = input<readonly ComponentNode[]>([]);
  readonly connections = input<readonly PowerConnection[]>([]);
  readonly wireDescriptors = input<readonly BoardWireDescriptor[]>([]);
  readonly previewColor = input('#3B82F6');
  readonly rejectionFlash = input(false);

  // Outputs
  readonly connectionRightClicked = output<string>();
  readonly mouseMoved = output<{ x: number; y: number }>();

  // Template-accessible constants
  readonly viewBox = `0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`;

  // SVG positions: services on left, components on right
  readonly servicePositions = computed(() => {
    const svcs = this.services();
    return svcs.map((svc, i) => ({
      id: svc.id,
      name: svc.name,
      x: SERVICE_X,
      y: ((i + 1) / (svcs.length + 1)) * VIEWBOX_HEIGHT,
    }));
  });

  readonly componentPositions = computed(() => {
    const cmps = this.components();
    return cmps.map((cmp, i) => ({
      id: cmp.id,
      name: cmp.name,
      requiredInjections: cmp.requiredInjections,
      x: COMPONENT_X,
      y: ((i + 1) / (cmps.length + 1)) * VIEWBOX_HEIGHT,
    }));
  });

  // Lookup map for port positions
  readonly portPositionMap = computed(() => {
    const map = new Map<string, { x: number; y: number }>();
    for (const svc of this.servicePositions()) map.set(svc.id, { x: svc.x, y: svc.y });
    for (const cmp of this.componentPositions()) map.set(cmp.id, { x: cmp.x, y: cmp.y });
    return map;
  });

  // Preview wire during drawing
  readonly previewPath = computed(() => {
    if (!this.wireDrawService || this.wireDrawService.phase() !== 'drawing') return null;
    const sourcePort = this.wireDrawService.activeSourcePort();
    const pointer = this.wireDrawService.pointerPosition();
    if (!sourcePort || !pointer) return null;
    const startPos = this.portPositionMap().get(sourcePort.id);
    if (!startPos) return null;
    return this.buildBezierPath(startPos.x, startPos.y, pointer.x, pointer.y);
  });

  // Port state helpers
  isPortActive(portId: string): boolean {
    return this.wireDrawService?.activeSourcePort()?.id === portId;
  }

  isServiceConnected(serviceId: string): boolean {
    return this.connections().some(c => c.serviceId === serviceId);
  }

  isComponentConnected(componentId: string): boolean {
    return this.connections().some(c => c.componentId === componentId);
  }

  // Event handlers
  onMouseMove(event: MouseEvent): void {
    if (!this.wireDrawService || this.wireDrawService.phase() !== 'drawing') return;
    const svgCoords = this.mouseToSvg(event);
    this.mouseMoved.emit(svgCoords);
  }

  onConnectionRightClick(event: MouseEvent, connectionId: string): void {
    event.preventDefault();
    this.connectionRightClicked.emit(connectionId);
  }

  // --- Private helpers ---

  buildBezierPath(startX: number, startY: number, endX: number, endY: number): string {
    const dx = Math.abs(endX - startX) * 0.4;
    const cp1x = startX + dx;
    const cp1y = startY;
    const cp2x = endX - dx;
    const cp2y = endY;
    return `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
  }

  private mouseToSvg(event: MouseEvent): { x: number; y: number } {
    const svgEl = this.wireSvgRef()?.nativeElement;
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
