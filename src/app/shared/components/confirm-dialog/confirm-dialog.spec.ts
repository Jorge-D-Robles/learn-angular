import { Component } from '@angular/core';
import { vi } from 'vitest';
import { createComponent } from '../../../../testing/test-utils';
import { ConfirmDialogComponent } from './confirm-dialog';

@Component({
  template: `
    @if (open) {
      <nx-confirm-dialog
        [title]="title"
        [message]="message"
        [confirmLabel]="confirmLabel"
        [cancelLabel]="cancelLabel"
        [variant]="variant"
        (confirmed)="onConfirm()"
        (cancelled)="onCancel()" />
    }
  `,
  imports: [ConfirmDialogComponent],
})
class TestHost {
  open = true;
  title = 'Delete Progress';
  message = 'This action cannot be undone.';
  confirmLabel = 'Delete';
  cancelLabel = 'Keep';
  variant: 'danger' | 'warning' | 'info' = 'danger';
  onConfirm = vi.fn();
  onCancel = vi.fn();
}

@Component({
  template: `
    <nx-confirm-dialog
      [title]="'Reset'"
      [message]="'Are you sure?'"
      [variant]="'danger'" />
  `,
  imports: [ConfirmDialogComponent],
})
class TestHostDefaults {}

async function setup(hostClass: typeof TestHost | typeof TestHostDefaults = TestHost) {
  // Install jsdom polyfills BEFORE component renders
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

  const showModalSpy = vi.spyOn(HTMLDialogElement.prototype, 'showModal');
  const closeSpy = vi.spyOn(HTMLDialogElement.prototype, 'close');

  const result = await createComponent(hostClass);
  await result.fixture.whenStable();

  const dialogEl = result.element.querySelector('dialog') as HTMLDialogElement;
  return { ...result, dialogEl, showModalSpy, closeSpy };
}

describe('ConfirmDialogComponent', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create the component', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
  });

  it('should render title text', async () => {
    const { dialogEl } = await setup();
    const h2 = dialogEl.querySelector('h2');
    expect(h2?.textContent).toContain('Delete Progress');
  });

  it('should render message text', async () => {
    const { dialogEl } = await setup();
    const p = dialogEl.querySelector('p');
    expect(p?.textContent).toContain('This action cannot be undone.');
  });

  it('should render custom confirm label', async () => {
    const { dialogEl } = await setup();
    const confirmBtn = dialogEl.querySelector('.confirm-dialog__btn--confirm');
    expect(confirmBtn?.textContent?.trim()).toBe('Delete');
  });

  it('should render custom cancel label', async () => {
    const { dialogEl } = await setup();
    const cancelBtn = dialogEl.querySelector('.confirm-dialog__btn--cancel');
    expect(cancelBtn?.textContent?.trim()).toBe('Keep');
  });

  it('should render default labels when not provided', async () => {
    const { dialogEl } = await setup(TestHostDefaults);
    const cancelBtn = dialogEl.querySelector('.confirm-dialog__btn--cancel');
    const confirmBtn = dialogEl.querySelector('.confirm-dialog__btn--confirm');
    expect(cancelBtn?.textContent?.trim()).toBe('Cancel');
    expect(confirmBtn?.textContent?.trim()).toBe('Confirm');
  });

  it('should call showModal on the dialog element', async () => {
    const { showModalSpy } = await setup();
    expect(showModalSpy).toHaveBeenCalled();
  });

  it('should emit confirmed and close dialog when confirm button clicked', async () => {
    const { dialogEl, closeSpy, component } = await setup();
    const confirmBtn = dialogEl.querySelector('.confirm-dialog__btn--confirm') as HTMLButtonElement;
    confirmBtn.click();
    expect((component as TestHost).onConfirm).toHaveBeenCalled();
    expect(closeSpy).toHaveBeenCalled();
  });

  it('should emit cancelled and close dialog when cancel button clicked', async () => {
    const { dialogEl, closeSpy, component } = await setup();
    const cancelBtn = dialogEl.querySelector('.confirm-dialog__btn--cancel') as HTMLButtonElement;
    cancelBtn.click();
    expect((component as TestHost).onCancel).toHaveBeenCalled();
    expect(closeSpy).toHaveBeenCalled();
  });

  it('should emit cancelled when Escape key pressed (dialog cancel event)', async () => {
    const { dialogEl, component } = await setup();
    dialogEl.dispatchEvent(new Event('cancel'));
    expect((component as TestHost).onCancel).toHaveBeenCalled();
  });

  it('should NOT call close() on Escape (browser handles it)', async () => {
    const { dialogEl, closeSpy } = await setup();
    closeSpy.mockClear();
    dialogEl.dispatchEvent(new Event('cancel'));
    expect(closeSpy).not.toHaveBeenCalled();
  });

  it('should emit confirmed when Enter pressed on confirm button (via native click)', async () => {
    const { dialogEl, component } = await setup();
    const confirmBtn = dialogEl.querySelector('.confirm-dialog__btn--confirm') as HTMLButtonElement;
    confirmBtn.click();
    expect((component as TestHost).onConfirm).toHaveBeenCalled();
  });

  it('should apply confirm-dialog--danger class for danger variant', async () => {
    const { dialogEl } = await setup();
    expect(dialogEl.classList.contains('confirm-dialog--danger')).toBe(true);
  });

  it('should apply confirm-dialog--warning class for warning variant', async () => {
    const { fixture, element } = await setup();
    (fixture.componentInstance as TestHost).variant = 'warning';
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();
    const dialogEl = element.querySelector('dialog') as HTMLDialogElement;
    expect(dialogEl.classList.contains('confirm-dialog--warning')).toBe(true);
  });

  it('should apply confirm-dialog--info class for info variant', async () => {
    const { fixture, element } = await setup();
    (fixture.componentInstance as TestHost).variant = 'info';
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();
    const dialogEl = element.querySelector('dialog') as HTMLDialogElement;
    expect(dialogEl.classList.contains('confirm-dialog--info')).toBe(true);
  });

  it('should have aria-labelledby pointing to title', async () => {
    const { dialogEl } = await setup();
    expect(dialogEl.getAttribute('aria-labelledby')).toBe('confirm-dialog-title');
    expect(dialogEl.querySelector('#confirm-dialog-title')).toBeTruthy();
  });
});
