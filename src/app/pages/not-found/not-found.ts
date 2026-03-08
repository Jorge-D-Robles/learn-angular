import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="not-found">
      <div class="not-found__breach" aria-hidden="true"></div>
      <div class="not-found__warning-stripe" aria-hidden="true"></div>
      <div class="not-found__content">
        <span class="not-found__code">404</span>
        <h1 class="not-found__title">Hull Breach</h1>
        <p class="not-found__subtitle">Section Not Found</p>
        <p class="not-found__description">
          The corridor you attempted to access does not exist in this station sector.
        </p>
        <a class="not-found__action" routerLink="/">Return to Dashboard</a>
      </div>
    </div>
  `,
  styleUrl: './not-found.scss',
})
export class NotFoundPage {}
