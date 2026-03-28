import type { StoryMissionContent, CodeChallengeStep } from '../../../core/curriculum';

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
    {
      stepType: 'code-challenge',
      prompt:
        'The station needs automated logging when radiation levels change. Create an effect that logs ' +
        'a warning when the radiation signal exceeds a threshold.',
      starterCode: [
        "import { Component, signal } from '@angular/core';",
        '',
        '// TODO: Import the side-effect runner from Angular core',
        '',
        '@Component({',
        "  selector: 'app-radiation-monitor',",
        '  template: `',
        '    <p>Radiation: {{ radiation() }} mSv</p>',
        '    <button (click)="increase()">+50 mSv</button>',
        '  `,',
        '})',
        'export class RadiationMonitorComponent {',
        '  radiation = signal(100);',
        '',
        '  constructor() {',
        '    // TODO: Register a reactive callback that runs when radiation changes',
        '    // Log a warning with console.warn when radiation() > 500',
        '  }',
        '',
        '  increase() {',
        '    this.radiation.update(r => r + 50);',
        '  }',
        '}',
      ].join('\n'),
      language: 'typescript',
      validationRules: [
        {
          type: 'contains',
          value: 'effect(',
          errorMessage: 'Use effect() to register a reactive side-effect callback',
        },
        {
          type: 'pattern',
          pattern: 'effect\\(\\(\\)',
          errorMessage: 'Call effect() with an arrow function parameter',
        },
        {
          type: 'contains',
          value: 'this.radiation()',
          errorMessage: 'Read the radiation signal inside the effect to establish a dependency',
        },
        {
          type: 'contains',
          value: 'console.warn(',
          errorMessage: 'Use console.warn() to log the radiation warning',
        },
      ],
      hints: [
        "Import effect from '@angular/core' and call effect(() => { ... }) in the constructor",
        'Inside the effect, read this.radiation() and use console.warn() when the value exceeds 500',
      ],
      successMessage: 'Radiation monitor active! The effect logs warnings when levels spike.',
      explanation:
        'effect() registers a callback that runs whenever its signal dependencies change. It must be ' +
        'created in an injection context like a constructor. Use effects for side effects like logging.',
    } satisfies CodeChallengeStep,
    {
      stepType: 'code-challenge',
      prompt:
        'The station beacon needs a timer that adjusts when the broadcast interval changes. Create an ' +
        'effect that sets up a timer and cleans it up when the interval signal changes.',
      starterCode: [
        "import { Component, signal, effect } from '@angular/core';",
        '',
        '@Component({',
        "  selector: 'app-station-beacon',",
        '  template: `',
        '    <p>Broadcast every {{ intervalMs() }}ms</p>',
        '  `,',
        '})',
        'export class StationBeaconComponent {',
        '  intervalMs = signal(3000);',
        '',
        '  constructor() {',
        '    effect(() => {',
        '      const ms = this.intervalMs();',
        '      const timer = setInterval(() => {',
        "        console.log('Beacon pulse');",
        '      }, ms);',
        '',
        '      // TODO: Register teardown logic to clear the timer',
        '      // before the next run or when the component is destroyed',
        '    });',
        '  }',
        '}',
      ].join('\n'),
      language: 'typescript',
      validationRules: [
        {
          type: 'contains',
          value: 'onCleanup',
          errorMessage: 'Use the onCleanup parameter to register teardown logic',
        },
        {
          type: 'pattern',
          pattern: 'effect\\(\\(onCleanup\\)\\s*=>',
          errorMessage: 'Accept onCleanup as the first parameter of the effect callback (full signature with arrow)',
        },
        {
          type: 'contains',
          value: 'clearInterval(timer)',
          errorMessage: 'Clear the interval timer inside the cleanup callback',
        },
        {
          type: 'pattern',
          pattern: 'onCleanup\\(\\(\\)\\s*=>\\s*\\{?',
          errorMessage: 'Call onCleanup with an arrow function',
        },
      ],
      hints: [
        'Change effect(() => { to effect((onCleanup) => { to receive the cleanup function',
        'Call onCleanup(() => { clearInterval(timer); }) to register teardown logic',
      ],
      successMessage: 'Beacon timer managed! The cleanup prevents stale timers on re-run.',
      explanation:
        'The onCleanup function is passed as the first parameter to the effect callback. Register a ' +
        'cleanup function to cancel timers or release resources before the next execution.',
    } satisfies CodeChallengeStep,
  ],
  completionCriteria: {
    description: 'Automated responses active!',
    minStepsViewed: 6,
  },
};
