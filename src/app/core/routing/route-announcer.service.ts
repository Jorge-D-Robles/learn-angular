import { DestroyRef, inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { SettingsService } from '../settings/settings.service';

@Injectable({ providedIn: 'root' })
export class RouteAnnouncerService {
  private readonly router = inject(Router);
  private readonly titleService = inject(Title);
  private readonly settingsService = inject(SettingsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly window = this.document.defaultView;
  private readonly liveRegion: HTMLElement;

  constructor() {
    this.liveRegion = this.createLiveRegion();
    this.destroyRef.onDestroy(() => this.liveRegion.remove());

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.onNavigationEnd());
  }

  private onNavigationEnd(): void {
    this.focusMainContent();
    this.scrollToTop();
    this.announceTitle();
  }

  private focusMainContent(): void {
    const mainContent = this.document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus({ preventScroll: true });
    }
  }

  private scrollToTop(): void {
    if (!this.window) return;
    const behavior = this.settingsService.settings().reducedMotion ? 'instant' : 'smooth';
    this.window.scrollTo({ top: 0, behavior });
  }

  private announceTitle(): void {
    const title = this.titleService.getTitle();
    this.liveRegion.textContent = '';
    this.liveRegion.textContent = title;
  }

  private createLiveRegion(): HTMLElement {
    const el = this.document.createElement('div');
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-atomic', 'true');
    el.style.position = 'absolute';
    el.style.width = '1px';
    el.style.height = '1px';
    el.style.padding = '0';
    el.style.margin = '-1px';
    el.style.overflow = 'hidden';
    el.style.clip = 'rect(0, 0, 0, 0)';
    el.style.whiteSpace = 'nowrap';
    el.style.border = '0';
    this.document.body.appendChild(el);
    return el;
  }
}
