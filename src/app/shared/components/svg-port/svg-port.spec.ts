import { Component } from '@angular/core';
import { vi } from 'vitest';
import { createComponent } from '../../../../testing/test-utils';
import { SvgPortComponent } from './svg-port';

@Component({
  template: `
    <svg width="200" height="200">
      <g nx-svg-port
        [portId]="portId"
        [x]="x" [y]="y"
        [color]="color"
        [label]="label"
        [type]="type"
        [isActive]="isActive"
        [isConnected]="isConnected"
        (activated)="onActivated($event)" />
    </svg>
  `,
  imports: [SvgPortComponent],
})
class TestHost {
  portId = 'port-1';
  x = 50;
  y = 75;
  color = '#3B82F6';
  label = '';
  type: 'source' | 'target' = 'source';
  isActive = false;
  isConnected = false;
  onActivated = vi.fn();
}

function getHost(el: HTMLElement): SVGGElement {
  return el.querySelector('g[nx-svg-port]') as SVGGElement;
}

describe('SvgPortComponent', () => {
  async function setup(overrides: Partial<TestHost> = {}) {
    const { fixture, component, element } = await createComponent(TestHost, {
      detectChanges: false,
    });
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, component, element };
  }

  // --- Rendering (5 tests) ---

  it('creates the component', async () => {
    const { element } = await setup();
    expect(getHost(element)).toBeTruthy();
  });

  it('positions via transform attribute', async () => {
    const { element } = await setup();
    expect(getHost(element).getAttribute('transform')).toBe(
      'translate(50, 75)',
    );
  });

  it('renders main circle with correct color', async () => {
    const { element } = await setup({ color: '#FF0000' });
    const circle = getHost(element).querySelector(
      '.svg-port__circle',
    ) as SVGCircleElement;
    expect(circle).toBeTruthy();
    expect(circle.getAttribute('fill')).toBe('#FF0000');
    expect(circle.getAttribute('stroke')).toBe('#FF0000');
  });

  it('renders label text when provided', async () => {
    const { element } = await setup({ label: 'myProp' });
    const text = getHost(element).querySelector(
      'text.svg-port__label',
    ) as SVGTextElement;
    expect(text).toBeTruthy();
    expect(text.textContent?.trim()).toBe('myProp');
  });

  it('does not render label when empty', async () => {
    const { element } = await setup({ label: '' });
    const text = getHost(element).querySelector('text.svg-port__label');
    expect(text).toBeNull();
  });

  // --- Active state (2 tests) ---

  it('shows pulsing ring when isActive is true', async () => {
    const { element } = await setup({ isActive: true });
    const ring = getHost(element).querySelector('.svg-port__active-ring');
    expect(ring).toBeTruthy();
  });

  it('hides pulsing ring when isActive is false', async () => {
    const { element } = await setup({ isActive: false });
    const ring = getHost(element).querySelector('.svg-port__active-ring');
    expect(ring).toBeNull();
  });

  // --- Connected state (4 tests) ---

  it('shows dot indicator when connected', async () => {
    const { element } = await setup({ isConnected: true });
    const dot = getHost(element).querySelector('.svg-port__connected-dot');
    expect(dot).toBeTruthy();
  });

  it('uses higher fill-opacity when connected', async () => {
    const { element } = await setup({ isConnected: true });
    const circle = getHost(element).querySelector(
      '.svg-port__circle',
    ) as SVGCircleElement;
    expect(circle.getAttribute('fill-opacity')).toBe('0.8');
  });

  it('uses lower fill-opacity when not connected', async () => {
    const { element } = await setup({ isConnected: false });
    const circle = getHost(element).querySelector(
      '.svg-port__circle',
    ) as SVGCircleElement;
    expect(circle.getAttribute('fill-opacity')).toBe('0.3');
  });

  it('hides dot indicator when not connected', async () => {
    const { element } = await setup({ isConnected: false });
    const dot = getHost(element).querySelector('.svg-port__connected-dot');
    expect(dot).toBeNull();
  });

  // --- Keyboard and click (3 tests) ---

  it('emits activated on Enter keypress', async () => {
    const { element, component } = await setup();
    const host = getHost(element);
    host.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    );
    expect(component.onActivated).toHaveBeenCalledWith('port-1');
  });

  it('emits activated on Space keypress', async () => {
    const { element, component } = await setup();
    const host = getHost(element);
    host.dispatchEvent(
      new KeyboardEvent('keydown', { key: ' ', bubbles: true }),
    );
    expect(component.onActivated).toHaveBeenCalledWith('port-1');
  });

  it('emits activated on click', async () => {
    const { element, component } = await setup();
    const host = getHost(element);
    host.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(component.onActivated).toHaveBeenCalledWith('port-1');
  });

  // --- Accessibility (5 tests) ---

  it('has tabindex 0', async () => {
    const { element } = await setup();
    expect(getHost(element).getAttribute('tabindex')).toBe('0');
  });

  it('has role button', async () => {
    const { element } = await setup();
    expect(getHost(element).getAttribute('role')).toBe('button');
  });

  it('sets aria-label with type and label', async () => {
    const { element } = await setup({ type: 'source', label: 'myProp' });
    expect(getHost(element).getAttribute('aria-label')).toBe(
      'source port: myProp',
    );
  });

  it('includes connected state in aria-label', async () => {
    const { element } = await setup({ isConnected: true });
    const ariaLabel = getHost(element).getAttribute('aria-label');
    expect(ariaLabel).toContain(', connected');
  });

  it('falls back to portId when no label', async () => {
    const { element } = await setup({ label: '' });
    expect(getHost(element).getAttribute('aria-label')).toBe(
      'source port: port-1',
    );
  });

  // --- Dynamic update (1 test) ---

  it('updates DOM when isActive changes dynamically', async () => {
    const { fixture, element } = await setup({ isActive: false });
    const host = getHost(element);

    // Initially no active ring
    expect(host.querySelector('.svg-port__active-ring')).toBeNull();

    // Update to active
    fixture.componentInstance.isActive = true;
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(host.querySelector('.svg-port__active-ring')).toBeTruthy();
  });
});
