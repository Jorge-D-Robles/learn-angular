import { Component } from '@angular/core';
import { vi } from 'vitest';
import {
  LucideIconConfig,
  LucideIconProvider,
  LUCIDE_ICONS,
} from 'lucide-angular';
import { createComponent } from '../../../../testing/test-utils';
import { APP_ICONS } from '../../icons';
import {
  DegradationAlertComponent,
  DegradingTopicItem,
} from './degradation-alert';

@Component({
  template: `
    <nx-degradation-alert
      [degradingTopics]="topics"
      [variant]="variant"
      (practiceRequested)="onPractice($event)" />
  `,
  imports: [DegradationAlertComponent],
})
class TestHost {
  topics: DegradingTopicItem[] = [];
  variant: 'compact' | 'full' = 'compact';
  onPractice = vi.fn();
}

const MOCK_TOPICS: DegradingTopicItem[] = [
  {
    topicId: 'module-assembly',
    topicName: 'Module Assembly',
    currentMastery: 3,
    effectiveMastery: 2,
    daysSinceLastPractice: 10.5,
  },
  {
    topicId: 'wire-protocol',
    topicName: 'Wire Protocol',
    currentMastery: 4,
    effectiveMastery: 3,
    daysSinceLastPractice: 12.3,
  },
];

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

describe('DegradationAlertComponent', () => {
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
    return element.querySelector('nx-degradation-alert') as HTMLElement;
  }

  it('should create the component', async () => {
    const { element } = await setup();
    expect(getHost(element)).toBeTruthy();
  });

  it('should hide host when degradingTopics is empty', async () => {
    const { element } = await setup({ topics: [] });
    const host = getHost(element);
    expect(host.style.display).toBe('none');
  });

  it('should show host when degradingTopics has items', async () => {
    const { element } = await setup({ topics: MOCK_TOPICS });
    const host = getHost(element);
    expect(host.style.display).not.toBe('none');
  });

  it('should render one item per degrading topic', async () => {
    const { element } = await setup({ topics: MOCK_TOPICS });
    const items = element.querySelectorAll('.degradation-alert__item');
    expect(items.length).toBe(2);
  });

  it('should display topic name', async () => {
    const { element } = await setup({ topics: MOCK_TOPICS });
    const names = element.querySelectorAll('.degradation-alert__topic-name');
    expect(names[0].textContent?.trim()).toBe('Module Assembly');
    expect(names[1].textContent?.trim()).toBe('Wire Protocol');
  });

  it('should display mastery difference', async () => {
    const { element } = await setup({ topics: MOCK_TOPICS });
    const diffs = element.querySelectorAll('.degradation-alert__mastery-diff');
    expect(diffs[0].textContent).toContain('3');
    expect(diffs[0].textContent).toContain('2');
    expect(diffs[1].textContent).toContain('4');
    expect(diffs[1].textContent).toContain('3');
  });

  it('should display days since last practice as integer', async () => {
    const { element } = await setup({ topics: MOCK_TOPICS });
    const days = element.querySelectorAll('.degradation-alert__days');
    expect(days[0].textContent?.trim()).toBe('10d ago');
    expect(days[1].textContent?.trim()).toBe('12d ago');
  });

  it('should emit practiceRequested with topicId when Practice Now is clicked', async () => {
    const { fixture, element } = await setup({ topics: MOCK_TOPICS });
    const btn = element.querySelector(
      '.degradation-alert__practice-btn',
    ) as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.onPractice).toHaveBeenCalledWith(
      'module-assembly',
    );
  });

  it('should apply compact class when variant is compact', async () => {
    const { element } = await setup({
      topics: MOCK_TOPICS,
      variant: 'compact',
    });
    const host = getHost(element);
    expect(host.classList.contains('degradation-alert--compact')).toBe(true);
  });

  it('should apply full class when variant is full', async () => {
    const { element } = await setup({ topics: MOCK_TOPICS, variant: 'full' });
    const host = getHost(element);
    expect(host.classList.contains('degradation-alert--full')).toBe(true);
  });

  it('should render header with warning icon and title', async () => {
    const { element } = await setup({ topics: MOCK_TOPICS });
    const header = element.querySelector('.degradation-alert__header');
    expect(header).toBeTruthy();
    const icon = header!.querySelector('lucide-icon[name="circle-alert"]');
    expect(icon).toBeTruthy();
    const title = header!.querySelector('.degradation-alert__title');
    expect(title?.textContent?.trim()).toBe('Mastery Fading');
  });
});
