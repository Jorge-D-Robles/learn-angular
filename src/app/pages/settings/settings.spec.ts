import { signal, WritableSignal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { vi } from 'vitest';
import { createComponent, getMockProvider } from '../../../testing/test-utils';
import { SettingsPage } from './settings';
import { SettingsService, UserSettings } from '../../core/settings';
import { StatePersistenceService } from '../../core/persistence';

let mockSettings: WritableSignal<UserSettings>;

// FileReader mock: class replacement (vi.spyOn won't work for constructors in jsdom)
let mockFileReaderInstance: {
  readAsText: ReturnType<typeof vi.fn>;
  onload: ((ev: ProgressEvent<FileReader>) => void) | null;
  onerror: ((ev: ProgressEvent<FileReader>) => void) | null;
  result: string | null;
};

class MockFileReader {
  readAsText = mockFileReaderInstance.readAsText;
  onload = mockFileReaderInstance.onload;
  onerror = mockFileReaderInstance.onerror;
  result = mockFileReaderInstance.result;

  constructor() {
    mockFileReaderInstance.readAsText.mockImplementation(() => {
      if (this.onload) {
        this.onload({ target: this } as unknown as ProgressEvent<FileReader>);
      }
    });
    mockFileReaderInstance = this as unknown as typeof mockFileReaderInstance;
  }
}

let exportStateFn: ReturnType<typeof vi.fn>;
let importStateFn: ReturnType<typeof vi.fn>;
let reloadFn: ReturnType<typeof vi.fn>;
let OriginalFileReader: typeof FileReader;

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

  exportStateFn = vi.fn().mockReturnValue('{"nexus-station:xp":100}');
  importStateFn = vi.fn().mockReturnValue(true);

  reloadFn = vi.fn();

  // Mock URL methods
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

  // Replace FileReader globally
  OriginalFileReader = globalThis.FileReader;
  mockFileReaderInstance = {
    readAsText: vi.fn(),
    onload: null,
    onerror: null,
    result: null,
  };
  (globalThis as Record<string, unknown>)['FileReader'] = MockFileReader;

  // Proxy the real document to intercept only `location` for reload mocking
  const realDoc = document;
  const fakeLocation = { reload: reloadFn };
  const docProxy = new Proxy(realDoc, {
    get(target, prop, receiver) {
      if (prop === 'location') {
        return fakeLocation;
      }
      const value = Reflect.get(target, prop, receiver);
      if (typeof value === 'function') {
        return value.bind(target);
      }
      return value;
    },
  });

  const result = await createComponent(SettingsPage, {
    providers: [
      getMockProvider(SettingsService, {
        settings: mockSettings.asReadonly(),
        updateSetting: updateSettingFn,
        resetProgress: resetProgressFn,
      }),
      getMockProvider(StatePersistenceService, {
        exportState: exportStateFn,
        importState: importStateFn,
      }),
      { provide: DOCUMENT, useValue: docProxy },
    ],
  });

  return { ...result, updateSettingFn, resetProgressFn };
}

