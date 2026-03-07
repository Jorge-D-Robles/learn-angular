import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

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
      <!-- TODO: Replace /mission/1 with dynamic current mission (T-2026-026) -->
      <a routerLink="/mission/1" routerLinkActive="active">
        Current Mission
      </a>
      <a routerLink="/minigames" routerLinkActive="active">Minigames</a>
      <a routerLink="/profile" routerLinkActive="active">Profile</a>
    </nav>
  `,
  styleUrl: './side-nav.scss',
})
export class SideNavComponent {}
