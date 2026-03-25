import { TestBed } from '@angular/core/testing';
import type { ActivatedRouteSnapshot } from '@angular/router';
import { MinigameRegistryService } from '../minigame/minigame-registry.service';
import {
  endlessTitleResolver,
  speedRunTitleResolver,
  dailyChallengeTitleResolver,
} from './replay-title.resolver';

function createMockRoute(gameId: string): ActivatedRouteSnapshot {
  return {
    paramMap: {
      get: (key: string) => (key === 'gameId' ? gameId : null),
      has: (key: string) => key === 'gameId',
      getAll: () => [],
      keys: ['gameId'],
    },
  } as unknown as ActivatedRouteSnapshot;
}

describe('Replay title resolvers', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  describe('endlessTitleResolver', () => {
    it('should return "[Game Name] - Endless Mode" for a known game', () => {
      const route = createMockRoute('module-assembly');
      const title = TestBed.runInInjectionContext(() => endlessTitleResolver(route, {} as any));
      expect(title).toBe('Module Assembly - Endless Mode');
    });

    it('should use gameId as fallback for unknown game', () => {
      const route = createMockRoute('unknown-game');
      const title = TestBed.runInInjectionContext(() => endlessTitleResolver(route, {} as any));
      expect(title).toBe('unknown-game - Endless Mode');
    });
  });

  describe('speedRunTitleResolver', () => {
    it('should return "[Game Name] - Speed Run" for a known game', () => {
      const route = createMockRoute('wire-protocol');
      const title = TestBed.runInInjectionContext(() => speedRunTitleResolver(route, {} as any));
      expect(title).toBe('Wire Protocol - Speed Run');
    });
  });

  describe('dailyChallengeTitleResolver', () => {
    it('should return "[Game Name] - Daily Challenge" for a known game', () => {
      const route = createMockRoute('flow-commander');
      const title = TestBed.runInInjectionContext(() => dailyChallengeTitleResolver(route, {} as any));
      expect(title).toBe('Flow Commander - Daily Challenge');
    });
  });
});
