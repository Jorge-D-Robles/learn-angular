import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { RefresherChallengeService, type RefresherChallenge } from '../../core/progression/refresher-challenge.service';
import { SpacedRepetitionService } from '../../core/progression/spaced-repetition.service';
import { MinigameRegistryService } from '../../core/minigame/minigame-registry.service';
import type { MinigameId } from '../../core/minigame/minigame.types';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state';
import { MasteryStarsComponent } from '../../shared/components/mastery-stars/mastery-stars';

type ViewState = 'loading' | 'error' | 'not-degrading' | 'playing' | 'completed';

@Component({
  selector: 'app-refresher-challenge',
  imports: [RouterLink, LoadingSpinnerComponent, ErrorStateComponent, MasteryStarsComponent],
  template: `
    @switch (viewState()) {
      @case ('loading') {
        <div class="refresher refresher--loading">
          <nx-loading-spinner size="lg" message="Loading refresher challenge..." />
        </div>
      }
      @case ('error') {
        <div class="refresher refresher--error">
          <nx-error-state
            [title]="'Refresher Load Failed'"
            [message]="errorMessage()"
            [retryable]="true"
            (retry)="onRetry()" />
        </div>
      }
      @case ('not-degrading') {
        <div class="refresher refresher--not-degrading">
          <h1>All caught up!</h1>
          <p>This topic does not need a refresher right now.</p>
          <a routerLink="/dashboard">Back to Dashboard</a>
        </div>
      }
      @case ('playing') {
        <div class="refresher refresher--playing">
          <h1>Refresher: {{ topicName() }}</h1>
          <p class="refresher__progress">{{ completedCount() }} of {{ totalLevels() }} completed</p>
          <ul class="refresher__level-list">
            @for (levelId of challenge()!.microLevelIds; track levelId) {
              <li class="refresher__level-item">
                <span class="refresher__level-id">{{ levelId }}</span>
                @if (isLevelCompleted(levelId)) {
                  <span class="refresher__level-done">Done</span>
                } @else {
                  <button class="refresher__complete-btn" (click)="onLevelComplete(levelId)">
                    Complete
                  </button>
                }
              </li>
            }
          </ul>
        </div>
      }
      @case ('completed') {
        <div class="refresher refresher--completed">
          <h1>Mastery Restored!</h1>
          <div class="refresher__mastery-result">
            <span class="refresher__before-mastery">{{ beforeMastery() }}</span>
            <nx-mastery-stars [stars]="beforeMastery()" size="md" />
            <span class="refresher__arrow">&rarr;</span>
            <span class="refresher__after-mastery">{{ afterMastery() }}</span>
            <nx-mastery-stars [stars]="afterMastery()" size="md" />
          </div>
          <a routerLink="/dashboard">Back to Dashboard</a>
        </div>
      }
    }
  `,
})
export class RefresherChallengePage {
  private readonly route = inject(ActivatedRoute);
  private readonly refresherService = inject(RefresherChallengeService);
  private readonly spacedRepetition = inject(SpacedRepetitionService);
  private readonly registry = inject(MinigameRegistryService);

  readonly topicId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('topicId') ?? '')),
    { initialValue: '' },
  );

  readonly viewState = signal<ViewState>('loading');
  readonly challenge = signal<RefresherChallenge | null>(null);
  readonly completedLevels = signal<ReadonlySet<string>>(new Set());
  readonly errorMessage = signal<string>('');
  readonly beforeMastery = signal<number>(0);
  readonly afterMastery = signal<number>(0);

  readonly topicName = computed(() => {
    const id = this.topicId();
    if (!id) return '';
    const config = this.registry.getConfig(id as MinigameId);
    return config?.name ?? id;
  });

  readonly completedCount = computed(() => this.completedLevels().size);

  readonly totalLevels = computed(() => this.challenge()?.microLevelIds.length ?? 0);

  constructor() {
    effect(() => {
      const tid = this.topicId();
      untracked(() => this.loadChallenge(tid));
    });
  }

  onLevelComplete(levelId: string): void {
    const prev = this.completedLevels();
    const next = new Set(prev);
    next.add(levelId);
    this.completedLevels.set(next);

    const total = this.challenge()?.microLevelIds.length ?? 0;
    if (next.size >= total) {
      this.onAllComplete();
    }
  }

  onRetry(): void {
    this.viewState.set('loading');
    this.challenge.set(null);
    this.completedLevels.set(new Set());
    this.errorMessage.set('');
    this.loadChallenge(this.topicId());
  }

  isLevelCompleted(levelId: string): boolean {
    return this.completedLevels().has(levelId);
  }

  private loadChallenge(tid: string): void {
    if (!tid) {
      this.viewState.set('not-degrading');
      return;
    }

    const config = this.registry.getConfig(tid as MinigameId);
    if (!config) {
      this.viewState.set('not-degrading');
      return;
    }

    this.viewState.set('loading');
    this.beforeMastery.set(
      Math.floor(this.spacedRepetition.getEffectiveMastery(tid as MinigameId)),
    );

    this.refresherService.generateRefresher(tid as MinigameId).then(
      (result) => {
        if (result === null) {
          this.viewState.set('not-degrading');
        } else {
          this.challenge.set(result);
          this.viewState.set('playing');
        }
      },
      (err: unknown) => {
        const message = err instanceof Error ? err.message : 'An unexpected error occurred';
        this.errorMessage.set(message);
        this.viewState.set('error');
      },
    );
  }

  private onAllComplete(): void {
    const tid = this.topicId();
    this.refresherService.completeRefresher(tid as MinigameId);
    this.afterMastery.set(
      Math.floor(this.spacedRepetition.getEffectiveMastery(tid as MinigameId)),
    );
    this.viewState.set('completed');
  }
}
