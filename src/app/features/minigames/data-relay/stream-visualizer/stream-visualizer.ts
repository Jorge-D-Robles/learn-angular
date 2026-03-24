import { Component, computed, input, output } from '@angular/core';
import { DropZoneDirective } from '../../../../shared/directives/drop-zone.directive';
import {
  PIPE_CATEGORY_COLORS,
  type PipeBlock,
  type PipeCategory,
  type PipeDefinition,
  type RuntimeStream,
  type StreamResult,
} from '../data-relay.types';
import type { DropResult } from '../../../../core/minigame/drag-drop.service';

@Component({
  selector: 'app-data-relay-stream-visualizer',
  imports: [DropZoneDirective],
  templateUrl: './stream-visualizer.html',
  styleUrl: './stream-visualizer.scss',
})
export class DataRelayStreamVisualizerComponent {
  // Inputs
  readonly streams = input.required<readonly RuntimeStream[]>();
  readonly streamResultMap = input.required<Map<string, StreamResult>>();
  readonly placementFeedback = input.required<{ streamId: string; type: 'success' | 'error' } | null>();
  readonly availablePipes = input.required<readonly PipeDefinition[]>();

  // Outputs
  readonly pipeSlotClicked = output<{ streamId: string; pipeBlock: PipeBlock }>();
  readonly pipeSlotRightClicked = output<{ streamId: string; pipeBlockId: string }>();
  readonly pipeDragTarget = output<{ dropResult: DropResult; streamId: string }>();

  // Build a pipeType -> category lookup from availablePipes
  private readonly pipeCategoryMap = computed(() => {
    const map = new Map<string, PipeCategory>();
    for (const pipe of this.availablePipes()) {
      map.set(pipe.pipeName, pipe.category);
    }
    return map;
  });

  getPipeBlockColor(block: PipeBlock): string {
    const category = this.pipeCategoryMap().get(String(block.pipeType)) ?? 'text';
    return PIPE_CATEGORY_COLORS[category];
  }

  getStreamResult(streamId: string): StreamResult | undefined {
    return this.streamResultMap().get(streamId);
  }

  onPipeClicked(streamId: string, block: PipeBlock): void {
    this.pipeSlotClicked.emit({ streamId, pipeBlock: block });
  }

  onPipeRightClicked(event: MouseEvent, streamId: string, pipeBlockId: string): void {
    event.preventDefault();
    this.pipeSlotRightClicked.emit({ streamId, pipeBlockId });
  }

  onDrop(dropResult: DropResult, streamId: string): void {
    this.pipeDragTarget.emit({ dropResult, streamId });
  }

  /** Generate particle gap indices for a stream (one per gap between input/pipes/output). */
  getParticleGaps(stream: RuntimeStream): number[] {
    const count = stream.placedPipes.length + 1;
    return Array.from({ length: count }, (_, i) => i);
  }

  formatParams(params: readonly string[]): string {
    return params.join(', ');
  }
}
