import { Component } from '@angular/core';
import {
  LucideIconConfig,
  LucideIconProvider,
  LUCIDE_ICONS,
} from 'lucide-angular';
import { createComponent } from '../../../../testing/test-utils';
import { APP_ICONS } from '../../icons';
import type { Achievement } from '../../../core/progression/achievement.service';
import { TooltipDirective } from '../../directives';
import { AchievementBadgeComponent } from './achievement-badge';

function makeAchievement(
  overrides: Partial<Achievement> = {},
): Achievement {
  return {
    id: 'first-steps',
    title: 'First Steps',
    description: 'Complete your first mission',
    type: 'discovery',
    isHidden: false,
    isEarned: true,
    earnedDate: '2026-03-20T12:00:00Z',
    ...overrides,
  };
}

@Component({
  template: `<nx-achievement-badge [achievement]="achievement" [size]="size" />`,
  imports: [AchievementBadgeComponent],
})
class TestHost {
  achievement: Achievement = makeAchievement();
  size: 'sm' | 'md' | 'lg' = 'md';
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

describe('AchievementBadgeComponent', () => {
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
    return element.querySelector('nx-achievement-badge') as HTMLElement;
  }

  // --- Rendering: Earned State ---

  it('should create the component', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
  });

  it('should display the achievement title when earned', async () => {
    const { element } = await setup();
    const host = getHost(element);
    expect(host.textContent).toContain('First Steps');
  });

  it('should display the earned date formatted as a locale date string', async () => {
    const { element } = await setup();
    const host = getHost(element);
    const expectedDate = new Date('2026-03-20T12:00:00Z').toLocaleDateString();
    expect(host.textContent).toContain(expectedDate);
  });

  it('should render a trophy icon when earned', async () => {
    const { element } = await setup();
    const host = getHost(element);
    const svg = host.querySelector('svg.lucide-trophy');
    expect(svg).toBeTruthy();
  });

  it('should apply achievement-badge--earned CSS class when earned', async () => {
    const { element } = await setup();
    const host = getHost(element);
    expect(host.classList.contains('achievement-badge--earned')).toBe(true);
  });

  // --- Rendering: Hidden Unearned State ---

  it('should display "???" as the title when hidden and unearned', async () => {
    const { element } = await setup({
      achievement: makeAchievement({ isHidden: true, isEarned: false, earnedDate: null }),
    });
    const host = getHost(element);
    expect(host.textContent).toContain('???');
  });

  it('should render an eye-off icon when hidden and unearned', async () => {
    const { element } = await setup({
      achievement: makeAchievement({ isHidden: true, isEarned: false, earnedDate: null }),
    });
    const host = getHost(element);
    const svg = host.querySelector('svg.lucide-eye-off');
    expect(svg).toBeTruthy();
  });

  it('should apply achievement-badge--hidden CSS class when hidden and unearned', async () => {
    const { element } = await setup({
      achievement: makeAchievement({ isHidden: true, isEarned: false, earnedDate: null }),
    });
    const host = getHost(element);
    expect(host.classList.contains('achievement-badge--hidden')).toBe(true);
  });

  it('should NOT display the achievement description in visible text when hidden and unearned', async () => {
    const { element } = await setup({
      achievement: makeAchievement({
        isHidden: true,
        isEarned: false,
        earnedDate: null,
        description: 'Complete your first mission',
      }),
    });
    const host = getHost(element);
    expect(host.textContent).not.toContain('Complete your first mission');
  });

  // --- Rendering: Non-hidden Unearned (Locked) State ---

  it('should display the achievement title when locked', async () => {
    const { element } = await setup({
      achievement: makeAchievement({ isHidden: false, isEarned: false, earnedDate: null }),
    });
    const host = getHost(element);
    expect(host.textContent).toContain('First Steps');
  });

  it('should render a lock icon when locked', async () => {
    const { element } = await setup({
      achievement: makeAchievement({ isHidden: false, isEarned: false, earnedDate: null }),
    });
    const host = getHost(element);
    const svg = host.querySelector('svg.lucide-lock');
    expect(svg).toBeTruthy();
  });

  it('should apply achievement-badge--locked CSS class when locked', async () => {
    const { element } = await setup({
      achievement: makeAchievement({ isHidden: false, isEarned: false, earnedDate: null }),
    });
    const host = getHost(element);
    expect(host.classList.contains('achievement-badge--locked')).toBe(true);
  });

  // --- Type-specific Styling ---

  it('should apply achievement-badge--discovery class for discovery type', async () => {
    const { element } = await setup({
      achievement: makeAchievement({ type: 'discovery' }),
    });
    const host = getHost(element);
    expect(host.classList.contains('achievement-badge--discovery')).toBe(true);
  });

