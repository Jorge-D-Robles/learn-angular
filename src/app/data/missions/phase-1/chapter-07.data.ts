import type { StoryMissionContent, CodeChallengeStep } from '../../../core/curriculum';

export const CHAPTER_07_CONTENT: StoryMissionContent = {
  chapterId: 7,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'You\'ve been hardcoding data inside each component. That works for demos, but think about Nexus Station — ' +
        'every module needs a status card, and each card shows different data: power output, crew count, oxygen ' +
        'levels. Building a separate component for each one would be absurd. What you want is one reusable card ' +
        'that accepts different data from whoever uses it. That\'s what inputs are — parameters for your components.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Inputs work like function parameters. When you call a function, you pass arguments in. When you use a ' +
        'component, you pass data in through inputs. The input() function declares what data a component expects ' +
        'to receive.',
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
        'input.required<string>() says: "this component needs a string, and the parent must provide it." ' +
        'The parent passes data in using the square brackets you already know from property binding: ' +
        '[name]="\'Power Core\'". One thing that might look odd — you read the value with name() instead of ' +
        'just name. That\'s because inputs are signals under the hood, and you\'ll see why that matters when ' +
        'you reach the Signals chapter.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Not every input needs to come from the parent. Some have sensible defaults — a power level might ' +
        'default to 100%, a status to "online." For those, pass the default value directly to input().',
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
        'input(100) creates an optional input. If the parent doesn\'t bind [power], the component quietly ' +
        'uses 100. input.required() is the strict version — Angular throws an error if the parent forgets it. ' +
        'Use required for data the component can\'t function without, and defaults for everything else.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'Module cards are now receiving data from their parents. A single component definition, many different ' +
        'uses. This is how real Angular apps stay manageable as they grow.',
      conceptTitle: 'Input Properties with input()',
      conceptBody:
        'Angular uses signal-based inputs (not plain properties) because signals let the framework know exactly ' +
        'when data changes, so it can skip unnecessary re-renders. The input() function creates a read-only ' +
        'signal that only the parent can set. You read it by calling it as a function.',
      keyPoints: [
        'input.required<T>() means the parent must provide this value; input(default) means it\'s optional with a fallback',
        'Inputs are signals — you read them with () in templates and in code. This pattern will click fully in Chapter 23 (Signals)',
        'The older @Input() decorator still works but signal-based inputs are the modern approach — they\'re what Angular recommends going forward',
      ],
    },
    {
      stepType: 'code-challenge',
      prompt:
        'Station modules need standardized status displays, and you don\'t want to build a separate component ' +
        'for each one. Declare a required title input and an optional level input (defaulting to 100) so ' +
        'a single component can serve any module.',
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
        'For the title: title = input.required<string>() — the parent must always provide this',
        'For the level: level = input(100) — Angular infers the type from the default value, so you don\'t need the <number> generic',
      ],
      successMessage:
        'Your component accepts data from any parent now. One definition, endless reuse. ' +
        'Next up: what happens when the child needs to talk back? That\'s outputs, and they\'re coming in Chapter 8.',
      explanation:
        'input.required<T>() for data the component can\'t work without. input(default) for optional data ' +
        'with a fallback. Both return signals — you call them with () to read the value. The parent sets them ' +
        'using property binding: [title]="\'Reactor\'" or [level]="reactorLevel".',
    } satisfies CodeChallengeStep,
  ],
  completionCriteria: {
    description: 'Standardized module cards are receiving data!',
    minStepsViewed: 5,
  },
};
