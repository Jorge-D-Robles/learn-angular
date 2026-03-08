import { signal, WritableSignal } from '@angular/core';
import { vi } from 'vitest';
import { createComponent, getMockProvider } from '../../../testing/test-utils';
import { SettingsPage } from './settings';
import { SettingsService, UserSettings } from '../../core/settings';

let mockSettings: WritableSignal<UserSettings>;

async function setup() {
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

  mockSettings = signal<UserSettings>({
    soundEnabled: true,
    animationSpeed: 'normal',
    theme: 'station',
    reducedMotion: false,
  });

  const updateSettingFn = vi.fn().mockImplementation(
    <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
      mockSettings.update(current => ({ ...current, [key]: value }));
    },
  );
  const resetProgressFn = vi.fn();

  const result = await createComponent(SettingsPage, {
    providers: [
      getMockProvider(SettingsService, {
        settings: mockSettings.asReadonly(),
        updateSetting: updateSettingFn,
        resetProgress: resetProgressFn,
      }),
    ],
  });
  return { ...result, updateSettingFn, resetProgressFn };
}

describe('SettingsPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create the component', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
  });

  it('should render "Settings" heading', async () => {
    const { element } = await setup();
    const h1 = element.querySelector('h1');
    expect(h1?.textContent).toContain('Settings');
  });

  it('should render sound toggle with current state', async () => {
    const { element } = await setup();
    const toggle = element.querySelector('.settings-page__toggle') as HTMLButtonElement;
    expect(toggle).toBeTruthy();
    expect(toggle.textContent?.trim()).toBe('On');
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
  });

  it('should toggle sound off when sound button clicked', async () => {
    const { element, fixture, updateSettingFn } = await setup();
    const toggle = element.querySelector('.settings-page__toggle') as HTMLButtonElement;
    toggle.click();
    fixture.detectChanges();
    expect(updateSettingFn).toHaveBeenCalledWith('soundEnabled', false);
  });

  it('should render animation speed select with current value', async () => {
    const { element } = await setup();
    const select = element.querySelector('#animation-speed') as HTMLSelectElement;
    expect(select).toBeTruthy();
    const options = select.querySelectorAll('option');
    const selectedOption = Array.from(options).find(o => o.selected);
    expect(selectedOption?.value).toBe('normal');
  });

  it('should render theme select with current value', async () => {
    const { element } = await setup();
    const select = element.querySelector('#theme-select') as HTMLSelectElement;
    expect(select).toBeTruthy();
    const options = select.querySelectorAll('option');
    const selectedOption = Array.from(options).find(o => o.selected);
    expect(selectedOption?.value).toBe('station');
  });

  it('should render reduced motion toggle', async () => {
    const { element } = await setup();
    const toggles = element.querySelectorAll('.settings-page__toggle');
    // Second toggle is reduced motion
    const reducedMotionToggle = toggles[1] as HTMLButtonElement;
    expect(reducedMotionToggle).toBeTruthy();
    expect(reducedMotionToggle.getAttribute('aria-pressed')).toBe('false');
    expect(reducedMotionToggle.textContent?.trim()).toBe('Off');
  });

  it('should toggle reduced motion when button clicked', async () => {
    const { element, fixture, updateSettingFn } = await setup();
    const toggles = element.querySelectorAll('.settings-page__toggle');
    const reducedMotionToggle = toggles[1] as HTMLButtonElement;
    reducedMotionToggle.click();
    fixture.detectChanges();
    expect(updateSettingFn).toHaveBeenCalledWith('reducedMotion', true);
  });

  it('should show confirm dialog when "Reset All Progress" clicked', async () => {
    const { element, fixture } = await setup();
    const resetBtn = element.querySelector('.settings-page__btn--danger') as HTMLButtonElement;
    resetBtn.click();
    fixture.detectChanges();
    await fixture.whenStable();
    const dialog = element.querySelector('nx-confirm-dialog');
    expect(dialog).toBeTruthy();
  });

  it('should call resetProgress when reset is confirmed', async () => {
    const { element, fixture, resetProgressFn } = await setup();
    const resetBtn = element.querySelector('.settings-page__btn--danger') as HTMLButtonElement;
    resetBtn.click();
    fixture.detectChanges();
    await fixture.whenStable();
    const confirmBtn = element.querySelector('.confirm-dialog__btn--confirm') as HTMLButtonElement;
    confirmBtn.click();
    fixture.detectChanges();
    expect(resetProgressFn).toHaveBeenCalled();
  });

  it('should hide dialog when reset is cancelled', async () => {
    const { element, fixture } = await setup();
    const resetBtn = element.querySelector('.settings-page__btn--danger') as HTMLButtonElement;
    resetBtn.click();
    fixture.detectChanges();
    await fixture.whenStable();
    const cancelBtn = element.querySelector('.confirm-dialog__btn--cancel') as HTMLButtonElement;
    cancelBtn.click();
    fixture.detectChanges();
    await fixture.whenStable();
    const dialog = element.querySelector('nx-confirm-dialog');
    expect(dialog).toBeFalsy();
  });

  it('should render export and import buttons as disabled', async () => {
    const { element } = await setup();
    const secondaryBtns = element.querySelectorAll('.settings-page__btn--secondary');
    expect(secondaryBtns.length).toBe(2);
    expect((secondaryBtns[0] as HTMLButtonElement).disabled).toBe(true);
    expect((secondaryBtns[1] as HTMLButtonElement).disabled).toBe(true);
    expect(secondaryBtns[0].textContent?.trim()).toBe('Export Progress');
    expect(secondaryBtns[1].textContent?.trim()).toBe('Import Progress');
  });
});
