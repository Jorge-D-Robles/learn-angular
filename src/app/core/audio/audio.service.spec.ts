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

describe('AudioService', () => {
  let service: AudioService;
  let settingsService: SettingsService;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    createdMocks.length = 0;

    originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn() }),
      writable: true,
      configurable: true,
    });

    vi.stubGlobal('Audio', MockAudio);

    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    TestBed.configureTestingModule({});
    service = TestBed.inject(AudioService);
    settingsService = TestBed.inject(SettingsService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    warnSpy.mockRestore();
    Object.defineProperty(window, 'matchMedia', {
      value: originalMatchMedia,
      writable: true,
      configurable: true,
    });
  });

  // Test 1: Service is created
  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // Test 2: play() when soundEnabled=true creates/clones audio element and calls play()
  it('should play sound when soundEnabled is true', () => {
    settingsService.updateSetting('soundEnabled', true);

    service.play(SoundEffect.click);

    // Should have preloaded (10 Audio constructor calls) and cloned one for play
    // 10 for preload + 1 clone = 11 total MockAudio instances
    expect(createdMocks.length).toBeGreaterThanOrEqual(10);

    // Find a clone that was played
    const playedMocks = createdMocks.filter((m) => m.playSpy.mock.calls.length > 0);
    expect(playedMocks).toHaveLength(1);
    expect(playedMocks[0].src).toBe(SOUND_PATHS[SoundEffect.click]);
  });

  // Test 3: play() when soundEnabled=false does NOT call play()
  it('should not play sound when soundEnabled is false', () => {
    settingsService.updateSetting('soundEnabled', false);

    service.play(SoundEffect.click);

    expect(createdMocks).toHaveLength(0);
  });

  // Test 4: setVolume(0.8) then play() sets volume to 0.8
  it('should apply volume to played audio element', () => {
    settingsService.updateSetting('soundEnabled', true);
    service.setVolume(0.8);

    service.play(SoundEffect.click);

    // Find the cloned mock that was played
    const playedMock = createdMocks.find((m) => m.playSpy.mock.calls.length > 0);
    expect(playedMock).toBeTruthy();
    expect(playedMock!.volume).toBe(0.8);
  });

  // Test 5: setVolume(-0.5) clamps to 0
  it('should clamp negative volume to 0', () => {
    service.setVolume(-0.5);
    expect(service.volume()).toBe(0);
  });

  // Test 6: setVolume(1.5) clamps to 1
  it('should clamp volume above 1 to 1', () => {
    service.setVolume(1.5);
    expect(service.volume()).toBe(1);
  });

  // Test 7: volume defaults to 0.5
  it('should default volume to 0.5', () => {
    expect(service.volume()).toBe(0.5);
  });

  // Test 8: preload() creates audio elements for all sounds
  it('should create audio elements for all sounds on preload', () => {
    service.preload();

    // One Audio element per SoundEffect value (10 including achievement)
    expect(createdMocks).toHaveLength(10);
  });

  // Test 9: play() triggers lazy preload on first call
  it('should trigger lazy preload on first play call', () => {
    settingsService.updateSetting('soundEnabled', true);

    service.play(SoundEffect.correct);

    // 10 for preload + 1 clone for play = 11
    expect(createdMocks).toHaveLength(11);

    // Second call should not preload again (only 1 additional clone)
    const countBefore = createdMocks.length;
    service.play(SoundEffect.incorrect);
    expect(createdMocks.length - countBefore).toBe(1);
  });

  // Test 10: play() error is caught and logged
  it('should catch play errors and log warning', async () => {
    settingsService.updateSetting('soundEnabled', true);

    // Preload with normal mocks, then make cloneNode return a rejecting mock
    service.preload();

    const cachedClick = createdMocks.find((m) => m.src === SOUND_PATHS[SoundEffect.click]);
    expect(cachedClick).toBeTruthy();

    // Override cloneNode to return a mock that rejects on play
    vi.spyOn(cachedClick!, 'cloneNode').mockImplementation(() => {
      const rejectingMock = new MockAudio(cachedClick!.src);
      rejectingMock.playSpy = vi.fn().mockRejectedValue(new Error('NotAllowedError'));
      return rejectingMock;
    });

    service.play(SoundEffect.click);

    // Wait for the promise rejection to be caught
    await vi.waitFor(() => {
      expect(warnSpy).toHaveBeenCalled();
    });
  });

  // Test 11: All SoundEffect enum values exist
  it('should have exactly 10 SoundEffect enum values', () => {
    const values = Object.values(SoundEffect);
    expect(values).toHaveLength(10);
    expect(values).toContain('correct');
    expect(values).toContain('incorrect');
    expect(values).toContain('complete');
    expect(values).toContain('fail');
    expect(values).toContain('levelUp');
    expect(values).toContain('rankUp');
    expect(values).toContain('hint');
    expect(values).toContain('click');
    expect(values).toContain('tick');
    expect(values).toContain('achievement');
  });

  // Test 13: SoundEffect.achievement exists in SOUND_PATHS
  it('should have achievement in SOUND_PATHS', () => {
    expect(SOUND_PATHS[SoundEffect.achievement]).toBe('audio/achievement.mp3');
  });

  // Test 12: play() uses cloneNode for overlapping playback
  it('should use cloneNode for overlapping playback', () => {
    settingsService.updateSetting('soundEnabled', true);

    // Preload first
    service.preload();

    // Get the cached mock for click
    const clickMock = createdMocks.find((m) => m.src === SOUND_PATHS[SoundEffect.click]);
    expect(clickMock).toBeTruthy();

    const cloneSpy = vi.spyOn(clickMock!, 'cloneNode');

    service.play(SoundEffect.click);

    expect(cloneSpy).toHaveBeenCalledWith(true);
  });
});
