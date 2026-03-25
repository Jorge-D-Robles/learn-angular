import { Component } from '@angular/core';
import { vi } from 'vitest';
import {
  LucideIconConfig,
  LucideIconProvider,
  LUCIDE_ICONS,
} from 'lucide-angular';
import { createComponent } from '../../../../testing/test-utils';
import { APP_ICONS } from '../../icons';
import { MasteryTableComponent, MasteryTableRow } from './mastery-table';

@Component({
  template: `<nx-mastery-table [masteryData]="data" />`,
  imports: [MasteryTableComponent],
})
class TestHost {
  data: MasteryTableRow[] = [];
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

const NOW = new Date('2026-03-24T12:00:00Z');

const MOCK_DATA: MasteryTableRow[] = [
  {
    topicId: 'module-assembly',
    topicName: 'Components & Templates',
    mastery: 4,
    lastPracticed: new Date(NOW.getTime() - 2 * 86_400_000),
    degrading: false,
  },
  {
    topicId: 'wire-protocol',
    topicName: 'Data Binding',
    mastery: 1,
    lastPracticed: new Date(NOW.getTime() - 10 * 86_400_000),
    degrading: true,
  },
  {
    topicId: 'flow-commander',
    topicName: 'Control Flow',
    mastery: 3,
    lastPracticed: null,
    degrading: false,
  },
];

describe('MasteryTableComponent', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

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
    return element.querySelector('nx-mastery-table') as HTMLElement;
  }

  function getDataRows(element: HTMLElement): NodeListOf<HTMLTableRowElement> {
    return element.querySelectorAll('tbody tr');
  }

  it('should create the component', async () => {
    const { element } = await setup();
    expect(getHost(element)).toBeTruthy();
  });

  it('should render a row for each entry in masteryData', async () => {
    const { element } = await setup({ data: MOCK_DATA });
    const rows = getDataRows(element);
    expect(rows.length).toBe(3);
  });

  it('should display topic name in each row', async () => {
    const { element } = await setup({ data: MOCK_DATA });
    const cells = element.querySelectorAll('.mastery-table__topic-name');
    // Default sort is mastery ascending: Data Binding (1), Control Flow (3), Components & Templates (4)
    expect(cells[0].textContent?.trim()).toBe('Data Binding');
    expect(cells[1].textContent?.trim()).toBe('Control Flow');
    expect(cells[2].textContent?.trim()).toBe('Components & Templates');
  });

  it('should render MasteryStarsComponent with correct star count', async () => {
    const { element } = await setup({ data: MOCK_DATA });
    const rows = getDataRows(element);
    // Default sort: mastery ascending -> 1, 3, 4
    const stars0 = rows[0].querySelectorAll('.mastery-stars__star--filled');
    expect(stars0.length).toBe(1);
    const stars1 = rows[1].querySelectorAll('.mastery-stars__star--filled');
    expect(stars1.length).toBe(3);
    const stars2 = rows[2].querySelectorAll('.mastery-stars__star--filled');
    expect(stars2.length).toBe(4);
  });

  it('should display relative time for lastPracticed', async () => {
    const { element } = await setup({ data: MOCK_DATA });
    const rows = getDataRows(element);
    // Default sort: mastery ascending -> Data Binding (10d ago), Control Flow (Never), Components & Templates (2d ago)
    const lastPracticedCell = rows[0].querySelector(
      '.mastery-table__last-practiced',
    );
    expect(lastPracticedCell?.textContent?.trim()).toBe('1w ago');
  });

  it('should display "Never" when lastPracticed is null', async () => {
    const { element } = await setup({ data: MOCK_DATA });
    const rows = getDataRows(element);
    // Control Flow (mastery 3) is the second row in ascending sort, and has null lastPracticed
    const lastPracticedCell = rows[1].querySelector(
      '.mastery-table__last-practiced',
    );
    expect(lastPracticedCell?.textContent?.trim()).toBe('Never');
  });

  it('should display "Active" status for non-degrading topics', async () => {
    const { element } = await setup({ data: MOCK_DATA });
    const rows = getDataRows(element);
    // Control Flow (mastery 3, not degrading) is second row
    const statusCell = rows[1].querySelector('.mastery-table__status');
    expect(statusCell?.textContent?.trim()).toBe('Active');
  });

