import type { StoryMissionContent } from '../../../core/curriculum';

export const CHAPTER_23_CONTENT: StoryMissionContent = {
  chapterId: 23,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'Nexus Station\'s environmental sensors have relied on periodic polling — fetching data on a fixed ' +
        'interval and manually refreshing every display. As the station expands into deep space operations, ' +
        'this approach cannot keep up with the volume of telemetry data. Angular Signals provide a reactive ' +
        'primitive: a value wrapper that automatically notifies consumers when the value changes, replacing ' +
        'polling with push-based reactivity.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Create a writable signal with signal() to hold a sensor reading. Read the signal by calling it ' +
        'as a getter function. Use .set() to replace the value and .update() to compute a new value from ' +
        'the previous one.',
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
        'signal() creates a writable signal with an initial value. Call the signal as a function — ' +
        'temperature() — to read its current value. The .set() method replaces the value entirely, ' +
        'while .update() receives the current value and returns a new one. Angular automatically ' +
        're-renders any template binding that reads the signal when its value changes.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Expose read-only signals from a service using .asReadonly(). This prevents components from ' +
        'accidentally modifying the canonical sensor data — only the service controls writes.',
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
        '.asReadonly() returns a read-only view of a writable signal. Consumers can call pressure() ' +
        'to read the value but cannot call .set() or .update() on it. This enforces a clear ownership ' +
        'boundary — the service owns the state, and components only observe it.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'The sensor network is online. Here is how signals work as Angular\'s reactive primitive.',
      conceptTitle: 'Creating Signals with signal(), .set(), .update(), and .asReadonly()',
      conceptBody:
        'Signals are reactive value wrappers that notify consumers when their value changes. Create a ' +
        'writable signal with signal(initialValue), read it by calling the getter function, replace ' +
        'the value with .set(), compute a new value with .update(), and expose a read-only view with ' +
        '.asReadonly(). Signals replace manual polling with automatic push-based updates.',
      keyPoints: [
        'signal() creates a writable signal that holds a value and notifies on change',
        '.set() replaces the value; .update() computes a new value from the current one',
        'Read a signal by calling it as a function — e.g., temperature()',
        '.asReadonly() exposes a read-only view to enforce ownership boundaries',
      ],
    },
  ],
  completionCriteria: {
    description: 'Sensor network activated!',
    minStepsViewed: 4,
  },
};
