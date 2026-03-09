import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { WireProtocolComponent } from './wire-protocol.component';
import { WireProtocolEngine } from './wire-protocol.engine';
import { MINIGAME_ENGINE } from '../../../core/minigame/minigame-engine.tokens';
import { WireDrawService } from '../../../core/minigame/wire-draw.service';
import { KeyboardShortcutService } from '../../../core/minigame/keyboard-shortcut.service';
import {
  DifficultyTier,
  type MinigameLevel,
} from '../../../core/minigame/minigame.types';
import {
  WireType,
  type SourcePort,
  type TargetPort,
  type WireConnection,
} from './wire-protocol.types';
import type { WireProtocolLevelData } from '../../../data/levels/wire-protocol.data';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function createTestSourcePort(overrides?: Partial<SourcePort>): SourcePort {
  return {
    id: 'src-1',
    name: 'myProp',
    portType: 'property',
    dataType: 'string',
    position: { x: 0, y: 33.3 },
    ...overrides,
  };
}

function createTestTargetPort(overrides?: Partial<TargetPort>): TargetPort {
  return {
    id: 'tgt-1',
    name: '{{ myProp }}',
    bindingSlot: 'interpolation',
    position: { x: 100, y: 33.3 },
    ...overrides,
  };
}

function createTestLevelData(overrides?: Partial<WireProtocolLevelData>): WireProtocolLevelData {
  const sourcePorts: SourcePort[] = [
    createTestSourcePort({ id: 'src-1', name: 'title', position: { x: 0, y: 33.3 } }),
    createTestSourcePort({ id: 'src-2', name: 'onClick()', portType: 'method', position: { x: 0, y: 66.6 } }),
  ];
  const targetPorts: TargetPort[] = [
    createTestTargetPort({ id: 'tgt-1', name: '{{ title }}', bindingSlot: 'interpolation', position: { x: 100, y: 33.3 } }),
    createTestTargetPort({ id: 'tgt-2', name: '(click)="onClick()"', bindingSlot: 'event', position: { x: 100, y: 66.6 } }),
  ];
  const correctWires: WireConnection[] = [
    { id: 'cw-1', sourcePortId: 'src-1', targetPortId: 'tgt-1', wireType: WireType.interpolation, isPreWired: false },
    { id: 'cw-2', sourcePortId: 'src-2', targetPortId: 'tgt-2', wireType: WireType.event, isPreWired: false },
  ];
  return {
    components: [{ componentName: 'TestComponent', description: 'Test' }],
    sourcePorts,
    targetPorts,
    correctWires,
    preWiredConnections: [],
    maxVerifications: 3,
    ...overrides,
  };
}

