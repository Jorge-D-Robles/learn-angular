import { Component, signal } from '@angular/core';
import { createComponent } from '../../../../../testing/test-utils';
import type { InterceptorBlock, InterceptorType } from '../deep-space-radio.types';
import { InterceptorPipelineComponent } from './interceptor-pipeline';

// ---------------------------------------------------------------------------
// Test data factories
// ---------------------------------------------------------------------------

function createInterceptorBlock(
  overrides?: Partial<InterceptorBlock>,
): InterceptorBlock {
  return {
    id: 'int-1',
    type: 'auth',
    config: {},
    order: 0,
    ...overrides,
  };
}

const ICON_LETTERS: Record<InterceptorType, string> = {
  auth: 'A',
  logging: 'L',
  retry: 'R',
  error: 'E',
  caching: 'C',
  custom: 'X',
};

// ---------------------------------------------------------------------------
// Test host
// ---------------------------------------------------------------------------

@Component({
  template: `
    <app-interceptor-pipeline
      [chain]="chain()"
      [isTransmitting]="isTransmitting()"
      [toolboxItems]="toolboxItems()"
      (interceptorPlaced)="onInterceptorPlaced($event)"
      (interceptorRemoved)="onInterceptorRemoved($event)"
      (interceptorClicked)="onInterceptorClicked($event)"
    />
  `,
  imports: [InterceptorPipelineComponent],
})
class TestHost {
  chain = signal<readonly InterceptorBlock[]>([]);
  isTransmitting = signal(false);
  toolboxItems = signal<readonly InterceptorBlock[]>([]);
  onInterceptorPlaced = vi.fn();
  onInterceptorRemoved = vi.fn();
  onInterceptorClicked = vi.fn();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getPipeline(el: HTMLElement): HTMLElement {
  return el.querySelector('app-interceptor-pipeline') as HTMLElement;
}

function getSlots(el: HTMLElement): HTMLElement[] {
  return Array.from(el.querySelectorAll('.interceptor-pipeline__slot'));
}

function getBlocks(el: HTMLElement): HTMLElement[] {
  return Array.from(el.querySelectorAll('.interceptor-pipeline__block'));
}

function getToolboxItems(el: HTMLElement): HTMLElement[] {
  return Array.from(el.querySelectorAll('.interceptor-pipeline__toolbox-item'));
}

function getWaveOverlay(el: HTMLElement): HTMLElement | null {
  return el.querySelector('.interceptor-pipeline__wave');
}

function getEmptySlots(el: HTMLElement): HTMLElement[] {
  return Array.from(el.querySelectorAll('.interceptor-pipeline__slot--empty'));
}

function getIconLetter(block: HTMLElement): string {
  const icon = block.querySelector('.interceptor-pipeline__icon') as HTMLElement;
  return icon ? icon.textContent!.trim() : '';
}

function getBlockName(block: HTMLElement): string {
  const name = block.querySelector('.interceptor-pipeline__name') as HTMLElement;
  return name ? name.textContent!.trim() : '';
}

function getConfigPreview(block: HTMLElement): string {
  const preview = block.querySelector('.interceptor-pipeline__config-preview') as HTMLElement;
  return preview ? preview.textContent!.trim() : '';
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('InterceptorPipelineComponent', () => {
  async function setup(overrides: {
    chain?: readonly InterceptorBlock[];
    isTransmitting?: boolean;
    toolboxItems?: readonly InterceptorBlock[];
  } = {}) {
    const { fixture, element } = await createComponent(TestHost, {
      detectChanges: false,
    });

    const host = fixture.componentInstance;
    if (overrides.chain) host.chain.set(overrides.chain);
    if (overrides.isTransmitting !== undefined) host.isTransmitting.set(overrides.isTransmitting);
    if (overrides.toolboxItems) host.toolboxItems.set(overrides.toolboxItems);

    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, host, element };
  }

  // 1. Creation
  it('should create the component', async () => {
    const { element } = await setup();
    expect(getPipeline(element)).toBeTruthy();
  });

  // 2. Empty pipeline renders empty slots
  it('should render an empty slot when chain is empty', async () => {
    const { element } = await setup({ chain: [] });
    const emptySlots = getEmptySlots(element);
    expect(emptySlots.length).toBeGreaterThanOrEqual(1);
  });

  // 3. Renders interceptor blocks in order
  it('should render interceptor blocks matching the chain input', async () => {
    const chain: InterceptorBlock[] = [
      createInterceptorBlock({ id: 'int-1', type: 'auth', order: 0 }),
      createInterceptorBlock({ id: 'int-2', type: 'logging', order: 1 }),
      createInterceptorBlock({ id: 'int-3', type: 'retry', order: 2 }),
    ];
    const { element } = await setup({ chain });

    const blocks = getBlocks(element);
    expect(blocks.length).toBe(3);
  });

  // 4. Block displays type icon letter (A for auth)
  it('should display the correct icon letter for each interceptor type', async () => {
    const types: InterceptorType[] = ['auth', 'logging', 'retry', 'error', 'caching', 'custom'];
    const chain = types.map((type, i) =>
      createInterceptorBlock({ id: `int-${i}`, type, order: i }),
    );
    const { element } = await setup({ chain });

    const blocks = getBlocks(element);
    expect(blocks.length).toBe(types.length);

    types.forEach((type, i) => {
      expect(getIconLetter(blocks[i])).toBe(ICON_LETTERS[type]);
    });
  });

  // 5. Block displays name
  it('should display the interceptor type as the block name', async () => {
    const chain = [
      createInterceptorBlock({ id: 'int-1', type: 'auth', order: 0 }),
    ];
    const { element } = await setup({ chain });

    const blocks = getBlocks(element);
    expect(getBlockName(blocks[0])).toBe('auth');
  });

  // 6. Block displays config preview
  it('should display a config preview when config has entries', async () => {
    const chain = [
      createInterceptorBlock({
        id: 'int-1',
        type: 'auth',
        order: 0,
        config: { token: 'Bearer xyz' },
      }),
    ];
    const { element } = await setup({ chain });

    const blocks = getBlocks(element);
    const preview = getConfigPreview(blocks[0]);
    expect(preview).toContain('token');
  });

  // 7. Config preview empty when config is empty
  it('should show empty config preview when config is empty', async () => {
    const chain = [
      createInterceptorBlock({ id: 'int-1', type: 'auth', order: 0, config: {} }),
    ];
    const { element } = await setup({ chain });

    const blocks = getBlocks(element);
    const preview = getConfigPreview(blocks[0]);
    expect(preview).toBe('');
  });

  // 8. Radio wave animation hidden when not transmitting
  it('should not show the wave animation when isTransmitting is false', async () => {
    const { element } = await setup({ isTransmitting: false });
    const wave = getWaveOverlay(element);
    // Wave may exist in DOM but should not have the animating class
    if (wave) {
      expect(wave.classList.contains('interceptor-pipeline__wave--active')).toBe(false);
    } else {
      // Wave element not present at all is also acceptable
      expect(wave).toBeNull();
    }
  });

  // 9. Radio wave animation shown when transmitting
  it('should show the wave animation when isTransmitting is true', async () => {
    const chain = [
      createInterceptorBlock({ id: 'int-1', type: 'auth', order: 0 }),
    ];
    const { element } = await setup({ chain, isTransmitting: true });
    const wave = getWaveOverlay(element);
    expect(wave).toBeTruthy();
    expect(wave!.classList.contains('interceptor-pipeline__wave--active')).toBe(true);
  });

  // 10. Toolbox renders available items
  it('should render toolbox items from toolboxItems input', async () => {
    const toolboxItems = [
      createInterceptorBlock({ id: 'tool-1', type: 'auth', order: 0 }),
      createInterceptorBlock({ id: 'tool-2', type: 'logging', order: 1 }),
    ];
    const { element } = await setup({ toolboxItems });

    const items = getToolboxItems(element);
    expect(items.length).toBe(2);
  });

  // 11. Toolbox items display icon letter
  it('should display icon letters on toolbox items', async () => {
    const toolboxItems = [
      createInterceptorBlock({ id: 'tool-1', type: 'caching', order: 0 }),
    ];
    const { element } = await setup({ toolboxItems });

    const items = getToolboxItems(element);
    const icon = items[0].querySelector('.interceptor-pipeline__icon') as HTMLElement;
    expect(icon).toBeTruthy();
    expect(icon.textContent!.trim()).toBe('C');
  });

  // 12. Clicking a block emits interceptorClicked
  it('should emit interceptorClicked when a block is clicked', async () => {
    const chain = [
      createInterceptorBlock({ id: 'int-1', type: 'auth', order: 0 }),
    ];
    const { fixture, host, element } = await setup({ chain });

    const blocks = getBlocks(element);
    blocks[0].click();
    fixture.detectChanges();

    expect(host.onInterceptorClicked).toHaveBeenCalledWith(chain[0]);
  });

  // 13. Right-click removes interceptor
  it('should emit interceptorRemoved on right-click of a block', async () => {
    const chain = [
      createInterceptorBlock({ id: 'int-1', type: 'auth', order: 0 }),
      createInterceptorBlock({ id: 'int-2', type: 'logging', order: 1 }),
    ];
    const { fixture, host, element } = await setup({ chain });

    const blocks = getBlocks(element);
    const contextEvent = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
    });
    blocks[1].dispatchEvent(contextEvent);
    fixture.detectChanges();

    expect(host.onInterceptorRemoved).toHaveBeenCalledWith({ position: 1 });
  });

