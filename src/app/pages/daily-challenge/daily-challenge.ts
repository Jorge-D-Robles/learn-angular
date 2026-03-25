import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DailyChallengeService } from '../../core/progression/daily-challenge.service';
import { StreakService } from '../../core/progression/streak.service';
import { MinigameRegistryService } from '../../core/minigame/minigame-registry.service';
import type { MinigameId } from '../../core/minigame/minigame.types';
import { TimeFormatPipe } from '../../shared/pipes/time-format.pipe';

/** Computes seconds remaining until the next local midnight. */
function secondsUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.floor((midnight.getTime() - now.getTime()) / 1000);
}

@Component({
  selector: 'app-daily-challenge',
  imports: [RouterLink, TimeFormatPipe],
  template: `
    <h1>Daily Challenge</h1>
    <p class="daily-challenge__game-name">{{ gameName() }}</p>
    <p class="daily-challenge__topic">{{ angularTopic() }}</p>
    <p class="daily-challenge__bonus-xp">Bonus XP: {{ challenge().bonusXp }}</p>
    <p class="daily-challenge__level-id">{{ challenge().levelId }}</p>
    <div class="daily-challenge__streak">
      <span class="daily-challenge__streak-days">Streak: {{ streakDays() }} days</span>
      <span class="daily-challenge__streak-multiplier">{{ streakMultiplierPercent() }}%</span>
    </div>
    @if (isCompleted()) {
      <div class="daily-challenge--completed">
        <span class="daily-challenge__checkmark">\u2713</span>
        <p class="daily-challenge__countdown">Next challenge in: {{ countdown() | timeFormat:'short' }}</p>
      </div>
    } @else {
      <div class="daily-challenge--pending">
        <a [routerLink]="acceptChallengeLink()" class="daily-challenge__accept-btn">Accept Challenge</a>
      </div>
    }
  `,
})
export class DailyChallengePage {
  private readonly dailyChallengeService = inject(DailyChallengeService);
  private readonly streakService = inject(StreakService);
  private readonly registry = inject(MinigameRegistryService);

  readonly challenge = this.dailyChallengeService.todaysChallenge;
  readonly isCompleted = computed(() => this.challenge().completed);

  readonly gameName = computed(() => {
    const config = this.registry.getConfig(this.challenge().gameId as MinigameId);
    return config?.name ?? 'Unknown Game';
  });

  readonly angularTopic = computed(() => {
    const config = this.registry.getConfig(this.challenge().gameId as MinigameId);
    return config?.angularTopic ?? '';
  });

  readonly streakDays = this.streakService.activeStreakDays;
  readonly streakMultiplier = this.streakService.streakMultiplier;
  readonly streakMultiplierPercent = computed(() =>
    Math.round(this.streakMultiplier() * 100),
  );

  readonly countdown = signal(0);

  readonly acceptChallengeLink = computed(() => [
    '/minigames',
    this.challenge().gameId,
    'level',
    this.challenge().levelId,
  ]);

  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.countdown.set(secondsUntilMidnight());

    this.intervalId = setInterval(() => {
      this.countdown.set(secondsUntilMidnight());
    }, 1000);

    inject(DestroyRef).onDestroy(() => {
      if (this.intervalId !== null) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    });
  }
}
