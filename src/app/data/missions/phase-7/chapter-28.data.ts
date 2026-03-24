import type { StoryMissionContent } from '../../../core/curriculum';

export const CHAPTER_28_CONTENT: StoryMissionContent = {
  chapterId: 28,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'Station modules need controlled startup and shutdown sequences — sensors must be calibrated on ' +
        'initialization, subscriptions opened when modules come online, and resources released when modules ' +
        'power down. Angular lifecycle hooks let components run code at specific moments: after creation, ' +
        'when inputs change, and before destruction. Mastering these hooks ensures modules boot cleanly ' +
        'and shut down without leaking resources.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Implement OnInit to run initialization logic after Angular sets input properties, and ' +
        'OnDestroy to clean up resources before the component is removed.',
      code: [
        "import { Component, OnInit, OnDestroy, input } from '@angular/core';",
        '',
        '@Component({',
        "  selector: 'app-sensor-module',",
        '  template: `<p>Sensor {{ sensorId() }}: {{ status }}</p>`,',
        '})',
        'export class SensorModuleComponent implements OnInit, OnDestroy {',
        '  sensorId = input.required<number>();',
        "  status = 'offline';",
        '  private intervalId: ReturnType<typeof setInterval> | null = null;',
        '',
        '  ngOnInit() {',
        "    this.status = 'calibrating';",
        '    this.intervalId = setInterval(() => {',
        "      this.status = 'online';",
        '    }, 1000);',
        '  }',
        '',
        '  ngOnDestroy() {',
        '    if (this.intervalId) {',
        '      clearInterval(this.intervalId);',
        '    }',
        "    this.status = 'offline';",
        '  }',
        '}',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [1, 7, 12, 19],
      explanation:
        'ngOnInit runs once after Angular initializes all input properties — use it for setup logic ' +
        'that depends on inputs. ngOnDestroy runs just before Angular removes the component — use it ' +
        'to clear timers, unsubscribe from observables, and release resources. Implementing the OnInit ' +
        'and OnDestroy interfaces is optional but recommended for type safety.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Implement OnChanges to react whenever an input property changes. The SimpleChanges object ' +
        'provides both the previous and current values.',
      code: [
        "import { Component, OnChanges, SimpleChanges, input } from '@angular/core';",
        '',
        '@Component({',
        "  selector: 'app-power-display',",
        '  template: `',
        '    <p>Power Level: {{ powerLevel() }}%</p>',
        '    <p>Delta: {{ delta }}</p>',
        '  `,',
        '})',
        'export class PowerDisplayComponent implements OnChanges {',
        '  powerLevel = input.required<number>();',
        '  delta = 0;',
        '',
        '  ngOnChanges(changes: SimpleChanges) {',
        "    if (changes['powerLevel']) {",
        "      const prev = changes['powerLevel'].previousValue ?? 0;",
        "      const curr = changes['powerLevel'].currentValue;",
        '      this.delta = curr - prev;',
        '    }',
        '  }',
        '}',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [1, 10, 14, 15],
      explanation:
        'ngOnChanges fires before ngOnInit and again whenever any input property changes. The ' +
        'SimpleChanges parameter is a map keyed by input property name. Each entry has previousValue, ' +
        'currentValue, and firstChange (a boolean). Use this hook to respond to input changes that ' +
        'require recalculation or side effects.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'Startup and shutdown sequences are calibrated. Here is the Angular component lifecycle.',
      conceptTitle: 'Lifecycle Hooks — ngOnInit, ngOnChanges, ngOnDestroy',
      conceptBody:
        'Angular components have a lifecycle managed by the framework. ngOnChanges fires when input ' +
        'properties change (before ngOnInit on first run). ngOnInit fires once after the first ' +
        'ngOnChanges — use it for initialization logic. ngOnDestroy fires before the component is ' +
        'removed — use it for cleanup. These three hooks cover the vast majority of lifecycle needs.',
      keyPoints: [
        'ngOnInit runs once after inputs are set — ideal for initialization that depends on inputs',
        'ngOnDestroy runs before removal — clear timers, unsubscribe, release resources',
        'ngOnChanges fires on every input change with previous and current values',
        'Lifecycle order: constructor -> ngOnChanges -> ngOnInit -> ... -> ngOnDestroy',
      ],
    },
  ],
  completionCriteria: {
    description: 'Startup/shutdown sequences calibrated!',
    minStepsViewed: 4,
  },
};