  // 14. Right-click is prevented from opening browser menu
  it('should prevent default on right-click', async () => {
    const chain = [
      createInterceptorBlock({ id: 'int-1', type: 'auth', order: 0 }),
    ];
    const { element } = await setup({ chain });

    const blocks = getBlocks(element);
    const contextEvent = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
    });
    blocks[0].dispatchEvent(contextEvent);

    expect(contextEvent.defaultPrevented).toBe(true);
  });

  // 15. Pipeline has a trailing empty drop slot
  it('should have a trailing empty drop slot after placed blocks', async () => {
    const chain = [
      createInterceptorBlock({ id: 'int-1', type: 'auth', order: 0 }),
    ];
    const { element } = await setup({ chain });

    const slots = getSlots(element);
    // Should have at least chain.length + 1 slots (1 block + 1 empty)
    expect(slots.length).toBeGreaterThan(chain.length);
    const lastSlot = slots[slots.length - 1];
    expect(lastSlot.classList.contains('interceptor-pipeline__slot--empty')).toBe(true);
  });

  // 16. Dynamic chain update re-renders blocks
  it('should re-render when chain input changes', async () => {
    const { fixture, host, element } = await setup({
      chain: [createInterceptorBlock({ id: 'int-1', type: 'auth', order: 0 })],
    });
    expect(getBlocks(element).length).toBe(1);

    host.chain.set([
      createInterceptorBlock({ id: 'int-1', type: 'auth', order: 0 }),
      createInterceptorBlock({ id: 'int-2', type: 'error', order: 1 }),
    ]);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(getBlocks(element).length).toBe(2);
  });

  // 17. Transmitting state toggles wave animation
  it('should toggle wave animation when isTransmitting changes', async () => {
    const chain = [
      createInterceptorBlock({ id: 'int-1', type: 'auth', order: 0 }),
    ];
    const { fixture, host, element } = await setup({ chain, isTransmitting: false });

    // Initially no active wave
    let wave = getWaveOverlay(element);
    if (wave) {
      expect(wave.classList.contains('interceptor-pipeline__wave--active')).toBe(false);
    }

    // Toggle to transmitting
    host.isTransmitting.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    wave = getWaveOverlay(element);
    expect(wave).toBeTruthy();
    expect(wave!.classList.contains('interceptor-pipeline__wave--active')).toBe(true);
  });

  // 18. Each block has correct type-based CSS modifier class
  it('should apply type-specific CSS class to each block', async () => {
    const chain = [
      createInterceptorBlock({ id: 'int-1', type: 'auth', order: 0 }),
      createInterceptorBlock({ id: 'int-2', type: 'error', order: 1 }),
    ];
    const { element } = await setup({ chain });

    const blocks = getBlocks(element);
    expect(blocks[0].classList.contains('interceptor-pipeline__block--auth')).toBe(true);
    expect(blocks[1].classList.contains('interceptor-pipeline__block--error')).toBe(true);
  });
});
