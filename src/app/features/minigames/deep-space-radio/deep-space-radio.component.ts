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
import { DeepSpaceRadioRequestBuilderComponent } from './request-builder/request-builder';
import { InterceptorPipelineComponent } from './interceptor-pipeline/interceptor-pipeline';
import { DeepSpaceRadioInterceptorServiceImpl } from './deep-space-radio-interceptor.service';
import type { DeepSpaceRadioEngine, TransmitRunResult } from './deep-space-radio.engine';
import type {
  HttpRequestConfig,
  InterceptorBlock,
  InterceptorType,
} from './deep-space-radio.types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INTERCEPTOR_TYPE_LABELS: { key: string; type: InterceptorType; label: string }[] = [
  { key: '1', type: 'auth', label: 'auth' },
  { key: '2', type: 'logging', label: 'logging' },
  { key: '3', type: 'retry', label: 'retry' },
  { key: '4', type: 'error', label: 'error' },
  { key: '5', type: 'caching', label: 'caching' },
];

@Component({
  selector: 'app-deep-space-radio',
  imports: [
    DraggableDirective,
    DeepSpaceRadioRequestBuilderComponent,
    InterceptorPipelineComponent,
  ],
  providers: [DeepSpaceRadioInterceptorServiceImpl],
  templateUrl: './deep-space-radio.component.html',
  styleUrl: './deep-space-radio.component.scss',
})
export class DeepSpaceRadioComponent implements OnDestroy {
  private readonly engine = inject(MINIGAME_ENGINE, { optional: true }) as DeepSpaceRadioEngine | null;
  private readonly shortcuts = inject(KeyboardShortcutService);

  // Expose constants for template
  readonly INTERCEPTOR_TYPES = INTERCEPTOR_TYPE_LABELS;

  // Local state
  readonly selectedInterceptorType = signal<InterceptorType | 'all'>('all');
  readonly selectedInterceptorId = signal<string | null>(null);

  // Computed from engine (null-safe)
  readonly currentRequest = computed(() => this.engine?.currentRequest() ?? null);
  readonly activeChain = computed(() => this.engine?.activeChain() ?? []);
  readonly availableInterceptors = computed(() => this.engine?.availableInterceptors() ?? []);
  readonly transmitResult = computed<TransmitRunResult | null>(() => this.engine?.transmitResult() ?? null);
  readonly transmissionsRemaining = computed(() => this.engine?.transmissionsRemaining() ?? 0);
  readonly endpoints = computed(() => {
    // Expose endpoints from level data via engine for the request builder
    // The engine doesn't expose endpoints directly, but available interceptors hints at the level being loaded
    return [] as { url: string; method: string }[];
  });

  // Derived: toolbox items filtered by type and excluding placed ones
  readonly placedInterceptorIds = computed(() => new Set(this.activeChain().map(i => i.id)));

  readonly toolboxInterceptors = computed(() => {
    const available = this.availableInterceptors();
    const placed = this.placedInterceptorIds();
    const typeFilter = this.selectedInterceptorType();

    return available.filter(i => {
      if (placed.has(i.id)) return false;
      if (typeFilter !== 'all' && i.type !== typeFilter) return false;
      return true;
    });
  });

  readonly engineStatus = computed(() => this.engine?.status() ?? null);

  constructor() {
    if (!this.engine) return; // inert mode

    // Keyboard shortcuts
    this.shortcuts.register('t', 'Transmit', () => this.onTransmit());
    this.shortcuts.register('escape', 'Cancel / Close', () => this.onEscape());
    this.shortcuts.register('1', 'Auth interceptor', () => this.selectInterceptorType('auth'));
    this.shortcuts.register('2', 'Logging interceptor', () => this.selectInterceptorType('logging'));
    this.shortcuts.register('3', 'Retry interceptor', () => this.selectInterceptorType('retry'));
    this.shortcuts.register('4', 'Error interceptor', () => this.selectInterceptorType('error'));
    this.shortcuts.register('5', 'Caching interceptor', () => this.selectInterceptorType('caching'));
  }

  // --- Public methods ---

  selectInterceptorType(type: InterceptorType | 'all'): void {
    this.selectedInterceptorType.set(type);
  }

  onRequestChanged(request: HttpRequestConfig): void {
    if (!this.engine) return;
    this.engine.submitAction({ type: 'configure-request', request });
  }

  onInterceptorPlace(interceptorId: string, position: number): void {
    if (!this.engine) return;
    this.engine.submitAction({ type: 'place-interceptor', interceptorId, position });
  }

  onInterceptorRemove(interceptorId: string): void {
    if (!this.engine) return;
    this.engine.submitAction({ type: 'remove-interceptor', interceptorId });
  }

  onInterceptorClicked(interceptor: InterceptorBlock): void {
    this.selectedInterceptorId.set(interceptor.id);
  }

  onTransmit(): void {
    if (!this.engine) return;
    this.engine.transmit();
  }

  onEscape(): void {
    if (this.selectedInterceptorId()) {
      this.selectedInterceptorId.set(null);
    }
  }

  ngOnDestroy(): void {
    this.shortcuts.unregister('t');
    this.shortcuts.unregister('escape');
    this.shortcuts.unregister('1');
    this.shortcuts.unregister('2');
    this.shortcuts.unregister('3');
    this.shortcuts.unregister('4');
    this.shortcuts.unregister('5');
  }
}
