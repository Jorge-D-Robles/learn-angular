import type { StoryMissionContent, CodeChallengeStep } from '../../../core/curriculum';

export const CHAPTER_07_CONTENT: StoryMissionContent = {
  chapterId: 7,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'Every module on Nexus Station needs a status card, but each card shows different data — power output, ' +
        'crew count, oxygen levels. Building a separate card component for each module would be wasteful. ' +
        'Instead, build one reusable card that accepts data from its parent via input properties.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Use the input() function to declare properties that a parent component can set. Use input.required() ' +
        'when the value must be provided.',
      code: [
        "import { Component, input } from '@angular/core';",
        '',
        '@Component({',
        "  selector: 'app-module-card',",
        '  template: `',
        '    <div class="module-card">',
        '      <h3>{{ name() }}</h3>',
        '      <p>Status: {{ status() }}</p>',
        '    </div>',
        '  `,',
        '})',
        'export class ModuleCardComponent {',
        '  name = input.required<string>();',
        '  status = input.required<string>();',
        '}',
        '',
        '// Parent usage:',
        "// <app-module-card [name]=\"'Power Core'\" [status]=\"coreStatus\" />",
      ].join('\n'),
      language: 'typescript',
      highlightLines: [1, 13, 14],
      explanation:
        'input.required<string>() declares a required input property. The parent passes data via property binding: ' +
        '[name]="\'Power Core\'". In the template, call the input as a function — name() — because inputs are signals.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Inputs can have default values. Use input(defaultValue) for optional inputs that fall back to a ' +
        'sensible default when the parent does not provide a value.',
      code: [
        "import { Component, input } from '@angular/core';",
        '',
        '@Component({',
        "  selector: 'app-module-card',",
        '  template: `',
        '    <h3>{{ name() }}</h3>',
        '    <p>Power: {{ power() }}%</p>',
        '    <p>Status: {{ status() }}</p>',
        '  `,',
        '})',
        'export class ModuleCardComponent {',
        '  name = input.required<string>();',
        '  power = input(100);         // defaults to 100',
        "  status = input('online');   // defaults to 'online'",
        '}',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [13, 14],
      explanation:
        'input(100) creates an optional input with a default of 100. If the parent does not bind [power], the ' +
        'component uses 100. input.required() has no default — Angular throws an error if the parent omits it.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'Standardized module cards are now receiving data from their parent modules. This is how Angular ' +
        'components become truly reusable.',
      conceptTitle: 'Input Properties -- input()',
      conceptBody:
        'Signal-based inputs are the modern Angular way to accept data from parent components. The input() ' +
        'function creates a read-only signal that the parent sets via property binding. Use input.required() ' +
        'for mandatory values and input(default) for optional ones.',
      keyPoints: [
        'Inputs are read-only signals — call with () to read the current value',
        'input.required<T>() for mandatory props, input(default) for optional props with defaults',
        'Replaces the older @Input() decorator — signal-based inputs are the recommended approach',
      ],
    },
    {
      stepType: 'code-challenge',
      prompt:
        'Station modules need standardized status displays. Write a component that accepts data from its ' +
        'parent using input() for optional props and input.required() for mandatory ones.',
      starterCode: [
        "import { Component, input } from '@angular/core';",
        '',
        '@Component({',
        "  selector: 'app-status-display',",
        '  template: `',
        '    <h3>{{ title() }}</h3>',
        '    <p>Level: {{ level() }}%</p>',
        '  `,',
        '})',
        'export class StatusDisplayComponent {',
        "  // TODO: Declare 'title' as a required string property",
        "  // TODO: Declare 'level' as an optional number property with a default of 100",
        '}',
      ].join('\n'),
      language: 'typescript',
      validationRules: [
        {
          type: 'pattern',
          pattern: 'input\\.required<',
          errorMessage: 'Use input.required<T>() for the mandatory title input',
        },
        {
          type: 'pattern',
          pattern: 'input\\s*(?:<[^>]+>)?\\s*\\(\\d+',
          errorMessage:
            'Use input(defaultValue) for the optional level input with a numeric default',
        },
        {
          type: 'pattern',
          pattern: '=\\s*input',
          errorMessage: 'Assign input() or input.required() to a class property',
        },
        {
          type: 'notContains',
          value: '@Input',
          errorMessage: 'Use the modern input() function instead of the @Input() decorator',
        },
        {
          type: 'notContains',
          value: '// TODO',
          errorMessage: 'Complete all TODO comments',
        },
      ],
      hints: [
        'input.required<string>() declares a mandatory input that parents must provide',
        'input(100) declares an optional input that defaults to 100 when the parent omits it',
      ],
      successMessage:
        'Status display is accepting data from parent modules! Signal-based inputs make components reusable.',
      explanation:
        'Signal-based inputs use input.required<T>() for mandatory props and input(default) for optional ' +
        'ones. Both are read-only signals — call with () in the template to read the value.',
    } satisfies CodeChallengeStep,
  ],
  completionCriteria: {
    description: 'Standardized module cards are receiving data!',
    minStepsViewed: 5,
  },
};
