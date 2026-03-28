import type { StoryMissionContent, CodeChallengeStep } from '../../../core/curriculum';

export const CHAPTER_08_CONTENT: StoryMissionContent = {
  chapterId: 8,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'Inputs send data DOWN from parent to child. But what about the other direction? When a sensor module ' +
        'detects a hull breach, it needs to tell its parent. When a crew member clicks "Emergency Shutdown," ' +
        'the button component needs to notify the dashboard. Outputs are how a child says "hey, something happened" ' +
        'to whatever component contains it.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'If inputs are like function parameters, outputs are like callbacks. The child declares "I can emit this ' +
        'kind of event," and the parent decides what to do when it fires. The child doesn\'t know or care what the ' +
        'parent does with the information — it just sends the signal.',
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
        'output<string>() creates a typed emitter. When the child calls this.distressSignal.emit(\'Hull breach...\'), ' +
        'that string travels up to the parent. The parent listens the same way it listens to DOM events — with ' +
        'parentheses: (distressSignal)="onDistress($event)". The $event here isn\'t a DOM event though; it\'s ' +
        'whatever value the child emitted.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Components can have multiple outputs for different situations. Sometimes you need to send data along ' +
        '(like a status report). Other times you just need to say "this happened" with no payload — that\'s ' +
        'what output<void>() is for.',
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
        'output<Status>() carries a typed payload — the parent gets a full status object. ' +
        'output<void>() carries nothing — it just says "the button was pressed." Think of it as the ' +
        'difference between a fire alarm that tells you which room vs. one that just screams.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'With inputs and outputs together, parent and child components have a complete communication channel. ' +
        'Data flows down through inputs, events bubble up through outputs.',
      conceptTitle: 'Output Properties with output()',
      conceptBody:
        'Outputs complete the parent-child communication picture. The parent sends data down via inputs; ' +
        'the child sends events up via outputs. The parent listens to outputs using the same parentheses syntax ' +
        'as DOM events, which is intentional — from the parent\'s perspective, a child output and a click event ' +
        'look and work identically.',
      keyPoints: [
        'output<T>() for events that carry data, output<void>() for "something happened" signals with no payload',
        'Parents listen with (outputName)="handler($event)" — same syntax as (click) or (keyup), because Angular treats them uniformly',
        'The older @Output() + EventEmitter pattern still works but output() is cleaner — one function call instead of a decorator plus a class instantiation',
      ],
    },
    {
      stepType: 'code-challenge',
      prompt:
        'The sensor module can detect problems, but it has no way to tell the dashboard. Give it an output ' +
        'called alertTriggered that emits a string message, and wire it up to the sendAlert() method.',
      starterCode: [
        "import { Component, output } from '@angular/core';",
        '',
        '@Component({',
        "  selector: 'app-alert-sensor',",
        '  template: `',
        '    <button (click)="sendAlert()">Send Alert</button>',
        '  `,',
        '})',
        'export class AlertSensorComponent {',
        "  // TODO: Declare 'alertTriggered' as a string typed emitter",
        '  // TODO: Write sendAlert() method that emits a message string',
        '}',
      ].join('\n'),
      language: 'typescript',
      validationRules: [
        {
          type: 'pattern',
          pattern: 'output<',
          errorMessage: 'Declare a typed output using output<T>()',
        },
        {
          type: 'contains',
          value: '.emit(',
          errorMessage: 'Call .emit() on your output to send data to the parent',
        },
        {
          type: 'pattern',
          pattern: 'alertTriggered\\s*=\\s*output',
          errorMessage: 'Declare the output using the variable name alertTriggered',
        },
        {
          type: 'notContains',
          value: '@Output',
          errorMessage: 'Use the modern output() function instead of the @Output() decorator',
        },
        {
          type: 'notContains',
          value: 'EventEmitter',
          errorMessage: 'Use output() instead of the older EventEmitter pattern',
        },
      ],
      hints: [
        'Declare it like this: alertTriggered = output<string>() — the generic tells Angular what type of data it carries',
        'Inside sendAlert(), call this.alertTriggered.emit(\'your message\') to fire the event up to the parent',
      ],
      successMessage:
        'Distress signals are transmitting. You now have full two-way communication between components: ' +
        'inputs carry data down, outputs carry events up. Next chapter takes a different turn — we\'ll look at ' +
        'how to avoid loading everything at once.',
      explanation:
        'output<string>() declares a typed emitter. Calling .emit(value) sends that value to the parent. ' +
        'The parent subscribes using (alertTriggered)="handler($event)", where $event is the emitted string. ' +
        'Same parentheses syntax as DOM events — Angular keeps it consistent.',
    } satisfies CodeChallengeStep,
  ],
  completionCriteria: {
    description: 'Distress signals are transmitting to parent modules!',
    minStepsViewed: 5,
  },
};
