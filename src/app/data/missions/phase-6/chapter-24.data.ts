import type { StoryMissionContent } from '../../../core/curriculum';

export const CHAPTER_24_CONTENT: StoryMissionContent = {
  chapterId: 24,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'Raw sensor signals are streaming in, but the crew needs derived readings — averages, threshold ' +
        'alerts, and status summaries that combine multiple data sources. Recomputing these manually every ' +
        'time a source signal changes would be error-prone and wasteful. Angular\'s computed() function ' +
        'creates read-only signals that automatically derive their value from other signals, recalculating ' +
        'only when dependencies actually change.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Use computed() to derive a single value from one signal source. The computed signal recalculates ' +
        'only when the source signal changes, and the result is memoized until then.',
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
        'computed() accepts a derivation function that reads one or more signals. Angular tracks which ' +
        'signals are read during the derivation and re-evaluates the computed signal only when those ' +
        'dependencies change. The result is cached (memoized) — reading pressureStatus() multiple times ' +
        'without a pressure change returns the cached value without re-running the derivation.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Computed signals can depend on multiple source signals. Dependencies are tracked dynamically — ' +
        'only signals actually read during the most recent evaluation are tracked.',
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
        'This computed signal reads temperature, humidity, and showDetailed. When showDetailed is false, ' +
        'the derivation takes the branch that only uses humidity — so changes to temperature alone do ' +
        'not trigger a recomputation. Angular tracks dependencies dynamically based on which signals were ' +
        'actually read in the most recent execution.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'Derived readings are online. Here is how computed signals create efficient derived state.',
      conceptTitle: 'Computed Signals — Derived, Lazy, and Memoized',
      conceptBody:
        'computed() creates a read-only signal whose value is derived from other signals. The derivation ' +
        'function runs lazily (only when the computed signal is read) and is memoized (cached until a ' +
        'dependency changes). Dependencies are tracked dynamically — only signals read during the most ' +
        'recent evaluation are considered dependencies.',
      keyPoints: [
        'computed() derives a read-only signal from one or more source signals',
        'Values are lazily evaluated — the derivation runs only when the signal is read',
        'Results are memoized — repeated reads return the cached value without re-running',
        'Dependencies are dynamic — only signals actually read in the latest run are tracked',
      ],
    },
  ],
  completionCriteria: {
    description: 'Computed readings operational!',
    minStepsViewed: 4,
  },
};
