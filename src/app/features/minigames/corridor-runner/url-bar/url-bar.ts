import {
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

@Component({
  selector: 'app-corridor-runner-url-bar',
  imports: [],
  template: `
    <div class="cr-url-bar"
         [class.cr-url-bar--hull-breach]="isHullBreach()"
         role="navigation"
         aria-label="URL address bar">

      <!-- Browser-like chrome: back/forward placeholders -->
      <div class="cr-url-bar__chrome">
        <button class="cr-url-bar__nav-btn" disabled aria-label="Back">&#9664;</button>
        <button class="cr-url-bar__nav-btn" disabled aria-label="Forward">&#9654;</button>
      </div>

      <!-- Address input -->
      <div class="cr-url-bar__address">
        <span class="cr-url-bar__prefix">nexus://</span>
        <input class="cr-url-bar__input"
               type="text"
               [value]="displayUrl()"
               (input)="onInput($event)"
               (keydown.enter)="onSubmit()"
               aria-label="URL input" />
      </div>

      <!-- Hull breach indicator -->
      @if (isHullBreach()) {
        <span class="cr-url-bar__breach-indicator" role="alert">
          404 - Hull Breach
        </span>
      }

      <!-- Resolved component breadcrumb -->
      @if (resolvedComponent() && !isHullBreach()) {
        <span class="cr-url-bar__resolved" aria-label="Resolved destination">
          {{ resolvedComponent() }}
        </span>
      }
    </div>
  `,
  styleUrl: './url-bar.scss',
})
export class CorridorRunnerUrlBarComponent {
  // --- Inputs ---
  readonly currentUrl = input('');
  readonly resolvedComponent = input<string | null>(null);
  readonly isHullBreach = input(false);

  // --- Outputs ---
  readonly urlSubmitted = output<string>();

  // --- Internal state ---
  private readonly _editedUrl = signal<string | null>(null);

  // --- Computed ---
  readonly displayUrl = computed(() => {
    const edited = this._editedUrl();
    if (edited !== null) return edited;
    return this.currentUrl() || '/';
  });

  // --- Methods ---

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this._editedUrl.set(target.value);
  }

  onSubmit(): void {
    const url = this._editedUrl() ?? this.currentUrl();
    if (url) {
      this.urlSubmitted.emit(url);
      this._editedUrl.set(null);
    }
  }
}
