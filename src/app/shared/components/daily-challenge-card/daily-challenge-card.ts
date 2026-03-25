import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import type { MinigameId } from '../../../core/minigame/minigame.types';
import type { DailyChallenge } from '../../../core/progression/daily-challenge.service';

@Component({
  selector: 'nx-daily-challenge-card',
  imports: [LucideAngularModule],
  template: `
    @if (isCompleted()) {
      <div class="daily-challenge-card__header">
        <span class="daily-challenge-card__complete-icon">
          <lucide-icon name="circle-check" [size]="20" aria-hidden="true" />
        </span>
        <span class="daily-challenge-card__complete-text">Challenge Complete</span>
      </div>
      <div class="daily-challenge-card__countdown">
        {{ countdownDisplay() }}
      </div>
    } @else {
      <div class="daily-challenge-card__header">
        <h3 class="daily-challenge-card__game-name">{{ gameName() }}</h3>
        <span class="daily-challenge-card__topic">{{ gameTopic() }}</span>
      </div>
      <div class="daily-challenge-card__actions">
        <span class="daily-challenge-card__xp-badge">+{{ challenge().bonusXp }} XP</span>
        <button
          class="daily-challenge-card__accept-button"
          type="button"
          (click)="onAccept()">
          Accept Challenge
        </button>
      </div>
    }
    @if (streakDays() > 0) {
      <div class="daily-challenge-card__streak">
        <lucide-icon name="flame" [size]="16" aria-hidden="true" />
        <span class="daily-challenge-card__streak-count">{{ streakDays() }}</span>
      </div>
    }
  `,
  styleUrl: './daily-challenge-card.scss',
  host: {
    'role': 'article',
    '[attr.aria-label]': 'ariaLabel()',
  },
})
export class DailyChallengeCardComponent {
  readonly challenge = input.required<DailyChallenge>();
  readonly isCompleted = input<boolean>(false);
  readonly gameName = input<string>('');
  readonly gameTopic = input<string>('');
  readonly streakDays = input<number>(0);

  readonly acceptChallenge = output<MinigameId>();

  private readonly destroyRef = inject(DestroyRef);
  private readonly _countdownTick = signal(0);
  private intervalId: ReturnType<typeof setInterval> | null = null;

  readonly ariaLabel = computed(() => {
    const name = this.gameName();
    const completed = this.isCompleted();
    return completed
      ? `Daily challenge: ${name} - completed`
      : `Daily challenge: ${name}`;
  });

  readonly countdownDisplay = computed(() => {
    this._countdownTick(); // subscribe to ticks
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    if (hours === 0 && minutes === 0) {
      return 'New challenge available';
    }

    const remainingMinutes = (23 - hours) * 60 + (60 - minutes);
    const h = Math.floor(remainingMinutes / 60);
    const m = remainingMinutes % 60;
    return `${h}h ${m}m`;
  });

  constructor() {
    this.intervalId = setInterval(() => {
      this._countdownTick.update((v) => v + 1);
    }, 60_000);

    this.destroyRef.onDestroy(() => {
      if (this.intervalId !== null) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    });
  }

  onAccept(): void {
    this.acceptChallenge.emit(this.challenge().gameId);
  }
}
