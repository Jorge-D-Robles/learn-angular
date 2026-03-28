import type { StoryMissionContent, CodeChallengeStep } from '../../../core/curriculum';

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
    {
      stepType: 'code-challenge',
      prompt:
        'Format the station sensor readouts! Import and use built-in pipes to display the sector ' +
        'name in uppercase, the timestamp as a date, and the repair budget as currency.',
      starterCode: [
        "import { Component } from '@angular/core';",
        '',
        '// TODO: Import the formatting pipes from the common module',
        '',
        '@Component({',
        "  selector: 'app-sensor-display',",
        '  // TODO: Register the imported formatters in the component metadata',
        '  imports: [],',
        '  template: `',
        '    <h3>{{ sectorName }}</h3>',
        '    <p>Last reading: {{ timestamp }}</p>',
        '    <p>Budget: {{ budget }}</p>',
        '  `,',
        '})',
        'export class SensorDisplayComponent {',
        "  sectorName = 'Delta Sector';",
        '  timestamp = new Date();',
        '  budget = 4500.75;',
        '}',
      ].join('\n'),
      language: 'typescript',
      validationRules: [
        {
          type: 'contains',
          value: 'UpperCasePipe',
          errorMessage: 'Import UpperCasePipe from @angular/common to format text',
        },
        {
          type: 'contains',
          value: '| uppercase',
          errorMessage: 'Apply the uppercase pipe to the sector name in the template',
        },
        {
          type: 'contains',
          value: '| date',
          errorMessage: 'Apply the date pipe to the timestamp in the template',
        },
        {
          type: 'contains',
          value: '| currency',
          errorMessage: 'Apply the currency pipe to the budget in the template',
        },
      ],
      hints: [
        "Import UpperCasePipe, DatePipe, CurrencyPipe from '@angular/common' and add them to imports",
        'Use {{ sectorName | uppercase }}, {{ timestamp | date }}, and {{ budget | currency }} in the template',
      ],
      successMessage: 'Sensor display formatted! Built-in pipes transform raw data for the crew.',
      explanation:
        'Built-in pipes like UpperCasePipe, DatePipe, and CurrencyPipe format values directly in ' +
        'templates. Import each pipe in the component\'s imports array and apply them using the | operator.',
    } satisfies CodeChallengeStep,
  ],
  completionCriteria: {
    description: 'Sensor data formatted!',
    minStepsViewed: 5,
  },
};
