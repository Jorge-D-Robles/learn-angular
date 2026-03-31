import type { StoryMissionContent, CodeChallengeStep } from '../../../core/curriculum';

export const CHAPTER_18_CONTENT: StoryMissionContent = {
  chapterId: 18,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'Up to now, your components have been self-contained islands. Each one manages its own data ' +
        'with no way to share state across the app. If two components both need the same crew roster, ' +
        'they\'d each maintain their own copy, and those copies would inevitably drift out of sync. ' +
        'Services fix this. Think of a service as a shared whiteboard in an office: anyone can read ' +
        'from it or write to it, and everyone sees the same data.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'A service is just a class with the @Injectable decorator. Adding providedIn: \'root\' tells ' +
        'Angular to create one instance for the entire app: a singleton. Why a singleton? Because you ' +
        'want ONE source of truth for your data. Angular creates it lazily, only when something first ' +
        'asks for it, so unused services cost nothing.',
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
        '@Injectable marks this class as something Angular can deliver to other parts of the app. ' +
        'The providedIn: \'root\' setting registers it at the application root, so every component that ' +
        'asks for PowerService gets the exact same instance. One whiteboard, many readers. Angular ' +
        'won\'t even create the service until someone actually injects it.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'So how does a component get access? You call inject(PowerService), and Angular hands you the ' +
        'singleton. No manual wiring, no constructing it yourself. The component just says "I need this" ' +
        'and Angular delivers.',
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
        'inject() is like ordering at a restaurant. You tell Angular what you need, and it brings ' +
        'the right instance to you. Because PowerService uses providedIn: \'root\', every component that ' +
        'calls inject(PowerService) receives the same object. Change the power level in one component, ' +
        'and every other component sees the update immediately.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'The station\'s shared power service is online. Before you move on, let\'s make sure the core ideas are solid.',
      conceptTitle: 'Injectable Services: Shared State Without Tight Coupling',
      conceptBody:
        'Services solve the "isolated islands" problem. Instead of each component maintaining its own ' +
        'copy of shared data, you put that data in a service and inject it wherever it\'s needed. ' +
        'The @Injectable decorator marks the class for Angular\'s delivery system, and providedIn: \'root\' ' +
        'makes it a singleton that lives for the entire app lifetime.',
      keyPoints: [
        '@Injectable tells Angular this class can be delivered to components on request',
        'providedIn: \'root\' means one instance for the whole app, created only when first needed',
        'inject() retrieves the singleton without any manual wiring or construction',
        'Multiple components sharing the same service see the same data, so state stays in sync',
      ],
    },
    {
      stepType: 'code-challenge',
      prompt:
        'Build a crew roster service. Add the @Injectable decorator with providedIn: \'root\' so it\'s ' +
        'available station-wide, export the class, and add a getCrewCount method that returns the ' +
        'number of crew members.',
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
        "Place @Injectable({ providedIn: 'root' }) right above the class declaration",
        'Add the export keyword before class, then write getCrewCount() to return this.crew.length',
      ],
      successMessage:
        'Crew roster service is live! You\'ve got a shared singleton that any component can tap into. ' +
        'Next up: connecting a component to this service with inject().',
      explanation:
        '@Injectable flags the class for Angular\'s dependency injection system. providedIn: \'root\' ' +
        'registers it as a singleton at the application level, so every component that asks for it gets the ' +
        'same instance, sharing the same crew array. Exporting the class makes it importable by other files.',
    } satisfies CodeChallengeStep,
    {
      stepType: 'code-challenge',
      prompt:
        'Now wire it up. Import CrewRosterService into a component, inject it with inject(), and use ' +
        'it to return the crew count. This is how components consume shared state.',
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
        'Create a field like rosterService = inject(CrewRosterService), then call its getCrewCount() method',
      ],
      successMessage:
        'The crew panel is reading from the shared roster. Any other component that injects the same ' +
        'service will see identical data. That\'s the power of singletons.',
      explanation:
        'inject() asks Angular\'s injector for the service instance. Because CrewRosterService uses ' +
        'providedIn: \'root\', every component that injects it gets the same singleton, one shared ' +
        'whiteboard. The import statement is needed so TypeScript knows which class you\'re referring to.',
    } satisfies CodeChallengeStep,
  ],
  completionCriteria: {
    description: 'Core services are online!',
    minStepsViewed: 6,
  },
};
