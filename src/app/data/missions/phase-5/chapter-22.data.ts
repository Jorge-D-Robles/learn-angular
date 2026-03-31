import type { StoryMissionContent, CodeChallengeStep } from '../../../core/curriculum';

export const CHAPTER_22_CONTENT: StoryMissionContent = {
  chapterId: 22,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'Angular\'s built-in pipes cover common cases, but your app has its own vocabulary. Astronomical ' +
        'distances in light-years, station-specific status codes, temperature conversions between Kelvin ' +
        'and Celsius. None of these ship with Angular. Custom pipes let you build your own reusable ' +
        'transformers that plug into templates with the same | syntax you already know.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'A custom pipe is a class decorated with @Pipe that implements PipeTransform. The @Pipe decorator ' +
        'gives it a name for template use. The transform() method does the actual work: value in, ' +
        'formatted string out.',
      code: [
        "import { Pipe, PipeTransform } from '@angular/core';",
        '',
        "@Pipe({ name: 'distance', standalone: true })",
        'export class DistancePipe implements PipeTransform {',
        "  transform(meters: number): string {",
        '    if (meters < 1000) {',
        '      return `${meters.toFixed(0)} m`;',
        '    } else if (meters < 1_000_000) {',
        '      return `${(meters / 1000).toFixed(1)} km`;',
        '    } else {',
        '      const ly = meters / 9.461e15;',
        '      return `${ly.toFixed(4)} ly`;',
        '    }',
        '  }',
        '}',
        '',
        '// Usage in template:',
        '// <p>Distance: {{ 4500 | distance }}</p>',
        '// Output: "4.5 km"',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [1, 3, 4, 5],
      explanation:
        '@Pipe gives the class a name, and that\'s what you write after | in templates. PipeTransform is ' +
        'an interface with one required method: transform(). It receives the value from the left side of ' +
        'the | and returns the formatted result. The standalone: true flag makes the pipe directly ' +
        'importable in any component, just like standalone components.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Custom pipes can encapsulate any domain logic. This StatusPipe maps numeric codes to ' +
        'human-readable labels, the kind of lookup that would otherwise clutter your template or ' +
        'force you to add a helper method to every component that needs it.',
      code: [
        "import { Pipe, PipeTransform } from '@angular/core';",
        '',
        'interface StatusInfo {',
        '  label: string;',
        "  level: 'ok' | 'warning' | 'critical';",
        '}',
        '',
        "const STATUS_MAP: Record<number, StatusInfo> = {",
        "  0: { label: 'Offline', level: 'critical' },",
        "  1: { label: 'Standby', level: 'warning' },",
        "  2: { label: 'Operational', level: 'ok' },",
        "  3: { label: 'Overloaded', level: 'critical' },",
        '};',
        '',
        "@Pipe({ name: 'status', standalone: true })",
        'export class StatusPipe implements PipeTransform {',
        "  transform(code: number): string {",
        "    return STATUS_MAP[code]?.label ?? 'Unknown';",
        '  }',
        '}',
        '',
        '// Usage in template:',
        '// <span>{{ systemStatus | status }}</span>',
        '// Input: 2 -> Output: "Operational"',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [1, 15, 16, 17, 18],
      explanation:
        'The StatusPipe hides a lookup table behind a clean template expression. Instead of writing ' +
        'a switch statement or method in every component, you write {{ code | status }} and the pipe ' +
        'handles the mapping. Keep pipes pure, with no HTTP calls and no side effects, so Angular can skip ' +
        're-running them when the input hasn\'t changed (reference equality check).',
    },
    {
      stepType: 'concept',
      narrativeText:
        'Custom pipes give you domain-specific formatting that\'s reusable across the entire app. ' +
        'Build once, use everywhere, with the same | syntax as the built-ins.',
      conceptTitle: 'Custom Pipes: Your Own Template Transformers',
      conceptBody:
        'When built-in pipes don\'t cover your needs, build a custom one. Decorate a class with @Pipe ' +
        'to give it a template name, implement PipeTransform to define the transform() method, and ' +
        'import it in any component that needs it. Keep the transform logic pure, with no side effects ' +
        'and no service dependencies, so Angular can optimize when to re-run it.',
      keyPoints: [
        '@Pipe({ name: \'myPipe\' }) registers the class as a pipe, and the name is what you write after | in templates',
        'PipeTransform enforces the transform() contract: value in, formatted result out',
        'Pure pipes only re-execute when their input reference changes, so Angular skips unnecessary work',
        'Custom pipes use the exact same | syntax and chaining as built-in pipes, so they feel native',
      ],
    },
    {
      stepType: 'code-challenge',
      prompt:
        'Build a temperature converter. Create a @Pipe named \'kelvinToCelsius\' that subtracts 273.15 ' +
        'from the input and returns a formatted Celsius string.',
      starterCode: [
        "import { Pipe, PipeTransform } from '@angular/core';",
        '',
        '// TODO: Add the decorator that registers this as a named template transformer',
        'export class KelvinToCelsiusPipe implements PipeTransform {',
        '  // TODO: Implement the required conversion method',
        '}',
      ].join('\n'),
      language: 'typescript',
      validationRules: [
        {
          type: 'contains',
          value: '@Pipe',
          errorMessage: 'Add the @Pipe decorator to register this class as a pipe',
        },
        {
          type: 'pattern',
          pattern: "name:\\s*'kelvinToCelsius'",
          errorMessage: "Set the pipe name to 'kelvinToCelsius' in the @Pipe decorator",
        },
        {
          type: 'contains',
          value: 'transform(',
          errorMessage: 'Implement the transform() method required by PipeTransform',
        },
        {
          type: 'contains',
          value: '273.15',
          errorMessage: 'Subtract 273.15 from the Kelvin value to convert to Celsius',
        },
        {
          type: 'pattern',
          pattern: ':\\s*string',
          errorMessage: 'Return a string from the transform method (formatted result)',
        },
      ],
      hints: [
        "Add @Pipe({ name: 'kelvinToCelsius', standalone: true }) above the class declaration",
        'Write transform(kelvin: number): string and return something like `${(kelvin - 273.15).toFixed(1)} C`',
      ],
      successMessage:
        'Your first custom pipe. It\'s a standalone, reusable transformer that any component can import. ' +
        'Now let\'s put it to work in a real template.',
      explanation:
        '@Pipe gives Angular a name to match against | expressions in templates. PipeTransform requires ' +
        'the transform() method, and that\'s where your conversion logic lives. The return type is string ' +
        'because pipes produce display-ready output. Build it once, import it anywhere.',
    } satisfies CodeChallengeStep,
    {
      stepType: 'code-challenge',
      prompt:
        'Deploy the converter. Import KelvinToCelsiusPipe into a component, add it to the imports array, ' +
        'and apply it in the template so the engine temperature displays in Celsius.',
      starterCode: [
        "import { Component } from '@angular/core';",
        '',
        '// TODO: Import the temperature conversion pipe',
        '',
        '@Component({',
        "  selector: 'app-temp-display',",
        '  // TODO: Register the conversion pipe in the component metadata',
        '  imports: [],',
        '  template: `',
        '    <p>Engine Temp: {{ engineTemp }}K</p>',
        '  `,',
        '})',
        'export class TempDisplayComponent {',
        '  engineTemp = 573.15;',
        '}',
      ].join('\n'),
      language: 'typescript',
      validationRules: [
        {
          type: 'contains',
          value: 'KelvinToCelsiusPipe',
          errorMessage: 'Import KelvinToCelsiusPipe to use the custom pipe',
        },
        {
          type: 'contains',
          value: '| kelvinToCelsius',
          errorMessage: 'Apply the kelvinToCelsius pipe to engineTemp in the template',
        },
        {
          type: 'pattern',
          pattern: 'imports:.*KelvinToCelsius',
          flags: 's',
          errorMessage: "Add KelvinToCelsiusPipe to the component's imports array",
        },
        {
          type: 'notContains',
          value: '{{ engineTemp }}K',
          errorMessage: 'Pipe the temperature through the custom converter instead of displaying raw Kelvin',
        },
      ],
      hints: [
        'Import KelvinToCelsiusPipe from its file and add it to the imports array',
        'Change {{ engineTemp }}K to {{ engineTemp | kelvinToCelsius }} in the template',
      ],
      successMessage:
        'Custom pipe deployed and working in a real component. You can pass parameters, chain it with ' +
        'other pipes, and import it in any component across the station. That\'s the full pipe toolkit.',
      explanation:
        'Custom pipes follow the same workflow as built-in pipes: import the class, add it to the ' +
        'component\'s imports array, and apply it with | in the template. You can chain custom pipes ' +
        'with built-in pipes and pass parameters with colons. They\'re first-class citizens.',
    } satisfies CodeChallengeStep,
  ],
  completionCriteria: {
    description: 'Custom sensors deployed!',
    minStepsViewed: 6,
  },
};
