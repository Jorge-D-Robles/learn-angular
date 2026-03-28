import type { StoryMissionContent } from '../../../core/curriculum';

export const CHAPTER_28_CONTENT: StoryMissionContent = {
  chapterId: 28,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'Angular creates and destroys your components as the user navigates around. Until now, you ' +
        'haven\'t had any control over WHEN things happen during that process. What if you need to ' +
        'start a timer when a component appears, fetch data once inputs are ready, or clean up a ' +
        'subscription when the component is removed? Lifecycle hooks give you those control points — ' +
        'callbacks at key moments in a component\'s life: birth, change, and death.',
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
        'ngOnInit fires once after Angular has set all inputs — it\'s the right place for setup that ' +
        'depends on input values (the constructor runs too early for that). ngOnDestroy fires right ' +
        'before Angular removes the component, so you clear timers, close connections, and release ' +
        'anything that would otherwise leak. The OnInit and OnDestroy interfaces are optional but ' +
        'catch typos at compile time.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'What if you need to react every time an input changes, not just on the first render? ' +
        'ngOnChanges gives you both the previous and current values.',
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
        'ngOnChanges fires before ngOnInit on the first render, then again whenever any input changes. ' +
        'The SimpleChanges parameter gives you previousValue, currentValue, and firstChange for each ' +
        'input that changed. It\'s useful for recalculations that depend on comparing old and new values.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'A word of honesty: lifecycle hooks were more important before signals existed. Today, effects ' +
        '(Chapter 26) handle many cases that used to require ngOnInit and ngOnDestroy. But hooks are ' +
        'still essential for non-signal work, and you\'ll encounter them in every Angular codebase.',
      conceptTitle: 'Lifecycle Hooks — ngOnInit, ngOnChanges, ngOnDestroy',
      conceptBody:
        'These three hooks cover the vast majority of lifecycle needs. ngOnChanges fires whenever inputs ' +
        'change (including before ngOnInit on first render). ngOnInit fires once after inputs are ready — ' +
        'use it for setup that the constructor is too early for. ngOnDestroy fires before removal — use ' +
        'it to prevent memory leaks. The full order is: constructor, ngOnChanges, ngOnInit, then ' +
        'eventually ngOnDestroy.',
      keyPoints: [
        'ngOnInit is for setup that depends on inputs — the constructor runs before inputs are set',
        'ngOnDestroy prevents leaks — clear timers, unsubscribe, close connections here',
        'ngOnChanges gives you previous and current values for every input change',
        'Signals and effects (Ch 26) now handle many cases that used to need lifecycle hooks',
      ],
    },
  ],
  completionCriteria: {
    description: 'Startup/shutdown sequences calibrated!',
    minStepsViewed: 4,
  },
};
