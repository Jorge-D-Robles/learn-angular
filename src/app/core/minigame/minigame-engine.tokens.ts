import { InjectionToken } from '@angular/core';
import type { MinigameEngine } from './minigame-engine';

export const MINIGAME_ENGINE = new InjectionToken<MinigameEngine<unknown>>('MINIGAME_ENGINE');
