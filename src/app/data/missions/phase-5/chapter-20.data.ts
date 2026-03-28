import type { StoryMissionContent, CodeChallengeStep } from '../../../core/curriculum';

export const CHAPTER_20_CONTENT: StoryMissionContent = {
  chapterId: 20,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'Your components display raw data — Unix timestamps, unformatted decimals, bare strings. ' +
        'Users don\'t want to see "1711612800000." They want "March 28, 2025." Pipes transform data ' +
        'right in the template without touching the source value. Think of them like display formatters ' +
        'on a calculator: the underlying number is always 1250.50, but the display shows "$1,250.50."',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Angular ships with built-in pipes for the most common formatting tasks. DatePipe, DecimalPipe, ' +
        'and CurrencyPipe handle dates, numbers, and money. You apply them in templates with the | ' +
        'operator — the value on the left flows through the pipe on the right.',
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
        'The | operator sends a value through a pipe. DatePipe turns Date objects into readable strings, ' +
        'DecimalPipe adds locale-aware digit grouping, and CurrencyPipe prefixes a currency symbol. ' +
        'The original values — lastReading, temperature, repairCost — are never modified. Pipes produce ' +
        'a new formatted string purely for display.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Text and percentage formatting follow the same pattern. UpperCasePipe and LowerCasePipe ' +
        'change casing, while PercentPipe converts a decimal to a percentage. Same | syntax, same ' +
        'import-and-register flow.',
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
        'UpperCasePipe transforms "Alpha Sector" into "ALPHA SECTOR." LowerCasePipe does the reverse. ' +
        'PercentPipe multiplies 0.87 by 100 and appends "%", giving you "87%." Notice that none of these ' +
        'pipes change the component\'s actual data — sectorName is still "Alpha Sector" in the class. ' +
        'The transformation only exists in the rendered template.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'Sensor data is readable now. The key insight: pipes are a presentation-layer concern. They sit ' +
        'between your data and the user\'s eyes.',
      conceptTitle: 'Built-in Pipes — Formatting Without Mutating',
      conceptBody:
        'Pipes are pure functions applied in templates with the | operator. They take a raw value in and ' +
        'return a formatted string out, leaving the source data untouched. Angular\'s built-in pipes cover ' +
        'dates, numbers, currency, percentages, and text casing. To use one, import the pipe class and ' +
        'add it to your component\'s imports array.',
      keyPoints: [
        'Pipes transform display output only — the underlying data stays exactly as it is',
        'DatePipe, DecimalPipe, CurrencyPipe handle the most common numeric formatting',
        'UpperCasePipe, LowerCasePipe, and PercentPipe cover text and percentage display',
        'Each pipe must be imported in the component\'s imports array before you can use it in a template',
      ],
    },
    {
      stepType: 'code-challenge',
      prompt:
        'Format the sensor readouts. Import the right pipes from @angular/common and apply them: ' +
        'sector name in uppercase, timestamp as a date, and budget as currency.',
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
      successMessage:
        'Raw data, meet readable display. You\'ve turned timestamps into dates and decimals into dollars. ' +
        'Next up: pipe parameters for fine-grained control over formatting.',
      explanation:
        'Each pipe class needs two things: an import statement at the top of the file and an entry in the ' +
        'component\'s imports array. Once registered, you apply pipes in the template with | followed by ' +
        'the pipe name. The original values stay untouched in the component class.',
    } satisfies CodeChallengeStep,
  ],
  completionCriteria: {
    description: 'Sensor data formatted!',
    minStepsViewed: 5,
  },
};
