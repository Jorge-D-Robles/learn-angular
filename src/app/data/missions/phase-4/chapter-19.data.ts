import type { StoryMissionContent, CodeChallengeStep } from '../../../core/curriculum';

export const CHAPTER_19_CONTENT: StoryMissionContent = {
  chapterId: 19,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'You created services in Chapter 18. But how does Angular decide which instance to hand a ' +
        'component? What if different parts of the app need different instances of the same service? ' +
        'That\'s dependency injection, Angular\'s system for connecting consumers to providers. Think ' +
        'of it like ordering food at a restaurant: you don\'t go to the kitchen yourself, you just tell ' +
        'the waiter what you want, and the restaurant decides how to fulfill the order.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'The inject() function is the modern way to request dependencies. It works in field initializers, ' +
        'constructors, and factory functions. Here a single component pulls in three different services, ' +
        'each resolved from the same injector hierarchy.',
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
        'Each inject() call tells Angular "give me this service." Angular walks up the injector ' +
        'hierarchy until it finds a provider that matches. Since all three services use ' +
        'providedIn: \'root\', they resolve to application-level singletons. No constructor boilerplate, ' +
        'no manual wiring. Just declare what you need.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Not every service should be a singleton. Sometimes a component needs its own isolated instance, ' +
        'like a backup power grid that tracks power separately from the main grid. You do this by adding ' +
        'the service to the component\'s providers array.',
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
        'Adding PowerService to the providers array creates a fresh instance scoped to BackupGridComponent ' +
        'and its children. MainGridComponent still gets the root singleton. Both call inject(PowerService), ' +
        'but Angular delivers different instances based on where each component sits in the injector ' +
        'hierarchy. Scoped providers are for cases where you genuinely need isolated state.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'The injection system is wired. Honestly, for most apps you\'ll stick with providedIn: \'root\'. ' +
        'Component-level providers are a specialized tool, but knowing they exist matters when you hit ' +
        'that edge case.',
      conceptTitle: 'Dependency Injection: Hierarchical Injectors and Scoping',
      conceptBody:
        'Angular maintains a tree of injectors that mirrors your component tree. When you call inject(), ' +
        'Angular searches upward from the requesting component until it finds a matching provider. The ' +
        'root injector holds your providedIn: \'root\' singletons. Component-level providers intercept ' +
        'that search and supply a scoped instance instead.',
      keyPoints: [
        'inject() searches up the injector tree, and the closest matching provider wins',
        'providedIn: \'root\' registers at the top of the tree, giving you an app-wide singleton',
        'Component providers create a new instance that\'s shared only within that component subtree',
        'Child components inherit their parent\'s injector unless they override it with their own providers',
      ],
    },
    {
      stepType: 'code-challenge',
      prompt:
        'Wire up the station dashboard. Inject PowerService, CrewService, and AlertService into a single ' +
        'component using inject(). Each service gets its own field.',
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
        'The pattern is the same for all three. Each inject() call resolves independently',
      ],
      successMessage:
        'Three services, one component, zero manual wiring. That\'s dependency injection doing its job. ' +
        'Next challenge: scoping a service to a single component.',
      explanation:
        'A component can inject as many services as it needs. Each inject() call resolves independently ' +
        'from the injector hierarchy. Since all three use providedIn: \'root\', the dashboard gets ' +
        'singleton instances that are shared across the entire app.',
    } satisfies CodeChallengeStep,
    {
      stepType: 'code-challenge',
      prompt:
        'Time to scope a service. Remove the root-level registration from CrewRosterService and ' +
        'add it to the component\'s providers array instead, so this component gets its own isolated instance.',
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
          errorMessage: 'The providers property should be an array. Use providers: [ServiceName]',
        },
        {
          type: 'notContains',
          value: "providedIn: 'root'",
          errorMessage: "Remove providedIn: 'root' from the service. It should be component-scoped now",
        },
        {
          type: 'contains',
          value: 'inject(',
          errorMessage: 'Keep the inject() call to request the service from the component injector',
        },
      ],
      hints: [
        "Change @Injectable({ providedIn: 'root' }) to just @Injectable() and remove the root registration",
        'Add providers: [CrewRosterService] inside the @Component decorator to scope the service to this component',
      ],
      successMessage:
        'Service scoped. This component now gets its own private instance, completely independent from ' +
        'any root singleton. You\'ve seen both ends of the spectrum, from app-wide singletons to component-scoped instances.',
      explanation:
        'When you remove providedIn: \'root\', the service is no longer automatically registered anywhere. ' +
        'Adding it to a component\'s providers array creates a new instance scoped to that component and ' +
        'its children. The inject() call still works, but it resolves from the component\'s local injector ' +
        'instead of the root.',
    } satisfies CodeChallengeStep,
  ],
  completionCriteria: {
    description: 'The power grid is wired!',
    minStepsViewed: 6,
  },
};
