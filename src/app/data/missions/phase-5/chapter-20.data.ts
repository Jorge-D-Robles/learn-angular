import type { StoryMissionContent } from '../../../core/curriculum';

export const CHAPTER_20_CONTENT: StoryMissionContent = {
  chapterId: 20,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'The station\'s sensors are streaming raw data — timestamps as Unix epochs, distances as raw ' +
        'meters, temperatures as unformatted decimals. Crew members cannot read these values at a glance. ' +
        'Angular pipes transform data directly in templates, converting raw values into human-readable ' +
        'formats without modifying the underlying data.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Angular provides built-in pipes for common formatting needs. The DatePipe, DecimalPipe, and ' +
        'CurrencyPipe handle the most frequent transformations.',
      code: [
        "import { Component } from '@angular/core';",
        "import { DatePipe, DecimalPipe, CurrencyPipe } from '@angular/common';",
        '',
        '@Component({',
        "  selector: 'app-sensor-readout',",
        '  imports: [DatePipe, DecimalPipe, CurrencyPipe],',
        '  template: `',
        '    <p>Timestamp: {{ lastReading | date }}</p>',
        '    <p>Temperature: {{ temperature | number }}K</p>',
        '    <p>Repair Cost: {{ repairCost | currency }}</p>',
        '  `,',
        '})',
        'export class SensorReadoutComponent {',
        '  lastReading = new Date();',
        '  temperature = 294.15;',
        '  repairCost = 1250.5;',
        '}',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [2, 6, 8, 9, 10],
      explanation:
        'Pipes are applied in templates using the | operator. DatePipe formats Date objects, ' +
        'DecimalPipe formats numbers with locale-aware grouping, and CurrencyPipe adds currency ' +
        'symbols and formatting. Import each pipe in the component\'s imports array to use it.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'More built-in pipes handle text transformations and percentage formatting for the crew ' +
        'status displays.',
      code: [
        "import { Component } from '@angular/core';",
        "import { UpperCasePipe, LowerCasePipe, PercentPipe } from '@angular/common';",
        '',
        '@Component({',
        "  selector: 'app-crew-status',",
        '  imports: [UpperCasePipe, LowerCasePipe, PercentPipe],',
        '  template: `',
        '    <h3>{{ sectorName | uppercase }}</h3>',
        '    <p>Status: {{ statusText | lowercase }}</p>',
        '    <p>Hull Integrity: {{ hullIntegrity | percent }}</p>',
        '  `,',
        '})',
        'export class CrewStatusComponent {',
        "  sectorName = 'Alpha Sector';",
        "  statusText = 'OPERATIONAL';",
        '  hullIntegrity = 0.87;',
        '}',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [2, 6, 8, 9, 10],
      explanation:
        'UpperCasePipe and LowerCasePipe transform text casing. PercentPipe multiplies a decimal ' +
        'by 100 and appends a % symbol. These pipes never modify the original value — they create ' +
        'a new formatted string for display only.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'Sensor data is now readable. Here is how pipes work in Angular templates.',
      conceptTitle: 'Using Pipes for Template Data Transformation',
      conceptBody:
        'Pipes are pure functions that transform values in templates without changing the source data. ' +
        'Angular provides built-in pipes for dates, numbers, currency, percentages, and text casing. ' +
        'Apply them with the | operator in template expressions. Import each pipe in the component\'s ' +
        'imports array.',
      keyPoints: [
        'DatePipe, DecimalPipe, CurrencyPipe format dates, numbers, and money',
        'UpperCasePipe, LowerCasePipe, PercentPipe handle text and percentage formatting',
        'Pipes do not mutate the original value — they return a new formatted string',
        'Import pipes in the component imports array to use them in templates',
      ],
    },
  ],
  completionCriteria: {
    description: 'Sensor data formatted!',
    minStepsViewed: 4,
  },
};
