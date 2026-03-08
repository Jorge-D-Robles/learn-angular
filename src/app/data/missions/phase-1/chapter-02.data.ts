import type { StoryMissionContent } from '../../../core/curriculum';

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
  ],
  completionCriteria: {
    description: 'Life support is displaying sensor data!',
    minStepsViewed: 4,
  },
};