  it('should apply achievement-badge--mastery class for mastery type', async () => {
    const { element } = await setup({
      achievement: makeAchievement({ type: 'mastery' }),
    });
    const host = getHost(element);
    expect(host.classList.contains('achievement-badge--mastery')).toBe(true);
  });

  it('should apply achievement-badge--commitment class for commitment type', async () => {
    const { element } = await setup({
      achievement: makeAchievement({ type: 'commitment' }),
    });
    const host = getHost(element);
    expect(host.classList.contains('achievement-badge--commitment')).toBe(true);
  });

  // --- Tooltip ---

  it('should show description with earned date in nxTooltip for earned achievements', async () => {
    const { fixture } = await setup();
    const badge = fixture.debugElement.query(
      (de) => de.nativeElement.classList.contains('achievement-badge__inner'),
    );
    const directive = badge.injector.get(TooltipDirective);
    const expectedDate = new Date('2026-03-20T12:00:00Z').toLocaleDateString();
    expect(directive.nxTooltip()).toBe(
      `Complete your first mission \u2014 Earned ${expectedDate}`,
    );
  });

  it('should show description in nxTooltip for non-hidden unearned achievements', async () => {
    const { fixture } = await setup({
      achievement: makeAchievement({ isEarned: false, earnedDate: null }),
    });
    const badge = fixture.debugElement.query(
      (de) => de.nativeElement.classList.contains('achievement-badge__inner'),
    );
    const directive = badge.injector.get(TooltipDirective);
    expect(directive.nxTooltip()).toBe('Complete your first mission');
  });

  it('should show "Hidden achievement" in nxTooltip for hidden unearned achievements', async () => {
    const { fixture } = await setup({
      achievement: makeAchievement({ isHidden: true, isEarned: false, earnedDate: null }),
    });
    const badge = fixture.debugElement.query(
      (de) => de.nativeElement.classList.contains('achievement-badge__inner'),
    );
    const directive = badge.injector.get(TooltipDirective);
    expect(directive.nxTooltip()).toBe('Hidden achievement');
  });

  // --- Size Variants ---

  it('should apply achievement-badge--md class by default', async () => {
    const { element } = await setup();
    const host = getHost(element);
    expect(host.classList.contains('achievement-badge--md')).toBe(true);
  });

  it('should apply achievement-badge--sm class for size sm', async () => {
    const { element } = await setup({ size: 'sm' });
    const host = getHost(element);
    expect(host.classList.contains('achievement-badge--sm')).toBe(true);
  });

  it('should apply achievement-badge--lg class for size lg', async () => {
    const { element } = await setup({ size: 'lg' });
    const host = getHost(element);
    expect(host.classList.contains('achievement-badge--lg')).toBe(true);
  });

  // --- Accessibility ---

  it('should have role="img" on host element', async () => {
    const { element } = await setup();
    const host = getHost(element);
    expect(host.getAttribute('role')).toBe('img');
  });

  it('should have aria-label describing the earned achievement', async () => {
    const { element } = await setup();
    const host = getHost(element);
    expect(host.getAttribute('aria-label')).toBe(
      'First Steps achievement, earned',
    );
  });

  it('should have aria-label for hidden unearned', async () => {
    const { element } = await setup({
      achievement: makeAchievement({ isHidden: true, isEarned: false, earnedDate: null }),
    });
    const host = getHost(element);
    expect(host.getAttribute('aria-label')).toBe(
      'Hidden achievement, not yet earned',
    );
  });

  it('should have aria-label for locked unearned', async () => {
    const { element } = await setup({
      achievement: makeAchievement({ isEarned: false, earnedDate: null }),
    });
    const host = getHost(element);
    expect(host.getAttribute('aria-label')).toBe(
      'First Steps achievement, not yet earned',
    );
  });

  // --- Dynamic Updates ---

  it('should update rendering when achievement input changes from locked to earned', async () => {
    const { fixture, element } = await setup({
      achievement: makeAchievement({ isEarned: false, earnedDate: null }),
    });
    const host = getHost(element);

    // Initial state: locked
    expect(host.classList.contains('achievement-badge--locked')).toBe(true);
    expect(host.classList.contains('achievement-badge--earned')).toBe(false);

    // Update to earned
    fixture.componentInstance.achievement = makeAchievement({
      isEarned: true,
      earnedDate: '2026-03-20T12:00:00Z',
    });
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(host.classList.contains('achievement-badge--earned')).toBe(true);
    expect(host.classList.contains('achievement-badge--locked')).toBe(false);
    expect(host.textContent).toContain('First Steps');
  });
});
