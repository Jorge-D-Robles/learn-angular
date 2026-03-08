import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { ModuleAssemblyComponent } from './module-assembly.component';
import { ModuleAssemblyEngine } from './module-assembly.engine';
import { ConveyorBeltService } from './conveyor-belt.service';
import { MINIGAME_ENGINE } from '../../../core/minigame/minigame-engine.tokens';
import { KeyboardShortcutService } from '../../../core/minigame/keyboard-shortcut.service';
import {
  DifficultyTier,
  type MinigameLevel,
} from '../../../core/minigame/minigame.types';
import {
  PART_SLOT_COLORS,
  type ComponentPart,
  type BlueprintSlot,
  type ComponentBlueprint,
  type ModuleAssemblyLevelData,
} from './module-assembly.types';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function createTestPart(overrides?: Partial<ComponentPart>): ComponentPart {
  return {
    id: 'part-1',
    type: 'template',
    content: '<h1>Hello</h1>',
    isDecoy: false,
    correctSlotId: 'slot-1',
    ...overrides,
  };
}

function createTestSlot(overrides?: Partial<BlueprintSlot>): BlueprintSlot {
  return {
    id: 'slot-1',
    slotType: 'template',
    label: 'Template',
    isRequired: true,
    isOptional: false,
    ...overrides,
  };
}

function createTestBlueprint(overrides?: Partial<ComponentBlueprint>): ComponentBlueprint {
  return {
    name: 'TestComponent',
    slots: [createTestSlot()],
    expectedParts: ['part-1'],
    ...overrides,
  };
}

function createTestLevelData(overrides?: Partial<ModuleAssemblyLevelData>): ModuleAssemblyLevelData {
  return {
    blueprint: createTestBlueprint(),
    parts: [createTestPart()],
    decoys: [],
    beltSpeed: 100,
    ...overrides,
  };
}

