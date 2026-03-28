import type { StoryMissionContent, CodeChallengeStep } from '../../../core/curriculum';

export const CHAPTER_18_CONTENT: StoryMissionContent = {
  chapterId: 18,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'The station modules are working independently, but they cannot share state. Power levels, crew ' +
        'rosters, and alert queues are all isolated — each module tracks its own data with no way to ' +
        'coordinate. To unify the station, you need shared services: singleton objects that any module ' +
        'can access. Angular provides the @Injectable decorator to create services that are available ' +
        'station-wide.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Create a PowerService that tracks the station\'s power level. The @Injectable decorator with ' +
        'providedIn: \'root\' makes this service a singleton available everywhere in the application.',
      code: [
        "import { Injectable } from '@angular/core';",
        '',
        "@Injectable({ providedIn: 'root' })",
        'export class PowerService {',
        '  private currentLevel = 100;',
        '',
        '  getPowerLevel(): number {',
        '    return this.currentLevel;',
        '  }',
        '',
        '  consumePower(amount: number): void {',
        '    this.currentLevel = Math.max(0, this.currentLevel - amount);',
        '  }',
        '',
        '  rechargePower(amount: number): void {',
        '    this.currentLevel = Math.min(100, this.currentLevel + amount);',
        '  }',
        '}',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [1, 3, 4, 7, 11],
      explanation:
        '@Injectable marks a class as available for dependency injection. The providedIn: \'root\' ' +
        'option registers the service at the application root, making it a singleton — every component ' +
        'that injects PowerService gets the same instance. Angular creates the service lazily the first ' +
        'time it is injected.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Now inject the PowerService into a component using the inject() function. This gives the ' +
        'component access to the shared power state without creating a new instance.',
      code: [
        "import { Component, inject } from '@angular/core';",
        "import { PowerService } from './power.service';",
        '',
        '@Component({',
        "  selector: 'app-power-monitor',",
        '  template: `',
        '    <h2>Power Grid</h2>',
        '    <p>Current Level: {{ powerLevel() }}%</p>',
        '    <button (click)="consumePower()">Use 10 Units</button>',
        '  `,',
        '})',
        'export class PowerMonitorComponent {',
        '  private powerService = inject(PowerService);',
        '',
        '  powerLevel(): number {',
        '    return this.powerService.getPowerLevel();',
        '  }',
        '',
        '  consumePower(): void {',
        '    this.powerService.consumePower(10);',
        '  }',
        '}',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [1, 2, 13, 16, 20],
      explanation:
        'The inject() function retrieves the service instance from the Angular injector. Because ' +
        'PowerService is providedIn: \'root\', every component that calls inject(PowerService) receives ' +
        'the same singleton instance. Changes made in one component are immediately visible in others.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'The station\'s shared power service is online. Here is how Injectable Services work in Angular.',
      conceptTitle: 'Injectable Services with @Injectable',
      conceptBody:
        'Services are classes decorated with @Injectable that encapsulate shared logic and state. ' +
        'Using providedIn: \'root\' creates a singleton that Angular manages for the entire application. ' +
        'Components inject services using the inject() function, gaining access to shared state ' +
        'without tight coupling between components.',
      keyPoints: [
        '@Injectable marks a class for dependency injection',
        'providedIn: \'root\' creates a singleton available application-wide',
        'inject() retrieves the service instance in components',
        'Services encapsulate shared logic and state that multiple components need',
      ],
    },
    {
      stepType: 'code-challenge',
      prompt:
        'Build a crew roster service! Create an @Injectable service with providedIn: \'root\' ' +
        'that tracks crew members and exposes a getCrewCount method.',
      starterCode: [
        "import { Injectable } from '@angular/core';",
        '',
        '// TODO: Add the decorator to make this class injectable station-wide',
        '// TODO: Export the class with a Service suffix',
        'class CrewRosterService {',
        '  private crew: string[] = [];',
        '',
        '  // TODO: Add a method that returns the number of crew members',
        '}',
      ].join('\n'),
      language: 'typescript',
      validationRules: [
        {
          type: 'contains',
          value: '@Injectable',
          errorMessage: 'Add the @Injectable decorator to mark this class for dependency injection',
        },
        {
          type: 'pattern',
          pattern: 'providedIn.*root',
          errorMessage: "Set providedIn: 'root' so the service is available application-wide",
        },
        {
          type: 'pattern',
          pattern: 'export\\s+class\\s+\\w+Service',
          errorMessage: 'Export the class so other modules can import it',
        },
        {
          type: 'contains',
          value: 'getCrewCount',
          errorMessage: 'Add a getCrewCount method to expose the crew count',
        },
      ],
      hints: [
        "Add @Injectable({ providedIn: 'root' }) above the class declaration",
        'Add the export keyword before class and define getCrewCount() to return this.crew.length',
      ],
      successMessage:
        'Crew roster service deployed! The station now has a shared singleton to track crew members.',
      explanation:
        '@Injectable marks a class for Angular dependency injection. Setting providedIn: \'root\' ' +
        'registers the service as a singleton at the application level — every component that ' +
        'injects it receives the same instance. Exporting the class makes it importable by other files.',
    } satisfies CodeChallengeStep,
    {
      stepType: 'code-challenge',
      prompt:
        'Wire up the crew roster! Inject CrewRosterService into a component using the inject() ' +
        'function and display the crew count.',
      starterCode: [
        "import { Component, inject } from '@angular/core';",
        '',
        '// TODO: Import the CrewRosterService',
        '',
        '@Component({',
        "  selector: 'app-crew-panel',",
        '  template: `<p>Crew: {{ crewCount() }}</p>`,',
        '})',
        'export class CrewPanelComponent {',
        '  // TODO: Use the service injection function to get CrewRosterService',
        '',
        '  crewCount(): number {',
        '    // TODO: Return the crew count from the service',
        '    return 0;',
        '  }',
        '}',
      ].join('\n'),
      language: 'typescript',
      validationRules: [
        {
          type: 'contains',
          value: 'inject(',
          errorMessage: 'Use the inject() function to request the service from the injector',
        },
        {
          type: 'pattern',
          pattern: 'inject\\(CrewRosterService\\)',
          errorMessage: 'Pass CrewRosterService as the argument to inject()',
        },
        {
          type: 'contains',
          value: 'CrewRosterService',
          errorMessage: 'Reference CrewRosterService in the component',
        },
        {
          type: 'pattern',
          pattern: 'import.*CrewRosterService',
          errorMessage: 'Add an import statement for CrewRosterService at the top of the file',
        },
      ],
      hints: [
        "Add import { CrewRosterService } from './crew-roster.service' at the top",
        'Assign a field like rosterService = inject(CrewRosterService) and call its methods',
      ],
      successMessage:
        'Crew panel connected! The component now reads live data from the shared roster service.',
      explanation:
        'inject() retrieves a service instance from the Angular injector. Because CrewRosterService ' +
        'uses providedIn: \'root\', every component that calls inject(CrewRosterService) gets the ' +
        'same singleton. You must import the service class so TypeScript can resolve the reference.',
    } satisfies CodeChallengeStep,
  ],
  completionCriteria: {
    description: 'Core services are online!',
    minStepsViewed: 6,
  },
};
