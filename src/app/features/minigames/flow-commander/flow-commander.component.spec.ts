import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FlowCommanderComponent } from './flow-commander.component';
import { FlowCommanderEngine } from './flow-commander.engine';
import { MINIGAME_ENGINE } from '../../../core/minigame/minigame-engine.tokens';
import { KeyboardShortcutService } from '../../../core/minigame/keyboard-shortcut.service';
import {
  DifficultyTier,
  type MinigameLevel,
} from '../../../core/minigame/minigame.types';
import {
  GateType,
  type FlowCommanderLevelData,
  type PipelineGraph,
  type CargoItem,
  type TargetZone,
} from './pipeline.types';

// ---------------------------------------------------------------------------
// Constants (mirrored from component for assertions)
// ---------------------------------------------------------------------------

const ANIMATION_STEP_MS = 400;
const RESULT_DISPLAY_MS = 2000;

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function createTestLevelData(overrides?: Partial<FlowCommanderLevelData>): FlowCommanderLevelData {
  const graph: PipelineGraph = {
    nodes: [
      { id: 'source-1', nodeType: 'source', position: { x: 0, y: 50 }, label: 'Intake' },
      { id: 'gate-1', nodeType: 'gate-slot', position: { x: 40, y: 50 }, label: 'Gate A' },
      { id: 'junc-1', nodeType: 'junction', position: { x: 60, y: 25 }, label: '' },
      { id: 'junc-2', nodeType: 'junction', position: { x: 60, y: 75 }, label: '' },
      { id: 'target-1', nodeType: 'target-zone', position: { x: 90, y: 25 }, label: 'Red Bay' },
      { id: 'target-2', nodeType: 'target-zone', position: { x: 90, y: 75 }, label: 'Blue Bay' },
    ],
    edges: [
      { id: 'e-1', sourceNodeId: 'source-1', targetNodeId: 'gate-1' },
      { id: 'e-2', sourceNodeId: 'gate-1', targetNodeId: 'junc-1' },
      { id: 'e-3', sourceNodeId: 'gate-1', targetNodeId: 'junc-2' },
      { id: 'e-4', sourceNodeId: 'junc-1', targetNodeId: 'target-1' },
      { id: 'e-5', sourceNodeId: 'junc-2', targetNodeId: 'target-2' },
    ],
  };
  const cargoItems: CargoItem[] = [
    { id: 'cargo-red', color: 'red', label: 'R1', type: 'fuel', priority: 'high' },
    { id: 'cargo-blue', color: 'blue', label: 'B1', type: 'coolant', priority: 'low' },
  ];
  const targetZones: TargetZone[] = [
    { id: 'tz-1', nodeId: 'target-1', label: 'Red Bay', expectedColor: 'red' },
    { id: 'tz-2', nodeId: 'target-2', label: 'Blue Bay', expectedColor: 'blue' },
  ];
  return {
    graph,
    cargoItems,
    availableGateTypes: [GateType.if, GateType.switch],
    targetZones,
    ...overrides,
  };
}

