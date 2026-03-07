import { TestBed } from '@angular/core/testing';
import { GameStateService } from './game-state.service';
import { getRankForXp } from './rank.constants';

describe('getRankForXp', () => {
  it('should return Cadet for 0 XP', () => {
    expect(getRankForXp(0)).toBe('Cadet');
  });

  it('should return Cadet for 499 XP', () => {
    expect(getRankForXp(499)).toBe('Cadet');
  });

  it('should return Ensign for exactly 500 XP', () => {
    expect(getRankForXp(500)).toBe('Ensign');
  });

  it('should return Lieutenant for 1500 XP', () => {
    expect(getRankForXp(1_500)).toBe('Lieutenant');
  });

  it('should return Fleet Admiral for 25000 XP', () => {
    expect(getRankForXp(25_000)).toBe('Fleet Admiral');
  });

  it('should return Fleet Admiral for XP above 25000', () => {
    expect(getRankForXp(99_999)).toBe('Fleet Admiral');
  });
});

describe('GameStateService', () => {
  let service: GameStateService;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameStateService);
  });

  // --- Initialization ---

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should default playerName to empty string', () => {
    expect(service.playerName()).toBe('');
  });

  it('should default totalXp to 0', () => {
    expect(service.totalXp()).toBe(0);
  });

  it('should default currentRank to Cadet', () => {
    expect(service.currentRank()).toBe('Cadet');
  });

  // --- Mutation: setPlayerName ---

  it('should update playerName when setPlayerName is called', () => {
    service.setPlayerName('Commander Riker');
    expect(service.playerName()).toBe('Commander Riker');
  });

  it('should trim whitespace from player name', () => {
    service.setPlayerName('  trimmed  ');
    expect(service.playerName()).toBe('trimmed');
  });

  it('should not update playerName when given an empty string', () => {
    service.setPlayerName('Initial');
    service.setPlayerName('');
    expect(service.playerName()).toBe('Initial');
  });

  // --- Mutation: addXp ---

  it('should increase totalXp when addXp is called', () => {
    service.addXp(100);
    expect(service.totalXp()).toBe(100);
  });

  it('should accumulate XP across multiple addXp calls', () => {
    service.addXp(100);
    service.addXp(100);
    expect(service.totalXp()).toBe(200);
  });

  it('should not change totalXp when addXp is called with 0', () => {
    service.addXp(0);
    expect(service.totalXp()).toBe(0);
  });

  it('should not change totalXp when addXp is called with a negative value', () => {
    service.addXp(-10);
    expect(service.totalXp()).toBe(0);
  });

  // --- Computed signal reactivity ---

  it('should return Cadet rank at 0 XP', () => {
    expect(service.currentRank()).toBe('Cadet');
  });

  it('should return Ensign rank after adding 500 XP', () => {
    service.addXp(500);
    expect(service.currentRank()).toBe('Ensign');
  });

  it('should return Lieutenant rank after adding 1500 XP', () => {
    service.addXp(1_500);
    expect(service.currentRank()).toBe('Lieutenant');
  });

  it('should return Fleet Admiral rank after adding 25000 XP', () => {
    service.addXp(25_000);
    expect(service.currentRank()).toBe('Fleet Admiral');
  });

  it('should update currentRank reactively when XP crosses a threshold', () => {
    service.addXp(400);
    expect(service.currentRank()).toBe('Cadet');

    service.addXp(100);
    expect(service.currentRank()).toBe('Ensign');
  });

  // --- Reset ---

  it('should restore all values to defaults when resetState is called', () => {
    service.setPlayerName('Picard');
    service.addXp(5_000);
    service.resetState();

    expect(service.playerName()).toBe('');
    expect(service.totalXp()).toBe(0);
    expect(service.currentRank()).toBe('Cadet');
  });

  // --- Read-only enforcement ---

  it('should throw when attempting to set playerName directly', () => {
    expect(() => (service.playerName as any).set('x')).toThrow();
  });

  it('should throw when attempting to set totalXp directly', () => {
    expect(() => (service.totalXp as any).set(999)).toThrow();
  });
});
