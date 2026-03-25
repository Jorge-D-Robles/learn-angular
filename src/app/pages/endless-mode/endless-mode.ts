import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { EndlessModeService } from '../../core/minigame/endless-mode.service';
import { MinigameRegistryService } from '../../core/minigame/minigame-registry.service';
import type { MinigameId } from '../../core/minigame/minigame.types';

/** Post-game summary data captured when a session ends. */
export interface PostGameData {
  readonly finalScore: number;
  readonly roundsSurvived: number;
  readonly isNewHighScore: boolean;
}

/** Maps a numeric difficulty level to a human-readable label. */
export function getDifficultyLabel(level: number): string {
  if (level <= 3) return 'Easy';
  if (level <= 6) return 'Medium';
  if (level <= 9) return 'Hard';
  return 'Extreme';
}

@Component({
  selector: 'app-endless-mode',
  imports: [RouterLink],
  template: `
    @switch (viewState()) {
      @case ('pre-game') {
        @if (gameName()) {
          <h1>{{ gameName() }}</h1>
          <p>High Score: {{ highScore() }}</p>
          <button (click)="onStart()">Start</button>
        } @else {
          <p>Game "{{ gameId() }}" not found.</p>
        }
      }
      @case ('in-game') {
        <p>Round: {{ session()?.currentRound }}</p>
        <p>Score: {{ session()?.score }}</p>
        <p>Difficulty: {{ difficultyLabel() }}</p>
        <button (click)="onEndSession()">End Session</button>
      }
      @case ('post-game') {
        <h2>Game Over</h2>
        <p>Final Score: {{ postGameData()?.finalScore }}</p>
        <p>Rounds Survived: {{ postGameData()?.roundsSurvived }}</p>
        @if (postGameData()?.isNewHighScore) {
          <p>New High Score!</p>
        }
        <button (click)="onPlayAgain()">Play Again</button>
        <a [routerLink]="['/minigames', gameId()]">Back to Level Select</a>
      }
    }
  `,
})
export class EndlessModePage {
  private readonly route = inject(ActivatedRoute);
  private readonly endlessModeService = inject(EndlessModeService);
  private readonly registry = inject(MinigameRegistryService);

  readonly gameId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('gameId') ?? '')),
    { initialValue: '' },
  );

  readonly gameName = computed(() => {
    const id = this.gameId();
    if (!id) return '';
    return this.registry.getConfig(id as MinigameId)?.name ?? '';
  });

  readonly highScore = signal(0);

  readonly viewState = signal<'pre-game' | 'in-game' | 'post-game'>('pre-game');

  readonly postGameData = signal<PostGameData | null>(null);

  readonly session = computed(() => this.endlessModeService.session());

  readonly difficultyLabel = computed(() => {
    const s = this.session();
    if (!s?.isActive) return '';
    return getDifficultyLabel(s.difficultyLevel);
  });

  constructor() {
    // Initialize high score from service
    const id = this.gameId();
    if (id) {
      this.highScore.set(this.endlessModeService.getHighScore(id as MinigameId));
    }

    // Cleanup on destroy: end active session to prevent leaks
    inject(DestroyRef).onDestroy(() => {
      if (this.endlessModeService.session()?.isActive) {
        this.endlessModeService.endSession();
      }
    });
  }

  onStart(): void {
    const id = this.gameId();
    if (!id) return;
    this.endlessModeService.startSession(id as MinigameId);
    this.viewState.set('in-game');
  }

  onEndSession(): void {
    const s = this.session();
    if (!s?.isActive) return;

    const roundsSurvived = s.currentRound;
    const { finalScore, isNewHighScore } = this.endlessModeService.endSession();

    this.postGameData.set({ finalScore, roundsSurvived, isNewHighScore });
    this.viewState.set('post-game');
  }

  onPlayAgain(): void {
    this.postGameData.set(null);
    const id = this.gameId();
    if (id) {
      this.highScore.set(this.endlessModeService.getHighScore(id as MinigameId));
    }
    this.viewState.set('pre-game');
  }
}
