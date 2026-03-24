import type { StoryMissionContent } from '../../../core/curriculum';

export const CHAPTER_26_CONTENT: StoryMissionContent = {
  chapterId: 26,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'The station needs automated responses — when a signal crosses a threshold, external systems ' +
        'must react: alarms sound, logs are written, hardware actuators engage. These are side effects ' +
        'that cannot be expressed as derived values. Angular\'s effect() function runs imperative code ' +
        'whenever one or more signal dependencies change, bridging reactive signals with external APIs.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Create an effect inside a component constructor. The effect runs once initially and again ' +
        'whenever any signal it reads changes.',
      code: [
        "import { Component, signal, effect } from '@angular/core';",
        '',
        '@Component({',
        "  selector: 'app-alert-monitor',",
        '  template: `',
        '    <p>Temperature: {{ temperature() }}K</p>',
        '    <button (click)="raise()">+10K</button>',
        '  `,',
        '})',
        'export class AlertMonitorComponent {',
        '  temperature = signal(294);',
        '',
        '  constructor() {',
        '    effect(() => {',
        '      const temp = this.temperature();',
        '      if (temp > 350) {',
        "        console.warn('THERMAL ALERT:', temp, 'K');",
        '      }',
        '    });',
        '  }',
        '',
        '  raise() {',
        '    this.temperature.update(t => t + 10);',
        '  }',
        '}',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [1, 14, 15, 16],
      explanation:
        'effect() registers a callback that Angular runs whenever its signal dependencies change. ' +
        'It must be created in an injection context — typically a constructor. The effect tracks which ' +
        'signals are read during execution and re-runs when any of them change. Use effects for side ' +
        'effects like logging, analytics, or interacting with browser APIs.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Use the onCleanup parameter to cancel long-running operations when the effect re-runs or ' +
        'is destroyed. This prevents stale timers and leaked resources.',
      code: [
        "import { Component, signal, effect } from '@angular/core';",
        '',
        '@Component({',
        "  selector: 'app-beacon-transmitter',",
        '  template: `',
        '    <p>Beacon interval: {{ intervalMs() }}ms</p>',
        '  `,',
        '})',
        'export class BeaconTransmitterComponent {',
        '  intervalMs = signal(5000);',
        '',
        '  constructor() {',
        '    effect((onCleanup) => {',
        '      const ms = this.intervalMs();',
        '      const timer = setInterval(() => {',
        "        console.log('Beacon transmitted');",
        '      }, ms);',
        '',
        '      onCleanup(() => {',
        '        clearInterval(timer);',
        '      });',
        '    });',
        '  }',
        '}',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [1, 13, 19, 20],
      explanation:
        'The onCleanup function is passed as the first parameter to the effect callback. Register a ' +
        'cleanup callback to cancel timers, abort fetch requests, or release resources. Angular calls ' +
        'the cleanup function before the next effect execution and when the effect is destroyed — ' +
        'ensuring no stale side effects linger.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'Automated responses are active. Here is how effects bridge signals with imperative side effects.',
      conceptTitle: 'Signal Effects — Reactive Side Effects with effect()',
      conceptBody:
        'effect() runs imperative code whenever its signal dependencies change. Effects are the escape ' +
        'hatch for side effects that cannot be modeled as derived state — logging, DOM manipulation, ' +
        'browser API calls. Create effects in an injection context (constructor or with an injector). ' +
        'Use onCleanup to cancel pending work when the effect re-runs or is destroyed.',
      keyPoints: [
        'effect() runs a callback when signal dependencies change — ideal for side effects',
        'Effects must be created in an injection context (constructor or via injector option)',
        'onCleanup registers teardown logic to cancel timers, subscriptions, or requests',
        'Prefer computed() or linkedSignal() for derived state — use effect() only for side effects',
      ],
    },
  ],
  completionCriteria: {
    description: 'Automated responses active!',
    minStepsViewed: 4,
  },
};
