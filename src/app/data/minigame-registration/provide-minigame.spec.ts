import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MinigameRegistryService } from '../../core/minigame/minigame-registry.service';
import { ModuleAssemblyComponent } from '../../features/minigames/module-assembly';
import { ModuleAssemblyEngine } from '../../features/minigames/module-assembly';
import type { MinigameId } from '../../core/minigame/minigame.types';
import { provideMinigame } from './provide-minigame';

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
