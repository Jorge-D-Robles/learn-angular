import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgComponentOutlet } from '@angular/common';
import { map } from 'rxjs';
import { MinigameRegistryService } from '../../core/minigame/minigame-registry.service';
import { MinigameShellComponent } from '../../core/minigame/minigame-shell/minigame-shell';
import { LevelProgressionService } from '../../core/levels/level-progression.service';
import type { MinigameId } from '../../core/minigame/minigame.types';

@Component({
  selector: 'app-minigame-play',
  imports: [NgComponentOutlet, MinigameShellComponent, RouterLink],
  template: `
    @switch (viewState()) {
      @case ('not-found') {
        <div class="play-state play-state--error">
          <h2>Game Not Found</h2>
          <p>The minigame "{{ gameId() }}" does not exist.</p>
          <a routerLink="/minigames">Back to Minigame Hub</a>
        </div>
      }
      @case ('not-ready') {
        <div class="play-state play-state--coming-soon">
          <h2>Coming Soon</h2>
          <p>{{ gameConfig()?.name ?? gameId() }} is not yet available.</p>
          <a routerLink="/minigames">Back to Minigame Hub</a>
        </div>
      }
      @case ('locked') {
        <div class="play-state play-state--locked">
          <h2>Level Locked</h2>
          <p>Complete the previous tier to unlock this level.</p>
          <a [routerLink]="['/minigames', gameId()]">Back to Level Select</a>
        </div>
      }
      @case ('ready') {
        <app-minigame-shell>
          <ng-container *ngComponentOutlet="resolvedComponent()!" />
        </app-minigame-shell>
      }
    }
  `,
})
export class MinigamePlayPage {
  private readonly route = inject(ActivatedRoute);
  private readonly registry = inject(MinigameRegistryService);
  private readonly levelProgression = inject(LevelProgressionService);

  readonly gameId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('gameId') ?? '')),
    { initialValue: '' },
  );

  readonly levelId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('levelId') ?? '')),
    { initialValue: '' },
  );

  readonly resolvedComponent = computed(() => {
    const id = this.gameId();
    if (!id) return undefined;
    return this.registry.getComponent(id as MinigameId);
  });

  readonly gameConfig = computed(() => {
    const id = this.gameId();
    if (!id) return undefined;
    return this.registry.getConfig(id as MinigameId);
  });

  readonly viewState = computed<'not-found' | 'not-ready' | 'locked' | 'ready'>(() => {
    const component = this.resolvedComponent();
    if (component === undefined) return 'not-found';
    if (component === null) return 'not-ready';

    const lid = this.levelId();
    if (lid) {
      const levelDef = this.levelProgression.getLevelDefinition(lid);
      if (levelDef && !this.levelProgression.isLevelUnlocked(lid)) {
        return 'locked';
      }
    }

    return 'ready';
  });
}
