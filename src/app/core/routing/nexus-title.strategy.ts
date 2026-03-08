import { inject, Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TitleStrategy, RouterStateSnapshot } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class NexusTitleStrategy extends TitleStrategy {
  private static readonly APP_NAME = 'Nexus Station';
  private readonly title = inject(Title);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const pageTitle = this.buildTitle(snapshot);
    this.title.setTitle(
      pageTitle ? `${pageTitle} | ${NexusTitleStrategy.APP_NAME}` : NexusTitleStrategy.APP_NAME,
    );
  }
}
