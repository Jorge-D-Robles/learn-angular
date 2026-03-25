import { Component, computed, input } from '@angular/core';

/** Replay mode types supported by the HUD. */
export type ReplayMode = 'endless' | 'speedrun' | 'daily';

@Component({
  selector: 'nx-replay-mode-hud',
  template: `
    <div class="hud" [class.hud--endless]="mode() === 'endless'" [class.hud--speedrun]="mode() === 'speedrun'" [class.hud--daily]="mode() === 'daily'">
      <div class="hud__stats">
        @switch (mode()) {
          @case ('endless') {
            <span data-testid="round-counter" class="hud__stat">
              <span class="hud__label">Round</span>
              <span class="hud__value">{{ round() }}</span>
            </span>
            <span data-testid="running-score" class="hud__stat">
              <span class="hud__label">Score</span>
              <span class="hud__value">{{ score() }}</span>
            </span>
            <span data-testid="difficulty-indicator" class="hud__stat">
              <span class="hud__label">Difficulty</span>
              <span class="hud__value">{{ difficultyLevel() }}</span>
            </span>
          }
          @case ('speedrun') {
            <span
              data-testid="elapsed-timer"
              class="hud__stat"
              [class.timer--green]="timerColor() === 'green'"
              [class.timer--orange]="timerColor() === 'orange'"
              [class.timer--red]="timerColor() === 'red'">
              <span class="hud__label">Time</span>
              <span class="hud__value">{{ formattedTime() }}</span>
            </span>
            <span data-testid="level-progress" class="hud__stat">
              <span class="hud__label">Levels</span>
              <span class="hud__value">{{ levelProgress() }}/{{ totalLevels() }}</span>
            </span>
          }
          @case ('daily') {
            <span data-testid="streak-display" class="hud__stat">
              <span class="hud__label">Streak</span>
              <span class="hud__value">{{ streakDays() }}</span>
            </span>
            <span data-testid="bonus-xp" class="hud__stat">
              <span class="hud__label">Bonus XP</span>
              <span class="hud__value">+{{ bonusXp() }}</span>
            </span>
            <span data-testid="topic-name" class="hud__stat">
              <span class="hud__label">Topic</span>
              <span class="hud__value">{{ topicName() }}</span>
            </span>
          }
        }
      </div>
      <div class="hud__content">
        <ng-content />
      </div>
    </div>
  `,
  styles: `
    .hud {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .hud__stats {
      display: flex;
      gap: 1rem;
      padding: 0.5rem;
    }
    .hud__stat {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .hud__label {
      font-size: 0.75rem;
      text-transform: uppercase;
      opacity: 0.7;
    }
    .hud__value {
      font-size: 1.25rem;
      font-weight: bold;
    }
    .timer--green .hud__value { color: #22c55e; }
    .timer--orange .hud__value { color: #f97316; }
    .timer--red .hud__value { color: #ef4444; }
  `,
})
export class ReplayModeHudComponent {
  // --- Shared inputs ---
  readonly mode = input<ReplayMode>('endless');

  // --- Endless mode inputs ---
  readonly round = input<number>(1);
  readonly score = input<number>(0);
  readonly difficultyLevel = input<number>(1);

  // --- Speed run inputs ---
  readonly elapsedTime = input<number>(0);
  readonly parTime = input<number>(180);
  readonly levelProgress = input<number>(0);
  readonly totalLevels = input<number>(10);
  readonly splitTimes = input<number[]>([]);

  // --- Daily challenge inputs ---
  readonly streakDays = input<number>(0);
  readonly bonusXp = input<number>(0);
  readonly topicName = input<string>('');

  /** Format elapsed seconds as M:SS. */
  readonly formattedTime = computed(() => {
    const total = Math.floor(this.elapsedTime());
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  });

  /** Timer color based on elapsed vs par time. */
  readonly timerColor = computed((): 'green' | 'orange' | 'red' => {
    const elapsed = this.elapsedTime();
    const par = this.parTime();
    if (elapsed >= par) return 'red';
    if (elapsed >= par * 0.75) return 'orange';
    return 'green';
  });
}
