import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MinigameRegistryService } from '../../core/minigame/minigame-registry.service';
import { ModuleAssemblyComponent } from '../../features/minigames/module-assembly';
import { ModuleAssemblyEngine } from '../../features/minigames/module-assembly';
import { WireProtocolComponent } from '../../features/minigames/wire-protocol/wire-protocol.component';
import { WireProtocolEngine } from '../../features/minigames/wire-protocol/wire-protocol.engine';
import { FlowCommanderComponent, FlowCommanderEngine } from '../../features/minigames/flow-commander';
import { SignalCorpsComponent, SignalCorpsEngine } from '../../features/minigames/signal-corps';
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
});
