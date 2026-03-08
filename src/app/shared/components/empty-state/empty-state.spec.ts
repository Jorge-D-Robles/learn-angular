import { Component } from '@angular/core';
import {
  LucideIconConfig,
  LucideIconProvider,
  LUCIDE_ICONS,
} from 'lucide-angular';
import { createComponent } from '../../../../testing/test-utils';
import { APP_ICONS } from '../../icons';
import { EmptyStateComponent } from './empty-state';

@Component({
  template: `
    <nx-empty-state
      [icon]="icon"
      [title]="title"
      [message]="message">
      <button type="button" class="test-action">Start Mission</button>
    </nx-empty-state>
  `,
  imports: [EmptyStateComponent],
})
class TestHost {
  icon = 'map';
  title = 'No Missions Yet';
  message: string | undefined = 'Complete the tutorial to unlock your first mission.';
}

@Component({
  template: `<nx-empty-state icon="gamepad-2" title="No Games Available" />`,
  imports: [EmptyStateComponent],
})
class TestHostMinimal {}

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

describe('EmptyStateComponent', () => {
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
    return element.querySelector('nx-empty-state') as HTMLElement;
  }

  it('should create the component', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
  });

  it('should render the icon with the specified name', async () => {
    const { element } = await setup();
    const iconHost = element.querySelector('.empty-state__icon');
    expect(iconHost).toBeTruthy();
    const svg = iconHost!.querySelector('svg.lucide-map');
    expect(svg).toBeTruthy();
  });

  it('should render the title text', async () => {
    const { element } = await setup();
    const title = element.querySelector('.empty-state__title');
    expect(title).toBeTruthy();
    expect(title!.textContent).toBe('No Missions Yet');
  });

  it('should render the message text when provided', async () => {
    const { element } = await setup();
    const message = element.querySelector('.empty-state__message');
    expect(message).toBeTruthy();
    expect(message!.textContent).toBe('Complete the tutorial to unlock your first mission.');
  });

  it('should not render message element when message is not provided', async () => {
    const { element } = await createComponent(TestHostMinimal, {
      providers: ICON_PROVIDERS,
    });
    const message = element.querySelector('.empty-state__message');
    expect(message).toBeNull();
  });

  it('should project action button content', async () => {
    const { element } = await setup();
    const actions = element.querySelector('.empty-state__actions');
    expect(actions).toBeTruthy();
    const button = actions!.querySelector('.test-action');
    expect(button).toBeTruthy();
    expect(button!.textContent).toBe('Start Mission');
  });

  it('should have empty actions container when no content is projected', async () => {
    const { element } = await createComponent(TestHostMinimal, {
      providers: ICON_PROVIDERS,
    });
    const actions = element.querySelector('.empty-state__actions');
    expect(actions).toBeTruthy();
    expect(actions!.children.length).toBe(0);
  });

  it('should have role="status" on host', async () => {
    const { element } = await setup();
    const host = getHost(element);
    expect(host.getAttribute('role')).toBe('status');
  });
});
