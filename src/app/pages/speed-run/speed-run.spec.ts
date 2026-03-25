import { signal, WritableSignal } from '@angular/core';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { createComponent, getMockProvider } from '../../../testing/test-utils';
import { SpeedRunPage } from './speed-run';
import { SpeedRunService, type SpeedRunSession } from '../../core/minigame/speed-run.service';
import { MinigameRegistryService } from '../../core/minigame/minigame-registry.service';
import { PlayMode } from '../../core/minigame/minigame.types';

function mockActivatedRoute(params: Record<string, string> = {}) {
  return {
    provide: ActivatedRoute,
    useValue: { paramMap: of(convertToParamMap(params)) },
  };
}

function makeSession(overrides: Partial<SpeedRunSession> = {}): SpeedRunSession {
  return {
    gameId: 'module-assembly',
    startTime: Date.now() - 60_000,
    elapsedTime: 60,
    parTime: 180,
    levelsCompleted: 3,
    totalLevels: 10,
    isActive: true,
    splitTimes: [15, 35, 60],
    ...overrides,
  };
}

interface SetupOptions {
  gameId?: string;
  session?: SpeedRunSession | null;
  bestTime?: number | null;
  parTime?: number;
  gameName?: string;
  configExists?: boolean;
  totalLevels?: number;
}

async function setup(options: SetupOptions = {}) {
  const {
    gameId = 'module-assembly',
    session = null,
    bestTime = null,
    parTime = 180,
    gameName = 'Module Assembly',
    configExists = true,
    totalLevels = 10,
  } = options;

  const sessionSignal: WritableSignal<SpeedRunSession | null> = signal(session);
  const startRunFn = vi.fn();
  const endRunFn = vi.fn().mockReturnValue({
    finalTime: 150,
    isNewBestTime: false,
    underPar: true,
  });
  const navigateFn = vi.fn();

  const result = await createComponent(SpeedRunPage, {
    providers: [
      mockActivatedRoute({ gameId }),
      getMockProvider(SpeedRunService, {
        session: sessionSignal.asReadonly(),
        startRun: startRunFn,
        endRun: endRunFn,
        getBestTime: vi.fn().mockReturnValue(bestTime),
        getParTime: vi.fn().mockReturnValue(parTime),
      }),
      getMockProvider(MinigameRegistryService, {
        getConfig: vi.fn().mockReturnValue(
          configExists
            ? { id: gameId, name: gameName, totalLevels: 18 }
            : undefined,
        ),
      }),
      getMockProvider(Router, { navigate: navigateFn }),
    ],
  });

  return {
    ...result,
    sessionSignal,
    startRunFn,
    endRunFn,
    navigateFn,
    totalLevels,
  };
}

