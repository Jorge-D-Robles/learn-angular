import { Component, signal } from '@angular/core';
import { createComponent } from '../../../../../testing/test-utils';
import type {
  PipeBlock,
  PipeDefinition,
  RuntimeStream,
  StreamResult,
} from '../data-relay.types';
import type { DropResult } from '../../../../core/minigame/drag-drop.service';
import { DataRelayStreamVisualizerComponent } from './stream-visualizer';

// ---------------------------------------------------------------------------
// Test data factories
// ---------------------------------------------------------------------------

function createRuntimeStream(overrides?: Partial<RuntimeStream>): RuntimeStream {
  return {
    streamId: 'stream-1',
    rawInput: 'hello world',
    requiredOutput: 'HELLO WORLD',
    placedPipes: [],
    ...overrides,
  };
}

function createPipeBlock(overrides?: Partial<PipeBlock>): PipeBlock {
  return {
    id: 'pb-1',
    pipeType: 'uppercase',
    params: [],
    position: 0,
    ...overrides,
  };
}

function createStreamResult(overrides?: Partial<StreamResult>): StreamResult {
  return {
    streamId: 'stream-1',
    actualOutput: 'HELLO WORLD',
    isCorrect: true,
    ...overrides,
  };
}

function createPipeDefinition(overrides?: Partial<PipeDefinition>): PipeDefinition {
  return {
    id: 'pipe-upper',
    pipeName: 'uppercase',
    displayName: 'UpperCase',
    category: 'text',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Test host
// ---------------------------------------------------------------------------

@Component({
  template: `
    <app-data-relay-stream-visualizer
      [streams]="streams()"
      [streamResultMap]="streamResultMap()"
      [placementFeedback]="placementFeedback()"
      [availablePipes]="availablePipes()"
      (pipeSlotClicked)="onPipeSlotClicked($event)"
      (pipeSlotRightClicked)="onPipeSlotRightClicked($event)"
      (pipeDragTarget)="onPipeDragTarget($event)"
    />
  `,
  imports: [DataRelayStreamVisualizerComponent],
})
class TestHost {
  streams = signal<readonly RuntimeStream[]>([]);
  streamResultMap = signal<Map<string, StreamResult>>(new Map());
  placementFeedback = signal<{ streamId: string; type: 'success' | 'error' } | null>(null);
  availablePipes = signal<readonly PipeDefinition[]>([]);
  onPipeSlotClicked = vi.fn();
  onPipeSlotRightClicked = vi.fn();
  onPipeDragTarget = vi.fn();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStreams(el: HTMLElement): NodeListOf<Element> {
  return el.querySelectorAll('.stream-visualizer__stream');
}

function getInputLabels(el: HTMLElement): NodeListOf<Element> {
  return el.querySelectorAll('.stream-visualizer__input-label');
}

function getExpectedOutputs(el: HTMLElement): NodeListOf<Element> {
  return el.querySelectorAll('.stream-visualizer__output-expected');
}

function getPipeSlots(el: HTMLElement): NodeListOf<Element> {
  return el.querySelectorAll('.stream-visualizer__pipe-slot');
}

function getPipeBlocks(el: HTMLElement): NodeListOf<Element> {
  return el.querySelectorAll('.stream-visualizer__pipe-block');
}

function getParticles(el: HTMLElement): NodeListOf<Element> {
  return el.querySelectorAll('.stream-visualizer__particle');
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DataRelayStreamVisualizerComponent', () => {
  async function setup(overrides: {
    streams?: readonly RuntimeStream[];
    streamResultMap?: Map<string, StreamResult>;
    placementFeedback?: { streamId: string; type: 'success' | 'error' } | null;
    availablePipes?: readonly PipeDefinition[];
  } = {}) {
    const { fixture, element } = await createComponent(TestHost, {
      detectChanges: false,
    });

    const host = fixture.componentInstance;
    if (overrides.streams) host.streams.set(overrides.streams);
    if (overrides.streamResultMap) host.streamResultMap.set(overrides.streamResultMap);
    if (overrides.placementFeedback !== undefined) host.placementFeedback.set(overrides.placementFeedback);
    if (overrides.availablePipes) host.availablePipes.set(overrides.availablePipes);

    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, host, element };
  }

  // 1. Creation
  it('should create with default empty inputs', async () => {
    const { element } = await setup();
    const component = element.querySelector('app-data-relay-stream-visualizer');
    expect(component).toBeTruthy();
  });

  // 2. Stream count rendering
  it('should render one stream row per stream in the input array', async () => {
    const { element } = await setup({
      streams: [
        createRuntimeStream({ streamId: 's1' }),
        createRuntimeStream({ streamId: 's2' }),
        createRuntimeStream({ streamId: 's3' }),
      ],
    });
    expect(getStreams(element).length).toBe(3);
  });

  // 3. Raw input display
  it('should show rawInput in the input label for each stream', async () => {
    const { element } = await setup({
      streams: [
        createRuntimeStream({ streamId: 's1', rawInput: 'commander shepard' }),
        createRuntimeStream({ streamId: 's2', rawInput: '42.5' }),
      ],
    });
    const labels = getInputLabels(element);
    expect(labels[0].textContent).toContain('commander shepard');
    expect(labels[1].textContent).toContain('42.5');
  });

  // 4. Expected output display
  it('should show requiredOutput in the expected output span', async () => {
    const { element } = await setup({
      streams: [
        createRuntimeStream({ streamId: 's1', requiredOutput: 'COMMANDER SHEPARD' }),
      ],
    });
    const expected = getExpectedOutputs(element);
    expect(expected[0].textContent).toContain('COMMANDER SHEPARD');
  });

  // 5. Empty streams
  it('should render 0 stream rows when streams input is empty', async () => {
    const { element } = await setup({ streams: [] });
    expect(getStreams(element).length).toBe(0);
  });

  // 6. Pipe slot drop zone
  it('should render a pipe slot drop zone for each stream', async () => {
    const { element } = await setup({
      streams: [
        createRuntimeStream({ streamId: 's1' }),
        createRuntimeStream({ streamId: 's2' }),
      ],
    });
    const slots = getPipeSlots(element);
    expect(slots.length).toBe(2);
    // The DropZoneDirective applies CSS classes when active, confirming directive presence.
    // We verify the drop zone exists structurally (one per stream).
    for (const slot of Array.from(slots)) {
      expect(slot.classList.contains('stream-visualizer__pipe-slot')).toBe(true);
    }
  });

  // 7. Placed pipe rendering
  it('should render placed pipes as pipe-block elements showing pipeType', async () => {
    const { element } = await setup({
      streams: [
        createRuntimeStream({
          streamId: 's1',
          placedPipes: [
            createPipeBlock({ id: 'pb-1', pipeType: 'uppercase' }),
            createPipeBlock({ id: 'pb-2', pipeType: 'lowercase' }),
          ],
        }),
      ],
      availablePipes: [createPipeDefinition()],
    });
    const blocks = getPipeBlocks(element);
    expect(blocks.length).toBe(2);
    expect(blocks[0].textContent).toContain('uppercase');
    expect(blocks[1].textContent).toContain('lowercase');
  });

  // 8. Placed pipe params display
  it('should display params on placed pipes that have them', async () => {
    const { element } = await setup({
      streams: [
        createRuntimeStream({
          streamId: 's1',
          placedPipes: [
            createPipeBlock({ id: 'pb-1', pipeType: 'date', params: ['mediumDate'] }),
          ],
        }),
      ],
      availablePipes: [
        createPipeDefinition({ pipeName: 'date', category: 'date' }),
      ],
    });
    const paramsSpan = element.querySelector('.stream-visualizer__pipe-params');
    expect(paramsSpan).toBeTruthy();
    expect(paramsSpan!.textContent).toContain('mediumDate');
  });

  // 9. Pipe click event
  it('should emit pipeSlotClicked when a pipe block is clicked', async () => {
    const pipeBlock = createPipeBlock({ id: 'pb-click', pipeType: 'uppercase' });
    const { host, element } = await setup({
      streams: [
        createRuntimeStream({ streamId: 's1', placedPipes: [pipeBlock] }),
      ],
      availablePipes: [createPipeDefinition()],
    });

    const block = element.querySelector('.stream-visualizer__pipe-block') as HTMLElement;
    block.click();

    expect(host.onPipeSlotClicked).toHaveBeenCalledWith({
      streamId: 's1',
      pipeBlock,
    });
  });

  // 10. Pipe right-click event
  it('should emit pipeSlotRightClicked on right-click with no MouseEvent in payload', async () => {
    const pipeBlock = createPipeBlock({ id: 'pb-rc', pipeType: 'uppercase' });
    const { host, element } = await setup({
      streams: [
        createRuntimeStream({ streamId: 's1', placedPipes: [pipeBlock] }),
      ],
      availablePipes: [createPipeDefinition()],
    });

    const block = element.querySelector('.stream-visualizer__pipe-block') as HTMLElement;
    const contextMenuEvent = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    const preventSpy = vi.spyOn(contextMenuEvent, 'preventDefault');
    block.dispatchEvent(contextMenuEvent);

    expect(preventSpy).toHaveBeenCalled();
    expect(host.onPipeSlotRightClicked).toHaveBeenCalledWith({
      streamId: 's1',
      pipeBlockId: 'pb-rc',
    });
  });

  // 11. Drop event
  it('should emit pipeDragTarget when a drop occurs on the pipe slot', async () => {
    const { fixture, host } = await setup({
      streams: [createRuntimeStream({ streamId: 's1' })],
    });

    // Find the child component instance to call onDrop directly
    // since DropZoneDirective uses DragDropService which is hard to mock in a unit test
    const childDebug = fixture.debugElement.query(
      (node: { componentInstance: unknown }) => node.componentInstance instanceof DataRelayStreamVisualizerComponent,
    );
    const child = childDebug.componentInstance as DataRelayStreamVisualizerComponent;

    const mockDropResult: DropResult = {
      accepted: true,
      zoneId: 'stream-s1',
      data: { id: 'pipe-upper' },
    };
    child.onDrop(mockDropResult, 's1');

    expect(host.onPipeDragTarget).toHaveBeenCalledWith({
      dropResult: mockDropResult,
      streamId: 's1',
    });
  });

  // 12. Output comparison: correct
  it('should apply --correct class when stream result is correct', async () => {
    const resultMap = new Map<string, StreamResult>();
    resultMap.set('s1', createStreamResult({ streamId: 's1', isCorrect: true, actualOutput: 'HELLO WORLD' }));

    const { element } = await setup({
      streams: [createRuntimeStream({ streamId: 's1' })],
      streamResultMap: resultMap,
    });

    const correct = element.querySelector('.stream-visualizer__output--correct');
    expect(correct).toBeTruthy();
  });

  // 13. Output comparison: incorrect
  it('should apply --incorrect class when stream result is incorrect', async () => {
    const resultMap = new Map<string, StreamResult>();
    resultMap.set('s1', createStreamResult({ streamId: 's1', isCorrect: false, actualOutput: 'wrong' }));

    const { element } = await setup({
      streams: [createRuntimeStream({ streamId: 's1' })],
      streamResultMap: resultMap,
    });

    const incorrect = element.querySelector('.stream-visualizer__output--incorrect');
    expect(incorrect).toBeTruthy();
  });

  // 14. Output comparison: no result yet
  it('should not render actual output when streamResultMap is empty', async () => {
    const { element } = await setup({
      streams: [createRuntimeStream({ streamId: 's1' })],
      streamResultMap: new Map(),
    });

    const actual = element.querySelector('.stream-visualizer__output-actual');
    expect(actual).toBeNull();
  });

  // 15. Placement feedback: success
  it('should apply --feedback-success class when placementFeedback matches stream with success', async () => {
    const { element } = await setup({
      streams: [createRuntimeStream({ streamId: 's1' })],
      placementFeedback: { streamId: 's1', type: 'success' },
    });

    const stream = element.querySelector('.stream-visualizer__stream--feedback-success');
    expect(stream).toBeTruthy();
  });

  // 16. Placement feedback: error
  it('should apply --feedback-error class when placementFeedback matches stream with error', async () => {
    const { element } = await setup({
      streams: [createRuntimeStream({ streamId: 's1' })],
      placementFeedback: { streamId: 's1', type: 'error' },
    });

    const stream = element.querySelector('.stream-visualizer__stream--feedback-error');
    expect(stream).toBeTruthy();
  });

  // 17. Data particles exist
  it('should render particles for each gap (placedPipes.length + 1 per stream)', async () => {
    const { element } = await setup({
      streams: [
        createRuntimeStream({
          streamId: 's1',
          placedPipes: [
            createPipeBlock({ id: 'pb-1' }),
            createPipeBlock({ id: 'pb-2' }),
          ],
        }),
      ],
      availablePipes: [createPipeDefinition()],
    });

    // 2 placed pipes = 3 gaps
    const particles = getParticles(element);
    expect(particles.length).toBe(3);
  });

  // 18. Keyboard accessibility
  it('should have tabindex and role=button on pipe blocks and respond to Enter key', async () => {
    const pipeBlock = createPipeBlock({ id: 'pb-a11y', pipeType: 'uppercase' });
    const { host, element } = await setup({
      streams: [
        createRuntimeStream({ streamId: 's1', placedPipes: [pipeBlock] }),
      ],
      availablePipes: [createPipeDefinition()],
    });

    const block = element.querySelector('.stream-visualizer__pipe-block') as HTMLElement;
    expect(block.getAttribute('tabindex')).toBe('0');
    expect(block.getAttribute('role')).toBe('button');

    // Trigger Enter key
    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
    block.dispatchEvent(enterEvent);

    expect(host.onPipeSlotClicked).toHaveBeenCalledWith({
      streamId: 's1',
      pipeBlock,
    });
  });
});
