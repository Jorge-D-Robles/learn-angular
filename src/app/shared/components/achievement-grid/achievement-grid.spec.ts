import { signal } from '@angular/core';
import {
  LucideIconConfig,
  LucideIconProvider,
  LUCIDE_ICONS,
} from 'lucide-angular';
import { createComponent, getMockProvider } from '../../../../testing/test-utils';
import { APP_ICONS } from '../../icons';
import type { Achievement } from '../../../core/progression/achievement.service';
import { AchievementService } from '../../../core/progression/achievement.service';
import { AchievementGridComponent } from './achievement-grid';

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

function makeAchievement(overrides: Partial<Achievement> = {}): Achievement {
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

const TEST_ACHIEVEMENTS: readonly Achievement[] = [
  makeAchievement({ id: 'a1', title: 'A1', type: 'discovery', isEarned: true }),
  makeAchievement({ id: 'a2', title: 'A2', type: 'mastery', isEarned: false, earnedDate: null }),
  makeAchievement({ id: 'a3', title: 'A3', type: 'commitment', isEarned: true }),
  makeAchievement({ id: 'a4', title: 'A4', type: 'discovery', isEarned: false, earnedDate: null }),
  makeAchievement({ id: 'a5', title: 'A5', type: 'mastery', isEarned: true }),
  makeAchievement({ id: 'a6', title: 'A6', type: 'commitment', isEarned: false, earnedDate: null }),
];

describe('AchievementGridComponent', () => {
  function createMockService(
    achievements: readonly Achievement[] = TEST_ACHIEVEMENTS,
    earnedCount = 3,
  ) {
    return getMockProvider(AchievementService, {
      achievements: signal<readonly Achievement[]>(achievements),
      earnedCount: signal(earnedCount),
    });
  }

  async function setup(
    achievements: readonly Achievement[] = TEST_ACHIEVEMENTS,
    earnedCount = 3,
  ) {
    const { fixture, component, element } = await createComponent(
      AchievementGridComponent,
      {
        providers: [
          ...ICON_PROVIDERS,
          createMockService(achievements, earnedCount),
        ],
      },
    );
    return { fixture, component, element };
  }

  function getBadges(element: HTMLElement): NodeListOf<Element> {
    return element.querySelectorAll('nx-achievement-badge');
  }

  function getFilterButtons(element: HTMLElement): HTMLButtonElement[] {
    return Array.from(
      element.querySelectorAll('.achievement-grid__filter-btn'),
    ) as HTMLButtonElement[];
  }

  function getProgressText(element: HTMLElement): string {
    const el = element.querySelector('.achievement-grid__progress');
    return el?.textContent?.trim() ?? '';
  }

  // 1. Creation
  it('should create the component', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
  });

  // 2. Grid rendering -- all badges
  it('should render one nx-achievement-badge per achievement', async () => {
    const { element } = await setup();
    const badges = getBadges(element);
    expect(badges.length).toBe(TEST_ACHIEVEMENTS.length);
  });

  // 3. Progress summary
  it('should display "X of Y achievements earned" text', async () => {
    const { element } = await setup(TEST_ACHIEVEMENTS, 3);
    expect(getProgressText(element)).toBe(
      `3 of ${TEST_ACHIEVEMENTS.length} achievements earned`,
    );
  });

  // 4. Progress summary -- zero earned
  it('should display "0 of Y achievements earned" when none earned', async () => {
    const allUnearned = TEST_ACHIEVEMENTS.map((a) => ({
      ...a,
      isEarned: false,
      earnedDate: null,
    }));
    const { element } = await setup(allUnearned, 0);
    expect(getProgressText(element)).toBe(
      `0 of ${allUnearned.length} achievements earned`,
    );
  });

  // 5. Filter tabs present
  it('should render 4 filter buttons: All, Discovery, Mastery, Commitment', async () => {
    const { element } = await setup();
    const buttons = getFilterButtons(element);
    expect(buttons.length).toBe(4);
    expect(buttons[0].textContent?.trim()).toBe('All');
    expect(buttons[1].textContent?.trim()).toBe('Discovery');
    expect(buttons[2].textContent?.trim()).toBe('Mastery');
    expect(buttons[3].textContent?.trim()).toBe('Commitment');
  });

  // 6. Filter -- All (default)
  it('should show all achievements when "All" is active', async () => {
    const { element } = await setup();
    const badges = getBadges(element);
    expect(badges.length).toBe(TEST_ACHIEVEMENTS.length);
  });

  // 7. Filter -- Discovery
  it('should show only discovery-type achievements when Discovery tab is clicked', async () => {
    const { fixture, element } = await setup();
    const buttons = getFilterButtons(element);
    buttons[1].click();
    fixture.detectChanges();
    await fixture.whenStable();
    const badges = getBadges(element);
    expect(badges.length).toBe(2); // a1 and a4 are discovery
  });

  // 8. Filter -- Mastery
  it('should show only mastery-type achievements when Mastery tab is clicked', async () => {
    const { fixture, element } = await setup();
    const buttons = getFilterButtons(element);
    buttons[2].click();
    fixture.detectChanges();
    await fixture.whenStable();
    const badges = getBadges(element);
    expect(badges.length).toBe(2); // a2 and a5 are mastery
  });

  // 9. Filter -- Commitment
  it('should show only commitment-type achievements when Commitment tab is clicked', async () => {
    const { fixture, element } = await setup();
    const buttons = getFilterButtons(element);
    buttons[3].click();
    fixture.detectChanges();
    await fixture.whenStable();
    const badges = getBadges(element);
    expect(badges.length).toBe(2); // a3 and a6 are commitment
  });

  // 10. Filter tab active state
  it('should set aria-pressed="true" on active tab and "false" on others', async () => {
    const { fixture, element } = await setup();
    const buttons = getFilterButtons(element);

    // Default: All is active
    expect(buttons[0].getAttribute('aria-pressed')).toBe('true');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('false');
    expect(buttons[2].getAttribute('aria-pressed')).toBe('false');
    expect(buttons[3].getAttribute('aria-pressed')).toBe('false');

    // Click Discovery
    buttons[1].click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(buttons[0].getAttribute('aria-pressed')).toBe('false');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
    expect(buttons[2].getAttribute('aria-pressed')).toBe('false');
    expect(buttons[3].getAttribute('aria-pressed')).toBe('false');
  });

  // 11. Sort order -- earned first
  it('should display earned badges before unearned badges', async () => {
    const { element } = await setup();
    const badges = getBadges(element);
    const ids = Array.from(badges).map(
      (b) => b.getAttribute('data-achievement-id'),
    );

    // Earned: a1 (discovery), a3 (commitment), a5 (mastery) -- sorted by type alphabetically: a3, a1, a5
    // Unearned: a2 (mastery), a4 (discovery), a6 (commitment) -- sorted by type alphabetically: a6, a4, a2
    const earnedIds = ids.slice(0, 3);
    const unearnedIds = ids.slice(3);

    // All earned come first
    const earnedAchievements = TEST_ACHIEVEMENTS.filter((a) => a.isEarned);
    const unearnedAchievements = TEST_ACHIEVEMENTS.filter((a) => !a.isEarned);
    for (const id of earnedIds) {
      expect(earnedAchievements.some((a) => a.id === id)).toBe(true);
    }
    for (const id of unearnedIds) {
      expect(unearnedAchievements.some((a) => a.id === id)).toBe(true);
    }
  });

  // 12. Sort order -- type sub-sort within earned group
  it('should sort earned badges by type alphabetically', async () => {
    const { element } = await setup();
    const badges = getBadges(element);
    const ids = Array.from(badges).map(
      (b) => b.getAttribute('data-achievement-id'),
    );

    // Earned sorted by type: commitment (a3), discovery (a1), mastery (a5)
    expect(ids[0]).toBe('a3');
    expect(ids[1]).toBe('a1');
    expect(ids[2]).toBe('a5');
  });

  // 13. Sort order -- type sub-sort within unearned group
  it('should sort unearned badges by type alphabetically', async () => {
    const { element } = await setup();
    const badges = getBadges(element);
    const ids = Array.from(badges).map(
      (b) => b.getAttribute('data-achievement-id'),
    );

    // Unearned sorted by type: commitment (a6), discovery (a4), mastery (a2)
    expect(ids[3]).toBe('a6');
    expect(ids[4]).toBe('a4');
    expect(ids[5]).toBe('a2');
  });

  // 14. Empty state
  it('should display an empty state message when no achievements match the filter', async () => {
    // Only discovery achievements
    const discoveryOnly = [
      makeAchievement({ id: 'a1', type: 'discovery', isEarned: true }),
    ];
    const { fixture, element } = await setup(discoveryOnly, 1);

    // Click Mastery filter -- no mastery achievements exist
    const buttons = getFilterButtons(element);
    buttons[2].click();
    fixture.detectChanges();
    await fixture.whenStable();

    const emptyEl = element.querySelector('.achievement-grid__empty');
    expect(emptyEl).toBeTruthy();
    expect(emptyEl?.textContent?.trim()).toBeTruthy();
  });

  // 15. Accessibility -- host has aria-label
  it('should have aria-label on host element', async () => {
    const { element } = await setup();
    expect(element.getAttribute('aria-label')).toBe('Achievement badges');
  });

  // 16. Responsive -- host uses display block
  it('should render host as display block', async () => {
    const { element } = await setup();
    const style = getComputedStyle(element);
    expect(style.display).toBe('block');
  });
});
