import type { StoryMissionContent, CodeChallengeStep } from '../../../core/curriculum';

export const CHAPTER_03_CONTENT: StoryMissionContent = {
  chapterId: 3,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'You have built standalone components. You have wired data to templates. But a real app is not one big ' +
        'component. It is dozens of small ones working together. The Power Core needs a Communications Hub ' +
        'inside it, and the station hull holds them all. This is how Angular apps are actually structured: ' +
        'small, focused components nested inside each other, like rooms inside a building.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'To place one component inside another, you do two things: import the child into the parent\'s ' +
        'imports array, then drop its selector tag into the parent\'s template. That is it.',
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
        'Line 2 imports the class. Line 6 tells Angular "this component depends on CommsHubComponent." ' +
        'Line 10 is where the child actually renders. Wherever you put <app-comms-hub />, the Comms Hub\'s ' +
        'template appears. The parent does not need to know anything about the child\'s internals, just its ' +
        'selector.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'Two modules, one inside the other. This pattern scales to entire applications. Every Angular app ' +
        'is a tree of nested components, from the root all the way down to individual buttons.',
      conceptTitle: 'Component Composition',
      conceptBody:
        'Component composition means building complex UIs from smaller, reusable pieces. Instead of one ' +
        'massive template with everything in it, you break the UI into focused components and snap them ' +
        'together. A navigation bar, a sidebar, a card, each is its own component. The parent just imports ' +
        'what it needs and places it in the template.',
      keyPoints: [
        'A component must be in the parent\'s imports array before you can use its selector in the template. Angular will throw an error otherwise.',
        'Standalone components declare their own dependencies. Each component is self-contained. It lists exactly what it needs, no more.',
        'Nesting can go as deep as you need. But if your component tree gets more than a few levels deep, that is a signal to step back and rethink the structure.',
      ],
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Here is a three-level nesting example: the station hull contains the Power Core, which contains the ' +
        'Comms Hub. Notice that each component only imports its direct children. StationHullComponent has no ' +
        'idea CommsHubComponent exists, and that is by design.',
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
        'Each component imports only what it directly uses. The station hull imports PowerCoreComponent but ' +
        'not CommsHubComponent, because it does not need to. This keeps dependencies explicit and prevents components ' +
        'from reaching into each other\'s internals. Clean boundaries make code easier to maintain and test.',
    },
    {
      stepType: 'code-challenge',
      prompt:
        'The navigation array needs a radar subsystem mounted inside it. Import RadarComponent and render ' +
        'it in the template. You have already seen how: import, add to imports array, drop the selector tag.',
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
        'Add imports: [RadarComponent] inside the @Component decorator, right above or below the selector.',
        'In the template, use <app-radar />, that is the child\'s selector tag.',
      ],
      successMessage:
        'Radar is mounted inside the navigation array. You just composed two components together, ' +
        'the same pattern Angular apps use all the way up to the root component. Next up: controlling ' +
        'what shows up on screen and when.',
      explanation:
        'This is the core of how Angular apps are built: small components composed into bigger ones. ' +
        'Import the child, add it to imports, use its selector. The child renders wherever the tag ' +
        'appears, and the parent never needs to know what is happening inside.',
    } satisfies CodeChallengeStep,
  ],
  completionCriteria: {
    description: 'Power Core and Comms Hub are assembled!',
    minStepsViewed: 5,
  },
};