describe('SettingsPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    if (OriginalFileReader) {
      (globalThis as Record<string, unknown>)['FileReader'] = OriginalFileReader;
    }
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

  // --- Export / Import tests (T-2026-313) ---

  it('should render export button as enabled', async () => {
    const { element } = await setup();
    const secondaryBtns = element.querySelectorAll('.settings-page__btn--secondary');
    const exportBtn = secondaryBtns[0] as HTMLButtonElement;
    expect(exportBtn.textContent?.trim()).toBe('Export Progress');
    expect(exportBtn.disabled).toBe(false);
  });

  it('should render import button as enabled', async () => {
    const { element } = await setup();
    const secondaryBtns = element.querySelectorAll('.settings-page__btn--secondary');
    const importBtn = secondaryBtns[1] as HTMLButtonElement;
    expect(importBtn.textContent?.trim()).toBe('Import Progress');
    expect(importBtn.disabled).toBe(false);
  });

  it('should trigger file download on export button click', async () => {
    const { element, fixture } = await setup();
    const secondaryBtns = element.querySelectorAll('.settings-page__btn--secondary');
    const exportBtn = secondaryBtns[0] as HTMLButtonElement;

    // Track <a> element creation and click
    let createdAnchor: HTMLAnchorElement | undefined;
    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreateElement(tag);
      if (tag === 'a') {
        createdAnchor = el as HTMLAnchorElement;
        vi.spyOn(createdAnchor, 'click');
      }
      return el;
    });

    exportBtn.click();
    fixture.detectChanges();

    expect(exportStateFn).toHaveBeenCalled();
    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(createdAnchor).toBeTruthy();
    expect(createdAnchor!.download).toMatch(/^learn-angular-progress-\d{4}-\d{2}-\d{2}\.json$/);
    expect(createdAnchor!.click).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('should open file picker on import button click', async () => {
    const { element, fixture } = await setup();
    const fileInput = element.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeTruthy();

    const clickSpy = vi.spyOn(fileInput, 'click');
    const secondaryBtns = element.querySelectorAll('.settings-page__btn--secondary');
    const importBtn = secondaryBtns[1] as HTMLButtonElement;
    importBtn.click();
    fixture.detectChanges();

    expect(clickSpy).toHaveBeenCalled();
  });

  it('should show confirm dialog after file selection', async () => {
    const { element, fixture } = await setup();
    const fileInput = element.querySelector('input[type="file"]') as HTMLInputElement;

    const file = new File(['{"nexus-station:xp":100}'], 'test.json', { type: 'application/json' });
    Object.defineProperty(fileInput, 'files', { value: [file], configurable: true });

    mockFileReaderInstance.result = '{"nexus-station:xp":100}';

    fileInput.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();

    const warningDialog = element.querySelector('.confirm-dialog--warning');
    expect(warningDialog).toBeTruthy();
  });

  it('should apply state and reload on import confirm', async () => {
    const { element, fixture } = await setup();
    const fileInput = element.querySelector('input[type="file"]') as HTMLInputElement;

    const file = new File(['{"nexus-station:xp":100}'], 'test.json', { type: 'application/json' });
    Object.defineProperty(fileInput, 'files', { value: [file], configurable: true });
    mockFileReaderInstance.result = '{"nexus-station:xp":100}';

    fileInput.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();

    const confirmBtns = element.querySelectorAll('.confirm-dialog__btn--confirm');
    const importConfirmBtn = confirmBtns[confirmBtns.length - 1] as HTMLButtonElement;
    importConfirmBtn.click();
    fixture.detectChanges();

    expect(importStateFn).toHaveBeenCalledWith('{"nexus-station:xp":100}');
    expect(reloadFn).toHaveBeenCalled();
  });

  it('should NOT apply state on import cancel', async () => {
    const { element, fixture } = await setup();
    const fileInput = element.querySelector('input[type="file"]') as HTMLInputElement;

    const file = new File(['{"nexus-station:xp":100}'], 'test.json', { type: 'application/json' });
    Object.defineProperty(fileInput, 'files', { value: [file], configurable: true });
    mockFileReaderInstance.result = '{"nexus-station:xp":100}';

    fileInput.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();

    const cancelBtns = element.querySelectorAll('.confirm-dialog__btn--cancel');
    const importCancelBtn = cancelBtns[cancelBtns.length - 1] as HTMLButtonElement;
    importCancelBtn.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(importStateFn).not.toHaveBeenCalled();
    const warningDialog = element.querySelector('.confirm-dialog--warning');
    expect(warningDialog).toBeFalsy();
  });

  it('should show error message when import file is invalid', async () => {
    const { element, fixture } = await setup();
    const fileInput = element.querySelector('input[type="file"]') as HTMLInputElement;

    importStateFn.mockReturnValue(false);

    const file = new File(['not valid json'], 'bad.json', { type: 'application/json' });
    Object.defineProperty(fileInput, 'files', { value: [file], configurable: true });
    mockFileReaderInstance.result = 'not valid json';

    fileInput.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();

    const confirmBtns = element.querySelectorAll('.confirm-dialog__btn--confirm');
    const importConfirmBtn = confirmBtns[confirmBtns.length - 1] as HTMLButtonElement;
    importConfirmBtn.click();
    fixture.detectChanges();

    const statusEl = element.querySelector('.settings-page__status');
    expect(statusEl).toBeTruthy();
    expect(statusEl!.textContent).toContain('Import failed: invalid file format');
    expect(reloadFn).not.toHaveBeenCalled();
  });
});
