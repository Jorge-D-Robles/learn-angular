import { Component, computed, input, output } from '@angular/core';
import type { BlastDoor, BehaviorBlock, LifecycleHook, HookSlot } from '../blast-doors.types';
import { LIFECYCLE_HOOK_ORDER } from '../blast-doors.types';

@Component({
  selector: 'app-blast-doors-timeline',
  template: `
    <div class="timeline__bar">
      @for (slot of orderedSlots(); track slot.hookType) {
        <div
          class="timeline__slot"
          [class.timeline__slot--correct]="getFeedback(slot.hookType) === 'correct'"
          [class.timeline__slot--incorrect]="getFeedback(slot.hookType) === 'incorrect'"
        >
          <span class="timeline__hook-label">{{ slot.hookType }}</span>
          @if (slot.behaviorBlock) {
            <div
              class="timeline__behavior"
              role="button"
              tabindex="0"
              (click)="onRemove(slot.hookType)"
              (keydown.enter)="onRemove(slot.hookType)"
              (keydown.space)="onRemove(slot.hookType)"
            >
              {{ slot.behaviorBlock.description }}
            </div>
          } @else {
            <div
              class="timeline__empty"
              role="button"
              tabindex="0"
              (click)="onPlace(slot.hookType)"
              (keydown.enter)="onPlace(slot.hookType)"
              (keydown.space)="onPlace(slot.hookType)"
            >
              Empty
            </div>
          }
        </div>
      }
    </div>
  `,
  styleUrl: './timeline.scss',
})
export class BlastDoorsTimelineComponent {
  // Inputs
  readonly door = input.required<BlastDoor>();
  readonly availableBehaviors = input<readonly BehaviorBlock[]>([]);
  readonly simulationFeedback = input<Map<string, 'correct' | 'incorrect'> | null>(null);

  // Outputs
  readonly behaviorPlaced = output<{ doorId: string; hookType: LifecycleHook; behaviorBlock: BehaviorBlock }>();
  readonly behaviorRemoved = output<{ doorId: string; hookType: LifecycleHook }>();

  // Computed: order slots by LIFECYCLE_HOOK_ORDER
  readonly orderedSlots = computed<readonly HookSlot[]>(() => {
    const door = this.door();
    return LIFECYCLE_HOOK_ORDER
      .map(hookType => door.hookSlots.find(s => s.hookType === hookType))
      .filter((s): s is HookSlot => s !== undefined);
  });

  getFeedback(hookType: LifecycleHook): 'correct' | 'incorrect' | null {
    const feedback = this.simulationFeedback();
    if (!feedback) return null;
    return feedback.get(hookType) ?? null;
  }

  onPlace(hookType: LifecycleHook): void {
    const behaviors = this.availableBehaviors();
    if (behaviors.length === 0) return;

    // Find the first available behavior that targets this hook
    const match = behaviors.find(b => b.hookTarget === hookType) ?? behaviors[0];
    this.behaviorPlaced.emit({
      doorId: this.door().id,
      hookType,
      behaviorBlock: match,
    });
  }

  onRemove(hookType: LifecycleHook): void {
    this.behaviorRemoved.emit({
      doorId: this.door().id,
      hookType,
    });
  }
}
