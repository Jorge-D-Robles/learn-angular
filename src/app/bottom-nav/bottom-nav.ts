import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { GameProgressionService } from '../core/progression/game-progression.service';

@Component({
  selector: 'app-bottom-nav',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav aria-label="Mobile navigation">
      <a
        routerLink="/"
        routerLinkActive="active"
        [routerLinkActiveOptions]="{ exact: true }"
        class="bottom-nav__tab"
      >
        <span class="bottom-nav__icon bottom-nav__icon--dashboard" aria-hidden="true"></span>
        <span class="bottom-nav__label">Dashboard</span>
      </a>
      <a
        [routerLink]="missionLink()"
        routerLinkActive="active"
        class="bottom-nav__tab"
      >
        <span class="bottom-nav__icon bottom-nav__icon--mission" aria-hidden="true"></span>
        <span class="bottom-nav__label">{{ missionLabel() }}</span>
      </a>
      <a
        routerLink="/minigames"
        routerLinkActive="active"
        class="bottom-nav__tab"
      >
        <span class="bottom-nav__icon bottom-nav__icon--games" aria-hidden="true"></span>
        <span class="bottom-nav__label">Games</span>
      </a>
      <a
        routerLink="/profile"
        routerLinkActive="active"
        class="bottom-nav__tab"
      >
        <span class="bottom-nav__icon bottom-nav__icon--profile" aria-hidden="true"></span>
        <span class="bottom-nav__label">Profile</span>
      </a>
    </nav>
  `,
  styleUrl: './bottom-nav.scss',
})
export class BottomNavComponent {
  private readonly progression = inject(GameProgressionService);

  readonly missionLink = computed(() => {
    const mission = this.progression.currentMission();
    return mission ? `/mission/${mission.chapterId}` : '/campaign';
  });

  readonly missionLabel = computed(() => {
    return this.progression.currentMission() ? 'Mission' : 'Complete';
  });
}
