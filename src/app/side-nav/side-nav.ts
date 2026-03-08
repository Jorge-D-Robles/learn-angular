import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { GameProgressionService } from '../core/progression/game-progression.service';

@Component({
  selector: 'app-side-nav',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav aria-label="Main navigation">
      <a
        routerLink="/"
        routerLinkActive="active"
        [routerLinkActiveOptions]="{ exact: true }"
      >
        Dashboard
      </a>
      <a [routerLink]="missionLink()" routerLinkActive="active">
        {{ missionLabel() }}
      </a>
      <a routerLink="/minigames" routerLinkActive="active">Minigames</a>
      <a routerLink="/profile" routerLinkActive="active">Profile</a>
    </nav>
  `,
  styleUrl: './side-nav.scss',
})
export class SideNavComponent {
  private readonly progression = inject(GameProgressionService);

  readonly missionLink = computed(() => {
    const mission = this.progression.currentMission();
    return mission ? `/mission/${mission.chapterId}` : '/campaign';
  });

  readonly missionLabel = computed(() => {
    return this.progression.currentMission() ? 'Current Mission' : 'Campaign Complete';
  });
}
