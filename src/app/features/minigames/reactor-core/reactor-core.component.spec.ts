import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { ReactorCoreComponent } from './reactor-core.component';
import { ReactorCoreEngine } from './reactor-core.engine';
import { MINIGAME_ENGINE } from '../../../core/minigame/minigame-engine.tokens';
import { KeyboardShortcutService } from '../../../core/minigame/keyboard-shortcut.service';
import {
  DifficultyTier,
  type MinigameLevel,
} from '../../../core/minigame/minigame.types';
import type {
  ReactorCoreLevelData,
  ReactorNode,
  SignalNode,
  ComputedNode,
  EffectNode,
  SimulationScenario,
  ValidGraph,
  GraphConstraint,
} from './reactor-core.types';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function createSignalNode(overrides?: Partial<SignalNode>): SignalNode {
  return {
    id: 'sig-1',
    type: 'signal',
    label: 'count',
    initialValue: 0,
    ...overrides,
  };
}

function createComputedNode(overrides?: Partial<ComputedNode>): ComputedNode {
  return {
    id: 'comp-1',
    type: 'computed',
    label: 'doubled',
    computationExpr: 'count * 2',
    dependencyIds: ['sig-1'],
    ...overrides,
  };
}

function createEffectNode(overrides?: Partial<EffectNode>): EffectNode {
  return {
    id: 'eff-1',
    type: 'effect',
    label: 'logger',
    actionDescription: 'Log doubled value',
    dependencyIds: ['comp-1'],
    ...overrides,
  };
}

function createTestLevelData(overrides?: Partial<ReactorCoreLevelData>): ReactorCoreLevelData {
  const requiredNodes: ReactorNode[] = [
    createSignalNode({ id: 'sig-1', label: 'count', initialValue: 0 }),
    createSignalNode({ id: 'sig-2', label: 'factor', initialValue: 1 }),
    createComputedNode({ id: 'comp-1', label: 'doubled', computationExpr: 'count * 2', dependencyIds: ['sig-1'] }),
    createEffectNode({ id: 'eff-1', label: 'logger', actionDescription: 'Log value', dependencyIds: ['comp-1'] }),
  ];
  const scenarios: SimulationScenario[] = [
    {
      id: 'sc-1',
      description: 'Test count change',
      signalChanges: [{ nodeId: 'sig-1', newValue: 5 }],
      expectedOutputs: [{ nodeId: 'comp-1', expectedValue: 10 }],
    },
  ];
  const validGraphs: ValidGraph[] = [
    {
      nodes: requiredNodes,
      edges: [
        { sourceId: 'sig-1', targetId: 'comp-1' },
        { sourceId: 'comp-1', targetId: 'eff-1' },
      ],
    },
  ];
  const constraints: GraphConstraint = {
    maxNodes: 10,
    requiredNodeTypes: ['signal', 'computed', 'effect'],
  };
  return { requiredNodes, scenarios, validGraphs, constraints, ...overrides };
}

