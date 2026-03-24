import { Component, signal } from '@angular/core';
import { createComponent } from '../../../../../testing/test-utils';
import type { BlastDoor, BehaviorBlock, HookSlot } from '../blast-doors.types';
import { LIFECYCLE_HOOK_ORDER } from '../blast-doors.types';
import { BlastDoorsTimelineComponent } from './timeline';

// ---------------------------------------------------------------------------
// Test data factories
// ---------------------------------------------------------------------------

function createBehaviorBlock(overrides?: Partial<BehaviorBlock>): BehaviorBlock {
  return {
    id: 'bh-1',
    description: 'Initialize door state',
    code: 'this.state = "open"',
    hookTarget: 'ngOnInit',
    ...overrides,
  };
}

function createHookSlot(overrides?: Partial<HookSlot>): HookSlot {
  return {
    hookType: 'ngOnInit',
    behaviorBlock: null,
    executionOrder: 0,
    ...overrides,
  };
}

function createBlastDoor(overrides?: Partial<BlastDoor>): BlastDoor {
  return {
    id: 'door-1',
    position: 'main-corridor',
    currentState: 'closed',
    hookSlots: LIFECYCLE_HOOK_ORDER.map((hookType, i) =>
      createHookSlot({ hookType, executionOrder: i }),
    ),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Test host
// ---------------------------------------------------------------------------

@Component({
  template: `
    <app-blast-doors-timeline
      [door]="door()"
      [availableBehaviors]="availableBehaviors()"
      [simulationFeedback]="simulationFeedback()"
      (behaviorPlaced)="onBehaviorPlaced($event)"
      (behaviorRemoved)="onBehaviorRemoved($event)"
    />
  `,
  imports: [BlastDoorsTimelineComponent],
})
class TestHost {
  door = signal<BlastDoor>(createBlastDoor());
  availableBehaviors = signal<readonly BehaviorBlock[]>([]);
  simulationFeedback = signal<Map<string, 'correct' | 'incorrect'> | null>(null);
  onBehaviorPlaced = vi.fn();
  onBehaviorRemoved = vi.fn();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTimeline(el: HTMLElement): HTMLElement {
  return el.querySelector('app-blast-doors-timeline') as HTMLElement;
}

function getSlots(el: HTMLElement): HTMLElement[] {
  return Array.from(el.querySelectorAll('.timeline__slot'));
}

function getSlotLabels(el: HTMLElement): string[] {
  return Array.from(el.querySelectorAll('.timeline__hook-label')).map(
    (node) => (node as HTMLElement).textContent!.trim(),
  );
}

function getSlotByHook(el: HTMLElement, hookType: string): HTMLElement | null {
  const slots = getSlots(el);
  return slots.find(
    (s) => s.querySelector('.timeline__hook-label')?.textContent?.trim() === hookType,
  ) ?? null;
}

function getPlacedBehavior(slot: HTMLElement): HTMLElement | null {
  return slot.querySelector('.timeline__behavior');
}

function getEmptyIndicator(slot: HTMLElement): HTMLElement | null {
  return slot.querySelector('.timeline__empty');
}

function getDropZone(slot: HTMLElement): HTMLElement | null {
  return slot.querySelector('[role="button"]');
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BlastDoorsTimelineComponent', () => {
  async function setup(overrides: {
    door?: BlastDoor;
    availableBehaviors?: readonly BehaviorBlock[];
    simulationFeedback?: Map<string, 'correct' | 'incorrect'> | null;
  } = {}) {
    const { fixture, element } = await createComponent(TestHost, {
      detectChanges: false,
    });

    const host = fixture.componentInstance;
    if (overrides.door) host.door.set(overrides.door);
    if (overrides.availableBehaviors) host.availableBehaviors.set(overrides.availableBehaviors);
    if (overrides.simulationFeedback !== undefined) host.simulationFeedback.set(overrides.simulationFeedback);

    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, host, element };
  }

  // 1. Creation
  it('should create the component', async () => {
    const { element } = await setup();
    expect(getTimeline(element)).toBeTruthy();
  });

  // 2. Renders one slot per lifecycle hook in LIFECYCLE_HOOK_ORDER
  it('should render a slot for each lifecycle hook in order', async () => {
    const { element } = await setup();
    const labels = getSlotLabels(element);
    expect(labels).toEqual([...LIFECYCLE_HOOK_ORDER]);
  });

  // 3. Slots show empty indicator when no behavior is placed
  it('should show empty indicator for slots without a behavior', async () => {
    const { element } = await setup();
    const slot = getSlotByHook(element, 'ngOnInit');
    expect(slot).toBeTruthy();
    expect(getEmptyIndicator(slot!)).toBeTruthy();
    expect(getPlacedBehavior(slot!)).toBeNull();
  });

  // 4. Slots show placed behavior description when a behavior is assigned
  it('should show placed behavior when a slot has a behavior block', async () => {
    const block = createBehaviorBlock({ id: 'bh-init', hookTarget: 'ngOnInit' });
    const door = createBlastDoor({
      hookSlots: LIFECYCLE_HOOK_ORDER.map((hookType, i) =>
        createHookSlot({
          hookType,
          executionOrder: i,
          behaviorBlock: hookType === 'ngOnInit' ? block : null,
        }),
      ),
    });
    const { element } = await setup({ door });

    const slot = getSlotByHook(element, 'ngOnInit');
    expect(slot).toBeTruthy();
    const behavior = getPlacedBehavior(slot!);
    expect(behavior).toBeTruthy();
    expect(behavior!.textContent).toContain(block.description);
  });

  // 5. Clicking an empty slot with available behaviors emits behaviorPlaced
  it('should emit behaviorPlaced when clicking an empty slot with a selected behavior', async () => {
    const block = createBehaviorBlock({ id: 'bh-init', hookTarget: 'ngOnInit' });
    const { fixture, host, element } = await setup({
      availableBehaviors: [block],
    });

    const slot = getSlotByHook(element, 'ngOnInit');
    expect(slot).toBeTruthy();
    const dropZone = getDropZone(slot!);
    expect(dropZone).toBeTruthy();
    dropZone!.click();
    fixture.detectChanges();

    expect(host.onBehaviorPlaced).toHaveBeenCalledWith({
      doorId: 'door-1',
      hookType: 'ngOnInit',
      behaviorBlock: block,
    });
  });

  // 6. Clicking a filled slot emits behaviorRemoved
  it('should emit behaviorRemoved when clicking a filled slot', async () => {
    const block = createBehaviorBlock({ id: 'bh-init', hookTarget: 'ngOnInit' });
    const door = createBlastDoor({
      hookSlots: LIFECYCLE_HOOK_ORDER.map((hookType, i) =>
        createHookSlot({
          hookType,
          executionOrder: i,
          behaviorBlock: hookType === 'ngOnInit' ? block : null,
        }),
      ),
    });
    const { fixture, host, element } = await setup({ door });

    const slot = getSlotByHook(element, 'ngOnInit');
    const behavior = getPlacedBehavior(slot!);
    expect(behavior).toBeTruthy();
    behavior!.click();
    fixture.detectChanges();

    expect(host.onBehaviorRemoved).toHaveBeenCalledWith({
      doorId: 'door-1',
      hookType: 'ngOnInit',
    });
  });

  // 7. Green glow class applied for correct feedback
  it('should apply correct feedback class when simulationFeedback is correct', async () => {
    const feedback = new Map<string, 'correct' | 'incorrect'>([['ngOnInit', 'correct']]);
    const { element } = await setup({ simulationFeedback: feedback });

    const slot = getSlotByHook(element, 'ngOnInit');
    expect(slot).toBeTruthy();
    expect(slot!.classList.contains('timeline__slot--correct')).toBe(true);
  });

  // 8. Red pulse class applied for incorrect feedback
  it('should apply incorrect feedback class when simulationFeedback is incorrect', async () => {
    const feedback = new Map<string, 'correct' | 'incorrect'>([['ngOnInit', 'incorrect']]);
    const { element } = await setup({ simulationFeedback: feedback });

    const slot = getSlotByHook(element, 'ngOnInit');
    expect(slot).toBeTruthy();
    expect(slot!.classList.contains('timeline__slot--incorrect')).toBe(true);
  });

  // 9. No feedback class when simulationFeedback is null
  it('should not apply feedback classes when simulationFeedback is null', async () => {
    const { element } = await setup({ simulationFeedback: null });

    const slot = getSlotByHook(element, 'ngOnInit');
    expect(slot).toBeTruthy();
    expect(slot!.classList.contains('timeline__slot--correct')).toBe(false);
    expect(slot!.classList.contains('timeline__slot--incorrect')).toBe(false);
  });

  // 10. Keyboard: Enter on empty slot emits behaviorPlaced
  it('should emit behaviorPlaced on Enter key for empty slot', async () => {
    const block = createBehaviorBlock({ id: 'bh-init', hookTarget: 'ngOnInit' });
    const { fixture, host, element } = await setup({
      availableBehaviors: [block],
    });

    const slot = getSlotByHook(element, 'ngOnInit');
    const dropZone = getDropZone(slot!);
    expect(dropZone).toBeTruthy();
    dropZone!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();

    expect(host.onBehaviorPlaced).toHaveBeenCalledWith({
      doorId: 'door-1',
      hookType: 'ngOnInit',
      behaviorBlock: block,
    });
  });

  // 11. Keyboard: Space on empty slot emits behaviorPlaced
  it('should emit behaviorPlaced on Space key for empty slot', async () => {
    const block = createBehaviorBlock({ id: 'bh-init', hookTarget: 'ngOnInit' });
    const { fixture, host, element } = await setup({
      availableBehaviors: [block],
    });

    const slot = getSlotByHook(element, 'ngOnInit');
    const dropZone = getDropZone(slot!);
    expect(dropZone).toBeTruthy();
    dropZone!.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    fixture.detectChanges();

    expect(host.onBehaviorPlaced).toHaveBeenCalledWith({
      doorId: 'door-1',
      hookType: 'ngOnInit',
      behaviorBlock: block,
    });
  });

  // 12. Each slot has tabindex for keyboard navigation
  it('should set tabindex on each slot drop zone for keyboard navigation', async () => {
    const { element } = await setup();
    const slots = getSlots(element);
    slots.forEach(slot => {
      const dropZone = getDropZone(slot);
      expect(dropZone).toBeTruthy();
      expect(dropZone!.getAttribute('tabindex')).toBe('0');
    });
  });

  // 13. Each slot has role attribute for accessibility
  it('should set role="button" on each slot drop zone', async () => {
    const { element } = await setup();
    const slots = getSlots(element);
    slots.forEach(slot => {
      const dropZone = getDropZone(slot);
      expect(dropZone).toBeTruthy();
      expect(dropZone!.getAttribute('role')).toBe('button');
    });
  });

  // 14. Does not emit behaviorPlaced when no available behaviors
  it('should not emit behaviorPlaced when no available behaviors exist', async () => {
    const { fixture, host, element } = await setup({
      availableBehaviors: [],
    });

    const slot = getSlotByHook(element, 'ngOnInit');
    const dropZone = getDropZone(slot!);
    dropZone!.click();
    fixture.detectChanges();

    expect(host.onBehaviorPlaced).not.toHaveBeenCalled();
  });

  // 15. Dynamic door update re-renders slots
  it('should re-render when door input changes', async () => {
    const block = createBehaviorBlock({ id: 'bh-init', hookTarget: 'ngOnInit' });
    const { fixture, host, element } = await setup();

    // Initially empty
    let slot = getSlotByHook(element, 'ngOnInit');
    expect(getPlacedBehavior(slot!)).toBeNull();

    // Update door with a placed behavior
    host.door.set(createBlastDoor({
      hookSlots: LIFECYCLE_HOOK_ORDER.map((hookType, i) =>
        createHookSlot({
          hookType,
          executionOrder: i,
          behaviorBlock: hookType === 'ngOnInit' ? block : null,
        }),
      ),
    }));
    fixture.detectChanges();
    await fixture.whenStable();

    slot = getSlotByHook(element, 'ngOnInit');
    expect(getPlacedBehavior(slot!)).toBeTruthy();
  });

  // 16. Renders timeline bar container
  it('should render a timeline bar container element', async () => {
    const { element } = await setup();
    const bar = element.querySelector('.timeline__bar');
    expect(bar).toBeTruthy();
  });
});
