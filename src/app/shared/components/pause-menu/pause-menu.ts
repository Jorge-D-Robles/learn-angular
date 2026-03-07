import {
  Component,
  ElementRef,
  afterNextRender,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {
  KeyboardShortcutService,
  type ShortcutRegistration,
} from '../../../core/minigame';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog';

interface MenuItem {
  readonly label: string;
  readonly action: () => void;
}

@Component({
  selector: 'nx-pause-menu',
  imports: [ConfirmDialogComponent],
  template: `
    <div
      #overlayEl
      class="pause-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-menu-title"
      tabindex="-1"
      (keydown)="onKeydown($event)">
      <div class="pause-overlay__panel">
        <h2 id="pause-menu-title" class="pause-overlay__title">Paused</h2>

        <ul class="pause-menu" role="menu">
          @for (item of menuItems; track item.label; let i = $index) {
            <li role="menuitem"
                class="pause-menu__item"
                [class.pause-menu__item--focused]="focusedIndex() === i"
                tabindex="0"
                (click)="item.action()"
                (keydown.enter)="item.action()"
                (keydown.space)="item.action()"
                (mouseenter)="focusedIndex.set(i)">
              {{ item.label }}
            </li>
          }
        </ul>

        @if (showShortcuts()) {
          <div class="pause-overlay__shortcuts">
            <h3 class="pause-overlay__shortcuts-title">Keyboard Shortcuts</h3>
            @if (getShortcuts().length === 0) {
              <p class="pause-overlay__no-shortcuts">No shortcuts registered.</p>
            } @else {
              <dl class="pause-overlay__shortcut-list">
                @for (s of getShortcuts(); track s.key) {
                  <div class="pause-overlay__shortcut-entry">
                    <dt class="pause-overlay__shortcut-key">{{ s.key }}</dt>
                    <dd class="pause-overlay__shortcut-label">{{ s.label }}</dd>
                  </div>
                }
              </dl>
            }
          </div>
        }

        @if (showQuitConfirm()) {
          <nx-confirm-dialog
            title="Quit to Level Select?"
            message="Your current progress in this level will be lost."
            confirmLabel="Quit"
            cancelLabel="Stay"
            variant="warning"
            (confirmed)="onQuitConfirmed()"
            (cancelled)="onQuitCancelled()" />
        }
      </div>
    </div>
  `,
  styleUrl: './pause-menu.scss',
})
export class PauseMenuComponent {
  private readonly shortcutService = inject(KeyboardShortcutService);
  private readonly overlayEl = viewChild<ElementRef<HTMLElement>>('overlayEl');

  // eslint-disable-next-line @angular-eslint/no-output-native -- 'resume' is not used as a native media event here
  readonly resume = output();
  readonly restart = output();
  readonly quit = output();

  readonly focusedIndex = signal(0);
  readonly showShortcuts = signal(false);
  readonly showQuitConfirm = signal(false);

  // menuItems must be declared AFTER output signals (TS initializes fields top-to-bottom)
  readonly menuItems: readonly MenuItem[] = [
    { label: 'Resume', action: () => this.resume.emit() },
    { label: 'Restart Level', action: () => this.restart.emit() },
    { label: 'View Shortcuts', action: () => this.showShortcuts.update(v => !v) },
    { label: 'Quit to Level Select', action: () => this.showQuitConfirm.set(true) },
  ];

  constructor() {
    afterNextRender(() => {
      this.overlayEl()?.nativeElement.focus();
    });
  }

  /** Returns shortcuts fresh each call -- not a computed (getRegistered() is not signal-based). */
  getShortcuts(): readonly ShortcutRegistration[] {
    return this.shortcutService.getRegistered();
  }

  onKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Escape':
        // Guard: skip when quit confirmation dialog is open (dialog handles its own Escape)
        if (this.showQuitConfirm()) return;
        event.preventDefault();
        this.resume.emit();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusedIndex.update(i => (i > 0 ? i - 1 : this.menuItems.length - 1));
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.focusedIndex.update(i => (i < this.menuItems.length - 1 ? i + 1 : 0));
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.menuItems[this.focusedIndex()].action();
        break;
    }
  }

  onQuitConfirmed(): void {
    this.showQuitConfirm.set(false);
    this.quit.emit();
  }

  onQuitCancelled(): void {
    this.showQuitConfirm.set(false);
  }
}
