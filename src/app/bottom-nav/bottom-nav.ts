import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

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
      <!-- TODO: Replace /mission/1 with dynamic current mission (T-2026-026) -->
      <a
        routerLink="/mission/1"
        routerLinkActive="active"
        class="bottom-nav__tab"
      >
        <span class="bottom-nav__icon bottom-nav__icon--mission" aria-hidden="true"></span>
        <span class="bottom-nav__label">Mission</span>
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
export class BottomNavComponent {}