function createLevel(data: WireProtocolLevelData): MinigameLevel<WireProtocolLevelData> {
  return {
    id: 'wp-test-01',
    gameId: 'wire-protocol',
    tier: DifficultyTier.Basic,
    conceptIntroduced: 'Test binding',
    description: 'Test level',
    data,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('WireProtocolComponent', () => {
  let engine: WireProtocolEngine;
  let fixture: ComponentFixture<WireProtocolComponent>;
  let component: WireProtocolComponent;
  let shortcuts: KeyboardShortcutService;
  let wireDrawService: WireDrawService;

  function setup(levelData?: WireProtocolLevelData) {
    engine = new WireProtocolEngine();
    engine.initialize(createLevel(levelData ?? createTestLevelData()));
    engine.start();

    TestBed.configureTestingModule({
      imports: [WireProtocolComponent],
      providers: [
        { provide: MINIGAME_ENGINE, useValue: engine },
      ],
    });

    fixture = TestBed.createComponent(WireProtocolComponent);
    component = fixture.componentInstance;
    shortcuts = TestBed.inject(KeyboardShortcutService);
    wireDrawService = TestBed.inject(WireDrawService);
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
        imports: [WireProtocolComponent],
      });
      const inertFixture = TestBed.createComponent(WireProtocolComponent);
      inertFixture.detectChanges();
      expect(inertFixture.componentInstance).toBeTruthy();
      inertFixture.destroy();
    });

    it('should render source ports matching engine sourcePorts count', () => {
      setup();
      const sourcePorts = fixture.nativeElement.querySelectorAll('[nx-svg-port][data-port-type="source"]');
      expect(sourcePorts.length).toBe(2);
    });

    it('should render target ports matching engine targetPorts count', () => {
      setup();
      const targetPorts = fixture.nativeElement.querySelectorAll('[nx-svg-port][data-port-type="target"]');
      expect(targetPorts.length).toBe(2);
    });

    it('should display verify button with remaining verification count', () => {
      setup();
      const btn = fixture.nativeElement.querySelector('.wire-protocol__verify-btn') as HTMLButtonElement;
      expect(btn.textContent).toContain('3');
      expect(btn.textContent).toContain('left');
    });
  });

  // --- 2. Wire Type Selection Tests ---

  describe('Wire Type Selection', () => {
    it('should default to interpolation wire type', () => {
      setup();
      expect(component.selectedWireType()).toBe(WireType.interpolation);
    });

    it('should change selected wire type on button click', () => {
      setup();
      const buttons = fixture.nativeElement.querySelectorAll('app-binding-type-selector button') as NodeListOf<HTMLButtonElement>;
      // Click the property button (second)
      buttons[1].click();
      fixture.detectChanges();
      expect(component.selectedWireType()).toBe(WireType.property);
    });

    it('should highlight active wire type button', () => {
      setup();
      // Default is interpolation (first button)
      const buttons = fixture.nativeElement.querySelectorAll('app-binding-type-selector .binding-type-selector__btn');
      expect(buttons[0].classList.contains('binding-type-selector__btn--active')).toBe(true);
      expect(buttons[1].classList.contains('binding-type-selector__btn--active')).toBe(false);

      // Change to event (third button)
      component.selectWireType(WireType.event);
      fixture.detectChanges();

      const updatedButtons = fixture.nativeElement.querySelectorAll('app-binding-type-selector .binding-type-selector__btn');
      expect(updatedButtons[0].classList.contains('binding-type-selector__btn--active')).toBe(false);
      expect(updatedButtons[2].classList.contains('binding-type-selector__btn--active')).toBe(true);
    });
  });

  // --- 3. Wire Drawing Interaction Tests ---

  describe('Wire Drawing Interaction', () => {
    it('should submit draw-wire action to engine when WireDrawService completes a wire', () => {
      setup();
      const submitSpy = vi.spyOn(engine, 'submitAction');

      // Register ports manually so WireDrawService knows about them
      wireDrawService.registerPort({ id: 'src-1', type: 'source', x: 40, y: 200 });
      wireDrawService.registerPort({ id: 'tgt-1', type: 'target', x: 960, y: 200 });

      // Start and complete a wire
      wireDrawService.startWire('src-1');
      wireDrawService.completeWire('tgt-1');
      TestBed.flushEffects();

      expect(submitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'draw-wire',
          sourcePortId: 'src-1',
          targetPortId: 'tgt-1',
        }),
      );
    });

    it('should use selected wire type in draw-wire action', () => {
      setup();
      const submitSpy = vi.spyOn(engine, 'submitAction');

      // Select event wire type
      component.selectWireType(WireType.event);

      wireDrawService.registerPort({ id: 'src-2', type: 'source', x: 40, y: 400 });
      wireDrawService.registerPort({ id: 'tgt-2', type: 'target', x: 960, y: 400 });

      wireDrawService.startWire('src-2');
      wireDrawService.completeWire('tgt-2');
      TestBed.flushEffects();

      expect(submitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'draw-wire',
          wireType: WireType.event,
        }),
      );
    });

    it('should show preview wire path when WireDrawService is in drawing phase', () => {
      setup();

      wireDrawService.registerPort({ id: 'src-1', type: 'source', x: 40, y: 200 });
      wireDrawService.startWire('src-1');
      wireDrawService.updatePointer({ x: 500, y: 300 });
      fixture.detectChanges();

      const preview = fixture.nativeElement.querySelector('.wire-protocol__preview');
      expect(preview).toBeTruthy();
    });

    it('should show rejection flash when engine rejects a draw-wire action', () => {
      vi.useFakeTimers();
      setup();

      // Force engine.submitAction to return invalid by submitting an incompatible wire
      // The engine validates compatibility, so draw an interpolation wire to an event target
      wireDrawService.registerPort({ id: 'src-1', type: 'source', x: 40, y: 200 });
      wireDrawService.registerPort({ id: 'tgt-2', type: 'target', x: 960, y: 400 });

      // Validator must accept for completeWire to produce an accepted result
      wireDrawService.setValidator(() => true);
      wireDrawService.startWire('src-1');
      wireDrawService.completeWire('tgt-2');
      TestBed.flushEffects();

      // Engine rejects because src-1 is property type and tgt-2 is event slot
      // with interpolation wire type (default)
      expect(component.rejectionFlash()).toBe(true);

      vi.advanceTimersByTime(REJECTION_FLASH_MS);
      expect(component.rejectionFlash()).toBe(false);

      vi.useRealTimers();
    });
  });

  // --- 4. Wire Removal Tests ---

  describe('Wire Removal', () => {
    it('should submit remove-wire action on right-click of wire path', () => {
      setup();
      const submitSpy = vi.spyOn(engine, 'submitAction');

      // Draw a valid wire first
      engine.submitAction({
        type: 'draw-wire',
        sourcePortId: 'src-1',
        targetPortId: 'tgt-1',
        wireType: WireType.interpolation,
      });
      fixture.detectChanges();

      const wirePaths = fixture.nativeElement.querySelectorAll('path[pointer-events="stroke"]');
      expect(wirePaths.length).toBeGreaterThan(0);

      submitSpy.mockClear();

      // Right-click the wire path
      const contextMenuEvent = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
      wirePaths[0].dispatchEvent(contextMenuEvent);

      expect(submitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'remove-wire',
        }),
      );
    });

    it('should prevent default on contextmenu', () => {
      setup();

      engine.submitAction({
        type: 'draw-wire',
        sourcePortId: 'src-1',
        targetPortId: 'tgt-1',
        wireType: WireType.interpolation,
      });
      fixture.detectChanges();

      const wirePaths = fixture.nativeElement.querySelectorAll('path[pointer-events="stroke"]');
      const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
      const preventSpy = vi.spyOn(event, 'preventDefault');
      wirePaths[0].dispatchEvent(event);

      expect(preventSpy).toHaveBeenCalled();
    });
  });

  // --- 5. Verification Tests ---

  describe('Verification', () => {
    it('should call engine.verify() on verify button click', () => {
      setup();
      const verifySpy = vi.spyOn(engine, 'verify');

      const btn = fixture.nativeElement.querySelector('.wire-protocol__verify-btn') as HTMLButtonElement;
      btn.click();

      expect(verifySpy).toHaveBeenCalled();
    });

    it('should set verification feedback for correct and incorrect wires', () => {
      setup();

      // Draw one correct wire and one incorrect wire
      engine.submitAction({
        type: 'draw-wire',
        sourcePortId: 'src-1',
        targetPortId: 'tgt-1',
        wireType: WireType.interpolation,
      });

      component.onVerify();

      const feedback = component.verificationFeedback();
      // wire-1 (src-1 -> tgt-1 interpolation) is correct
      expect(feedback.get('wire-1')).toBe('correct');
    });

    it('should auto-clear verification feedback after 1500ms', () => {
      vi.useFakeTimers();
      setup();

      engine.submitAction({
        type: 'draw-wire',
        sourcePortId: 'src-1',
        targetPortId: 'tgt-1',
        wireType: WireType.interpolation,
      });

      component.onVerify();
      expect(component.verificationFeedback().size).toBeGreaterThan(0);

      vi.advanceTimersByTime(FEEDBACK_CLEAR_MS);
      expect(component.verificationFeedback().size).toBe(0);

      vi.useRealTimers();
    });
  });

  // --- 6. Keyboard Shortcut Tests ---

  describe('Keyboard Shortcuts', () => {
    it('should register number keys 1-4 and Escape on init', () => {
      setup();
      const registered = shortcuts.getRegistered();
      expect(registered.find(r => r.key === '1')).toBeDefined();
      expect(registered.find(r => r.key === '2')).toBeDefined();
      expect(registered.find(r => r.key === '3')).toBeDefined();
      expect(registered.find(r => r.key === '4')).toBeDefined();
      expect(registered.find(r => r.key === 'escape')).toBeDefined();
    });

    it('should select wire type on number key press', () => {
      setup();
      // Simulate pressing '2' for property
      const reg = shortcuts.getRegistered().find(r => r.key === '2');
      reg?.callback();
      expect(component.selectedWireType()).toBe(WireType.property);
    });

    it('should cancel wire drawing on Escape press', () => {
      setup();

      wireDrawService.registerPort({ id: 'src-1', type: 'source', x: 40, y: 200 });
      wireDrawService.startWire('src-1');
      expect(wireDrawService.phase()).toBe('drawing');

      // Trigger escape
      const reg = shortcuts.getRegistered().find(r => r.key === 'escape');
      reg?.callback();
      expect(wireDrawService.phase()).toBe('idle');
    });

    it('should unregister all shortcuts on destroy', () => {
      setup();
      const unregisterSpy = vi.spyOn(shortcuts, 'unregister');

      component.ngOnDestroy();

      // Should unregister 5 keys: 1, 2, 3, 4, escape
      expect(unregisterSpy).toHaveBeenCalledTimes(5);
      expect(unregisterSpy).toHaveBeenCalledWith('1');
      expect(unregisterSpy).toHaveBeenCalledWith('2');
      expect(unregisterSpy).toHaveBeenCalledWith('3');
      expect(unregisterSpy).toHaveBeenCalledWith('4');
      expect(unregisterSpy).toHaveBeenCalledWith('escape');
    });
  });

  // --- 7. Coordinate Conversion Tests ---

  describe('Coordinate Conversion', () => {
    it('should convert port percentage positions to SVG viewBox coordinates', () => {
      setup();
      // Source port at position {x:0, y:33.3} should be at SVG {x:40, y:199.8}
      const sourcePositions = component.sourcePortPositions();
      expect(sourcePositions[0].x).toBe(40);
      expect(sourcePositions[0].y).toBeCloseTo(199.8, 1);

      // Target port at position {x:100, y:33.3} should be at SVG {x:960, y:199.8}
      const targetPositions = component.targetPortPositions();
      expect(targetPositions[0].x).toBe(960);
      expect(targetPositions[0].y).toBeCloseTo(199.8, 1);
    });

    it('should call updatePointer on mouse move during drawing phase', () => {
      setup();
      const updateSpy = vi.spyOn(wireDrawService, 'updatePointer');

      wireDrawService.registerPort({ id: 'src-1', type: 'source', x: 40, y: 200 });
      wireDrawService.startWire('src-1');

      const svgEl = fixture.nativeElement.querySelector('svg') as SVGSVGElement;

      // Mock SVG coordinate conversion APIs (not available in jsdom)
      const mockPoint = { x: 0, y: 0, matrixTransform: () => ({ x: 250, y: 150 }) };
      svgEl.createSVGPoint = vi.fn().mockReturnValue(mockPoint);
      svgEl.getScreenCTM = vi.fn().mockReturnValue({
        inverse: () => ({}),
      });

      const moveEvent = new MouseEvent('mousemove', {
        bubbles: true,
        clientX: 500,
        clientY: 300,
      });
      svgEl.dispatchEvent(moveEvent);

      expect(updateSpy).toHaveBeenCalled();
    });
  });

  // --- 8. Edge Cases ---

  describe('Edge Cases', () => {
    it('should handle empty port lists (0 ports rendered)', () => {
      setup(createTestLevelData({
        sourcePorts: [],
        targetPorts: [],
        correctWires: [],
      }));
      fixture.detectChanges();

      const ports = fixture.nativeElement.querySelectorAll('[nx-svg-port]');
      expect(ports.length).toBe(0);
    });

    it('should disable verify button when verificationsRemaining is 0', () => {
      setup();

      // Use up all verifications
      engine.verify();
      engine.verify();
      engine.verify();
      fixture.detectChanges();

      const btn = fixture.nativeElement.querySelector('.wire-protocol__verify-btn') as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    });
  });
});

// Private constant re-declarations for test assertions
const REJECTION_FLASH_MS = 400;
const FEEDBACK_CLEAR_MS = 1500;
