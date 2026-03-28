import type { StoryMissionContent, CodeChallengeStep } from '../../../core/curriculum';

export const CHAPTER_03_CONTENT: StoryMissionContent = {
  chapterId: 3,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'Individual modules work, but Nexus Station is more than isolated rooms. The Power Core needs a ' +
        'Communications Hub inside it, and the main station hull holds them all. In Angular, you build complex ' +
        'UIs by nesting components inside each other — just like assembling station modules into larger structures.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'The Comms Hub is a standalone component. To place it inside the Power Core, import it and use its ' +
        'selector tag in the parent template.',
      code: [
        "import { Component } from '@angular/core';",
        "import { CommsHubComponent } from './comms-hub';",
        '',
        '@Component({',
        "  selector: 'app-power-core',",
        '  imports: [CommsHubComponent],',
        '  template: `',
        '    <h2>Power Core</h2>',
        '    <p>Output: {{ powerOutput }}kW</p>',
        '    <app-comms-hub />',
        '  `,',
        '})',
        'export class PowerCoreComponent {',
        '  powerOutput = 4200;',
        '}',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [2, 6, 10],
      explanation:
        'To use a child component, import its class into the parent component\'s imports array. Then use the ' +
        'child\'s selector (<app-comms-hub />) in the parent\'s template. The child renders wherever its tag appears.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'You have assembled two modules into a parent-child structure. This is how real Angular apps are built — ' +
        'small, focused components composed into larger views.',
      conceptTitle: 'Component Composition',
      conceptBody:
        'Component composition is the practice of building complex UIs from simpler, reusable components. ' +
        'A parent component imports child components and places them in its template using their selector tags. ' +
        'This creates a tree structure — just like Nexus Station is a tree of nested modules.',
      keyPoints: [
        'Import a child component before using it in the template',
        'Standalone components declare their own dependencies in the imports array',
        'Component trees can be nested as deep as needed — each level is a self-contained module',
      ],
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Let us go deeper. The station hull contains the Power Core, which contains the Comms Hub — three ' +
        'levels of nesting. Each component only knows about its direct children.',
      code: [
        '// comms-hub.ts',
        '@Component({',
        "  selector: 'app-comms-hub',",
        "  template: `<p>Comms Hub: {{ frequency }}MHz</p>`,",
        '})',
        'export class CommsHubComponent {',
        '  frequency = 142.5;',
        '}',
        '',
        '// power-core.ts',
        '@Component({',
        "  selector: 'app-power-core',",
        '  imports: [CommsHubComponent],',
        '  template: `',
        '    <h2>Power Core</h2>',
        '    <app-comms-hub />',
        '  `,',
        '})',
        'export class PowerCoreComponent {}',
        '',
        '// station-hull.ts',
        '@Component({',
        "  selector: 'app-station-hull',",
        '  imports: [PowerCoreComponent],',
        '  template: `',
        '    <h1>Nexus Station</h1>',
        '    <app-power-core />',
        '  `,',
        '})',
        'export class StationHullComponent {}',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [13, 24],
      explanation:
        'Each component imports only its direct children. StationHullComponent imports PowerCoreComponent, ' +
        'which imports CommsHubComponent. This keeps dependencies explicit and each component self-contained.',
    },
    {
      stepType: 'code-challenge',
      prompt:
        'The navigation array needs a radar subsystem mounted inside it. Write a parent component ' +
        'that imports a child component (RadarComponent) and renders it in the template.',
      starterCode: [
        "import { Component } from '@angular/core';",
        "import { RadarComponent } from './radar';",
        '',
        '@Component({',
        "  selector: 'app-nav-array',",
        '  // TODO: Add imports array with RadarComponent',
        '  template: `',
        '    <h2>Navigation Array</h2>',
        '    <!-- TODO: Render the RadarComponent using its selector tag -->',
        '  `,',
        '})',
        'export class NavArrayComponent {}',
      ].join('\n'),
      language: 'typescript',
      validationRules: [
        {
          type: 'pattern',
          pattern: 'imports:\\s*\\[.*Radar',
          errorMessage: 'Add RadarComponent to the imports array in the @Component decorator',
        },
        {
          type: 'pattern',
          pattern: '<app-radar\\s*/?>',
          errorMessage: 'Use <app-radar /> in the template to render the child component',
        },
        {
          type: 'contains',
          value: '@Component',
          errorMessage: 'Keep the @Component decorator on the class',
        },
        {
          type: 'pattern',
          pattern: 'export\\s+class\\s+\\w+Component',
          errorMessage: 'Export a class with a name ending in Component',
        },
        {
          type: 'notContains',
          value: '<!-- TODO',
          errorMessage: 'Complete all HTML template TODO comments',
        },
      ],
      hints: [
        'Add RadarComponent to the imports array in the @Component decorator',
        'Use <app-radar /> in the template to render the child component',
      ],
      successMessage:
        'Navigation array assembled! The radar subsystem is mounted and rendering inside the parent module.',
      explanation:
        'Component composition is how Angular apps are built. Import a child into the parent\'s imports ' +
        'array, then use its selector tag in the template. The child renders wherever its tag appears.',
    } satisfies CodeChallengeStep,
  ],
  completionCriteria: {
    description: 'Power Core and Comms Hub are assembled!',
    minStepsViewed: 5,
  },
};
