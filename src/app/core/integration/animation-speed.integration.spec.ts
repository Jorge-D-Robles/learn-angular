/**
 * Integration test: AnimationService duration scaling with SettingsService animationSpeed.
 *
 * Verifies the chain: change animationSpeed setting -> AnimationService duration
 * multiplier updates -> actual animation durations scale correctly.
 */
import { TestBed } from '@angular/core/testing';
import { AnimationService } from '../animation/animation.service';
import { SettingsService } from '../settings/settings.service';
import { ANIMATION_DURATIONS } from '../animation/animations';

describe('AnimationService <-> SettingsService integration', () => {
  let animationService: AnimationService;
  let settingsService: SettingsService;
  let originalLocalStorage: Storage;
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    originalLocalStorage = window.localStorage;
    originalMatchMedia = window.matchMedia;

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
    animationService = TestBed.inject(AnimationService);
  });

  afterEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'matchMedia', {
      value: originalMatchMedia,
      writable: true,
      configurable: true,
    });
  });

  it('should use 1x multiplier with default animationSpeed (normal)', () => {
    expect(settingsService.settings().animationSpeed).toBe('normal');

    expect(animationService.getDuration('uiTransition')).toBe(ANIMATION_DURATIONS.uiTransition);
    expect(animationService.getDuration('gameFeedback')).toBe(ANIMATION_DURATIONS.gameFeedback);
    expect(animationService.getDuration('overlay')).toBe(ANIMATION_DURATIONS.overlay);
  });

  it('should use reduced multiplier with animationSpeed fast', () => {
    settingsService.updateSetting('animationSpeed', 'fast');

    expect(animationService.getDuration('uiTransition')).toBe(ANIMATION_DURATIONS.uiTransition * 0.5);
    expect(animationService.getDuration('gameFeedback')).toBe(ANIMATION_DURATIONS.gameFeedback * 0.5);
    expect(animationService.getDuration('overlay')).toBe(ANIMATION_DURATIONS.overlay * 0.5);
  });

  it('should use 0 multiplier with animationSpeed off (instant transitions)', () => {
    settingsService.updateSetting('animationSpeed', 'off');

    expect(animationService.getDuration('uiTransition')).toBe(0);
    expect(animationService.getDuration('gameFeedback')).toBe(0);
    expect(animationService.getDuration('overlay')).toBe(0);
  });

  it('should reactively update when animationSpeed changes mid-session', () => {
    // Start at normal
    expect(animationService.getDuration('uiTransition')).toBe(ANIMATION_DURATIONS.uiTransition);

    // Switch to fast
    settingsService.updateSetting('animationSpeed', 'fast');
    expect(animationService.getDuration('uiTransition')).toBe(ANIMATION_DURATIONS.uiTransition * 0.5);

    // Switch to off
    settingsService.updateSetting('animationSpeed', 'off');
    expect(animationService.getDuration('uiTransition')).toBe(0);

    // Switch back to normal
    settingsService.updateSetting('animationSpeed', 'normal');
    expect(animationService.getDuration('uiTransition')).toBe(ANIMATION_DURATIONS.uiTransition);
  });

  it('should return 0 for all durations when reducedMotion overrides animationSpeed', () => {
    settingsService.updateSetting('animationSpeed', 'normal');
    settingsService.updateSetting('reducedMotion', true);

    expect(animationService.getDuration('uiTransition')).toBe(0);
    expect(animationService.getDuration('gameFeedback')).toBe(0);
    expect(animationService.getDuration('overlay')).toBe(0);
  });
});
