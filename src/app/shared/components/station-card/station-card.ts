import { Component, input } from '@angular/core';

@Component({
  selector: 'nx-station-card',
  template: `
    @if (cardTitle()) {
      <div class="station-card__header">
        <h3 class="station-card__title">{{ cardTitle() }}</h3>
      </div>
    }
    <div class="station-card__body">
      <ng-content />
    </div>
  `,
  styleUrl: './station-card.scss',
  host: {
    '[style.--card-accent]': 'accentColor()',
  },
})
export class StationCardComponent {
  /** Optional card header text. If omitted, no header is rendered. */
  readonly cardTitle = input<string>('');

  /** Accent color for hover glow. Defaults to Reactor Blue CSS variable. */
  readonly accentColor = input<string>('var(--nx-color-reactor-blue)');
}
