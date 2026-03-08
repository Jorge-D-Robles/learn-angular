import { Component, computed, inject, input } from '@angular/core';
import { WireDrawService, type WirePort } from '../../../core/minigame/wire-draw.service';

export interface WireDescriptor {
  readonly id: string;
  readonly startX: number;
  readonly startY: number;
  readonly endX: number;
  readonly endY: number;
  readonly color: string;
  readonly animated: boolean;
  readonly preview?: boolean;
}

@Component({
  selector: 'nx-svg-wire-renderer',
  template: `
    <svg width="100%" height="100%" aria-hidden="true">
      @for (wire of resolvedWires(); track wire.id) {
        <path
          class="svg-wire__path"
          [class.svg-wire__preview]="wire.preview"
          [attr.d]="buildPath(wire)"
          [attr.stroke]="wire.color"
          fill="none"
          stroke-width="2.5"
          stroke-linecap="round" />
        @if (wire.animated) {
          <path
            class="svg-wire__flow"
            [attr.d]="buildPath(wire)"
            stroke="rgba(255, 255, 255, 0.8)"
            fill="none"
            stroke-width="2"
            stroke-linecap="round"
            stroke-dasharray="8 12" />
        }
      }
    </svg>
  `,
  styleUrl: './svg-wire-renderer.scss',
  host: {
    class: 'svg-wire-renderer',
  },
})
export class SvgWireRendererComponent {
  private readonly wireDrawService = inject(WireDrawService, { optional: true });

  readonly wires = input<readonly WireDescriptor[]>([]);

  readonly resolvedWires = computed<readonly WireDescriptor[]>(() => {
    const inputWires = this.wires();
    const service = this.wireDrawService;
    if (!service) {
      return inputWires;
    }

    const serviceWires = this.connectionsToDescriptors(service);
    const previewWire = this.buildPreviewWire(service);

    return [
      ...serviceWires,
      ...(previewWire ? [previewWire] : []),
      ...inputWires,
    ];
  });

  private connectionsToDescriptors(service: WireDrawService): WireDescriptor[] {
    const connections = service.connections();
    const result: WireDescriptor[] = [];

    for (const conn of connections) {
      const sourcePort = service.getPort(conn.sourcePortId);
      const targetPort = service.getPort(conn.targetPortId);

      if (!sourcePort || !targetPort) {
        continue;
      }

      result.push({
        id: conn.id,
        startX: sourcePort.x,
        startY: sourcePort.y,
        endX: targetPort.x,
        endY: targetPort.y,
        color: this.resolvePortColor(sourcePort),
        animated: false,
      });
    }

    return result;
  }

  private buildPreviewWire(service: WireDrawService): WireDescriptor | null {
    if (service.phase() !== 'drawing') {
      return null;
    }

    const sourcePort = service.activeSourcePort();
    if (!sourcePort) {
      return null;
    }

    const pointer = service.pointerPosition();
    return {
      id: '__preview__',
      startX: sourcePort.x,
      startY: sourcePort.y,
      endX: pointer.x,
      endY: pointer.y,
      color: this.resolvePortColor(sourcePort),
      animated: false,
      preview: true,
    };
  }

  private resolvePortColor(port: WirePort): string {
    if (
      typeof port.data === 'object' &&
      port.data !== null &&
      'color' in port.data
    ) {
      return (port.data as Record<string, unknown>)['color'] as string;
    }
    return '#3B82F6';
  }

  buildPath(wire: WireDescriptor): string {
    const dx = Math.abs(wire.endX - wire.startX) * 0.4;
    const cp1x = wire.startX + dx;
    const cp1y = wire.startY;
    const cp2x = wire.endX - dx;
    const cp2y = wire.endY;
    return `M ${wire.startX} ${wire.startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${wire.endX} ${wire.endY}`;
  }
}
