import { Component, computed, input, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MasteryStarsComponent } from '../mastery-stars/mastery-stars';

export interface MasteryTableRow {
  readonly topicId: string;
  readonly topicName: string;
  readonly mastery: number;
  readonly lastPracticed: Date | null;
  readonly degrading: boolean;
}

export type SortColumn = 'topicName' | 'mastery' | 'lastPracticed';
export type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'nx-mastery-table',
  imports: [MasteryStarsComponent, LucideAngularModule],
  template: `
    <table>
      <thead>
        <tr>
          <th (click)="toggleSort('topicName')"
              [attr.aria-sort]="sortColumn() === 'topicName' ? ariaSort() : null">
            Topic
            @if (sortColumn() === 'topicName') {
              <lucide-icon
                class="mastery-table__sort-icon"
                [name]="sortDirection() === 'asc' ? 'chevron-up' : 'chevron-down'"
                [size]="14"
                aria-hidden="true" />
            }
          </th>
          <th (click)="toggleSort('mastery')"
              [attr.aria-sort]="sortColumn() === 'mastery' ? ariaSort() : null">
            Mastery
            @if (sortColumn() === 'mastery') {
              <lucide-icon
                class="mastery-table__sort-icon"
                [name]="sortDirection() === 'asc' ? 'chevron-up' : 'chevron-down'"
                [size]="14"
                aria-hidden="true" />
            }
          </th>
          <th (click)="toggleSort('lastPracticed')"
              [attr.aria-sort]="sortColumn() === 'lastPracticed' ? ariaSort() : null">
            Last Practiced
            @if (sortColumn() === 'lastPracticed') {
              <lucide-icon
                class="mastery-table__sort-icon"
                [name]="sortDirection() === 'asc' ? 'chevron-up' : 'chevron-down'"
                [size]="14"
                aria-hidden="true" />
            }
          </th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        @if (sortedRows().length === 0) {
          <tr>
            <td colspan="4" class="mastery-table__empty">
              No topics to display
            </td>
          </tr>
        }
        @for (row of sortedRows(); track row.topicId) {
          <tr [class.mastery-table__row--degrading]="row.degrading"
              [attr.data-topic-id]="row.topicId">
            <td class="mastery-table__topic-name" data-label="Topic">{{ row.topicName }}</td>
            <td class="mastery-table__mastery" data-label="Mastery">
              <nx-mastery-stars [stars]="row.mastery" size="sm" />
            </td>
            <td class="mastery-table__last-practiced" data-label="Last Practiced">
              {{ formatRelativeTime(row.lastPracticed) }}
            </td>
            <td class="mastery-table__status" data-label="Status"
                [class.mastery-table__status--degrading]="row.degrading"
                [class.mastery-table__status--active]="!row.degrading">
              {{ row.degrading ? 'Degrading' : 'Active' }}
            </td>
          </tr>
        }
      </tbody>
    </table>
  `,
  styleUrl: './mastery-table.scss',
  host: {
    'role': 'table',
    'aria-label': 'Topic mastery overview',
  },
})
export class MasteryTableComponent {
  readonly masteryData = input<MasteryTableRow[]>([]);

  readonly sortColumn = signal<SortColumn>('mastery');
  readonly sortDirection = signal<SortDirection>('asc');

  readonly ariaSort = computed(() =>
    this.sortDirection() === 'asc' ? 'ascending' : 'descending',
  );

  readonly sortedRows = computed(() => {
    const data = [...this.masteryData()];
    const col = this.sortColumn();
    const dir = this.sortDirection();
    const mult = dir === 'asc' ? 1 : -1;

    return data.sort((a, b) => {
      switch (col) {
        case 'topicName':
          return mult * a.topicName.localeCompare(b.topicName);
        case 'mastery':
          return mult * (a.mastery - b.mastery);
        case 'lastPracticed':
          return mult * this.compareDates(a.lastPracticed, b.lastPracticed);
        default:
          return 0;
      }
    });
  });

  toggleSort(column: SortColumn): void {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  protected formatRelativeTime(date: Date | null): string {
    if (date === null) {
      return 'Never';
    }
    const diffMs = Date.now() - date.getTime();
    const days = Math.floor(diffMs / 86_400_000);
    if (days < 1) {
      return 'Today';
    }
    if (days < 7) {
      return `${days}d ago`;
    }
    const weeks = Math.floor(days / 7);
    if (days < 30) {
      return `${weeks}w ago`;
    }
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
  }

  private compareDates(a: Date | null, b: Date | null): number {
    // null (never practiced) sorts last in ascending, first in descending
    if (a === null && b === null) return 0;
    if (a === null) return 1;
    if (b === null) return -1;
    // More recent dates sort first in ascending (higher timestamp = more recent)
    return b.getTime() - a.getTime();
  }
}
