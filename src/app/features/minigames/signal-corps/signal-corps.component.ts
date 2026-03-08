import {
  Component,
  OnDestroy,
  computed,
  signal,
  inject,
} from '@angular/core';
import { MINIGAME_ENGINE } from '../../../core/minigame/minigame-engine.tokens';
import { KeyboardShortcutService } from '../../../core/minigame/keyboard-shortcut.service';
import type {
  TowerInput,
  TowerOutput,
  ParentBinding,
  InputTransform,
} from './signal-corps.types';
import { PORT_TYPE_COLORS } from './signal-corps.types';
import {
  SignalCorpsEngine,
  type PlayerTowerState,
  type DeployResult,
  type WaveResult,
} from './signal-corps.engine';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VIEWBOX_WIDTH = 1000;
const VIEWBOX_HEIGHT = 600;
const GRID_PADDING = 80;
const TOWER_SIZE = 60;
const PORT_RADIUS = 8;
const WAVE_RADIUS = 12;
const WAVE_STEP_MS = 300;
const WAVE_TOTAL_STEPS = 5;
const DAMAGE_SHAKE_MS = 500;
const RESULT_DISPLAY_MS = 2000;

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

interface AnimatingWave {
  readonly waveId: string;
  readonly startX: number;
  readonly startY: number;
  readonly endX: number;
  readonly endY: number;
  readonly currentStep: number;
  readonly totalSteps: number;
  readonly blocked: boolean;
  readonly blockedByTowerId: string | null;
  readonly damage: number;
  readonly animationComplete: boolean;
}

interface ShieldPulse {
  readonly towerId: string;
  readonly x: number;
  readonly y: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

@Component({
  selector: 'app-signal-corps',
  templateUrl: './signal-corps.component.html',
  styleUrl: './signal-corps.component.scss',
})
export class SignalCorpsComponent implements OnDestroy {
  private readonly engine = inject(MINIGAME_ENGINE, { optional: true }) as SignalCorpsEngine | null;
  private readonly shortcuts = inject(KeyboardShortcutService);

  // Local state
  readonly selectedTowerId = signal<string | null>(null);
  readonly animatingWaves = signal<readonly AnimatingWave[]>([]);
  readonly shieldPulses = signal<readonly ShieldPulse[]>([]);
  readonly damageShake = signal(false);
  private readonly pendingTimers: ReturnType<typeof setTimeout>[] = [];

  // Config panel form state
  readonly newInputName = signal('');
  readonly newInputType = signal('string');
  readonly newInputRequired = signal(false);
  readonly newInputTransform = signal<InputTransform | undefined>(undefined);
  readonly newOutputName = signal('');
  readonly newOutputPayloadType = signal('void');
  readonly newBindingPortName = signal('');
  readonly newBindingType = signal<'input' | 'output'>('input');
  readonly newBindingParentProp = signal('');
  readonly newBindingParentHandler = signal('');

  // Template constants
  readonly viewBox = `0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`;
  readonly towerSize = TOWER_SIZE;
  readonly portRadius = PORT_RADIUS;
  readonly waveRadius = WAVE_RADIUS;
  readonly portTypeColors = PORT_TYPE_COLORS;

  // Computed from engine (null-safe)
  readonly towerPlacements = computed(() => this.engine?.towerPlacements() ?? []);
  readonly playerTowers = computed(() => this.engine?.playerTowers() ?? new Map<string, PlayerTowerState>());
  readonly gridSize = computed(() => this.engine?.gridSize() ?? { rows: 0, cols: 0 });
  readonly stationHealth = computed(() => this.engine?.stationHealth() ?? 100);
  readonly deployResult = computed(() => this.engine?.deployResult() ?? null);
  readonly noiseWaves = computed(() => this.engine?.noiseWaves() ?? []);
  readonly isDeploying = computed(() => this.animatingWaves().length > 0);

  // Tower position map: towerId -> {x, y} in SVG viewBox coords
  readonly towerPositionMap = computed(() => {
    const grid = this.gridSize();
    const map = new Map<string, { x: number; y: number }>();
    for (const tp of this.towerPlacements()) {
      const x = grid.cols <= 1
        ? VIEWBOX_WIDTH / 2
        : GRID_PADDING + (tp.position.col / (grid.cols - 1)) * (VIEWBOX_WIDTH - 2 * GRID_PADDING);
      const y = grid.rows <= 1
        ? VIEWBOX_HEIGHT / 2
        : GRID_PADDING + (tp.position.row / (grid.rows - 1)) * (VIEWBOX_HEIGHT - 2 * GRID_PADDING);
      map.set(tp.towerId, { x, y });
    }
    return map;
  });

  // Array version for template iteration
  readonly towerPositions = computed(() =>
    this.towerPlacements().map(tp => ({
      ...tp,
      x: this.towerPositionMap().get(tp.towerId)?.x ?? 0,
      y: this.towerPositionMap().get(tp.towerId)?.y ?? 0,
    }))
  );