function createLevel(data: FlowCommanderLevelData, tier: DifficultyTier = DifficultyTier.Basic): MinigameLevel<FlowCommanderLevelData> {
  return {
    id: 'fc-test-01',
    gameId: 'flow-commander',
    tier,
    conceptIntroduced: 'Test flow control',
    description: 'Test level',
    data,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('FlowCommanderComponent', () => {
  let engine: FlowCommanderEngine;
  let fixture: ComponentFixture<FlowCommanderComponent>;
  let component: FlowCommanderComponent;
  let shortcuts: KeyboardShortcutService;

  function setup(levelData?: FlowCommanderLevelData, tier?: DifficultyTier) {
    engine = new FlowCommanderEngine();
    engine.initialize(createLevel(levelData ?? createTestLevelData(), tier));
    engine.start();

    TestBed.configureTestingModule({
      imports: [FlowCommanderComponent],
      providers: [
        { provide: MINIGAME_ENGINE, useValue: engine },
      ],
    });

    fixture = TestBed.createComponent(FlowCommanderComponent);
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
        imports: [FlowCommanderComponent],
      });
      const inertFixture = TestBed.createComponent(FlowCommanderComponent);
      inertFixture.detectChanges();
      expect(inertFixture.componentInstance).toBeTruthy();
      inertFixture.destroy();
    });

    it('should render pipeline edges matching engine graph edge count', () => {
      setup();
      const tubes = fixture.nativeElement.querySelectorAll('.flow-commander__tube');
      expect(tubes.length).toBe(5);
    });

    it('should render gate-slot nodes for all gate-slot type nodes', () => {
      setup();
      const gateSlots = fixture.nativeElement.querySelectorAll('.flow-commander__node--gate-slot');
      expect(gateSlots.length).toBe(1);
    });
  });

  // --- 2. Gate Placement Tests ---

  describe('Gate Placement', () => {
    it('should place selected gate type on gate-slot click', () => {
      setup();
      const submitSpy = vi.spyOn(engine, 'submitAction');

      const gateSlot = fixture.nativeElement.querySelector('.flow-commander__node--gate-slot') as SVGGElement;
      gateSlot.dispatchEvent(new Event('click', { bubbles: true }));

      expect(submitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'place-gate',
          nodeId: 'gate-1',
          gateType: GateType.if,
          condition: '',
        }),
      );
    });

    it('should show gate type label after placement', () => {
      setup();

      // Place a gate
      engine.submitAction({ type: 'place-gate', nodeId: 'gate-1', gateType: GateType.if, condition: '' });
      fixture.detectChanges();

      const gateLabel = fixture.nativeElement.querySelector('.flow-commander__gate-label');
      expect(gateLabel).toBeTruthy();
      expect(gateLabel.textContent).toContain('if');
    });

    it('should remove gate on right-click', () => {
      setup();

      // Place a gate first
      engine.submitAction({ type: 'place-gate', nodeId: 'gate-1', gateType: GateType.if, condition: '' });
      fixture.detectChanges();

      const submitSpy = vi.spyOn(engine, 'submitAction');
      const gateSlot = fixture.nativeElement.querySelector('.flow-commander__node--gate-slot') as SVGGElement;
      const contextEvent = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
      gateSlot.dispatchEvent(contextEvent);

      expect(submitSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'remove-gate', nodeId: 'gate-1' }),
      );
    });

    it('should open condition editor on click of already-placed gate', () => {
      setup();

      // Place a gate
      engine.submitAction({ type: 'place-gate', nodeId: 'gate-1', gateType: GateType.if, condition: '' });
      fixture.detectChanges();

      // Click the placed gate
      const gateSlot = fixture.nativeElement.querySelector('.flow-commander__node--gate-slot') as SVGGElement;
      gateSlot.dispatchEvent(new Event('click', { bubbles: true }));
      fixture.detectChanges();

      expect(component.editingGateId()).toBe('gate-1');
      const editor = fixture.nativeElement.querySelector('.flow-commander__condition-editor');
      expect(editor).toBeTruthy();
    });
  });

  // --- 3. Gate Type Selection Tests ---

  describe('Gate Type Selection', () => {
    it('should default to @if gate type', () => {
      setup();
      expect(component.selectedGateType()).toBe(GateType.if);
    });

    it('should change selected gate type on toolbox button click', () => {
      setup();
      const buttons = fixture.nativeElement.querySelectorAll('.flow-commander__gate-btn') as NodeListOf<HTMLButtonElement>;
      // Click the @switch button (third; note: only @if and @switch are available but all 3 options are shown in toolbox)
      buttons[2].click();
      fixture.detectChanges();
      expect(component.selectedGateType()).toBe(GateType.switch);
    });

    it('should highlight active gate type button with --active class', () => {
      setup();
      const buttons = fixture.nativeElement.querySelectorAll('.flow-commander__gate-btn');
      expect(buttons[0].classList.contains('flow-commander__gate-btn--active')).toBe(true);
      expect(buttons[1].classList.contains('flow-commander__gate-btn--active')).toBe(false);

      // Change to @for (second button)
      component.selectGateType(GateType.for);
      fixture.detectChanges();

      const updatedButtons = fixture.nativeElement.querySelectorAll('.flow-commander__gate-btn');
      expect(updatedButtons[0].classList.contains('flow-commander__gate-btn--active')).toBe(false);
      expect(updatedButtons[1].classList.contains('flow-commander__gate-btn--active')).toBe(true);
    });
  });

  // --- 4. Condition Editor Tests ---

  describe('Condition Editor', () => {
    it('should render gate config panel when editing gate', () => {
      setup();

      engine.submitAction({ type: 'place-gate', nodeId: 'gate-1', gateType: GateType.if, condition: '' });
      component.editingGateId.set('gate-1');
      fixture.detectChanges();

      const gateConfig = fixture.nativeElement.querySelector('app-flow-commander-gate-config');
      expect(gateConfig).toBeTruthy();
    });

    it('should submit configure-gate action and close panel on condition applied', () => {
      setup();
      const submitSpy = vi.spyOn(engine, 'submitAction');

      engine.submitAction({ type: 'place-gate', nodeId: 'gate-1', gateType: GateType.if, condition: '' });
      component.editingGateId.set('gate-1');
      fixture.detectChanges();

      submitSpy.mockClear();

      component.onConditionApplied("item.color === 'red'");

      expect(submitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'configure-gate',
          nodeId: 'gate-1',
          condition: "item.color === 'red'",
        }),
      );
      expect(component.editingGateId()).toBeNull();
    });

    it('should use guided mode for @if gates and raw mode for @for gates', () => {
      setup(createTestLevelData({
        graph: {
          nodes: [
            { id: 'source-1', nodeType: 'source', position: { x: 0, y: 50 }, label: 'Intake' },
            { id: 'gate-1', nodeType: 'gate-slot', position: { x: 30, y: 30 }, label: 'Gate A' },
            { id: 'gate-2', nodeType: 'gate-slot', position: { x: 30, y: 70 }, label: 'Gate B' },
            { id: 'target-1', nodeType: 'target-zone', position: { x: 90, y: 50 }, label: 'Out' },
          ],
          edges: [
            { id: 'e-1', sourceNodeId: 'source-1', targetNodeId: 'gate-1' },
            { id: 'e-2', sourceNodeId: 'source-1', targetNodeId: 'gate-2' },
            { id: 'e-3', sourceNodeId: 'gate-1', targetNodeId: 'target-1' },
            { id: 'e-4', sourceNodeId: 'gate-2', targetNodeId: 'target-1' },
          ],
        },
        availableGateTypes: [GateType.if, GateType.for],
      }));

      // Place an @if gate
      engine.submitAction({ type: 'place-gate', nodeId: 'gate-1', gateType: GateType.if, condition: '' });
      // Place an @for gate
      component.selectGateType(GateType.for);
      engine.submitAction({ type: 'place-gate', nodeId: 'gate-2', gateType: GateType.for, condition: '' });

      // Check @if gate mode
      component.editingGateId.set('gate-1');
      expect(component.conditionEditorMode()).toBe('guided');

      // Check @for gate mode
      component.editingGateId.set('gate-2');
      expect(component.conditionEditorMode()).toBe('raw');
    });

    it('should close editor on cancel without submitting configure-gate', () => {
      setup();
      const submitSpy = vi.spyOn(engine, 'submitAction');

      engine.submitAction({ type: 'place-gate', nodeId: 'gate-1', gateType: GateType.if, condition: '' });
      component.editingGateId.set('gate-1');
      fixture.detectChanges();

      submitSpy.mockClear();

      component.closeConditionEditor();

      expect(component.editingGateId()).toBeNull();
      expect(submitSpy).not.toHaveBeenCalled();
    });

    it('should use guided mode for @if gates on Basic tier', () => {
      setup(undefined, DifficultyTier.Basic);

      engine.submitAction({ type: 'place-gate', nodeId: 'gate-1', gateType: GateType.if, condition: '' });
      component.editingGateId.set('gate-1');

      expect(component.conditionEditorMode()).toBe('guided');
    });

    it('should use raw mode for @if gates on Advanced tier', () => {
      setup(undefined, DifficultyTier.Advanced);

      engine.submitAction({ type: 'place-gate', nodeId: 'gate-1', gateType: GateType.if, condition: '' });
      component.editingGateId.set('gate-1');

      expect(component.conditionEditorMode()).toBe('raw');
    });

    it('should use raw mode for @for gates regardless of tier', () => {
      setup(createTestLevelData({ availableGateTypes: [GateType.if, GateType.for] }), DifficultyTier.Basic);

      engine.submitAction({ type: 'place-gate', nodeId: 'gate-1', gateType: GateType.for, condition: '' });
      component.editingGateId.set('gate-1');

      expect(component.conditionEditorMode()).toBe('raw');
    });

    it('should use raw mode for @switch gates regardless of tier', () => {
      setup(undefined, DifficultyTier.Basic);

      engine.submitAction({ type: 'place-gate', nodeId: 'gate-1', gateType: GateType.switch, condition: '' });
      component.editingGateId.set('gate-1');

      expect(component.conditionEditorMode()).toBe('raw');
    });

    it('should bind correct gateType to gate config component', () => {
      setup(undefined, DifficultyTier.Basic);

      engine.submitAction({ type: 'place-gate', nodeId: 'gate-1', gateType: GateType.switch, condition: '' });
      component.editingGateId.set('gate-1');
      fixture.detectChanges();

      expect(component.editingGateType()).toBe(GateType.switch);
      const gateConfig = fixture.nativeElement.querySelector('app-flow-commander-gate-config');
      expect(gateConfig).toBeTruthy();
    });

    it('should dismiss panel on backdrop click', () => {
      setup();

      engine.submitAction({ type: 'place-gate', nodeId: 'gate-1', gateType: GateType.if, condition: '' });
      component.editingGateId.set('gate-1');
      fixture.detectChanges();

      const backdrop = fixture.nativeElement.querySelector('.flow-commander__config-backdrop') as HTMLDivElement;
      expect(backdrop).toBeTruthy();
      backdrop.click();
      fixture.detectChanges();

      expect(component.editingGateId()).toBeNull();
      const gateConfig = fixture.nativeElement.querySelector('app-flow-commander-gate-config');
      expect(gateConfig).toBeFalsy();
    });

    it('should dismiss panel on Escape key', () => {
      setup();

      engine.submitAction({ type: 'place-gate', nodeId: 'gate-1', gateType: GateType.if, condition: '' });
      component.editingGateId.set('gate-1');
      fixture.detectChanges();

      expect(component.editingGateId()).toBe('gate-1');

      // Trigger escape shortcut
      const escReg = shortcuts.getRegistered().find(r => r.key === 'escape');
      escReg?.callback();

      expect(component.editingGateId()).toBeNull();
    });
  });

  // --- 5. Simulation / Cargo Animation Tests ---

  describe('Simulation', () => {
    it('should call engine.simulate() on Run button click', () => {
      setup();
      const simulateSpy = vi.spyOn(engine, 'simulate');

      const runBtn = fixture.nativeElement.querySelector('.flow-commander__run-btn') as HTMLButtonElement;
      runBtn.click();

      expect(simulateSpy).toHaveBeenCalled();
    });

    it('should display animating cargo pods during simulation', () => {
      setup();

      // Place a gate so items can route
      engine.submitAction({ type: 'place-gate', nodeId: 'gate-1', gateType: GateType.if, condition: "item.color === 'red'" });

      component.onRun();
      fixture.detectChanges();

      const cargoPods = fixture.nativeElement.querySelectorAll('.flow-commander__cargo-pod');
      expect(cargoPods.length).toBeGreaterThan(0);
    });

    it('should disable Run button while simulation is in progress', () => {
      setup();

      engine.submitAction({ type: 'place-gate', nodeId: 'gate-1', gateType: GateType.if, condition: "item.color === 'red'" });

      component.onRun();
      fixture.detectChanges();

      const runBtn = fixture.nativeElement.querySelector('.flow-commander__run-btn') as HTMLButtonElement;
      expect(runBtn.disabled).toBe(true);
    });

    it('should show correct/incorrect CSS classes after animation completes', () => {
      vi.useFakeTimers();
      setup();

      // Place @if gate that routes red cargo to first output (junc-1 -> target-1 = Red Bay)
      engine.submitAction({ type: 'place-gate', nodeId: 'gate-1', gateType: GateType.if, condition: "item.color === 'red'" });

      component.onRun();
      fixture.detectChanges();

      // Items route: source-1 -> gate-1 -> junc-1/junc-2 -> target-1/target-2 (path length 4)
      // maxSegments = 4, so completion timer fires at 4 * 400ms = 1600ms
      // Advance just past completion (mark animationComplete) but NOT past RESULT_DISPLAY_MS
      // which would clear the animatingItems array
      const completionTime = 4 * ANIMATION_STEP_MS + 1;
      vi.advanceTimersByTime(completionTime);
      fixture.detectChanges();

      const correctPods = fixture.nativeElement.querySelectorAll('.flow-commander__cargo-pod--correct');
      const incorrectPods = fixture.nativeElement.querySelectorAll('.flow-commander__cargo-pod--incorrect');
      // At least one of the cargo items should have a result class
      expect(correctPods.length + incorrectPods.length).toBeGreaterThan(0);

      vi.useRealTimers();
    });
  });

  // --- 6. Reset Tests ---

  describe('Reset', () => {
    it('should clear animation state on Reset button click', () => {
      setup();

      engine.submitAction({ type: 'place-gate', nodeId: 'gate-1', gateType: GateType.if, condition: "item.color === 'red'" });
      component.onRun();
      fixture.detectChanges();

      expect(component.animatingItems().length).toBeGreaterThan(0);

      const resetBtn = fixture.nativeElement.querySelector('.flow-commander__reset-btn') as HTMLButtonElement;
      resetBtn.click();
      fixture.detectChanges();

      expect(component.animatingItems().length).toBe(0);
      expect(component.simulationDone()).toBeNull();
    });

    it('should clear pending timers on Reset', () => {
      vi.useFakeTimers();
      setup();

      engine.submitAction({ type: 'place-gate', nodeId: 'gate-1', gateType: GateType.if, condition: "item.color === 'red'" });
      component.onRun();

      // Reset immediately (timers pending)
      component.onReset();

      // Advance time well past all animation timers
      vi.advanceTimersByTime(20 * ANIMATION_STEP_MS + RESULT_DISPLAY_MS);

      // Animation state should still be empty (timers were cleared)
      expect(component.animatingItems().length).toBe(0);

      vi.useRealTimers();
    });
  });

  // --- 7. Keyboard Shortcut Tests ---

  describe('Keyboard Shortcuts', () => {
    it('should register keys 1/2/3/r/escape on init', () => {
      setup();
      const registered = shortcuts.getRegistered();
      expect(registered.find(r => r.key === '1')).toBeDefined();
      expect(registered.find(r => r.key === '2')).toBeDefined();
      expect(registered.find(r => r.key === '3')).toBeDefined();
      expect(registered.find(r => r.key === 'r')).toBeDefined();
      expect(registered.find(r => r.key === 'escape')).toBeDefined();
    });

    it('should select gate type on number key press', () => {
      setup();
      // Simulate pressing '2' for @for
      const reg = shortcuts.getRegistered().find(r => r.key === '2');
      reg?.callback();
      expect(component.selectedGateType()).toBe(GateType.for);
    });

    it('should unregister all 5 shortcuts on destroy', () => {
      setup();
      const unregisterSpy = vi.spyOn(shortcuts, 'unregister');

      component.ngOnDestroy();

      // Should unregister 5 keys: 1, 2, 3, r, escape
      expect(unregisterSpy).toHaveBeenCalledTimes(5);
      expect(unregisterSpy).toHaveBeenCalledWith('1');
      expect(unregisterSpy).toHaveBeenCalledWith('2');
      expect(unregisterSpy).toHaveBeenCalledWith('3');
      expect(unregisterSpy).toHaveBeenCalledWith('r');
      expect(unregisterSpy).toHaveBeenCalledWith('escape');
    });
  });

  // --- 8. Edge Cases ---

  describe('Edge Cases', () => {
    it('should handle empty graph (0 nodes, 0 edges)', () => {
      setup(createTestLevelData({
        graph: { nodes: [], edges: [] },
        cargoItems: [],
        targetZones: [],
      }));
      fixture.detectChanges();

      const tubes = fixture.nativeElement.querySelectorAll('.flow-commander__tube');
      expect(tubes.length).toBe(0);
      const gateSlots = fixture.nativeElement.querySelectorAll('.flow-commander__node--gate-slot');
      expect(gateSlots.length).toBe(0);
    });

    it('should handle simulation with no gates placed (items lost)', () => {
      setup();
      const simulateSpy = vi.spyOn(engine, 'simulate').mockReturnValue({
        itemResults: [
          { item: { id: 'cargo-red', color: 'red', label: 'R1', type: 'fuel', priority: 'high' }, path: ['source-1'], destinationNodeId: null, targetZoneId: null, correct: false },
        ],
        allCorrect: false,
        correctCount: 0,
        incorrectCount: 1,
        lostCount: 1,
      });

      component.onRun();
      fixture.detectChanges();

      expect(simulateSpy).toHaveBeenCalled();
      expect(component.animatingItems().length).toBe(1);
    });
  });
});