function createLevel(data: ReactorCoreLevelData): MinigameLevel<ReactorCoreLevelData> {
  return {
    id: 'rc-test-01',
    gameId: 'reactor-core',
    tier: DifficultyTier.Basic,
    conceptIntroduced: 'Signals',
    description: 'Test level',
    data,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ReactorCoreComponent', () => {
  let engine: ReactorCoreEngine;
  let fixture: ComponentFixture<ReactorCoreComponent>;
  let component: ReactorCoreComponent;
  let shortcuts: KeyboardShortcutService;

  function setup(levelData?: ReactorCoreLevelData) {
    engine = new ReactorCoreEngine();
    engine.initialize(createLevel(levelData ?? createTestLevelData()));
    engine.start();

    TestBed.configureTestingModule({
      imports: [ReactorCoreComponent],
      providers: [
        { provide: MINIGAME_ENGINE, useValue: engine },
      ],
    });

    fixture = TestBed.createComponent(ReactorCoreComponent);
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

    it('should create successfully without engine token (inert mode)', () => {
      TestBed.configureTestingModule({
        imports: [ReactorCoreComponent],
      });
      const inertFixture = TestBed.createComponent(ReactorCoreComponent);
      inertFixture.detectChanges();
      expect(inertFixture.componentInstance).toBeTruthy();
      inertFixture.destroy();
    });

    it('should render the graph canvas sub-component', () => {
      setup();
      const canvas = fixture.nativeElement.querySelector('app-reactor-core-graph-canvas');
      expect(canvas).toBeTruthy();
    });

    it('should render toolbox with available node types', () => {
      setup();
      const tabs = fixture.nativeElement.querySelectorAll('.reactor-core__toolbox-tab');
      expect(tabs.length).toBe(3);
      expect(tabs[0].textContent).toContain('Signal');
      expect(tabs[1].textContent).toContain('Computed');
      expect(tabs[2].textContent).toContain('Effect');
    });
  });

  // --- 2. Toolbox Tests ---

  describe('Toolbox', () => {
    it('should default to signal toolbox type', () => {
      setup();
      expect(component.selectedToolboxType()).toBe('signal');
    });

    it('should change toolbox type on tab click', () => {
      setup();
      const tabs = fixture.nativeElement.querySelectorAll('.reactor-core__toolbox-tab') as NodeListOf<HTMLButtonElement>;
      tabs[1].click();
      fixture.detectChanges();
      expect(component.selectedToolboxType()).toBe('computed');
    });

    it('should show only unplaced required nodes in toolbox', () => {
      setup();
      // Default toolbox type is 'signal', there are 2 signal nodes (sig-1, sig-2)
      const items = fixture.nativeElement.querySelectorAll('.reactor-core__toolbox-item');
      expect(items.length).toBe(2);
    });

    it('should show "All nodes placed" when all required nodes of the type are placed', () => {
      setup();

      // Place both signal nodes
      engine.submitAction({ type: 'add-node', nodeId: 'sig-1' });
      engine.submitAction({ type: 'add-node', nodeId: 'sig-2' });
      fixture.detectChanges();

      const empty = fixture.nativeElement.querySelector('.reactor-core__toolbox-empty');
      expect(empty).toBeTruthy();
      expect(empty.textContent).toContain('All nodes placed');
    });
  });

  // --- 3. Node Placement Tests ---

  describe('Node Placement', () => {
    it('should submit add-node action when canvas emits nodeAdded', () => {
      setup();
      const submitSpy = vi.spyOn(engine, 'submitAction');

      component.onNodeAddedFromCanvas({ type: 'signal', position: { x: 100, y: 200 } });

      expect(submitSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'add-node', nodeId: 'sig-1' }),
      );
    });

    it('should submit set-node-position action after add-node', () => {
      setup();
      const submitSpy = vi.spyOn(engine, 'submitAction');

      component.onNodeAddedFromCanvas({ type: 'signal', position: { x: 100, y: 200 } });

      expect(submitSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'set-node-position', nodeId: 'sig-1', x: 100, y: 200 }),
      );
    });

    it('should remove node from toolbox after placement', () => {
      setup();

      // Before: 2 signal nodes
      expect(component.toolboxNodes().length).toBe(2);

      engine.submitAction({ type: 'add-node', nodeId: 'sig-1' });
      fixture.detectChanges();

      // After: 1 signal node
      expect(component.toolboxNodes().length).toBe(1);
    });
  });

  // --- 4. Wire Drawing Tests ---

  describe('Wire Drawing', () => {
    it('should submit connect-edge action when canvas emits edgeAdded', () => {
      setup();

      // Place nodes first
      engine.submitAction({ type: 'add-node', nodeId: 'sig-1' });
      engine.submitAction({ type: 'add-node', nodeId: 'comp-1' });

      const submitSpy = vi.spyOn(engine, 'submitAction');
      component.onEdgeAdded({ sourceId: 'sig-1', targetId: 'comp-1' });

      expect(submitSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'connect-edge', sourceId: 'sig-1', targetId: 'comp-1' }),
      );
    });

    it('should submit disconnect-edge action when canvas emits edgeRemoved', () => {
      setup();

      // Place nodes and connect
      engine.submitAction({ type: 'add-node', nodeId: 'sig-1' });
      engine.submitAction({ type: 'add-node', nodeId: 'comp-1' });
      engine.submitAction({ type: 'connect-edge', sourceId: 'sig-1', targetId: 'comp-1' });

      const submitSpy = vi.spyOn(engine, 'submitAction');
      component.onEdgeRemoved({ sourceId: 'sig-1', targetId: 'comp-1' });

      expect(submitSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'disconnect-edge', sourceId: 'sig-1', targetId: 'comp-1' }),
      );
    });
  });

  // --- 5. Node Selection and Config Tests ---

  describe('Node Selection and Config', () => {
    it('should set selectedNodeId when canvas emits nodeSelected', () => {
      setup();
      engine.submitAction({ type: 'add-node', nodeId: 'sig-1' });

      component.onNodeSelected('sig-1');
      expect(component.selectedNodeId()).toBe('sig-1');
    });

    it('should show config panel when a signal node is selected', () => {
      setup();
      engine.submitAction({ type: 'add-node', nodeId: 'sig-1' });
      component.onNodeSelected('sig-1');
      fixture.detectChanges();

      const configPanel = fixture.nativeElement.querySelector('.reactor-core__config-panel');
      expect(configPanel).toBeTruthy();
    });

    it('should clear selectedNodeId when config panel emits cancelled', () => {
      setup();
      engine.submitAction({ type: 'add-node', nodeId: 'sig-1' });
      component.onNodeSelected('sig-1');
      expect(component.selectedNodeId()).toBe('sig-1');

      component.onConfigCancelled();
      expect(component.selectedNodeId()).toBeNull();
    });
  });

  // --- 6. Simulation Tests ---

  describe('Simulation', () => {
    it('should call engine.runSimulation() on simulate button click', () => {
      setup();
      const simSpy = vi.spyOn(engine, 'runSimulation');

      const btn = fixture.nativeElement.querySelector('.reactor-core__simulate-btn') as HTMLButtonElement;
      btn.click();

      expect(simSpy).toHaveBeenCalled();
    });

    it('should set simulating signal to true during simulation animation', () => {
      vi.useFakeTimers();
      setup();

      expect(component.simulating()).toBe(false);
      component.onSimulate();
      expect(component.simulating()).toBe(true);

      vi.advanceTimersByTime(2000);
      expect(component.simulating()).toBe(false);

      vi.useRealTimers();
    });

    it('should display simulation results after simulation', () => {
      setup();

      // Place all nodes and connect them for a passing simulation
      engine.submitAction({ type: 'add-node', nodeId: 'sig-1' });
      engine.submitAction({ type: 'add-node', nodeId: 'comp-1' });
      engine.submitAction({ type: 'connect-edge', sourceId: 'sig-1', targetId: 'comp-1' });
      engine.runSimulation();
      fixture.detectChanges();

      const result = component.simulationResult();
      expect(result).toBeTruthy();
    });

    it('should disable simulate button when simulationsRemaining is 0', () => {
      setup();

      // Use up all simulations
      engine.runSimulation();
      engine.runSimulation();
      engine.runSimulation();
      fixture.detectChanges();

      const btn = fixture.nativeElement.querySelector('.reactor-core__simulate-btn') as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    });
  });

  // --- 7. Keyboard Shortcuts Tests ---

  describe('Keyboard Shortcuts', () => {
    it('should register shortcuts s, escape, 1, 2, 3 on init', () => {
      setup();
      const registered = shortcuts.getRegistered();
      expect(registered.find(r => r.key === 's')).toBeDefined();
      expect(registered.find(r => r.key === 'escape')).toBeDefined();
      expect(registered.find(r => r.key === '1')).toBeDefined();
      expect(registered.find(r => r.key === '2')).toBeDefined();
      expect(registered.find(r => r.key === '3')).toBeDefined();
    });

    it('should trigger simulation on s key', () => {
      setup();
      const simSpy = vi.spyOn(engine, 'runSimulation');

      const reg = shortcuts.getRegistered().find(r => r.key === 's');
      reg?.callback();

      expect(simSpy).toHaveBeenCalled();
    });

    it('should close config panel on Escape key when config is open', () => {
      setup();
      engine.submitAction({ type: 'add-node', nodeId: 'sig-1' });
      component.onNodeSelected('sig-1');
      expect(component.selectedNodeId()).toBe('sig-1');

      const reg = shortcuts.getRegistered().find(r => r.key === 'escape');
      reg?.callback();
      expect(component.selectedNodeId()).toBeNull();
    });

    it('should unregister all shortcuts on destroy', () => {
      setup();
      const unregisterSpy = vi.spyOn(shortcuts, 'unregister');

      component.ngOnDestroy();

      expect(unregisterSpy).toHaveBeenCalledTimes(5);
      expect(unregisterSpy).toHaveBeenCalledWith('s');
      expect(unregisterSpy).toHaveBeenCalledWith('escape');
      expect(unregisterSpy).toHaveBeenCalledWith('1');
      expect(unregisterSpy).toHaveBeenCalledWith('2');
      expect(unregisterSpy).toHaveBeenCalledWith('3');
    });
  });

  // --- 8. Edge Cases ---

  describe('Edge Cases', () => {
    it('should handle empty requiredNodes list', () => {
      setup(createTestLevelData({ requiredNodes: [] }));
      expect(component.toolboxNodes().length).toBe(0);
    });

    it('should handle node selection of non-existent ID gracefully', () => {
      setup();
      component.onNodeSelected('nonexistent-id');
      expect(component.selectedNode()).toBeNull();
    });
  });

  // --- 9. Node Config Actions ---

  describe('Node Config Actions', () => {
    it('should submit set-signal-value for signal node configuration', () => {
      setup();
      engine.submitAction({ type: 'add-node', nodeId: 'sig-1' });

      const submitSpy = vi.spyOn(engine, 'submitAction');
      const signalNode = createSignalNode({ id: 'sig-1', initialValue: 42 });
      component.onNodeConfigured(signalNode);

      expect(submitSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'set-signal-value', nodeId: 'sig-1', value: 42 }),
      );
    });

    it('should not submit engine action for computed node configuration', () => {
      setup();
      engine.submitAction({ type: 'add-node', nodeId: 'comp-1' });

      const submitSpy = vi.spyOn(engine, 'submitAction');
      const computedNode = createComputedNode({ id: 'comp-1' });
      component.onNodeConfigured(computedNode);

      expect(submitSpy).not.toHaveBeenCalled();
    });
  });
});
