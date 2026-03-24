import type { StoryMissionContent } from '../../../core/curriculum';

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
  ],
  completionCriteria: {
    description: 'Custom sensors deployed!',
    minStepsViewed: 4,
  },
};
