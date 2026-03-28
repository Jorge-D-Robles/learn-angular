import type { StoryMissionContent, CodeChallengeStep } from '../../../core/curriculum';

export const CHAPTER_22_CONTENT: StoryMissionContent = {
  chapterId: 22,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'Built-in pipes handle standard formats, but the station uses custom units that Angular does not ' +
        'know about — astronomical distances in light-years, station-specific status codes, and relative ' +
        'timestamps. You need custom pipes: small, focused transformer classes that you build once and ' +
        'reuse across the entire station.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Create a DistancePipe that converts raw meter values into human-readable distance strings ' +
        'with appropriate units. The @Pipe decorator names the pipe for template use, and PipeTransform ' +
        'enforces the transform() method contract.',
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
        '@Pipe names the pipe for use in templates. PipeTransform is an interface requiring a ' +
        'transform() method that receives the input value and returns the formatted output. ' +
        'The standalone: true flag makes the pipe importable directly in components. Custom pipes ' +
        'follow the same | syntax as built-in pipes.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Here is a StatusPipe that converts numeric status codes into display-friendly labels ' +
        'with color hints for the crew dashboard.',
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
        'Custom pipes can encapsulate any transformation logic — lookups, calculations, or ' +
        'string formatting. The StatusPipe maps numeric codes to human-readable labels using a ' +
        'simple record. Keep pipes pure (no side effects) for optimal performance, as Angular ' +
        'can skip re-running pure pipes when inputs have not changed.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'Custom sensor transformers are deployed. Here is how to create your own pipes in Angular.',
      conceptTitle: 'Custom Pipes with @Pipe and PipeTransform',
      conceptBody:
        'Custom pipes extend Angular\'s transformation system with your own logic. Decorate a class ' +
        'with @Pipe to name it, implement PipeTransform to define the transform() method, and use ' +
        'it in templates with the same | syntax as built-in pipes. Keep pipes pure — no side effects, ' +
        'no service calls — for the best performance.',
      keyPoints: [
        '@Pipe decorator names the pipe for template use',
        'PipeTransform interface requires a transform() method',
        'Pure pipes only re-run when their input value changes (reference check)',
        'Custom pipes follow the same | syntax as built-in pipes',
      ],
    },
    {
      stepType: 'code-challenge',
      prompt:
        'Build a custom temperature converter! Create a @Pipe class that converts Kelvin readings ' +
        'to Celsius by subtracting 273.15 and formatting the result.',
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
        'Implement transform(kelvin: number): string that returns a formatted Celsius string',
      ],
      successMessage: 'Temperature converter deployed! The crew can now read Celsius on all displays.',
      explanation:
        '@Pipe registers a class as an Angular pipe with a template name. PipeTransform requires a ' +
        'transform() method that takes the input value and returns the formatted output. Custom pipes ' +
        'use the same | syntax as built-in pipes.',
    } satisfies CodeChallengeStep,
    {
      stepType: 'code-challenge',
      prompt:
        'Deploy the temperature converter! Import your KelvinToCelsiusPipe into a component and ' +
        'use it in the template.',
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
      successMessage: 'Custom pipe deployed! Temperature readings now display in Celsius across the station.',
      explanation:
        'Custom pipes are used in templates with the same | syntax as built-in pipes. Import the pipe ' +
        "class and add it to the component's imports array. You can pass parameters with colons, just " +
        'like built-in pipes.',
    } satisfies CodeChallengeStep,
  ],
  completionCriteria: {
    description: 'Custom sensors deployed!',
    minStepsViewed: 6,
  },
};
