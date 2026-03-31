import type { StoryMissionContent, CodeChallengeStep } from '../../../core/curriculum';

export const CHAPTER_02_CONTENT: StoryMissionContent = {
  chapterId: 2,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'The emergency shelter is holding, but the life support panel is blank. Oxygen levels, temperature, ' +
        'pressure, all invisible. The sensors are working fine. The problem is that nothing is wired to the ' +
        'display. In Chapter 1, you snuck in a status property with {{ status }}. That was interpolation, ' +
        'Angular\'s way of pulling data from your class and showing it in the template. Now you will see why ' +
        'it is one of the most-used features in Angular.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Wire the life support sensors to the display. Double curly braces {{ }} are the interpolation syntax. ' +
        'Whatever expression you put inside gets evaluated and turned into text on screen.',
      code: [
        "import { Component } from '@angular/core';",
        '',
        '@Component({',
        "  selector: 'app-life-support',",
        '  template: `',
        '    <h2>Life Support</h2>',
        '    <p>Oxygen: {{ oxygenLevel }}%</p>',
        '    <p>Temperature: {{ temperature }}C</p>',
        '  `,',
        '})',
        'export class LifeSupportComponent {',
        '  oxygenLevel = 98;',
        '  temperature = 21.5;',
        '}',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [7, 8],
      explanation:
        'Angular sees {{ oxygenLevel }}, looks up the oxygenLevel property on the class, and inserts its ' +
        'value as text. If oxygenLevel changes later, the display updates automatically. You do not need to ' +
        'manually refresh anything. That is Angular\'s job.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'You are not limited to simple variable names inside {{ }}. You can do math, call methods, ' +
        'concatenate strings, anything that produces a value. Angular evaluates the expression every time ' +
        'the data might have changed.',
      code: [
        "import { Component } from '@angular/core';",
        '',
        '@Component({',
        "  selector: 'app-life-support',",
        '  template: `',
        '    <p>Temp (F): {{ temperature * 9/5 + 32 }}</p>',
        "    <p>{{ 'Status: ' + status }}</p>",
        '    <p>Crew: {{ crewCount }} members</p>',
        '  `,',
        '})',
        'export class LifeSupportComponent {',
        '  temperature = 21.5;',
        "  status = 'nominal';",
        '  crewCount = 4;',
        '}',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [6, 7, 8],
      explanation:
        'Inside {{ }}, you can write expressions: math like temperature * 9/5 + 32, string concatenation, ' +
        'or just a property name. Angular re-evaluates these whenever the underlying data changes. Keep ' +
        'expressions simple though. Heavy logic belongs in the class, not the template.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'Life support data is flowing to the display. The core idea here is straightforward, but worth ' +
        'naming properly.',
      conceptTitle: 'Interpolation {{ }}',
      conceptBody:
        'Interpolation is one-way data binding: data flows from the component class into the template, never ' +
        'the other direction. Angular evaluates whatever is inside {{ }}, converts the result to a string, ' +
        'and inserts it into the DOM. When the data changes? Angular handles the update for you.',
      keyPoints: [
        '{{ expression }} evaluates to text. It always converts to a string, even numbers and booleans become text. This matters more than you might think (Chapter 5 will show you why).',
        'You can put expressions in there (math, method calls, ternaries) but keep them short. If it takes more than a glance to read, move the logic to the class.',
        'Angular watches for changes and re-renders automatically. You never manually "refresh" an interpolation.',
      ],
    },
    {
      stepType: 'code-challenge',
      prompt:
        'The sensor array is reading data but the display is dark. Declare some properties on the class ' +
        'and wire them to the template with {{ }}. Replace both TODO comments with real code.',
      starterCode: [
        "import { Component } from '@angular/core';",
        '',
        '@Component({',
        "  selector: 'app-sensor-display',",
        '  template: `',
        '    <h2>Sensor Display</h2>',
        '    <!-- TODO: Display sensorName and reading using {{ }} interpolation -->',
        '  `,',
        '})',
        'export class SensorDisplayComponent {',
        '  // TODO: Add sensorName (string) and reading (number) properties',
        '}',
      ].join('\n'),
      language: 'typescript',
      validationRules: [
        {
          type: 'pattern',
          pattern: '\\w+\\s*=\\s*.+;',
          errorMessage: 'Declare at least one class property with an assigned value',
        },
        {
          type: 'pattern',
          pattern: '\\{\\{\\s*\\w+',
          errorMessage: 'Use {{ propertyName }} interpolation syntax in the template',
        },
        {
          type: 'contains',
          value: '@Component',
          errorMessage: 'Keep the @Component decorator on the class',
        },
        {
          type: 'pattern',
          pattern: 'template:\\s*`',
          errorMessage: 'Keep the template using a backtick string',
        },
        {
          type: 'notContains',
          value: '// TODO',
          errorMessage: 'Complete all TypeScript TODO comments',
        },
        {
          type: 'notContains',
          value: '<!-- TODO',
          errorMessage: 'Complete all HTML template TODO comments',
        },
      ],
      hints: [
        'In the class body, declare properties with values: sensorName = \'Thermal\'; reading = 42;',
        'In the template, use {{ sensorName }} and {{ reading }} to display them.',
      ],
      successMessage:
        'Sensor display is live. Data flows from class to template, and Angular keeps it in sync. ' +
        'This one-way binding is the foundation for everything you will build.',
      explanation:
        'Interpolation is how you get data from your component class onto the screen. Declare a property, ' +
        'reference it with {{ }}, and Angular handles the rest. Simple, but you will use it constantly.',
    } satisfies CodeChallengeStep,
  ],
  completionCriteria: {
    description: 'Life support is displaying sensor data!',
    minStepsViewed: 5,
  },
};
