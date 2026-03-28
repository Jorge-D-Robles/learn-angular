import type { StoryMissionContent, CodeChallengeStep } from '../../../core/curriculum';

export const CHAPTER_25_CONTENT: StoryMissionContent = {
  chapterId: 25,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'Computed signals are read-only. That\'s great for values like "environment status" that should ' +
        'always reflect their inputs. But what about a dropdown that defaults to the first item in a list, ' +
        'yet lets the user pick something else? A computed signal won\'t let you override it. A plain ' +
        'signal won\'t reset when the list changes. linkedSignal() is the bridge — think of it like a ' +
        'thermostat default. It reads the outside temperature to pick a starting point, but you can crank ' +
        'the dial manually. When the season changes, the default resets.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'The shorthand form is the one you\'ll reach for most often. Pass a function that returns the ' +
        'default value, and Angular gives you back a writable signal. When the source signal changes, ' +
        'the default resets — even if the user had overridden it.',
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
        'selectedSector starts as "Alpha" — the first sector. Call .set(\'Delta\') and it becomes ' +
        '"Delta". Now here\'s the key behavior: if sectors changes to a completely new list, ' +
        'selectedSector snaps back to the first item of that new list. The override is gone. ' +
        'This is exactly what you want for things like dropdown defaults, tab selections, or any ' +
        'UI state that should reset when the underlying data changes.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Sometimes you want smarter reset logic. Maybe the user selected "Pressure" from a sensor list, ' +
        'and when the list refreshes, "Pressure" is still in it. Wouldn\'t it be better to keep that ' +
        'selection instead of resetting? The object form gives you access to the previous value so you ' +
        'can make that call.',
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
        'The object form separates source and computation. When availableSensors changes, computation ' +
        'receives the new list and a previous object with previous.value (the user\'s last selection) ' +
        'and previous.source (the old list). Here, we check if the old selection still exists in the ' +
        'new list. If it does, keep it. If not, fall back to the first sensor. This pattern is common ' +
        'in real apps — pagination resets, filter preservation, tab re-selection.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'Linked sensors are calibrated. Let\'s clarify when you\'d pick linkedSignal over computed or ' +
        'a plain signal.',
      conceptTitle: 'Linked Signals — The "Smart Default" Primitive',
      conceptBody:
        'The difference between computed, linkedSignal, and effect can be confusing at first. Here\'s ' +
        'the simple rule: if you\'re computing a VALUE that\'s always derived from its inputs, use ' +
        'computed. If you\'re computing a value that users can override, use linkedSignal. If you\'re ' +
        'DOING something (logging, API calls), use effect (next chapter). linkedSignal fills the gap ' +
        'between "fully derived" and "fully manual" — it gives you a sensible default that resets ' +
        'when the source changes, but stays writable for user interaction.',
      keyPoints: [
        'linkedSignal answers a specific question: "What if I need a default that resets, but users can override it?"',
        'The shorthand form linkedSignal(() => expr) covers most cases — dropdown defaults, tab selections, initial filter values',
        'The object form { source, computation } with previous access is for smarter resets — keeping a selection alive if it still exists',
        'If you never need .set(), you want computed. If you never need auto-reset, you want a plain signal.',
      ],
    },
    {
      stepType: 'code-challenge',
      prompt:
        'Docking control needs a bay selector that defaults to the first available bay. When the bay ' +
        'list changes (ships arrive, bays go offline), the selection should snap back to the new first ' +
        'option. But crew members can also pick a specific bay manually.',
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
        'Add linkedSignal to your import from \'@angular/core\'',
        'One line does it: selectedBay = linkedSignal(() => this.bays()[0]) — writable, auto-resetting, done',
      ],
      successMessage: 'Bay selector is wired up! Defaults reset automatically, overrides work when needed. One more piece to go: effects, for when you need to DO something rather than compute something.',
      explanation:
        'linkedSignal(() => this.bays()[0]) gives you a signal that starts as "Bay-A" and resets ' +
        'whenever bays changes. But .set() still works, so selectBay() can override the default. ' +
        'This is the pattern for any UI control that needs a sensible starting value tied to changing data.',
    } satisfies CodeChallengeStep,
  ],
  completionCriteria: {
    description: 'Linked sensors calibrated!',
    minStepsViewed: 5,
  },
};
