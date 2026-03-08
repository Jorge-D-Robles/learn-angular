import { Component, input } from '@angular/core';

export interface WireDescriptor {
  readonly id: string;
  readonly startX: number;
  readonly startY: number;
  readonly endX: number;
  readonly endY: number;
  readonly color: string;
  readonly animated: boolean;
}

@Component({
  selector: 'nx-svg-wire-renderer',
  template: `
    <svg width="100%" height="100%" aria-hidden="true">
      @for (wire of wires(); track wire.id) {
        <path
          class="svg-wire__path"
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
  readonly wires = input<readonly WireDescriptor[]>([]);

  buildPath(wire: WireDescriptor): string {
    const dx = Math.abs(wire.endX - wire.startX) * 0.4;
    const cp1x = wire.startX + dx;
    const cp1y = wire.startY;
    const cp2x = wire.endX - dx;
    const cp2y = wire.endY;
    return `M ${wire.startX} ${wire.startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${wire.endX} ${wire.endY}`;
  }
}
