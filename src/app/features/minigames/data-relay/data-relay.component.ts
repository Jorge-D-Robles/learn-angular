import {
  Component,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DraggableDirective } from '../../../shared/directives/draggable.directive';
import { DataRelayStreamVisualizerComponent } from './stream-visualizer/stream-visualizer';
import { MINIGAME_ENGINE } from '../../../core/minigame/minigame-engine.tokens';
import { KeyboardShortcutService } from '../../../core/minigame/keyboard-shortcut.service';
import { DataRelayTransformServiceImpl } from './data-relay-transform.service';
import type { DataRelayEngine } from './data-relay.engine';
import {
  PIPE_CATEGORY_COLORS,
  type PipeBlock,
  type PipeCategory,
  type PipeDefinition,
  type StreamResult,
} from './data-relay.types';
import type { DropResult } from '../../../core/minigame/drag-drop.service';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FEEDBACK_DURATION_MS = 400;

// Re-export for backward compatibility (consumed by pipe-config and barrel)
export { PIPE_CATEGORY_COLORS } from './data-relay.types';

@Component({
  selector: 'app-data-relay',
  imports: [DraggableDirective, DataRelayStreamVisualizerComponent],
  providers: [DataRelayTransformServiceImpl],
  templateUrl: './data-relay.component.html',
  styleUrl: './data-relay.component.scss',
})
export class DataRelayComponent implements OnDestroy {
  private readonly engine = inject(MINIGAME_ENGINE, { optional: true }) as DataRelayEngine | null;
  private readonly shortcuts = inject(KeyboardShortcutService);

  // Local state signals
  readonly selectedCategory = signal<PipeCategory | 'all'>('all');
  readonly selectedPipeBlock = signal<{ streamId: string; pipeBlock: PipeBlock } | null>(null);
  readonly editingParams = signal<string[]>([]);
  readonly placementFeedback = signal<{ streamId: string; type: 'success' | 'error' } | null>(null);
  private pipeBlockCounter = 0;
  private feedbackTimer: ReturnType<typeof setTimeout> | null = null;

  // Computed signals from engine (null-safe)
  readonly streams = computed(() => this.engine?.streams() ?? []);
  readonly availablePipes = computed(() => this.engine?.availablePipes() ?? []);
  readonly transformResult = computed(() => this.engine?.transformResult() ?? null);
  readonly runCount = computed(() => this.engine?.runCount() ?? 0);

  readonly filteredPipes = computed(() => {
    const pipes = this.availablePipes();
    const category = this.selectedCategory();
    if (category === 'all') return pipes;
    return pipes.filter(p => p.category === category);
  });

  readonly categories = computed(() => {
    const pipes = this.availablePipes();
    const cats = new Set<PipeCategory>();
    for (const p of pipes) cats.add(p.category);
    return [...cats];
  });

  readonly streamResultMap = computed(() => {
    const result = this.transformResult();
    if (!result) return new Map<string, StreamResult>();
    const map = new Map<string, StreamResult>();
    for (const sr of result.streamResults) map.set(sr.streamId, sr);
    return map;
  });

  readonly engineStatus = computed(() => this.engine?.status() ?? null);

  constructor() {
    if (!this.engine) return; // inert mode

    // Keyboard shortcuts
    this.shortcuts.register('r', 'Run transform', () => this.onRun());
    this.shortcuts.register('escape', 'Cancel / Close config', () => this.closeConfig());
    this.shortcuts.register('1', 'Category: all', () => this.selectCategory('all'));
    this.shortcuts.register('2', 'Category: text', () => this.selectCategoryByIndex(1));
    this.shortcuts.register('3', 'Category: number', () => this.selectCategoryByIndex(2));
    this.shortcuts.register('4', 'Category: date', () => this.selectCategoryByIndex(3));
  }

  // --- Public methods ---

  selectCategory(category: PipeCategory | 'all'): void {
    this.selectedCategory.set(category);
  }

  onPipePlaced(dropResult: DropResult, streamId: string): void {
    if (!this.engine || !dropResult.accepted) return;
    const pipeDefData = dropResult.data as PipeDefinition;

    const stream = this.streams().find(s => s.streamId === streamId);
    if (!stream) return;

    const position = stream.placedPipes.length;
    const pipeBlockId = this.generatePipeBlockId();

    const actionResult = this.engine.submitAction({
      type: 'place-pipe',
      streamId,
      pipeDefinitionId: pipeDefData.id,
      pipeBlockId,
      position,
    });

    if (this.feedbackTimer) {
      clearTimeout(this.feedbackTimer);
      this.feedbackTimer = null;
    }
    this.placementFeedback.set({
      streamId,
      type: actionResult.valid ? 'success' : 'error',
    });
    this.feedbackTimer = setTimeout(() => {
      this.placementFeedback.set(null);
    }, FEEDBACK_DURATION_MS);
  }

  onPipeClicked(streamId: string, pipeBlock: PipeBlock): void {
    this.selectedPipeBlock.set({ streamId, pipeBlock });
    this.editingParams.set([...pipeBlock.params]);
  }

  onParamsChanged(params: string[]): void {
    const selected = this.selectedPipeBlock();
    if (!selected || !this.engine) return;

    this.engine.submitAction({
      type: 'configure-pipe',
      streamId: selected.streamId,
      pipeBlockId: selected.pipeBlock.id,
      params,
    });
    this.closeConfig();
  }

  closeConfig(): void {
    this.selectedPipeBlock.set(null);
    this.editingParams.set([]);
  }

  onPipeRemoved(streamId: string, pipeBlockId: string): void {
    if (!this.engine) return;
    this.engine.submitAction({
      type: 'remove-pipe',
      streamId,
      pipeBlockId,
    });
  }

  onRun(): void {
    if (!this.engine) return;
    this.engine.runTransform();
  }

  getCategoryColor(category: PipeCategory): string {
    return PIPE_CATEGORY_COLORS[category] ?? '#94A3B8';
  }

  generatePipeBlockId(): string {
    return 'pb-' + (++this.pipeBlockCounter);
  }

  ngOnDestroy(): void {
    this.shortcuts.unregister('r');
    this.shortcuts.unregister('escape');
    this.shortcuts.unregister('1');
    this.shortcuts.unregister('2');
    this.shortcuts.unregister('3');
    this.shortcuts.unregister('4');
    if (this.feedbackTimer) {
      clearTimeout(this.feedbackTimer);
      this.feedbackTimer = null;
    }
  }

  // --- Private helpers ---

  private selectCategoryByIndex(index: number): void {
    const cats = this.categories();
    if (index - 1 < cats.length) {
      this.selectedCategory.set(cats[index - 1]);
    }
  }
}
