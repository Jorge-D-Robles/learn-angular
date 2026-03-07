import { Component } from '@angular/core';
import {
  LucideAngularModule,
  LucideIconConfig,
  LucideIconProvider,
  LUCIDE_ICONS,
} from 'lucide-angular';
import { createComponent } from '../../../testing/test-utils';
import { APP_ICONS } from './index';

@Component({
  template: `<lucide-icon name="house" />`,
  imports: [LucideAngularModule],
})
class BasicTestHost {}

@Component({
  template: `<lucide-icon name="star" />`,
  imports: [LucideAngularModule],
})
class StarTestHost {}

@Component({
  template: `<lucide-icon name="house" [size]="16" />`,
  imports: [LucideAngularModule],
})
class CustomSizeTestHost {}

@Component({
  selector: 'app-default-size-test',
  template: `<lucide-icon name="house" />`,
  imports: [LucideAngularModule],
})
class DefaultSizeTestHost {}

@Component({
  template: `<span style="color: red"><lucide-icon name="house" /></span>`,
  imports: [LucideAngularModule],
})
class ColorInheritTestHost {}

@Component({
  template: `@for (name of iconNames; track name) {
    <lucide-icon [name]="name" />
  }`,
  imports: [LucideAngularModule],
})
class AllIconsTestHost {
  iconNames = [
    'house',
    'lock',
    'map',
    'gamepad-2',
    'user',
    'settings',
    'star',
    'heart',
    'pause',
    'play',
    'chevron-right',
    'chevron-down',
    'chevron-left',
    'chevron-up',
    'circle-alert',
    'refresh-cw',
    'x',
  ];
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

describe('Icon Configuration', () => {
  it('renders without errors', async () => {
    const { component, element } = await createComponent(BasicTestHost, {
      providers: ICON_PROVIDERS,
    });
    expect(component).toBeTruthy();
    const svg = element.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('renders correct icon by name', async () => {
    const { element } = await createComponent(StarTestHost, {
      providers: ICON_PROVIDERS,
    });
    const svg = element.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('applies custom size', async () => {
    const { element } = await createComponent(CustomSizeTestHost, {
      providers: ICON_PROVIDERS,
    });
    const svg = element.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg!.getAttribute('width')).toBe('16');
    expect(svg!.getAttribute('height')).toBe('16');
  });

  it('defaults to size 24', async () => {
    const { element } = await createComponent(DefaultSizeTestHost, {
      providers: ICON_PROVIDERS,
    });
    const svg = element.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg!.getAttribute('width')).toBe('24');
    expect(svg!.getAttribute('height')).toBe('24');
  });

  it('inherits color from parent via currentColor', async () => {
    const { element } = await createComponent(ColorInheritTestHost, {
      providers: ICON_PROVIDERS,
    });
    const svg = element.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg!.getAttribute('stroke')).toBe('currentColor');
  });

  it('all registered icons are available', async () => {
    const { element } = await createComponent(AllIconsTestHost, {
      providers: ICON_PROVIDERS,
    });
    const svgs = element.querySelectorAll('svg');
    expect(svgs.length).toBe(17);
  });
});
