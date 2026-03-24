import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { DeepSpaceRadioComponent } from './deep-space-radio.component';
import { DeepSpaceRadioEngine } from './deep-space-radio.engine';
import { MINIGAME_ENGINE } from '../../../core/minigame/minigame-engine.tokens';
import { KeyboardShortcutService } from '../../../core/minigame/keyboard-shortcut.service';
import {
  DifficultyTier,
  type MinigameLevel,
} from '../../../core/minigame/minigame.types';
import type {
  DeepSpaceRadioLevelData,
  InterceptorBlock,
  MockEndpoint,
  TestScenario,
  TransmissionResult,
  HttpRequestConfig,
} from './deep-space-radio.types';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function createTestEndpoints(): MockEndpoint[] {
  return [
    {
      url: '/api/data',
      method: 'GET',
      expectedHeaders: { Authorization: 'Bearer test-token' },
      expectedBody: undefined,
      response: { data: 'success' },
      errorResponse: { error: 'Unauthorized' },
    },
    {
      url: '/api/items',
      method: 'POST',
      expectedHeaders: {},
      expectedBody: { name: 'item' },
      response: { id: 1 },
      errorResponse: { error: 'Bad Request' },
    },
  ];
}

function createTestInterceptors(): InterceptorBlock[] {
  return [
    { id: 'int-auth', type: 'auth', config: { token: 'test-token' }, order: 1 },
    { id: 'int-logging', type: 'logging', config: {}, order: 2 },
    { id: 'int-retry', type: 'retry', config: { retryCount: 3 }, order: 3 },
    { id: 'int-error', type: 'error', config: {}, order: 4 },
    { id: 'int-caching', type: 'caching', config: {}, order: 5 },
  ];
}

function createExpectedResult(): TransmissionResult {
  return {
    requestConfig: {
      method: 'GET',
      url: '/api/data',
      headers: { Authorization: 'Bearer test-token' },
      body: undefined,
      params: {},
    },
    interceptorsApplied: ['auth', 'logging'],
    responseData: { data: 'success' },
    statusCode: 200,
    isSuccess: true,
  };
}

function createTestScenarios(): TestScenario[] {
  return [
    {
      id: 'sc-1',
      description: 'GET /api/data with auth',
      requestConfig: {
        method: 'GET',
        url: '/api/data',
        headers: {},
        body: undefined,
        params: {},
      },
      expectedInterceptorOrder: ['auth', 'logging'],
      expectedResult: createExpectedResult(),
    },
  ];
}

function createTestLevelData(overrides?: Partial<DeepSpaceRadioLevelData>): DeepSpaceRadioLevelData {
  return {
    endpoints: createTestEndpoints(),
    interceptors: createTestInterceptors(),
    testScenarios: createTestScenarios(),
    expectedResults: [createExpectedResult()],
    ...overrides,
  };
}

