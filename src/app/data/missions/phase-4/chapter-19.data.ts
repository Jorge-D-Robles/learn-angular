import type { StoryMissionContent } from '../../../core/curriculum';

export const CHAPTER_19_CONTENT: StoryMissionContent = {
  chapterId: 19,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'The core services exist, but wiring them into the station grid requires understanding ' +
        'dependency injection — Angular\'s system for delivering service instances to the components ' +
        'that need them. Some services should be station-wide singletons, while others need to be ' +
        'scoped to specific module clusters. The inject() function and provider configuration give ' +
        'you precise control over how services are shared.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'The inject() function is the modern way to request dependencies. It works in constructors, ' +
        'field initializers, and factory functions. Here is a component that injects multiple services.',
      code: [
        "import { Component, inject } from '@angular/core';",
        "import { PowerService } from './power.service';",
        "import { CrewService } from './crew.service';",
        "import { AlertService } from './alert.service';",
        '',
        '@Component({',
        "  selector: 'app-station-dashboard',",
        '  template: `',
        '    <p>Power: {{ power.getPowerLevel() }}%</p>',
        '    <p>Crew: {{ crew.getCrewCount() }} active</p>',
        '    <p>Alerts: {{ alerts.getPendingCount() }} pending</p>',
        '  `,',
        '})',
        'export class StationDashboardComponent {',
        '  power = inject(PowerService);',
        '  crew = inject(CrewService);',
        '  alerts = inject(AlertService);',
        '}',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [1, 15, 16, 17],
      explanation:
        'inject() replaces constructor injection with a cleaner, more composable pattern. Each call ' +
        'resolves the dependency from the nearest injector in the hierarchy. Since these services use ' +
        'providedIn: \'root\', they resolve to the application-level singleton instances.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Not all services should be singletons. Some module clusters need their own isolated instance. ' +
        'Use the component\'s providers array to create a scoped service instance.',
      code: [
        "import { Component, inject } from '@angular/core';",
        "import { PowerService } from './power.service';",
        '',
        '// This component gets its OWN PowerService instance,',
        '// separate from the root singleton.',
        '@Component({',
        "  selector: 'app-backup-grid',",
        '  providers: [PowerService],',
        '  template: `',
        '    <p>Backup Power: {{ power.getPowerLevel() }}%</p>',
        '  `,',
        '})',
        'export class BackupGridComponent {',
        '  power = inject(PowerService);',
        '}',
        '',
        '// Root-level component uses the global singleton:',
        '@Component({',
        "  selector: 'app-main-grid',",
        '  template: `',
        '    <p>Main Power: {{ power.getPowerLevel() }}%</p>',
        '    <app-backup-grid />',
        '  `,',
        '})',
        'export class MainGridComponent {',
        '  power = inject(PowerService);',
        '}',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [8, 14, 26],
      explanation:
        'Adding a service to a component\'s providers array creates a new instance scoped to that ' +
        'component and its children. BackupGridComponent gets its own PowerService, while ' +
        'MainGridComponent uses the root singleton. This hierarchical injection lets you control ' +
        'exactly which parts of the station share state.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'The power grid is fully wired. Here is how Dependency Injection scoping works in Angular.',
      conceptTitle: 'Dependency Injection — inject() and Hierarchical Scoping',
      conceptBody:
        'Angular\'s DI system uses a hierarchy of injectors to resolve dependencies. The root injector ' +
        'provides application-wide singletons. Component-level providers create new instances scoped ' +
        'to that component subtree. The inject() function resolves from the nearest matching injector, ' +
        'giving you fine-grained control over service sharing.',
      keyPoints: [
        'inject() resolves dependencies from the nearest injector in the hierarchy',
        'providedIn: \'root\' registers a service at the application root (singleton)',
        'Component-level providers create scoped instances for that subtree',
        'Child components inherit parent injectors unless they override with their own providers',
      ],
    },
  ],
  completionCriteria: {
    description: 'The power grid is wired!',
    minStepsViewed: 4,
  },
};
