import type { StoryMissionContent, CodeChallengeStep } from '../../../core/curriculum';

export const CHAPTER_02_CONTENT: StoryMissionContent = {
  chapterId: 2,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'The emergency shelter is holding, but the life support panel is blank — oxygen levels, temperature, ' +
        'pressure — all invisible. The sensors are working, but nothing is wired to the display. You need ' +
        'interpolation: the ability to take data from your component class and render it in the template.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Wire the life support sensors to the display. Use double curly braces {{ }} to show component ' +
        'data in the template.',
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
        'The double curly braces {{ }} tell Angular to evaluate the expression inside and insert the result ' +
        'as text. Here, oxygenLevel and temperature are class properties displayed in the template.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Interpolation is not limited to simple variables. You can use expressions — math, string ' +
        'concatenation, method calls — anything that produces a value.',
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
        'Expressions inside {{ }} are evaluated at render time. You can do math (temperature * 9/5 + 32), ' +
        'concatenate strings, or reference any public property. Angular re-evaluates these whenever the data changes.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'Life support is displaying sensor data across the shelter. Here is what you need to remember about interpolation.',
      conceptTitle: 'Interpolation {{ }}',
      conceptBody:
        'Interpolation is one-way data binding from the component class to the template. Angular evaluates ' +
        'the expression inside {{ }} and converts the result to a string. When the underlying data changes, ' +
        'Angular automatically updates the display.',
      keyPoints: [
        'Use {{ expression }} to display dynamic values in the template',
        'Expressions can include math, string operations, and method calls',
        'Angular updates interpolated values automatically when data changes',
      ],
    },
    {
      stepType: 'code-challenge',
      prompt:
        'The sensor array is reading data but the display is blank. Write a component that declares ' +
        'properties and displays them in the template using interpolation {{ }}.',
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
        'Declare properties in the class body like: propertyName = value;',
        'Use {{ propertyName }} in the template to display property values',
      ],
      successMessage:
        'Sensor display is live! Data flows from class properties to the template via interpolation.',
      explanation:
        'Interpolation {{ }} is Angular\'s way of displaying component data in the view. Any public ' +
        'property on the class can be rendered in the template using double curly braces.',
    } satisfies CodeChallengeStep,
  ],
  completionCriteria: {
    description: 'Life support is displaying sensor data!',
    minStepsViewed: 5,
  },
};