  // Selected tower state
  readonly selectedTowerState = computed(() => {
    const id = this.selectedTowerId();
    if (!id) return null;
    return this.playerTowers().get(id) ?? null;
  });

  // Config panel position (percentage-based for responsive scaling)
  readonly configPanelStyle = computed(() => {
    const id = this.selectedTowerId();
    if (!id) return { left: '0%', top: '0%' };
    const pos = this.towerPositionMap().get(id);
    if (!pos) return { left: '0%', top: '0%' };
    return {
      left: `${(pos.x / VIEWBOX_WIDTH) * 100}%`,
      top: `${(pos.y / VIEWBOX_HEIGHT) * 100}%`,
    };
  });

  // Grid lines for template
  readonly gridLines = computed(() => {
    const grid = this.gridSize();
    const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
    // Horizontal lines
    for (let r = 0; r <= grid.rows; r++) {
      const y = grid.rows <= 0
        ? 0
        : GRID_PADDING + (r / grid.rows) * (VIEWBOX_HEIGHT - 2 * GRID_PADDING);
      lines.push({ x1: GRID_PADDING, y1: y, x2: VIEWBOX_WIDTH - GRID_PADDING, y2: y });
    }
    // Vertical lines
    for (let c = 0; c <= grid.cols; c++) {
      const x = grid.cols <= 0
        ? 0
        : GRID_PADDING + (c / grid.cols) * (VIEWBOX_WIDTH - 2 * GRID_PADDING);
      lines.push({ x1: x, y1: GRID_PADDING, x2: x, y2: VIEWBOX_HEIGHT - GRID_PADDING });
    }
    return lines;
  });

  constructor() {
    if (!this.engine) return;

    // Keyboard shortcuts
    this.shortcuts.register('d', 'Deploy', () => this.onDeploy());
    this.shortcuts.register('escape', 'Close config panel', () => this.closeConfigPanel());
  }

  // --- Tower interaction ---

  onTowerClick(towerId: string): void {
    if (!this.engine || this.isDeploying()) return;
    this.selectedTowerId.set(towerId);
  }

  closeConfigPanel(): void {
    this.selectedTowerId.set(null);
    this.resetFormState();
  }

  // --- Input management ---

  onAddInput(): void {
    if (!this.engine) return;
    const towerId = this.selectedTowerId();
    if (!towerId) return;

    const name = this.newInputName();
    if (!name) return;

    const input: TowerInput = {
      name,
      type: this.newInputType(),
      required: this.newInputRequired(),
      transform: this.newInputTransform(),
    };

    this.engine.submitAction({ type: 'declare-input', towerId, input });
    this.newInputName.set('');
    this.newInputType.set('string');
    this.newInputRequired.set(false);
    this.newInputTransform.set(undefined);
  }

  onRemoveInput(towerId: string, name: string): void {
    if (!this.engine) return;
    this.engine.submitAction({ type: 'remove-input', towerId, inputName: name });
  }

  // --- Output management ---

  onAddOutput(): void {
    if (!this.engine) return;
    const towerId = this.selectedTowerId();
    if (!towerId) return;

    const name = this.newOutputName();
    if (!name) return;

    const output: TowerOutput = {
      name,
      payloadType: this.newOutputPayloadType(),
    };

    this.engine.submitAction({ type: 'declare-output', towerId, output });
    this.newOutputName.set('');
    this.newOutputPayloadType.set('void');
  }

  onRemoveOutput(towerId: string, name: string): void {
    if (!this.engine) return;
    this.engine.submitAction({ type: 'remove-output', towerId, outputName: name });
  }

  // --- Binding management ---

  onSetBinding(): void {
    if (!this.engine) return;
    const towerId = this.selectedTowerId();
    if (!towerId) return;

    const portName = this.newBindingPortName();
    if (!portName) return;

    const bindingType = this.newBindingType();
    const binding: ParentBinding = {
      bindingType,
      towerPortName: portName,
      parentProperty: bindingType === 'input' ? this.newBindingParentProp() : undefined,
      parentHandler: bindingType === 'output' ? this.newBindingParentHandler() : undefined,
    };

    this.engine.submitAction({ type: 'set-binding', towerId, binding });
    this.newBindingPortName.set('');
    this.newBindingType.set('input');
    this.newBindingParentProp.set('');
    this.newBindingParentHandler.set('');
  }

  onRemoveBinding(towerId: string, portName: string): void {
    if (!this.engine) return;
    this.engine.submitAction({ type: 'remove-binding', towerId, towerPortName: portName });
  }

  // --- Deploy and wave animation ---

  onDeploy(): void {
    if (!this.engine || this.isDeploying()) return;
    this.closeConfigPanel();

    const result = this.engine.deploy();
    if (!result) return;

    this.startWaveAnimation(result);
  }

  onReset(): void {
    if (!this.engine) return;
    this.clearPendingTimers();
    this.animatingWaves.set([]);
    this.shieldPulses.set([]);
    this.damageShake.set(false);
    this.engine.reset();
  }