  it('should display "Degrading" status for degrading topics', async () => {
    const { element } = await setup({ data: MOCK_DATA });
    const rows = getDataRows(element);
    // Data Binding (mastery 1, degrading) is first row in ascending sort
    const statusCell = rows[0].querySelector('.mastery-table__status');
    expect(statusCell?.textContent?.trim()).toBe('Degrading');
  });

  it('should apply degrading highlight class on degrading rows', async () => {
    const { element } = await setup({ data: MOCK_DATA });
    const rows = getDataRows(element);
    // Data Binding (degrading) is first row
    expect(
      rows[0].classList.contains('mastery-table__row--degrading'),
    ).toBe(true);
    // Control Flow (not degrading) is second row
    expect(
      rows[1].classList.contains('mastery-table__row--degrading'),
    ).toBe(false);
  });

  it('should sort by mastery ascending by default', async () => {
    const { element } = await setup({ data: MOCK_DATA });
    const cells = element.querySelectorAll('.mastery-table__topic-name');
    expect(cells[0].textContent?.trim()).toBe('Data Binding');
    expect(cells[1].textContent?.trim()).toBe('Control Flow');
    expect(cells[2].textContent?.trim()).toBe('Components & Templates');
  });

  it('should toggle sort to mastery descending on header click', async () => {
    const { fixture, element } = await setup({ data: MOCK_DATA });
    const headers = element.querySelectorAll('th');
    // Mastery is the second column header
    const masteryHeader = headers[1];
    masteryHeader.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const cells = element.querySelectorAll('.mastery-table__topic-name');
    expect(cells[0].textContent?.trim()).toBe('Components & Templates');
    expect(cells[1].textContent?.trim()).toBe('Control Flow');
    expect(cells[2].textContent?.trim()).toBe('Data Binding');
  });

  it('should sort by topic name alphabetically on header click', async () => {
    const { fixture, element } = await setup({ data: MOCK_DATA });
    const headers = element.querySelectorAll('th');
    // Topic Name is the first column header
    const topicNameHeader = headers[0];
    topicNameHeader.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const cells = element.querySelectorAll('.mastery-table__topic-name');
    expect(cells[0].textContent?.trim()).toBe('Components & Templates');
    expect(cells[1].textContent?.trim()).toBe('Control Flow');
    expect(cells[2].textContent?.trim()).toBe('Data Binding');
  });

  it('should sort by last practiced on header click', async () => {
    const { fixture, element } = await setup({ data: MOCK_DATA });
    const headers = element.querySelectorAll('th');
    // Last Practiced is the third column header
    const lastPracticedHeader = headers[2];
    lastPracticedHeader.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const cells = element.querySelectorAll('.mastery-table__topic-name');
    // Ascending: most recent first (2d ago), then 10d ago, then null (never) last
    expect(cells[0].textContent?.trim()).toBe('Components & Templates');
    expect(cells[1].textContent?.trim()).toBe('Data Binding');
    expect(cells[2].textContent?.trim()).toBe('Control Flow');
  });

  it('should show sort indicator on active column', async () => {
    const { element } = await setup({ data: MOCK_DATA });
    const headers = element.querySelectorAll('th');
    // Mastery is the default sorted column (second header)
    const masteryHeader = headers[1];
    const icon = masteryHeader.querySelector('.mastery-table__sort-icon');
    expect(icon).toBeTruthy();
  });

  it('should render empty state when masteryData is empty', async () => {
    const { element } = await setup({ data: [] });
    const emptyState = element.querySelector('.mastery-table__empty');
    expect(emptyState).toBeTruthy();
    const topicCells = element.querySelectorAll('.mastery-table__topic-name');
    expect(topicCells.length).toBe(0);
  });

  it('should have role=table on the host', async () => {
    const { element } = await setup();
    const host = getHost(element);
    expect(host.getAttribute('role')).toBe('table');
  });

  it('should have aria-sort on the active column header', async () => {
    const { element } = await setup({ data: MOCK_DATA });
    const headers = element.querySelectorAll('th');
    const masteryHeader = headers[1];
    expect(masteryHeader.getAttribute('aria-sort')).toBe('ascending');
  });

  it('should update aria-sort when sort direction changes', async () => {
    const { fixture, element } = await setup({ data: MOCK_DATA });
    const headers = element.querySelectorAll('th');
    const masteryHeader = headers[1];

    masteryHeader.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(masteryHeader.getAttribute('aria-sort')).toBe('descending');
  });
});
