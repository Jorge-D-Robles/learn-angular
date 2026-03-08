import type { StoryMissionContent } from '../../../core/curriculum';

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
  ],
  completionCriteria: {
    description: 'Standardized module cards are receiving data!',
    minStepsViewed: 4,
  },
};
