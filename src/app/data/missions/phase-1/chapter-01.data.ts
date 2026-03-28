import type { StoryMissionContent, CodeChallengeStep } from '../../../core/curriculum';

export const CHAPTER_01_CONTENT: StoryMissionContent = {
  chapterId: 1,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'Nexus Station has suffered critical damage. Hull breaches, failing life support, and scattered debris ' +
        'fill the corridors. Before anything else, you need shelter — a self-contained emergency module that can ' +
        'keep you alive while you rebuild. In Angular, every piece of the UI is a component: a self-contained ' +
        'building block with its own template, logic, and style. Your first task is to build one.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Here is the blueprint for your emergency shelter module. The @Component decorator tells Angular this ' +
        'class is a component. The selector gives it a tag name, and the template defines what it displays.',
      code: [
        "import { Component } from '@angular/core';",
        '',
        '@Component({',
        "  selector: 'app-emergency-shelter',",
        "  template: `<h1>Emergency Shelter Online</h1>`,",
        '})',
        'export class EmergencyShelterComponent {}',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [3, 4, 5],
      explanation:
        'The @Component decorator marks the class as an Angular component. The selector defines the HTML tag ' +
        '(<app-emergency-shelter>), and the template contains the HTML that Angular renders.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'You have built your first station module. Let us break down what makes a component work.',
      conceptTitle: 'What is a Component?',
      conceptBody:
        'Components are the fundamental building blocks of Angular applications. Each component has a TypeScript ' +
        'class for logic, an HTML template for the view, and optional CSS for styling. Think of them as ' +
        'self-contained station modules — each one handles its own display and behavior.',
      keyPoints: [
        'Components are standalone by default in modern Angular — no NgModule needed',
        'One component per file keeps code organized and testable',
        'Use PascalCase for class names (EmergencyShelterComponent) and kebab-case for selectors (app-emergency-shelter)',
      ],
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Your shelter is online, but it needs a status display. Add a property to the component class and ' +
        'reference it in the template. This is a preview of interpolation, which you will master in Chapter 2.',
      code: [
        "import { Component } from '@angular/core';",
        '',
        '@Component({',
        "  selector: 'app-emergency-shelter',",
        '  template: `',
        '    <h1>Emergency Shelter</h1>',
        '    <p>Status: {{ status }}</p>',
        '  `,',
        '})',
        'export class EmergencyShelterComponent {',
        "  status = 'operational';",
        '}',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [7, 11],
      explanation:
        'The class property "status" holds data, and {{ status }} in the template displays it. ' +
        'This one-way data flow from class to template is called interpolation.',
    },
    {
      stepType: 'code-challenge',
      prompt:
        'Nexus Station\'s diagnostic systems are offline. Write a complete Angular component with a ' +
        '@Component decorator, selector, template, and class to create a diagnostic scanner module.',
      starterCode: [
        "import { Component } from '@angular/core';",
        '',
        '// TODO: Add @Component decorator with:',
        "//   - selector: 'app-diagnostic-scanner'",
        '//   - template with an <h1> displaying the scanner name',
        '',
        '// TODO: Export the component class',
      ].join('\n'),
      language: 'typescript',
      validationRules: [
        {
          type: 'contains',
          value: '@Component',
          errorMessage: 'Add the @Component decorator to your class',
        },
        {
          type: 'pattern',
          pattern: "selector:\\s*'app-",
          errorMessage: 'Add a selector starting with \'app-\' in the @Component decorator',
        },
        {
          type: 'pattern',
          pattern: 'template:\\s*`',
          errorMessage: 'Add a template using a backtick string in the @Component decorator',
        },
        {
          type: 'pattern',
          pattern: 'export\\s+class\\s+\\w+Component',
          errorMessage: 'Export a class with a name ending in Component',
        },
        {
          type: 'order',
          patterns: ['@Component', 'export class'],
          errorMessage: 'The @Component decorator must appear before the export class declaration',
        },
      ],
      hints: [
        'The @Component decorator takes an object with selector, template properties',
        "The selector should start with 'app-' and the class name should end with 'Component'",
      ],
      successMessage:
        'Diagnostic scanner module is online! You built a complete Angular component from scratch.',
      explanation:
        'Every Angular component follows this pattern: a @Component decorator configures how it appears ' +
        'in HTML (selector) and what it displays (template), while the class contains the logic.',
    } satisfies CodeChallengeStep,
  ],
  completionCriteria: {
    description: 'You built your first station module!',
    minStepsViewed: 5,
  },
};
