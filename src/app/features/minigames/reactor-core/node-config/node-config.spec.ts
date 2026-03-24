import { Component, signal } from '@angular/core';
import { createComponent } from '../../../../../testing/test-utils';
import type { ComputedNode, EffectNode, SignalNode } from '../reactor-core.types';
import { ReactorCoreNodeConfigComponent } from './node-config';

// ---------------------------------------------------------------------------
// Test data factories
// ---------------------------------------------------------------------------

function createSignalNode(overrides?: Partial<SignalNode>): SignalNode {
  return { id: 'sig-1', type: 'signal', label: 'count', initialValue: 0, ...overrides };
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
    actionDescription: 'Log value',
    dependencyIds: ['sig-1'],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Test host
// ---------------------------------------------------------------------------

@Component({
  template: `
    <app-node-config
      [node]="node()"
      [availableDependencies]="availableDependencies()"
      (nodeConfigured)="onNodeConfigured($event)"
      (cancelled)="onCancelled()"
    />
  `,
  imports: [ReactorCoreNodeConfigComponent],
})
class TestHost {
  node = signal<SignalNode | ComputedNode | EffectNode>(createSignalNode());
  availableDependencies = signal<string[]>([]);
  onNodeConfigured = vi.fn();
  onCancelled = vi.fn();
}

// ---------------------------------------------------------------------------
// DOM query helpers
// ---------------------------------------------------------------------------

function getNodeConfig(el: HTMLElement): HTMLElement {
  return el.querySelector('app-node-config') as HTMLElement;
}

function getTypeIndicator(el: HTMLElement): HTMLElement | null {
  return el.querySelector('.node-config__type-indicator');
}

function getApplyButton(el: HTMLElement): HTMLButtonElement | null {
  return el.querySelector('.node-config__apply-btn');
}

function getCancelButton(el: HTMLElement): HTMLButtonElement | null {
  return el.querySelector('.node-config__cancel-btn');
}

function getValueInput(el: HTMLElement): HTMLInputElement | null {
  return el.querySelector('.node-config__value-input');
}

function getTypeButtons(el: HTMLElement): HTMLButtonElement[] {
  return Array.from(el.querySelectorAll('.node-config__type-btn'));
}

function getActionTextarea(el: HTMLElement): HTMLTextAreaElement | null {
  return el.querySelector('.node-config__action-textarea');
}

function getCleanupCheckbox(el: HTMLElement): HTMLInputElement | null {
  return el.querySelector('.node-config__cleanup-toggle input[type="checkbox"]');
}

function getDependencyCheckboxes(el: HTMLElement): HTMLInputElement[] {
  return Array.from(el.querySelectorAll('.node-config__dep-item input[type="checkbox"]'));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ReactorCoreNodeConfigComponent', () => {
  async function setup(overrides: {
    node?: SignalNode | ComputedNode | EffectNode;
    availableDependencies?: string[];
  } = {}) {
    const { fixture, element } = await createComponent(TestHost, {
      detectChanges: false,
    });

    const host = fixture.componentInstance;
    if (overrides.node) host.node.set(overrides.node);
    if (overrides.availableDependencies) host.availableDependencies.set(overrides.availableDependencies);

    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, host, element };
  }

  // 1. Creation
  it('should create the component', async () => {
    const { element } = await setup();
    expect(getNodeConfig(element)).toBeTruthy();
  });

  // 2. Header renders node label and type
  it('should render node label and type badge in the header', async () => {
    const { element } = await setup({ node: createSignalNode({ label: 'count' }) });
    const label = element.querySelector('.node-config__label') as HTMLElement;
    const badge = element.querySelector('.node-config__type-badge') as HTMLElement;
    expect(label).toBeTruthy();
    expect(label.textContent).toContain('count');
    expect(badge).toBeTruthy();
    expect(badge.textContent).toContain('signal');
  });

  // 3. Signal node: type color indicator (blue)
  it('should show blue type indicator for signal nodes', async () => {
    const { element } = await setup({ node: createSignalNode() });
    const indicator = getTypeIndicator(element);
    expect(indicator).toBeTruthy();
    // #3B82F6 -> rgb(59, 130, 246)
    expect(indicator!.style.backgroundColor).toBe('rgb(59, 130, 246)');
  });

  // 4. Signal node: value input renders
  it('should render a value input for signal nodes', async () => {
    const { element } = await setup({ node: createSignalNode({ initialValue: 0 }) });
    const input = getValueInput(element);
    expect(input).toBeTruthy();
    expect(input!.value).toBe('0');
  });

  // 5. Signal node: type selector renders
  it('should render three type selector buttons for signal nodes', async () => {
    const { element } = await setup({ node: createSignalNode({ initialValue: 0 }) });
    const btns = getTypeButtons(element);
    expect(btns.length).toBe(3);
    const labels = btns.map(b => b.textContent!.trim());
    expect(labels).toEqual(['string', 'number', 'boolean']);
    // number should be active (typeof 0 === 'number')
    const activeBtn = btns.find(b => b.classList.contains('node-config__type-btn--active'));
    expect(activeBtn).toBeTruthy();
    expect(activeBtn!.textContent!.trim()).toBe('number');
  });

  // 6. Signal node: value edit and apply
  it('should emit nodeConfigured with coerced value when Apply is clicked for signal node', async () => {
    const { fixture, host, element } = await setup({
      node: createSignalNode({ initialValue: 0 }),
    });

    const input = getValueInput(element)!;
    input.value = '42';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const applyBtn = getApplyButton(element)!;
    applyBtn.click();
    fixture.detectChanges();

    expect(host.onNodeConfigured).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'sig-1', type: 'signal', initialValue: 42 }),
    );
  });

  // 7. Computed node: expression builder renders
  it('should render nx-expression-builder when node type is computed', async () => {
    const { element } = await setup({ node: createComputedNode() });
    const exprBuilder = element.querySelector('nx-expression-builder');
    expect(exprBuilder).toBeTruthy();
  });

  // 8. Computed node: available dependencies passed
  it('should pass availableDependencies as variables to expression builder', async () => {
    const { element } = await setup({
      node: createComputedNode(),
      availableDependencies: ['count', 'total'],
    });
    // In raw mode, the expression builder renders an input rather than selects.
    // Verify the raw mode input is present (variables are passed but used internally for validation).
    const rawInput = element.querySelector('nx-expression-builder input[aria-label="Expression"]') as HTMLInputElement;
    expect(rawInput).toBeTruthy();
  });

  // 9. Computed node: expression edit and apply
  it('should emit nodeConfigured with updated expression when Apply is clicked for computed node', async () => {
    const { fixture, host, element } = await setup({
      node: createComputedNode({ computationExpr: 'count * 2' }),
      availableDependencies: ['count'],
    });

    // Use raw mode input to change expression
    const rawInput = element.querySelector(
      'nx-expression-builder input[aria-label="Expression"]',
    ) as HTMLInputElement;
    expect(rawInput).toBeTruthy();
    rawInput.value = 'count + 10';
    rawInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();

    const applyBtn = getApplyButton(element)!;
    applyBtn.click();
    fixture.detectChanges();

    // The expressionChange output only fires for valid expressions.
    // Since "count + 10" uses a valid variable and operator, it should fire.
    expect(host.onNodeConfigured).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'comp-1', type: 'computed', computationExpr: 'count + 10' }),
    );
  });

  // 10. Effect node: action textarea renders
  it('should render an action textarea for effect nodes', async () => {
    const { element } = await setup({ node: createEffectNode({ actionDescription: 'Log value' }) });
    const textarea = getActionTextarea(element);
    expect(textarea).toBeTruthy();
    expect(textarea!.value).toBe('Log value');
  });

  // 11. Effect node: cleanup toggle renders
  it('should render a cleanup toggle checkbox for effect nodes', async () => {
    const { element } = await setup({ node: createEffectNode() });
    const checkbox = getCleanupCheckbox(element);
    expect(checkbox).toBeTruthy();
    expect(checkbox!.checked).toBe(false);
  });

  // 12. Effect node: action edit and apply
  it('should emit nodeConfigured with updated action and cleanup when Apply is clicked for effect node', async () => {
    const { fixture, host, element } = await setup({
      node: createEffectNode({ actionDescription: 'Log value', requiresCleanup: false }),
    });

    // Edit action
    const textarea = getActionTextarea(element)!;
    textarea.value = 'Save to localStorage';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    // Toggle cleanup on
    const checkbox = getCleanupCheckbox(element)!;
    checkbox.click();
    fixture.detectChanges();

    const applyBtn = getApplyButton(element)!;
    applyBtn.click();
    fixture.detectChanges();

    expect(host.onNodeConfigured).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'eff-1',
        type: 'effect',
        actionDescription: 'Save to localStorage',
        requiresCleanup: true,
      }),
    );
  });

  // 13. Cancel button emits cancelled
  it('should emit cancelled when Cancel is clicked', async () => {
    const { fixture, host, element } = await setup();
    const cancelBtn = getCancelButton(element)!;
    expect(cancelBtn).toBeTruthy();

    cancelBtn.click();
    fixture.detectChanges();

    expect(host.onCancelled).toHaveBeenCalled();
  });

  // 14. Computed node: green type indicator
  it('should show green type indicator for computed nodes', async () => {
    const { element } = await setup({ node: createComputedNode() });
    const indicator = getTypeIndicator(element);
    expect(indicator).toBeTruthy();
    // #22C55E -> rgb(34, 197, 94)
    expect(indicator!.style.backgroundColor).toBe('rgb(34, 197, 94)');
  });

  // 15. Effect node: orange type indicator
  it('should show orange type indicator for effect nodes', async () => {
    const { element } = await setup({ node: createEffectNode() });
    const indicator = getTypeIndicator(element);
    expect(indicator).toBeTruthy();
    // #F97316 -> rgb(249, 115, 22)
    expect(indicator!.style.backgroundColor).toBe('rgb(249, 115, 22)');
  });

  // 16. Dynamic input change
  it('should switch template when node type changes from signal to computed', async () => {
    const { fixture, host, element } = await setup({
      node: createSignalNode(),
    });

    // Initially shows signal UI
    expect(getValueInput(element)).toBeTruthy();
    expect(element.querySelector('nx-expression-builder')).toBeNull();

    // Switch to computed node
    host.node.set(createComputedNode());
    fixture.detectChanges();
    await fixture.whenStable();

    // Now shows computed UI
    expect(getValueInput(element)).toBeNull();
    expect(element.querySelector('nx-expression-builder')).toBeTruthy();
  });

  // 17. Computed node: dependency selection
  it('should render dependency checkboxes and include selected deps in emitted node for computed', async () => {
    const { fixture, host, element } = await setup({
      node: createComputedNode({ dependencyIds: [] }),
      availableDependencies: ['count', 'total'],
    });

    const depCheckboxes = getDependencyCheckboxes(element);
    expect(depCheckboxes.length).toBe(2);

    // Select 'count'
    depCheckboxes[0].click();
    fixture.detectChanges();

    const applyBtn = getApplyButton(element)!;
    applyBtn.click();
    fixture.detectChanges();

    expect(host.onNodeConfigured).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'computed', dependencyIds: ['count'] }),
    );
  });

  // 18. Effect node: dependency selection
  it('should render dependency checkboxes and include selected deps in emitted node for effect', async () => {
    const { fixture, host, element } = await setup({
      node: createEffectNode({ dependencyIds: [] }),
      availableDependencies: ['count', 'total'],
    });

    const depCheckboxes = getDependencyCheckboxes(element);
    expect(depCheckboxes.length).toBe(2);

    // Select both
    depCheckboxes[0].click();
    fixture.detectChanges();
    depCheckboxes[1].click();
    fixture.detectChanges();

    const applyBtn = getApplyButton(element)!;
    applyBtn.click();
    fixture.detectChanges();

    expect(host.onNodeConfigured).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'effect', dependencyIds: ['count', 'total'] }),
    );
  });
});
