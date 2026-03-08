import { TestBed } from '@angular/core/testing';
import { AudioService, SoundEffect, SOUND_PATHS } from './audio.service';
import { SettingsService } from '../settings/settings.service';

const createdMocks: MockAudio[] = [];

class MockAudio {
  src: string;
  preload = '';
  volume = 1;
  playSpy = vi.fn().mockResolvedValue(undefined);

  constructor(src = '') {
    this.src = src;
    createdMocks.push(this);
  }

  cloneNode(_deep: boolean): MockAudio {
    const clone = new MockAudio(this.src);
    clone.preload = this.preload;
    clone.volume = this.volume;
    clone.playSpy = vi.fn().mockResolvedValue(undefined);
    return clone;
  }

  play(): Promise<void> {
    return this.playSpy();
  }
}

function createFakeStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  } as Storage;
}

describe('AudioService + SettingsService integration', () => {
  let audioService: AudioService;
  let settingsService: SettingsService;
  let originalLocalStorage: Storage;
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    TestBed.resetTestingModule();
    createdMocks.length = 0;

    originalLocalStorage = window.localStorage;
    originalMatchMedia = window.matchMedia;

    const fakeStorage = createFakeStorage();
    Object.defineProperty(window, 'localStorage', {
      value: fakeStorage,
      writable: true,
      configurable: true,
    });

    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn() }),
      writable: true,
      configurable: true,
    });

    vi.stubGlobal('Audio', MockAudio);

    TestBed.configureTestingModule({});
    audioService = TestBed.inject(AudioService);
    settingsService = TestBed.inject(SettingsService);
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
    vi.unstubAllGlobals();
  });

  it('should play sound when soundEnabled is true', () => {
    settingsService.updateSetting('soundEnabled', true);

    audioService.play(SoundEffect.click);

    const playedMocks = createdMocks.filter((m) => m.playSpy.mock.calls.length > 0);
    expect(playedMocks).toHaveLength(1);
    expect(playedMocks[0].src).toBe(SOUND_PATHS[SoundEffect.click]);
  });

  it('should NOT play sound when soundEnabled is false', () => {
    settingsService.updateSetting('soundEnabled', false);

    audioService.play(SoundEffect.click);

    expect(createdMocks).toHaveLength(0);
  });

  it('should respond immediately when soundEnabled is toggled mid-session', () => {
    // Phase 1: sound on, play correct
    settingsService.updateSetting('soundEnabled', true);
    audioService.play(SoundEffect.correct);

    const playedAfterFirst = createdMocks.filter((m) => m.playSpy.mock.calls.length > 0);
    expect(playedAfterFirst).toHaveLength(1);

    // Phase 2: sound off, play incorrect -- should be silent
    settingsService.updateSetting('soundEnabled', false);
    const countAfterFirstPlay = createdMocks.length;

    audioService.play(SoundEffect.incorrect);

    expect(createdMocks.length).toBe(countAfterFirstPlay);

    // Phase 3: sound back on, play complete -- should work immediately
    settingsService.updateSetting('soundEnabled', true);
    audioService.play(SoundEffect.complete);

    expect(createdMocks.length).toBe(countAfterFirstPlay + 1);

    const newPlayedMocks = createdMocks
      .slice(countAfterFirstPlay)
      .filter((m) => m.playSpy.mock.calls.length > 0);
    expect(newPlayedMocks).toHaveLength(1);
    expect(newPlayedMocks[0].src).toBe(SOUND_PATHS[SoundEffect.complete]);
  });
});
