import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { DataRelayComponent } from './data-relay.component';
import { DataRelayEngine, type PlacePipeAction } from './data-relay.engine';
import { MINIGAME_ENGINE } from '../../../core/minigame/minigame-engine.tokens';
import { KeyboardShortcutService } from '../../../core/minigame/keyboard-shortcut.service';
import { DifficultyTier, type MinigameLevel } from '../../../core/minigame/minigame.types';
import type {
  DataRelayLevelData,
  DataStream,
  PipeDefinition,
  TargetOutput,
  TestDataItem,
} from './data-relay.types';
import type { DropResult } from '../../../core/minigame/drag-drop.service';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function createTestLevelData(overrides?: Partial<DataRelayLevelData>): DataRelayLevelData {
  const streams: DataStream[] = [
    { id: 'stream-1', name: 'Name Stream', rawInput: 'commander shepard' },
    { id: 'stream-2', name: 'Price Stream', rawInput: '42.5' },
  ];
  const availablePipes: PipeDefinition[] = [
    { id: 'pipe-upper', pipeName: 'uppercase', displayName: 'UpperCase', category: 'text' },
    { id: 'pipe-lower', pipeName: 'lowercase', displayName: 'LowerCase', category: 'text' },
    { id: 'pipe-currency', pipeName: 'currency', displayName: 'Currency', category: 'number', params: ['USD'] },
  ];
  const targetOutputs: TargetOutput[] = [
    { streamId: 'stream-1', expectedOutput: 'COMMANDER SHEPARD', requiredPipes: ['pipe-upper'] },
    { streamId: 'stream-2', expectedOutput: '$42.50', requiredPipes: ['pipe-currency'] },
  ];
  const testData: TestDataItem[] = [
    { id: 'td-1', streamId: 'stream-1', input: 'john doe', expectedOutput: 'JOHN DOE' },
  ];

  return { streams, availablePipes, targetOutputs, testData, ...overrides };
}

