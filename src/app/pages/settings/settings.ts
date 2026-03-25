import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { SettingsService, AnimationSpeed, Theme } from '../../core/settings';
import { StatePersistenceService } from '../../core/persistence';
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
          <option value="light" [selected]="settings().theme === 'light'">Light</option>
        </select>
      </div>
    </section>

    <section class="settings-page__section">
      <h2 class="settings-page__section-title">Data</h2>
      <div class="settings-page__row settings-page__row--actions">
        <button type="button" class="settings-page__btn settings-page__btn--secondary" (click)="exportProgress()">
          Export Progress
        </button>
        <button type="button" class="settings-page__btn settings-page__btn--secondary" (click)="importProgress()">
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
      <input #fileInput type="file" accept=".json" (change)="onFileSelected($event)" class="settings-page__file-input">
    </section>

    @if (statusMessage()) {
      <p class="settings-page__status">{{ statusMessage() }}</p>
    }

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

    @if (showImportDialog()) {
      <nx-confirm-dialog
        title="Import Progress"
        message="This will replace all current progress. Continue?"
        confirmLabel="Import"
        cancelLabel="Cancel"
        variant="warning"
        (confirmed)="onImportConfirmed()"
        (cancelled)="onImportCancelled()" />
    }
  `,
  styleUrl: './settings.scss',
})
export class SettingsPage {
  private readonly settingsService = inject(SettingsService);
  private readonly persistence = inject(StatePersistenceService);
  private readonly document = inject(DOCUMENT);

  readonly settings = this.settingsService.settings;
  readonly showResetDialog = signal(false);
  readonly showImportDialog = signal(false);
  readonly statusMessage = signal('');
  readonly pendingImportJson = signal('');

  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

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

  exportProgress(): void {
    const json = this.persistence.exportState();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().slice(0, 10);
    const a = this.document.createElement('a') as HTMLAnchorElement;
    a.href = url;
    a.download = `learn-angular-progress-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  importProgress(): void {
    this.fileInput().nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      this.pendingImportJson.set(content);
      this.showImportDialog.set(true);
    };
    reader.onerror = () => {
      this.statusMessage.set('Import failed: invalid file format');
      this._autoClearStatus();
    };
    reader.readAsText(file);
  }

  onImportConfirmed(): void {
    this.showImportDialog.set(false);
    const success = this.persistence.importState(this.pendingImportJson());
    if (success) {
      this.document.location.reload();
    } else {
      this.statusMessage.set('Import failed: invalid file format');
      this._autoClearStatus();
    }
  }

  onImportCancelled(): void {
    this.showImportDialog.set(false);
    this.pendingImportJson.set('');
  }

  private _autoClearStatus(): void {
    setTimeout(() => this.statusMessage.set(''), 5000);
  }
}
