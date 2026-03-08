import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { createComponent } from '../../../../testing/test-utils';
import { PauseMenuComponent } from './pause-menu';
import { KeyboardShortcutService } from '../../../core/minigame';

@Component({
  template: `
    @if (showPause) {
      <nx-pause-menu
        (resume)="onResume()"
        (restart)="onRestart()"
        (howToPlay)="onHowToPlay()"
        (quit)="onQuit()" />
    }
  `,
  imports: [PauseMenuComponent],
})
class TestHost {
  showPause = true;
  onResume = vi.fn();
  onRestart = vi.fn();
  onHowToPlay = vi.fn();
  onQuit = vi.fn();
}

async function setup() {
  // Polyfill BEFORE createComponent (dialog uses afterNextRender -> showModal)
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

  const result = await createComponent(TestHost);
  const overlayEl = result.element.querySelector('.pause-overlay') as HTMLElement;
  return { ...result, overlayEl };
}

function dispatchKey(el: HTMLElement, key: string): void {
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

describe('PauseMenuComponent', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create the component', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
  });

  it('should render 5 menu items', async () => {
    const { element } = await setup();
    const items = element.querySelectorAll('.pause-menu__item');
    expect(items.length).toBe(5);
    expect(items[0].textContent?.trim()).toBe('Resume');
    expect(items[1].textContent?.trim()).toBe('Restart Level');
    expect(items[2].textContent?.trim()).toBe('How to Play');
    expect(items[3].textContent?.trim()).toBe('View Shortcuts');
    expect(items[4].textContent?.trim()).toBe('Quit to Level Select');
  });

  it('should emit resume when Resume is clicked', async () => {
    const { element, component } = await setup();
    const items = element.querySelectorAll('.pause-menu__item');
    (items[0] as HTMLElement).click();
    expect((component as TestHost).onResume).toHaveBeenCalled();
  });

  it('should emit restart when Restart Level is clicked', async () => {
    const { element, component } = await setup();
    const items = element.querySelectorAll('.pause-menu__item');
    (items[1] as HTMLElement).click();
    expect((component as TestHost).onRestart).toHaveBeenCalled();
  });

  it('should emit howToPlay when How to Play is clicked', async () => {
    const { element, component } = await setup();
    const items = element.querySelectorAll('.pause-menu__item');
    (items[2] as HTMLElement).click();
    expect((component as TestHost).onHowToPlay).toHaveBeenCalled();
  });

  it('should show confirm dialog when Quit is clicked', async () => {
    const { element, fixture } = await setup();
    const items = element.querySelectorAll('.pause-menu__item');
    (items[4] as HTMLElement).click();
    fixture.detectChanges();
    await fixture.whenStable();

    const dialog = element.querySelector('nx-confirm-dialog');
    expect(dialog).toBeTruthy();
  });

  it('should emit quit when quit is confirmed', async () => {
    const { element, fixture, component } = await setup();
    const items = element.querySelectorAll('.pause-menu__item');
    (items[4] as HTMLElement).click();
    fixture.detectChanges();
    await fixture.whenStable();

    const confirmBtn = element.querySelector('.confirm-dialog__btn--confirm') as HTMLButtonElement;
    confirmBtn.click();
    expect((component as TestHost).onQuit).toHaveBeenCalled();
  });

  it('should NOT emit quit when quit is cancelled and hide dialog', async () => {
    const { element, fixture, component } = await setup();
    const items = element.querySelectorAll('.pause-menu__item');
    (items[4] as HTMLElement).click();
    fixture.detectChanges();
    await fixture.whenStable();

    const cancelBtn = element.querySelector('.confirm-dialog__btn--cancel') as HTMLButtonElement;
    cancelBtn.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect((component as TestHost).onQuit).not.toHaveBeenCalled();
    expect(element.querySelector('nx-confirm-dialog')).toBeFalsy();
  });

  it('should emit resume on Escape key', async () => {
    const { overlayEl, component } = await setup();
    dispatchKey(overlayEl, 'Escape');
    expect((component as TestHost).onResume).toHaveBeenCalled();
  });

  it('should ignore Escape when quit confirm dialog is open', async () => {
    const { element, fixture, overlayEl, component } = await setup();
    const items = element.querySelectorAll('.pause-menu__item');
    (items[4] as HTMLElement).click();
    fixture.detectChanges();
    await fixture.whenStable();

    dispatchKey(overlayEl, 'Escape');
    expect((component as TestHost).onResume).not.toHaveBeenCalled();
  });

  it('should wrap ArrowDown from last item to first', async () => {
    const { overlayEl, element, fixture } = await setup();
    // Press ArrowDown 5 times (0->1->2->3->4->0)
    dispatchKey(overlayEl, 'ArrowDown');
    dispatchKey(overlayEl, 'ArrowDown');
    dispatchKey(overlayEl, 'ArrowDown');
    dispatchKey(overlayEl, 'ArrowDown');
    dispatchKey(overlayEl, 'ArrowDown');
    fixture.detectChanges();

    const items = element.querySelectorAll('.pause-menu__item');
    expect(items[0].classList.contains('pause-menu__item--focused')).toBe(true);
  });

  it('should wrap ArrowUp from first item to last', async () => {
    const { overlayEl, element, fixture } = await setup();
    // focusedIndex starts at 0, ArrowUp wraps to 4
    dispatchKey(overlayEl, 'ArrowUp');
    fixture.detectChanges();

    const items = element.querySelectorAll('.pause-menu__item');
    expect(items[4].classList.contains('pause-menu__item--focused')).toBe(true);
  });

  it('should activate focused item with Enter', async () => {
    const { overlayEl, component } = await setup();
    // Move focus to index 1 (Restart Level)
    dispatchKey(overlayEl, 'ArrowDown');
    dispatchKey(overlayEl, 'Enter');
    expect((component as TestHost).onRestart).toHaveBeenCalled();
  });

  it('should toggle shortcuts panel on View Shortcuts click', async () => {
    const { element, fixture } = await setup();
    const items = element.querySelectorAll('.pause-menu__item');

    // Click View Shortcuts to show
    (items[3] as HTMLElement).click();
    fixture.detectChanges();
    expect(element.querySelector('.pause-overlay__shortcuts')).toBeTruthy();

    // Click again to hide
    (items[3] as HTMLElement).click();
    fixture.detectChanges();
    expect(element.querySelector('.pause-overlay__shortcuts')).toBeFalsy();
  });

  it('should display registered shortcuts', async () => {
    const { element, fixture } = await setup();
    const shortcutService = TestBed.inject(KeyboardShortcutService);
    shortcutService.register('h', 'Show Hint', vi.fn());
    shortcutService.register('r', 'Reset Board', vi.fn());

    const items = element.querySelectorAll('.pause-menu__item');
    (items[3] as HTMLElement).click();
    fixture.detectChanges();

    const keys = element.querySelectorAll('.pause-overlay__shortcut-key');
    const labels = element.querySelectorAll('.pause-overlay__shortcut-label');
    expect(keys.length).toBe(2);
    expect(keys[0].textContent?.trim()).toBe('h');
    expect(labels[0].textContent?.trim()).toBe('Show Hint');
    expect(keys[1].textContent?.trim()).toBe('r');
    expect(labels[1].textContent?.trim()).toBe('Reset Board');

    // Clean up registered shortcuts
    shortcutService.unregisterAll();
  });

  it('should have correct ARIA attributes on the overlay', async () => {
    const { overlayEl } = await setup();
    expect(overlayEl.getAttribute('role')).toBe('dialog');
    expect(overlayEl.getAttribute('aria-modal')).toBe('true');
    expect(overlayEl.getAttribute('aria-labelledby')).toBe('pause-menu-title');
    expect(overlayEl.querySelector('#pause-menu-title')).toBeTruthy();
  });
});
