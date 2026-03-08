import { Component, inject, signal } from '@angular/core';
import { SettingsService, AnimationSpeed, Theme } from '../../core/settings';
import { ConfirmDialogComponent } from '../../shared/components';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [ConfirmDialogComponent],
  template: `
    <h1>Settings</h1>

    <section class="settings-page__section">
      <h2 class="settings-page__section-title">Audio</h2>
      <div class="settings-page__row">
        <span class="settings-page__label">Sound</span>
        <button
          type="button"
          class="settings-page__toggle"
          [class.settings-page__toggle--active]="settings().soundEnabled"
          [attr.aria-pressed]="settings().soundEnabled"
          (click)="toggleSound()">
          {{ settings().soundEnabled ? 'On' : 'Off' }}
        </button>
      </div>
    </section>

    <section class="settings-page__section">
      <h2 class="settings-page__section-title">Display</h2>
      <div class="settings-page__row">
        <label class="settings-page__label" for="animation-speed">Animation Speed</label>
        <select id="animation-speed" (change)="setAnimationSpeed($event)" class="settings-page__select">
          <option value="normal" [selected]="settings().animationSpeed === 'normal'">Normal</option>
          <option value="fast" [selected]="settings().animationSpeed === 'fast'">Fast</option>
          <option value="off" [selected]="settings().animationSpeed === 'off'">Off</option>
        </select>
      </div>
      <div class="settings-page__row">
        <span class="settings-page__label">Reduced Motion</span>
        <button
          type="button"
          class="settings-page__toggle"
          [class.settings-page__toggle--active]="settings().reducedMotion"
          [attr.aria-pressed]="settings().reducedMotion"
          (click)="toggleReducedMotion()">
          {{ settings().reducedMotion ? 'On' : 'Off' }}
        </button>
      </div>
      <div class="settings-page__row">
        <label class="settings-page__label" for="theme-select">Theme</label>
        <select id="theme-select" (change)="setTheme($event)" class="settings-page__select">
          <option value="dark" [selected]="settings().theme === 'dark'">Dark</option>
          <option value="station" [selected]="settings().theme === 'station'">Station</option>
        </select>
      </div>
    </section>

    <section class="settings-page__section">
      <h2 class="settings-page__section-title">Data</h2>
      <div class="settings-page__row settings-page__row--actions">
        <button type="button" class="settings-page__btn settings-page__btn--secondary" disabled title="Wired by T-2026-313">
          Export Progress
        </button>
        <button type="button" class="settings-page__btn settings-page__btn--secondary" disabled title="Wired by T-2026-313">
          Import Progress
        </button>
      </div>
      <div class="settings-page__row">
        <button
          type="button"
          class="settings-page__btn settings-page__btn--danger"
          (click)="openResetDialog()">
          Reset All Progress
        </button>
      </div>
    </section>

    @if (showResetDialog()) {
      <nx-confirm-dialog
        title="Reset All Progress"
        message="This will permanently delete all your progress, XP, and achievements. This action cannot be undone."
        confirmLabel="Reset Everything"
        cancelLabel="Keep Progress"
        variant="danger"
        (confirmed)="onResetConfirmed()"
        (cancelled)="onResetCancelled()" />
    }
  `,
  styleUrl: './settings.scss',
})
export class SettingsPage {
  private readonly settingsService = inject(SettingsService);
  readonly settings = this.settingsService.settings;
  readonly showResetDialog = signal(false);

  toggleSound(): void {
    this.settingsService.updateSetting('soundEnabled', !this.settings().soundEnabled);
  }

  setAnimationSpeed(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as AnimationSpeed;
    this.settingsService.updateSetting('animationSpeed', value);
  }

  setTheme(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as Theme;
    this.settingsService.updateSetting('theme', value);
  }

  toggleReducedMotion(): void {
    this.settingsService.updateSetting('reducedMotion', !this.settings().reducedMotion);
  }

  openResetDialog(): void {
    this.showResetDialog.set(true);
  }

  onResetConfirmed(): void {
    this.settingsService.resetProgress();
  }

  onResetCancelled(): void {
    this.showResetDialog.set(false);
  }
}
