import {
  Component,
  OnDestroy,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { DraggableDirective } from '../../../shared/directives/draggable.directive';
import { DropZoneDirective } from '../../../shared/directives/drop-zone.directive';
import { MINIGAME_ENGINE } from '../../../core/minigame/minigame-engine.tokens';
import { KeyboardShortcutService } from '../../../core/minigame/keyboard-shortcut.service';
import { MinigameStatus } from '../../../core/minigame/minigame.types';
import type { DropResult } from '../../../core/minigame/drag-drop.service';
import { ConveyorBeltService } from './conveyor-belt.service';
import type { ModuleAssemblyEngine } from './module-assembly.engine';
import {
  PART_SLOT_COLORS,
  canPartFitSlot,
  type BlueprintSlot,
  type ComponentPart,
  type PartSlotType,
} from './module-assembly.types';

@Component({
  selector: 'app-module-assembly',
  imports: [DraggableDirective, DropZoneDirective],
  providers: [ConveyorBeltService],
  template: `
    <div class="module-assembly">
      <!-- Conveyor Belt -->
      <div class="belt" [style.width.px]="beltService.beltLength()">
        @for (bp of visibleBeltParts(); track bp.part.id) {
          <div class="belt__part"
               [nxDraggable]="bp.part.id"
               [nxDraggableData]="bp.part"
               [style.transform]="'translateX(' + bp.x + 'px)'"
               [style.borderColor]="getPartColor(bp.part.type)"
               [class.belt__part--correct]="feedbackState()?.partId === bp.part.id && feedbackState()?.type === 'correct'"
               [class.belt__part--incorrect]="feedbackState()?.partId === bp.part.id && feedbackState()?.type === 'incorrect'"
               (dblclick)="onPartDoubleClick(bp.part.id)">
            <span class="belt__part-label">{{ bp.part.type }}</span>
            <code class="belt__part-content">{{ bp.part.content }}</code>
          </div>
        }
      </div>

      <!-- Blueprint -->
      <div class="blueprint" [class.blueprint--complete]="completionGlow()">
        <h3 class="blueprint__name">{{ blueprintName() }}</h3>
        @for (slot of blueprintSlots(); track slot.id; let idx = $index) {
          <div class="blueprint__slot"
               [nxDropZone]="slot.id"
               [nxDropZonePredicate]="createSlotPredicate(slot)"
               (nxDropZoneDrop)="onSlotDrop($event, slot.id)"
               [class.blueprint__slot--filled]="isSlotFilled(slot.id)"
               [class.blueprint__slot--required]="slot.isRequired"
               [style.borderColor]="getPartColor(slot.slotType)">
            <span class="blueprint__slot-label">{{ slot.label }}</span>
            <span class="blueprint__slot-number">{{ idx + 1 }}</span>
            @if (getFilledPart(slot.id); as part) {
              <code class="blueprint__slot-content">{{ part.content }}</code>
            }
          </div>
        }
      </div>
    </div>
  `,
  styleUrl: './module-assembly.component.scss',
})
export class ModuleAssemblyComponent implements OnDestroy {
  // --- Injections ---
  private readonly engine = inject(MINIGAME_ENGINE, { optional: true }) as ModuleAssemblyEngine | null;
  readonly beltService = inject(ConveyorBeltService);
  private readonly shortcuts = inject(KeyboardShortcutService);

  // --- Local state ---
  readonly feedbackState = signal<{ partId: string; type: 'correct' | 'incorrect' } | null>(null);
  readonly completionGlow = signal(false);
  private animFrameId: number | null = null;
  private lastTimestamp = 0;
  private feedbackTimer: ReturnType<typeof setTimeout> | null = null;

  // --- Computed (null-safe, inert when engine is null) ---
  readonly blueprintName = computed(() => this.engine?.blueprint().name ?? '');
  readonly blueprintSlots = computed(() => this.engine?.blueprint().slots ?? []);
  readonly filledSlots = computed(() => this.engine?.filledSlots() ?? new Map<string, ComponentPart>());
  readonly visibleBeltParts = computed(() =>
    this.beltService.parts().filter(bp =>
      bp.x > -100 && bp.x < this.beltService.beltLength() + 200
    ),
  );

  constructor() {
    if (!this.engine) return; // Inert mode -- no effects, no shortcuts
    const eng = this.engine;

    // Effect: start/stop animation loop AND initialize belt on level load.
    // Belt init is imperative (NOT a reactive effect on beltParts), because
    // the engine mutates _beltParts on every correct placement/rejection.
    // A reactive effect would re-stagger all remaining parts mid-play.
    let beltInitialized = false;
    effect(() => {
      const status = eng.status();
      untracked(() => {
        if (status === MinigameStatus.Playing) {
          if (!beltInitialized) {
            // First transition to Playing after load/retry -- init belt
            this.beltService.reset([...eng.beltParts()], eng.beltSpeed());
            beltInitialized = true;
          }
          this.startAnimLoop();
        } else {
          this.stopAnimLoop();
          // Reset flag on terminal/loading states so retry re-inits the belt
          if (status !== MinigameStatus.Paused) {
            beltInitialized = false;
          }
        }
      });
    });

    // Effect: detect completion -> trigger glow
    effect(() => {
      if (eng.status() === MinigameStatus.Won) {
        this.completionGlow.set(true);
      }
    });

    this.registerKeyboardShortcuts();
  }

  // --- Animation loop ---

  private startAnimLoop(): void {
    if (this.animFrameId !== null) return;
    const loop = (timestamp: number) => {
      if (this.lastTimestamp > 0) {
        const dt = (timestamp - this.lastTimestamp) / 1000;
        this.beltService.tick(dt);
      }
      this.lastTimestamp = timestamp;
      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  private stopAnimLoop(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.lastTimestamp = 0; // Prevent delta spike on resume
  }

  // --- Drop handler (called from template's nxDropZoneDrop event) ---

  onSlotDrop(result: DropResult, slotId: string): void {
    const part = result.data as ComponentPart;
    this.placePart(part, slotId);
  }

  // --- Core placement logic (shared by drag-drop and keyboard) ---

  private placePart(part: ComponentPart, slotId: string): void {
    if (!this.engine) return;
    const actionResult = this.engine.submitAction({
      type: 'place-part',
      partId: part.id,
      targetSlotId: slotId,
    });

    if (actionResult.valid) {
      this.beltService.removePart(part.id); // Sync visual state
      this.showFeedback(part.id, 'correct');
    } else {
      this.showFeedback(part.id, 'incorrect');
    }
  }

  // --- Decoy rejection ---

  onPartDoubleClick(partId: string): void {
    if (!this.engine) return;
    const actionResult = this.engine.submitAction({
      type: 'reject-decoy',
      partId,
    });

    if (actionResult.valid) {
      this.beltService.removePart(partId);
      this.showFeedback(partId, 'correct');
    } else {
      this.showFeedback(partId, 'incorrect');
    }
  }

  // --- Helpers ---

  createSlotPredicate(slot: BlueprintSlot): (data: unknown) => boolean {
    // Static closure -- safe because slot.slotType is readonly and predicate
    // is captured at ngOnInit by DropZoneDirective (never re-evaluated).
    return (data: unknown) => canPartFitSlot(data as ComponentPart, slot);
  }

  isSlotFilled(slotId: string): boolean {
    return this.filledSlots().has(slotId);
  }

  getFilledPart(slotId: string): ComponentPart | undefined {
    return this.filledSlots().get(slotId);
  }

  getPartColor(type: PartSlotType): string {
    return PART_SLOT_COLORS[type];
  }

  private showFeedback(partId: string, type: 'correct' | 'incorrect'): void {
    this.feedbackState.set({ partId, type });
    if (this.feedbackTimer) clearTimeout(this.feedbackTimer);
    this.feedbackTimer = setTimeout(() => this.feedbackState.set(null), 500);
  }

  // --- Keyboard ---

  private readonly SHORTCUT_KEYS = ['1', '2', '3', '4', '5', '6', ' '];

  private registerKeyboardShortcuts(): void {
    // Number keys 1-6 select slot by index
    for (let i = 1; i <= 6; i++) {
      const key = String(i);
      this.shortcuts.register(key, `Select slot ${i}`, () => {
        const slots = this.blueprintSlots();
        if (i <= slots.length) {
          const frontPart = this.visibleBeltParts()[0];
          if (frontPart) {
            this.placePart(frontPart.part, slots[i - 1].id);
          }
        }
      });
    }
    // Spacebar grabs frontmost belt part (reject decoy)
    this.shortcuts.register(' ', 'Reject decoy', () => {
      const frontPart = this.visibleBeltParts()[0];
      if (frontPart) {
        this.onPartDoubleClick(frontPart.part.id);
      }
    });
  }

  ngOnDestroy(): void {
    this.stopAnimLoop();
    if (this.feedbackTimer) clearTimeout(this.feedbackTimer);
    // Per-key unregister -- only remove OUR shortcuts, not the page's 'h' hint
    for (const key of this.SHORTCUT_KEYS) {
      this.shortcuts.unregister(key);
    }
  }
}
