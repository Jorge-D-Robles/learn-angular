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
  ],
};
