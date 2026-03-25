import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map } from 'rxjs';

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
      <a routerLink="/campaign" [class.active]="isMissionActive()">Current Mission</a>
      <a routerLink="/minigames" routerLinkActive="active">Minigames</a>
      <a routerLink="/profile" routerLinkActive="active">Profile</a>
    </nav>
  `,
  styleUrl: './side-nav.scss',
})
export class SideNavComponent {
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
