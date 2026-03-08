import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MinigameRegistryService } from '../../core/minigame/minigame-registry.service';
import { ModuleAssemblyComponent } from '../../features/minigames/module-assembly';
import { ModuleAssemblyEngine } from '../../features/minigames/module-assembly';
import { WireProtocolComponent } from '../../features/minigames/wire-protocol/wire-protocol.component';
import { WireProtocolEngine } from '../../features/minigames/wire-protocol/wire-protocol.engine';
import { MinigameEngine, type ActionResult } from '../../core/minigame/minigame-engine';
import type { MinigameId } from '../../core/minigame/minigame.types';
import { provideMinigame, provideMinigameEngine } from './provide-minigame';

class TestEngine extends MinigameEngine<unknown> {
  constructor() { super({ initialLives: 3, timerDuration: null }); }
  protected onLevelLoad(): void { /* stub */ }
  protected onStart(): void { /* stub */ }
  protected onComplete(): void { /* stub */ }
  protected validateAction(): ActionResult {
    return { valid: true, scoreChange: 0, livesChange: 0 };
  }
}

describe('provideMinigame', () => {
  let registry: MinigameRegistryService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideMinigame(
          'module-assembly',
          ModuleAssemblyComponent,
          () => new ModuleAssemblyEngine(),
        ),
      ],
    });

    await TestBed.inject(ApplicationInitStatus).donePromise;
    registry = TestBed.inject(MinigameRegistryService);
  });

  it('should register the component type for module-assembly', () => {
    expect(registry.getComponent('module-assembly')).toBe(ModuleAssemblyComponent);
  });

  it('should register an engine factory that produces a ModuleAssemblyEngine', () => {
    const factory = registry.getEngineFactory('module-assembly');
    expect(factory).toBeTruthy();
    const engine = factory!();
    expect(engine).toBeInstanceOf(ModuleAssemblyEngine);
  });

  it('should preserve the existing config for module-assembly', () => {
    const config = registry.getConfig('module-assembly');
    expect(config).toBeDefined();
    expect(config!.name).toBe('Module Assembly');
    expect(config!.scoreConfig).toEqual({
      timeWeight: 10,
      accuracyWeight: 100,
      comboWeight: 25,
      maxScore: 1000,
    });
  });

  it('should throw for a non-existent game ID', () => {
    expect(() =>
      provideMinigame(
        'nonexistent' as MinigameId,
        ModuleAssemblyComponent,
        () => new ModuleAssemblyEngine(),
      ),
    ).toThrowError(/No default config found/);
  });
});

describe('provideMinigame — wire-protocol', () => {
  let registry: MinigameRegistryService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideMinigame(
          'wire-protocol',
          WireProtocolComponent,
          () => new WireProtocolEngine(),
        ),
      ],
    });

    await TestBed.inject(ApplicationInitStatus).donePromise;
    registry = TestBed.inject(MinigameRegistryService);
  });

  it('should register the component type for wire-protocol', () => {
    expect(registry.getComponent('wire-protocol')).toBe(WireProtocolComponent);
  });

  it('should register an engine factory that produces a WireProtocolEngine', () => {
    const factory = registry.getEngineFactory('wire-protocol');
    expect(factory).toBeTruthy();
    const engine = factory!();
    expect(engine).toBeInstanceOf(WireProtocolEngine);
  });

  it('should preserve the existing config for wire-protocol', () => {
    const config = registry.getConfig('wire-protocol');
    expect(config).toBeDefined();
    expect(config!.name).toBe('Wire Protocol');
  });
});

describe('provideMinigameEngine', () => {
  let registry: MinigameRegistryService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideMinigameEngine('signal-corps', () => new TestEngine()),
      ],
    });

    await TestBed.inject(ApplicationInitStatus).donePromise;
    registry = TestBed.inject(MinigameRegistryService);
  });

  it('should register engine factory that produces a TestEngine', () => {
    const factory = registry.getEngineFactory('signal-corps');
    expect(factory).toBeTruthy();
    const engine = factory!();
    expect(engine).toBeInstanceOf(TestEngine);
  });

  it('should register null component for engine-only registration', () => {
    expect(registry.getComponent('signal-corps')).toBeNull();
  });

  it('should preserve the existing config for the game', () => {
    const config = registry.getConfig('signal-corps');
    expect(config).toBeDefined();
    expect(config!.name).toBe('Signal Corps');
  });

  it('should throw for a non-existent game ID', () => {
    expect(() =>
      provideMinigameEngine(
        'nonexistent' as MinigameId,
        () => new TestEngine(),
      ),
    ).toThrowError(/No default config found/);
  });
});
