import type { StoryMissionContent } from '../../../core/curriculum';

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
  ],
  completionCriteria: {
    description: 'Core services are online!',
    minStepsViewed: 4,
  },
};
