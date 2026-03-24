import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { PowerGridComponent, SCOPE_COLORS } from './power-grid.component';
import { PowerGridEngine, type ConnectServiceAction } from './power-grid.engine';
import { MINIGAME_ENGINE } from '../../../core/minigame/minigame-engine.tokens';
import { WireDrawService } from '../../../core/minigame/wire-draw.service';
import { KeyboardShortcutService } from '../../../core/minigame/keyboard-shortcut.service';
import {
  DifficultyTier,
  type MinigameLevel,
} from '../../../core/minigame/minigame.types';
import type {
  ServiceNode,
  ComponentNode,
  ValidConnection,
  ScopeRule,
  PowerGridLevelData,
} from './power-grid.types';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function createServiceNode(overrides?: Partial<ServiceNode>): ServiceNode {
  return {
    id: 'svc-1',
    name: 'AuthService',
    type: 'service',
    providedIn: 'root',
    ...overrides,
  };
}

function createComponentNode(overrides?: Partial<ComponentNode>): ComponentNode {
  return {
    id: 'cmp-1',
    name: 'LoginComponent',
    requiredInjections: ['svc-1'],
    ...overrides,
  };
}

function createTestLevelData(overrides?: Partial<PowerGridLevelData>): PowerGridLevelData {
  const services = [
    createServiceNode({ id: 'svc-1', name: 'AuthService', providedIn: 'root' }),
    createServiceNode({ id: 'svc-2', name: 'DataService', providedIn: 'component' }),
  ];
  const components = [
    createComponentNode({ id: 'cmp-1', name: 'LoginComponent', requiredInjections: ['svc-1'] }),
    createComponentNode({ id: 'cmp-2', name: 'DashboardComponent', requiredInjections: ['svc-2'], providers: ['svc-2'] }),
  ];
  const validConnections: ValidConnection[] = [
    { serviceId: 'svc-1', componentId: 'cmp-1', scope: 'root' },
    { serviceId: 'svc-2', componentId: 'cmp-2', scope: 'component' },
  ];
  const scopeRules: ScopeRule[] = [
    { serviceId: 'svc-1', allowedScopes: ['root'], defaultScope: 'root' },
    { serviceId: 'svc-2', allowedScopes: ['component', 'hierarchical'], defaultScope: 'component' },
  ];
  return { services, components, validConnections, scopeRules, ...overrides };
}