function createLevel(data: ModuleAssemblyLevelData): MinigameLevel<ModuleAssemblyLevelData> {
  return {
    id: 'ma-test-01',
    gameId: 'module-assembly',
    tier: DifficultyTier.Basic,
    conceptIntroduced: 'Component basics',
    description: 'Test level',
    data,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ModuleAssemblyComponent', () => {
  let engine: ModuleAssemblyEngine;
  let fixture: ComponentFixture<ModuleAssemblyComponent>;
  let component: ModuleAssemblyComponent;
  let shortcuts: KeyboardShortcutService;
  let rafSpy: ReturnType<typeof vi.spyOn>;

  function setup(levelData?: ModuleAssemblyLevelData) {
    engine = new ModuleAssemblyEngine();
    engine.initialize(createLevel(levelData ?? createTestLevelData()));
    engine.start();

    TestBed.configureTestingModule({
      imports: [ModuleAssemblyComponent],
      providers: [
        { provide: MINIGAME_ENGINE, useValue: engine },
      ],
    });

    fixture = TestBed.createComponent(ModuleAssemblyComponent);
    component = fixture.componentInstance;
    shortcuts = TestBed.inject(KeyboardShortcutService);
    fixture.detectChanges();
  }

  beforeEach(() => {
    rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
    vi.spyOn(window, 'cancelAnimationFrame').mockReturnValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
        imports: [ModuleAssemblyComponent],
      });
      const inertFixture = TestBed.createComponent(ModuleAssemblyComponent);
      inertFixture.detectChanges();
      expect(inertFixture.componentInstance).toBeTruthy();
      inertFixture.destroy();
    });

    it('should render belt parts matching visible parts count', () => {
      setup();
      // After setup, belt is initialized via effect. Parts start beyond beltLength
      // so visibleBeltParts includes those within the visible range.
      const beltParts = fixture.nativeElement.querySelectorAll('.belt__part');
      expect(beltParts.length).toBe(component.visibleBeltParts().length);
    });

    it('should display part content and type label', () => {
      setup();
      fixture.detectChanges();
      const partEl = fixture.nativeElement.querySelector('.belt__part');
      if (partEl) {
        const label = partEl.querySelector('.belt__part-label');
        const content = partEl.querySelector('.belt__part-content');
        expect(label?.textContent).toContain('template');
        expect(content?.textContent).toContain('<h1>Hello</h1>');
      }
    });

    it('should apply correct color border based on PART_SLOT_COLORS', () => {
      const part = createTestPart({ id: 'p1', type: 'selector' });
      setup(createTestLevelData({ parts: [part] }));
      fixture.detectChanges();
      const partEl = fixture.nativeElement.querySelector('.belt__part') as HTMLElement;
      if (partEl) {
        // Browser converts hex to rgb, so check that the color is applied (non-empty)
        // and verify via getPartColor helper which returns the raw hex value
        expect(partEl.style.borderColor).toBeTruthy();
        expect(component.getPartColor('selector')).toBe(PART_SLOT_COLORS['selector']);
      }
    });

    it('should render blueprint slots with correct labels', () => {
      const slot1 = createTestSlot({ id: 's1', label: 'Selector' });
      const slot2 = createTestSlot({ id: 's2', label: 'Template', isRequired: false, isOptional: true });
      setup(createTestLevelData({
        blueprint: createTestBlueprint({ slots: [slot1, slot2] }),
        parts: [
          createTestPart({ id: 'p1', correctSlotId: 's1' }),
          createTestPart({ id: 'p2', correctSlotId: 's2' }),
        ],
      }));
      fixture.detectChanges();

      const slotLabels = fixture.nativeElement.querySelectorAll('.blueprint__slot-label');
      expect(slotLabels.length).toBe(2);
      expect(slotLabels[0].textContent).toContain('Selector');
      expect(slotLabels[1].textContent).toContain('Template');
    });

    it('should apply required class to required slots', () => {
      const reqSlot = createTestSlot({ id: 's1', isRequired: true });
      const optSlot = createTestSlot({ id: 's2', isRequired: false, isOptional: true });
      setup(createTestLevelData({
        blueprint: createTestBlueprint({ slots: [reqSlot, optSlot] }),
        parts: [
          createTestPart({ id: 'p1', correctSlotId: 's1' }),
          createTestPart({ id: 'p2', correctSlotId: 's2' }),
        ],
      }));
      fixture.detectChanges();

      const slots = fixture.nativeElement.querySelectorAll('.blueprint__slot');
      expect(slots[0].classList.contains('blueprint__slot--required')).toBe(true);
      expect(slots[1].classList.contains('blueprint__slot--required')).toBe(false);
    });

    it('should show placed part content in filled slots', () => {
      setup();
      // Place part correctly
      engine.submitAction({ type: 'place-part', partId: 'part-1', targetSlotId: 'slot-1' });
      fixture.detectChanges();

      const slotContent = fixture.nativeElement.querySelector('.blueprint__slot-content');
      expect(slotContent?.textContent).toContain('<h1>Hello</h1>');
    });
  });

  // --- 2. Drag-and-Drop Interaction Tests ---

  describe('Drag-and-Drop Interaction', () => {
    it('should call engine.submitAction with place-part on onSlotDrop', () => {
      setup();
      const submitSpy = vi.spyOn(engine, 'submitAction');
      const part = createTestPart({ id: 'part-1' });

      component.onSlotDrop({ accepted: true, zoneId: 'slot-1', data: part }, 'slot-1');

      expect(submitSpy).toHaveBeenCalledWith({
        type: 'place-part',
        partId: 'part-1',
        targetSlotId: 'slot-1',
      });
    });

    it('should call beltService.removePart on correct placement', () => {
      const slot1 = createTestSlot({ id: 'slot-1' });
      const slot2 = createTestSlot({ id: 'slot-2', isRequired: false, isOptional: true });
      setup(createTestLevelData({
        blueprint: createTestBlueprint({
          slots: [slot1, slot2],
          expectedParts: ['part-1'],
        }),
        parts: [createTestPart({ id: 'part-1', correctSlotId: 'slot-1' })],
      }));

      const beltService = fixture.debugElement.injector.get(ConveyorBeltService);
      const removeSpy = vi.spyOn(beltService, 'removePart');
      const part = createTestPart({ id: 'part-1' });

      component.onSlotDrop({ accepted: true, zoneId: 'slot-1', data: part }, 'slot-1');

      expect(removeSpy).toHaveBeenCalledWith('part-1');
    });

    it('should set feedbackState to correct on valid placement', () => {
      const slot1 = createTestSlot({ id: 'slot-1' });
      const slot2 = createTestSlot({ id: 'slot-2', isRequired: false, isOptional: true });
      setup(createTestLevelData({
        blueprint: createTestBlueprint({
          slots: [slot1, slot2],
          expectedParts: ['part-1'],
        }),
        parts: [createTestPart({ id: 'part-1', correctSlotId: 'slot-1' })],
      }));
      const part = createTestPart({ id: 'part-1' });

      component.onSlotDrop({ accepted: true, zoneId: 'slot-1', data: part }, 'slot-1');

      expect(component.feedbackState()).toEqual({ partId: 'part-1', type: 'correct' });
    });

    it('should set feedbackState to incorrect on invalid placement', () => {
      const slot1 = createTestSlot({ id: 'slot-1' });
      const slot2 = createTestSlot({ id: 'slot-2' });
      setup(createTestLevelData({
        blueprint: createTestBlueprint({
          slots: [slot1, slot2],
          expectedParts: ['part-1', 'part-2'],
        }),
        parts: [
          createTestPart({ id: 'part-1', correctSlotId: 'slot-1' }),
          createTestPart({ id: 'part-2', correctSlotId: 'slot-2' }),
        ],
      }));
      const part = createTestPart({ id: 'part-1', correctSlotId: 'slot-1' });

      component.onSlotDrop({ accepted: true, zoneId: 'slot-2', data: part }, 'slot-2');

      expect(component.feedbackState()).toEqual({ partId: 'part-1', type: 'incorrect' });
    });

    it('should auto-clear feedbackState after 500ms', () => {
      vi.useFakeTimers();
      const slot1 = createTestSlot({ id: 'slot-1' });
      const slot2 = createTestSlot({ id: 'slot-2', isRequired: false, isOptional: true });
      setup(createTestLevelData({
        blueprint: createTestBlueprint({
          slots: [slot1, slot2],
          expectedParts: ['part-1'],
        }),
        parts: [createTestPart({ id: 'part-1', correctSlotId: 'slot-1' })],
      }));
      const part = createTestPart({ id: 'part-1' });

      component.onSlotDrop({ accepted: true, zoneId: 'slot-1', data: part }, 'slot-1');
      expect(component.feedbackState()).not.toBeNull();

      vi.advanceTimersByTime(500);
      expect(component.feedbackState()).toBeNull();
      vi.useRealTimers();
    });

    it('should call engine.submitAction with reject-decoy on double-click', () => {
      setup();
      const submitSpy = vi.spyOn(engine, 'submitAction');

      component.onPartDoubleClick('part-1');

      expect(submitSpy).toHaveBeenCalledWith({
        type: 'reject-decoy',
        partId: 'part-1',
      });
    });
  });

  // --- 3. Animation Loop Tests ---

  describe('Animation Loop', () => {
    it('should start animation loop when engine status is Playing', () => {
      setup();
      // Engine is already Playing after setup
      expect(rafSpy).toHaveBeenCalled();
    });

    it('should stop animation loop when engine status transitions to Paused', () => {
      setup();
      const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');

      engine.pause();
      TestBed.flushEffects();

      expect(cancelSpy).toHaveBeenCalled();
    });

    it('should call beltService.tick with positive deltaTime on each frame', () => {
      // Restore real rAF mock to capture callback
      rafSpy.mockRestore();
      let rafCallback: ((timestamp: number) => void) | null = null;
      rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
        rafCallback = cb;
        return 1;
      });

      setup();
      const beltService = fixture.debugElement.injector.get(ConveyorBeltService);
      const tickSpy = vi.spyOn(beltService, 'tick');

      // First frame (timestamp = 1000): dt will be 0 since lastTimestamp was 0
      if (rafCallback) (rafCallback as (t: number) => void)(1000);
      // Second frame (timestamp = 1016): dt = (1016 - 1000) / 1000 = 0.016
      if (rafCallback) (rafCallback as (t: number) => void)(1016);

      expect(tickSpy).toHaveBeenCalledWith(expect.closeTo(0.016, 3));
    });

    it('should reset lastTimestamp to 0 on stop (first tick after restart has deltaTime = 0)', () => {
      rafSpy.mockRestore();
      let rafCallback: ((timestamp: number) => void) | null = null;
      rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
        rafCallback = cb;
        return 1;
      });
      vi.spyOn(window, 'cancelAnimationFrame').mockReturnValue(undefined);

      setup();
      const beltService = fixture.debugElement.injector.get(ConveyorBeltService);
      const tickSpy = vi.spyOn(beltService, 'tick');

      // Run a frame
      if (rafCallback) (rafCallback as (t: number) => void)(1000);

      // Pause and resume
      engine.pause();
      TestBed.flushEffects();
      engine.resume();
      TestBed.flushEffects();

      tickSpy.mockClear();

      // First frame after resume at timestamp=2000 should NOT produce a delta of (2000-1000)/1000
      if (rafCallback) (rafCallback as (t: number) => void)(2000);
      // tick should not have been called with a non-zero dt on the first frame
      // (since lastTimestamp was reset to 0, the first frame sets lastTimestamp = 2000 without calling tick)
      expect(tickSpy).not.toHaveBeenCalled();
    });
  });

  // --- 4. Keyboard Support Tests ---

  describe('Keyboard Support', () => {
    it('should register number keys 1-6 as keyboard shortcuts on init', () => {
      setup();
      const registered = shortcuts.getRegistered();
      for (let i = 1; i <= 6; i++) {
        expect(registered.find(r => r.key === String(i))).toBeDefined();
      }
    });

    it('should register spacebar shortcut on init', () => {
      setup();
      const registered = shortcuts.getRegistered();
      expect(registered.find(r => r.key === ' ')).toBeDefined();
    });

    it('should call per-key unregister for each registered key on destroy', () => {
      setup();
      const unregisterSpy = vi.spyOn(shortcuts, 'unregister');
      const unregisterAllSpy = vi.spyOn(shortcuts, 'unregisterAll');

      component.ngOnDestroy();

      // Should unregister 7 keys: 1-6 + space
      expect(unregisterSpy).toHaveBeenCalledTimes(7);
      expect(unregisterSpy).toHaveBeenCalledWith('1');
      expect(unregisterSpy).toHaveBeenCalledWith('2');
      expect(unregisterSpy).toHaveBeenCalledWith('3');
      expect(unregisterSpy).toHaveBeenCalledWith('4');
      expect(unregisterSpy).toHaveBeenCalledWith('5');
      expect(unregisterSpy).toHaveBeenCalledWith('6');
      expect(unregisterSpy).toHaveBeenCalledWith(' ');
      // Should NOT call unregisterAll
      expect(unregisterAllSpy).not.toHaveBeenCalled();
    });

    it('should stop animation loop on component destroy', () => {
      setup();
      const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');

      component.ngOnDestroy();

      expect(cancelSpy).toHaveBeenCalled();
    });
  });

  // --- 5. Edge Case Tests ---

  describe('Edge Cases', () => {
    it('should handle empty belt (no parts rendered)', () => {
      setup(createTestLevelData({
        parts: [],
      }));
      fixture.detectChanges();

      const beltParts = fixture.nativeElement.querySelectorAll('.belt__part');
      expect(beltParts.length).toBe(0);
    });

    it('should handle blueprint with 0 slots (no drop zones rendered)', () => {
      setup(createTestLevelData({
        blueprint: createTestBlueprint({ slots: [], expectedParts: [] }),
        parts: [],
      }));
      fixture.detectChanges();

      const slots = fixture.nativeElement.querySelectorAll('.blueprint__slot');
      expect(slots.length).toBe(0);
    });

    it('should set completionGlow when engine status transitions to Won', () => {
      setup();
      expect(component.completionGlow()).toBe(false);

      // Place the only part correctly -> triggers Won
      engine.submitAction({ type: 'place-part', partId: 'part-1', targetSlotId: 'slot-1' });
      TestBed.flushEffects();

      expect(component.completionGlow()).toBe(true);
    });
  });
});
