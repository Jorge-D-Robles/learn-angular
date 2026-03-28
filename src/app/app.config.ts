import {
  ApplicationConfig,
  ErrorHandler,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, TitleStrategy } from '@angular/router';
import {
  LucideIconConfig,
  LucideIconProvider,
  LUCIDE_ICONS,
} from 'lucide-angular';

import { provideMonacoEditor } from 'ngx-monaco-editor-v2';
import { routes } from './app.routes';
import { GlobalErrorHandler } from './core/error';
import { NexusTitleStrategy } from './core';
import { APP_ICONS } from './shared/icons';
import { MODULE_ASSEMBLY_LEVEL_PACK } from './data/levels/module-assembly.data';
import { WIRE_PROTOCOL_LEVEL_PACK } from './data/levels/wire-protocol.data';
import { FLOW_COMMANDER_LEVEL_PACK } from './data/levels/flow-commander.data';
import { SIGNAL_CORPS_LEVEL_PACK } from './data/levels/signal-corps.data';
import { CORRIDOR_RUNNER_LEVEL_PACK } from './data/levels/corridor-runner.data';
import { provideLevelData } from './data/levels/provide-level-data';
import { provideMinigame } from './data/minigame-registration';
import { PHASE_1_MISSIONS, PHASE_2_MISSIONS, PHASE_3_MISSIONS, PHASE_4_MISSIONS, PHASE_5_MISSIONS, PHASE_6_MISSIONS, PHASE_7_MISSIONS, provideMissionContent } from './data/missions';
import { ModuleAssemblyComponent, ModuleAssemblyEngine } from './features/minigames/module-assembly';
import { WireProtocolComponent, WireProtocolEngine } from './features/minigames/wire-protocol';
import { FlowCommanderComponent, FlowCommanderEngine, FlowCommanderSimulationService } from './features/minigames/flow-commander';
import { SignalCorpsComponent, SignalCorpsEngine, SignalCorpsWaveService } from './features/minigames/signal-corps';
import { CorridorRunnerComponent, CorridorRunnerEngine, CorridorRunnerSimulationService } from './features/minigames/corridor-runner';
import { TERMINAL_HACK_LEVEL_PACK } from './data/levels/terminal-hack.data';
import { POWER_GRID_LEVEL_PACK } from './data/levels/power-grid.data';
import { DATA_RELAY_LEVEL_PACK } from './data/levels/data-relay.data';
import { REACTOR_CORE_LEVEL_PACK } from './data/levels/reactor-core.data';
import { DEEP_SPACE_RADIO_LEVEL_PACK } from './data/levels/deep-space-radio.data';
import { SYSTEM_CERTIFICATION_LEVEL_PACK } from './data/levels/system-certification.data';
import { BLAST_DOORS_LEVEL_PACK } from './data/levels/blast-doors.data';
import { TerminalHackComponent, TerminalHackEngine } from './features/minigames/terminal-hack';
import { PowerGridComponent, PowerGridEngine } from './features/minigames/power-grid';
import { DataRelayComponent, DataRelayEngine } from './features/minigames/data-relay';
import { ReactorCoreComponent, ReactorCoreEngine } from './features/minigames/reactor-core';
import { DeepSpaceRadioComponent, DeepSpaceRadioEngine } from './features/minigames/deep-space-radio';
import { SystemCertificationComponent, SystemCertificationEngine } from './features/minigames/system-certification';
import { BlastDoorsComponent, BlastDoorsEngine } from './features/minigames/blast-doors';

// Shared wave service instance: passed to the engine AND available for DI injection
// in the component. engine.reset() + waveService.loadWaves() fully resets state for replays.
const signalCorpsWaveService = new SignalCorpsWaveService();

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideRouter(routes),
    { provide: TitleStrategy, useClass: NexusTitleStrategy },
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider(APP_ICONS),
    },
    {
      provide: LucideIconConfig,
      useValue: Object.assign(new LucideIconConfig(), {
        size: 24,
        color: 'currentColor',
      }),
    },
    provideLevelData(MODULE_ASSEMBLY_LEVEL_PACK),
    provideLevelData(WIRE_PROTOCOL_LEVEL_PACK),
    provideLevelData(FLOW_COMMANDER_LEVEL_PACK),
    provideLevelData(SIGNAL_CORPS_LEVEL_PACK),
    provideLevelData(CORRIDOR_RUNNER_LEVEL_PACK),
    provideLevelData(TERMINAL_HACK_LEVEL_PACK),
    provideLevelData(POWER_GRID_LEVEL_PACK),
    provideLevelData(DATA_RELAY_LEVEL_PACK),
    provideLevelData(REACTOR_CORE_LEVEL_PACK),
    provideLevelData(DEEP_SPACE_RADIO_LEVEL_PACK),
    provideLevelData(SYSTEM_CERTIFICATION_LEVEL_PACK),
    provideLevelData(BLAST_DOORS_LEVEL_PACK),
    provideMissionContent(PHASE_1_MISSIONS),
    provideMissionContent(PHASE_2_MISSIONS),
    provideMissionContent(PHASE_3_MISSIONS),
    provideMissionContent(PHASE_4_MISSIONS),
    provideMissionContent(PHASE_5_MISSIONS),
    provideMissionContent(PHASE_6_MISSIONS),
    provideMissionContent(PHASE_7_MISSIONS),
    provideMinigame('wire-protocol', WireProtocolComponent, () => new WireProtocolEngine()),
    provideMinigame('flow-commander', FlowCommanderComponent, () => new FlowCommanderEngine(undefined, new FlowCommanderSimulationService())),
    { provide: SignalCorpsWaveService, useValue: signalCorpsWaveService },
    provideMinigame('signal-corps', SignalCorpsComponent, () => new SignalCorpsEngine(undefined, signalCorpsWaveService)),
    provideMinigame('module-assembly', ModuleAssemblyComponent, () => new ModuleAssemblyEngine()),
    provideMinigame('corridor-runner', CorridorRunnerComponent, () => new CorridorRunnerEngine(undefined, new CorridorRunnerSimulationService())),
    provideMinigame('terminal-hack', TerminalHackComponent, () => new TerminalHackEngine()),
    provideMinigame('power-grid', PowerGridComponent, () => new PowerGridEngine()),
    provideMinigame('data-relay', DataRelayComponent, () => new DataRelayEngine()),
    provideMinigame('reactor-core', ReactorCoreComponent, () => new ReactorCoreEngine()),
    provideMinigame('deep-space-radio', DeepSpaceRadioComponent, () => new DeepSpaceRadioEngine()),
    provideMinigame('system-certification', SystemCertificationComponent, () => new SystemCertificationEngine()),
    provideMinigame('blast-doors', BlastDoorsComponent, () => new BlastDoorsEngine()),
    provideMonacoEditor(),
  ],
};