function createLevel(data: PowerGridLevelData): MinigameLevel<PowerGridLevelData> {
  return {
    id: 'pg-test-01',
    gameId: 'power-grid',
    tier: DifficultyTier.Basic,
    conceptIntroduced: 'Dependency Injection',
    description: 'Test level',
    data,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PowerGridComponent', () => {
  let engine: PowerGridEngine;
  let fixture: ComponentFixture<PowerGridComponent>;
  let component: PowerGridComponent;
  let shortcuts: KeyboardShortcutService;
  let wireDrawService: WireDrawService;

  function setup(levelData?: PowerGridLevelData) {
    engine = new PowerGridEngine();
    engine.initialize(createLevel(levelData ?? createTestLevelData()));
    engine.start();

    TestBed.configureTestingModule({
      imports: [PowerGridComponent],
      providers: [
        { provide: MINIGAME_ENGINE, useValue: engine },
      ],
    });

    fixture = TestBed.createComponent(PowerGridComponent);
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
        imports: [PowerGridComponent],
      });
      const inertFixture = TestBed.createComponent(PowerGridComponent);
      inertFixture.detectChanges();
      expect(inertFixture.componentInstance).toBeTruthy();
      inertFixture.destroy();
    });

    it('should render the board sub-component', () => {
      setup();
      const board = fixture.nativeElement.querySelector('app-power-grid-board');
      expect(board).toBeTruthy();
    });

    it('should render service ports via board component', () => {
      setup();
      const sourcePorts = fixture.nativeElement.querySelectorAll('[nx-svg-port][data-port-type="source"]');
      expect(sourcePorts.length).toBe(2);
    });

    it('should render component ports via board component', () => {
      setup();
      const targetPorts = fixture.nativeElement.querySelectorAll('[nx-svg-port][data-port-type="target"]');
      expect(targetPorts.length).toBe(2);
    });

    it('should display verify button with remaining verification count', () => {
      setup();
      const btn = fixture.nativeElement.querySelector('.power-grid__verify-btn') as HTMLButtonElement;
      expect(btn.textContent).toContain('3');
      expect(btn.textContent).toContain('left');
    });
  });

  // --- 2. Scope Selection Tests ---

  describe('Scope Selection', () => {
    it('should default to root scope', () => {
      setup();
      expect(component.selectedScope()).toBe('root');
    });

    it('should change selected scope on scope button click', () => {
      setup();
      const buttons = fixture.nativeElement.querySelectorAll('.power-grid__scope-btn') as NodeListOf<HTMLButtonElement>;
      // Click the component scope button (second)
      buttons[1].click();
      fixture.detectChanges();
      expect(component.selectedScope()).toBe('component');
    });

    it('should highlight active scope button', () => {
      setup();
      const buttons = fixture.nativeElement.querySelectorAll('.power-grid__scope-btn');
      // Default is root (first button)
      expect(buttons[0].classList.contains('power-grid__scope-btn--active')).toBe(true);
      expect(buttons[1].classList.contains('power-grid__scope-btn--active')).toBe(false);

      // Change to hierarchical (third button)
      component.selectScope('hierarchical');
      fixture.detectChanges();

      const updatedButtons = fixture.nativeElement.querySelectorAll('.power-grid__scope-btn');
      expect(updatedButtons[0].classList.contains('power-grid__scope-btn--active')).toBe(false);
      expect(updatedButtons[2].classList.contains('power-grid__scope-btn--active')).toBe(true);
    });
  });

  // --- 3. Connection Drawing Tests ---

  describe('Connection Drawing', () => {
    it('should set WireDrawService validator that only accepts valid service-component pairs', () => {
      setup();

      // Register ports manually
      wireDrawService.registerPort({ id: 'svc-1', type: 'source', x: 150, y: 200 });
      wireDrawService.registerPort({ id: 'cmp-1', type: 'target', x: 850, y: 200 });
      wireDrawService.registerPort({ id: 'cmp-2', type: 'target', x: 850, y: 400 });

      // svc-1 -> cmp-1 should be accepted (cmp-1 requires svc-1)
      wireDrawService.startWire('svc-1');
      const result1 = wireDrawService.completeWire('cmp-1');
      expect(result1?.accepted).toBe(true);

      // Reset for next attempt
      wireDrawService.registerPort({ id: 'svc-1', type: 'source', x: 150, y: 200 });

      // svc-1 -> cmp-2 should be rejected (cmp-2 requires svc-2, not svc-1)
      wireDrawService.startWire('svc-1');
      const result2 = wireDrawService.completeWire('cmp-2');
      expect(result2?.accepted).toBe(false);
    });

    it('should submit connect-service action to engine when WireDrawService completes a wire', () => {
      setup();
      const submitSpy = vi.spyOn(engine, 'submitAction');

      wireDrawService.registerPort({ id: 'svc-1', type: 'source', x: 150, y: 200 });
      wireDrawService.registerPort({ id: 'cmp-1', type: 'target', x: 850, y: 200 });

      wireDrawService.startWire('svc-1');
      wireDrawService.completeWire('cmp-1');
      TestBed.flushEffects();

      expect(submitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'connect-service',
          serviceId: 'svc-1',
          componentId: 'cmp-1',
        }),
      );
    });

    it('should use selected scope in connect-service action', () => {
      setup();
      const submitSpy = vi.spyOn(engine, 'submitAction');

      // Select component scope
      component.selectScope('component');

      wireDrawService.registerPort({ id: 'svc-2', type: 'source', x: 150, y: 400 });
      wireDrawService.registerPort({ id: 'cmp-2', type: 'target', x: 850, y: 400 });

      wireDrawService.startWire('svc-2');
      wireDrawService.completeWire('cmp-2');
      TestBed.flushEffects();

      expect(submitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'connect-service',
          scope: 'component',
        }),
      );
    });

    it('should show preview wire path when WireDrawService is in drawing phase', () => {
      setup();

      wireDrawService.registerPort({ id: 'svc-1', type: 'source', x: 150, y: 200 });
      wireDrawService.startWire('svc-1');
      wireDrawService.updatePointer({ x: 500, y: 300 });
      fixture.detectChanges();

      const preview = fixture.nativeElement.querySelector('.power-grid-board__preview');
      expect(preview).toBeTruthy();
    });

    it('should show rejection flash when engine rejects a connect-service action', () => {
      vi.useFakeTimers();
      setup();

      wireDrawService.registerPort({ id: 'svc-1', type: 'source', x: 150, y: 200 });
      wireDrawService.registerPort({ id: 'cmp-1', type: 'target', x: 850, y: 200 });

      // Connect svc-1 -> cmp-1 first (valid)
      wireDrawService.startWire('svc-1');
      wireDrawService.completeWire('cmp-1');
      TestBed.flushEffects();

      // Re-register ports since they get unregistered
      wireDrawService.registerPort({ id: 'svc-1', type: 'source', x: 150, y: 200 });
      wireDrawService.registerPort({ id: 'cmp-1', type: 'target', x: 850, y: 200 });

      // Override validator to accept so completeWire produces accepted result
      wireDrawService.setValidator(() => true);

      // Try to connect svc-1 -> cmp-1 again (duplicate, engine rejects)
      wireDrawService.startWire('svc-1');
      wireDrawService.completeWire('cmp-1');
      TestBed.flushEffects();

      expect(component.rejectionFlash()).toBe(true);

      vi.advanceTimersByTime(400);
      expect(component.rejectionFlash()).toBe(false);

      vi.useRealTimers();
    });
  });

  // --- 4. Connection Removal Tests ---

  describe('Connection Removal', () => {
    it('should submit disconnect-service action on board connectionRightClicked event', () => {
      setup();
      const submitSpy = vi.spyOn(engine, 'submitAction');

      // Draw a valid connection first
      engine.submitAction({
        type: 'connect-service',
        serviceId: 'svc-1',
        componentId: 'cmp-1',
        scope: 'root',
      } as ConnectServiceAction);
      fixture.detectChanges();

      const wirePaths = fixture.nativeElement.querySelectorAll('path[pointer-events="stroke"]');
      expect(wirePaths.length).toBeGreaterThan(0);

      submitSpy.mockClear();

      const contextMenuEvent = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
      wirePaths[0].dispatchEvent(contextMenuEvent);

      expect(submitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'disconnect-service',
        }),
      );
    });

    it('should prevent default on contextmenu', () => {
      setup();

      engine.submitAction({
        type: 'connect-service',
        serviceId: 'svc-1',
        componentId: 'cmp-1',
        scope: 'root',
      } as ConnectServiceAction);
      fixture.detectChanges();

      const wirePaths = fixture.nativeElement.querySelectorAll('path[pointer-events="stroke"]');
      const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
      const preventSpy = vi.spyOn(event, 'preventDefault');
      wirePaths[0].dispatchEvent(event);

      expect(preventSpy).toHaveBeenCalled();
    });

    it('should clear verification feedback when a connection is removed', () => {
      setup();

      // Draw connections and verify
      engine.submitAction({
        type: 'connect-service',
        serviceId: 'svc-1',
        componentId: 'cmp-1',
        scope: 'root',
      } as ConnectServiceAction);
      TestBed.flushEffects();

      component.onVerify();
      expect(component.verificationFeedback().size).toBeGreaterThan(0);

      // Remove the connection
      const connectionId = engine.connections()[0].id;
      engine.submitAction({ type: 'disconnect-service', connectionId });
      TestBed.flushEffects();

      expect(component.verificationFeedback().size).toBe(0);
    });
  });

  // --- 5. Verification Tests ---

  describe('Verification', () => {
    it('should call engine.verify() on verify button click', () => {
      setup();
      const verifySpy = vi.spyOn(engine, 'verify');

      const btn = fixture.nativeElement.querySelector('.power-grid__verify-btn') as HTMLButtonElement;
      btn.click();

      expect(verifySpy).toHaveBeenCalled();
    });

    it('should set verification feedback for correct and short-circuit connections', () => {
      setup();

      // Draw one correct connection
      engine.submitAction({
        type: 'connect-service',
        serviceId: 'svc-1',
        componentId: 'cmp-1',
        scope: 'root',
      } as ConnectServiceAction);
      TestBed.flushEffects();

      component.onVerify();

      const feedback = component.verificationFeedback();
      expect(feedback.get('conn-1')).toBe('correct');
    });

    it('should set wrong-scope feedback for short-circuit connections with wrong-scope reason', () => {
      setup();

      // Draw connection with wrong scope (root instead of component)
      engine.submitAction({
        type: 'connect-service',
        serviceId: 'svc-1',
        componentId: 'cmp-1',
        scope: 'component', // answer key says 'root'
      } as ConnectServiceAction);
      TestBed.flushEffects();

      component.onVerify();

      const feedback = component.verificationFeedback();
      expect(feedback.get('conn-1')).toBe('wrong-scope');
    });

    it('should set wrong-pair feedback for short-circuit connections with wrong-pair reason', () => {
      // Level where both components require both services
      const data = createTestLevelData({
        components: [
          createComponentNode({ id: 'cmp-1', name: 'LoginComponent', requiredInjections: ['svc-1', 'svc-2'] }),
          createComponentNode({ id: 'cmp-2', name: 'DashboardComponent', requiredInjections: ['svc-1', 'svc-2'] }),
        ],
        validConnections: [
          { serviceId: 'svc-1', componentId: 'cmp-1', scope: 'root' },
          { serviceId: 'svc-2', componentId: 'cmp-2', scope: 'component' },
        ],
      });
      setup(data);

      // Wire svc-1 to cmp-2 (wrong pair: valid connection is svc-1 -> cmp-1)
      engine.submitAction({
        type: 'connect-service',
        serviceId: 'svc-1',
        componentId: 'cmp-2',
        scope: 'root',
      } as ConnectServiceAction);
      TestBed.flushEffects();

      component.onVerify();

      const feedback = component.verificationFeedback();
      expect(feedback.get('conn-1')).toBe('wrong-pair');
    });

    it('should clear verification feedback when connections change', () => {
      setup();

      engine.submitAction({
        type: 'connect-service',
        serviceId: 'svc-1',
        componentId: 'cmp-1',
        scope: 'root',
      } as ConnectServiceAction);
      TestBed.flushEffects();

      component.onVerify();
      expect(component.verificationFeedback().size).toBeGreaterThan(0);

      // Draw another connection -- feedback should clear
      engine.submitAction({
        type: 'connect-service',
        serviceId: 'svc-2',
        componentId: 'cmp-2',
        scope: 'component',
      } as ConnectServiceAction);
      TestBed.flushEffects();

      expect(component.verificationFeedback().size).toBe(0);
    });
  });

  // --- 6. Keyboard Shortcut Tests ---

  describe('Keyboard Shortcuts', () => {
    it('should register scope keys 1-3 and Escape on init', () => {
      setup();
      const registered = shortcuts.getRegistered();
      expect(registered.find(r => r.key === '1')).toBeDefined();
      expect(registered.find(r => r.key === '2')).toBeDefined();
      expect(registered.find(r => r.key === '3')).toBeDefined();
      expect(registered.find(r => r.key === 'escape')).toBeDefined();
    });

    it('should select scope on number key press', () => {
      setup();
      // Simulate pressing '2' for component scope
      const reg = shortcuts.getRegistered().find(r => r.key === '2');
      reg?.callback();
      expect(component.selectedScope()).toBe('component');
    });

    it('should cancel wire drawing on Escape press', () => {
      setup();

      wireDrawService.registerPort({ id: 'svc-1', type: 'source', x: 150, y: 200 });
      wireDrawService.startWire('svc-1');
      expect(wireDrawService.phase()).toBe('drawing');

      const reg = shortcuts.getRegistered().find(r => r.key === 'escape');
      reg?.callback();
      expect(wireDrawService.phase()).toBe('idle');
    });

    it('should unregister individual scope keys and escape on destroy', () => {
      setup();
      const unregisterSpy = vi.spyOn(shortcuts, 'unregister');

      component.ngOnDestroy();

      expect(unregisterSpy).toHaveBeenCalledTimes(4);
      expect(unregisterSpy).toHaveBeenCalledWith('1');
      expect(unregisterSpy).toHaveBeenCalledWith('2');
      expect(unregisterSpy).toHaveBeenCalledWith('3');
      expect(unregisterSpy).toHaveBeenCalledWith('escape');
    });
  });

  // --- 7. Color Coding Tests ---

  describe('Color Coding', () => {
    it('should assign Reactor Blue color to root-scope connections', () => {
      setup();

      engine.submitAction({
        type: 'connect-service',
        serviceId: 'svc-1',
        componentId: 'cmp-1',
        scope: 'root',
      } as ConnectServiceAction);
      fixture.detectChanges();

      const descriptors = component.wireDescriptors();
      expect(descriptors[0].color).toBe(SCOPE_COLORS.root);
    });

    it('should assign Sensor Green color to component-scope connections', () => {
      setup();

      engine.submitAction({
        type: 'connect-service',
        serviceId: 'svc-2',
        componentId: 'cmp-2',
        scope: 'component',
      } as ConnectServiceAction);
      fixture.detectChanges();

      const descriptors = component.wireDescriptors();
      expect(descriptors[0].color).toBe(SCOPE_COLORS.component);
    });

    it('should assign Alert Orange color to hierarchical-scope connections', () => {
      // Level with hierarchical scope
      const data = createTestLevelData({
        services: [createServiceNode({ id: 'svc-h', name: 'HierService', providedIn: 'hierarchical' })],
        components: [createComponentNode({ id: 'cmp-h', name: 'HierComponent', requiredInjections: ['svc-h'] })],
        validConnections: [{ serviceId: 'svc-h', componentId: 'cmp-h', scope: 'hierarchical' }],
        scopeRules: [{ serviceId: 'svc-h', allowedScopes: ['hierarchical'], defaultScope: 'hierarchical' }],
      });
      setup(data);

      engine.submitAction({
        type: 'connect-service',
        serviceId: 'svc-h',
        componentId: 'cmp-h',
        scope: 'hierarchical',
      } as ConnectServiceAction);
      fixture.detectChanges();

      const descriptors = component.wireDescriptors();
      expect(descriptors[0].color).toBe(SCOPE_COLORS.hierarchical);
    });
  });

  // --- 8. Edge Cases ---

  describe('Edge Cases', () => {
    it('should handle empty service/component lists', () => {
      setup(createTestLevelData({
        services: [],
        components: [],
        validConnections: [],
        scopeRules: [],
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

      const btn = fixture.nativeElement.querySelector('.power-grid__verify-btn') as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    });
  });
});
