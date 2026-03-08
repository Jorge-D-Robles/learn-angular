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

import { routes } from './app.routes';
import { GlobalErrorHandler } from './core/error';
import { NexusTitleStrategy } from './core';
import { APP_ICONS } from './shared/icons';
import { MODULE_ASSEMBLY_LEVEL_PACK } from './data/levels/module-assembly.data';
import { WIRE_PROTOCOL_LEVEL_PACK } from './data/levels/wire-protocol.data';
import { FLOW_COMMANDER_LEVEL_PACK } from './data/levels/flow-commander.data';
import { SIGNAL_CORPS_LEVEL_PACK } from './data/levels/signal-corps.data';
import { provideLevelData } from './data/levels/provide-level-data';
import { provideMinigame } from './data/minigame-registration';
import { ModuleAssemblyComponent, ModuleAssemblyEngine } from './features/minigames/module-assembly';
import { WireProtocolComponent, WireProtocolEngine } from './features/minigames/wire-protocol';
import { FlowCommanderComponent, FlowCommanderEngine } from './features/minigames/flow-commander';
import { SignalCorpsComponent, SignalCorpsEngine } from './features/minigames/signal-corps';

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
    provideMinigame('wire-protocol', WireProtocolComponent, () => new WireProtocolEngine()),
    provideMinigame('flow-commander', FlowCommanderComponent, () => new FlowCommanderEngine()),
    provideMinigame('signal-corps', SignalCorpsComponent, () => new SignalCorpsEngine()),
    provideMinigame('module-assembly', ModuleAssemblyComponent, () => new ModuleAssemblyEngine()),
  ],
};
