import {
  Component,
  OnDestroy,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { MINIGAME_ENGINE } from '../../../core/minigame/minigame-engine.tokens';
import { WireDrawService } from '../../../core/minigame/wire-draw.service';
import { KeyboardShortcutService } from '../../../core/minigame/keyboard-shortcut.service';
import { PowerGridBoardComponent, type BoardWireDescriptor } from './board/board';
import type { PowerGridEngine } from './power-grid.engine';
import type { InjectionScope } from './power-grid.types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VIEWBOX_HEIGHT = 600;
const SERVICE_X = 150;
const COMPONENT_X = 850;
const REJECTION_FLASH_MS = 400;

export const SCOPE_COLORS: Record<InjectionScope, string> = {
  root: '#3B82F6',       // Reactor Blue
  component: '#22C55E',  // Sensor Green
  hierarchical: '#F97316', // Alert Orange
};

@Component({
  selector: 'app-power-grid',
  imports: [PowerGridBoardComponent],
  templateUrl: './power-grid.component.html',
  styleUrl: './power-grid.component.scss',
})
export class PowerGridComponent implements OnDestroy {
  private readonly engine = inject(MINIGAME_ENGINE, { optional: true }) as PowerGridEngine | null;
  private readonly wireDrawService = inject(WireDrawService);
  private readonly shortcuts = inject(KeyboardShortcutService);

  // Local state
  readonly selectedScope = signal<InjectionScope>('root');
  readonly verificationFeedback = signal<Map<string, 'correct' | 'wrong-pair' | 'wrong-scope'>>(new Map());
  readonly rejectionFlash = signal(false);
  private rejectionTimer: ReturnType<typeof setTimeout> | null = null;

  // Scope selector options (used by template)
  readonly scopeOptions = [
    { key: '1', value: 'root' as InjectionScope, label: 'Root', color: SCOPE_COLORS.root },
    { key: '2', value: 'component' as InjectionScope, label: 'Component', color: SCOPE_COLORS.component },
    { key: '3', value: 'hierarchical' as InjectionScope, label: 'Hierarchical', color: SCOPE_COLORS.hierarchical },
  ];

  // Computed from engine (null-safe)
  readonly services = computed(() => this.engine?.services() ?? []);
  readonly components = computed(() => this.engine?.components() ?? []);
  readonly connections = computed(() => this.engine?.connections() ?? []);
  readonly verificationsRemaining = computed(() => this.engine?.verificationsRemaining() ?? 0);

  // Port position map (needed for wire descriptor computation)
  private readonly servicePositions = computed(() => {
    const svcs = this.services();
    return svcs.map((svc, i) => ({
      id: svc.id,
      x: SERVICE_X,
      y: ((i + 1) / (svcs.length + 1)) * VIEWBOX_HEIGHT,
    }));
  });

  private readonly componentPositions = computed(() => {
    const cmps = this.components();
    return cmps.map((cmp, i) => ({
      id: cmp.id,
      x: COMPONENT_X,
      y: ((i + 1) / (cmps.length + 1)) * VIEWBOX_HEIGHT,
    }));
  });

  private readonly portPositionMap = computed(() => {
    const map = new Map<string, { x: number; y: number }>();
    for (const svc of this.servicePositions()) map.set(svc.id, { x: svc.x, y: svc.y });
    for (const cmp of this.componentPositions()) map.set(cmp.id, { x: cmp.x, y: cmp.y });
    return map;
  });

  // Wire descriptors with scope-based colors and feedback status
  readonly wireDescriptors = computed<readonly BoardWireDescriptor[]>(() => {
    const positions = this.portPositionMap();
    const feedback = this.verificationFeedback();
    return this.connections().map(conn => {
      const source = positions.get(conn.serviceId);
      const target = positions.get(conn.componentId);
      const feedbackStatus = feedback.get(conn.id);
      return {
        id: conn.id,
        connectionId: conn.id,
        path: source && target ? this.buildBezierPath(source.x, source.y, target.x, target.y) : '',
        color: feedbackStatus === 'correct' ? SCOPE_COLORS[conn.scope]
             : feedbackStatus ? '#EF4444'
             : SCOPE_COLORS[conn.scope],
        cssClass: feedbackStatus ? `power-grid-board__wire--${feedbackStatus}` : 'power-grid-board__wire',
        animated: feedbackStatus === 'correct' || !feedbackStatus,
      };
    });
  });

  // Selected scope color for preview wire
  readonly selectedScopeColor = computed(() => SCOPE_COLORS[this.selectedScope()]);

  constructor() {
    if (!this.engine) return; // inert mode

    const engine = this.engine;

    // Validator: check that target component requires the source service
    this.wireDrawService.setValidator((sourcePort, targetPort) => {
      const component = this.components().find(c => c.id === targetPort.id);
      const service = this.services().find(s => s.id === sourcePort.id);
      if (!component || !service) return false;
      return component.requiredInjections.includes(service.id);
    });

    // Effect: watch lastResult for completed wires
    effect(() => {
      const result = this.wireDrawService.lastResult();
      if (!result || !result.accepted) return;

      untracked(() => {
        const actionResult = engine.submitAction({
          type: 'connect-service',
          serviceId: result.sourcePortId,
          componentId: result.targetPortId,
          scope: this.selectedScope(),
        });

        if (!actionResult.valid) {
          this.rejectionFlash.set(true);
          this.rejectionTimer = setTimeout(() => this.rejectionFlash.set(false), REJECTION_FLASH_MS);
        }
      });
    });

    // Effect: clear verification feedback when connections change
    effect(() => {
      this.connections(); // track changes
      untracked(() => {
        if (this.verificationFeedback().size > 0) {
          this.verificationFeedback.set(new Map());
        }
      });
    });

    // Keyboard shortcuts: 1-3 for scope selection, Escape to cancel
    this.shortcuts.register('1', 'Root scope', () => this.selectedScope.set('root'));
    this.shortcuts.register('2', 'Component scope', () => this.selectedScope.set('component'));
    this.shortcuts.register('3', 'Hierarchical scope', () => this.selectedScope.set('hierarchical'));
    this.shortcuts.register('escape', 'Cancel wire', () => this.wireDrawService.cancelWire());
  }

  // --- Public methods ---

  selectScope(scope: InjectionScope): void {
    this.selectedScope.set(scope);
  }

  onVerify(): void {
    if (!this.engine) return;
    const result = this.engine.verify();
    if (!result) return;

    const feedback = new Map<string, 'correct' | 'wrong-pair' | 'wrong-scope'>();
    for (const c of result.correctConnections) feedback.set(c.id, 'correct');
    for (const sc of result.shortCircuits) feedback.set(sc.connectionId, sc.reason);
    this.verificationFeedback.set(feedback);
  }

  onBoardMouseMoved(coords: { x: number; y: number }): void {
    this.wireDrawService.updatePointer(coords);
  }

  onBoardConnectionRightClicked(connectionId: string): void {
    this.engine?.submitAction({ type: 'disconnect-service', connectionId });
  }

  ngOnDestroy(): void {
    if (this.rejectionTimer) clearTimeout(this.rejectionTimer);
    this.wireDrawService.reset();
    this.shortcuts.unregister('1');
    this.shortcuts.unregister('2');
    this.shortcuts.unregister('3');
    this.shortcuts.unregister('escape');
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
}
