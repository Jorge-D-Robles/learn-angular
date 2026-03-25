import { Component } from '@angular/core';
import { vi } from 'vitest';
import {
  LucideIconConfig,
  LucideIconProvider,
  LUCIDE_ICONS,
} from 'lucide-angular';
import { createComponent, getMockProvider } from '../../../../testing/test-utils';
import { APP_ICONS } from '../../icons';
import { LeaderboardComponent } from './leaderboard';
import type { MinigameId } from '../../../core/minigame/minigame.types';
import {
  LeaderboardService,
  type LeaderboardEntry,
  type LeaderboardMode,
} from '../../../core/progression/leaderboard.service';

@Component({
  template: `
    <nx-leaderboard
      [gameId]="gameId"
      [mode]="mode"
      [playerName]="playerName" />
  `,
  imports: [LeaderboardComponent],
})
class TestHost {
  gameId: MinigameId = 'module-assembly';
  mode: LeaderboardMode = 'story';
  playerName = 'Alice';
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

function makeEntry(overrides: Partial<LeaderboardEntry> = {}): LeaderboardEntry {
  return {
    playerName: 'Player',
    score: 100,
    time: 60,
    date: '2026-03-20T12:00:00Z',
    mode: 'story',
    ...overrides,
  };
}

const THREE_ENTRIES: LeaderboardEntry[] = [
  makeEntry({ playerName: 'Alice', score: 500, time: 90 }),
  makeEntry({ playerName: 'Bob', score: 400, time: 120 }),
  makeEntry({ playerName: 'Carol', score: 300, time: 150 }),
];

const FOUR_ENTRIES: LeaderboardEntry[] = [
  ...THREE_ENTRIES,
  makeEntry({ playerName: 'Dave', score: 200, time: 180 }),
];

describe('LeaderboardComponent', () => {
  let mockGetLeaderboard: ReturnType<typeof vi.fn>;

  function createMockService(entries: LeaderboardEntry[] = THREE_ENTRIES) {
    mockGetLeaderboard = vi.fn().mockReturnValue(entries);
    return getMockProvider(LeaderboardService, {
      getLeaderboard: mockGetLeaderboard,
    });
  }

  async function setup(
    overrides: Partial<TestHost> = {},
    entries: LeaderboardEntry[] = THREE_ENTRIES,
  ) {
    const { fixture, component, element } = await createComponent(TestHost, {
      providers: [createMockService(entries), ...ICON_PROVIDERS],
      detectChanges: false,
    });
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, component, element };
  }

  function getRows(element: HTMLElement): NodeListOf<Element> {
    return element.querySelectorAll('.leaderboard__row');
  }

  function getTabs(element: HTMLElement): NodeListOf<HTMLButtonElement> {
    return element.querySelectorAll('[role="tab"]');
  }

  it('should create the component', async () => {
    const { element } = await setup();
    expect(element.querySelector('nx-leaderboard')).toBeTruthy();
  });

  it('should render correct number of rows for provided entries', async () => {
    const { element } = await setup();
    expect(getRows(element).length).toBe(3);
  });

  it('should display correct column values', async () => {
    const { element } = await setup({}, [
      makeEntry({ playerName: 'Alice', score: 500, time: 90 }),
    ]);
    const rows = getRows(element);
    const cells = rows[0].querySelectorAll('[role="cell"]');
    expect(cells[0].textContent?.trim()).toBe('1');
    expect(cells[1].textContent?.trim()).toBe('Alice');
    expect(cells[2].textContent?.trim()).toBe('500');
    expect(cells[3].textContent?.trim()).toBe('1:30');
  });

  it('should render 3 mode tabs with correct labels', async () => {
    const { element } = await setup();
    const tabs = getTabs(element);
    expect(tabs.length).toBe(3);
    expect(tabs[0].textContent?.trim()).toBe('Story');
    expect(tabs[1].textContent?.trim()).toBe('Endless');
    expect(tabs[2].textContent?.trim()).toBe('Speed Run');
  });

  it('should switch mode when tab is clicked', async () => {
    const { fixture, element } = await setup();
    const tabs = getTabs(element);

    // Click "Endless" tab
    tabs[1].click();
    fixture.detectChanges();
    await fixture.whenStable();

    // Verify service was called with 'endless' mode
    expect(mockGetLeaderboard).toHaveBeenCalledWith('module-assembly', 'endless');
  });

  it('should initially select the mode specified by the mode input', async () => {
    const { element } = await setup({ mode: 'speedRun' });
    const tabs = getTabs(element);

    expect(tabs[2].getAttribute('aria-selected')).toBe('true');
    expect(mockGetLeaderboard).toHaveBeenCalledWith('module-assembly', 'speedRun');
  });

  it('should highlight the player row', async () => {
    const { element } = await setup({ playerName: 'Alice' });
    const rows = getRows(element);
    expect(rows[0].classList.contains('leaderboard__row--player')).toBe(true);
  });

  it('should not highlight non-player rows', async () => {
    const { element } = await setup({ playerName: 'Alice' });
    const rows = getRows(element);
    expect(rows[1].classList.contains('leaderboard__row--player')).toBe(false);
    expect(rows[2].classList.contains('leaderboard__row--player')).toBe(false);
  });

  it('should show empty state when no entries', async () => {
    const { element } = await setup({}, []);
    const emptyState = element.querySelector('nx-empty-state');
    expect(emptyState).toBeTruthy();
    expect(getRows(element).length).toBe(0);
  });

  it('should apply gold class on rank 1', async () => {
    const { element } = await setup();
    const rows = getRows(element);
    expect(rows[0].classList.contains('leaderboard__row--gold')).toBe(true);
  });

  it('should apply silver class on rank 2', async () => {
    const { element } = await setup();
    const rows = getRows(element);
    expect(rows[1].classList.contains('leaderboard__row--silver')).toBe(true);
  });

  it('should apply bronze class on rank 3', async () => {
    const { element } = await setup();
    const rows = getRows(element);
    expect(rows[2].classList.contains('leaderboard__row--bronze')).toBe(true);
  });

  it('should not apply medal class for rank 4+', async () => {
    const { element } = await setup({}, FOUR_ENTRIES);
    const rows = getRows(element);
    const fourthRow = rows[3];
    expect(fourthRow.classList.contains('leaderboard__row--gold')).toBe(false);
    expect(fourthRow.classList.contains('leaderboard__row--silver')).toBe(false);
    expect(fourthRow.classList.contains('leaderboard__row--bronze')).toBe(false);
  });

  it('should format time correctly', async () => {
    const { element } = await setup({}, [makeEntry({ time: 125 })]);
    const rows = getRows(element);
    const timeCell = rows[0].querySelector('.leaderboard__time');
    expect(timeCell?.textContent?.trim()).toBe('2:05');
  });

  it('should set aria-selected on active tab and false on others', async () => {
    const { element } = await setup({ mode: 'story' });
    const tabs = getTabs(element);
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(tabs[1].getAttribute('aria-selected')).toBe('false');
    expect(tabs[2].getAttribute('aria-selected')).toBe('false');
  });
});
