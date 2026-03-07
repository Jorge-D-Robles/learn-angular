import { Component } from '@angular/core';
import {
  LucideIconConfig,
  LucideIconProvider,
  LUCIDE_ICONS,
} from 'lucide-angular';
import { createComponent } from '../../../../testing/test-utils';
import { APP_ICONS } from '../../icons';
import { LockedContentComponent } from './locked-content';

@Component({
  template: `
    <nx-locked-content [isLocked]="locked" [unlockMessage]="message">
      <p class="inner-content">Secret content here</p>
    </nx-locked-content>
  `,
  imports: [LockedContentComponent],
})
class TestHost {
  locked = false;
  message = 'Complete Mission 5 to unlock';
}

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

describe('LockedContentComponent', () => {
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
    return element.querySelector('nx-locked-content') as HTMLElement;
  }

  it('should create the component', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
  });

  it('should render projected content when unlocked', async () => {
    const { element } = await setup({ locked: false });
    const inner = element.querySelector('.inner-content');
    expect(inner).toBeTruthy();
    expect(inner!.textContent).toContain('Secret content here');
    const overlay = element.querySelector('.locked-content__overlay');
    expect(overlay).toBeNull();
  });

  it('should render projected content when locked (dimmed)', async () => {
    const { element } = await setup({ locked: true });
    const inner = element.querySelector('.inner-content');
    expect(inner).toBeTruthy();
    expect(inner!.textContent).toContain('Secret content here');
  });

  it('should show overlay with lock icon when locked', async () => {
    const { element } = await setup({ locked: true });
    const overlay = element.querySelector('.locked-content__overlay');
    expect(overlay).toBeTruthy();
    const icon = overlay!.querySelector('lucide-icon');
    expect(icon).toBeTruthy();
    expect(icon!.getAttribute('name')).toBe('lock');
  });

  it('should display unlock message when locked', async () => {
    const { element } = await setup({
      locked: true,
      message: 'Complete Mission 5 to unlock',
    });
    const msg = element.querySelector('.locked-content__message');
    expect(msg).toBeTruthy();
    expect(msg!.textContent).toBe('Complete Mission 5 to unlock');
  });

  it('should not show overlay when unlocked', async () => {
    const { element } = await setup({ locked: false });
    const overlay = element.querySelector('.locked-content__overlay');
    expect(overlay).toBeNull();
  });

  it('should set aria-disabled="true" on host when locked', async () => {
    const { element } = await setup({ locked: true });
    const host = getHost(element);
    expect(host.getAttribute('aria-disabled')).toBe('true');
  });

  it('should not set aria-disabled when unlocked', async () => {
    const { element } = await setup({ locked: false });
    const host = getHost(element);
    expect(host.getAttribute('aria-disabled')).toBeNull();
  });

  it('should set aria-label to unlock message when locked', async () => {
    const { element } = await setup({
      locked: true,
      message: 'Complete Mission 5 to unlock',
    });
    const host = getHost(element);
    expect(host.getAttribute('aria-label')).toBe(
      'Complete Mission 5 to unlock',
    );
  });

  it('should not set aria-label when unlocked', async () => {
    const { element } = await setup({ locked: false });
    const host = getHost(element);
    expect(host.getAttribute('aria-label')).toBeNull();
  });

  it('should update from locked to unlocked dynamically', async () => {
    const { fixture, element } = await setup({ locked: true });
    const host = getHost(element);

    // Locked state
    expect(element.querySelector('.locked-content__overlay')).toBeTruthy();
    expect(host.getAttribute('aria-disabled')).toBe('true');
    expect(host.getAttribute('aria-label')).toBe(
      'Complete Mission 5 to unlock',
    );

    // Switch to unlocked
    fixture.componentInstance.locked = false;
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(element.querySelector('.locked-content__overlay')).toBeNull();
    expect(host.getAttribute('aria-disabled')).toBeNull();
    expect(host.getAttribute('aria-label')).toBeNull();
  });

  it('should apply pointer-events none on content wrapper when locked', async () => {
    const { element } = await setup({ locked: true });
    const contentWrapper = element.querySelector(
      '.locked-content__content--locked',
    );
    expect(contentWrapper).toBeTruthy();
  });

  it('should render empty message paragraph when locked with empty unlock message', async () => {
    const { element } = await setup({ locked: true, message: '' });
    const msg = element.querySelector('.locked-content__message');
    expect(msg).toBeTruthy();
    expect(msg!.textContent).toBe('');
  });

  it('should have role="group" on host', async () => {
    const { element } = await setup();
    const host = getHost(element);
    expect(host.getAttribute('role')).toBe('group');
  });
});
