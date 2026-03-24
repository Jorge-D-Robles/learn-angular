import { Component, input, output } from '@angular/core';
import type { InterceptorBlock, InterceptorType } from '../deep-space-radio.types';

const ICON_LETTERS: Record<InterceptorType, string> = {
  auth: 'A',
  logging: 'L',
  retry: 'R',
  error: 'E',
  caching: 'C',
  custom: 'X',
};

@Component({
  selector: 'app-interceptor-pipeline',
  template: `
    <div class="interceptor-pipeline__container">
      <div
        class="interceptor-pipeline__wave"
        [class.interceptor-pipeline__wave--active]="isTransmitting()"
      ></div>
      <div class="interceptor-pipeline__track">
        @for (block of chain(); track block.id; let i = $index) {
          <div
            class="interceptor-pipeline__slot"
            (contextmenu)="onBlockRightClick($event, i)"
          >
            <div
              class="interceptor-pipeline__block interceptor-pipeline__block--{{ block.type }}"
              tabindex="0"
              role="button"
              (click)="onBlockClick(block)"
              (keydown.enter)="onBlockClick(block)"
              (keydown.space)="onBlockClick(block)"
            >
              <span class="interceptor-pipeline__icon">{{ getIconLetter(block.type) }}</span>
              <span class="interceptor-pipeline__name">{{ block.type }}</span>
              <span class="interceptor-pipeline__config-preview">{{ formatConfig(block.config) }}</span>
            </div>
          </div>
        }
        <div class="interceptor-pipeline__slot interceptor-pipeline__slot--empty">
          <span class="interceptor-pipeline__slot-label">Drop here</span>
        </div>
      </div>
    </div>
    @if (toolboxItems().length > 0) {
      <div class="interceptor-pipeline__toolbox">
        @for (item of toolboxItems(); track item.id) {
          <div class="interceptor-pipeline__toolbox-item">
            <span class="interceptor-pipeline__icon">{{ getIconLetter(item.type) }}</span>
            <span class="interceptor-pipeline__name">{{ item.type }}</span>
          </div>
        }
      </div>
    }
  `,
  styleUrl: './interceptor-pipeline.scss',
})
export class InterceptorPipelineComponent {
  // Inputs
  readonly chain = input.required<readonly InterceptorBlock[]>();
  readonly isTransmitting = input<boolean>(false);
  readonly toolboxItems = input<readonly InterceptorBlock[]>([]);

  // Outputs
  readonly interceptorPlaced = output<{ interceptor: InterceptorBlock; position: number }>();
  readonly interceptorRemoved = output<{ position: number }>();
  readonly interceptorClicked = output<InterceptorBlock>();

  // Constants
  private readonly iconLetters = ICON_LETTERS;

  getIconLetter(type: InterceptorType): string {
    return this.iconLetters[type];
  }

  formatConfig(config: Record<string, unknown>): string {
    const keys = Object.keys(config);
    if (keys.length === 0) return '';
    return keys.map(k => `${k}: ${config[k]}`).join(', ');
  }

  onBlockClick(block: InterceptorBlock): void {
    this.interceptorClicked.emit(block);
  }

  onBlockRightClick(event: MouseEvent, position: number): void {
    event.preventDefault();
    this.interceptorRemoved.emit({ position });
  }
}