  // --- Wave position for template ---

  getWaveX(wave: AnimatingWave): number {
    const progress = wave.totalSteps === 0 ? 1 : wave.currentStep / wave.totalSteps;
    return wave.startX + (wave.endX - wave.startX) * progress;
  }

  getWaveY(wave: AnimatingWave): number {
    const progress = wave.totalSteps === 0 ? 1 : wave.currentStep / wave.totalSteps;
    return wave.startY + (wave.endY - wave.startY) * progress;
  }

  ngOnDestroy(): void {
    this.clearPendingTimers();
    this.shortcuts.unregister('d');
    this.shortcuts.unregister('escape');
  }

  // --- Private ---

  private startWaveAnimation(result: DeployResult): void {
    const noiseWaves = this.noiseWaves();
    const posMap = this.towerPositionMap();

    const waves: AnimatingWave[] = result.waveResults.map(wr => {
      const noiseWave = noiseWaves.find(nw => nw.waveId === wr.waveId);
      const direction = noiseWave?.approachDirection ?? 'west';
      const start = this.getWaveStartPosition(direction);
      const end = this.getWaveEndPosition(wr, posMap);

      return {
        waveId: wr.waveId,
        startX: start.x,
        startY: start.y,
        endX: end.x,
        endY: end.y,
        currentStep: 0,
        totalSteps: WAVE_TOTAL_STEPS,
        blocked: wr.blocked,
        blockedByTowerId: wr.blockedByTowerId,
        damage: wr.damage,
        animationComplete: false,
      };
    });

    this.animatingWaves.set(waves);

    // Advance steps
    for (let step = 1; step <= WAVE_TOTAL_STEPS; step++) {
      const timer = setTimeout(() => {
        this.animatingWaves.update(all =>
          all.map(w => w.currentStep < w.totalSteps ? { ...w, currentStep: w.currentStep + 1 } : w)
        );
      }, step * WAVE_STEP_MS);
      this.pendingTimers.push(timer);
    }

    // After final step: mark complete, add shield pulses, trigger damage shake
    const completeTimer = setTimeout(() => {
      this.animatingWaves.update(all =>
        all.map(w => ({ ...w, animationComplete: true }))
      );

      // Shield pulses for blocked waves
      const pulses: ShieldPulse[] = [];
      for (const w of this.animatingWaves()) {
        if (w.blocked && w.blockedByTowerId) {
          const pos = posMap.get(w.blockedByTowerId);
          if (pos) {
            pulses.push({ towerId: w.blockedByTowerId, x: pos.x, y: pos.y });
          }
        }
      }
      this.shieldPulses.set(pulses);

      // Damage shake for unblocked waves
      const hasUnblockedDamage = this.animatingWaves().some(w => !w.blocked && w.damage > 0);
      if (hasUnblockedDamage) {
        this.damageShake.set(true);
        const shakeTimer = setTimeout(() => this.damageShake.set(false), DAMAGE_SHAKE_MS);
        this.pendingTimers.push(shakeTimer);
      }

      // Clear after result display
      const clearTimer = setTimeout(() => {
        this.animatingWaves.set([]);
        this.shieldPulses.set([]);
      }, RESULT_DISPLAY_MS);
      this.pendingTimers.push(clearTimer);
    }, (WAVE_TOTAL_STEPS + 1) * WAVE_STEP_MS);
    this.pendingTimers.push(completeTimer);
  }

  private getWaveStartPosition(direction: string): { x: number; y: number } {
    switch (direction) {
      case 'north': return { x: VIEWBOX_WIDTH / 2, y: 0 };
      case 'south': return { x: VIEWBOX_WIDTH / 2, y: VIEWBOX_HEIGHT };
      case 'east':  return { x: VIEWBOX_WIDTH, y: VIEWBOX_HEIGHT / 2 };
      case 'west':  return { x: 0, y: VIEWBOX_HEIGHT / 2 };
      default:      return { x: 0, y: VIEWBOX_HEIGHT / 2 };
    }
  }

  private getWaveEndPosition(
    wr: WaveResult,
    posMap: Map<string, { x: number; y: number }>,
  ): { x: number; y: number } {
    if (wr.blocked && wr.blockedByTowerId) {
      const pos = posMap.get(wr.blockedByTowerId);
      if (pos) return pos;
    }
    return { x: VIEWBOX_WIDTH / 2, y: VIEWBOX_HEIGHT / 2 };
  }

  private resetFormState(): void {
    this.newInputName.set('');
    this.newInputType.set('string');
    this.newInputRequired.set(false);
    this.newInputTransform.set(undefined);
    this.newOutputName.set('');
    this.newOutputPayloadType.set('void');
    this.newBindingPortName.set('');
    this.newBindingType.set('input');
    this.newBindingParentProp.set('');
    this.newBindingParentHandler.set('');
  }

  private clearPendingTimers(): void {
    for (const t of this.pendingTimers) clearTimeout(t);
    this.pendingTimers.length = 0;
  }
}
