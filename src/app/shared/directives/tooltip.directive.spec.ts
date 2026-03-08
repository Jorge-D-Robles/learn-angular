import { Component } from '@angular/core';
import { createComponent } from '../../../testing/test-utils';
import { TooltipDirective, type TooltipPosition } from './tooltip.directive';
import { vi } from 'vitest';

@Component({
  template: `<button [nxTooltip]="tooltipText" [nxTooltipPosition]="position">Hover me</button>`,
  imports: [TooltipDirective],
})
class TestHost {
  tooltipText = 'Hello tooltip';
  position: TooltipPosition = 'top';
}

describe('TooltipDirective', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    // Clean up any lingering tooltips
    document.body
      .querySelectorAll('.nx-tooltip')
      .forEach((el) => el.remove());
  });

  async function setup(overrides: Partial<TestHost> = {}) {
    const result = await createComponent(TestHost, {
      detectChanges: false,
    });
    Object.assign(result.component, overrides);
    result.fixture.detectChanges();
    await result.fixture.whenStable();
    const hostEl = result.element.querySelector('button') as HTMLElement;
    return { ...result, hostEl };
  }

  function getTooltip(): HTMLElement | null {
    return document.body.querySelector('.nx-tooltip');
  }

  it('should not show tooltip initially', async () => {
    await setup();
    expect(getTooltip()).toBeNull();
  });

  it('should show tooltip after mouseenter + 200ms delay', async () => {
    const { hostEl } = await setup();

    hostEl.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    expect(getTooltip()).toBeNull();

    vi.advanceTimersByTime(200);
    const tooltip = getTooltip();
    expect(tooltip).not.toBeNull();
    expect(tooltip!.textContent).toBe('Hello tooltip');
  });

  it('should hide tooltip on mouseleave', async () => {
    const { hostEl } = await setup();

    hostEl.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    vi.advanceTimersByTime(200);
    expect(getTooltip()).not.toBeNull();

    hostEl.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    expect(getTooltip()).toBeNull();
  });

  it('should cancel show if mouseleave before delay completes', async () => {
    const { hostEl } = await setup();

    hostEl.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    hostEl.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    vi.advanceTimersByTime(200);

    expect(getTooltip()).toBeNull();
  });

  it('should show tooltip on focus (keyboard accessibility)', async () => {
    const { hostEl } = await setup();

    hostEl.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
    vi.advanceTimersByTime(200);

    expect(getTooltip()).not.toBeNull();
  });

  it('should hide tooltip on blur (keyboard accessibility)', async () => {
    const { hostEl } = await setup();

    hostEl.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
    vi.advanceTimersByTime(200);
    expect(getTooltip()).not.toBeNull();

    hostEl.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
    expect(getTooltip()).toBeNull();
  });

  it('should hide tooltip on Escape key', async () => {
    const { hostEl } = await setup();

    hostEl.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
    vi.advanceTimersByTime(200);
    expect(getTooltip()).not.toBeNull();

    hostEl.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    expect(getTooltip()).toBeNull();
  });

  it('should apply correct position class -- top (default)', async () => {
    const { hostEl } = await setup();

    hostEl.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    vi.advanceTimersByTime(200);

    const tooltip = getTooltip()!;
    expect(tooltip.classList.contains('nx-tooltip--top')).toBe(true);
  });

  it('should apply correct position class -- bottom', async () => {
    const { hostEl } = await setup({ position: 'bottom' });

    hostEl.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    vi.advanceTimersByTime(200);

    const tooltip = getTooltip()!;
    expect(tooltip.classList.contains('nx-tooltip--bottom')).toBe(true);
  });

  it('should apply correct position class -- left', async () => {
    const { hostEl } = await setup({ position: 'left' });

    hostEl.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    vi.advanceTimersByTime(200);

    const tooltip = getTooltip()!;
    expect(tooltip.classList.contains('nx-tooltip--left')).toBe(true);
  });

  it('should apply correct position class -- right', async () => {
    const { hostEl } = await setup({ position: 'right' });

    hostEl.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    vi.advanceTimersByTime(200);

    const tooltip = getTooltip()!;
    expect(tooltip.classList.contains('nx-tooltip--right')).toBe(true);
  });

  it('should set role="tooltip" on tooltip element', async () => {
    const { hostEl } = await setup();

    hostEl.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    vi.advanceTimersByTime(200);

    expect(getTooltip()!.getAttribute('role')).toBe('tooltip');
  });

  it('should set aria-describedby on host element', async () => {
    const { hostEl } = await setup();

    hostEl.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    vi.advanceTimersByTime(200);

    const tooltip = getTooltip()!;
    expect(hostEl.getAttribute('aria-describedby')).toBe(
      tooltip.getAttribute('id'),
    );
  });

  it('should remove aria-describedby on hide', async () => {
    const { hostEl } = await setup();

    hostEl.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    vi.advanceTimersByTime(200);
    expect(hostEl.getAttribute('aria-describedby')).not.toBeNull();

    hostEl.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    expect(hostEl.getAttribute('aria-describedby')).toBeNull();
  });

  it('should clean up tooltip on directive destroy', async () => {
    const { fixture, hostEl } = await setup();

    hostEl.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    vi.advanceTimersByTime(200);
    expect(getTooltip()).not.toBeNull();

    fixture.destroy();
    expect(getTooltip()).toBeNull();
  });

  it('should not create tooltip when nxTooltip is empty string', async () => {
    const { hostEl } = await setup({ tooltipText: '' });

    hostEl.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    vi.advanceTimersByTime(200);

    expect(getTooltip()).toBeNull();
  });
});
