import {
  Component,
  type ElementRef,
  OnDestroy,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { SvgPortComponent } from '../../../shared/components/svg-port/svg-port';
import { MINIGAME_ENGINE } from '../../../core/minigame/minigame-engine.tokens';
import { WireDrawService } from '../../../core/minigame/wire-draw.service';
import { KeyboardShortcutService } from '../../../core/minigame/keyboard-shortcut.service';
import {
  isSourceTargetCompatible,
  WIRE_TYPE_COLORS,
  WireType,
  type SourcePort,
  type TargetPort,
} from './wire-protocol.types';
import type { WireProtocolEngine } from './wire-protocol.engine';
import { BindingTypeSelectorComponent, WIRE_TYPE_OPTIONS } from './binding-type-selector/binding-type-selector';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VIEWBOX_WIDTH = 1000;
const VIEWBOX_HEIGHT = 600;
const PANEL_PADDING = 40;
const REJECTION_FLASH_MS = 400;
const FEEDBACK_CLEAR_MS = 1500;

@Component({
  selector: 'app-wire-protocol',
  imports: [SvgPortComponent, BindingTypeSelectorComponent],
  templateUrl: './wire-protocol.component.html',
  styleUrl: './wire-protocol.component.scss',
})
export class WireProtocolComponent implements OnDestroy {
  private readonly engine = inject(MINIGAME_ENGINE, { optional: true }) as WireProtocolEngine | null;
  private readonly wireDrawService = inject(WireDrawService);
  private readonly shortcuts = inject(KeyboardShortcutService);

  // ViewChild for SVG element (mouse-to-SVG conversion)
  readonly wireSvgRef = viewChild<ElementRef<SVGSVGElement>>('wireSvg');

  // Local state
  readonly selectedWireType = signal<WireType>(WireType.interpolation);
  readonly verificationFeedback = signal<Map<string, 'correct' | 'incorrect'>>(new Map());
  readonly rejectionFlash = signal(false);
  private feedbackTimer: ReturnType<typeof setTimeout> | null = null;
  private rejectionTimer: ReturnType<typeof setTimeout> | null = null;

  // Template-accessible constants
  readonly viewBox = `0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`;
  readonly availableWireTypes = computed(() => Object.values(WireType));

  // Computed from engine (null-safe)
  readonly sourcePorts = computed(() => this.engine?.sourcePorts() ?? []);
  readonly targetPorts = computed(() => this.engine?.targetPorts() ?? []);
  readonly wires = computed(() => this.engine?.wires() ?? []);
  readonly verificationsRemaining = computed(() => this.engine?.verificationsRemaining() ?? 0);

  // Port SVG positions (converted from percentage to viewBox coords)
  readonly sourcePortPositions = computed(() =>
    this.sourcePorts().map(p => ({
      id: p.id,
      x: PANEL_PADDING,
      y: p.position.y / 100 * VIEWBOX_HEIGHT,
    })),
  );
  readonly targetPortPositions = computed(() =>
    this.targetPorts().map(p => ({
      id: p.id,
      x: VIEWBOX_WIDTH - PANEL_PADDING,
      y: p.position.y / 100 * VIEWBOX_HEIGHT,
    })),
  );

  // Build a lookup map for port SVG positions (used by wireDescriptors)
  private readonly portPositionMap = computed(() => {
    const map = new Map<string, { x: number; y: number }>();
    for (const p of this.sourcePortPositions()) map.set(p.id, { x: p.x, y: p.y });
    for (const p of this.targetPortPositions()) map.set(p.id, { x: p.x, y: p.y });
    return map;
  });

  // Wire descriptors for SVG rendering
  readonly wireDescriptors = computed(() => {
    const posMap = this.portPositionMap();
    const feedback = this.verificationFeedback();
    return this.wires().map(wire => {
      const start = posMap.get(wire.sourcePortId);
      const end = posMap.get(wire.targetPortId);
      if (!start || !end) return null;
      const color = WIRE_TYPE_COLORS[wire.wireType];
      const feedbackStatus = feedback.get(wire.id);
      const cssClass = feedbackStatus === 'correct' ? 'wire-protocol__wire--correct'
                     : feedbackStatus === 'incorrect' ? 'wire-protocol__wire--incorrect'
                     : '';
      return {
        id: wire.id,
        path: this.buildBezierPath(start.x, start.y, end.x, end.y),
        color,
        cssClass,
        animated: !feedbackStatus,
      };
    }).filter(d => d !== null);
  });

  // Preview wire during drawing
  readonly previewPath = computed(() => {
    if (this.wireDrawService.phase() !== 'drawing') return null;
    const sourcePort = this.wireDrawService.activeSourcePort();
    const pointer = this.wireDrawService.pointerPosition();
    if (!sourcePort || !pointer) return null;
    const startPos = this.portPositionMap().get(sourcePort.id);
    if (!startPos) return null;
    return this.buildBezierPath(startPos.x, startPos.y, pointer.x, pointer.y);
  });

  readonly selectedWireColor = computed(() => WIRE_TYPE_COLORS[this.selectedWireType()]);

  constructor() {
    if (!this.engine) return; // inert mode

    const engine = this.engine;

    // Validator: WireValidator receives full WirePort objects, not string IDs
    this.wireDrawService.setValidator((sourcePort, targetPort) => {
      const source = engine.sourcePorts().find(p => p.id === sourcePort.id);
      const target = engine.targetPorts().find(p => p.id === targetPort.id);
      if (!source || !target) return false;
      return isSourceTargetCompatible(source, target, this.selectedWireType());
    });

    // Effect: watch lastResult for completed wires
    effect(() => {
      const result = this.wireDrawService.lastResult();
      if (!result || !result.accepted) return;

      untracked(() => {
        const actionResult = engine.submitAction({
          type: 'draw-wire',
          sourcePortId: result.sourcePortId,
          targetPortId: result.targetPortId,
          wireType: this.selectedWireType(),
        });

        if (!actionResult.valid) {
          this.rejectionFlash.set(true);
          this.rejectionTimer = setTimeout(() => this.rejectionFlash.set(false), REJECTION_FLASH_MS);
        }
      });
    });

    // Keyboard shortcuts: 1-4 for wire types, Escape to cancel
    for (const opt of WIRE_TYPE_OPTIONS) {
      this.shortcuts.register(opt.key, `Select ${opt.label}`, () => this.selectedWireType.set(opt.type));
    }
    this.shortcuts.register('escape', 'Cancel wire', () => this.wireDrawService.cancelWire());
  }

  // --- Methods ---

  onMouseMove(event: MouseEvent): void {
    if (this.wireDrawService.phase() !== 'drawing') return;
    const svgCoords = this.mouseToSvg(event);
    this.wireDrawService.updatePointer(svgCoords);
  }

  onWireRightClick(event: MouseEvent, wireId: string): void {
    event.preventDefault();
    if (!this.engine) return;
    this.engine.submitAction({ type: 'remove-wire', wireId });
  }

  onVerify(): void {
    if (!this.engine) return;
    const result = this.engine.verify();
    if (!result) return;

    const feedback = new Map<string, 'correct' | 'incorrect'>();
    for (const w of result.correctWires) feedback.set(w.id, 'correct');
    for (const w of result.incorrectWires) feedback.set(w.id, 'incorrect');
    this.verificationFeedback.set(feedback);

    if (this.feedbackTimer) clearTimeout(this.feedbackTimer);
    this.feedbackTimer = setTimeout(() => this.verificationFeedback.set(new Map()), FEEDBACK_CLEAR_MS);
  }

  selectWireType(type: WireType): void {
    this.selectedWireType.set(type);
  }

  isPortConnected(portId: string): boolean {
    return this.wires().some(w => w.sourcePortId === portId || w.targetPortId === portId);
  }

  isPortActive(portId: string): boolean {
    const activeSource = this.wireDrawService.activeSourcePort();
    return activeSource?.id === portId;
  }

  portSvgX(side: 'source' | 'target'): number {
    return side === 'source' ? PANEL_PADDING : VIEWBOX_WIDTH - PANEL_PADDING;
  }

  portSvgY(port: SourcePort | TargetPort): number {
    return port.position.y / 100 * VIEWBOX_HEIGHT;
  }

  ngOnDestroy(): void {
    if (this.feedbackTimer) clearTimeout(this.feedbackTimer);
    if (this.rejectionTimer) clearTimeout(this.rejectionTimer);
    for (const opt of WIRE_TYPE_OPTIONS) this.shortcuts.unregister(opt.key);
    this.shortcuts.unregister('escape');
    this.wireDrawService.reset();
  }

  // --- Private helpers ---

  private buildBezierPath(startX: number, startY: number, endX: number, endY: number): string {
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
