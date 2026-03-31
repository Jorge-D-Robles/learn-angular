import type { StoryMissionContent, CodeChallengeStep } from '../../../core/curriculum';

export const CHAPTER_01_CONTENT: StoryMissionContent = {
  chapterId: 1,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'Nexus Station has suffered critical damage. Hull breaches, failing life support, scattered debris. ' +
        'Before anything else, you need shelter: a self-contained emergency module that can keep you alive ' +
        'while you rebuild. In Angular, everything you see on screen is a component. A component is like a ' +
        'LEGO brick: it contains everything it needs, its HTML, its logic, its style, and snaps together ' +
        'with other bricks to form something bigger. Your first job is to build one.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Here is the blueprint for your emergency shelter. That @Component thing on top might look weird if ' +
        'you have never seen a decorator before. That is normal. Decorators are just functions that attach ' +
        'extra information to a class. This one tells Angular "hey, this is not just a class, it is a component."',
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
        '@Component is a decorator. It marks this class as an Angular component. The selector gives it an ' +
        'HTML tag name (<app-emergency-shelter>), and the template is the HTML Angular will render. The class ' +
        'itself is just plain TypeScript. The decorator is what makes Angular pay attention to it.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'You just built your first station module. Before moving on, take a moment to understand the pattern ' +
        'you are going to see everywhere in Angular.',
      conceptTitle: 'The Anatomy of a Component',
      conceptBody:
        'Every Angular component is a TypeScript class with a @Component decorator on top. The class holds ' +
        'your logic: properties, methods, state. The decorator holds the configuration: what HTML tag to ' +
        'use, what template to render, what styles to apply. Think of the class as the brain and the ' +
        'decorator as the badge that says "I am a component, here is how I work."',
      keyPoints: [
        'Modern Angular components are standalone by default, so no NgModule boilerplate is needed. This was a big deal when it shipped.',
        'One component per file. It keeps things testable and easy to find. You will thank yourself later.',
        'Class names use PascalCase (EmergencyShelterComponent), selectors use kebab-case (app-emergency-shelter). This is a convention you will see in every Angular project.',
      ],
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Your shelter is online, but the status display is blank. Add a property to the class and show it ' +
        'in the template with {{ }}. This is called interpolation. Think of it like a name tag where the ' +
        'tag is always there, but the name written on it comes from somewhere else. You will dig into this ' +
        'properly in Chapter 2.',
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
        'The status property lives in the class. {{ status }} in the template tells Angular "grab the value ' +
        'of status and display it here as text." Data flows one way: from the class to the template. When ' +
        'the property changes, the display updates automatically.',
    },
    {
      stepType: 'code-challenge',
      prompt:
        'The station\'s diagnostic systems are dark. Build a complete Angular component from scratch: ' +
        'a diagnostic scanner with a @Component decorator, a selector, a template with an <h1>, and an ' +
        'exported class. You have done this once already. Now do it on your own.',
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
        'Start with @Component({ }) above your class. Inside, add selector and template properties.',
        "Selectors start with 'app-'. Class names end with 'Component'. The decorator goes directly above the class.",
      ],
      successMessage:
        'You just built your first Angular component from scratch. That decorator-plus-class pattern? ' +
        'You will write it hundreds of times. It will feel like second nature soon.',
      explanation:
        'Every Angular component follows the same shape: a @Component decorator configures the HTML tag ' +
        '(selector) and what gets rendered (template), while the class underneath holds the logic. This is ' +
        'the pattern you will build on for everything that follows.',
    } satisfies CodeChallengeStep,
  ],
  completionCriteria: {
    description: 'You built your first station module!',
    minStepsViewed: 5,
  },
};