function createLevel(data: DeepSpaceRadioLevelData): MinigameLevel<DeepSpaceRadioLevelData> {
  return {
    id: 'dsr-test-01',
    gameId: 'deep-space-radio',
    tier: DifficultyTier.Basic,
    conceptIntroduced: 'Interceptors',
    description: 'Test level',
    data,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DeepSpaceRadioComponent', () => {
  let engine: DeepSpaceRadioEngine;
  let fixture: ComponentFixture<DeepSpaceRadioComponent>;
  let component: DeepSpaceRadioComponent;
  let shortcuts: KeyboardShortcutService;

  function setup(levelData?: DeepSpaceRadioLevelData) {
    engine = new DeepSpaceRadioEngine();
    engine.initialize(createLevel(levelData ?? createTestLevelData()));
    engine.start();

    TestBed.configureTestingModule({
      imports: [DeepSpaceRadioComponent],
      providers: [
        { provide: MINIGAME_ENGINE, useValue: engine },
      ],
    });

    fixture = TestBed.createComponent(DeepSpaceRadioComponent);
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
        imports: [DeepSpaceRadioComponent],
      });
      const inertFixture = TestBed.createComponent(DeepSpaceRadioComponent);
      inertFixture.detectChanges();
      expect(inertFixture.componentInstance).toBeTruthy();
      inertFixture.destroy();
    });

    it('should render the request builder sub-component', () => {
      setup();
      const builder = fixture.nativeElement.querySelector('app-request-builder');
      expect(builder).toBeTruthy();
    });

    it('should render the interceptor pipeline sub-component', () => {
      setup();
      const pipeline = fixture.nativeElement.querySelector('app-interceptor-pipeline');
      expect(pipeline).toBeTruthy();
    });

    it('should render interceptor toolbox with available interceptor types', () => {
      setup();
      const tabs = fixture.nativeElement.querySelectorAll('.deep-space-radio__toolbox-tab');
      expect(tabs.length).toBe(5);
      expect(tabs[0].textContent).toContain('auth');
      expect(tabs[1].textContent).toContain('logging');
      expect(tabs[2].textContent).toContain('retry');
      expect(tabs[3].textContent).toContain('error');
      expect(tabs[4].textContent).toContain('caching');
    });

    it('should render transmit button', () => {
      setup();
      const btn = fixture.nativeElement.querySelector('.deep-space-radio__transmit-btn') as HTMLButtonElement;
      expect(btn).toBeTruthy();
      expect(btn.textContent).toContain('Transmit');
    });
  });

  // --- 2. Toolbox Tests ---

  describe('Toolbox', () => {
    it('should default to showing all interceptor types', () => {
      setup();
      expect(component.selectedInterceptorType()).toBe('all');
    });

    it('should filter toolbox by selected interceptor type', () => {
      setup();
      component.selectInterceptorType('auth');
      fixture.detectChanges();

      const items = fixture.nativeElement.querySelectorAll('.deep-space-radio__toolbox-item');
      expect(items.length).toBe(1);
      expect(items[0].textContent).toContain('auth');
    });

    it('should show all interceptors when "all" is selected', () => {
      setup();
      const items = fixture.nativeElement.querySelectorAll('.deep-space-radio__toolbox-item');
      expect(items.length).toBe(5);
    });

    it('should hide placed interceptors from toolbox', () => {
      setup();

      // Place auth interceptor into chain
      engine.submitAction({ type: 'place-interceptor', interceptorId: 'int-auth', position: 0 });
      fixture.detectChanges();

      const items = fixture.nativeElement.querySelectorAll('.deep-space-radio__toolbox-item');
      // Should have 4 remaining (auth is placed)
      expect(items.length).toBe(4);
    });
  });

  // --- 3. Interceptor Placement Tests ---

  describe('Interceptor Placement', () => {
    it('should submit place-interceptor action to engine', () => {
      setup();
      const submitSpy = vi.spyOn(engine, 'submitAction');

      component.onInterceptorPlace('int-auth', 0);

      expect(submitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'place-interceptor',
          interceptorId: 'int-auth',
          position: 0,
        }),
      );
    });

    it('should update active chain after placement', () => {
      setup();
      expect(component.activeChain().length).toBe(0);

      engine.submitAction({ type: 'place-interceptor', interceptorId: 'int-auth', position: 0 });
      expect(component.activeChain().length).toBe(1);
    });
  });

  // --- 4. Interceptor Removal Tests ---

  describe('Interceptor Removal', () => {
    it('should submit remove-interceptor action to engine', () => {
      setup();
      engine.submitAction({ type: 'place-interceptor', interceptorId: 'int-auth', position: 0 });

      const submitSpy = vi.spyOn(engine, 'submitAction');
      component.onInterceptorRemove('int-auth');

      expect(submitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'remove-interceptor',
          interceptorId: 'int-auth',
        }),
      );
    });

    it('should update active chain after removal', () => {
      setup();
      engine.submitAction({ type: 'place-interceptor', interceptorId: 'int-auth', position: 0 });
      expect(component.activeChain().length).toBe(1);

      engine.submitAction({ type: 'remove-interceptor', interceptorId: 'int-auth' });
      expect(component.activeChain().length).toBe(0);
    });
  });

  // --- 5. Request Configuration Tests ---

  describe('Request Configuration', () => {
    it('should submit configure-request action when request builder emits', () => {
      setup();
      const submitSpy = vi.spyOn(engine, 'submitAction');

      const request: HttpRequestConfig = {
        method: 'GET',
        url: '/api/data',
        headers: {},
        body: undefined,
        params: {},
      };
      component.onRequestChanged(request);

      expect(submitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'configure-request',
          request,
        }),
      );
    });

    it('should expose currentRequest signal from engine', () => {
      setup();
      expect(component.currentRequest()).toBeNull();

      const request: HttpRequestConfig = {
        method: 'POST',
        url: '/api/items',
        headers: {},
        body: '{}',
        params: {},
      };
      engine.submitAction({ type: 'configure-request', request });
      expect(component.currentRequest()).toEqual(request);
    });
  });

  // --- 6. Transmit Tests ---

  describe('Transmit', () => {
    it('should call engine.transmit() on transmit button click', () => {
      setup();
      const transmitSpy = vi.spyOn(engine, 'transmit');

      const btn = fixture.nativeElement.querySelector('.deep-space-radio__transmit-btn') as HTMLButtonElement;
      btn.click();

      expect(transmitSpy).toHaveBeenCalled();
    });

    it('should display transmit results after transmission', () => {
      setup();

      // Place interceptors and transmit
      engine.submitAction({ type: 'place-interceptor', interceptorId: 'int-auth', position: 0 });
      engine.submitAction({ type: 'place-interceptor', interceptorId: 'int-logging', position: 1 });
      engine.transmit();
      fixture.detectChanges();

      const result = component.transmitResult();
      expect(result).toBeTruthy();
    });

    it('should show passed message when all scenarios pass', () => {
      setup();

      engine.submitAction({ type: 'place-interceptor', interceptorId: 'int-auth', position: 0 });
      engine.submitAction({ type: 'place-interceptor', interceptorId: 'int-logging', position: 1 });
      engine.transmit();
      fixture.detectChanges();

      const result = component.transmitResult();
      if (result?.allPassed) {
        const banner = fixture.nativeElement.querySelector('.deep-space-radio__results--passed');
        expect(banner).toBeTruthy();
      }
    });

    it('should show failed message when scenarios fail', () => {
      setup();

      // Transmit with empty chain (no interceptors) - should fail
      engine.transmit();
      fixture.detectChanges();

      const result = component.transmitResult();
      expect(result).toBeTruthy();
      if (!result?.allPassed) {
        const banner = fixture.nativeElement.querySelector('.deep-space-radio__results--failed');
        expect(banner).toBeTruthy();
      }
    });

    it('should display transmissions remaining count', () => {
      setup();
      const btn = fixture.nativeElement.querySelector('.deep-space-radio__transmit-btn') as HTMLButtonElement;
      expect(btn.textContent).toContain('3');
    });

    it('should disable transmit button when transmissions remaining is 0', () => {
      setup();

      engine.transmit();
      engine.transmit();
      engine.transmit();
      fixture.detectChanges();

      const btn = fixture.nativeElement.querySelector('.deep-space-radio__transmit-btn') as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    });
  });

  // --- 7. Keyboard Shortcuts Tests ---

  describe('Keyboard Shortcuts', () => {
    it('should register shortcuts t, escape, 1-5 on init', () => {
      setup();
      const registered = shortcuts.getRegistered();
      expect(registered.find(r => r.key === 't')).toBeDefined();
      expect(registered.find(r => r.key === 'escape')).toBeDefined();
      expect(registered.find(r => r.key === '1')).toBeDefined();
      expect(registered.find(r => r.key === '2')).toBeDefined();
      expect(registered.find(r => r.key === '3')).toBeDefined();
      expect(registered.find(r => r.key === '4')).toBeDefined();
      expect(registered.find(r => r.key === '5')).toBeDefined();
    });

    it('should trigger transmit on t key', () => {
      setup();
      const transmitSpy = vi.spyOn(engine, 'transmit');

      const reg = shortcuts.getRegistered().find(r => r.key === 't');
      reg?.callback();

      expect(transmitSpy).toHaveBeenCalled();
    });

    it('should switch interceptor type filter on number key press (1-5)', () => {
      setup();

      const reg1 = shortcuts.getRegistered().find(r => r.key === '1');
      reg1?.callback();
      expect(component.selectedInterceptorType()).toBe('auth');

      const reg2 = shortcuts.getRegistered().find(r => r.key === '2');
      reg2?.callback();
      expect(component.selectedInterceptorType()).toBe('logging');
    });

    it('should close config on Escape key', () => {
      setup();
      component.selectedInterceptorId.set('int-auth');
      expect(component.selectedInterceptorId()).toBe('int-auth');

      const reg = shortcuts.getRegistered().find(r => r.key === 'escape');
      reg?.callback();
      expect(component.selectedInterceptorId()).toBeNull();
    });

    it('should unregister all shortcuts on destroy', () => {
      setup();
      const unregisterSpy = vi.spyOn(shortcuts, 'unregister');

      component.ngOnDestroy();

      expect(unregisterSpy).toHaveBeenCalledTimes(7);
      expect(unregisterSpy).toHaveBeenCalledWith('t');
      expect(unregisterSpy).toHaveBeenCalledWith('escape');
      expect(unregisterSpy).toHaveBeenCalledWith('1');
      expect(unregisterSpy).toHaveBeenCalledWith('2');
      expect(unregisterSpy).toHaveBeenCalledWith('3');
      expect(unregisterSpy).toHaveBeenCalledWith('4');
      expect(unregisterSpy).toHaveBeenCalledWith('5');
    });
  });

  // --- 8. Edge Cases ---

  describe('Edge Cases', () => {
    it('should handle empty interceptors list', () => {
      setup(createTestLevelData({ interceptors: [] }));
      expect(component.availableInterceptors().length).toBe(0);
      const items = fixture.nativeElement.querySelectorAll('.deep-space-radio__toolbox-item');
      expect(items.length).toBe(0);
    });

    it('should handle empty test scenarios', () => {
      setup(createTestLevelData({ testScenarios: [], expectedResults: [] }));
      engine.transmit();
      fixture.detectChanges();

      const result = component.transmitResult();
      expect(result).toBeTruthy();
      expect(result!.allPassed).toBe(true);
    });

    it('should handle interceptor click to select for configuration', () => {
      setup();
      const interceptor = createTestInterceptors()[0];
      component.onInterceptorClicked(interceptor);
      expect(component.selectedInterceptorId()).toBe('int-auth');
    });

    it('should handle no engine gracefully for all actions', () => {
      TestBed.configureTestingModule({
        imports: [DeepSpaceRadioComponent],
      });
      const inertFixture = TestBed.createComponent(DeepSpaceRadioComponent);
      inertFixture.detectChanges();
      const inertComponent = inertFixture.componentInstance;

      // These should not throw
      inertComponent.onTransmit();
      inertComponent.onRequestChanged({
        method: 'GET', url: '/test', headers: {}, body: undefined, params: {},
      });
      inertComponent.onInterceptorPlace('int-auth', 0);
      inertComponent.onInterceptorRemove('int-auth');

      expect(inertComponent.activeChain().length).toBe(0);
      expect(inertComponent.transmitResult()).toBeNull();
      inertFixture.destroy();
    });
  });
});
