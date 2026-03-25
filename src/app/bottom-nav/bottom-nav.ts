import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map } from 'rxjs';

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
        routerLink="/campaign"
        [class.active]="isMissionActive()"
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
export class BottomNavComponent {
  private readonly router = inject(Router);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly isMissionActive = computed(() => {
    const url = this.currentUrl().split('?')[0];
    return url.startsWith('/campaign') || url.startsWith('/mission/');
  });
}