function createLevel(data: DataRelayLevelData): MinigameLevel<DataRelayLevelData> {
  return {
    id: 'dr-test-01',
    gameId: 'data-relay',
    tier: DifficultyTier.Basic,
    conceptIntroduced: 'Pipes',
    description: 'Test level',
    data,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DataRelayComponent', () => {
  let engine: DataRelayEngine;
  let fixture: ComponentFixture<DataRelayComponent>;
  let component: DataRelayComponent;
  let shortcuts: KeyboardShortcutService;

  function setup(levelData?: DataRelayLevelData) {
    engine = new DataRelayEngine();
    engine.initialize(createLevel(levelData ?? createTestLevelData()));
    engine.start();

    TestBed.configureTestingModule({
      imports: [DataRelayComponent],
      providers: [
        { provide: MINIGAME_ENGINE, useValue: engine },
      ],
    });

    fixture = TestBed.createComponent(DataRelayComponent);
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
        imports: [DataRelayComponent],
      });
      const inertFixture = TestBed.createComponent(DataRelayComponent);
      inertFixture.detectChanges();
      expect(inertFixture.componentInstance).toBeTruthy();
      inertFixture.destroy();
    });

    it('should render one stream row per engine stream', () => {
      setup();
      const rows = fixture.nativeElement.querySelectorAll('.stream-visualizer__stream');
      expect(rows.length).toBe(2);
    });

    it('should render pipe toolbox items matching engine availablePipes count', () => {
      setup();
      const items = fixture.nativeElement.querySelectorAll('.data-relay__pipe-item');
      expect(items.length).toBe(3);
    });

    it('should display Run button with run count', () => {
      setup();
      const btn = fixture.nativeElement.querySelector('.data-relay__run-btn') as HTMLButtonElement;
      expect(btn).toBeTruthy();
      expect(btn.textContent).toContain('Run');
      expect(btn.textContent).toContain('0');
    });
  });

  // --- 2. Toolbox Category Filter Tests ---

  describe('Toolbox Category Filter', () => {
    it('should default to showing all pipe categories', () => {
      setup();
      expect(component.selectedCategory()).toBe('all');
      const items = fixture.nativeElement.querySelectorAll('.data-relay__pipe-item');
      expect(items.length).toBe(3);
    });

    it('should filter toolbox by selected category', () => {
      setup();
      component.selectCategory('text');
      fixture.detectChanges();

      const items = fixture.nativeElement.querySelectorAll('.data-relay__pipe-item');
      expect(items.length).toBe(2); // Only text pipes: uppercase and lowercase
    });

    it('should highlight active category tab', () => {
      setup();
      const tabs = fixture.nativeElement.querySelectorAll('.data-relay__category-tab');
      // "All" tab should be active by default
      expect(tabs[0].classList.contains('data-relay__category-tab--active')).toBe(true);

      component.selectCategory('text');
      fixture.detectChanges();

      const updatedTabs = fixture.nativeElement.querySelectorAll('.data-relay__category-tab');
      expect(updatedTabs[0].classList.contains('data-relay__category-tab--active')).toBe(false);
      // Find the "text" tab (it should be after "All")
      const textTab = Array.from(updatedTabs as NodeListOf<HTMLElement>).find(t => t.textContent?.trim() === 'text');
      expect(textTab?.classList.contains('data-relay__category-tab--active')).toBe(true);
    });
  });

  // --- 3. Pipe Placement Tests ---

  describe('Pipe Placement', () => {
    it('should submit place-pipe action to engine when nxDropZoneDrop fires', () => {
      vi.useFakeTimers();
      setup();
      const submitSpy = vi.spyOn(engine, 'submitAction');

      const dropResult: DropResult = {
        accepted: true,
        zoneId: 'stream-stream-1',
        data: { id: 'pipe-upper', pipeName: 'uppercase', displayName: 'UpperCase', category: 'text' } as PipeDefinition,
      };

      component.onPipePlaced(dropResult, 'stream-1');

      expect(submitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'place-pipe',
          streamId: 'stream-1',
          pipeDefinitionId: 'pipe-upper',
          position: 0,
        }),
      );

      vi.advanceTimersByTime(400);
      vi.useRealTimers();
    });

    it('should generate unique pipe block IDs for placed pipes', () => {
      setup();

      const id1 = component.generatePipeBlockId();
      const id2 = component.generatePipeBlockId();
      expect(id1).toBe('pb-1');
      expect(id2).toBe('pb-2');
      expect(id1).not.toBe(id2);
    });

    it('should show placed pipe in stream row after successful placement', () => {
      vi.useFakeTimers();
      setup();

      const dropResult: DropResult = {
        accepted: true,
        zoneId: 'stream-stream-1',
        data: { id: 'pipe-upper', pipeName: 'uppercase', displayName: 'UpperCase', category: 'text' } as PipeDefinition,
      };

      component.onPipePlaced(dropResult, 'stream-1');
      vi.advanceTimersByTime(400);
      fixture.detectChanges();

      const blocks = fixture.nativeElement.querySelectorAll('.stream-visualizer__pipe-block');
      expect(blocks.length).toBeGreaterThan(0);
      expect(blocks[0].textContent).toContain('uppercase');

      vi.useRealTimers();
    });

    it('should show rejection feedback when engine rejects placement', () => {
      vi.useFakeTimers();
      setup();

      // First placement succeeds
      const dropResult1: DropResult = {
        accepted: true,
        zoneId: 'stream-stream-1',
        data: { id: 'pipe-upper', pipeName: 'uppercase', displayName: 'UpperCase', category: 'text' } as PipeDefinition,
      };
      component.onPipePlaced(dropResult1, 'stream-1');
      vi.advanceTimersByTime(400);

      // Force generatePipeBlockId to return the same ID (duplicate)
      vi.spyOn(component, 'generatePipeBlockId').mockReturnValueOnce('pb-1');

      const dropResult2: DropResult = {
        accepted: true,
        zoneId: 'stream-stream-1',
        data: { id: 'pipe-upper', pipeName: 'uppercase', displayName: 'UpperCase', category: 'text' } as PipeDefinition,
      };
      component.onPipePlaced(dropResult2, 'stream-1');

      expect(component.placementFeedback()?.type).toBe('error');

      vi.advanceTimersByTime(400);
      expect(component.placementFeedback()).toBeNull();

      vi.useRealTimers();
    });
  });

  // --- 4. Pipe Parameter Configuration Tests ---

  describe('Pipe Parameter Configuration', () => {
    it('should show parameter editor when placed pipe is clicked', () => {
      vi.useFakeTimers();
      setup();

      // Place a pipe first
      engine.submitAction({
        type: 'place-pipe',
        streamId: 'stream-1',
        pipeDefinitionId: 'pipe-upper',
        pipeBlockId: 'pb-config-1',
        position: 0,
      } as PlacePipeAction);
      vi.advanceTimersByTime(400);
      fixture.detectChanges();

      // Click the placed pipe
      const block = fixture.nativeElement.querySelector('.stream-visualizer__pipe-block') as HTMLElement;
      block.click();
      fixture.detectChanges();

      const configPanel = fixture.nativeElement.querySelector('.data-relay__config-panel');
      expect(configPanel).toBeTruthy();

      vi.useRealTimers();
    });

    it('should submit configure-pipe action to engine when params are changed', () => {
      setup();
      const submitSpy = vi.spyOn(engine, 'submitAction');

      // Place a pipe with params
      engine.submitAction({
        type: 'place-pipe',
        streamId: 'stream-2',
        pipeDefinitionId: 'pipe-currency',
        pipeBlockId: 'pb-config-2',
        position: 0,
      } as PlacePipeAction);
      fixture.detectChanges();

      // Select the pipe for editing
      const stream = engine.streams().find(s => s.streamId === 'stream-2')!;
      component.onPipeClicked('stream-2', stream.placedPipes[0]);
      submitSpy.mockClear();

      // Change params
      component.onParamsChanged(['EUR']);

      expect(submitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'configure-pipe',
          streamId: 'stream-2',
          pipeBlockId: 'pb-config-2',
          params: ['EUR'],
        }),
      );
    });

    it('should hide parameter editor when Escape is pressed or another pipe is clicked', () => {
      setup();

      // Place pipe and open config
      engine.submitAction({
        type: 'place-pipe',
        streamId: 'stream-1',
        pipeDefinitionId: 'pipe-upper',
        pipeBlockId: 'pb-config-3',
        position: 0,
      } as PlacePipeAction);
      fixture.detectChanges();

      const stream = engine.streams().find(s => s.streamId === 'stream-1')!;
      component.onPipeClicked('stream-1', stream.placedPipes[0]);
      expect(component.selectedPipeBlock()).toBeTruthy();

      // Press Escape via shortcut
      component.closeConfig();
      expect(component.selectedPipeBlock()).toBeNull();
    });
  });

  // --- 5. Run Transform Tests ---

  describe('Run Transform', () => {
    it('should call engine.runTransform() on Run button click', () => {
      setup();
      const runSpy = vi.spyOn(engine, 'runTransform');

      const btn = fixture.nativeElement.querySelector('.data-relay__run-btn') as HTMLButtonElement;
      btn.click();

      expect(runSpy).toHaveBeenCalled();
    });

    it('should display stream results after transform run', () => {
      setup();

      // Place correct pipe for stream-1
      engine.submitAction({
        type: 'place-pipe',
        streamId: 'stream-1',
        pipeDefinitionId: 'pipe-upper',
        pipeBlockId: 'pb-run-1',
        position: 0,
      } as PlacePipeAction);

      engine.runTransform();
      fixture.detectChanges();

      const results = fixture.nativeElement.querySelectorAll('.stream-visualizer__output-actual');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should show green indicator for correct streams and red for incorrect', () => {
      setup();

      // Place correct pipe for stream-1, leave stream-2 empty
      engine.submitAction({
        type: 'place-pipe',
        streamId: 'stream-1',
        pipeDefinitionId: 'pipe-upper',
        pipeBlockId: 'pb-color-1',
        position: 0,
      } as PlacePipeAction);

      engine.runTransform();
      fixture.detectChanges();

      const correctOutput = fixture.nativeElement.querySelector('.stream-visualizer__output--correct');
      const incorrectOutput = fixture.nativeElement.querySelector('.stream-visualizer__output--incorrect');
      expect(correctOutput).toBeTruthy();
      expect(incorrectOutput).toBeTruthy();
    });

    it('should disable Run button when engine status is not Playing', () => {
      setup();

      // Complete the game by placing all correct pipes and running
      engine.submitAction({
        type: 'place-pipe',
        streamId: 'stream-1',
        pipeDefinitionId: 'pipe-upper',
        pipeBlockId: 'pb-disable-1',
        position: 0,
      } as PlacePipeAction);
      engine.submitAction({
        type: 'place-pipe',
        streamId: 'stream-2',
        pipeDefinitionId: 'pipe-currency',
        pipeBlockId: 'pb-disable-2',
        position: 0,
      } as PlacePipeAction);
      engine.runTransform();
      fixture.detectChanges();

      const btn = fixture.nativeElement.querySelector('.data-relay__run-btn') as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    });
  });

  // --- 6. Pipe Removal Tests ---

  describe('Pipe Removal', () => {
    it('should submit remove-pipe action on placed pipe right-click', () => {
      setup();
      const submitSpy = vi.spyOn(engine, 'submitAction');

      engine.submitAction({
        type: 'place-pipe',
        streamId: 'stream-1',
        pipeDefinitionId: 'pipe-upper',
        pipeBlockId: 'pb-remove-1',
        position: 0,
      } as PlacePipeAction);
      fixture.detectChanges();

      submitSpy.mockClear();

      const block = fixture.nativeElement.querySelector('.stream-visualizer__pipe-block') as HTMLElement;
      const contextMenuEvent = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
      block.dispatchEvent(contextMenuEvent);

      expect(submitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'remove-pipe',
          streamId: 'stream-1',
          pipeBlockId: 'pb-remove-1',
        }),
      );
    });

    it('should prevent default on contextmenu for placed pipes', () => {
      setup();

      engine.submitAction({
        type: 'place-pipe',
        streamId: 'stream-1',
        pipeDefinitionId: 'pipe-upper',
        pipeBlockId: 'pb-remove-2',
        position: 0,
      } as PlacePipeAction);
      fixture.detectChanges();

      const block = fixture.nativeElement.querySelector('.stream-visualizer__pipe-block') as HTMLElement;
      const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
      const preventSpy = vi.spyOn(event, 'preventDefault');
      block.dispatchEvent(event);

      expect(preventSpy).toHaveBeenCalled();
    });
  });

  // --- 7. Keyboard Shortcut Tests ---

  describe('Keyboard Shortcuts', () => {
    it('should register shortcuts (r, escape, 1-4) on init', () => {
      setup();
      const registered = shortcuts.getRegistered();
      expect(registered.find(r => r.key === 'r')).toBeDefined();
      expect(registered.find(r => r.key === 'escape')).toBeDefined();
      expect(registered.find(r => r.key === '1')).toBeDefined();
      expect(registered.find(r => r.key === '2')).toBeDefined();
      expect(registered.find(r => r.key === '3')).toBeDefined();
      expect(registered.find(r => r.key === '4')).toBeDefined();
    });

    it('should trigger runTransform on r key press', () => {
      setup();
      const runSpy = vi.spyOn(engine, 'runTransform');

      const reg = shortcuts.getRegistered().find(r => r.key === 'r');
      reg?.callback();

      expect(runSpy).toHaveBeenCalled();
    });

    it('should switch toolbox category on number key press (1-4)', () => {
      setup();

      // Press '1' -> 'all'
      const reg1 = shortcuts.getRegistered().find(r => r.key === '1');
      reg1?.callback();
      expect(component.selectedCategory()).toBe('all');

      // Press '2' -> first category in list (text)
      const reg2 = shortcuts.getRegistered().find(r => r.key === '2');
      reg2?.callback();
      expect(component.selectedCategory()).toBe('text');
    });

    it('should unregister all shortcuts on destroy', () => {
      setup();
      const unregisterSpy = vi.spyOn(shortcuts, 'unregister');

      component.ngOnDestroy();

      expect(unregisterSpy).toHaveBeenCalledTimes(6);
      expect(unregisterSpy).toHaveBeenCalledWith('r');
      expect(unregisterSpy).toHaveBeenCalledWith('escape');
      expect(unregisterSpy).toHaveBeenCalledWith('1');
      expect(unregisterSpy).toHaveBeenCalledWith('2');
      expect(unregisterSpy).toHaveBeenCalledWith('3');
      expect(unregisterSpy).toHaveBeenCalledWith('4');
    });
  });

  // --- 8. Edge Cases ---

  describe('Edge Cases', () => {
    it('should handle empty streams list', () => {
      setup(createTestLevelData({
        streams: [],
        targetOutputs: [],
        testData: [],
      }));
      fixture.detectChanges();

      const rows = fixture.nativeElement.querySelectorAll('.stream-visualizer__stream');
      expect(rows.length).toBe(0);
    });

    it('should handle level with no available pipes gracefully', () => {
      setup(createTestLevelData({
        availablePipes: [],
      }));
      fixture.detectChanges();

      const items = fixture.nativeElement.querySelectorAll('.data-relay__pipe-item');
      expect(items.length).toBe(0);
    });

    it('should handle multiple streams with different pipe requirements', () => {
      const data = createTestLevelData({
        streams: [
          { id: 's1', name: 'Stream A', rawInput: 'hello' },
          { id: 's2', name: 'Stream B', rawInput: 'world' },
          { id: 's3', name: 'Stream C', rawInput: '100' },
        ],
        targetOutputs: [
          { streamId: 's1', expectedOutput: 'HELLO', requiredPipes: ['pipe-upper'] },
          { streamId: 's2', expectedOutput: 'WORLD', requiredPipes: ['pipe-upper'] },
          { streamId: 's3', expectedOutput: '$100.00', requiredPipes: ['pipe-currency'] },
        ],
      });
      setup(data);
      fixture.detectChanges();

      const rows = fixture.nativeElement.querySelectorAll('.stream-visualizer__stream');
      expect(rows.length).toBe(3);
    });
  });
});
