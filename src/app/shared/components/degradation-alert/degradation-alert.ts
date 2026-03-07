import { Component, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

export interface DegradingTopicItem {
  readonly topicId: string;
  readonly topicName: string;
  readonly currentMastery: number;
  readonly effectiveMastery: number;
  readonly daysSinceLastPractice: number;
}

@Component({
  selector: 'nx-degradation-alert',
  imports: [LucideAngularModule],
  template: `
    <div class="degradation-alert__header">
      <lucide-icon name="circle-alert" [size]="20" aria-hidden="true" />
      <h3 class="degradation-alert__title">Mastery Fading</h3>
    </div>
    @for (topic of degradingTopics(); track topic.topicId) {
      <div class="degradation-alert__item">
        <div class="degradation-alert__info">
          <span class="degradation-alert__topic-name">{{ topic.topicName }}</span>
          <span class="degradation-alert__mastery-diff">
            {{ topic.currentMastery }} \u2192 {{ topic.effectiveMastery }}
          </span>
          <span class="degradation-alert__days">{{ formatDays(topic.daysSinceLastPractice) }}d ago</span>
        </div>
        <button type="button" class="degradation-alert__practice-btn"
                [attr.aria-label]="'Practice ' + topic.topicName + ' now'"
                (click)="practiceRequested.emit(topic.topicId)">
          Practice Now
        </button>
      </div>
    }
  `,
  styleUrl: './degradation-alert.scss',
  host: {
    'role': 'region',
    'aria-label': 'Mastery degradation alerts',
    '[class.degradation-alert--compact]': 'variant() === "compact"',
    '[class.degradation-alert--full]': 'variant() === "full"',
    '[style.display]': 'degradingTopics().length === 0 ? "none" : null',
  },
})
export class DegradationAlertComponent {
  readonly degradingTopics = input<DegradingTopicItem[]>([]);
  readonly variant = input<'compact' | 'full'>('compact');

  readonly practiceRequested = output<string>();

  formatDays(days: number): number {
    return Math.floor(days);
  }
}
