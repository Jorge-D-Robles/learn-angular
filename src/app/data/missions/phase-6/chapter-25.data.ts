import type { StoryMissionContent, CodeChallengeStep } from '../../../core/curriculum';

export const CHAPTER_25_CONTENT: StoryMissionContent = {
  chapterId: 25,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'Some station sensor readings need a default that is derived from other signals, but crew members ' +
        'must be able to override that default manually. A computed signal is read-only, and a plain signal ' +
        'does not reset when its source changes. Angular\'s linkedSignal() bridges the gap — it creates a ' +
        'writable signal whose default value is derived from a source, but can be manually overridden and ' +
        'resets when the source changes.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Use the shorthand linkedSignal(() => ...) form to create a writable signal that resets its value ' +
        'whenever the source signal changes.',
      code: [
        "import { Component, signal, linkedSignal } from '@angular/core';",
        '',
        '@Component({',
        "  selector: 'app-sector-selector',",
        '  template: `',
        '    <p>Sectors: {{ sectors().join(", ") }}</p>',
        '    <p>Selected: {{ selectedSector() }}</p>',
        '    <button (click)="override()">Override</button>',
        '  `,',
        '})',
        'export class SectorSelectorComponent {',
        "  sectors = signal(['Alpha', 'Beta', 'Gamma']);",
        '',
        '  selectedSector = linkedSignal(() => this.sectors()[0]);',
        '',
        '  override() {',
        "    this.selectedSector.set('Delta');",
        '  }',
        '}',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [1, 14, 17],
      explanation:
        'linkedSignal(() => this.sectors()[0]) creates a writable signal that defaults to the first sector. ' +
        'You can call .set() to override the value. When sectors changes, the linkedSignal resets to the ' +
        'computation result — the new first sector — ensuring it always holds a valid value.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Use the source/computation object form to access the previous value and preserve user overrides ' +
        'when the source changes.',
      code: [
        "import { Component, signal, linkedSignal } from '@angular/core';",
        '',
        'interface Sensor { id: number; name: string; }',
        '',
        '@Component({',
        "  selector: 'app-sensor-picker',",
        '  template: `',
        '    <p>Active: {{ activeSensor().name }}</p>',
        '  `,',
        '})',
        'export class SensorPickerComponent {',
        '  availableSensors = signal<Sensor[]>([',
        "    { id: 1, name: 'Thermal' },",
        "    { id: 2, name: 'Pressure' },",
        "    { id: 3, name: 'Radiation' },",
        '  ]);',
        '',
        '  activeSensor = linkedSignal<Sensor[], Sensor>({',
        '    source: this.availableSensors,',
        '    computation: (newSensors, previous) => {',
        '      return newSensors.find(s => s.id === previous?.value.id)',
        '        ?? newSensors[0];',
        '    },',
        '  });',
        '',
        '  selectSensor(sensor: Sensor) {',
        '    this.activeSensor.set(sensor);',
        '  }',
        '}',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [1, 18, 19, 20, 21, 22],
      explanation:
        'The object form separates source and computation. When availableSensors changes, the computation ' +
        'receives the new sensor list and a previous object containing previous.value (the last linkedSignal ' +
        'value) and previous.source (the old source value). This lets you preserve the user\'s selection if ' +
        'it still exists in the new list, or fall back to a default.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'Linked sensors are calibrated. Here is how linkedSignal bridges computed and writable signals.',
      conceptTitle: 'Linked Signals — Writable Derived State',
      conceptBody:
        'linkedSignal() creates a writable signal whose default value is derived from a source signal. ' +
        'It resets when the source changes, but can be manually overridden with .set() or .update(). ' +
        'The shorthand form linkedSignal(() => expr) is concise for simple cases. The object form ' +
        '{ source, computation } gives access to the previous value for advanced reset logic.',
      keyPoints: [
        'linkedSignal() creates a writable signal with a derived default value',
        'The shorthand form linkedSignal(() => expr) resets on any dependency change',
        'The object form { source, computation } provides access to previous values',
        'Use linkedSignal when you need a default from signals that users can override',
      ],
    },
    {
      stepType: 'code-challenge',
      prompt:
        'The station\'s docking bay selector needs a default that updates when the available bays change. ' +
        'Create a linked signal that defaults to the first available bay.',
      starterCode: [
        "import { Component, signal } from '@angular/core';",
        '',
        '// TODO: Import the linked reactive wrapper from Angular core',
        '',
        '@Component({',
        "  selector: 'app-bay-selector',",
        '  template: `',
        "    <p>Bays: {{ bays().join(', ') }}</p>",
        '    <p>Selected: {{ selectedBay() }}</p>',
        '  `,',
        '})',
        'export class BaySelectorComponent {',
        "  bays = signal(['Bay-A', 'Bay-B', 'Bay-C']);",
        '',
        '  // TODO: Create a writable derived value that defaults to the first bay',
        '  // It should reset when bays changes',
        '',
        '  selectBay(bay: string) {',
        '    this.selectedBay.set(bay);',
        '  }',
        '}',
      ].join('\n'),
      language: 'typescript',
      validationRules: [
        {
          type: 'contains',
          value: 'linkedSignal(',
          errorMessage: 'Use linkedSignal() to create a writable signal with a derived default',
        },
        {
          type: 'pattern',
          pattern: 'linkedSignal\\(\\(\\)\\s*=>',
          errorMessage: 'Use the shorthand arrow-function form of linkedSignal',
        },
        {
          type: 'contains',
          value: 'this.bays()',
          errorMessage: 'Read the bays signal inside the linkedSignal derivation',
        },
        {
          type: 'pattern',
          pattern: 'this\\.bays\\(\\)\\[0\\]',
          errorMessage: 'Default to the first bay by accessing index [0]',
        },
      ],
      hints: [
        "Import linkedSignal from '@angular/core' alongside signal",
        'Define selectedBay = linkedSignal(() => this.bays()[0]) to derive the default from the first bay',
      ],
      successMessage: 'Bay selector linked! The default resets when available bays change.',
      explanation:
        'linkedSignal(() => expr) creates a writable signal whose default is derived from source signals. ' +
        'When the source changes, the linkedSignal resets. You can still override it with .set().',
    } satisfies CodeChallengeStep,
  ],
  completionCriteria: {
    description: 'Linked sensors calibrated!',
    minStepsViewed: 5,
  },
};
