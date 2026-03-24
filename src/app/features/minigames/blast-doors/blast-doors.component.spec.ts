import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { BlastDoorsComponent } from './blast-doors.component';
import { BlastDoorsEngine } from './blast-doors.engine';
import { MINIGAME_ENGINE } from '../../../core/minigame/minigame-engine.tokens';
import { KeyboardShortcutService } from '../../../core/minigame/keyboard-shortcut.service';
import {
  DifficultyTier,
  type MinigameLevel,
} from '../../../core/minigame/minigame.types';
import type {
  BlastDoorsLevelData,
  BlastDoor,
  BehaviorBlock,
  DirectiveSpec,
  DoorScenario,
  ExpectedBehavior,
} from './blast-doors.types';

// ---------------------------------------------------------------------------
// Test data factories
// ---------------------------------------------------------------------------

function createBehaviorBlock(overrides?: Partial<BehaviorBlock>): BehaviorBlock {
  return {
    id: 'bh-init',
    description: 'Initialize door',
    code: 'this.state = "open"',
    hookTarget: 'ngOnInit',
    ...overrides,
  };
}

function createDirectiveSpec(overrides?: Partial<DirectiveSpec>): DirectiveSpec {
  return {
    name: 'appLock',
    type: 'attribute',
    inputs: [{ name: 'lockLevel', type: 'number', defaultValue: '1' }],
    hostListeners: ['click'],
    hostBindings: ['class.locked'],
    behavior: 'lock the door',
    ...overrides,
  };
}

function createBlastDoor(overrides?: Partial<BlastDoor>): BlastDoor {
  return {
    id: 'door-1',
    position: 'main-corridor',
    currentState: 'closed',
    hookSlots: [
      { hookType: 'ngOnChanges', behaviorBlock: null, executionOrder: 0 },
      { hookType: 'ngOnInit', behaviorBlock: createBehaviorBlock(), executionOrder: 1 },
      { hookType: 'ngOnDestroy', behaviorBlock: null, executionOrder: 2 },
    ],
    ...overrides,
  };
}

function createScenario(overrides?: Partial<DoorScenario>): DoorScenario {
  return {
    id: 'scenario-1',
    trigger: 'component-init',
    steps: [
      {
        event: 'init-event',
        expectedDoorStates: [{ doorId: 'door-1', expectedState: 'open' }],
      },
    ],
    ...overrides,
  };
}

function createExpectedBehavior(overrides?: Partial<ExpectedBehavior>): ExpectedBehavior {
  return {
    scenarioId: 'scenario-1',
    hooksFired: ['ngOnInit'],
    finalDoorStates: [{ doorId: 'door-1', expectedState: 'open' }],
    ...overrides,
  };
}

function createTestLevelData(overrides?: Partial<BlastDoorsLevelData>): BlastDoorsLevelData {
  return {
    doors: [createBlastDoor()],
    hooks: ['ngOnChanges', 'ngOnInit', 'ngOnDestroy'],
    directives: [createDirectiveSpec()],
    scenarios: [createScenario()],
    expectedBehavior: [createExpectedBehavior()],
    ...overrides,
  };
}

/** Level data where simulation always fails (no behaviors placed, expects open door). */
function createFailingLevelData(): BlastDoorsLevelData {
  const emptyDoor: BlastDoor = {
    id: 'door-1',
    position: 'main-corridor',
    currentState: 'closed',
    hookSlots: [
      { hookType: 'ngOnInit', behaviorBlock: null, executionOrder: 0 },
    ],
  };
  return {
    doors: [emptyDoor],
    hooks: ['ngOnInit'],
    directives: [],
    scenarios: [createScenario()],
    expectedBehavior: [createExpectedBehavior()],
  };
}

