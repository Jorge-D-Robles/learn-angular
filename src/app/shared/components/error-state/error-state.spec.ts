import { Component } from '@angular/core';
import { vi } from 'vitest';
import {
  LucideIconConfig,
  LucideIconProvider,
  LUCIDE_ICONS,
} from 'lucide-angular';
import { createComponent } from '../../../../testing/test-utils';
import { APP_ICONS } from '../../icons';
import { ErrorStateComponent } from './error-state';

@Component({
  template: `
    <nx-error-state
      [title]="title"
      [message]="message"
      [retryable]="retryable"
      (retry)="onRetry()" />
  `,
  imports: [ErrorStateComponent],
})
class TestHost {
  title = 'Load Failed';
  message: string | undefined = 'Could not load level data.';
  retryable = true;
  onRetry = vi.fn();
}

@Component({
  template: `<nx-error-state />`,
  imports: [ErrorStateComponent],
})
class TestHostDefaults {}

const ICON_PROVIDERS = [
  {
    provide: LUCIDE_ICONS,
    multi: true,
    useValue: new LucideIconProvider(APP_ICONS),
  },
  {
    provide: LucideIconConfig,
    useValue: Object.assign(new LucideIconConfig(), {
      size: 24,
      color: 'currentColor',
    }),
  },
];

describe('ErrorStateComponent', () => {
  async function setup(overrides: Partial<TestHost> = {}) {
    const { fixture, component, element } = await createComponent(TestHost, {
      providers: ICON_PROVIDERS,
      detectChanges: false,
    });
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, component, element };
  }

  function getHost(element: HTMLElement): HTMLElement {
    return element.querySelector('nx-error-state') as HTMLElement;
  }

  it('should create the component', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
  });

  it('should render title text', async () => {
    const { element } = await setup();
    const title = element.querySelector('.error-state__title');
    expect(title).toBeTruthy();
    expect(title!.textContent).toBe('Load Failed');
  });

  it('should render default title when none provided', async () => {
    const { element } = await createComponent(TestHostDefaults, {
      providers: ICON_PROVIDERS,
    });
    const title = element.querySelector('.error-state__title');
    expect(title).toBeTruthy();
    expect(title!.textContent).toBe('Something went wrong');
  });

  it('should render message text', async () => {
    const { element } = await setup();
    const message = element.querySelector('.error-state__message');
    expect(message).toBeTruthy();
    expect(message!.textContent).toBe('Could not load level data.');
  });

  it('should not render message element when message is not provided', async () => {
    const { element } = await createComponent(TestHostDefaults, {
      providers: ICON_PROVIDERS,
    });
    const message = element.querySelector('.error-state__message');
    expect(message).toBeNull();
  });

  it('should render retry button when retryable is true', async () => {
    const { element } = await setup({ retryable: true });
    const btn = element.querySelector('.error-state__retry-btn');
    expect(btn).toBeTruthy();
  });

  it('should emit retry event when retry button is clicked', async () => {
    const { fixture, element } = await setup();
    const btn = element.querySelector(
      '.error-state__retry-btn',
    ) as HTMLButtonElement;
    expect(btn).toBeTruthy();
    btn.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.onRetry).toHaveBeenCalled();
  });

  it('should hide retry button when retryable is false', async () => {
    const { element } = await setup({ retryable: false });
    const btn = element.querySelector('.error-state__retry-btn');
    expect(btn).toBeNull();
  });

  it('should have role="alert" on host', async () => {
    const { element } = await setup();
    const host = getHost(element);
    expect(host.getAttribute('role')).toBe('alert');
  });

  it('should have aria-live="assertive" on host', async () => {
    const { element } = await setup();
    const host = getHost(element);
    expect(host.getAttribute('aria-live')).toBe('assertive');
  });

  it('should render the error icon', async () => {
    const { element } = await setup();
    const icon = element.querySelector('lucide-icon[name="circle-alert"]');
    expect(icon).toBeTruthy();
  });
});
