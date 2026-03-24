import {
  Component,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MINIGAME_ENGINE } from '../../../core/minigame/minigame-engine.tokens';
import { KeyboardShortcutService } from '../../../core/minigame/keyboard-shortcut.service';
import { BlastDoorsTimelineComponent } from './timeline/timeline';
import { BlastDoorsLifecycleServiceImpl } from './blast-doors-lifecycle.service';
import type { BlastDoorsEngine, SimulationRunResult } from './blast-doors.engine';
import type {
  BehaviorBlock,
  DirectiveSpec,
  LifecycleHook,
  RuntimeBlastDoor,
} from './blast-doors.types';

@Component({
  selector: 'app-blast-doors',
  imports: [
    BlastDoorsTimelineComponent,
  ],
  providers: [BlastDoorsLifecycleServiceImpl],
  templateUrl: './blast-doors.component.html',
  styleUrl: './blast-doors.component.scss',
})
export class BlastDoorsComponent implements OnDestroy {
  private readonly engine = inject(MINIGAME_ENGINE, { optional: true }) as BlastDoorsEngine | null;
  private readonly shortcuts = inject(KeyboardShortcutService);

  // Local state
  readonly directiveMode = signal(false);

  // Computed from engine (null-safe)
  readonly runtimeDoors = computed<readonly RuntimeBlastDoor[]>(() => this.engine?.runtimeDoors() ?? []);
  readonly availableBehaviors = computed<readonly BehaviorBlock[]>(() => this.engine?.availableBehaviors() ?? []);
  readonly availableDirectives = computed<readonly DirectiveSpec[]>(() => this.engine?.availableDirectives() ?? []);
  readonly simulationResult = computed<SimulationRunResult | null>(() => this.engine?.simulationResult() ?? null);
  readonly simulationsRemaining = computed(() => this.engine?.simulationsRemaining() ?? 0);
  readonly engineStatus = computed(() => this.engine?.status() ?? null);

  constructor() {
    if (!this.engine) return; // inert mode

    // Keyboard shortcuts
    this.shortcuts.register('s', 'Simulate', () => this.onSimulate());
    this.shortcuts.register('escape', 'Cancel', () => this.onEscape());
    this.shortcuts.register('d', 'Toggle Directive Mode', () => this.onToggleDirectiveMode());
  }

  // --- Public methods ---

  onSimulate(): void {
    if (!this.engine) return;
    this.engine.simulate();
  }

  onBehaviorPlaced(event: { doorId: string; hookType: LifecycleHook; behaviorBlock: BehaviorBlock }): void {
    if (!this.engine) return;
    this.engine.submitAction({
      type: 'place-behavior',
      doorId: event.doorId,
      hookType: event.hookType,
      behaviorBlockId: event.behaviorBlock.id,
    });
  }

  onBehaviorRemoved(event: { doorId: string; hookType: LifecycleHook }): void {
    if (!this.engine) return;
    this.engine.submitAction({
      type: 'remove-behavior',
      doorId: event.doorId,
      hookType: event.hookType,
    });
  }

  onApplyDirective(doorId: string, directiveName: string): void {
    if (!this.engine) return;
    this.engine.submitAction({
      type: 'apply-directive',
      doorId,
      directiveName,
    });
  }

  onRemoveDirective(doorId: string, directiveName: string): void {
    if (!this.engine) return;
    this.engine.submitAction({
      type: 'remove-directive',
      doorId,
      directiveName,
    });
  }

  onToggleDirectiveMode(): void {
    this.directiveMode.update(v => !v);
  }

  onEscape(): void {
    if (this.directiveMode()) {
      this.directiveMode.set(false);
    }
  }

  ngOnDestroy(): void {
    this.shortcuts.unregister('s');
    this.shortcuts.unregister('escape');
    this.shortcuts.unregister('d');
  }
}
