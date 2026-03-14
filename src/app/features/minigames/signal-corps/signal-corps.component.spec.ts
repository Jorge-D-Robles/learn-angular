import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SignalCorpsComponent } from './signal-corps.component';
import { SignalCorpsEngine } from './signal-corps.engine';
import { SignalCorpsWaveService } from './signal-corps-wave.service';
import { MINIGAME_ENGINE } from '../../../core/minigame/minigame-engine.tokens';
import { KeyboardShortcutService } from '../../../core/minigame/keyboard-shortcut.service';
import {
  DifficultyTier,
  MinigameStatus,
  type MinigameLevel,
} from '../../../core/minigame/minigame.types';
import type { SignalCorpsLevelData } from './signal-corps.types';
import { SignalCorpsTowerConfigComponent, type TowerConfigResult } from './tower-config/tower-config';

// ---------------------------------------------------------------------------
// Constants (mirrored from component for assertions)
// ---------------------------------------------------------------------------

const WAVE_STEP_MS = 300;
const WAVE_TOTAL_STEPS = 5;

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function createTestLevelData(): SignalCorpsLevelData {
  return {
    gridSize: { rows: 3, cols: 3 },
    towerPlacements: [
      {
        towerId: 'tower-a',
        position: { row: 1, col: 0 },
        config: { inputs: [{ name: 'count', type: 'number', required: true }], outputs: [] },
      },
      {
        towerId: 'tower-b',
        position: { row: 1, col: 2 },
        config: { inputs: [], outputs: [{ name: 'clicked', payloadType: 'void' }] },
      },
    ],
    noiseWaves: [
      { waveId: 'wave-1', approachDirection: 'west', typeSignature: 'number', damage: 20 },
      { waveId: 'wave-2', approachDirection: 'east', typeSignature: 'boolean', damage: 30 },
    ],
    expectedBindings: [
      { bindingType: 'input', towerPortName: 'count', parentProperty: 'itemCount' },
      { bindingType: 'output', towerPortName: 'clicked', parentHandler: 'onClicked' },
    ],
    stationHealth: 100,
  };
}

