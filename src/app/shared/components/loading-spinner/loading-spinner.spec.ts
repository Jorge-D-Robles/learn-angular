import { Component } from '@angular/core';
import { createComponent } from '../../../../testing/test-utils';
import { LoadingSpinnerComponent } from './loading-spinner';

@Component({
  template: `<nx-loading-spinner [size]="size" [message]="message" />`,
  imports: [LoadingSpinnerComponent],
})
class TestHost {
  size: 'sm' | 'md' | 'lg' = 'md';
  message: string | undefined = undefined;
}

describe('LoadingSpinnerComponent', () => {
  async function setup(overrides: Partial<TestHost> = {}) {
    const { fixture, component, element } = await createComponent(TestHost, {
      detectChanges: false,
    });
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, component, element };
  }

  function getHost(element: HTMLElement): HTMLElement {
    return element.querySelector('nx-loading-spinner') as HTMLElement;
  }

  it('should create the component', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
  });

  it('should have role="status" on host', async () => {
    const { element } = await setup();
    const host = getHost(element);
    expect(host.getAttribute('role')).toBe('status');
  });

  it('should have aria-live="polite" on host', async () => {
    const { element } = await setup();
    const host = getHost(element);
    expect(host.getAttribute('aria-live')).toBe('polite');
  });

  it('should have aria-label "Loading" when no message provided', async () => {
    const { element } = await setup();
    const host = getHost(element);
    expect(host.getAttribute('aria-label')).toBe('Loading');
  });

  it('should set aria-label to custom message when provided', async () => {
    const { element } = await setup({ message: 'Loading level data...' });
    const host = getHost(element);
    expect(host.getAttribute('aria-label')).toBe('Loading level data...');
  });

  it('should render the spinner ring element', async () => {
    const { element } = await setup();
    const host = getHost(element);
    const ring = host.querySelector('.loading-spinner__ring');
    expect(ring).toBeTruthy();
  });

  it('should not render message element when message is empty', async () => {
    const { element } = await setup();
    const host = getHost(element);
    const msg = host.querySelector('.loading-spinner__message');
    expect(msg).toBeNull();
  });

  it('should render message text when message is provided', async () => {
    const { element } = await setup({ message: 'Loading level data...' });
    const host = getHost(element);
    const msg = host.querySelector('.loading-spinner__message');
    expect(msg).toBeTruthy();
    expect(msg!.textContent).toBe('Loading level data...');
  });

  it('should apply loading-spinner--sm class for size sm', async () => {
    const { element } = await setup({ size: 'sm' });
    const host = getHost(element);
    expect(host.classList.contains('loading-spinner--sm')).toBe(true);
  });

  it('should apply loading-spinner--md class for size md (default)', async () => {
    const { element } = await setup();
    const host = getHost(element);
    expect(host.classList.contains('loading-spinner--md')).toBe(true);
  });

  it('should apply loading-spinner--lg class for size lg', async () => {
    const { element } = await setup({ size: 'lg' });
    const host = getHost(element);
    expect(host.classList.contains('loading-spinner--lg')).toBe(true);
  });

  it('should update when inputs change dynamically', async () => {
    const { fixture, element } = await setup({ size: 'sm' });
    const host = getHost(element);

    // Initial state: sm, no message
    expect(host.classList.contains('loading-spinner--sm')).toBe(true);
    expect(host.querySelector('.loading-spinner__message')).toBeNull();

    // Update to lg with message
    fixture.componentInstance.size = 'lg';
    fixture.componentInstance.message = 'Loading...';
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(host.classList.contains('loading-spinner--lg')).toBe(true);
    expect(host.classList.contains('loading-spinner--sm')).toBe(false);
    const msg = host.querySelector('.loading-spinner__message');
    expect(msg).toBeTruthy();
    expect(msg!.textContent).toBe('Loading...');
    expect(host.getAttribute('aria-label')).toBe('Loading...');
  });
});
