import type { StoryMissionContent } from '../../../core/curriculum';

export const CHAPTER_08_CONTENT: StoryMissionContent = {
  chapterId: 8,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'Modules can receive data from their parents, but they also need to send signals back. When a sensor ' +
        'detects a hull breach, the child module must alert its parent. The distress signal system enables ' +
        'child-to-parent communication through output properties.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Use the output() function to declare an event that a child can emit to its parent. Call .emit() ' +
        'to send data upward.',
      code: [
        "import { Component, output } from '@angular/core';",
        '',
        '@Component({',
        "  selector: 'app-sensor',",
        '  template: `',
        '    <button (click)="sendDistress()">Send Distress Signal</button>',
        '  `,',
        '})',
        'export class SensorComponent {',
        '  distressSignal = output<string>();',
        '',
        '  sendDistress() {',
        "    this.distressSignal.emit('Hull breach in Sector 7');",
        '  }',
        '}',
        '',
        '// Parent template:',
        '// <app-sensor (distressSignal)="onDistress($event)" />',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [1, 10, 13],
      explanation:
        'output<string>() creates a typed output. Calling this.distressSignal.emit(value) sends data to the ' +
        'parent. The parent listens with event binding: (distressSignal)="onDistress($event)". $event carries ' +
        'the emitted value.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'A single component can have multiple outputs for different events. Use void for outputs that signal ' +
        'an action without carrying data.',
      code: [
        "import { Component, output } from '@angular/core';",
        '',
        "interface Status { module: string; level: 'nominal' | 'warning' | 'critical'; }",
        '',
        '@Component({',
        "  selector: 'app-module-sensor',",
        '  template: `',
        '    <button (click)="reportStatus()">Report</button>',
        '    <button (click)="triggerShutdown()">Emergency Shutdown</button>',
        '  `,',
        '})',
        'export class ModuleSensorComponent {',
        '  statusChanged = output<Status>();',
        '  emergencyShutdown = output<void>();',
        '',
        '  reportStatus() {',
        "    this.statusChanged.emit({ module: 'Reactor', level: 'warning' });",
        '  }',
        '',
        '  triggerShutdown() {',
        '    this.emergencyShutdown.emit();',
        '  }',
        '}',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [13, 14],
      explanation:
        'output<Status>() emits a typed object. output<void>() emits with no data — useful for action signals ' +
        'like "shutdown requested." The parent handles each output independently with separate event bindings.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'Distress signals are transmitting from child modules to their parents. Combined with input properties, ' +
        'you now have full parent-child communication.',
      conceptTitle: 'Output Properties -- output()',
      conceptBody:
        'Signal-based outputs are the modern Angular way to emit events from child to parent. The output() ' +
        'function creates a typed emitter. Call .emit(value) to send data upward. Parents listen using event ' +
        'binding syntax: (outputName)="handler($event)".',
      keyPoints: [
        'output<T>() for typed data events, output<void>() for action-only signals',
        'Parents listen with (outputName)="handler($event)" — same syntax as DOM events',
        'Replaces the older @Output() + EventEmitter pattern — output() is simpler and type-safe',
      ],
    },
  ],
  completionCriteria: {
    description: 'Distress signals are transmitting to parent modules!',
    minStepsViewed: 4,
  },
};
