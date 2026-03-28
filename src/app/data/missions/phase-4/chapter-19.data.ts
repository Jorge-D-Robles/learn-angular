import type { StoryMissionContent, CodeChallengeStep } from '../../../core/curriculum';

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
    {
      stepType: 'code-challenge',
      prompt:
        'Wire up the station dashboard! Inject PowerService, CrewService, and AlertService ' +
        'into a single component using inject().',
      starterCode: [
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
        '  // TODO: Inject PowerService and assign to a field called power',
        '  // TODO: Inject CrewService and assign to a field called crew',
        '  // TODO: Inject AlertService and assign to a field called alerts',
        '}',
      ].join('\n'),
      language: 'typescript',
      validationRules: [
        {
          type: 'pattern',
          pattern: 'inject\\(PowerService\\)',
          errorMessage: 'Inject PowerService using inject(PowerService)',
        },
        {
          type: 'pattern',
          pattern: 'inject\\(CrewService\\)',
          errorMessage: 'Inject CrewService using inject(CrewService)',
        },
        {
          type: 'pattern',
          pattern: 'inject\\(AlertService\\)',
          errorMessage: 'Inject AlertService using inject(AlertService)',
        },
        {
          type: 'contains',
          value: 'inject(',
          errorMessage: 'Use the inject() function to request services from the injector',
        },
      ],
      hints: [
        'Assign each service to a field: power = inject(PowerService)',
        'Each inject() call resolves a different service from the same injector hierarchy',
      ],
      successMessage:
        'Dashboard connected! Three services feed live data into a single component.',
      explanation:
        'A component can inject any number of services using inject(). Each call resolves ' +
        'independently from the injector hierarchy. Since all three services use providedIn: \'root\', ' +
        'the component receives singleton instances shared across the application.',
    } satisfies CodeChallengeStep,
    {
      stepType: 'code-challenge',
      prompt:
        'Scope a service to a component! Remove the root-level registration from CrewRosterService ' +
        'and add a providers array to the component so it gets its own instance.',
      starterCode: [
        "import { Injectable } from '@angular/core';",
        "import { Component, inject } from '@angular/core';",
        '',
        "@Injectable({ providedIn: 'root' })",
        'export class CrewRosterService {',
        '  private crew: string[] = [];',
        '  getCrewCount(): number { return this.crew.length; }',
        '}',
        '',
        '// TODO: Add a providers array to scope CrewRosterService to this component',
        '@Component({',
        "  selector: 'app-crew-module',",
        '  template: `<p>Module Crew: {{ roster.getCrewCount() }}</p>`,',
        '})',
        'export class CrewModuleComponent {',
        '  roster = inject(CrewRosterService);',
        '}',
      ].join('\n'),
      language: 'typescript',
      validationRules: [
        {
          type: 'contains',
          value: 'providers:',
          errorMessage: 'Add a providers array to the @Component decorator',
        },
        {
          type: 'pattern',
          pattern: 'providers:\\s*\\[',
          errorMessage: 'The providers property should be an array — use providers: [ServiceName]',
        },
        {
          type: 'notContains',
          value: "providedIn: 'root'",
          errorMessage: "Remove providedIn: 'root' from the service — it should be component-scoped now",
        },
        {
          type: 'contains',
          value: 'inject(',
          errorMessage: 'Keep the inject() call to request the service from the component injector',
        },
      ],
      hints: [
        "Remove { providedIn: 'root' } from @Injectable and use @Injectable() instead",
        'Add providers: [CrewRosterService] to the @Component decorator to scope the service',
      ],
      successMessage:
        'Service scoped! This component now gets its own CrewRosterService instance, separate from the root.',
      explanation:
        'Removing providedIn: \'root\' stops the service from being a global singleton. Adding it ' +
        'to the component\'s providers array creates a new instance scoped to that component and its ' +
        'children. This is hierarchical injection — child components inherit the scoped instance.',
    } satisfies CodeChallengeStep,
  ],
  completionCriteria: {
    description: 'The power grid is wired!',
    minStepsViewed: 6,
  },
};
