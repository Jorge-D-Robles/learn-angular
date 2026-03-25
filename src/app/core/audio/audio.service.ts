import { inject, Injectable, signal } from '@angular/core';
import { SettingsService } from '../settings/settings.service';

export enum SoundEffect {
  correct = 'correct',
  incorrect = 'incorrect',
  complete = 'complete',
  fail = 'fail',
  levelUp = 'levelUp',
  rankUp = 'rankUp',
  hint = 'hint',
  click = 'click',
  tick = 'tick',
  achievement = 'achievement',
  missionComplete = 'missionComplete',
}

const AUDIO_BASE_PATH = 'audio/';

export const SOUND_PATHS: Record<SoundEffect, string> = {
  [SoundEffect.correct]: `${AUDIO_BASE_PATH}correct.mp3`,
  [SoundEffect.incorrect]: `${AUDIO_BASE_PATH}incorrect.mp3`,
  [SoundEffect.complete]: `${AUDIO_BASE_PATH}complete.mp3`,
  [SoundEffect.fail]: `${AUDIO_BASE_PATH}fail.mp3`,
  [SoundEffect.levelUp]: `${AUDIO_BASE_PATH}levelUp.mp3`,
  [SoundEffect.rankUp]: `${AUDIO_BASE_PATH}rankUp.mp3`,
  [SoundEffect.hint]: `${AUDIO_BASE_PATH}hint.mp3`,
  [SoundEffect.click]: `${AUDIO_BASE_PATH}click.mp3`,
  [SoundEffect.tick]: `${AUDIO_BASE_PATH}tick.mp3`,
  [SoundEffect.achievement]: `${AUDIO_BASE_PATH}achievement.mp3`,
  [SoundEffect.missionComplete]: `${AUDIO_BASE_PATH}missionComplete.mp3`,
};

@Injectable({ providedIn: 'root' })
export class AudioService {
  private readonly settings = inject(SettingsService);
  private readonly _cache = new Map<SoundEffect, HTMLAudioElement>();
  private _preloaded = false;

  private readonly _volume = signal(0.5);
  readonly volume = this._volume.asReadonly();

  setVolume(v: number): void {
    this._volume.set(Math.max(0, Math.min(1, v)));
  }

  preload(): void {
    if (this._preloaded) return;
    this._preloaded = true;

    if (typeof window === 'undefined') return;

    for (const [effect, path] of Object.entries(SOUND_PATHS)) {
      const audio = new Audio(path);
      audio.preload = 'auto';
      this._cache.set(effect as SoundEffect, audio);
    }
  }

  play(soundId: SoundEffect): void {
    if (!this.settings.settings().soundEnabled) return;
    if (typeof window === 'undefined') return;

    this.preload();

    const cached = this._cache.get(soundId);
    if (!cached) return;

    const clone = cached.cloneNode(true) as HTMLAudioElement;
    clone.volume = this._volume();
    clone.play().catch((err: unknown) => {
      console.warn('AudioService: failed to play sound', soundId, err);
    });
  }
}
