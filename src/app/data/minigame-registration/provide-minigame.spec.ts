import { ApplicationInitStatus, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MinigameRegistryService } from '../../core/minigame/minigame-registry.service';
import { ModuleAssemblyComponent } from '../../features/minigames/module-assembly';
import { ModuleAssemblyEngine } from '../../features/minigames/module-assembly';
import { WireProtocolComponent } from '../../features/minigames/wire-protocol/wire-protocol.component';
import { WireProtocolEngine } from '../../features/minigames/wire-protocol/wire-protocol.engine';
import { FlowCommanderComponent, FlowCommanderEngine } from '../../features/minigames/flow-commander';
import { SignalCorpsComponent, SignalCorpsEngine } from '../../features/minigames/signal-corps';
import { CorridorRunnerComponent, CorridorRunnerEngine } from '../../features/minigames/corridor-runner';
import type { MinigameId } from '../../core/minigame/minigame.types';
import { getMinigameTutorial } from '../tutorials/minigame-tutorials.data';
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

  it('should include tutorialSteps for module-assembly after registration', () => {
    const config = registry.getConfig('module-assembly');
    expect(config!.tutorialSteps).toBeDefined();
    expect(config!.tutorialSteps!.length).toBe(3);
    const tutorial = getMinigameTutorial('module-assembly');
    expect(config!.tutorialSteps![0].title).toBe(tutorial!.steps[0].title);
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

  it('should include tutorialSteps for wire-protocol after registration', () => {
    const config = registry.getConfig('wire-protocol');
    expect(config!.tutorialSteps).toBeDefined();
    expect(config!.tutorialSteps!.length).toBe(4);
  });
});

describe('provideMinigame — flow-commander', () => {
  let registry: MinigameRegistryService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideMinigame(
          'flow-commander',
          FlowCommanderComponent,
          () => new FlowCommanderEngine(),
        ),
      ],
    });

    await TestBed.inject(ApplicationInitStatus).donePromise;
    registry = TestBed.inject(MinigameRegistryService);
  });

  it('should register the component type for flow-commander', () => {
    expect(registry.getComponent('flow-commander')).toBe(FlowCommanderComponent);
  });

  it('should register an engine factory that produces a FlowCommanderEngine', () => {
    const factory = registry.getEngineFactory('flow-commander');
    expect(factory).toBeTruthy();
    const engine = factory!();
    expect(engine).toBeInstanceOf(FlowCommanderEngine);
  });

  it('should preserve the existing config for flow-commander', () => {
    const config = registry.getConfig('flow-commander');
    expect(config).toBeDefined();
    expect(config!.name).toBe('Flow Commander');
  });

  it('should include tutorialSteps for flow-commander after registration', () => {
    const config = registry.getConfig('flow-commander');
    expect(config!.tutorialSteps).toBeDefined();
    expect(config!.tutorialSteps!.length).toBe(4);
  });
});

describe('provideMinigame — signal-corps', () => {
  let registry: MinigameRegistryService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideMinigame(
          'signal-corps',
          SignalCorpsComponent,
          () => new SignalCorpsEngine(),
        ),
      ],
    });

    await TestBed.inject(ApplicationInitStatus).donePromise;
    registry = TestBed.inject(MinigameRegistryService);
  });

  it('should register the component type for signal-corps', () => {
    expect(registry.getComponent('signal-corps')).toBe(SignalCorpsComponent);
  });

  it('should register an engine factory that produces a SignalCorpsEngine', () => {
    const factory = registry.getEngineFactory('signal-corps');
    expect(factory).toBeTruthy();
    const engine = factory!();
    expect(engine).toBeInstanceOf(SignalCorpsEngine);
  });

  it('should preserve the existing config for signal-corps', () => {
    const config = registry.getConfig('signal-corps');
    expect(config).toBeDefined();
    expect(config!.name).toBe('Signal Corps');
  });

  it('should include tutorialSteps for signal-corps after registration', () => {
    const config = registry.getConfig('signal-corps');
    expect(config!.tutorialSteps).toBeDefined();
    expect(config!.tutorialSteps!.length).toBe(4);
  });
});

describe('provideMinigame — corridor-runner', () => {
  let registry: MinigameRegistryService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideMinigame(
          'corridor-runner',
          CorridorRunnerComponent,
          () => new CorridorRunnerEngine(),
        ),
      ],
    });

    await TestBed.inject(ApplicationInitStatus).donePromise;
    registry = TestBed.inject(MinigameRegistryService);
  });

  it('should register the component type for corridor-runner', () => {
    expect(registry.getComponent('corridor-runner')).toBe(CorridorRunnerComponent);
  });

  it('should register an engine factory that produces a CorridorRunnerEngine', () => {
    const factory = registry.getEngineFactory('corridor-runner');
    expect(factory).toBeTruthy();
    const engine = factory!();
    expect(engine).toBeInstanceOf(CorridorRunnerEngine);
  });

  it('should preserve the existing config for corridor-runner', () => {
    const config = registry.getConfig('corridor-runner');
    expect(config).toBeDefined();
    expect(config!.name).toBe('Corridor Runner');
  });
});

describe('provideMinigame — game without tutorial data', () => {
  let registry: MinigameRegistryService;

  @Component({ selector: 'app-stub', template: '' })
  class StubComponent {}

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideMinigame(
          'corridor-runner',
          StubComponent,
          () => new ModuleAssemblyEngine(),
        ),
      ],
    });

    await TestBed.inject(ApplicationInitStatus).donePromise;
    registry = TestBed.inject(MinigameRegistryService);
  });

  it('should NOT include tutorialSteps for games without tutorial data', () => {
    const config = registry.getConfig('corridor-runner');
    expect(config).toBeDefined();
    expect(config!.tutorialSteps).toBeUndefined();
  });
});
