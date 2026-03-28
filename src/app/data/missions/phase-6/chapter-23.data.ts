import type { StoryMissionContent, CodeChallengeStep } from '../../../core/curriculum';

export const CHAPTER_23_CONTENT: StoryMissionContent = {
  chapterId: 23,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'Up to now, your components have used plain TypeScript properties — temperature = 294. That works, ' +
        'but Angular has no way to know when you change it. Every change detection cycle, it has to check ' +
        'EVERYTHING, even values that haven\'t moved. As Nexus Station scales into deep-space ops with ' +
        'hundreds of sensors streaming telemetry, that brute-force approach falls apart. Signals fix this. ' +
        'They wrap a value in a reactive container that tells Angular exactly when something changed — no ' +
        'polling, no guessing, no wasted checks.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Think of a signal like a spreadsheet cell. When you update cell A1, every formula referencing A1 ' +
        'recalculates automatically. That\'s what signal() gives you — a reactive value that Angular can ' +
        'track. You read it by calling it like a function, replace it with .set(), or derive a new value ' +
        'from the old one with .update().',
      code: [
        "import { Component, signal } from '@angular/core';",
        '',
        '@Component({',
        "  selector: 'app-temperature-sensor',",
        '  template: `',
        '    <p>Hull Temperature: {{ temperature() }}K</p>',
        '    <button (click)="calibrate()">Calibrate</button>',
        '    <button (click)="adjustBy(0.5)">+0.5K</button>',
        '  `,',
        '})',
        'export class TemperatureSensorComponent {',
        '  temperature = signal(294.15);',
        '',
        '  calibrate() {',
        '    this.temperature.set(293.0);',
        '  }',
        '',
        '  adjustBy(delta: number) {',
        '    this.temperature.update(current => current + delta);',
        '  }',
        '}',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [1, 12, 15, 19],
      explanation:
        'signal(294.15) creates a reactive container holding that initial value. To read it, you call ' +
        'temperature() — note the parentheses. That\'s how Angular knows your template depends on this ' +
        'value. .set() swaps in a completely new value, while .update() hands you the current value and ' +
        'lets you compute the next one. When the signal changes, Angular updates only the templates that ' +
        'actually read it. Nothing else gets touched.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Here\'s a common pattern you\'ll use constantly: a service owns the writable signal, but exposes ' +
        'only a read-only view to the rest of the app. Why? Because if any component could call .set() on ' +
        'your pressure data, you\'d have no idea where state changes are coming from. .asReadonly() draws ' +
        'a clear line — the service writes, everyone else reads.',
      code: [
        "import { Injectable, signal } from '@angular/core';",
        '',
        '@Injectable({ providedIn: \'root\' })',
        'export class SensorService {',
        '  private readonly _pressure = signal(101.3);',
        '',
        '  readonly pressure = this._pressure.asReadonly();',
        '',
        '  recordReading(value: number) {',
        '    this._pressure.set(value);',
        '  }',
        '',
        '  incrementPressure(delta: number) {',
        '    this._pressure.update(current => current + delta);',
        '  }',
        '}',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [1, 5, 7],
      explanation:
        '.asReadonly() returns a version of the signal that can be read but not written to. Components ' +
        'can call pressure() to get the value, but .set() and .update() are gone. This is the same ' +
        'ownership pattern you see in well-designed APIs everywhere: one place writes, many places read. ' +
        'It makes debugging vastly easier because state changes only happen in one spot.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'The sensor network is online. Before moving on, let\'s lock in what makes signals different from ' +
        'plain properties.',
      conceptTitle: 'Why Signals Matter — Fine-Grained Reactivity',
      conceptBody:
        'Plain properties work, but Angular can\'t tell when they change. It has to re-check every binding ' +
        'on every change detection cycle — that\'s called "dirty checking" and it doesn\'t scale. Signals ' +
        'flip the model: instead of Angular asking "did anything change?", the signal announces "I changed." ' +
        'This is fine-grained reactivity, and it\'s the foundation Angular is building its future on. ' +
        'You actually saw a hint of this back in Chapter 7 — signal-based inputs use the same underlying mechanism.',
      keyPoints: [
        'Signals notify Angular exactly which values changed, so it can skip everything else — that\'s a huge performance win',
        '.set() replaces the value outright; .update() gives you the previous value to compute the next one — pick whichever fits',
        'The parentheses in temperature() aren\'t just syntax — they\'re how Angular registers the dependency between your template and the signal',
        '.asReadonly() enforces single-owner state management: one service writes, everyone else observes',
      ],
    },
    {
      stepType: 'code-challenge',
      prompt:
        'The station\'s oxygen sensors went dark during the last power surge. Your job: bring them back ' +
        'online by replacing the plain property with a signal, and wiring up the template to read it reactively.',
      starterCode: [
        "import { Component } from '@angular/core';",
        '',
        '// TODO: Import the reactive value wrapper from Angular core',
        '',
        '@Component({',
        "  selector: 'app-oxygen-sensor',",
        '  template: `',
        '    <p>O2 Level: {{ oxygenLevel }}%</p>',
        '  `,',
        '})',
        'export class OxygenSensorComponent {',
        '  // TODO: Declare a reactive value wrapper initialized to 21',
        '}',
      ].join('\n'),
      language: 'typescript',
      validationRules: [
        {
          type: 'contains',
          value: 'signal(',
          errorMessage: 'Use signal() to create a reactive value wrapper',
        },
        {
          type: 'pattern',
          pattern: 'signal\\(21\\)',
          errorMessage: 'Initialize the signal with the value 21',
        },
        {
          type: 'pattern',
          pattern: 'oxygenLevel\\(\\)',
          errorMessage: 'Call oxygenLevel as a getter function in the template to read its value',
        },
        {
          type: 'notContains',
          value: '{{ oxygenLevel }}%',
          errorMessage: 'Read the signal by calling it as a function: {{ oxygenLevel() }}',
        },
      ],
      hints: [
        'Two things need to change: import signal from \'@angular/core\', then declare oxygenLevel = signal(21)',
        'The template still reads oxygenLevel without parentheses — that won\'t work for a signal. Change it to {{ oxygenLevel() }}',
      ],
      successMessage: 'Oxygen sensor is back online and streaming reactively. In the next chapter, you\'ll learn to derive new values from signals like this one.',
      explanation:
        'signal(21) wraps the value 21 in a reactive container. The parentheses in oxygenLevel() are ' +
        'critical — they tell Angular "this template depends on this signal." Without them, Angular sees ' +
        'a function reference instead of a value, and nothing updates. It\'s a small syntax change with big consequences.',
    } satisfies CodeChallengeStep,
    {
      stepType: 'code-challenge',
      prompt:
        'Now lock down the pressure data. The service should own a private writable signal, but expose ' +
        'only a read-only view. Components can observe the pressure, but they can\'t tamper with it.',
      starterCode: [
        "import { Injectable, signal } from '@angular/core';",
        '',
        "@Injectable({ providedIn: 'root' })",
        'export class PressureService {',
        '  _pressure = 0; // placeholder — not yet a signal',
        '  // TODO: Declare _pressure as a private writable reactive value starting at 101.3',
        '  pressure = this._pressure;',
        '',
        '  recordReading(value: number) {',
        '    // TODO: Replace the current pressure value',
        '  }',
        '}',
      ].join('\n'),
      language: 'typescript',
      validationRules: [
        {
          type: 'pattern',
          pattern: 'private.*_pressure.*=.*signal\\(',
          errorMessage: 'Declare a private writable signal named _pressure',
        },
        {
          type: 'contains',
          value: '.asReadonly()',
          errorMessage: 'Expose a read-only view with .asReadonly()',
        },
        {
          type: 'contains',
          value: '.set(',
          errorMessage: 'Use .set() to replace the pressure value in recordReading',
        },
        {
          type: 'pattern',
          pattern: 'this\\._pressure\\.set\\(value\\)',
          errorMessage: 'Call this._pressure.set(value) to record the new reading',
        },
      ],
      hints: [
        'Make _pressure private and a signal: private _pressure = signal(101.3)',
        'Expose the public version as pressure = this._pressure.asReadonly(), and write to it with this._pressure.set(value) inside recordReading',
      ],
      successMessage: 'Pressure data is locked down — one writer, many readers. This ownership pattern will serve you well in every Angular app you build.',
      explanation:
        'The private signal _pressure is the single source of truth. .asReadonly() strips away .set() ' +
        'and .update(), so consumers can only read. This isn\'t just a convenience — it\'s a design ' +
        'decision that makes state changes predictable and debuggable.',
    } satisfies CodeChallengeStep,
  ],
  completionCriteria: {
    description: 'Sensor network activated!',
    minStepsViewed: 6,
  },
};