describe('SpeedRunPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --- 1. Component creation ---
  describe('Component creation', () => {
    it('should create the component with valid gameId', async () => {
      const { component } = await setup();
      expect(component).toBeTruthy();
    });

    it('should derive gameId from route params', async () => {
      const { component } = await setup({ gameId: 'wire-protocol' });
      expect(component.gameId()).toBe('wire-protocol');
    });
  });

  // --- 2. Pre-run state ---
  describe('Pre-run state', () => {
    it('should render pre-run view when session is null', async () => {
      const { element } = await setup({ session: null });
      expect(element.querySelector('.speed-run--pre-run')).toBeTruthy();
      expect(element.querySelector('.speed-run--in-run')).toBeNull();
      expect(element.querySelector('.speed-run--post-run')).toBeNull();
    });

    it('should display par time formatted', async () => {
      const { element } = await setup({ parTime: 180 });
      const parEl = element.querySelector('.speed-run__par-time');
      expect(parEl?.textContent).toContain('3:00');
    });

    it('should display personal best time when one exists', async () => {
      const { element } = await setup({ bestTime: 150 });
      const bestEl = element.querySelector('.speed-run__best-time');
      expect(bestEl?.textContent).toContain('2:30');
    });

    it('should display "No best time" when getBestTime returns null', async () => {
      const { element } = await setup({ bestTime: null });
      const bestEl = element.querySelector('.speed-run__best-time');
      expect(bestEl?.textContent).toContain('No best time');
    });

    it('should display minigame name from registry', async () => {
      const { element } = await setup({ gameName: 'Module Assembly' });
      const nameEl = element.querySelector('.speed-run__game-name');
      expect(nameEl?.textContent).toContain('Module Assembly');
    });

    it('should call startRun on "Start Run" button click', async () => {
      const { element, fixture, startRunFn } = await setup();
      const btn = element.querySelector('.speed-run__start-btn') as HTMLButtonElement;
      expect(btn).toBeTruthy();
      btn.click();
      fixture.detectChanges();
      expect(startRunFn).toHaveBeenCalledWith('module-assembly');
    });

    it('should display total levels from SPEED_RUN_CONFIG', async () => {
      const { element } = await setup({ gameId: 'module-assembly' });
      const levelsEl = element.querySelector('.speed-run__level-count');
      // SPEED_RUN_CONFIG['module-assembly'].totalLevels = 10
      expect(levelsEl?.textContent).toContain('10');
    });
  });

  // --- 3. Invalid gameId ---
  describe('Invalid gameId', () => {
    it('should show error state when gameId is not valid', async () => {
      const { element } = await setup({
        gameId: 'nonexistent-game',
        configExists: false,
      });
      const errorEl = element.querySelector('.speed-run--error');
      expect(errorEl).toBeTruthy();
      expect(errorEl?.textContent).toContain('not available');
    });
  });

  // --- 4. In-run state ---
  describe('In-run state', () => {
    it('should render in-run view when session is active', async () => {
      const { element } = await setup({ session: makeSession() });
      expect(element.querySelector('.speed-run--in-run')).toBeTruthy();
      expect(element.querySelector('.speed-run--pre-run')).toBeNull();
    });

    it('should display level progress "X / Y levels"', async () => {
      const { element } = await setup({
        session: makeSession({ levelsCompleted: 3, totalLevels: 10 }),
      });
      const progressEl = element.querySelector('.speed-run__level-progress');
      expect(progressEl?.textContent).toContain('3 / 10');
    });

    it('should display elapsed timer', async () => {
      const { component, fixture, element } = await setup({
        session: makeSession(),
      });
      // Set liveElapsedTime directly for testability
      component.liveElapsedTime.set(90.5);
      fixture.detectChanges();
      const timerEl = element.querySelector('.speed-run__timer');
      expect(timerEl?.textContent).toContain('01:30.5');
    });

    it('should display split times list when levels are completed', async () => {
      const { element } = await setup({
        session: makeSession({ splitTimes: [15, 35, 60], levelsCompleted: 3 }),
      });
      const splits = element.querySelectorAll('.speed-run__split-item');
      expect(splits.length).toBe(3);
    });
  });

  // --- 5. Timer color ---
  describe('Timer color', () => {
    it('should have timer--under-par class when elapsed < 80% of par', async () => {
      const { component, fixture, element } = await setup({
        session: makeSession({ parTime: 180 }),
      });
      // 80% of 180 = 144. Set elapsed to 100 (under 80%).
      component.liveElapsedTime.set(100);
      fixture.detectChanges();
      const timerEl = element.querySelector('.speed-run__timer');
      expect(timerEl?.classList.contains('timer--under-par')).toBe(true);
    });

    it('should have timer--near-par class when elapsed >= 80% and < 100% of par', async () => {
      const { component, fixture, element } = await setup({
        session: makeSession({ parTime: 180 }),
      });
      // 80% of 180 = 144. Set elapsed to 160 (near par).
      component.liveElapsedTime.set(160);
      fixture.detectChanges();
      const timerEl = element.querySelector('.speed-run__timer');
      expect(timerEl?.classList.contains('timer--near-par')).toBe(true);
    });

    it('should have timer--over-par class when elapsed >= par', async () => {
      const { component, fixture, element } = await setup({
        session: makeSession({ parTime: 180 }),
      });
      component.liveElapsedTime.set(200);
      fixture.detectChanges();
      const timerEl = element.querySelector('.speed-run__timer');
      expect(timerEl?.classList.contains('timer--over-par')).toBe(true);
    });
  });

  // --- 6. Post-run state ---
  describe('Post-run state', () => {
    it('should render post-run view when session exists but is not active', async () => {
      const { element } = await setup({
        session: makeSession({ isActive: false }),
      });
      expect(element.querySelector('.speed-run--post-run')).toBeTruthy();
      expect(element.querySelector('.speed-run--in-run')).toBeNull();
    });

    it('should display final time from endRunResult', async () => {
      const { component, fixture, element } = await setup({
        session: makeSession({ isActive: false }),
      });
      component.endRunResult.set({ finalTime: 150, isNewBestTime: false, underPar: true });
      fixture.detectChanges();
      const finalTimeEl = element.querySelector('.speed-run__final-time');
      expect(finalTimeEl?.textContent).toContain('02:30.0');
    });

    it('should display "New Best!" badge when isNewBestTime is true', async () => {
      const { component, fixture, element } = await setup({
        session: makeSession({ isActive: false }),
      });
      component.endRunResult.set({ finalTime: 150, isNewBestTime: true, underPar: true });
      fixture.detectChanges();
      const badge = element.querySelector('.speed-run__new-best');
      expect(badge).toBeTruthy();
      expect(badge?.textContent).toContain('New Best!');
    });

    it('should display split times breakdown with per-level deltas', async () => {
      const { element } = await setup({
        session: makeSession({
          isActive: false,
          splitTimes: [15, 35, 60],
          levelsCompleted: 3,
        }),
      });
      const splits = element.querySelectorAll('.speed-run__split-item');
      expect(splits.length).toBe(3);
      // First split delta = 15, second = 35-15 = 20, third = 60-35 = 25
      expect(splits[0]?.textContent).toContain('00:15.0');
      expect(splits[1]?.textContent).toContain('00:20.0');
      expect(splits[2]?.textContent).toContain('00:25.0');
    });

    it('should show par comparison indicator', async () => {
      const { component, fixture, element } = await setup({
        session: makeSession({ isActive: false }),
      });
      component.endRunResult.set({ finalTime: 150, isNewBestTime: false, underPar: true });
      fixture.detectChanges();
      const parIndicator = element.querySelector('.speed-run__par-indicator');
      expect(parIndicator?.textContent).toContain('Under Par');
    });
  });

  // --- 7. Navigation ---
  describe('Navigation', () => {
    it('should call startRun on "Retry" button from post-run', async () => {
      const { element, fixture, startRunFn } = await setup({
        session: makeSession({ isActive: false }),
      });
      const retryBtn = element.querySelector('.speed-run__retry-btn') as HTMLButtonElement;
      expect(retryBtn).toBeTruthy();
      retryBtn.click();
      fixture.detectChanges();
      expect(startRunFn).toHaveBeenCalledWith('module-assembly');
    });

    it('should navigate to /minigames/:gameId on "Back" button', async () => {
      const { element, fixture, navigateFn } = await setup({
        session: makeSession({ isActive: false }),
      });
      const backBtn = element.querySelector('.speed-run__back-btn') as HTMLButtonElement;
      expect(backBtn).toBeTruthy();
      backBtn.click();
      fixture.detectChanges();
      expect(navigateFn).toHaveBeenCalledWith(['/minigames', 'module-assembly']);
    });

    it('should have playMode set to PlayMode.SpeedRun', async () => {
      const { component } = await setup();
      expect(component.playMode).toBe(PlayMode.SpeedRun);
    });
  });

  // --- 8. Cleanup ---
  describe('Cleanup', () => {
    it('should cancel RAF loop on destroy', async () => {
      const cancelSpy = vi.spyOn(globalThis, 'cancelAnimationFrame');
      const { component, fixture } = await setup({
        session: makeSession(),
      });
      // Start the RAF loop by triggering the run
      component.liveElapsedTime.set(10);
      fixture.detectChanges();
      fixture.destroy();
      // The destroy hook should have called cancelAnimationFrame
      expect(cancelSpy).toHaveBeenCalled();
    });
  });
});
