import {
  Component,
  ElementRef,
  afterNextRender,
  input,
  output,
  viewChild,
} from '@angular/core';

@Component({
  selector: 'nx-confirm-dialog',
  template: `
    <dialog
      #dialogEl
      class="confirm-dialog"
      [class.confirm-dialog--danger]="variant() === 'danger'"
      [class.confirm-dialog--warning]="variant() === 'warning'"
      [class.confirm-dialog--info]="variant() === 'info'"
      aria-labelledby="confirm-dialog-title"
      (cancel)="onCancel()">
      <h2 id="confirm-dialog-title" class="confirm-dialog__title">{{ title() }}</h2>
      <p class="confirm-dialog__message">{{ message() }}</p>
      <div class="confirm-dialog__actions">
        <button
          type="button"
          class="confirm-dialog__btn confirm-dialog__btn--cancel"
          (click)="onCancelClick()">
          {{ cancelLabel() }}
        </button>
        <button
          type="button"
          class="confirm-dialog__btn confirm-dialog__btn--confirm"
          (click)="onConfirmClick()">
          {{ confirmLabel() }}
        </button>
      </div>
    </dialog>
  `,
  styleUrl: './confirm-dialog.scss',
})
export class ConfirmDialogComponent {
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly confirmLabel = input<string>('Confirm');
  readonly cancelLabel = input<string>('Cancel');
  readonly variant = input<'danger' | 'warning' | 'info'>('danger');

  readonly confirmed = output();
  readonly cancelled = output();

  private readonly dialogEl =
    viewChild.required<ElementRef<HTMLDialogElement>>('dialogEl');

  constructor() {
    afterNextRender(() => {
      this.dialogEl().nativeElement.showModal();
    });
  }

  onConfirmClick(): void {
    this.confirmed.emit();
    this.dialogEl().nativeElement.close();
  }

  onCancelClick(): void {
    this.cancelled.emit();
    this.dialogEl().nativeElement.close();
  }

  onCancel(): void {
    // Native cancel event from Escape key — dialog closes naturally.
    // No preventDefault() — it is non-cancellable in Chrome/Firefox.
    // No close() call — the browser already closes the dialog on Escape.
    this.cancelled.emit();
  }
}