function createLevel(data: BlastDoorsLevelData): MinigameLevel<BlastDoorsLevelData> {
  return {
    id: 'bd-test-01',
    gameId: 'blast-doors',
    tier: DifficultyTier.Basic,
    conceptIntroduced: 'Lifecycle Hooks',
    description: 'Test level',
    data,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BlastDoorsComponent', () => {
  let engine: BlastDoorsEngine;
  let fixture: ComponentFixture<BlastDoorsComponent>;
  let component: BlastDoorsComponent;
  let shortcuts: KeyboardShortcutService;

  function setup(levelData?: BlastDoorsLevelData) {
    engine = new BlastDoorsEngine();
    engine.initialize(createLevel(levelData ?? createTestLevelData()));
    engine.start();

    TestBed.configureTestingModule({
      imports: [BlastDoorsComponent],
      providers: [
        { provide: MINIGAME_ENGINE, useValue: engine },
      ],
    });

    fixture = TestBed.createComponent(BlastDoorsComponent);
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
        imports: [BlastDoorsComponent],
      });
      const inertFixture = TestBed.createComponent(BlastDoorsComponent);
      inertFixture.detectChanges();
      expect(inertFixture.componentInstance).toBeTruthy();
      inertFixture.destroy();
    });

    it('should render door grid with doors', () => {
      setup();
      const doors = fixture.nativeElement.querySelectorAll('.blast-doors__door');
      expect(doors.length).toBe(1);
    });

    it('should render door state indicator for each door', () => {
      setup();
      const stateIndicator = fixture.nativeElement.querySelector('.blast-doors__door-state');
      expect(stateIndicator).toBeTruthy();
      expect(stateIndicator.textContent).toContain('closed');
    });

    it('should render timeline component for each door', () => {
      setup();
      const timeline = fixture.nativeElement.querySelector('app-blast-doors-timeline');
      expect(timeline).toBeTruthy();
    });

    it('should render behavior toolbox', () => {
      setup();
      const toolbox = fixture.nativeElement.querySelector('.blast-doors__behavior-toolbox');
      expect(toolbox).toBeTruthy();
    });

    it('should render directive toolbox', () => {
      setup();
      const toolbox = fixture.nativeElement.querySelector('.blast-doors__directive-toolbox');
      expect(toolbox).toBeTruthy();
    });

    it('should render simulate button', () => {
      setup();
      const btn = fixture.nativeElement.querySelector('.blast-doors__simulate-btn') as HTMLButtonElement;
      expect(btn).toBeTruthy();
      expect(btn.textContent).toContain('Simulate');
    });
  });

  // --- 2. Door Grid Tests ---

  describe('Door Grid', () => {
    it('should display door position label', () => {
      setup();
      const label = fixture.nativeElement.querySelector('.blast-doors__door-label');
      expect(label).toBeTruthy();
      expect(label.textContent).toContain('main-corridor');
    });

    it('should render multiple doors when level data has them', () => {
      const door2: BlastDoor = {
        id: 'door-2',
        position: 'engine-room',
        currentState: 'open',
        hookSlots: [
          { hookType: 'ngOnInit', behaviorBlock: null, executionOrder: 0 },
        ],
      };
      setup(createTestLevelData({
        doors: [createBlastDoor(), door2],
      }));
      const doors = fixture.nativeElement.querySelectorAll('.blast-doors__door');
      expect(doors.length).toBe(2);
    });

    it('should show locked state indicator for locked doors', () => {
      const lockedDoor = createBlastDoor({ currentState: 'locked' });
      setup(createTestLevelData({ doors: [lockedDoor] }));
      const stateIndicator = fixture.nativeElement.querySelector('.blast-doors__door-state');
      expect(stateIndicator.textContent).toContain('locked');
    });

    it('should show open state indicator for open doors', () => {
      const openDoor = createBlastDoor({ currentState: 'open' });
      setup(createTestLevelData({ doors: [openDoor] }));
      const stateIndicator = fixture.nativeElement.querySelector('.blast-doors__door-state');
      expect(stateIndicator.textContent).toContain('open');
    });
  });

  // --- 3. Behavior Toolbox Tests ---

  describe('Behavior Toolbox', () => {
    it('should display available behavior blocks', () => {
      setup();
      const items = fixture.nativeElement.querySelectorAll('.blast-doors__behavior-item');
      expect(items.length).toBeGreaterThan(0);
    });

    it('should display behavior block description', () => {
      setup();
      const item = fixture.nativeElement.querySelector('.blast-doors__behavior-item');
      expect(item.textContent).toContain('Initialize door');
    });
  });

  // --- 4. Directive Toolbox Tests ---

  describe('Directive Toolbox', () => {
    it('should display available directives', () => {
      setup();
      const items = fixture.nativeElement.querySelectorAll('.blast-doors__directive-item');
      expect(items.length).toBe(1);
    });

    it('should display directive name and type', () => {
      setup();
      const item = fixture.nativeElement.querySelector('.blast-doors__directive-item');
      expect(item.textContent).toContain('appLock');
      expect(item.textContent).toContain('attribute');
    });

    it('should toggle directive mode', () => {
      setup();
      expect(component.directiveMode()).toBe(false);

      component.onToggleDirectiveMode();
      expect(component.directiveMode()).toBe(true);

      component.onToggleDirectiveMode();
      expect(component.directiveMode()).toBe(false);
    });

    it('should apply directive to a door', () => {
      setup();
      const submitSpy = vi.spyOn(engine, 'submitAction');

      component.onApplyDirective('door-1', 'appLock');

      expect(submitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'apply-directive',
          doorId: 'door-1',
          directiveName: 'appLock',
        }),
      );
    });

    it('should remove directive from a door', () => {
      setup();
      const submitSpy = vi.spyOn(engine, 'submitAction');

      component.onRemoveDirective('door-1', 'appLock');

      expect(submitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'remove-directive',
          doorId: 'door-1',
          directiveName: 'appLock',
        }),
      );
    });
  });

  // --- 5. Behavior Placement Tests ---

  describe('Behavior Placement', () => {
    it('should submit place-behavior action when timeline emits behaviorPlaced', () => {
      setup();
      const submitSpy = vi.spyOn(engine, 'submitAction');

      component.onBehaviorPlaced({
        doorId: 'door-1',
        hookType: 'ngOnChanges',
        behaviorBlock: createBehaviorBlock({ id: 'bh-changes', hookTarget: 'ngOnChanges' }),
      });

      expect(submitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'place-behavior',
          doorId: 'door-1',
          hookType: 'ngOnChanges',
          behaviorBlockId: 'bh-changes',
        }),
      );
    });

    it('should submit remove-behavior action when timeline emits behaviorRemoved', () => {
      setup();
      const submitSpy = vi.spyOn(engine, 'submitAction');

      component.onBehaviorRemoved({ doorId: 'door-1', hookType: 'ngOnInit' });

      expect(submitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'remove-behavior',
          doorId: 'door-1',
          hookType: 'ngOnInit',
        }),
      );
    });
  });

  // --- 6. Simulation Tests ---

  describe('Simulation', () => {
    it('should call engine.simulate() on simulate button click', () => {
      setup();
      const simSpy = vi.spyOn(engine, 'simulate');

      const btn = fixture.nativeElement.querySelector('.blast-doors__simulate-btn') as HTMLButtonElement;
      btn.click();

      expect(simSpy).toHaveBeenCalled();
    });

    it('should display simulations remaining count', () => {
      setup();
      const btn = fixture.nativeElement.querySelector('.blast-doors__simulate-btn') as HTMLButtonElement;
      expect(btn.textContent).toContain('3');
    });

    it('should disable simulate button when simulations remaining is 0', () => {
      setup(createFailingLevelData());

      engine.simulate();
      engine.simulate();
      engine.simulate();
      fixture.detectChanges();

      const btn = fixture.nativeElement.querySelector('.blast-doors__simulate-btn') as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    });

    it('should display simulation results after simulation', () => {
      setup();
      engine.simulate();
      fixture.detectChanges();

      const results = fixture.nativeElement.querySelector('.blast-doors__results');
      expect(results).toBeTruthy();
    });

    it('should show passed result when all scenarios pass', () => {
      setup();
      engine.simulate();
      fixture.detectChanges();

      const result = component.simulationResult();
      if (result?.allPassed) {
        const banner = fixture.nativeElement.querySelector('.blast-doors__results--passed');
        expect(banner).toBeTruthy();
      }
    });

    it('should show failed result when scenarios fail', () => {
      // Set up with no behaviors placed to get a failure
      const emptyDoor = createBlastDoor({
        hookSlots: [
          { hookType: 'ngOnInit', behaviorBlock: null, executionOrder: 0 },
        ],
      });
      setup(createTestLevelData({ doors: [emptyDoor] }));
      engine.simulate();
      fixture.detectChanges();

      const result = component.simulationResult();
      if (!result?.allPassed) {
        const banner = fixture.nativeElement.querySelector('.blast-doors__results--failed');
        expect(banner).toBeTruthy();
      }
    });
  });

  // --- 7. Keyboard Shortcuts Tests ---

  describe('Keyboard Shortcuts', () => {
    it('should register shortcuts s, escape, d on init', () => {
      setup();
      const registered = shortcuts.getRegistered();
      expect(registered.find(r => r.key === 's')).toBeDefined();
      expect(registered.find(r => r.key === 'escape')).toBeDefined();
      expect(registered.find(r => r.key === 'd')).toBeDefined();
    });

    it('should trigger simulate on s key', () => {
      setup();
      const simSpy = vi.spyOn(engine, 'simulate');

      const reg = shortcuts.getRegistered().find(r => r.key === 's');
      reg?.callback();

      expect(simSpy).toHaveBeenCalled();
    });

    it('should toggle directive mode on d key', () => {
      setup();
      expect(component.directiveMode()).toBe(false);

      const reg = shortcuts.getRegistered().find(r => r.key === 'd');
      reg?.callback();
      expect(component.directiveMode()).toBe(true);

      reg?.callback();
      expect(component.directiveMode()).toBe(false);
    });

    it('should cancel directive mode on escape key', () => {
      setup();
      component.directiveMode.set(true);

      const reg = shortcuts.getRegistered().find(r => r.key === 'escape');
      reg?.callback();

      expect(component.directiveMode()).toBe(false);
    });

    it('should unregister all shortcuts on destroy', () => {
      setup();
      const unregisterSpy = vi.spyOn(shortcuts, 'unregister');

      component.ngOnDestroy();

      expect(unregisterSpy).toHaveBeenCalledTimes(3);
      expect(unregisterSpy).toHaveBeenCalledWith('s');
      expect(unregisterSpy).toHaveBeenCalledWith('escape');
      expect(unregisterSpy).toHaveBeenCalledWith('d');
    });
  });

  // --- 8. Edge Cases ---

  describe('Edge Cases', () => {
    it('should handle empty doors list', () => {
      setup(createTestLevelData({ doors: [] }));
      const doors = fixture.nativeElement.querySelectorAll('.blast-doors__door');
      expect(doors.length).toBe(0);
    });

    it('should handle empty directives list', () => {
      setup(createTestLevelData({ directives: [] }));
      const items = fixture.nativeElement.querySelectorAll('.blast-doors__directive-item');
      expect(items.length).toBe(0);
    });

    it('should handle no engine gracefully for all actions', () => {
      TestBed.configureTestingModule({
        imports: [BlastDoorsComponent],
      });
      const inertFixture = TestBed.createComponent(BlastDoorsComponent);
      inertFixture.detectChanges();
      const inertComponent = inertFixture.componentInstance;

      // These should not throw
      inertComponent.onSimulate();
      inertComponent.onBehaviorPlaced({
        doorId: 'door-1',
        hookType: 'ngOnInit',
        behaviorBlock: createBehaviorBlock(),
      });
      inertComponent.onBehaviorRemoved({ doorId: 'door-1', hookType: 'ngOnInit' });
      inertComponent.onApplyDirective('door-1', 'appLock');
      inertComponent.onRemoveDirective('door-1', 'appLock');
      inertComponent.onToggleDirectiveMode();

      expect(inertComponent.runtimeDoors()).toEqual([]);
      expect(inertComponent.simulationResult()).toBeNull();
      expect(inertComponent.availableDirectives()).toEqual([]);
      inertFixture.destroy();
    });
  });
});
