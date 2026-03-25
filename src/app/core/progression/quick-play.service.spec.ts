import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { QuickPlayService } from './quick-play.service';
import { GameProgressionService } from './game-progression.service';
import { PlayTimeService } from './play-time.service';
import { MasteryService } from './mastery.service';
import type { MinigameId } from '../minigame/minigame.types';

describe('QuickPlayService', () => {
  let service: QuickPlayService;
  let mockProgression: { getUnlockedMinigames: ReturnType<typeof vi.fn> };
  let mockPlayTime: { getMinigamePlayTime: ReturnType<typeof vi.fn> };
  let mockMastery: { getMastery: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockProgression = {
      getUnlockedMinigames: vi.fn().mockReturnValue([]),
    };

    mockPlayTime = {
      getMinigamePlayTime: vi.fn().mockReturnValue(0),
    };

    mockMastery = {
      getMastery: vi.fn().mockReturnValue(0),
    };

    TestBed.configureTestingModule({
      providers: [
        QuickPlayService,
        { provide: GameProgressionService, useValue: mockProgression },
        { provide: PlayTimeService, useValue: mockPlayTime },
        { provide: MasteryService, useValue: mockMastery },
      ],
    });

    service = TestBed.inject(QuickPlayService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return empty array when no games are unlocked', () => {
    mockProgression.getUnlockedMinigames.mockReturnValue([]);

    const result = service.getRecommendedGames(4);

    expect(result).toEqual([]);
  });

  it('should return unlocked games up to count', () => {
    mockProgression.getUnlockedMinigames.mockReturnValue([
      'module-assembly' as MinigameId,
      'wire-protocol' as MinigameId,
    ]);

    const result = service.getRecommendedGames(4);

    expect(result).toHaveLength(2);
  });

  it('should limit results to requested count', () => {
    mockProgression.getUnlockedMinigames.mockReturnValue([
      'module-assembly' as MinigameId,
      'wire-protocol' as MinigameId,
      'flow-commander' as MinigameId,
      'signal-corps' as MinigameId,
      'corridor-runner' as MinigameId,
    ]);

    const result = service.getRecommendedGames(3);

    expect(result).toHaveLength(3);
  });

  it('should prioritize recently played games', () => {
    mockProgression.getUnlockedMinigames.mockReturnValue([
      'module-assembly' as MinigameId,
      'wire-protocol' as MinigameId,
      'flow-commander' as MinigameId,
    ]);

    mockPlayTime.getMinigamePlayTime.mockImplementation((id: MinigameId) => {
      if (id === 'flow-commander') return 300;
      if (id === 'module-assembly') return 100;
      return 0;
    });

    const result = service.getRecommendedGames(4);

    // flow-commander has most play time, then module-assembly, then wire-protocol (unplayed)
    expect(result[0]).toBe('flow-commander');
    expect(result[1]).toBe('module-assembly');
    expect(result[2]).toBe('wire-protocol');
  });

  it('should place unplayed games after played games', () => {
    mockProgression.getUnlockedMinigames.mockReturnValue([
      'module-assembly' as MinigameId,
      'wire-protocol' as MinigameId,
      'flow-commander' as MinigameId,
    ]);

    mockPlayTime.getMinigamePlayTime.mockImplementation((id: MinigameId) => {
      if (id === 'module-assembly') return 50;
      return 0; // wire-protocol and flow-commander unplayed
    });

    const result = service.getRecommendedGames(4);

    expect(result[0]).toBe('module-assembly'); // played
    // Unplayed games come after
    expect(result.includes('wire-protocol' as MinigameId)).toBe(true);
    expect(result.includes('flow-commander' as MinigameId)).toBe(true);
  });

  it('should sort unplayed games by lowest mastery first', () => {
    mockProgression.getUnlockedMinigames.mockReturnValue([
      'module-assembly' as MinigameId,
      'wire-protocol' as MinigameId,
      'flow-commander' as MinigameId,
    ]);

    // All unplayed
    mockPlayTime.getMinigamePlayTime.mockReturnValue(0);

    mockMastery.getMastery.mockImplementation((id: MinigameId) => {
      if (id === 'module-assembly') return 3;
      if (id === 'wire-protocol') return 1;
      if (id === 'flow-commander') return 0;
      return 0;
    });

    const result = service.getRecommendedGames(4);

    // Sorted by mastery ascending: flow-commander(0), wire-protocol(1), module-assembly(3)
    expect(result[0]).toBe('flow-commander');
    expect(result[1]).toBe('wire-protocol');
    expect(result[2]).toBe('module-assembly');
  });

  it('should only return unlocked games', () => {
    // Only 2 unlocked
    mockProgression.getUnlockedMinigames.mockReturnValue([
      'module-assembly' as MinigameId,
    ]);

    const result = service.getRecommendedGames(4);

    expect(result).toHaveLength(1);
    expect(result[0]).toBe('module-assembly');
  });
});
