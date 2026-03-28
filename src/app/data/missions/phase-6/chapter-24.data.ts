import type { StoryMissionContent, CodeChallengeStep } from '../../../core/curriculum';

export const CHAPTER_24_CONTENT: StoryMissionContent = {
  chapterId: 24,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'You have writable signals from Chapter 23. But what about values that DEPEND on other values? ' +
        'If temperature and pressure are signals, you might want a "status" that automatically says CRITICAL ' +
        'when either is out of range. You could wire that up manually — listen for changes, recompute, ' +
        'update a separate signal — but that\'s fragile and easy to get wrong. Computed signals handle ' +
        'this for you. Think of them like Excel formulas: =A1+B1 automatically updates when either input ' +
        'changes. You never manually recalculate.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'computed() takes a function that reads one or more signals and returns a derived value. Angular ' +
        'figures out the dependencies automatically — you don\'t declare them anywhere. And the result is ' +
        'cached. If pressure hasn\'t changed, reading pressureStatus() a hundred times costs basically nothing.',
      code: [
        "import { Component, signal, computed } from '@angular/core';",
        '',
        '@Component({',
        "  selector: 'app-pressure-monitor',",
        '  template: `',
        '    <p>Pressure: {{ pressure() }} kPa</p>',
        '    <p>Status: {{ pressureStatus() }}</p>',
        '  `,',
        '})',
        'export class PressureMonitorComponent {',
        '  pressure = signal(101.3);',
        '',
        '  pressureStatus = computed(() => {',
        '    const p = this.pressure();',
        "    if (p < 90) return 'CRITICAL';",
        "    if (p < 95) return 'WARNING';",
        "    return 'NOMINAL';",
        '  });',
        '}',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [1, 13, 14],
      explanation:
        'When you call computed(() => ...), Angular watches which signals get read inside the function. ' +
        'Here, it sees this.pressure() was called, so it knows pressureStatus depends on pressure. ' +
        'The derivation only re-runs when pressure actually changes. Between changes, pressureStatus() ' +
        'returns a cached value — no recomputation, no waste.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Here\'s where it gets interesting: dependencies are tracked dynamically, not statically. Angular ' +
        'doesn\'t scan your code — it watches what actually gets called at runtime. That means conditional ' +
        'branches can change which signals are dependencies.',
      code: [
        "import { Component, signal, computed } from '@angular/core';",
        '',
        '@Component({',
        "  selector: 'app-environment-summary',",
        '  template: `',
        '    <p>Environment: {{ environmentReport() }}</p>',
        '  `,',
        '})',
        'export class EnvironmentSummaryComponent {',
        '  temperature = signal(294.15);',
        '  humidity = signal(45);',
        '  showDetailed = signal(false);',
        '',
        '  environmentReport = computed(() => {',
        '    const temp = this.temperature();',
        '    const hum = this.humidity();',
        '    if (this.showDetailed()) {',
        '      return `${temp.toFixed(1)}K / ${hum}% RH`;',
        '    }',
        "    return hum > 60 ? 'Humid' : 'Normal';",
        '  });',
        '}',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [1, 14, 15, 16, 17],
      explanation:
        'This computed reads temperature, humidity, and showDetailed on every evaluation. But here\'s the ' +
        'subtle part: when showDetailed is false, the returned value only depends on humidity. So if ' +
        'temperature changes but showDetailed is still false, does the computed re-run? Actually yes, ' +
        'because temperature() was still called. Angular tracks every signal that was read, regardless ' +
        'of which branch produced the return value. Keep that in mind when designing your derivations.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'Derived readings are online. Here\'s the mental model that will keep computed signals from ' +
        'ever confusing you.',
      conceptTitle: 'Computed Signals — Your Reactive Formulas',
      conceptBody:
        'computed() is the read-only counterpart to signal(). Where signal() holds state you set manually, ' +
        'computed() holds state that\'s calculated from other signals. It runs lazily — the derivation ' +
        'doesn\'t execute until someone actually reads the computed signal. And it\'s memoized — once ' +
        'computed, the result is cached until a dependency changes. You can\'t .set() a computed signal, ' +
        'and that\'s by design. If you need a derived value you can override, that\'s what linkedSignal ' +
        'is for (next chapter).',
      keyPoints: [
        'computed() is read-only on purpose — it represents a value that\'s always derivable from its inputs, never set manually',
        'Memoization means you can read a computed signal in ten different templates without running the derivation ten times',
        'Dependencies are tracked at runtime, so conditional logic can change which signals trigger re-evaluation',
        'If you find yourself calling .set() on something that should be derived, you probably want computed() instead',
      ],
    },
    {
      stepType: 'code-challenge',
      prompt:
        'The crew needs a combined environment status on the main dashboard. Wire up a computed signal ' +
        'that reads both temperature and pressure and returns CRITICAL if either is out of safe range, ' +
        'or NOMINAL if everything checks out.',
      starterCode: [
        "import { Component, signal } from '@angular/core';",
        '',
        '// TODO: Import the derivation function from Angular core',
        '',
        '@Component({',
        "  selector: 'app-environment-status',",
        '  template: `',
        '    <p>Temp: {{ temperature() }}K</p>',
        '    <p>Pressure: {{ pressure() }} kPa</p>',
        '    <p>Status: {{ status() }}</p>',
        '  `,',
        '})',
        'export class EnvironmentStatusComponent {',
        '  temperature = signal(294);',
        '  pressure = signal(101.3);',
        '',
        '  // TODO: Derive a read-only label from temperature and pressure',
        "  // Return 'CRITICAL' if temp > 350 or pressure < 90, else 'NOMINAL'",
        '}',
      ].join('\n'),
      language: 'typescript',
      validationRules: [
        {
          type: 'contains',
          value: 'computed(',
          errorMessage: 'Use computed() to create a derived read-only signal',
        },
        {
          type: 'pattern',
          pattern: 'computed\\(\\(\\)\\s*=>',
          errorMessage: 'Pass an arrow function to computed() to define the derivation',
        },
        {
          type: 'contains',
          value: 'this.temperature()',
          errorMessage: 'Read the temperature signal inside the derivation function',
        },
        {
          type: 'contains',
          value: "'CRITICAL'",
          errorMessage: 'Return \'CRITICAL\' when thresholds are exceeded',
        },
      ],
      hints: [
        'Add computed to your import: import { Component, signal, computed } from \'@angular/core\'',
        'Define status = computed(() => { ... }) — read this.temperature() and this.pressure() inside, and return \'CRITICAL\' or \'NOMINAL\' based on the thresholds',
      ],
      successMessage: 'Environment dashboard is live! The status updates the instant either signal moves. Next up: what if you need a derived value that users can override?',
      explanation:
        'computed() watches which signals you read inside the derivation function and automatically ' +
        're-evaluates when any of them change. You don\'t subscribe, you don\'t manage listeners — ' +
        'Angular handles the wiring. The result is always consistent with the current signal values.',
    } satisfies CodeChallengeStep,
  ],
  completionCriteria: {
    description: 'Computed readings operational!',
    minStepsViewed: 5,
  },
};
