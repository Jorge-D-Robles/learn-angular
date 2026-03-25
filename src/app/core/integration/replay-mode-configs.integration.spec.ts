import { TestBed } from '@angular/core/testing';
import { SPEED_RUN_CONFIG } from '../minigame/speed-run.service';
import { MinigameRegistryService } from '../minigame/minigame-registry.service';
import type { MinigameId } from '../minigame/minigame.types';

const ALL_MINIGAME_IDS: MinigameId[] = [
  'module-assembly', 'wire-protocol', 'flow-commander', 'signal-corps',
  'corridor-runner', 'terminal-hack', 'power-grid', 'data-relay',
  'reactor-core', 'deep-space-radio', 'system-certification', 'blast-doors',
];

describe('Replay mode configuration loading per minigame', () => {
  beforeEach(() => { TestBed.configureTestingModule({}); });

  it('all 12 minigame IDs have SpeedRunConfig entries', () => {
    for (const gameId of ALL_MINIGAME_IDS) {
      expect(SPEED_RUN_CONFIG[gameId]).toBeTruthy();
    }
  });

  it('all speed run configs have positive par times', () => {
    for (const gameId of ALL_MINIGAME_IDS) {
      expect(SPEED_RUN_CONFIG[gameId].parTime).toBeGreaterThan(0);
    }
  });

  it('all speed run configs have positive total levels', () => {
    for (const gameId of ALL_MINIGAME_IDS) {
      expect(SPEED_RUN_CONFIG[gameId].totalLevels).toBeGreaterThan(0);
    }
  });

  it('Module Assembly par time is 180 seconds', () => {
    expect(SPEED_RUN_CONFIG['module-assembly'].parTime).toBe(180);
  });

  it('Module Assembly speed run has 10 levels', () => {
    expect(SPEED_RUN_CONFIG['module-assembly'].totalLevels).toBe(10);
  });

  it('all 12 minigames are registered in MinigameRegistryService', () => {
    const registry = TestBed.inject(MinigameRegistryService);
    for (const gameId of ALL_MINIGAME_IDS) {
      expect(registry.getConfig(gameId)).toBeTruthy();
    }
  });

  it('unknown gameId is not in SPEED_RUN_CONFIG', () => {
    const unknownId = 'unknown-game' as MinigameId;
    expect(SPEED_RUN_CONFIG[unknownId]).toBeUndefined();
  });
});
