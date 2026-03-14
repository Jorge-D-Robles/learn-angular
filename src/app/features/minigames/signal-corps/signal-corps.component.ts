import {
  Component,
  OnDestroy,
  computed,
  signal,
  inject,
  effect,
} from '@angular/core';
import { MINIGAME_ENGINE } from '../../../core/minigame/minigame-engine.tokens';
import { KeyboardShortcutService } from '../../../core/minigame/keyboard-shortcut.service';
import { MinigameStatus } from '../../../core/minigame/minigame.types';
import type { TowerConfig } from './signal-corps.types';
import { PORT_TYPE_COLORS } from './signal-corps.types';
import {
  SignalCorpsEngine,
  type PlayerTowerState,
  type DeployResult,
  type WaveResult,
} from './signal-corps.engine';
import { SignalCorpsWaveService } from './signal-corps-wave.service';
import { SignalCorpsTowerConfigComponent, type TowerConfigResult } from './tower-config/tower-config';

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
const HEALTH_CRITICAL_THRESHOLD = 0.25;

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

export interface ActiveWavePosition {
  readonly id: string;
  readonly x: number;
  readonly y: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

@Component({
  selector: 'app-signal-corps',
  imports: [SignalCorpsTowerConfigComponent],
  templateUrl: './signal-corps.component.html',
  styleUrl: './signal-corps.component.scss',
})
export class SignalCorpsComponent implements OnDestroy {
  private readonly engine = inject(MINIGAME_ENGINE, { optional: true }) as SignalCorpsEngine | null;
  private readonly shortcuts = inject(KeyboardShortcutService);
  private readonly waveService = inject(SignalCorpsWaveService, { optional: true });

  // Local state
  readonly selectedTowerId = signal<string | null>(null);
  readonly animatingWaves = signal<readonly AnimatingWave[]>([]);
  readonly shieldPulses = signal<readonly ShieldPulse[]>([]);
  readonly damageShake = signal(false);
  private readonly pendingTimers: ReturnType<typeof setTimeout>[] = [];

  // rAF loop state
  private _animFrameId: number | null = null;
  private _lastTimestamp = 0;
  private _processedResolvedIds = new Set<string>();

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
  readonly isDeploying = computed(() => this.animatingWaves().length > 0 || this._isTickLoopRunning());

  // Health percentage for progress bar (0-100)
  readonly healthPercent = computed(() => Math.max(0, Math.min(100, this.stationHealth())));
  readonly healthCritical = computed(() => this.healthPercent() <= HEALTH_CRITICAL_THRESHOLD * 100);

  // Track whether tick loop is running for isDeploying
  private readonly _isTickLoopRunning = signal(false);

  // Tick-based wave positions from wave service
  readonly activeWavePositions = computed((): readonly ActiveWavePosition[] => {
    if (!this.waveService) return [];
    const signals = this.waveService.activeSignals();
    return signals
      .filter(s => !s.resolved)
      .map(s => ({
        id: s.id,
        x: this.getSignalX(s.approachDirection, s.position),
        y: this.getSignalY(s.approachDirection, s.position),
      }));
  });

  // Wave progress: always "Wave 1 / N" (single-wave-per-deploy model)
  readonly waveProgress = computed(() => {
    const waves = this.noiseWaves();
    return { current: 1, total: waves.length };
  });

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

  // Child component bindings
  readonly selectedTowerConfig = computed((): TowerConfig => {
    const id = this.selectedTowerId();
    if (!id) return { inputs: [], outputs: [] };
    const state = this.playerTowers().get(id);
    if (!state) return { inputs: [], outputs: [] };
    return { inputs: state.inputs, outputs: state.outputs };
  });

  readonly selectedTowerBindings = computed(() => {
    const id = this.selectedTowerId();
    if (!id) return [];
    return this.playerTowers().get(id)?.bindings ?? [];
  });

  readonly parentProperties = computed(() => {
    const bindings = this.engine?.expectedBindings() ?? [];
    return [...new Set(bindings.filter(b => b.parentProperty).map(b => b.parentProperty!))];
  });

