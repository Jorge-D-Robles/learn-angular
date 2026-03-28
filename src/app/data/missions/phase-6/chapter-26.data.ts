import type { StoryMissionContent, CodeChallengeStep } from '../../../core/curriculum';

export const CHAPTER_26_CONTENT: StoryMissionContent = {
  chapterId: 26,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'Signals and computed handle state. But what about side effects — logging, API calls, ' +
        'starting timers, sending notifications? You can\'t model "write a log entry" as a derived ' +
        'value. There\'s no formula for it. Effects are like an alarm system wired to a sensor: the ' +
        'sensor detects a change, and the alarm responds by DOING something — ringing a bell, ' +
        'writing a record, triggering hardware. That\'s what effect() is for. It\'s the place where ' +
        'reactive state meets the outside world.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'effect() registers a callback that Angular runs whenever the signals inside it change. ' +
        'It runs once immediately (to establish dependencies), then re-runs each time those signals ' +
        'update. One important constraint: it must be created in an injection context, which usually ' +
        'means the constructor.',
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
        'When the component is created, the effect runs once and reads this.temperature(). Angular ' +
        'now knows: "this effect depends on temperature." Every time temperature changes, the ' +
        'effect re-runs. Notice this is fundamentally different from computed — there\'s no return ' +
        'value. The effect doesn\'t produce state. It performs an action. Logging, analytics, DOM ' +
        'manipulation, API calls — that\'s effect territory.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'What happens when an effect sets up a timer, and then the signal changes? The old timer ' +
        'is still running. Now you have two timers. Then three. That\'s a resource leak. ' +
        'onCleanup solves this — it lets you tear down the previous run\'s work before the next ' +
        'run starts.',
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
        'onCleanup is the first parameter of the effect callback. Register a teardown function ' +
        'inside it, and Angular will call it before the next effect execution AND when the ' +
        'component is destroyed. Without this, changing intervalMs would stack up timers ' +
        'indefinitely. This pattern applies to anything that allocates resources: timers, ' +
        'WebSocket connections, event listeners, fetch AbortControllers.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'Automated responses are active. Let\'s pin down exactly when to use effect versus ' +
        'the other signal primitives.',
      conceptTitle: 'When to Use effect() — and When Not To',
      conceptBody:
        'effect() is Angular\'s escape hatch for imperative code in a reactive world. The rule of thumb: ' +
        'if you\'re producing a value, use computed() or linkedSignal(). If you\'re producing a side ' +
        'effect — writing a log, calling an API, manipulating the DOM, starting a timer — use effect(). ' +
        'Overusing effects is one of the most common signal mistakes. If you catch yourself writing an ' +
        'effect that .set()s another signal, stop and ask: "Could this be a computed?" Usually the answer is yes.',
      keyPoints: [
        'effect() is for actions, not values — if your callback returns something meaningful, you probably want computed()',
        'onCleanup prevents resource leaks by tearing down the previous run before the next one starts',
        'Effects must live in an injection context (constructor) because Angular needs the injector to manage their lifecycle',
        'A signal set inside an effect is a code smell — rethink it as a computed or linkedSignal first',
      ],
    },
    {
      stepType: 'code-challenge',
      prompt:
        'Radiation levels are spiking and nobody\'s watching the console. Wire up an effect that ' +
        'monitors the radiation signal and fires console.warn when levels exceed 500 mSv.',
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
        'Import effect from \'@angular/core\' and call effect(() => { ... }) inside the constructor',
        'Read this.radiation() inside the effect to create the dependency, then conditionally call console.warn() when it exceeds 500',
      ],
      successMessage: 'Radiation monitor is live. The crew will never miss a spike again. One more challenge — let\'s handle cleanup.',
      explanation:
        'effect() watches which signals you read inside it, just like computed(). The difference: ' +
        'there\'s no return value. The effect exists purely to DO something — in this case, log a ' +
        'warning. Every time radiation changes, Angular re-runs the callback.',
    } satisfies CodeChallengeStep,
    {
      stepType: 'code-challenge',
      prompt:
        'The station beacon broadcasts on a timer, but the interval can change. The effect is already ' +
        'set up, but it\'s leaking timers — every time intervalMs changes, a new setInterval stacks ' +
        'on top of the old one. Add cleanup to fix it.',
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
        'Add onCleanup to the effect signature: effect((onCleanup) => { ... })',
        'Before the closing brace, call onCleanup(() => { clearInterval(timer); }) — Angular runs this before the next execution and on destroy',
      ],
      successMessage: 'No more leaked timers! You\'ve mastered all four signal primitives: signal, computed, linkedSignal, and effect. That\'s the reactive foundation for everything Angular builds going forward.',
      explanation:
        'Without onCleanup, every re-run would start a new setInterval while the old one kept ' +
        'firing. onCleanup tells Angular: "run this teardown before you execute the effect again, ' +
        'and when the component is destroyed." It\'s the same idea as returning a cleanup function ' +
        'from React\'s useEffect, if that helps.',
    } satisfies CodeChallengeStep,
  ],
  completionCriteria: {
    description: 'Automated responses active!',
    minStepsViewed: 6,
  },
};