function createLevel(data: SignalCorpsLevelData): MinigameLevel<SignalCorpsLevelData> {
  return {
    id: 'sc-test-01',
    gameId: 'signal-corps',
    tier: DifficultyTier.Basic,
    conceptIntroduced: 'Test signals',
    description: 'Test level',
    data,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SignalCorpsComponent', () => {
  let engine: SignalCorpsEngine;
  let fixture: ComponentFixture<SignalCorpsComponent>;
  let component: SignalCorpsComponent;
  let shortcuts: KeyboardShortcutService;

  function setup(levelData?: SignalCorpsLevelData) {
    engine = new SignalCorpsEngine();
    engine.initialize(createLevel(levelData ?? createTestLevelData()));
    engine.start();

    TestBed.configureTestingModule({
      imports: [SignalCorpsComponent],
      providers: [
        { provide: MINIGAME_ENGINE, useValue: engine },
      ],
    });

    fixture = TestBed.createComponent(SignalCorpsComponent);
    component = fixture.componentInstance;
    shortcuts = TestBed.inject(KeyboardShortcutService);
    fixture.detectChanges();
  }

  afterEach(() => {
    fixture?.destroy();
  });

  // --- 1. Rendering Tests ---

  describe('Rendering', () => {
    it('should create successfully with engine token provided', () => {
      setup();
      expect(component).toBeTruthy();
    });

    it('should create successfully without engine (inert mode)', () => {
      TestBed.configureTestingModule({
        imports: [SignalCorpsComponent],
      });
      const inertFixture = TestBed.createComponent(SignalCorpsComponent);
      inertFixture.detectChanges();
      expect(inertFixture.componentInstance).toBeTruthy();
      inertFixture.destroy();
    });

    it('should render tower elements matching towerPlacements count', () => {
      setup();
      const towers = fixture.nativeElement.querySelectorAll('.signal-corps__tower');
      expect(towers.length).toBe(2);
    });

    it('should render grid lines for gridSize rows and cols', () => {
      setup();
      // (3+1) horizontal + (3+1) vertical = 8 lines
      const gridLines = fixture.nativeElement.querySelectorAll('.signal-corps__grid-line');
      expect(gridLines.length).toBe(8);
    });
  });

  // --- 2. Tower Interaction Tests ---

  describe('Tower Interaction', () => {
    it('should open config panel when tower is clicked', () => {
      setup();
      const tower = fixture.nativeElement.querySelector('.signal-corps__tower') as SVGGElement;
      tower.dispatchEvent(new Event('click', { bubbles: true }));
      fixture.detectChanges();

      const configComp = fixture.debugElement.query(By.directive(SignalCorpsTowerConfigComponent));
      expect(configComp).toBeTruthy();
    });

    it('should close config panel on cancel from child component', () => {
      setup();
      component.onTowerClick('tower-a');
      fixture.detectChanges();

      component.onConfigCancelled();
      fixture.detectChanges();

      const configComp = fixture.debugElement.query(By.directive(SignalCorpsTowerConfigComponent));
      expect(configComp).toBeFalsy();
    });

    it('should highlight selected tower with --selected class', () => {
      setup();
      component.onTowerClick('tower-a');
      fixture.detectChanges();

      const towers = fixture.nativeElement.querySelectorAll('.signal-corps__tower');
      // tower-a is first in the list
      expect(towers[0].classList.contains('signal-corps__tower--selected')).toBe(true);
      expect(towers[1].classList.contains('signal-corps__tower--selected')).toBe(false);
    });
  });

  // --- 3. Config Panel - Child Component Integration ---

  describe('Config Panel Integration', () => {
    it('should bind towerId input to selected tower', () => {
      setup();
      component.onTowerClick('tower-a');
      fixture.detectChanges();

      const configDe = fixture.debugElement.query(By.directive(SignalCorpsTowerConfigComponent));
      expect(configDe).toBeTruthy();
      const configInstance = configDe.componentInstance as SignalCorpsTowerConfigComponent;
      expect(configInstance.towerId()).toBe('tower-a');
    });

    it('should bind tower config (inputs/outputs) to selected tower', () => {
      setup();

      // Declare an input on tower-a via engine
      engine.submitAction({
        type: 'declare-input',
        towerId: 'tower-a',
        input: { name: 'count', type: 'number', required: true },
      });

      component.onTowerClick('tower-a');
      fixture.detectChanges();

      const configDe = fixture.debugElement.query(By.directive(SignalCorpsTowerConfigComponent));
      const configInstance = configDe.componentInstance as SignalCorpsTowerConfigComponent;
      const towerConfig = configInstance.tower();
      expect(towerConfig.inputs.length).toBe(1);
      expect(towerConfig.inputs[0].name).toBe('count');
    });

    it('should bind existing bindings to selected tower', () => {
      setup();

      // Set a binding on tower-a
      engine.submitAction({
        type: 'set-binding',
        towerId: 'tower-a',
        binding: { bindingType: 'input', towerPortName: 'count', parentProperty: 'itemCount' },
      });

      component.onTowerClick('tower-a');
      fixture.detectChanges();

      const configDe = fixture.debugElement.query(By.directive(SignalCorpsTowerConfigComponent));
      const configInstance = configDe.componentInstance as SignalCorpsTowerConfigComponent;
      expect(configInstance.bindings().length).toBe(1);
      expect(configInstance.bindings()[0].towerPortName).toBe('count');
    });

    it('should populate parentProperties from level expectedBindings', () => {
      setup();
      component.onTowerClick('tower-a');
      fixture.detectChanges();

      const configDe = fixture.debugElement.query(By.directive(SignalCorpsTowerConfigComponent));
      const configInstance = configDe.componentInstance as SignalCorpsTowerConfigComponent;
      expect(configInstance.parentProperties()).toContain('itemCount');
    });

    it('should populate parentHandlers from level expectedBindings', () => {
      setup();
      component.onTowerClick('tower-a');
      fixture.detectChanges();

      const configDe = fixture.debugElement.query(By.directive(SignalCorpsTowerConfigComponent));
      const configInstance = configDe.componentInstance as SignalCorpsTowerConfigComponent;
      expect(configInstance.parentHandlers()).toContain('onClicked');
    });

    it('should update engine state on configApplied and close panel', () => {
      setup();
      const submitSpy = vi.spyOn(engine, 'submitAction');

      component.onTowerClick('tower-a');
      fixture.detectChanges();

      submitSpy.mockClear();

      const result: TowerConfigResult = {
        config: {
          inputs: [{ name: 'count', type: 'number', required: true }],
          outputs: [],
        },
        bindings: [
          { bindingType: 'input', towerPortName: 'count', parentProperty: 'itemCount' },
        ],
      };

      component.onConfigApplied(result);
      fixture.detectChanges();

      // Should have submitted declare-input and set-binding actions
      expect(submitSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'declare-input', towerId: 'tower-a' }),
      );
      expect(submitSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'set-binding', towerId: 'tower-a' }),
      );

      // Panel should be closed
      expect(component.selectedTowerId()).toBeNull();
      const configComp = fixture.debugElement.query(By.directive(SignalCorpsTowerConfigComponent));
      expect(configComp).toBeFalsy();
    });

    it('should remove existing state before applying new config', () => {
      setup();

      // Pre-populate tower-a with existing inputs
      engine.submitAction({
        type: 'declare-input',
        towerId: 'tower-a',
        input: { name: 'oldInput', type: 'string', required: false },
      });

      const submitSpy = vi.spyOn(engine, 'submitAction');

      component.onTowerClick('tower-a');
      fixture.detectChanges();

      submitSpy.mockClear();

      const result: TowerConfigResult = {
        config: {
          inputs: [{ name: 'count', type: 'number', required: true }],
          outputs: [],
        },
        bindings: [],
      };

      component.onConfigApplied(result);

      // Should remove old input before adding new one
      expect(submitSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'remove-input', towerId: 'tower-a', inputName: 'oldInput' }),
      );
      expect(submitSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'declare-input', towerId: 'tower-a' }),
      );
    });

    it('should dismiss panel on backdrop click', () => {
      setup();
      component.onTowerClick('tower-a');
      fixture.detectChanges();

      const backdrop = fixture.nativeElement.querySelector('.signal-corps__config-backdrop') as HTMLDivElement;
      expect(backdrop).toBeTruthy();
      backdrop.click();
      fixture.detectChanges();

      expect(component.selectedTowerId()).toBeNull();
      const configComp = fixture.debugElement.query(By.directive(SignalCorpsTowerConfigComponent));
      expect(configComp).toBeFalsy();
    });

    it('should not render config panel when no tower is selected', () => {
      setup();
      const configComp = fixture.debugElement.query(By.directive(SignalCorpsTowerConfigComponent));
      expect(configComp).toBeFalsy();
    });
  });

  // --- 4. Port Visualization ---

  describe('Port Visualization', () => {
    it('should render input ports with blue color (#3B82F6)', () => {
      setup();

      // Declare an input on tower-a
      engine.submitAction({
        type: 'declare-input',
        towerId: 'tower-a',
        input: { name: 'count', type: 'number', required: true },
      });
      fixture.detectChanges();

      const inputPort = fixture.nativeElement.querySelector('.signal-corps__port--input');
      expect(inputPort).toBeTruthy();
      expect(inputPort.getAttribute('fill')).toBe('#3B82F6');
    });

    it('should render output ports with orange color (#F97316)', () => {
      setup();

      // Declare an output on tower-b
      engine.submitAction({
        type: 'declare-output',
        towerId: 'tower-b',
        output: { name: 'clicked', payloadType: 'void' },
      });
      fixture.detectChanges();

      const outputPort = fixture.nativeElement.querySelector('.signal-corps__port--output');
      expect(outputPort).toBeTruthy();
      expect(outputPort.getAttribute('fill')).toBe('#F97316');
    });
  });

  // --- 5. Deploy and Wave Animation ---

  describe('Deploy and Wave Animation', () => {
    it('should call engine.deploy() on deploy button click', () => {
      setup();
      const deploySpy = vi.spyOn(engine, 'deploy');

      const deployBtn = fixture.nativeElement.querySelector('.signal-corps__deploy-btn') as HTMLButtonElement;
      deployBtn.click();

      expect(deploySpy).toHaveBeenCalled();
    });

    it('should display wave elements after deploy', () => {
      setup();

      component.onDeploy();
      fixture.detectChanges();

      const waves = fixture.nativeElement.querySelectorAll('.signal-corps__wave');
      expect(waves.length).toBe(2);
    });

    it('should show shield pulse for blocked waves', () => {
      vi.useFakeTimers();
      setup();

      // Configure tower-a correctly: input + binding must match expected config
      engine.submitAction({
        type: 'declare-input',
        towerId: 'tower-a',
        input: { name: 'count', type: 'number', required: true },
      });
      engine.submitAction({
        type: 'set-binding',
        towerId: 'tower-a',
        binding: { bindingType: 'input', towerPortName: 'count', parentProperty: 'itemCount' },
      });

      component.onDeploy();
      fixture.detectChanges();

      // Advance past animation completion: (WAVE_TOTAL_STEPS + 1) * WAVE_STEP_MS
      const completionTime = (WAVE_TOTAL_STEPS + 1) * WAVE_STEP_MS + 1;
      vi.advanceTimersByTime(completionTime);
      fixture.detectChanges();

      const pulses = fixture.nativeElement.querySelectorAll('.signal-corps__shield-pulse');
      expect(pulses.length).toBeGreaterThan(0);

      vi.useRealTimers();
    });

    it('should apply screen shake class for unblocked waves', () => {
      vi.useFakeTimers();
      setup();

      // Deploy without configuring towers -> wave-2 is unblocked, causes damage
      component.onDeploy();
      fixture.detectChanges();

      // Advance past animation completion
      const completionTime = (WAVE_TOTAL_STEPS + 1) * WAVE_STEP_MS + 1;
      vi.advanceTimersByTime(completionTime);
      fixture.detectChanges();

      const container = fixture.nativeElement.querySelector('.signal-corps--damage');
      expect(container).toBeTruthy();

      vi.useRealTimers();
    });
  });

  // --- 6. Keyboard Shortcuts ---

  describe('Keyboard Shortcuts', () => {
    it('should register d and escape keys on init', () => {
      setup();
      const registered = shortcuts.getRegistered();
      expect(registered.find(r => r.key === 'd')).toBeDefined();
      expect(registered.find(r => r.key === 'escape')).toBeDefined();
    });

    it('should trigger deploy on d key press', () => {
      setup();
      const deploySpy = vi.spyOn(engine, 'deploy');

      const reg = shortcuts.getRegistered().find(r => r.key === 'd');
      reg?.callback();

      expect(deploySpy).toHaveBeenCalled();
    });

    it('should unregister all shortcuts on destroy', () => {
      setup();
      const unregisterSpy = vi.spyOn(shortcuts, 'unregister');

      component.ngOnDestroy();

      expect(unregisterSpy).toHaveBeenCalledTimes(2);
      expect(unregisterSpy).toHaveBeenCalledWith('d');
      expect(unregisterSpy).toHaveBeenCalledWith('escape');
    });
  });

  // --- 7. Edge Cases ---

  describe('Edge Cases', () => {
    it('should handle empty grid (0 towers, 0 waves)', () => {
      setup({
        gridSize: { rows: 0, cols: 0 },
        towerPlacements: [],
        noiseWaves: [],
        expectedBindings: [],
        stationHealth: 100,
      });
      fixture.detectChanges();

      const towers = fixture.nativeElement.querySelectorAll('.signal-corps__tower');
      expect(towers.length).toBe(0);
      const waves = fixture.nativeElement.querySelectorAll('.signal-corps__wave');
      expect(waves.length).toBe(0);
    });

    it('should handle deploy when station health reaches 0 (game over)', () => {
      // Use lethal damage: stationHealth=50, both waves unblocked = 20+30=50 damage
      setup({
        gridSize: { rows: 3, cols: 3 },
        towerPlacements: [
          {
            towerId: 'tower-a',
            position: { row: 1, col: 0 },
            config: { inputs: [{ name: 'count', type: 'number', required: true }], outputs: [] },
          },
        ],
        noiseWaves: [
          { waveId: 'wave-1', approachDirection: 'west', typeSignature: 'number', damage: 25 },
          { waveId: 'wave-2', approachDirection: 'east', typeSignature: 'boolean', damage: 25 },
        ],
        expectedBindings: [],
        stationHealth: 50,
      });

      // Deploy without configuring => all waves unblocked => 50 damage => health = 0
      component.onDeploy();

      expect(engine.status()).toBe(MinigameStatus.Lost);
    });
  });

  // --- 8. Wave Service Visual State ---

  describe('Wave Service Visual State', () => {
    function setupWithWaveService(levelData?: SignalCorpsLevelData) {
      const waveService = new SignalCorpsWaveService();
      engine = new SignalCorpsEngine(undefined, waveService);
      engine.initialize(createLevel(levelData ?? createTestLevelData()));
      engine.start();

      TestBed.configureTestingModule({
        imports: [SignalCorpsComponent],
        providers: [
          { provide: MINIGAME_ENGINE, useValue: engine },
          { provide: SignalCorpsWaveService, useValue: waveService },
        ],
      });

      fixture = TestBed.createComponent(SignalCorpsComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      return waveService;
    }

    it('should render wave circles from activeSignals after deploy and tick', () => {
      setupWithWaveService();

      // Deploy to start wave spawning
      engine.deploy();
      // Tick enough time for signals to spawn and advance (2000ms)
      engine.tick(2000);
      fixture.detectChanges();

      const activeWaves = fixture.nativeElement.querySelectorAll('.signal-corps__wave--active');
      expect(activeWaves.length).toBeGreaterThan(0);

      // Verify circles have valid cx/cy attributes
      const firstCircle = activeWaves[0] as SVGCircleElement;
      const cx = Number(firstCircle.getAttribute('cx'));
      const cy = Number(firstCircle.getAttribute('cy'));
      expect(cx).toBeGreaterThanOrEqual(0);
      expect(cy).toBeGreaterThanOrEqual(0);
    });

    it('should show shield pulse when signal is blocked by correct tower', () => {
      setupWithWaveService();

      // Configure tower-a correctly to block wave-1 (type 'number')
      engine.submitAction({
        type: 'declare-input',
        towerId: 'tower-a',
        input: { name: 'count', type: 'number', required: true },
      });
      engine.submitAction({
        type: 'set-binding',
        towerId: 'tower-a',
        binding: { bindingType: 'input', towerPortName: 'count', parentProperty: 'itemCount' },
      });

      engine.deploy();

      // First tick (>=500ms) spawns signals at position 0, second tick advances past 1.0
      engine.tick(600);
      engine.tick(3200);
      // First detectChanges triggers the effect, second renders the DOM updates
      fixture.detectChanges();
      fixture.detectChanges();

      const pulses = fixture.nativeElement.querySelectorAll('.signal-corps__shield-pulse');
      expect(pulses.length).toBeGreaterThan(0);
    });

    it('should trigger damage shake on unblocked signal reaching station', () => {
      setupWithWaveService();

      // Deploy without configuring towers -> all signals unblocked
      engine.deploy();

      // First tick (>=500ms) spawns signals, second tick advances them past station
      engine.tick(600);
      engine.tick(3200);
      // First detectChanges triggers the effect, second renders DOM updates
      fixture.detectChanges();
      fixture.detectChanges();

      const container = fixture.nativeElement.querySelector('.signal-corps--damage');
      expect(container).toBeTruthy();
    });

    it('should update health bar width after damage', () => {
      setupWithWaveService();

      // Deploy without configuring towers -> damage will occur
      engine.deploy();
      // First tick (>=500ms) spawns signals, second tick advances them to cause damage
      engine.tick(600);
      engine.tick(3200);
      // First detectChanges triggers the effect, second renders DOM updates
      fixture.detectChanges();
      fixture.detectChanges();

      // Verify health actually decreased (engine syncs wave service health)
      expect(engine.stationHealth()).toBeLessThan(100);

      const healthFill = fixture.nativeElement.querySelector('.signal-corps__health-bar-fill') as HTMLElement;
      expect(healthFill).toBeTruthy();
      // Health started at 100, took some damage, so width should be less than 100%
      const widthStyle = healthFill.style.width;
      expect(widthStyle).toBeTruthy();
      const widthPercent = parseFloat(widthStyle);
      expect(widthPercent).toBeLessThan(100);
    });

    it('should show wave progress "Wave 1 / N"', () => {
      setupWithWaveService();

      engine.deploy();
      fixture.detectChanges();

      const progressEl = fixture.nativeElement.querySelector('.signal-corps__wave-progress') as HTMLElement;
      expect(progressEl).toBeTruthy();
      expect(progressEl.textContent).toContain('Wave 1');
    });

    it('should start rAF loop when wave service is present and Playing', () => {
      vi.stubGlobal('requestAnimationFrame', vi.fn());
      setupWithWaveService();

      // Deploy triggers Playing + wave service -> rAF loop starts
      engine.deploy();
      fixture.detectChanges();

      expect(requestAnimationFrame).toHaveBeenCalled();

      vi.unstubAllGlobals();
    });

    it('should NOT start rAF loop when wave service is absent', () => {
      setup();

      component.onDeploy();

      // The inline fallback uses setTimeout, not rAF.
      // Our component's startAnimLoop sets _isTickLoopRunning to true,
      // so we verify that signal is still false when no wave service is present.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any)._isTickLoopRunning()).toBe(false);
    });
  });
});