  readonly parentHandlers = computed(() => {
    const bindings = this.engine?.expectedBindings() ?? [];
    return [...new Set(bindings.filter(b => b.parentHandler).map(b => b.parentHandler!))];
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

    // Effect: watch activeSignals for newly resolved signals -> shield pulses / damage
    if (this.waveService) {
      const ws = this.waveService;
      effect(() => {
        const signals = ws.activeSignals();
        const posMap = this.towerPositionMap();
        const newPulses: ShieldPulse[] = [];
        let hasNewDamage = false;

        for (const sig of signals) {
          if (!sig.resolved) continue;
          if (this._processedResolvedIds.has(sig.id)) continue;

          this._processedResolvedIds.add(sig.id);

          // Determine if this signal was blocked or unblocked by checking
          // if any tower could block it (same logic as evaluateBlocking)
          const placements = this.engine?.towerPlacements() ?? [];
          const playerTowers = this.engine?.playerTowers() ?? new Map();
          let wasBlocked = false;

          for (const tp of placements) {
            const state = playerTowers.get(tp.towerId);
            if (!state) continue;
            const hasMatchingInput = state.inputs.some((i: { type: string }) => i.type === sig.typeSignature);
            const hasMatchingOutput = state.outputs.some((o: { payloadType: string }) => o.payloadType === sig.typeSignature);
            if (hasMatchingInput || hasMatchingOutput) {
              const pos = posMap.get(tp.towerId);
              if (pos) {
                newPulses.push({ towerId: tp.towerId, x: pos.x, y: pos.y });
              }
              wasBlocked = true;
              break;
            }
          }

          if (!wasBlocked && sig.damage > 0) {
            hasNewDamage = true;
          }
        }

        if (newPulses.length > 0) {
          this.shieldPulses.update(existing => [...existing, ...newPulses]);
        }

        if (hasNewDamage) {
          this.damageShake.set(true);
          const timer = setTimeout(() => this.damageShake.set(false), DAMAGE_SHAKE_MS);
          this.pendingTimers.push(timer);
        }
      });
    }
  }

  // --- Tower interaction ---

  onTowerClick(towerId: string): void {
    if (!this.engine || this.isDeploying()) return;
    this.selectedTowerId.set(towerId);
  }

  closeConfigPanel(): void {
    this.selectedTowerId.set(null);
  }

  // --- Config panel handlers ---

  onConfigApplied(result: TowerConfigResult): void {
    if (!this.engine) return;
    const towerId = this.selectedTowerId();
    if (!towerId) return;

    // Remove existing state
    const currentState = this.playerTowers().get(towerId);
    if (currentState) {
      for (const binding of currentState.bindings) {
        this.engine.submitAction({ type: 'remove-binding', towerId, towerPortName: binding.towerPortName });
      }
      for (const inp of currentState.inputs) {
        this.engine.submitAction({ type: 'remove-input', towerId, inputName: inp.name });
      }
      for (const out of currentState.outputs) {
        this.engine.submitAction({ type: 'remove-output', towerId, outputName: out.name });
      }
    }

    // Add new state
    for (const inp of result.config.inputs) {
      this.engine.submitAction({ type: 'declare-input', towerId, input: inp });
    }
    for (const out of result.config.outputs) {
      this.engine.submitAction({ type: 'declare-output', towerId, output: out });
    }
    for (const binding of result.bindings) {
      this.engine.submitAction({ type: 'set-binding', towerId, binding });
    }

    this.selectedTowerId.set(null);
  }

  onConfigCancelled(): void {
    this.closeConfigPanel();
  }

  // --- Deploy and wave animation ---

  onDeploy(): void {
    if (!this.engine || this.isDeploying()) return;
    this.closeConfigPanel();

    const result = this.engine.deploy();
    if (!result) return;

    // When wave service is present, start the rAF tick loop
    if (this.waveService) {
      this.startAnimLoop();
      return;
    }

    this.startWaveAnimation(result);
  }

  onReset(): void {
    if (!this.engine) return;
    this.stopAnimLoop();
    this.clearPendingTimers();
    this._processedResolvedIds.clear();
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
    this.stopAnimLoop();
    this.clearPendingTimers();
    this.shortcuts.unregister('d');
    this.shortcuts.unregister('escape');
  }

  // --- Private: rAF animation loop ---

  private startAnimLoop(): void {
    if (this._animFrameId !== null) return; // guard against re-entrant start
    this._isTickLoopRunning.set(true);
    this._lastTimestamp = 0;
    this._processedResolvedIds.clear();

    const loop = (timestamp: number) => {
      if (!this.engine || this.engine.status() !== MinigameStatus.Playing) {
        this.stopAnimLoop();
        return;
      }

      if (this._lastTimestamp > 0) {
        const deltaMs = timestamp - this._lastTimestamp;
        this.engine.tick(deltaMs);
      }
      this._lastTimestamp = timestamp;
      this._animFrameId = requestAnimationFrame(loop);
    };

    this._animFrameId = requestAnimationFrame(loop);
  }

  private stopAnimLoop(): void {
    if (this._animFrameId !== null) {
      cancelAnimationFrame(this._animFrameId);
      this._animFrameId = null;
    }
    this._isTickLoopRunning.set(false);
  }

  // --- Private: signal position helpers ---

  private getSignalX(direction: string, position: number): number {
    const center = VIEWBOX_WIDTH / 2;
    switch (direction) {
      case 'west':  return position * center;
      case 'east':  return VIEWBOX_WIDTH - position * center;
      default:      return center;
    }
  }

  private getSignalY(direction: string, position: number): number {
    const center = VIEWBOX_HEIGHT / 2;
    switch (direction) {
      case 'north': return position * center;
      case 'south': return VIEWBOX_HEIGHT - position * center;
      default:      return center;
    }
  }

  // --- Private: inline fallback animation ---

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

  private clearPendingTimers(): void {
    for (const t of this.pendingTimers) clearTimeout(t);
    this.pendingTimers.length = 0;
  }
}
