import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { ConfirmDialogService } from './confirm-dialog.service';

describe('ConfirmDialogService', () => {
  let service: ConfirmDialogService;
  let appRef: ApplicationRef;

  beforeEach(() => {
    // Install jsdom polyfills BEFORE any service.confirm() calls
    if (!HTMLDialogElement.prototype.showModal) {
      HTMLDialogElement.prototype.showModal = function () {
        this.setAttribute('open', '');
      };
    }
    if (!HTMLDialogElement.prototype.close) {
      HTMLDialogElement.prototype.close = function () {
        this.removeAttribute('open');
      };
    }

    vi.spyOn(HTMLDialogElement.prototype, 'showModal');
    vi.spyOn(HTMLDialogElement.prototype, 'close');

    TestBed.configureTestingModule({});
    service = TestBed.inject(ConfirmDialogService);
    appRef = TestBed.inject(ApplicationRef);
  });

  afterEach(() => {
    // Clean up any dialogs left in the DOM
    document.body
      .querySelectorAll('nx-confirm-dialog')
      .forEach((el) => el.remove());
    vi.restoreAllMocks();
  });

  function openDialog(
    options: Partial<{
      title: string;
      message: string;
      confirmText: string;
      cancelText: string;
      variant: 'danger' | 'warning' | 'info';
    }> = {},
  ): { getDialog: () => HTMLDialogElement } {
    service
      .confirm({
        title: options.title ?? 'Test Title',
        message: options.message ?? 'Test message',
        ...('confirmText' in options
          ? { confirmText: options.confirmText }
          : {}),
        ...('cancelText' in options ? { cancelText: options.cancelText } : {}),
        ...('variant' in options ? { variant: options.variant } : {}),
      })
      .subscribe();

    appRef.tick();

    return {
      getDialog: () => document.body.querySelector('dialog') as HTMLDialogElement,
    };
  }

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('confirm() should append a dialog element to the document body', () => {
    const { getDialog } = openDialog();
    expect(getDialog()).not.toBeNull();
  });

  it('confirm() should emit true when confirm button is clicked', () => {
    const emitted: boolean[] = [];
    service
      .confirm({ title: 'T', message: 'M' })
      .subscribe((val) => emitted.push(val));

    appRef.tick();

    const confirmBtn = document.body.querySelector(
      '.confirm-dialog__btn--confirm',
    ) as HTMLButtonElement;
    confirmBtn.click();

    expect(emitted).toEqual([true]);
  });

  it('confirm() should emit false when cancel button is clicked', () => {
    const emitted: boolean[] = [];
    service
      .confirm({ title: 'T', message: 'M' })
      .subscribe((val) => emitted.push(val));

    appRef.tick();

    const cancelBtn = document.body.querySelector(
      '.confirm-dialog__btn--cancel',
    ) as HTMLButtonElement;
    cancelBtn.click();

    expect(emitted).toEqual([false]);
  });

  it('confirm() should emit false when Escape key dismisses the dialog', () => {
    const emitted: boolean[] = [];
    service
      .confirm({ title: 'T', message: 'M' })
      .subscribe((val) => emitted.push(val));

    appRef.tick();

    const dialog = document.body.querySelector('dialog') as HTMLDialogElement;
    dialog.dispatchEvent(new Event('cancel'));

    expect(emitted).toEqual([false]);
  });

  it('confirm() should complete the observable after resolution', () => {
    let completed = false;
    service.confirm({ title: 'T', message: 'M' }).subscribe({
      complete: () => {
        completed = true;
      },
    });

    appRef.tick();

    const confirmBtn = document.body.querySelector(
      '.confirm-dialog__btn--confirm',
    ) as HTMLButtonElement;
    confirmBtn.click();

    expect(completed).toBe(true);
  });

  it('confirm() should remove the dialog from the DOM after resolution', () => {
    const { getDialog } = openDialog();
    expect(getDialog()).not.toBeNull();

    const confirmBtn = document.body.querySelector(
      '.confirm-dialog__btn--confirm',
    ) as HTMLButtonElement;
    confirmBtn.click();

    expect(document.body.querySelector('dialog')).toBeNull();
  });

  it('confirm() should use default confirmText and cancelText', () => {
    const { getDialog } = openDialog();
    const dialog = getDialog();
    const confirmBtn = dialog.querySelector(
      '.confirm-dialog__btn--confirm',
    ) as HTMLButtonElement;
    const cancelBtn = dialog.querySelector(
      '.confirm-dialog__btn--cancel',
    ) as HTMLButtonElement;

    expect(confirmBtn.textContent?.trim()).toBe('Confirm');
    expect(cancelBtn.textContent?.trim()).toBe('Cancel');
  });

  it('confirm() should use custom confirmText and cancelText', () => {
    const { getDialog } = openDialog({
      confirmText: 'Delete',
      cancelText: 'Keep',
    });
    const dialog = getDialog();
    const confirmBtn = dialog.querySelector(
      '.confirm-dialog__btn--confirm',
    ) as HTMLButtonElement;
    const cancelBtn = dialog.querySelector(
      '.confirm-dialog__btn--cancel',
    ) as HTMLButtonElement;

    expect(confirmBtn.textContent?.trim()).toBe('Delete');
    expect(cancelBtn.textContent?.trim()).toBe('Keep');
  });

  it('confirm() should pass variant to the component', () => {
    const { getDialog } = openDialog({ variant: 'warning' });
    const dialog = getDialog();
    expect(dialog.classList.contains('confirm-dialog--warning')).toBe(true);
  });

  it('confirm() should default variant to info when not specified', () => {
    const { getDialog } = openDialog();
    const dialog = getDialog();
    expect(dialog.classList.contains('confirm-dialog--info')).toBe(true);
  });
});
