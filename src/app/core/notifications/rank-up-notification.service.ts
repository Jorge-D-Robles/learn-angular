import {
  computed,
  effect,
  inject,
  Injectable,
  signal,
  untracked,
} from '@angular/core';
import { type Rank } from '../state/rank.constants';
import { XpService } from '../progression/xp.service';

export interface RankUpEvent {
  readonly previousRank: Rank;
  readonly newRank: Rank;
}

@Injectable({ providedIn: 'root' })
export class RankUpNotificationService {
  private readonly xpService = inject(XpService);
  private _previousRank: Rank | null = null;

  private readonly _rankUp = signal<RankUpEvent | null>(null);
  readonly rankUp = this._rankUp.asReadonly();
  readonly showRankUp = computed(() => this.rankUp() !== null);

  constructor() {
    effect(() => {
      const currentRank = this.xpService.currentRank();

      if (this._previousRank === null) {
        this._previousRank = currentRank;
        return;
      }

      if (currentRank !== this._previousRank) {
        const previousRank = this._previousRank;
        this._previousRank = currentRank;
        untracked(() =>
          this._rankUp.set({ previousRank, newRank: currentRank }),
        );
      }
    });
  }

  dismiss(): void {
    this._rankUp.set(null);
  }
}
