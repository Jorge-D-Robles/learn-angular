import { TestBed } from '@angular/core/testing';
import { AnimationService } from './animation.service';
import { SettingsService } from '../settings/settings.service';

describe('AnimationService', () => {
  let service: AnimationService;
  let settingsService: SettingsService;
  let originalMatchMedia: typeof window.matchMedia;
  let originalLocalStorage: Storage;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
    originalLocalStorage = window.localStorage;

    const fakeStorage: Record<string, string> = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (key: string) => fakeStorage[key] ?? null,
        setItem: (key: string, value: string) => { fakeStorage[key] = value; },
        removeItem: (key: string) => { delete fakeStorage[key]; },
        clear: () => { Object.keys(fakeStorage).forEach(k => delete fakeStorage[k]); },
        key: (i: number) => Object.keys(fakeStorage)[i] ?? null,
        get length() { return Object.keys(fakeStorage).length; },
      } as Storage,
      writable: true,
      configurable: true,
    });

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    settingsService = TestBed.inject(SettingsService);
    service = TestBed.inject(AnimationService);
  });

  afterEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      value: originalMatchMedia,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return false for isReducedMotion by default', () => {
    expect(service.isReducedMotion()).toBe(false);
  });

  it('should return true for isReducedMotion when settings has reducedMotion true', () => {
    settingsService.updateSetting('reducedMotion', true);
    expect(service.isReducedMotion()).toBe(true);
  });

  it('should return base duration when reduced motion is off', () => {
    expect(service.getDuration('uiTransition')).toBe(200);
  });

  it('should return 0 when reduced motion is on', () => {
    settingsService.updateSetting('reducedMotion', true);
    expect(service.getDuration('uiTransition')).toBe(0);
  });

  it('should return correct value for each duration key', () => {
    expect(service.getDuration('gameFeedback')).toBe(400);
    expect(service.getDuration('overlay')).toBe(300);
  });

  it('should reactively update isReducedMotion when setting changes', () => {
    expect(service.isReducedMotion()).toBe(false);
    settingsService.updateSetting('reducedMotion', true);
    expect(service.isReducedMotion()).toBe(true);
    settingsService.updateSetting('reducedMotion', false);
    expect(service.isReducedMotion()).toBe(false);
  });

  describe('animationSpeed scaling', () => {
    it('should return base duration when animationSpeed is normal', () => {
      settingsService.updateSetting('animationSpeed', 'normal');
      expect(service.getDuration('uiTransition')).toBe(200);
      expect(service.getDuration('gameFeedback')).toBe(400);
      expect(service.getDuration('overlay')).toBe(300);
    });

    it('should return half duration when animationSpeed is fast', () => {
      settingsService.updateSetting('animationSpeed', 'fast');
      expect(service.getDuration('uiTransition')).toBe(100);
      expect(service.getDuration('gameFeedback')).toBe(200);
      expect(service.getDuration('overlay')).toBe(150);
    });

    it('should return 0 when animationSpeed is off', () => {
      settingsService.updateSetting('animationSpeed', 'off');
      expect(service.getDuration('uiTransition')).toBe(0);
      expect(service.getDuration('gameFeedback')).toBe(0);
      expect(service.getDuration('overlay')).toBe(0);
    });

    it('should give reducedMotion precedence over animationSpeed fast', () => {
      settingsService.updateSetting('animationSpeed', 'fast');
      settingsService.updateSetting('reducedMotion', true);
      expect(service.getDuration('uiTransition')).toBe(0);
    });

    it('should give reducedMotion precedence over animationSpeed normal', () => {
      settingsService.updateSetting('animationSpeed', 'normal');
      settingsService.updateSetting('reducedMotion', true);
      expect(service.getDuration('uiTransition')).toBe(0);
    });

    it('should reactively update when animationSpeed changes', () => {
      expect(service.getDuration('uiTransition')).toBe(200);
      settingsService.updateSetting('animationSpeed', 'fast');
      expect(service.getDuration('uiTransition')).toBe(100);
      settingsService.updateSetting('animationSpeed', 'normal');
      expect(service.getDuration('uiTransition')).toBe(200);
    });
  });
});
