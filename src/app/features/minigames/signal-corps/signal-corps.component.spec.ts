import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { SignalCorpsComponent } from './signal-corps.component';
import { SignalCorpsEngine } from './signal-corps.engine';
import { MINIGAME_ENGINE } from '../../../core/minigame/minigame-engine.tokens';
import { KeyboardShortcutService } from '../../../core/minigame/keyboard-shortcut.service';
import {
  DifficultyTier,
  MinigameStatus,
  type MinigameLevel,
} from '../../../core/minigame/minigame.types';
import type { SignalCorpsLevelData } from './signal-corps.types';

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

      const panel = fixture.nativeElement.querySelector('.signal-corps__config-panel');
      expect(panel).toBeTruthy();
    });

    it('should close config panel on close button click', () => {
      setup();
      // Open panel
      component.onTowerClick('tower-a');
      fixture.detectChanges();

      const closeBtn = fixture.nativeElement.querySelector('.signal-corps__config-close') as HTMLButtonElement;
      closeBtn.click();
      fixture.detectChanges();

      const panel = fixture.nativeElement.querySelector('.signal-corps__config-panel');
      expect(panel).toBeFalsy();
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

  // --- 3. Configuration Panel - Inputs/Outputs ---

  describe('Configuration Panel - Inputs/Outputs', () => {
    it('should submit declare-input action when input is added', () => {
      setup();
      const submitSpy = vi.spyOn(engine, 'submitAction');

      // Open panel for tower-a
      component.onTowerClick('tower-a');
      fixture.detectChanges();

      // Fill form and submit
      component.newInputName.set('age');
      component.newInputType.set('number');
      component.newInputRequired.set(false);
      component.onAddInput();

      expect(submitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'declare-input',
          towerId: 'tower-a',
          input: expect.objectContaining({
            name: 'age',
            type: 'number',
            required: false,
          }),
        }),
      );
    });

    it('should submit declare-output action when output is added', () => {
      setup();
      const submitSpy = vi.spyOn(engine, 'submitAction');

      component.onTowerClick('tower-b');
      fixture.detectChanges();

      component.newOutputName.set('selected');
      component.newOutputPayloadType.set('string');
      component.onAddOutput();

      expect(submitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'declare-output',
          towerId: 'tower-b',
          output: expect.objectContaining({
            name: 'selected',
            payloadType: 'string',
          }),
        }),
      );
    });

    it('should show existing inputs and outputs for the selected tower', () => {
      setup();

      // Declare an input on tower-a via engine
      engine.submitAction({
        type: 'declare-input',
        towerId: 'tower-a',
        input: { name: 'count', type: 'number', required: true },
      });

      // Open panel for tower-a
      component.onTowerClick('tower-a');
      fixture.detectChanges();

      const rows = fixture.nativeElement.querySelectorAll('.signal-corps__config-row');
      expect(rows.length).toBeGreaterThan(0);
      // Should display the input name
      expect(rows[0].textContent).toContain('count');
    });

    it('should submit remove-input action when remove button is clicked', () => {
      setup();

      // Declare an input first
      engine.submitAction({
        type: 'declare-input',
        towerId: 'tower-a',
        input: { name: 'count', type: 'number', required: true },
      });

      component.onTowerClick('tower-a');
      fixture.detectChanges();

      const submitSpy = vi.spyOn(engine, 'submitAction');

      const removeBtn = fixture.nativeElement.querySelector('.signal-corps__remove-btn') as HTMLButtonElement;
      removeBtn.click();

      expect(submitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'remove-input',
          towerId: 'tower-a',
          inputName: 'count',
        }),
      );
    });
  });

  // --- 4. Configuration Panel - Bindings ---

  describe('Configuration Panel - Bindings', () => {
    it('should submit set-binding action when binding is added', () => {
      setup();
      const submitSpy = vi.spyOn(engine, 'submitAction');

      component.onTowerClick('tower-a');
      fixture.detectChanges();

      component.newBindingPortName.set('count');
      component.newBindingType.set('input');
      component.newBindingParentProp.set('itemCount');
      component.onSetBinding();

      expect(submitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'set-binding',
          towerId: 'tower-a',
          binding: expect.objectContaining({
            bindingType: 'input',
            towerPortName: 'count',
            parentProperty: 'itemCount',
          }),
        }),
      );
    });

    it('should submit remove-binding action when binding remove button is clicked', () => {
      setup();

      // Set a binding first
      engine.submitAction({
        type: 'set-binding',
        towerId: 'tower-a',
        binding: { bindingType: 'input', towerPortName: 'count', parentProperty: 'itemCount' },
      });

      component.onTowerClick('tower-a');
      fixture.detectChanges();

      const submitSpy = vi.spyOn(engine, 'submitAction');

      // Find the binding remove button (it's the only remove button since no inputs declared yet)
      const removeBtns = fixture.nativeElement.querySelectorAll('.signal-corps__remove-btn') as NodeListOf<HTMLButtonElement>;
      // The binding remove button is the last one
      removeBtns[removeBtns.length - 1].click();

      expect(submitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'remove-binding',
          towerId: 'tower-a',
          towerPortName: 'count',
        }),
      );
    });
  });

  // --- 5. Port Visualization ---

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

  // --- 6. Deploy and Wave Animation ---

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

  // --- 7. Keyboard Shortcuts ---

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

  // --- 8. Edge Cases ---

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
});
